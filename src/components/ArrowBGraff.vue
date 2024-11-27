<template>
  <div class="arrow-container">
    <img 
      src="../assets/ArrowB.svg"
      :width="width"
      :height="height"
      :style="{ transform: `rotate(${rotation}deg)` }"
      alt="Arrow graphic"
    />
  </div>
</template>

<script>
export default {
  name: 'ArrowBGraff',
  props: {
    width: {
      type: [Number, String],
      default: '100%',
      validator: value => {
        if (typeof value === 'number') return value > 0;
        return typeof value === 'string' && (value.endsWith('%') || value.endsWith('px'));
      }
    },
    height: {
      type: [Number, String],
      default: '100%',
      validator: value => {
        if (typeof value === 'number') return value > 0;
        return typeof value === 'string' && (value.endsWith('%') || value.endsWith('px'));
      }
    },
    rotation: {
      type: Number,
      default: 0,
      validator: value => typeof value === 'number' && value >= -360 && value <= 360
    }
  }
}
</script>

<style scoped>
.arrow-container {
  display: inline-block;
}

img {
  transition: transform 0.3s ease;
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
