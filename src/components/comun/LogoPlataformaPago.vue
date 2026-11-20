<script setup lang="ts">
// Distintivo de la plataforma del pago (cabecera del paso 7.3).
// Para usar los logos oficiales, reemplazar el contenido por <img> con los archivos de marca.
defineProps<{ plataforma: "Alibaba" | "Made in China" }>();
</script>

<template>
  <span
    class="lpp"
    :class="plataforma === 'Alibaba' ? 'lpp--alibaba' : 'lpp--mic'"
    :aria-label="plataforma"
  >
    <template v-if="plataforma === 'Alibaba'">
      <svg
        class="lpp__mark"
        viewBox="0 0 32 20"
        aria-hidden="true"
      >
        <path
          d="M3 14c4 5 14 3 22-5M9 6c-3 1-6 4-6 8"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
      <span class="lpp__text">Alibaba</span>
    </template>
    <template v-else>
      <svg
        class="lpp__mark"
        viewBox="0 0 26 20"
        aria-hidden="true"
      >
        <path
          d="M1 19 7 1h4l2 9 6-9h5l-5 18h-4l3-11-6 8h-3l-2-8-3 11z"
          fill="currentColor"
        />
      </svg>
      <span class="lpp__text">Made-in-China</span>
    </template>
  </span>
</template>

<style scoped>
.lpp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  white-space: nowrap;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
}
.lpp__mark {
  height: 18px;
  width: auto;
}
.lpp__text {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.lpp--alibaba {
  color: #ff6a00;
}
.lpp--mic .lpp__mark {
  color: #e1251b;
}
.lpp--mic .lpp__text {
  font-size: 13px;
  color: #1f2a44;
}
</style>
