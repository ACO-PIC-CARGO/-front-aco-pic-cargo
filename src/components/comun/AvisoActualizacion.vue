<script setup lang="ts">
import { computed } from "vue";
import { applyUpdate, swUpdate } from "@/utils/swUpdate";

const props = defineProps<{
  // Plan B si no hay Service Worker en espera (p. ej. navegador sin SW).
  fallback?: () => void;
}>();

const visible = computed(() => swUpdate.fase !== "idle" && !swUpdate.oculto);
const descargando = computed(() => swUpdate.fase === "descargando");
const progreso = computed(() => (descargando.value ? swUpdate.progreso : 100));

const detalle = computed(() => {
  if (swUpdate.progreso >= 100) return "¡Descarga completa!";
  if (swUpdate.archivosTotales && swUpdate.archivosListos)
    return `Descargando archivos… ${swUpdate.archivosListos} de ${swUpdate.archivosTotales}`;
  return "Preparando la actualización…";
});

function actualizar() {
  if (!applyUpdate()) props.fallback?.();
}
</script>

<template>
  <Transition name="aviso">
    <aside
      v-if="visible"
      class="aviso-update"
      :class="{ 'aviso-update--lista': !descargando }"
      role="status"
      aria-live="polite"
    >
      <span
        class="aviso-update__corner"
        aria-hidden="true"
      />
      <v-btn
        v-if="swUpdate.fase === 'lista'"
        class="aviso-update__close"
        icon="mdi-close"
        size="small"
        variant="text"
        aria-label="Más tarde"
        title="Más tarde"
        @click="swUpdate.oculto = true"
      />

      <div class="aviso-update__icon">
        <v-icon size="34">
          mdi-tray-arrow-down
        </v-icon>
      </div>

      <h2 class="aviso-update__title">
        {{ descargando ? "DESCARGANDO" : "NUEVA VERSIÓN" }}
        <span class="aviso-update__accent">
          <span
            class="aviso-update__spark"
            aria-hidden="true"
          />
          {{ descargando ? "NUEVA VERSIÓN" : "DISPONIBLE" }}
          <span
            class="aviso-update__spark aviso-update__spark--end"
            aria-hidden="true"
          />
        </span>
      </h2>

      <template v-if="descargando">
        <p class="aviso-update__subtitle">
          Por favor, espera un momento…
        </p>

        <div
          class="ship-track"
          role="progressbar"
          aria-label="Descarga de la nueva versión"
          :aria-valuenow="progreso"
          aria-valuemin="0"
          aria-valuemax="100"
          :style="{ '--progreso': progreso / 100 }"
        >
          <div class="ship-track__rail">
            <div class="ship-track__fill" />
          </div>
          <div class="ship">
            <svg
              class="ship__svg"
              viewBox="0 0 96 64"
              aria-hidden="true"
            >
              <!-- humo -->
              <circle
                class="ship__puff ship__puff--1"
                cx="40"
                cy="10"
                r="5"
              />
              <circle
                class="ship__puff ship__puff--2"
                cx="49"
                cy="7"
                r="6"
              />
              <circle
                class="ship__puff ship__puff--3"
                cx="58"
                cy="10"
                r="4"
              />
              <!-- estela -->
              <path
                class="ship__wake"
                d="M2 34h18M8 40h16M0 46h22"
              />
              <!-- chimenea y cabina -->
              <rect
                x="48"
                y="16"
                width="9"
                height="8"
                rx="1.5"
                class="ship__hull"
              />
              <path
                d="M34 38 L39 24 H66 L72 38 Z"
                class="ship__cabin"
              />
              <rect
                x="43"
                y="27"
                width="4"
                height="7"
                rx="1"
                class="ship__window"
              />
              <rect
                x="51"
                y="27"
                width="4"
                height="7"
                rx="1"
                class="ship__window"
              />
              <rect
                x="59"
                y="27"
                width="4"
                height="7"
                rx="1"
                class="ship__window"
              />
              <!-- casco -->
              <path
                d="M24 38 H90 L80 52 Q70 56 42 55 Q30 54 24 38 Z"
                class="ship__hull"
              />
              <path
                d="M28 44 H86"
                class="ship__stripe"
              />
            </svg>
            <svg
              class="ship__waves"
              viewBox="0 0 120 14"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 9 Q5 4 10 9 T20 9 T30 9 T40 9 T50 9 T60 9 T70 9 T80 9 T90 9 T100 9 T110 9 T120 9 V14 H0 Z" />
            </svg>
          </div>
        </div>

        <div class="aviso-update__foot">
          <v-icon color="#0b4fbf">
            mdi-information-outline
          </v-icon>
          <span>{{ detalle }}</span>
          <strong>{{ progreso }}%</strong>
        </div>
      </template>

      <template v-else>
        <p class="aviso-update__subtitle">
          Hemos mejorado ACO para ti.
        </p>
        <v-btn
          class="aviso-update__btn"
          color="#0b4fbf"
          variant="flat"
          size="large"
          block
          prepend-icon="mdi-tray-arrow-down"
          :loading="swUpdate.fase === 'aplicando'"
          @click="actualizar"
        >
          ACTUALIZAR AHORA
        </v-btn>
        <div class="aviso-update__foot">
          <v-icon color="#0b4fbf">
            mdi-information-outline
          </v-icon>
          <span>{{ swUpdate.fase === "aplicando" ? "Aplicando la nueva versión…" : "Solo tomará unos segundos." }}</span>
        </div>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
.aviso-update {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2500;
  width: 420px;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  padding: 22px 26px 16px;
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(10, 31, 68, 0.28);
  text-align: center;
  color: #0a1f44;
}
.aviso-update__corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 120px;
  height: 92px;
  background: linear-gradient(135deg, #bfdcff 0%, #5aa7f5 100%);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  opacity: 0.85;
  pointer-events: none;
}
.aviso-update__close {
  position: absolute !important;
  top: 10px;
  right: 10px;
  color: #5a6880 !important;
}
.aviso-update__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #d6e8fd;
  color: #0b4fbf;
}
.aviso-update__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.01em;
}
.aviso-update__accent {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #0b5fd6;
}
.aviso-update__spark {
  position: relative;
  width: 18px;
  height: 18px;
}
.aviso-update__spark::before,
.aviso-update__spark::after {
  content: "";
  position: absolute;
  right: 0;
  width: 16px;
  height: 3px;
  border-radius: 3px;
  background: #4aa1f2;
}
.aviso-update__spark::before {
  top: 2px;
  transform: rotate(30deg);
}
.aviso-update__spark::after {
  bottom: 2px;
  transform: rotate(-30deg);
}
.aviso-update__spark--end {
  transform: scaleX(-1);
}
.aviso-update__subtitle {
  margin: 8px 0 14px;
  font-size: 1.05rem;
  color: #3b4a63;
}
.aviso-update__btn.v-btn {
  position: relative;
  z-index: 1;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 800;
}
.aviso-update__foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #dbe6f5;
  font-size: 0.95rem;
  color: #3b4a63;
}
.aviso-update__foot strong {
  color: #0b4fbf;
}

/* ---- Barra con barco ---- */
.ship-track {
  --ship-w: 96px;
  position: relative;
  height: 78px;
  margin: 0 4px;
}
.ship-track__rail {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  height: 28px;
  overflow: hidden;
  border-radius: 999px;
  background: #d6e5fb;
}
.ship-track__fill {
  width: calc(var(--progreso) * 100%);
  height: 100%;
  border-radius: 999px;
  background: repeating-linear-gradient(-45deg, #0b5fd6 0 12px, #1c6fe3 12px 24px);
  background-size: 34px 34px;
  animation: stripes 0.9s linear infinite;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.ship {
  position: absolute;
  bottom: 6px;
  /* La proa llega justo al borde derecho al 100 %. */
  left: calc(var(--progreso) * (100% - var(--ship-w) + 18px) - 18px);
  width: var(--ship-w);
  transition: left 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.ship__svg {
  display: block;
  width: 100%;
  animation: bob 1.4s ease-in-out infinite;
  transform-origin: 60% 80%;
}
.ship__hull {
  fill: #0d2a6b;
}
.ship__cabin {
  fill: #fff;
  stroke: #0d2a6b;
  stroke-width: 2.5;
  stroke-linejoin: round;
}
.ship__window {
  fill: #0d2a6b;
}
.ship__stripe {
  stroke: #2f7fe8;
  stroke-width: 2.5;
}
.ship__wake {
  fill: none;
  stroke: #fff;
  stroke-width: 2.5;
  stroke-linecap: round;
  opacity: 0.85;
  animation: wake 0.7s linear infinite;
}
.ship__puff {
  fill: #a9cdf6;
  animation: puff 2.4s ease-out infinite;
}
.ship__puff--2 {
  animation-delay: 0.5s;
}
.ship__puff--3 {
  animation-delay: 1s;
}
.ship__waves {
  position: absolute;
  left: -22px;
  bottom: -4px;
  width: calc(100% + 34px);
  height: 12px;
  fill: #8fc0f6;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  animation: waves 1.2s linear infinite;
}

@keyframes stripes {
  to {
    background-position: 34px 0;
  }
}
@keyframes waves {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-10px);
  }
}
@keyframes bob {
  0%,
  100% {
    transform: translateY(0) rotate(-1.5deg);
  }
  50% {
    transform: translateY(-3px) rotate(1.5deg);
  }
}
@keyframes wake {
  from {
    stroke-dasharray: 6 4;
    stroke-dashoffset: 0;
  }
  to {
    stroke-dasharray: 6 4;
    stroke-dashoffset: 20;
  }
}
@keyframes puff {
  0% {
    opacity: 0;
    transform: translate(0, 4px) scale(0.6);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-10px, -8px) scale(1.2);
  }
}

.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

/* Tablet: un poco más compacto. */
@media (max-width: 960px) {
  .aviso-update {
    right: 16px;
    bottom: 16px;
    width: 380px;
  }
  .aviso-update__title {
    font-size: 1.55rem;
  }
}
/* Móvil: tarjeta a lo ancho, pegada abajo. */
@media (max-width: 599px) {
  .aviso-update {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
    max-width: none;
    padding: 18px 16px 12px;
    border-radius: 22px;
  }
  .aviso-update__icon {
    width: 54px;
    height: 54px;
  }
  .aviso-update__icon .v-icon {
    font-size: 28px !important;
  }
  .aviso-update__title {
    font-size: 1.3rem;
  }
  .aviso-update__subtitle {
    margin: 6px 0 10px;
    font-size: 0.95rem;
  }
  .ship-track {
    --ship-w: 72px;
    height: 62px;
  }
  .ship-track__rail {
    height: 22px;
  }
  .aviso-update__foot {
    flex-wrap: wrap;
    font-size: 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ship__svg,
  .ship__wake,
  .ship__puff,
  .ship-track__fill,
  .ship__waves {
    animation: none;
  }
}
</style>
