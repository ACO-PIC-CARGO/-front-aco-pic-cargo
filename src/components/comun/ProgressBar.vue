<script setup lang="ts">
import { computed } from "vue";
import runnerUrl from "@/assets/runner.webp";

defineProps<{ progress: number }>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const runnerImage = computed(() => {
  // Cambia la ruta de la imagen de acuerdo a tu estructura de carpetas
  return runnerUrl;
});
</script>

<template>
  <body>
    <div class="container">
      <div class="ring" />
      <div class="ring" />
      <div class="ring" />
      <div class="ring" />
      <span class="loading">Cargando {{ progress }} %</span>
    </div>
  </body>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  width: 100%;
  height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background: #011015; */
}

.container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background: #0110156c; */
}

.ring {
  width: 200px;
  height: 200px;
  border: 0px solid #011015;
  border-radius: 50%;
  position: absolute;
}

.ring:nth-child(1) {
  border-bottom-width: 8px;
  border-color: rgb(255, 0, 255);
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
  }
}

.ring:nth-child(2) {
  border-right-width: 8px;
  border-color: rgb(0, 247, 255);
  animation: rotate2 2s linear infinite;
}

@keyframes rotate2 {
  0% {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
  }
}

.ring:nth-child(3) {
  border-top-width: 8px;
  border-color: rgb(0, 255, 13);
  animation: rotate3 2s linear infinite;
}

@keyframes rotate3 {
  0% {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
  }
}

.loading {
  /* color: white; */
  color: black;
}
</style>
