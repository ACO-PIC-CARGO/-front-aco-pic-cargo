<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { tipoDeArchivo, visorArchivo } from "@/composables/useVisorArchivo";

// Modal único del visor de soportes en celular / tablet (ver useVisorArchivo).
const tipo = computed(() => tipoDeArchivo(visorArchivo.url, visorArchivo.nombre));
const titulo = computed(() => visorArchivo.nombre || (tipo.value === "pdf" ? "Documento PDF" : tipo.value === "imagen" ? "Imagen" : "Archivo"));

// sin extensión conocida se intenta como imagen y, si no carga, en el visor
const imagenFallo = ref(false);
watch(
  () => visorArchivo.url,
  () => {
    imagenFallo.value = false;
  },
);
const comoImagen = computed(() => tipo.value === "imagen" || (tipo.value === "otro" && !imagenFallo.value));
</script>

<template>
  <v-dialog
    v-model="visorArchivo.abierto"
    fullscreen
    scrollable
  >
    <v-card class="visor">
      <div class="visor__head">
        <v-icon
          color="primary"
          size="22"
        >
          {{ tipo === "pdf" ? "mdi-file-pdf-box" : comoImagen ? "mdi-file-image-outline" : "mdi-file-outline" }}
        </v-icon>
        <span class="visor__titulo">{{ titulo }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="visorArchivo.abierto = false"
        />
      </div>

      <div class="visor__body">
        <img
          v-if="comoImagen"
          :src="visorArchivo.url"
          :alt="titulo"
          class="visor__img"
          @error="imagenFallo = true"
        >
        <iframe
          v-else
          :src="visorArchivo.url"
          :title="titulo"
          class="visor__frame"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.visor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #eef2f8 !important;
}
.visor__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 16px;
  border-bottom: 1px solid #dbe5f5;
  background: #ffffff;
}
.visor__titulo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #0a1f44;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.visor__body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}
.visor__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
}
.visor__frame {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
}
</style>
