<template>
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

    <!-- Loading indicator and status messages -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="status-message">{{ statusMessage }} ({{ elapsedTime }})</p>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="imageUrl" class="result">
      <img :src="imageUrl" alt="Generated image" />
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
        'Consulting the AI...',
        'Crafting your image...',
        'Adding artistic touches...',
        'Almost there...'
      ],
      statusIndex: 0
    };
  },
  methods: {
    async generateImage(retryCount = 0) {
      try {
        this.executionId = crypto.randomUUID();
        const fullPrompt = `Depict ${this.prompt}\n\nStyle: ${stylePresets[this.style]}`;
        console.log('Sending request with prompt:', fullPrompt);

        const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`
          },
          body: JSON.stringify({
            inputs: fullPrompt
          })
        });

        // Debug: Log response status
        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          throw new Error(`Failed to generate image: ${errorText}`);
        }

        // For successful responses, get the blob directly
        const imageBlob = await response.blob();
        return imageBlob;
      } catch (error) {
        throw error;
      }
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

      // Start elapsed time counter
      this.timeInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.generationStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }, 1000);

      // Update status message periodically
      this.statusInterval = setInterval(() => {
        this.statusIndex = (this.statusIndex + 1) % this.statusMessages.length;
        this.statusMessage = this.statusMessages[this.statusIndex];
      }, 3000);

      try {
        const imageBlob = await this.generateImage();
        this.imageUrl = URL.createObjectURL(imageBlob);
        this.statusMessage = 'Image generation complete!';
      } catch (err) {
        console.error('Error:', err);
        this.error = `Error: ${err.message}. Please try again.`;
      } finally {
        clearInterval(this.statusInterval);
        clearInterval(this.timeInterval);
        this.loading = false;
        
        // Clear success message after 2 seconds if no error
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
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}

select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
}

button {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: var(--error-color);
  margin-top: 1rem;
  padding: 1rem;
  background-color: #ffebee;
  border-radius: 4px;
}

.result {
  margin-top: 2rem;
}

.result img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-container {
  margin-top: 1.5rem;
  text-align: center;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.status-message {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
