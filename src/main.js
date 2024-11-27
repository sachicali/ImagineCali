import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import global styles
import '../public/style.css'

const app = createApp(App)
const pinia = createPinia()

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
}

// Configure Vue options
app.config.performance = true
app.config.warnHandler = function(msg, vm, trace) {
  console.warn('Vue warning:', msg)
  console.warn('Trace:', trace)
}

// Use plugins
app.use(pinia)
app.use(router)

// Mount app
app.mount('#app')

// Log environment
console.log(`Running in ${import.meta.env.MODE} mode`)
