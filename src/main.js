import { createApp } from 'vue';
import App from './App.vue';
import PromptForm from './components/PromptForm.vue';

const app = createApp(App);
app.component('PromptForm', PromptForm);
app.mount('#app');
