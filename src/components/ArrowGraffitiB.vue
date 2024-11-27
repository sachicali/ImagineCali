<template>
  <div class="graffiti-arrow">
    <svg 
      version="1.1" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlns:xlink="http://www.w3.org/1999/xlink" 
      width="100%" 
      height="100%"
      viewBox="0 0 100 50"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter :id="sprayPaintId" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
          <feGaussianBlur stdDeviation="1" result="blur"/>
          <feComposite operator="in" in2="SourceGraphic"/>
        </filter>
        <linearGradient :id="gradientId" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color: #FEFEFE; stop-opacity: 1" />
          <stop offset="50%" style="stop-color: #EAEAEA; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #FEFEFE; stop-opacity: 1" />
        </linearGradient>
      </defs>
      
      <!-- Main arrow body -->
      <path 
        class="path main-arrow"
        :fill="`url(#${gradientId})`"
        :filter="`url(#${sprayPaintId})`"
        d="M95,20 L30,20 L30,10 L5,25 L30,40 L30,30 L95,30 Z"
      />

      <!-- Drips -->
      <g class="drips" :filter="`url(#${sprayPaintId})`">
        <path 
          :fill="`url(#${gradientId})`"
          d="M80,30 c0,0 -2,5 0,8 c2,-3 0,-8 0,-8"
        />
        <path 
          :fill="`url(#${gradientId})`"
          d="M60,30 c0,0 -1.5,4 0,6 c1.5,-2 0,-6 0,-6"
        />
        <path 
          :fill="`url(#${gradientId})`"
          d="M40,30 c0,0 -2,6 0,9 c2,-3 0,-9 0,-9"
        />
      </g>
    </svg>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: "ArrowGraffitiB",
  setup() {
    const uniqueId = ref(Math.random().toString(36).substr(2, 9));
    const sprayPaintId = ref(`sprayPaintB-${uniqueId.value}`);
    const gradientId = ref(`gradientB-${uniqueId.value}`);

    return {
      sprayPaintId,
      gradientId
    };
  }
};
</script>

<style scoped>
.graffiti-arrow {
  position: relative;
  width: 200px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
}

svg {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

.path {
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.9;
}

.main-arrow {
  animation: drawPath 2s ease-out forwards;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
}

.drips {
  animation: drip 2.5s ease-in-out infinite alternate;
  transform-origin: top;
}

@keyframes drawPath {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drip {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(5px);
    opacity: 0.7;
  }
}
</style>
