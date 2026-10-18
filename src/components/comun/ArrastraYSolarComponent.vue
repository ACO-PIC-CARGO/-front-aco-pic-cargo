<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import type { ValidationRule } from "vuetify";

const props = withDefaults(
  defineProps<{
    // Reglas de validación para v-form
    rules?: ValidationRule[];
    // URL previa del archivo (si la tienes desde BD)
    initialUrl?: string | null;
    // ID previo del archivo (si la tienes desde BD)
    initialId?: string | number | null;
    // Si se pasa true, deshabilita eliminar y subir (Ideal para tipo == 'ver')
    readOnly?: boolean;
  }>(),
  { rules: () => [], initialUrl: null, initialId: null, readOnly: false },
);
const emit = defineEmits<{
  idArchivoCargado: [payload: { id: unknown; archivo: unknown }];
}>();

const rootStore = useStore();

const loading = ref(false);
const isDragging = ref(false);
const file = ref<File | null>(null);
const errorState = ref(false);
// Manejo local cuando se pasa prop previa
const existingUrl = ref<string | null>(null);
const existingId = ref<string | number | null>(null);
const fileInput = useTemplateRef("fileInput");

// Evalúa si hay archivo (ya sea subido nuevo o enviado por Props)
const tieneArchivo = computed(
  () => !!rootStore.state.files.payPath || !!existingUrl.value || !!existingId.value,
);
// Retorna el ID actual para que v-input valide si existe
const archivoValido = computed(
  () => rootStore.state.files.payPath || existingId.value || existingUrl.value || null,
);
// URL para ver el archivo en el botón
const urlVisor = computed(() => {
  if (rootStore.state.files.datosPath?.ruta) {
    return rootStore.state.files.datosPath.ruta;
  }
  return existingUrl.value || null;
});
// Nombre a mostrar en la tarjeta
// Nombre a mostrar en la tarjeta
const nombreArchivo = computed(() => {
  if (file.value) return file.value.name;
  if (existingUrl.value !== null && existingUrl.value !== undefined) {
    // Convierte a String por si acaso se pasa un número por error desde el padre
    const urlStr = String(existingUrl.value);
    // Extrae el nombre del archivo si es una URL válida, o muestra el valor/ID
    const filename = urlStr.includes("/") ? urlStr.split("/").pop() : urlStr;
    return filename || "Soporte adjunto";
  }
  return "Soporte adjunto";
});

watch(
  () => props.initialUrl,
  (val) => {
    existingUrl.value = val;
  },
  { immediate: true },
);
watch(
  () => props.initialId,
  (val) => {
    existingId.value = val;
  },
  { immediate: true },
);

onMounted(() => {
  // Reseteamos el store al montar para no arrastrar basura de otras vistas
  rootStore.state.files.payPath = null;
  rootStore.state.files.datosPath = null;
});

async function handleDrop(event: DragEvent) {
  if (props.readOnly) return;
  event.preventDefault();
  isDragging.value = false;
  const droppedFiles = event.dataTransfer!.files;

  if (droppedFiles.length > 0) {
    file.value = droppedFiles[0]!;
    await uploadFile();
  }
}

function openFileInput() {
  if (props.readOnly) return;
  fileInput.value!.$el.click();
}

async function uploadFile() {
  // BLOQUEO: Si ya está cargando, ignora nuevos intentos para romper el bucle
  if (loading.value || !file.value) return;

  const isValidType =
    file.value.type === "application/pdf" || file.value.type.startsWith("image/");

  if (!isValidType) {
    file.value = null;
    Swal.fire({
      icon: "error",
      title: "Formato no válido",
      text: "Por favor, selecciona únicamente una imagen o un archivo PDF.",
    });
    return;
  }

  loading.value = true;

  try {
    await rootStore.dispatch("_uploadFile", file.value);

    existingUrl.value = null;
    existingId.value = null;

    Swal.fire({
      icon: "success",
      title: "Archivo Cargado Correctamente",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });

    emit("idArchivoCargado", {
      id: rootStore.state.files.payPath,
      archivo: rootStore.state.files.datosPath,
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "Error al cargar",
      text: "Ocurrió un problema al subir el archivo.",
    });
  } finally {
    loading.value = false;
    file.value = null; // Limpia la referencia para permitir reintentos limpios
  }
}

function eliminarFile() {
  rootStore.state.files.payPath = null;
  rootStore.state.files.datosPath = null;
  existingUrl.value = null;
  existingId.value = null;
  file.value = null;
  emit("idArchivoCargado", { id: null, archivo: null });
}
</script>

<template>
  <!-- Contenedor nativo de validación de Vuetify -->
  <v-input
    :rules="rules"
    :model-value="archivoValido"
    class="pa-0 ma-0"
    hide-details="auto"
  >
    <v-card class="py-0 elevation-0 width-100">
      <v-card-text class="pa-0">
        <!-- 1. Estado: Archivo Cargado (Ya sea por Prop Inicial o subido recientemente) -->
        <div
          v-if="tieneArchivo"
          class="clsArchivoCargado"
        >
          <div class="d-flex align-center overflow-hidden">
            <v-icon
              color="success"
              class="mr-2"
            >
              mdi-check-circle-outline
            </v-icon>
            <span class="text-truncate">
              <b>Archivo Cargado:</b>
              {{ nombreArchivo }}
            </span>
          </div>

          <div class="d-flex align-center">
            <!-- Botón Ver/Descargar -->
            <v-btn
              variant="text"
              v-if="urlVisor"
              color="info"
              icon
              :href="urlVisor"
              target="_blank"
              title="Ver archivo"
            >
              <v-icon
                color="info"
                size="22"
              >
                mdi-eye
              </v-icon>
            </v-btn>

            <!-- Botón Eliminar (Deshabilitado si solo es lectura / modo 'ver') -->
            <v-btn
              variant="text"
              v-if="!readOnly"
              color="red"
              icon
              @click="eliminarFile"
              title="Eliminar archivo"
            >
              <v-icon
                color="red"
                size="22"
              >
                mdi-close-circle
              </v-icon>
            </v-btn>
          </div>
        </div>

        <!-- 2. Estado: Zona Dropzone (Sube / Arrastra) -->
        <div v-else-if="!readOnly">
          <div
            class="drop-area"
            :class="{ 'drop-area-error': errorState }"
            @dragover.prevent
            @drop="handleDrop"
            @click="openFileInput"
            v-if="!loading"
          >
            <label class="cursor-pointer">
              <v-icon
                color="grey-darken-1"
                class="mr-1"
              >mdi-cloud-upload</v-icon>
              Arrastra y suelta el archivo aquí o haz clic para seleccionar
              <v-file-input
                ref="fileInput"
                v-model="file"
                hide-details
                accept="image/*, application/pdf"
                @update:model-value="uploadFile()"
                style="display: none"
              />
            </label>
          </div>

          <!-- 3. Estado: Cargando -->
          <div v-else>
            <v-card
              color="primary"
              class="pa-2"
            >
              <v-card-text class="pa-2 text-center">
                Se está procesando el archivo, un momento por favor...
                <v-progress-linear
                  indeterminate
                  color="white"
                  class="mb-0 mt-2"
                />
              </v-card-text>
            </v-card>
          </div>
        </div>

        <!-- 4. Estado: No hay archivo y es solo lectura -->
        <div
          v-else
          class="text-body-small text-grey-darken-1 pa-2 italic"
        >
          <v-icon
            size="small"
            color="grey"
          >
            mdi-file-hidden
          </v-icon> No se ha adjuntado
          ningún soporte.
        </div>
      </v-card-text>
    </v-card>
  </v-input>
</template>

<style scoped>
.width-100 {
  width: 100%;
}
.cursor-pointer {
  cursor: pointer;
}
.drop-area {
  width: 100%;
  height: 90px;
  border: 2px dashed #b0bec5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.3s ease;
}
.drop-area:hover {
  background: #f0f4f8;
  border-color: #1976d2;
}

/* Bordes en rojo cuando v-input detecta error */
.v-input--error .drop-area {
  border-color: #ff5252 !important;
  background-color: #fff8f8;
}

.clsArchivoCargado {
  padding: 8px 14px;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
