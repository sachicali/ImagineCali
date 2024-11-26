import express from 'express';
import cors from 'cors';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') });

const app = express();

// Configure express and middleware
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Increase payload size limits for all parsers
app.use(express.json({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

app.use(express.raw({
  limit: '50mb'
}));

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

// Add a simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    r2Config: {
      accountId: process.env.R2_ACCOUNT_ID,
      bucketName: process.env.R2_BUCKET_NAME,
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    }
  });
});

// Test the connection on startup
const testConnection = async () => {
  try {
    console.log('R2 Configuration:');
    console.log('----------------');
    console.log('Account ID:', process.env.R2_ACCOUNT_ID);
    console.log('Bucket:', process.env.R2_BUCKET_NAME);
    console.log('Access Key Length:', process.env.R2_ACCESS_KEY_ID?.length);
    console.log('Secret Key Length:', process.env.R2_SECRET_ACCESS_KEY?.length);
    console.log('Endpoint:', `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    console.log('----------------');
    
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 1 // Just test with one key to verify access
    });
    
    console.log('Sending test ListObjectsV2Command...');
    const response = await s3Client.send(command);
    console.log('R2 connection test response:', {
      successful: true,
      bucketName: process.env.R2_BUCKET_NAME,
      isEmpty: !response.Contents || response.Contents.length === 0,
      objectCount: response.Contents?.length || 0
    });
  } catch (error) {
    console.error('R2 connection test failed:', {
      message: error.message,
      code: error.code,
      name: error.name,
      requestId: error.$metadata?.requestId,
      cfRay: error.$metadata?.cfRay,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });
  }
};

// Call test connection
testConnection();

app.get('/api/gallery', async (req, res) => {
  try {
    console.log('Fetching gallery images from R2...');
    console.log('Current R2 Configuration:');
    console.log('------------------------');
    console.log('Account ID:', process.env.R2_ACCOUNT_ID);
    console.log('Bucket:', process.env.R2_BUCKET_NAME);
    console.log('Access Key ID:', process.env.R2_ACCESS_KEY_ID?.substring(0, 5) + '...');
    console.log('Secret Key:', process.env.R2_SECRET_ACCESS_KEY?.substring(0, 5) + '...');
    console.log('------------------------');
    
    // Create a new client for this request to ensure we have fresh configuration
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true
    });

    console.log('Endpoint:', client.config.endpoint);
    
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME
    });

    console.log('Sending ListObjectsV2Command...');
    const response = await client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('No images found in bucket');
      return res.json({ 
        images: [],
        message: 'No images found in gallery. Generate some images first!'
      });
    }

    console.log(`Found ${response.Contents.length} images, generating signed URLs...`);

    // Generate signed URLs for each image
    const images = await Promise.all(
      response.Contents.map(async (object) => {
        try {
          const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: object.Key,
          });
          const url = await getSignedUrl(client, getObjectCommand, { expiresIn: 3600 });
          return {
            key: object.Key,
            url,
            uploaded: object.LastModified
          };
        } catch (error) {
          console.error(`Error generating signed URL for ${object.Key}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed URLs
    const validImages = images.filter(img => img !== null);
    
    console.log(`Successfully generated ${validImages.length} signed URLs`);
    return res.json({ 
      images: validImages,
      message: validImages.length === 0 ? 'No accessible images found' : undefined
    });

  } catch (error) {
    console.error('Gallery fetch error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });

    // Handle specific error cases
    if (error.name === 'NoSuchBucket') {
      return res.status(500).json({ 
        error: 'Gallery is not yet set up. Please check your R2 bucket configuration.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch gallery images. Please try again later.' 
    });
  }
});

// HuggingFace API proxy endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const fullPrompt = `Depict ${prompt}\n\nStyle: ${style}`;
    
    console.log('Sending request to HuggingFace API with prompt:', fullPrompt);
    
    const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          num_inference_steps: 50,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('HuggingFace API error:', error);
      return res.status(response.status).json(error);
    }

    const imageBlob = await response.blob();
    const buffer = await imageBlob.arrayBuffer();
    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image to R2
app.post('/api/upload', async (req, res) => {
  try {
    const { imageData, prompt, style } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Generate a unique filename
    const timestamp = new Date().toISOString();
    const key = `${timestamp}-${prompt.substring(0, 30)}.png`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(imageData),
      ContentType: 'image/png',
      Metadata: {
        prompt,
        style,
        timestamp
      }
    });

    await s3Client.send(command);

    // Generate a signed URL for immediate access
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    res.status(200).json({ 
      success: true, 
      key,
      url,
      message: 'Image saved to gallery'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:');
  console.log('- R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? '✓' : '✗');
  console.log('- R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✓' : '✗');
  console.log('- R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✓' : '✗');
  console.log('- R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? '✓' : '✗');
});
