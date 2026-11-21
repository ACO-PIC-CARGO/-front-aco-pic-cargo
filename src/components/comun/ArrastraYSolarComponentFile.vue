<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import type { ArchivoInicial } from "@/types/archivos";
import { useFilesStore } from "@/stores/files";
import { abrirArchivo } from "@/composables/useVisorArchivo";

// 1. Agregamos los props para recibir la data del padre
// compact: botón "Adjuntar" / chip con el archivo (instructivo). Sin compact se ve como antes.
// zona: recuadro punteado con título (instructivo, pasos de pago). accept: p. ej. ".pdf".
const props = withDefaults(
  defineProps<{
    id?: string;
    archivoInicial?: ArchivoInicial | null;
    compact?: boolean;
    zona?: boolean;
    titulo?: string;
    subtitulo?: string;
    accept?: string;
  }>(),
  {
    id: undefined,
    archivoInicial: null,
    compact: false,
    zona: false,
    titulo: "Subir archivo",
    subtitulo: "Arrastra y suelta el archivo o haz clic para seleccionar",
    accept: undefined,
  },
);
const emit = defineEmits<{
  "archivo-cargado": [payload: { id: unknown; archivo: unknown }];
  "archivo-eliminado": [];
}>();

const filesStore = useFilesStore();

const loading = ref(false);
const isDragging = ref(false);
const file = ref<File | null>(null);
const msgfile = ref("");
const errfile = ref("");
const archivoSubidoExitosamente = ref(false);
const rutaDescarga = ref("");
const fileInput = useTemplateRef("fileInput");

// 3. Este método se encarga de pintar visualmente el archivo existente
// Acepta { archivo: { ruta, name } } y también el archivo tal como lo devuelve uploadAllPath ({ ruta, name }),
// que es como se guarda en el instructivo.
function cargarDataExistente(data: ArchivoInicial & { name?: string }) {
  archivoSubidoExitosamente.value = true;
  rutaDescarga.value = (data.archivo ? data.archivo.ruta : data.ruta) ?? "";

  // Creamos un objeto similar al que genera el input de file nativo
  // para que se dibuje el nombre en la etiqueta {{ file.name }}
  file.value = {
    name: (data.archivo ? data.archivo.name : data.name) || "Archivo cargado",
  } as File;
}
// Ojo: pestaña nueva en web, modal en celular / tablet.
function verArchivo() {
  abrirArchivo(rutaDescarga.value, file.value?.name);
}

// Respeta "accept" también al arrastrar (el input solo filtra el diálogo de archivos).
function archivoPermitido(archivo: File) {
  if (!props.accept) return true;
  const nombre = archivo.name.toLowerCase();
  const permitido = props.accept
    .split(",")
    .map((tipo) => tipo.trim().toLowerCase())
    .some((tipo) => (tipo.startsWith(".") ? nombre.endsWith(tipo) : archivo.type === tipo));
  if (!permitido) {
    Swal.fire({ icon: "warning", title: "Archivo no permitido", text: `Solo se aceptan archivos ${props.accept}` });
  }
  return permitido;
}

async function handleDrop(event: DragEvent) {
  loading.value = true;
  event.preventDefault();
  isDragging.value = false;
  const droppedFiles = event.dataTransfer!.files;

  if (droppedFiles.length > 0 && !archivoPermitido(droppedFiles[0]!)) {
    loading.value = false;
    return;
  }
  if (droppedFiles.length > 0) {
    file.value = droppedFiles[0]!;

    setTimeout(async () => {
      await uploadFile();
      loading.value = false;
    }, 1000);
  } else {
    loading.value = false;
  }
}

function openFileInput() {
  fileInput.value!.$el.querySelector("input").click();
}

async function uploadFile() {
  msgfile.value = "";
  errfile.value = "";

  if (file.value && !archivoPermitido(file.value)) {
    file.value = null;
    return;
  }
  if (file.value) {
    loading.value = true;
    try {
      await filesStore._uploadFile(file.value);
      Swal.fire({
        icon: "success",
        title: "Archivo Cargado Correctamente",
      });

      rutaDescarga.value = filesStore.datosPath
        ? filesStore.datosPath.ruta
        : "";
      archivoSubidoExitosamente.value = true;

      emit("archivo-cargado", {
        id: filesStore.payPath,
        archivo: filesStore.datosPath,
      });
    } catch (error) {
      console.error("Error al subir:", error);
    } finally {
      loading.value = false;
    }
  }
}

function eliminarFile() {
  emit("archivo-eliminado");

  file.value = null;
  archivoSubidoExitosamente.value = false;
  rutaDescarga.value = "";

  filesStore.payPath = null;
  filesStore.datosPath = null;
}

// 2. Agregamos un watch por si la data tarda un poco en llegar desde la BD
watch(
  () => props.archivoInicial,
  (newValue) => {
    // Si newValue existe y tiene una ruta (ya sea adentro de .archivo o directo)
    if (newValue && (newValue.ruta || newValue.archivo)) {
      cargarDataExistente(newValue);
    } else {
      // Si no hay archivo, reseteamos el estado visual
      archivoSubidoExitosamente.value = false;
      file.value = null;
    }
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  filesStore.payPath = null;
  filesStore.datosPath = null;
});
</script>

<template>
  <div
    v-if="compact || zona"
    class="adj-file"
    :class="{ 'adj-file--zona': zona }"
  >
    <div
      v-if="loading"
      class="adj-file__box adj-file__box--loading"
    >
      <v-progress-circular
        indeterminate
        size="14"
        width="2"
      />
      Subiendo…
    </div>
    <div
      v-else-if="archivoSubidoExitosamente"
      class="adj-file__box adj-file__box--ok"
    >
      <v-icon size="16">
        mdi-file-document-outline
      </v-icon>
      <a
        :href="rutaDescarga || undefined"
        target="_blank"
        class="adj-file__name"
        :title="file ? file.name : ''"
        @click.prevent="rutaDescarga && verArchivo()"
      >{{ file ? file.name : "Archivo listo" }}</a>
      <button
        v-if="rutaDescarga"
        type="button"
        class="adj-file__view"
        title="Ver archivo"
        aria-label="Ver archivo"
        @click="verArchivo"
      >
        <v-icon size="18">
          mdi-eye-outline
        </v-icon>
      </button>
      <button
        type="button"
        class="adj-file__remove"
        title="Quitar archivo"
        @click="eliminarFile"
      >
        <v-icon size="16">
          mdi-close
        </v-icon>
      </button>
    </div>
    <button
      v-else-if="zona"
      type="button"
      class="adj-file__zona"
      :class="{ 'is-dragging': isDragging }"
      @click="openFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop="handleDrop"
    >
      <v-icon
        size="34"
        class="adj-file__zona-icon"
      >
        mdi-cloud-upload-outline
      </v-icon>
      <span class="adj-file__zona-text">
        <b>{{ titulo }}</b>
        <span v-if="subtitulo">{{ subtitulo }}</span>
      </span>
    </button>
    <button
      v-else
      type="button"
      class="adj-file__box adj-file__box--btn"
      @click="openFileInput"
      @dragover.prevent
      @drop="handleDrop"
    >
      <v-icon size="16">
        mdi-tray-arrow-up
      </v-icon>
      Adjuntar
    </button>
    <v-file-input
      ref="fileInput"
      v-model="file"
      hide-details
      :accept="accept"
      @update:model-value="uploadFile()"
      style="display: none"
    />
  </div>
  <v-card v-else>
    <v-card-text>
      <div v-if="archivoSubidoExitosamente">
        <span><b>Archivo Cargado:</b></span>
        {{ file ? file.name : "Archivo listo" }}

        <v-btn
          variant="text"
          color="info"
          icon
          :href="rutaDescarga"
          target="_blank"
        >
          <v-icon
            color="info"
            size="xl"
          >
            mdi-file
          </v-icon>
        </v-btn>
        <v-btn
          variant="text"
          color="red"
          icon
          @click="eliminarFile"
        >
          <v-icon
            color="red"
            size="xl"
          >
            mdi-close-circle
          </v-icon>
        </v-btn>
      </div>

      <div v-else>
        <div
          class="drop-area"
          @dragover.prevent
          @drop="handleDrop"
          @click="openFileInput"
          v-if="!loading"
        >
          <label>
            Arrastra y suelta el archivo aquí
            <v-file-input
              ref="fileInput"
              v-model="file"
              hide-details
              @update:model-value="uploadFile()"
              style="display: none"
            />
          </label>
        </div>

        <div v-else>
          <v-card color="primary">
            <v-card-text>
              Se está analizando los archivos, un momento por favor....
              <v-progress-linear
                indeterminate
                color="white"
                class="mb-0"
              />
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.drop-area {
  width: 100%;
  height: 70px;
  border: 2px dashed #ccc;
  text-align: center;
  align-items: center;
  align-content: center;
  /* line-height: 150px; */
  cursor: pointer;
}

.adj-file {
  min-width: 0;
}
.adj-file__box {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 8px;
}
.adj-file__box--btn {
  justify-content: center;
  font-weight: 700;
  color: #1f73e8;
  background: #ffffff;
  border: 1px solid #c9dcfb;
  cursor: pointer;
}
.adj-file__box--btn:hover {
  background: #eaf2ff;
}
.adj-file__box--ok {
  color: #166534;
  background: #dcf5d0;
}
.adj-file__box--loading {
  justify-content: center;
  color: #1f73e8;
  background: #eaf2ff;
}
.adj-file__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2a44;
  text-decoration: none;
}
.adj-file__name:hover {
  text-decoration: underline;
}
.adj-file__remove {
  display: inline-flex;
  color: #4b5563;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.adj-file__remove:hover {
  color: #dc2626;
}
.adj-file__view {
  display: inline-flex;
  color: #1f73e8;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.adj-file__view:hover {
  color: #0b4fb3;
}
.adj-file--zona .adj-file__box {
  height: 44px;
  font-size: 13px;
}
.adj-file__zona {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  text-align: left;
  background: #f7faff;
  border: 1.5px dashed #6aa3f2;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
.adj-file__zona:hover,
.adj-file__zona.is-dragging {
  background: #eaf2ff;
  border-color: #1f73e8;
}
.adj-file__zona-icon {
  color: #1f73e8;
}
.adj-file__zona-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: 12px;
  color: #4b5563;
}
.adj-file__zona-text b {
  font-size: 14px;
  color: #1f2a44;
}
</style>
