import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error('WARNING: JWT secrets not properly configured in environment variables');
    process.exit(1);
}

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: { error: 'Too many login attempts. Please try again later.' }
});

// Input validation middleware
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
];

const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
        .withMessage('Password must contain at least one letter and one number'),
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Login endpoint
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token
        await storeRefreshToken(user.id, refreshToken);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log successful login
        console.log(`User logged in: ${user.email} at ${new Date().toISOString()}`);

        // Return user info and access token
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token: accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await createUser(email, hashedPassword);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        const user = await findUserByEmail(email);
        
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token
        await storeRefreshToken(user.id, refreshToken);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log registration
        console.log(`New user registered: ${user.email} at ${new Date().toISOString()}`);

        // Return user info and access token
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token: accessToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        // Check if token is in database and valid
        const isValid = await validateRefreshToken(decoded.id, refreshToken);
        if (!isValid) {
            throw new Error('Invalid refresh token');
        }

        // Get user
        const user = await findUserById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token in database
        await updateRefreshToken(user.id, refreshToken, tokens.refreshToken);

        // Set new refresh token in cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return new access token
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token: tokens.accessToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout endpoint
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // Remove refresh token from database
        await removeRefreshToken(req.user.id);

        // Clear refresh token cookie
        res.clearCookie('refreshToken');

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
    res.json({ valid: true });
});

// Token verification middleware
export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Helper functions
function generateTokens(user) {
    const accessToken = jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
}

async function storeRefreshToken(userId, token) {
    // Implementation depends on your database structure
    return db.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
        [userId, token]
    );
}

async function validateRefreshToken(userId, token) {
    // Implementation depends on your database structure
    const result = await db.query(
        'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND revoked = 0',
        [userId, token]
    );
    return result.length > 0;
}

async function updateRefreshToken(userId, oldToken, newToken) {
    // Implementation depends on your database structure
    return db.query(
        'UPDATE refresh_tokens SET token = ? WHERE user_id = ? AND token = ?',
        [newToken, userId, oldToken]
    );
}

async function removeRefreshToken(userId) {
    // Implementation depends on your database structure
    return db.query(
        'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?',
        [userId]
    );
}

export default router;
