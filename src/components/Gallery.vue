<!-- Gallery.vue -->
<template>
  <div class="gallery">
    <h2 class="gallery-title">PREVIOUS GENERATIONS</h2>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="status-message">Generating creative magic...</p>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="images.length === 0" class="empty-state">
      <p>Your creative journey begins here. Generate some images!</p>
    </div>

    <div v-else class="image-grid">
      <div v-for="image in images" :key="image.url" class="image-card">
        <div class="image-wrapper">
          <img :src="image.url" :alt="image.prompt || 'Generated image'" />
        </div>
        <div class="image-details">
          <p class="prompt">{{ image.prompt || 'Unnamed Creation' }}</p>
          <p class="style">Style: {{ image.style || 'CALI Magic' }}</p>
          <p class="timestamp">{{ formatDate(image.timestamp) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const images = ref([]);
const loading = ref(true);
const error = ref(null);

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const fetchGallery = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    console.log('Fetching gallery...');
    const response = await fetch('/api/gallery');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch gallery images');
    }
    
    images.value = data.images || [];
    
  } catch (err) {
    console.error('Gallery error:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGallery();
});
</script>

<style scoped>
.gallery {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 2rem;
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
  backdrop-filter: blur(20px);
}

.gallery-title {
  color: #FFFFFF;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.9),
    rgba(138, 43, 226, 0.9)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
  padding: 1rem;
}

.image-card {
  background: rgba(26, 0, 51, 0.95);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(138, 43, 226, 0.4);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.2),
    inset 0 0 32px rgba(138, 43, 226, 0.1);
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    inset 0 0 64px rgba(138, 43, 226, 0.15);
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  height: 350px;
}

.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover img {
  transform: scale(1.05);
}

.image-details {
  padding: 1.75rem;
  color: #FFFFFF;
  background: rgba(26, 0, 51, 0.98);
  border-top: 1px solid rgba(138, 43, 226, 0.4);
}

.prompt {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.4;
}

.style {
  color: rgba(255, 215, 0, 0.9);
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.timestamp {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.loading-container {
  text-align: center;
  padding: 4rem;
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error {
  color: #ff6b6b;
  margin: 2rem auto;
  padding: 1.75rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  max-width: 600px;
  text-align: center;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1);
}

.empty-state {
  text-align: center;
  color: #FFFFFF;
  padding: 3.5rem;
  background: rgba(26, 0, 51, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(138, 43, 226, 0.4);
  margin: 2rem auto;
  max-width: 600px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 0 32px rgba(138, 43, 226, 0.1);
  backdrop-filter: blur(20px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .gallery {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .gallery-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 0.5rem;
  }
  
  .image-wrapper {
    height: 300px;
  }
  
  .image-details {
    padding: 1.25rem;
  }
}
</style>
