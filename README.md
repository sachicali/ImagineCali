# ImaGenCALI

A Vue.js application that generates AI images using the Hugging Face FLUX.1-dev model. This application provides various artistic style presets and allows users to generate unique images from text prompts.

## Features

- Text-to-image generation using FLUX.1-dev model
- Multiple artistic style presets:
  - Hyper-Surreal Escape
  - Neon Fauvism
  - Post-Analog Glitchscape
  - AI Dystopia
  - Vivid Pop Explosion
  - Animoji
- Real-time image generation
- Automatic image storage in Cloudflare R2 (S3-compatible storage)
- Error handling with automatic retries
- Modern, responsive UI

## Prerequisites

- Node.js (latest LTS version)
- Yarn package manager
- Hugging Face API key
- Cloudflare R2 credentials (or other S3-compatible storage)

## Environment Setup

Create a `.env` file in the root directory with:

```bash
HUGGINGFACE_API_KEY=your_api_key_here
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
```

## Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn serve

# Build for production
yarn build
```

## API Endpoints

The application requires a backend API endpoint for image uploads:

- `/api/upload`: Handles image upload to Cloudflare R2
  - Method: POST
  - Body: FormData with image file
  - Response: JSON with image URL

## Technology Stack

- Vue.js 3
- Hugging Face Inference API (FLUX.1-dev model)
- Cloudflare R2 Storage
- Yarn Package Manager

## Notes

- The FLUX.1-dev model may occasionally fail (~10% of the time). The application includes built-in error handling and retry logic.
- Generated images are stored with unique IDs to prevent overwrites.
- The application uses responsive design and works on both desktop and mobile devices.
