<template>
  <div id="app">
    <h1>n8n Workflow</h1>
    <WorkflowNode v-for="node in nodes" :key="node.id" :node="node" />
  </div>
</template>

<script>
import WorkflowNode from './components/WorkflowNode.vue';

export default {
  name: 'App',
  components: {
    WorkflowNode
  },
  data() {
    return {
      nodes: [
        {
          id: "6abe578b-d503-4da5-9af8-f9977de71139",
          name: "Vivid Pop Explosion",
          parameters: {
            assignments: {
              assignments: [
                {
                  id: "9ec60f33-b940-40a6-9f8a-cb944b7065f1",
                  name: "stylePrompt",
                  type: "string",
                  value: "=rule of thirds, golden ratio, hyper-maximalist, vibrant neon, high-contrast, octane render, photorealism, 8k ::7 --ar 16:9 --s 1000\n\nDesign a fun, energetic scene filled with bold, neon colors, and playful shapes that pop off the screen. The image should evoke a sense of joy and movement, using fluid, organic forms and exaggerated, cartoon-like proportions. Focus on creating a lively atmosphere with contrasting, saturated tones and dynamic lighting. Use a mix of asymmetrical and balanced compositions to create a playful visual flow. Render in 8K with a hyper-maximalist approach using Octane Render for vibrant, high-gloss textures and photorealistic lighting effects. Include:"
                }
              ]
            }
          }
        },
        {
          id: "7de1ea42-3b18-4bfb-8ea4-a8b6c8d16763",
          name: "AI Dystopia",
          parameters: {
            assignments: {
              assignments: [
                {
                  id: "9ec60f33-b940-40a6-9f8a-cb944b7065f1",
                  name: "stylePrompt",
                  type: "string",
                  value: "=golden ratio, rule of thirds, cyberpunk, glitch art, octane render, cinematic realism, 8k ::7 --ar 16:9 --s 1000\n\nGenerate a futuristic, cyberpunk dystopia with metallic textures, digital glitches, and neon lights. Blend cold, dystopian structures with traces of organic life. Use photorealistic lighting and dynamic reflections to enhance the visual depth of the scene. Include:"
                }
              ]
            }
          }
        },
        {
          id: "aa17c288-78e0-48d9-9c60-0e63e351d0b6",
          name: "Post-Analog Glitchscape",
          parameters: {
            assignments: {
              assignments: [
                {
                  id: "9ec60f33-b940-40a6-9f8a-cb944b7065f1",
                  name: "stylePrompt",
                  type: "string",
                  value: "=rule of thirds, asymmetric composition, glitch art, pixelation, VHS noise, octane render, unreal engine, 8k ::7 --ar 16:9 --s 1200\nDesign a glitchy, post-analog world with digital decay and broken visuals. Utilize pixelated elements, VHS noise, and neon glitches to create a fragmented aesthetic. Use bold, contrasting colors against muted backgrounds for a high-contrast, otherworldly feel. The composition should follow asymmetrical rules, focusing on chaotic yet intentional visual balance. Include:"
                }
              ]
            }
          }
        },
        {
          id: "769ff46c-630f-456d-ae19-4c6496270fda",
          name: "Neon Fauvism",
          parameters: {
            assignments: {
              assignments: [
                {
                  id: "9ec60f33-b940-40a6-9f8a-cb944b7065f1",
                  name: "stylePrompt",
                  type: "string",
                  value: "=asymmetric composition, golden ratio, neon colors, abstract forms, octane render, cinematic realism, unreal engine, 8k ::7 --ar 16:9 --s 1000\nCreate a bold, vivid composition using neon colors and fluid shapes that break away from reality. Focus on abstract forms, blending Fauvism's exaggerated color palette with modern digital art techniques. Use asymmetric composition and dynamic lighting. Render with a vibrant, high-energy aesthetic. Include:"
                }
              ]
            }
          }
        },
        {
          id: "400dcfaa-3061-4319-aa3e-5a89445bc26d",
          name: "Animoji",
          parameters: {
            assignments: {
              assignments: [
                {
                  id: "9ec60f33-b940-40a6-9f8a-cb944b7065f1",
                  name: "stylePrompt",
                  type: "string",
                  value: "=yellow disney cartoon cat (action), slightly side view (angle), very high angle (angle), in the style of simple 3d rendered characters, in the style of a video game, 4k, 3D render, 3D animation, white background, isolated"
                }
              ]
            }
          }
        }
      ]
    };
  }
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
