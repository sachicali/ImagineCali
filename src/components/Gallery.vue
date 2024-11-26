<!-- Gallery.vue -->
<template>
  <div class="gallery-container">
    <h2>Previous Generations</h2>
    <div class="loading" v-if="loading">Loading gallery...</div>
    <div class="message" v-if="message && !error">{{ message }}</div>
    <div class="error" v-if="error">{{ error }}</div>
    <div class="gallery-grid" v-if="!loading && !error && images.length > 0">
      <div v-for="image in images" :key="image.key" class="gallery-item">
        <img :src="image.url" :alt="image.key" @click="selectImage(image)" />
        <div class="image-info">
          <span class="timestamp">{{ formatDate(image.uploaded) }}</span>
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
const message = ref(null);

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const fetchGallery = async () => {
  try {
    loading.value = true;
    error.value = null;
    message.value = null;
    
    console.log('Fetching gallery...');
    const response = await fetch('/api/gallery');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch gallery images');
    }
    
    images.value = data.images || [];
    message.value = data.message;
    
  } catch (err) {
    console.error('Gallery error:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const selectImage = (image) => {
  // Open image in full size or implement other interaction
  window.open(image.url, '_blank');
};

onMounted(() => {
  fetchGallery();
});
</script>

<style scoped>
.gallery-container {
  padding: 2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.gallery-item {
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  cursor: pointer;
}

.image-info {
  padding: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.message, .error, .loading {
  text-align: center;
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 8px;
}

.message {
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.error {
  background-color: #fef2f2;
  color: #dc2626;
}

.loading {
  background-color: var(--color-background-soft);
  color: var(--color-text);
}
</style>
