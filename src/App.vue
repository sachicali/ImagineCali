<template>
  <div class="app">
    <header>
      <h1>CALI Imagine</h1>
      <p>No ads, no more time-out errors, no BS. Chi-made</p>
      <nav>
        <router-link to="/" class="nav-button">Home</router-link>
        <router-link to="/gallery" class="nav-button">Previous Gen</router-link>
      </nav>
    </header>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router'
import PromptForm from './components/PromptForm.vue';

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    PromptForm
  }
};
</script>

<style>
:root {
  --primary-color: #4CAF50;
  --error-color: #c62828;
  --text-color: #333;
  --background-color: #f5f5f5;
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
  background-color: var(--background-color);
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.nav-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #45a049;
}

.router-link-active {
  background-color: #45a049;
}
</style>
