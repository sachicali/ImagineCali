<template>
  <div class="workflow-node">
    <h2>{{ node.name }}</h2>
    <p>{{ node.parameters.assignments.assignments[0].value }}</p>
  </div>
</template>

<script>
export default {
  name: 'WorkflowNode',
  props: {
    node: Object
  }
};
</script>

<style scoped>
.workflow-node {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
}
</style>
