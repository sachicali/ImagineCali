import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/upload-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/upload.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// File type validation
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 10 * 1024 * 1024, // Default 10MB
        files: 1
    },
    fileFilter
});

// Configure S3 client
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true
});

// Validate image dimensions
async function validateImageDimensions(buffer) {
    try {
        const sharp = (await import('sharp')).default;
        const metadata = await sharp(buffer).metadata();
        
        const maxDimension = parseInt(process.env.MAX_IMAGE_DIMENSION) || 4096;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            throw new Error(`Image dimensions exceed maximum allowed (${maxDimension}px)`);
        }
        
        return metadata;
    } catch (error) {
        throw new Error(`Image validation failed: ${error.message}`);
    }
}

// Optimize image if needed
async function optimizeImage(buffer, metadata) {
    try {
        const sharp = (await import('sharp')).default;
        const maxSize = parseInt(process.env.MAX_OPTIMIZED_SIZE) || 1024;
        
        if (metadata.width > maxSize || metadata.height > maxSize) {
            return await sharp(buffer)
                .resize(maxSize, maxSize, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toBuffer();
        }
        
        return buffer;
    } catch (error) {
        logger.error('Image optimization failed:', error);
        return buffer; // Return original buffer if optimization fails
    }
}

export const uploadMiddleware = upload.single('imageData');

export default async function uploadHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const startTime = Date.now();
    const uploadId = uuidv4();

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Log upload attempt
        logger.info('Upload started', {
            uploadId,
            userId: req.user?.id,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        });

        const { prompt, style } = req.body;

        // Validate image dimensions and optimize if needed
        const metadata = await validateImageDimensions(req.file.buffer);
        const optimizedBuffer = await optimizeImage(req.file.buffer, metadata);
        
        // Generate unique filename
        const timestamp = Date.now();
        const uniqueId = uuidv4().split('-')[0];
        const extension = path.extname(req.file.originalname) || '.jpg';
        const filename = `fg-${timestamp}-${uniqueId}${extension}`;

        try {
            // Upload to R2
            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: filename,
                Body: optimizedBuffer,
                ContentType: req.file.mimetype,
                Metadata: {
                    userId: req.user?.id?.toString() || 'anonymous',
                    prompt: prompt || '',
                    style: style || '',
                    timestamp: timestamp.toString(),
                    uploadId,
                    originalName: req.file.originalname,
                    dimensions: `${metadata.width}x${metadata.height}`
                }
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            
            // Generate signed URL for viewing
            const getObjectParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: filename
            };
            
            const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), { 
                expiresIn: 3600 
            });

            // Log successful upload
            logger.info('Upload completed', {
                uploadId,
                duration: Date.now() - startTime,
                filename,
                size: optimizedBuffer.length
            });
            
            return res.json({
                message: 'Image uploaded successfully',
                url: signedUrl,
                filename,
                metadata: {
                    dimensions: `${metadata.width}x${metadata.height}`,
                    size: optimizedBuffer.length,
                    type: req.file.mimetype,
                    uploadId
                }
            });

        } catch (uploadError) {
            logger.error('R2 upload error:', {
                uploadId,
                error: uploadError,
                duration: Date.now() - startTime
            });
            return res.status(500).json({ error: 'Failed to upload to R2' });
        }
    } catch (error) {
        logger.error('Upload handler error:', {
            uploadId,
            error,
            duration: Date.now() - startTime
        });
        return res.status(500).json({ 
            error: 'Upload failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Export for testing
export const __test__ = {
    validateImageDimensions,
    optimizeImage,
    ALLOWED_MIME_TYPES
};
