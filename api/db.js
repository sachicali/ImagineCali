import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase, logAudit, cleanupOldRecords } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbInstance = null;
const DB_PATH = process.env.DB_PATH || '../data/imagencali.db';

// Initialize database connection
async function initializeDb() {
    try {
        const db = await open({
            filename: join(__dirname, DB_PATH),
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await db.exec('PRAGMA foreign_keys = ON');

        // Initialize database schema
        await initializeDatabase();

        // Start cleanup routine
        cleanupOldRecords(db);

        return db;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Get database instance
export async function getDb() {
    if (!dbInstance) {
        dbInstance = await initializeDb();
    }
    return dbInstance;
}

// Transaction wrapper
export async function withTransaction(callback) {
    const db = await getDb();
    try {
        await db.exec('BEGIN TRANSACTION');
        const result = await callback(db);
        await db.exec('COMMIT');
        return result;
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

// User related functions
export async function findUserByEmail(email) {
    const db = await getDb();
    return db.get(
        'SELECT id, email, password, role, status, created_at FROM users WHERE email = ?',
        [email]
    );
}

export async function findUserById(id) {
    const db = await getDb();
    return db.get(
        'SELECT id, email, role, status, created_at FROM users WHERE id = ?',
        [id]
    );
}

export async function createUser(email, password, role = 'user') {
    return withTransaction(async (db) => {
        try {
            const result = await db.run(
                `INSERT INTO users (email, password, role, status) 
                 VALUES (?, ?, ?, 'active')`,
                [email, password, role]
            );

            await logAudit(db, result.lastID, 'USER_CREATED', { email, role });
            return { success: true, userId: result.lastID };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                return { success: false, error: 'Email already exists' };
            }
            throw error;
        }
    });
}

export async function updateUserLastLogin(userId, ipAddress) {
    const db = await getDb();
    await db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
    );
    await logAudit(db, userId, 'USER_LOGIN', { ipAddress });
}

// Refresh token functions
export async function storeRefreshToken(userId, token, expiresAt) {
    return withTransaction(async (db) => {
        // Revoke all existing tokens for user
        await db.run(
            'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0',
            [userId]
        );

        // Store new token
        await db.run(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) 
             VALUES (?, ?, ?)`,
            [userId, token, expiresAt]
        );
    });
}

export async function validateRefreshToken(userId, token) {
    const db = await getDb();
    const result = await db.get(
        `SELECT * FROM refresh_tokens 
         WHERE user_id = ? AND token = ? AND revoked = 0 
         AND expires_at > CURRENT_TIMESTAMP`,
        [userId, token]
    );
    return !!result;
}

export async function revokeRefreshToken(userId, token) {
    const db = await getDb();
    await db.run(
        'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND token = ?',
        [userId, token]
    );
}

// Login attempts functions
export async function recordLoginAttempt(email, ipAddress, success) {
    const db = await getDb();
    await db.run(
        `INSERT INTO login_attempts (email, ip_address, success) 
         VALUES (?, ?, ?)`,
        [email, ipAddress, success ? 1 : 0]
    );
}

export async function getRecentLoginAttempts(email, minutes = 15) {
    const db = await getDb();
    return db.all(
        `SELECT * FROM login_attempts 
         WHERE email = ? AND attempt_time > datetime('now', '-' || ? || ' minutes')`,
        [email, minutes]
    );
}

// Audit log functions
export async function getAuditLogs(userId, limit = 100) {
    const db = await getDb();
    return db.all(
        `SELECT * FROM audit_log 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit]
    );
}

// Utility functions
export async function isEmailTaken(email) {
    const db = await getDb();
    const result = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE email = ?',
        [email]
    );
    return result.count > 0;
}

export async function getUserCount() {
    const db = await getDb();
    const result = await db.get('SELECT COUNT(*) as count FROM users');
    return result.count;
}

// Cleanup function
export async function cleanup() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}

// Error handling wrapper
function handleDbError(error) {
    console.error('Database error:', error);
    if (error.code === 'SQLITE_BUSY') {
        return { error: 'Database is busy, please try again' };
    }
    if (error.code === 'SQLITE_CONSTRAINT') {
        return { error: 'Constraint violation' };
    }
    return { error: 'Internal database error' };
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

export default {
    getDb,
    withTransaction,
    findUserByEmail,
    findUserById,
    createUser,
    updateUserLastLogin,
    storeRefreshToken,
    validateRefreshToken,
    revokeRefreshToken,
    recordLoginAttempt,
    getRecentLoginAttempts,
    getAuditLogs,
    isEmailTaken,
    getUserCount,
    cleanup
};
