<template>
  <div class="w-full relative">
    <div class="prompt-container">
      <div class="arrows-wrapper">
        <ArrowAGraff class="arrow-left" />
        <ArrowBGraff class="arrow-right" />
      </div>
      
      <div class="prompt-form">
        <GraffitiCrown class="crown-position" />
        
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
  </div>
</template>

<script>
import { ref } from 'vue';
import stylePresets from '../utils/stylePresets';
import GraffitiCrown from './GraffitiCrown.vue';
import ArrowAGraff from './ArrowAGraff.vue';
import ArrowBGraff from './ArrowBGraff.vue';

export default {
  name: 'PromptForm',
  components: {
    GraffitiCrown,
    ArrowAGraff,
    ArrowBGraff
  },
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
        'Man, I sure am overworked...',
        'Sacrificing goats to AI...',
        'Adding artistic touches...',
        'Chanting prayers to Chi...',
        'Are we there yet???',
        'Letting Jesus take the wheel...',
        'Almost there...',
        'Dude, just wait okay?',
        'Okay, okay, okay, okay...',
        'Hear me out... what if... I suddenly failed? AGAIN!?',
        'Inference Established..',
        'Converting binary data to image...',
        'Compressing image...',
        'Uploading to the Cloud...',
        'Sending it to the stars...',
        'I mean even data is binary',
        'So like wth humans doing with this non thingy...',
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
    }
  }
};
</script>

<style scoped>
.prompt-container {
  position: relative;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  place-items: center;
}

.prompt-form {
  max-width: 1000px;
  margin: -4rem auto 2rem;
  padding: 7rem;
  background: linear-gradient(
    135deg,
    rgba(45, 27, 59, 0.85),
    rgba(45, 27, 59, 0.95)
  );
  border-radius: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 0 32px rgba(138, 43, 226, 0.1);
  position: relative;
  z-index: 2;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prompt-form:hover {
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    inset 0 0 64px rgba(138, 43, 226, 0.15);
  transform: translateY(-2px);
}

.form-group {
  margin-bottom: 2.5rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 1rem;
  color: #FFFFFF;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

textarea {
  width: 100%;
  min-height: 140px;
  padding: 1.5rem;
  background: rgba(45, 27, 59, 0.1);
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  resize: vertical;
  color: #FFFFFF;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  font-family: system-ui, -apple-system, sans-serif;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

textarea:focus {
  outline: none;
  background: rgba(45, 27, 59, 0.2);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    0 0 32px rgba(255, 215, 0, 0.1);
}

select {
  width: 100%;
  padding: 1.5rem;
  background: rgba(45, 27, 59, 0.1);
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFD700' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.5rem center;
  background-size: 1.5em;
}

select:focus {
  outline: none;
  background: rgba(45, 27, 59, 0.2);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    0 0 32px rgba(255, 215, 0, 0.1);
}

button {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.15),
    rgba(255, 215, 0, 0.05)
  );
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 0 32px rgba(255, 215, 0, 0.1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
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
    rgba(255, 215, 0, 0.2),
    transparent
  );
  transition: 0.5s;
}

button:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    inset 0 0 48px rgba(255, 215, 0, 0.2);
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.2),
    rgba(255, 215, 0, 0.1)
  );
}

button:hover::before {
  left: 100%;
}

button:active {
  transform: translateY(0) scale(0.99);
}

button:disabled {
  background: rgba(45, 27, 59, 0.3);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 12px;
  color: #ff6b6b;
  font-size: 1rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1);
}

.result {
  margin-top: 3rem;
}

.result img {
  width: 100%;
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 215, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.result img:hover {
  transform: scale(1.02) translateY(-4px);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 215, 0, 0.2);
}

.loading-container {
  margin-top: 3rem;
  text-align: center;
}

.loading-spinner {
  display: inline-block;
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 215, 0, 0.1);
  border-top: 3px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

.status-message {
  color: #FFFFFF;
  font-size: 1rem;
  margin: 1.5rem 0;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.crown-position {
  position: absolute;
  top: -10.5rem;
  right: -6.5rem;
  transform: scale(0.7) rotate(25deg);
  z-index: 15;
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
}

.arrow-left {
  position: absolute;
  left: -15%;
  top: 55%;
  transform: translateY(-50%) rotate(130deg);
  z-index: -1;
  width: 1200px;
  height: 100px;
  pointer-events: none;
  /* Effects commented out for now
  filter: 
    drop-shadow(0 0 15px rgba(138, 43, 226, 0.4))
    drop-shadow(0 0 5px rgba(255, 215, 0, 0.2))
    brightness(1.1);
  */
}

.arrow-right {
  position: absolute;
  right: -20%;
  top: 50%;
  transform: translateY(-50%) rotate(390deg);
  z-index: -1;
  width: 400px;
  height: 100px;
  /* Effects commented out for now
  filter: 
    drop-shadow(0 0 15px rgba(138, 43, 226, 0.4))
    drop-shadow(0 0 5px rgba(255, 215, 0, 0.2))
    brightness(1.1);
  */
}
.prompt-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent,
    rgba(138, 43, 226, 0.5),
    transparent
  );
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 0.75rem;
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
  letter-spacing: 0.5px;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: system-ui, -apple-system, sans-serif;
  background: rgba(26, 0, 51, 0.95);
  color: #fff;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

textarea:focus {
  outline: none;
  border-color: rgba(138, 43, 226, 0.8);
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.3),
              inset 0 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(26, 0, 51, 0.98);
}

select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(26, 0, 51, 0.95);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

select:focus {
  outline: none;
  border-color: rgba(138, 43, 226, 0.8);
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.3),
              inset 0 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(26, 0, 51, 0.98);
}

button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, 
              rgba(74, 0, 130, 0.95), 
              rgba(56, 0, 98, 0.95));
  color: white;
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
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
    rgba(138, 43, 226, 0.3),
    transparent
  );
  transition: 0.5s;
}

button:hover::before {
  left: 100%;
}

button:hover {
  background: linear-gradient(135deg, 
              rgba(56, 0, 98, 0.98), 
              rgba(74, 0, 130, 0.98));
  border-color: rgba(138, 43, 226, 0.6);
  box-shadow: 0 4px 20px rgba(138, 43, 226, 0.4);
  transform: translateY(-1px);
}

button:disabled {
  background: rgba(26, 0, 51, 0.6);
  border-color: rgba(138, 43, 226, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  color: #ff6b6b;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.3);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
  border: 3px solid rgba(74, 0, 130, 0.2);
  border-top: 3px solid rgba(138, 43, 226, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.status-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  margin: 1rem 0;
  text-align: center;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .prompt-form {
    padding: 3rem;
  }
}
</style>

