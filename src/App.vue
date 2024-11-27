<template>
  <div class="app">
    <header class="header-container">
      <div class="login-button">
        <template v-if="authStore.isAuthenticated">
          <button @click="handleLogout" class="graffiti-button">
            <span class="button-text">Logout</span>
          </button>
        </template>
        <template v-else>
          <button @click="$router.push('/login')" class="graffiti-button">
            <span class="button-text">Login</span>
          </button>
        </template>
      </div>

      <div class="cyber-grid"></div>
      <div class="header-bg">
        <div class="glow-orb"></div>
        <div class="cyber-structure-left"></div>
        <div class="cyber-structure-right"></div>
      </div>
      
      <div class="header-content">
        <h1 class="header-title">Cali Imagine</h1>
        <p class="header-subtitle">Fuck n8n! No ads, no more time-out errors, no BS. Chi-made</p>
        <nav class="nav-container">
          <router-link to="/" class="nav-button">
            <span class="nav-text">ImageGen</span>
          </router-link>
          <router-link to="/gallery" class="nav-button">
            <span class="nav-text">Gen Gallery</span>
          </router-link>
        </nav>
      </div>
    </header>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './store/auth'

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  methods: {
    handleLogout() {
      this.authStore.clearAuth()
      this.$router.push('/login')
    }
  }
};
</script>

<style>
@font-face {
  font-family: 'Apocalypse';
  src: url('/fonts/Apocalypse.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

:root {
  --primary-color: #4a0082;
  --secondary-color: #380062;
  --background-dark: #1a0033;
  --background-light: #2d004d;
  --text-color: #fff;
  --accent-glow: #8a2be2;
  --grid-color: rgba(74, 0, 130, 0.2);
  --gold: #FFD700;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--background-dark) 0%, var(--background-light) 100%);
  min-height: 100vh;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
}

.header-container {
  position: relative;
  overflow: hidden;
  min-height: 80vh;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(45, 27, 59, 0.85),
    rgba(45, 27, 59, 0.95)
  );
}

.cyber-grid {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background-image: 
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 30px 30px;
  transform: perspective(500px) rotateX(60deg);
  transform-origin: bottom;
  animation: gridMove 20s linear infinite;
  opacity: 0.5;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glow-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  opacity: 0.3;
  filter: blur(30px);
  animation: pulse 4s ease-in-out infinite;
}

.cyber-structure-left,
.cyber-structure-right {
  position: absolute;
  width: 300px;
  height: 100%;
  background-image: linear-gradient(0deg, var(--grid-color) 1px, transparent 1px),
                    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.2;
  backdrop-filter: blur(5px);
}

.cyber-structure-left {
  left: 0;
  transform: skew(-15deg);
}

.cyber-structure-right {
  right: 0;
  transform: skew(15deg);
}

.header-content {
  position: relative;
  z-index: 2;
  text-align: center;
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 24px;
  background: rgba(26, 0, 51, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 0 32px rgba(138, 43, 226, 0.1);
}

.header-title {
  font-family: 'Apocalypse', sans-serif;
  font-size: 5.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  letter-spacing: 0.15em;
  transform: skew(-6deg);
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.9),
    rgba(138, 43, 226, 0.9)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: titlePulse 3s ease-in-out infinite alternate;
}

.header-subtitle {
  color: var(--text-color);
  font-size: 1.2rem;
  margin-bottom: 2.5rem;
  opacity: 0.9;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2.5rem;
}

.nav-button {
  font-family: 'Apocalypse', sans-serif;
  padding: 1.25rem 2.5rem;
  color: var(--text-color);
  text-decoration: none;
  border: none;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.15),
    rgba(255, 215, 0, 0.05)
  );
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 0 32px rgba(255, 215, 0, 0.1);
  backdrop-filter: blur(5px);
}

.nav-button::before {
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

.nav-button:hover {
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

.nav-button:hover::before {
  left: 100%;
}

.nav-text {
  font-family: 'Apocalypse', sans-serif;
  font-weight: 500;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 1.2rem;
  position: relative;
}

.login-button {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
}

.graffiti-button {
  padding: 1rem 2rem;
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
}

.graffiti-button::before {
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

.graffiti-button:hover {
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

.graffiti-button:hover::before {
  left: 100%;
}

.button-text {
  position: relative;
  z-index: 1;
}

main {
  max-width: 1400px;
  margin: -4rem auto 2rem;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

@keyframes gridMove {
  0% { background-position: 0 0; }
  100% { background-position: 0 30px; }
}

@keyframes pulse {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1); 
    opacity: 0.3; 
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.2); 
    opacity: 0.2; 
  }
}

@keyframes titlePulse {
  0% {
    filter: brightness(1);
  }
  100% {
    filter: brightness(1.2);
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 1.5rem;
  }

  .header-content {
    padding: 2rem;
  }
  
  .header-title {
    font-size: 3.5rem;
    margin-bottom: 1rem;
  }

  .header-subtitle {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
  
  .nav-container {
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .nav-button {
    width: 100%;
    padding: 1rem 2rem;
  }

  .login-button {
    top: 1rem;
    right: 1rem;
  }

  .graffiti-button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  main {
    margin-top: -2rem;
    padding: 0 1rem;
  }
}
</style>
