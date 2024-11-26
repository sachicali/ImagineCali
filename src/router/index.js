import { createRouter, createWebHistory } from 'vue-router'
import PromptForm from '../components/PromptForm.vue'
import Gallery from '../components/Gallery.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: PromptForm
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
