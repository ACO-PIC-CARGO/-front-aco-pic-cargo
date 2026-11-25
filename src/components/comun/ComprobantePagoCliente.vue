<script setup lang="ts">
import { ref } from "vue";
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { abrirArchivo } from "@/composables/useVisorArchivo";
import type { ArchivoComprobante } from "@/types/archivos";

// Instructivo 6.1 "¿El CLIENTE ya nos pagó?": soportes de pago del cliente (varios archivos). Guarda el id de
// table_allpath porque al aprobar la cotización se cargan solos en "Cargar Pago Cliente" (Control de Gastos > Ingresos):
// el primero es el voucher y todos se ven en la solicitud de cobro.

const modelo = defineModel<ArchivoComprobante[]>({ default: () => [] });

const MAX_MB = 10;
const filesStore = useFilesStore();
const subiendo = ref(false);
const arrastrando = ref(false);
const inputArchivo = ref<HTMLInputElement | null>(null);

function seleccionar() {
  if (!subiendo.value) inputArchivo.value?.click();
}
async function alElegir(event: Event) {
  const input = event.target as HTMLInputElement;
  const archivos = Array.from(input.files ?? []);
  input.value = "";
  await subirVarios(archivos);
}
async function alSoltar(event: DragEvent) {
  arrastrando.value = false;
  await subirVarios(Array.from(event.dataTransfer?.files ?? []));
}
async function subirVarios(archivos: File[]) {
  for (const archivo of archivos) {
    if (!(await subir(archivo))) break;
  }
}
async function subir(archivo: File) {
  if (!(archivo.type === "application/pdf" || archivo.type.startsWith("image/"))) {
    void Swal.fire({ icon: "warning", title: "Formato no válido", text: `«${archivo.name}»: sube un PDF, JPG o PNG.` });
    return false;
  }
  if (archivo.size > MAX_MB * 1024 * 1024) {
    void Swal.fire({ icon: "warning", title: "Archivo muy pesado", text: `«${archivo.name}» no puede pasar de ${MAX_MB} MB.` });
    return false;
  }
  subiendo.value = true;
  try {
    const error = await filesStore._uploadFile(archivo);
    if (error || !filesStore.payPath) {
      void Swal.fire({ icon: "error", text: error || "No pudimos subir el archivo. Intenta de nuevo." });
      return false;
    }
    modelo.value = [...modelo.value, { id: Number(filesStore.payPath), ruta: filesStore.datosPath?.ruta || "", name: archivo.name }];
    return true;
  } finally {
    subiendo.value = false;
  }
}
function quitar(indice: number) {
  modelo.value = modelo.value.filter((_, i) => i !== indice);
}
</script>

<template>
  <div class="cpc">
    <div class="cpc__head">
      <v-icon size="22">
        mdi-file-upload-outline
      </v-icon>
      Cargar soporte de pago del cliente
      <span
        v-if="modelo.length"
        class="cpc__count"
      >{{ modelo.length }}</span>
    </div>
    <div class="cpc__body">
      <div
        v-for="(archivo, indice) in modelo"
        :key="`${archivo.id}-${indice}`"
        class="cpc__file"
      >
        <v-icon size="18">
          mdi-file-document-outline
        </v-icon>
        <span
          class="cpc__name"
          :title="archivo.name"
        >{{ archivo.name }}</span>
        <button
          v-if="archivo.ruta"
          type="button"
          class="cpc__icon-btn cpc__icon-btn--ver"
          title="Ver archivo"
          aria-label="Ver archivo"
          @click="abrirArchivo(archivo.ruta, archivo.name)"
        >
          <v-icon size="20">
            mdi-eye-outline
          </v-icon>
        </button>
        <button
          type="button"
          class="cpc__icon-btn"
          title="Quitar archivo"
          aria-label="Quitar archivo"
          @click="quitar(indice)"
        >
          <v-icon size="18">
            mdi-close
          </v-icon>
        </button>
      </div>
      <div
        class="cpc__zona"
        :class="{ 'is-dragging': arrastrando }"
        @dragover.prevent="arrastrando = true"
        @dragleave.prevent="arrastrando = false"
        @drop.prevent="alSoltar"
      >
        <v-progress-circular
          v-if="subiendo"
          indeterminate
          size="30"
          width="3"
          color="primary"
          class="cpc__cloud"
        />
        <v-icon
          v-else
          size="38"
          class="cpc__cloud"
        >
          mdi-cloud-upload-outline
        </v-icon>
        <span class="cpc__sep" />
        <span class="cpc__text">
          <b>{{ subiendo ? "Subiendo archivo…" : modelo.length ? "Agregar otro soporte" : "Adjunta los soportes de pago" }}</b>
          <span>PDF, JPG o PNG (máx. {{ MAX_MB }} MB c/u). Puedes subir varios.</span>
        </span>
        <button
          type="button"
          class="cpc__btn"
          :disabled="subiendo"
          @click="seleccionar"
        >
          <v-icon size="18">
            mdi-paperclip
          </v-icon>
          {{ modelo.length ? "Agregar archivos" : "Seleccionar archivos" }}
        </button>
        <input
          ref="inputArchivo"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          hidden
          @change="alElegir"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.cpc {
  overflow: hidden;
  background: #f4f8ff;
  border: 1px solid #d6e3f7;
  border-radius: 12px;
}
.cpc__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #1f2a44;
  background: #e3edfc;
}
.cpc__head .v-icon {
  color: #1f73e8;
}
.cpc__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}
.cpc__count {
  margin-left: auto;
  min-width: 22px;
  padding: 0 7px;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  color: #ffffff;
  background: #1f73e8;
  border-radius: 11px;
}
.cpc__zona {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1.5px dashed #b7c4d8;
  border-radius: 10px;
  transition: background-color 0.2s, border-color 0.2s;
}
.cpc__zona.is-dragging {
  background: #eaf2ff;
  border-color: #1f73e8;
}
.cpc__cloud {
  flex: 0 0 auto;
  color: #1f73e8;
}
.cpc__sep {
  align-self: stretch;
  width: 1px;
  background: #c9d3e3;
}
.cpc__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #6b7280;
}
.cpc__text b {
  font-size: 13px;
  color: #1f2a44;
}
.cpc__btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  color: #1f73e8;
  background: #ffffff;
  border: 1.5px solid #1f73e8;
  border-radius: 8px;
  cursor: pointer;
}
.cpc__btn:hover:not(:disabled) {
  background: #eaf2ff;
}
.cpc__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.cpc__file {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  font-size: 13px;
  color: #166534;
  background: #dcf5d0;
  border-radius: 8px;
}
.cpc__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a44;
}
.cpc__icon-btn {
  display: inline-flex;
  color: #4b5563;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cpc__icon-btn:hover {
  color: #dc2626;
}
.cpc__icon-btn--ver {
  color: #1f73e8;
}
.cpc__icon-btn--ver:hover {
  color: #0b4fb3;
}
/* celular: el botón baja a su propia línea */
@media (max-width: 520px) {
  .cpc__zona {
    flex-wrap: wrap;
  }
  .cpc__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
