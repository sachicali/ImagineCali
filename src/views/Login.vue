<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">Login</h2>
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <input 
            type="email" 
            v-model="email" 
            placeholder="Email"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Password"
            required
            class="form-input"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="login-submit" :disabled="loading">
          <span class="button-text">{{ loading ? 'Authenticating...' : 'Enter' }}</span>
          <div v-if="loading" class="loading-spinner"></div>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth'

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return {
      email: '',
      password: '',
      error: null,
      loading: false
    }
  },
  methods: {
    async handleSubmit() {
      this.error = null;
      this.loading = true;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store auth data using Pinia store
        this.authStore.setAuth(data.user, data.token);

        // Redirect to home page
        this.$router.push('/');
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    rgba(45, 27, 59, 0.85),
    rgba(45, 27, 59, 0.95)
  );
}

.login-box {
  background: rgba(26, 0, 51, 0.95);
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 24px;
  padding: 3.5rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 0 32px rgba(138, 43, 226, 0.1);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-box:hover {
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    inset 0 0 64px rgba(138, 43, 226, 0.15);
  transform: translateY(-2px);
}

.login-box::before {
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

.login-title {
  font-family: 'Apocalypse', sans-serif;
  color: #FFFFFF;
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
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

.login-form {
  position: relative;
  z-index: 1;
}

.form-group {
  margin-bottom: 2rem;
  position: relative;
}

.form-input {
  width: 100%;
  padding: 1.25rem;
  background: rgba(45, 27, 59, 0.1);
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  font-family: system-ui, -apple-system, sans-serif;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input:focus {
  outline: none;
  background: rgba(45, 27, 59, 0.2);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    0 0 32px rgba(255, 215, 0, 0.1);
}

.error-message {
  color: #ff6b6b;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
  backdrop-filter: blur(5px);
}

.login-submit {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.15),
    rgba(255, 215, 0, 0.05)
  );
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-family: 'Apocalypse', sans-serif;
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
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.login-submit::before {
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

.login-submit:hover {
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

.login-submit:hover::before {
  left: 100%;
}

.login-submit:active {
  transform: translateY(0) scale(0.99);
}

.login-submit:disabled {
  background: rgba(45, 27, 59, 0.3);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 215, 0, 0.1);
  border-top: 3px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .login-container {
    padding: 1.5rem;
  }

  .login-box {
    padding: 2.5rem;
  }

  .login-title {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }

  .form-input {
    padding: 1rem;
  }

  .login-submit {
    padding: 1rem;
  }
}
</style>
