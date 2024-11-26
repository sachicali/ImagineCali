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
        // Add the nodes data here
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
