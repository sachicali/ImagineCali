import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { verifyToken } from './api/auth.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_PAYLOAD_SIZE) || 10 * 1024 * 1024 // Default 10MB
    }
});

// Logging setup
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }
);

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(compression()); // Response compression
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_PAYLOAD_SIZE || '50mb' }));
app.use(morgan('combined', { stream: accessLogStream }));
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        env: process.env.NODE_ENV,
        r2Config: {
            accountId: process.env.R2_ACCOUNT_ID,
            bucketName: process.env.R2_BUCKET_NAME,
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        }
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
        console.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Protected upload endpoint
app.post('/api/upload', verifyToken, upload.single('imageData'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { prompt, style } = req.body;
        const userId = req.user.id; // From verifyToken middleware
        
        const timestamp = Date.now();
        const filename = `fg-${userId}-${timestamp}.jpg`;
        
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
            Body: req.file.buffer,
            ContentType: 'image/jpeg',
            Metadata: {
                userId: userId.toString(),
                prompt: prompt || '',
                style: style || '',
                timestamp: timestamp.toString()
            }
        });
        
        await s3Client.send(command);
        
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename
        });
        
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        
        res.json({
            success: true,
            filename,
            url,
            metadata: {
                userId,
                prompt,
                style,
                timestamp
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString(),
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
    console.log(`Server running on port ${port} (${process.env.NODE_ENV})`);
    console.log('Configuration:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- CLIENT_URL:', process.env.CLIENT_URL);
    console.log('- R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? '✓' : '✗');
    console.log('- R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✓' : '✗');
    console.log('- R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✓' : '✗');
    console.log('- R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? '✓' : '✗');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
