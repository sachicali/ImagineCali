import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export default async function uploadHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, prompt, style } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${style}.png`;

    try {
      // Convert base64 to buffer in chunks to handle large files
      let buffer;
      try {
        buffer = Buffer.from(imageData, 'base64');
      } catch (bufferError) {
        console.error('Buffer conversion error:', bufferError);
        return res.status(400).json({ error: 'Invalid image data' });
      }

      // Upload to R2
      const uploadParams = {
        Bucket: process.env.VITE_R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: 'image/png',
        Metadata: {
          prompt: prompt || '',
          style: style || '',
          timestamp: timestamp
        }
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Generate signed URL for viewing
      const getObjectParams = {
        Bucket: process.env.VITE_R2_BUCKET_NAME,
        Key: filename
      };
      
      const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), { 
        expiresIn: 3600 
      });
      
      return res.json({
        message: 'Image uploaded successfully',
        url: signedUrl,
        filename
      });

    } catch (uploadError) {
      console.error('R2 upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to R2: ' + uploadError.message });
    }
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
