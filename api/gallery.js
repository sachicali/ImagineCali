import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.VITE_R2_BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return res.status(200).json({ 
        images: [],
        message: 'No images found' 
      });
    }

    const images = response.Contents.map(item => ({
      key: item.Key,
      url: `https://${process.env.VITE_R2_BUCKET_NAME}.${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${item.Key}`,
      uploaded: item.LastModified,
    })).sort((a, b) => b.uploaded - a.uploaded);

    return res.status(200).json({ images });
  } catch (error) {
    console.error('Gallery error:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
}
