<template>
  <div class="w-full">
    <div class="prompt-form">
      <form @submit.prevent="submitPrompt">
        <div class="form-group">
          <label for="prompt">Enter your prompt:</label>
          <textarea
            id="prompt"
            v-model="prompt"
            required
            placeholder="Describe what you want to generate..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="style">Select style:</label>
          <select id="style" v-model="style" required>
            <option value="hyper-surreal">Hyper-Surreal Escape</option>
            <option value="neon-fauvism">Neon Fauvism</option>
            <option value="glitchscape">Post-Analog Glitchscape</option>
            <option value="ai-dystopia">AI Dystopia</option>
            <option value="vivid-pop">Vivid Pop Explosion</option>
            <option value="animoji">Animoji</option>
          </select>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate Image' }}
        </button>
      </form>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="status-message">{{ statusMessage }} ({{ elapsedTime }})</p>
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="imageUrl" class="result">
        <img :src="imageUrl" alt="Generated image" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import stylePresets from '../utils/stylePresets';

export default {
  name: 'PromptForm',
  data() {
    return {
      prompt: '',
      style: 'hyper-surreal',
      imageUrl: null,
      error: null,
      loading: false,
      statusMessage: '',
      statusInterval: null,
      executionId: null,
      maxRetries: 3,
      retryDelay: 5000,
      generationStartTime: null,
      elapsedTime: '',
      timeInterval: null,
      statusMessages: [
        'Analyzing prompt...',
        'Conversing with Gods...',
        'Crafting your image...',
        'Sacrificing goats to AI...',
        'Adding artistic touches...',
        'Chanting prayers to Chi...',
        'Letting Jesus take the wheel...',
        'Almost there...',
        'Dude, just wait okay?'
      ],
      statusIndex: 0
    };
  },
  methods: {
    async generateImage(retryCount = 0, maxRetries = 3) {
      try {
        this.executionId = crypto.randomUUID();
        const fullPrompt = `Depict ${this.prompt}\n\nStyle: ${stylePresets[this.style]}`;
        console.log('Sending request with prompt:', fullPrompt);
        console.log('API Key available:', !!import.meta.env.VITE_HUGGINGFACE_API_KEY);
        console.log('API Key length:', import.meta.env.VITE_HUGGINGFACE_API_KEY?.length);

        const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            wait_for_model: true
          })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          
          try {
            const error = JSON.parse(errorText);
            
            if (error.error?.includes('Model too busy') && retryCount < maxRetries) {
              const waitTime = Math.min(2 ** retryCount * 1000, 10000);
              console.log(`Model busy, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
              this.statusMessage = `Model busy, retrying in ${waitTime/1000} seconds...`;
              
              await new Promise(resolve => setTimeout(resolve, waitTime));
              return this.generateImage(retryCount + 1, maxRetries);
            }
            
            throw new Error(`Failed to generate image: ${errorText}`);
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            throw new Error(`Failed to generate image: ${errorText}`);
          }
        }

        const imageBlob = await response.blob();
        return imageBlob;
      } catch (error) {
        throw error;
      }
    },
    async compressImage(imageBlob) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 1024;
          const maxHeight = 1024;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageBlob);
      });
    },
    async submitPrompt() {
      if (!this.prompt.trim()) {
        this.error = 'Please enter a prompt';
        return;
      }

      this.error = null;
      this.loading = true;
      this.imageUrl = null;
      this.statusMessage = 'Initializing image generation...';
      this.generationStartTime = Date.now();
      this.statusIndex = 0;

      this.timeInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.generationStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }, 1000);

      this.statusInterval = setInterval(() => {
        this.statusIndex = (this.statusIndex + 1) % this.statusMessages.length;
        this.statusMessage = this.statusMessages[this.statusIndex];
      }, 3000);

      try {
        const imageBlob = await this.generateImage();
        
        this.imageUrl = URL.createObjectURL(imageBlob);
        this.statusMessage = 'Image generated! Compressing...';

        const compressedBlob = await this.compressImage(imageBlob);
        this.statusMessage = 'Image compressed! Saving to gallery...';

        const reader = new FileReader();
        const imageBase64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });
        const imageData = await imageBase64Promise;

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData,
            prompt: this.prompt,
            style: this.style
          })
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to save image to gallery');
        }

        const uploadResult = await uploadResponse.json();
        this.statusMessage = 'Image saved to gallery!';
        
        if (uploadResult.url) {
          this.imageUrl = uploadResult.url;
        }
      } catch (err) {
        console.error('Error:', err);
        this.error = `Error: ${err.message}. Please try again.`;
      } finally {
        clearInterval(this.statusInterval);
        clearInterval(this.timeInterval);
        this.loading = false;
        
        if (!this.error) {
          setTimeout(() => {
            this.statusMessage = '';
            this.elapsedTime = '';
          }, 2000);
        }
      }
    },
  }
};
</script>

<style scoped>
.prompt-form {
  max-width: 800px;
  margin: -4rem auto 2rem;
  padding: 2rem;
  background: rgba(106, 13, 173, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.3);
  border: 1px solid rgba(106, 13, 173, 0.2);
  position: relative;
  z-index: 20;
  backdrop-filter: blur(10px);
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 0.75rem;
  color: #fff;
  font-weight: 500;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(106, 13, 173, 0.5);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 1px solid rgba(106, 13, 173, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: system-ui, -apple-system, sans-serif;
  background: rgba(42, 0, 51, 0.3);
  color: #fff;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

textarea:focus {
  outline: none;
  border-color: rgba(106, 13, 173, 0.6);
  box-shadow: 0 0 15px rgba(106, 13, 173, 0.2);
  background: rgba(42, 0, 51, 0.4);
}

select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(106, 13, 173, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(42, 0, 51, 0.3);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

select:focus {
  outline: none;
  border-color: rgba(106, 13, 173, 0.6);
  box-shadow: 0 0 15px rgba(106, 13, 173, 0.2);
  background: rgba(42, 0, 51, 0.4);
}

button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(106, 13, 173, 0.8), rgba(128, 0, 128, 0.8));
  color: white;
  border: 1px solid rgba(106, 13, 173, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-shadow: 0 0 10px rgba(106, 13, 173, 0.5);
  position: relative;
  overflow: hidden;
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(106, 13, 173, 0.2),
    transparent
  );
  transition: 0.5s;
}

button:hover::before {
  left: 100%;
}

button:hover {
  background: linear-gradient(135deg, rgba(128, 0, 128, 0.8), rgba(106, 13, 173, 0.8));
  border-color: rgba(106, 13, 173, 0.5);
  box-shadow: 0 0 20px rgba(106, 13, 173, 0.3);
  transform: translateY(-1px);
}

button:disabled {
  background: rgba(106, 13, 173, 0.1);
  border-color: rgba(106, 13, 173, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
}

.error {
  color: #ff6b6b;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  font-size: 0.95rem;
  backdrop-filter: blur(5px);
}

.result {
  margin-top: 2rem;
}

.result img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.3);
  transition: transform 0.3s ease;
}

.result img:hover {
  transform: scale(1.02);
}

.loading-container {
  margin-top: 2rem;
  text-align: center;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(106, 13, 173, 0.1);
  border-top: 3px solid rgba(106, 13, 173, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.status-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 1rem 0;
  text-align: center;
  text-shadow: 0 0 10px rgba(106, 13, 173, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
