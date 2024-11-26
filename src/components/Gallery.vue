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
        <img :src="image.url" :alt="image.prompt || 'Generated image'" />
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
  background-color: var(--background-dark);
}

.gallery-title {
  color: var(--primary-color);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
  padding: 1rem;
}

.image-card {
  background: var(--background-light);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(106, 13, 173, 0.2);
}

.image-card:hover {
  transform: scale(1.03);
}

.image-card img {
  width: 100%;
  height: 350px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.image-card:hover img {
  transform: scale(1.05);
}

.image-details {
  padding: 1.5rem;
  color: var(--text-color);
}

.prompt {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--secondary-color);
}

.style {
  color: var(--primary-color);
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timestamp {
  color: rgba(224, 224, 255, 0.7);
  font-size: 0.8rem;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 4px solid rgba(106, 13, 173, 0.2);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

.status-message {
  color: var(--text-color);
  font-size: 1rem;
}

.error {
  color: var(--secondary-color);
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: rgba(128, 0, 128, 0.1);
  border: 1px solid rgba(128, 0, 128, 0.3);
  border-radius: 12px;
  font-size: 1rem;
  max-width: 600px;
  text-align: center;
}

.empty-state {
  text-align: center;
  color: var(--text-color);
  padding: 3rem;
  background: var(--background-light);
  border-radius: 16px;
  border: 1px solid rgba(106, 13, 173, 0.2);
  margin: 2rem auto;
  max-width: 600px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .gallery {
    padding: 1rem;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}
</style>
