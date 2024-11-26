<template>
  <div class="app">
    <!-- Cyberpunk-style header -->
    <header class="header-container">
      <div class="cyber-grid"></div>
      <div class="header-bg">
        <div class="glow-orb"></div>
        <div class="cyber-structure-left"></div>
        <div class="cyber-structure-right"></div>
      </div>
      
      <div class="header-content">
        <h1 class="header-title">Cali Imagine</h1>
        <p class="header-subtitle">No ads, no more time-out errors, no BS. Chi-made</p>
        <nav class="nav-container">
          <router-link to="/" class="nav-button">
            <span class="nav-text">ImageGen</span>
          </router-link>
          <router-link to="/gallery" class="nav-button">
            <span class="nav-text">Previous Gen</span>
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

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView
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
  --primary-color: #6a0dad;  /* Royal Violet */
  --secondary-color: #800080;  /* Purple */
  --background-dark: #2a0033;  /* Deep Royal Purple */
  --background-light: #4a0080;  /* Rich Purple */
  --text-color: #fff;
  --accent-glow: #b088ff;  /* Light Purple Glow */
  --grid-color: rgba(106, 13, 173, 0.2);  /* Royal Violet Grid */
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
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
  opacity: 0.6;
  filter: blur(20px);
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
  opacity: 0.3;
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
  z-index: 10;
  text-align: center;
}

.header-title {
  font-family: 'Apocalypse', sans-serif;
  font-size: 5.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: var(--text-color);
  text-shadow: 0 0 20px var(--primary-color),
               0 0 40px var(--secondary-color);
  letter-spacing: 0.15em;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

.header-subtitle {
  color: var(--text-color);
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  text-shadow: 0 0 10px var(--primary-color);
}

.nav-container {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.nav-button {
  padding: 0.8rem 2rem;
  color: var(--text-color);
  text-decoration: none;
  border: 1px solid rgba(106, 13, 173, 0.3);
  border-radius: 4px;
  background: rgba(106, 13, 173, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
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
    rgba(106, 13, 173, 0.2),
    transparent
  );
  transition: 0.5s;
}

.nav-button:hover::before {
  left: 100%;
}

.nav-button:hover {
  background: rgba(106, 13, 173, 0.2);
  border-color: rgba(106, 13, 173, 0.5);
  box-shadow: 0 0 20px rgba(106, 13, 173, 0.3);
}

.nav-text {
  font-weight: 500;
  letter-spacing: 1px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 30px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.4;
  }
}

@keyframes titleGlow {
  from {
    text-shadow: 0 0 20px var(--primary-color),
                 0 0 40px var(--secondary-color);
  }
  to {
    text-shadow: 0 0 25px var(--primary-color),
                 0 0 50px var(--secondary-color);
  }
}

@media (max-width: 768px) {
  .header-title {
    font-size: 3.5rem;
  }
  
  .nav-container {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-button {
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
}
</style>
