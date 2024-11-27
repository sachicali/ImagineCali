import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import morgan from 'morgan';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import authRoutes from './auth.js';
import uploadHandler, { uploadMiddleware } from './upload.js';
import { verifyToken } from './auth.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Winston logger
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Security configurations
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: { error: 'Upload limit reached, please try again later.' }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(compression()); // Response compression
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_PAYLOAD_SIZE || '50mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api', limiter);

// Configure S3 client for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true
});

// Mount routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        env: process.env.NODE_ENV
    };
    try {
        res.json(healthcheck);
    } catch (error) {
        healthcheck.message = error;
        res.status(503).json(healthcheck);
    }
});

// Protected gallery endpoint
app.get('/api/gallery', verifyToken, async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME
        });
        
        const response = await s3Client.send(command);
        const objects = response.Contents || [];
        
        const gallery = await Promise.all(objects.map(async (object) => {
            const getCommand = new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: object.Key
            });
            
            const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
            return {
                key: object.Key,
                url,
                lastModified: object.LastModified,
                size: object.Size,
                metadata: object.Metadata || {}
            };
        }));
        
        res.json(gallery);
    } catch (error) {
        logger.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Protected upload endpoint with rate limiting
app.post('/api/upload', [verifyToken, uploadLimiter, uploadMiddleware], async (req, res) => {
    try {
        await uploadHandler(req, res);
    } catch (error) {
        logger.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'File upload error',
            details: err.message
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message
        });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(port, () => {
    logger.info(`Server running on port ${port} (${process.env.NODE_ENV})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;
