import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)
  const refreshTimer = ref(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  // Actions
  async function setAuth(userData, tokenValue) {
    try {
      user.value = userData
      token.value = tokenValue
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', tokenValue)
      
      // Set up token refresh
      setupTokenRefresh()
      error.value = null
    } catch (err) {
      console.error('Error setting auth:', err)
      error.value = 'Failed to set authentication'
    }
  }

  function clearAuth() {
    user.value = null
    token.value = null
    error.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    clearTokenRefresh()
  }

  async function verifyToken() {
    if (!token.value) return false

    try {
      loading.value = true
      error.value = null

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const data = await response.json()
      return data.valid
    } catch (err) {
      console.error('Token verification error:', err)
      error.value = 'Session verification failed'
      clearAuth()
      return false
    } finally {
      loading.value = false
    }
  }

  async function refreshToken() {
    if (!token.value) return

    try {
      loading.value = true
      error.value = null

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      await setAuth(data.user, data.token)
    } catch (err) {
      console.error('Token refresh error:', err)
      error.value = 'Session refresh failed'
      clearAuth()
    } finally {
      loading.value = false
    }
  }

  function setupTokenRefresh() {
    // Clear any existing timer
    clearTokenRefresh()
    
    // Set up new refresh timer (e.g., refresh 5 minutes before expiry)
    const REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes
    refreshTimer.value = setInterval(refreshToken, REFRESH_INTERVAL)
  }

  function clearTokenRefresh() {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  // Initialize auth from localStorage
  if (token.value) {
    verifyToken().catch(err => {
      console.error('Initial token verification failed:', err)
      clearAuth()
    })
  }

  // Cleanup on store disposal
  function cleanup() {
    clearTokenRefresh()
  }

  return {
    // State
    user,
    token,
    loading,
    error,

    // Computed
    isAuthenticated,
    isAdmin,
    isLoading,
    hasError,

    // Actions
    setAuth,
    clearAuth,
    verifyToken,
    refreshToken,
    cleanup
  }
})

// Add store reset functionality
export function resetAuthStore() {
  const store = useAuthStore()
  store.cleanup()
  store.$reset()
}
