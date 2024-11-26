<template>
  <div>
    <form @submit.prevent="submitPrompt">
      <label for="prompt">Enter your prompt:</label>
      <input type="text" v-model="prompt" id="prompt" required />

      <label for="style">Choose a style:</label>
      <select v-model="style" id="style" required>
        <option value="VividPopExplosion">Vivid Pop Explosion</option>
        <option value="AIDystopia">AI Dystopia</option>
        <option value="PostAnalogGlitchscape">Post-Analog Glitchscape</option>
        <option value="Animoji">Animoji</option>
        <option value="NeonFauvism">Neon Fauvism</option>
      </select>

      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
import dotenv from 'dotenv';

dotenv.config();

export default {
  data() {
    return {
      prompt: '',
      style: 'VividPopExplosion'
    };
  },
  methods: {
    async submitPrompt() {
      const response = await fetch('https://api-inference.huggingface.co/models/YOUR_MODEL_NAME', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            text: this.prompt,
            style: this.style
          }
        })
      });
      const result = await response.json();
      console.log(result);
    }
  }
};
</script>

<style scoped>
/* Add styles here */
</style>
