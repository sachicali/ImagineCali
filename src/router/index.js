import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Components
import PromptForm from '../components/PromptForm.vue'
import Gallery from '../components/Gallery.vue'
import Login from '../views/Login.vue'

// Route configurations
const routes = [
  {
    path: '/',
    name: 'Home',
    component: PromptForm,
    meta: {
      title: 'Image Generator',
      requiresAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery,
    meta: {
      title: 'Generated Images',
      requiresAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login',
      requiresAuth: false,
      transition: 'fade'
    }
  },
  {
    // Catch all 404 route
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '404 Not Found',
      requiresAuth: false,
      transition: 'fade'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Set page title
  document.title = `${to.meta.title} | CALI Imagine`
  
  // Handle loading state
  authStore.loading = true

  try {
    // Check if route requires authentication
    if (to.meta.requiresAuth) {
      // Verify token if authenticated
      if (authStore.isAuthenticated) {
        const isValid = await authStore.verifyToken()
        if (!isValid) {
          // Token invalid, redirect to login
          return next({
            path: '/login',
            query: { redirect: to.fullPath }
          })
        }
      } else {
        // Not authenticated, redirect to login
        return next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    }

    // Handle authenticated users trying to access login page
    if (to.path === '/login' && authStore.isAuthenticated) {
      return next({ path: '/' })
    }

    // Proceed with navigation
    next()
  } catch (error) {
    console.error('Navigation error:', error)
    // Handle navigation error
    next({
      path: '/login',
      query: { 
        redirect: to.fullPath,
        error: 'navigation_failed'
      }
    })
  } finally {
    // Reset loading state
    authStore.loading = false
  }
})

// After navigation hooks
router.afterEach((to, from) => {
  // Track page views or perform analytics
  if (import.meta.env.PROD) {
    console.log(`Navigated from ${from.path} to ${to.path}`)
  }
})

// Error handling
router.onError((error) => {
  console.error('Router error:', error)
  // Handle route errors (e.g., chunk loading failures)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router
