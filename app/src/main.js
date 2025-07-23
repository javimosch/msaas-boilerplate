import { createApp } from 'vue';
import App from './App.vue';

// Debug log for application initialization
console.debug('Initializing Vue application');

// Create and mount the Vue instance
const app = createApp(App);
app.mount('#app');
