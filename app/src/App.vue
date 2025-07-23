<template>
  <div class="app">
    <h1>Rspack + Vue</h1>
    
    <div class="card">
      <p>This is a minimal Vue application bundled with Rspack</p>
      <p>Fast Rust-based web bundler with webpack-compatible API</p>
      <p>Today's date: <strong>{{ currentDate }}</strong></p>
    </div>
    
    <div class="card">
      <h2>Features</h2>
      <ul class="feature-list">
        <li>Vue with SFC support</li>
        <li>CSS processing</li>
        <li>Fast Rust-based bundling</li>
        <li>Hot Module Replacement</li>
        <li>Component modularization</li>
        <li>Environment variables</li>
        <li>Utility functions</li>
      </ul>
    </div>
    
    <div class="action-container">
      <div class="button-group">
        <my-button :variant="theme" @click="incrementCount">
          Regular Count: {{ count }}
        </my-button>
        
        <my-button :variant="theme === 'primary' ? 'secondary' : 'primary'" @click="debouncedIncrement">
          Debounced Count: {{ count }}
        </my-button>
      </div>
      
      <my-button variant="outline" @click="toggleTheme">
        Toggle Theme ({{ theme || 'primary' }})
      </my-button>
    </div>
    
    <p class="hint">
      Edit <code>src/App.vue</code> and save to test HMR
    </p>
  </div>
</template>

<script>
import MyButton from './components/MyButton.vue';
import { getFormattedDate, getEnvVar, debounce } from './utils/helpers';

export default {
  name: 'App',
  components: {
    MyButton
  },
  data() {
    return {
      count: 0,
      theme: 'primary',
      currentDate: getFormattedDate()
    };
  },
  created() {
    // Debug log for component creation lifecycle hook
    console.debug('App component created', { 
      count: this.count, 
      theme: this.theme, 
      currentDate: this.currentDate 
    });
    
    // Create debounced function
    this.debouncedIncrement = debounce(this.incrementCount, 300);
    
    // Get environment variable using utility function
    const apiUrl = getEnvVar('VUE_APP_API_URL', 'http://localhost:3001');
    console.debug('API URL from env', { apiUrl });
  },
  methods: {
    incrementCount() {
      this.count++;
      console.debug('Count incremented', { newCount: this.count });
    },
    toggleTheme() {
      const themes = {
        primary: 'secondary',
        secondary: 'outline',
        outline: 'primary'
      };
      
      // Use optional chaining to safely access theme
      this.theme = themes[this.theme] || 'primary';
      console.debug('Theme toggled', { newTheme: this.theme });
    }
  }
};
</script>

<style>
:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  display: flex;
  min-width: 320px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  padding: 2em;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

.feature-list {
  text-align: left;
  display: inline-block;
}

.action-container {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.hint {
  font-size: 0.9rem;
  color: #666;
}

code {
  background-color: #f1f1f1;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
}
</style>
