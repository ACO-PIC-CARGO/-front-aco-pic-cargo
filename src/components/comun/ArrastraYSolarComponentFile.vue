<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import type { ArchivoInicial } from "@/types/archivos";

const props = withDefaults(defineProps<{ id?: string; archivoInicial?: ArchivoInicial | null }>(), {
  id: undefined,
  archivoInicial: null,
});
const emit = defineEmits<{
  "archivo-cargado": [payload: { id: unknown; archivo: unknown }];
  "archivo-eliminado": [];
}>();

const rootStore = useStore();

const loading = ref(false);
const isDragging = ref(false);
const file = ref<File | null>(null);
const msgfile = ref("");
const errfile = ref("");
const archivoSubidoExitosamente = ref(false);
const rutaDescarga = ref("");
const fileInput = useTemplateRef("fileInput");

// 3. Este método se encarga de pintar visualmente el archivo existente
function cargarDataExistente(data: ArchivoInicial) {
  archivoSubidoExitosamente.value = true;
  rutaDescarga.value = data.archivo ? data.archivo.ruta! : "";

  // Creamos un objeto similar al que genera el input de file nativo
  // para que se dibuje el nombre en la etiqueta {{ file.name }}
  file.value = {
    name: data.archivo ? data.archivo.name! : "Archivo cargado",
  } as File;
}

async function handleDrop(event: DragEvent) {
  loading.value = true;
  event.preventDefault();
  isDragging.value = false;
  const droppedFiles = event.dataTransfer!.files;

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

  if (file.value) {
    loading.value = true;
    try {
      await rootStore.dispatch("_uploadFile", file.value);
      Swal.fire({
        icon: "success",
        title: "Archivo Cargado Correctamente",
      });

      rutaDescarga.value = rootStore.state.files.datosPath
        ? rootStore.state.files.datosPath.ruta
        : "";
      archivoSubidoExitosamente.value = true;

      emit("archivo-cargado", {
        id: rootStore.state.files.payPath,
        archivo: rootStore.state.files.datosPath,
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

  rootStore.state.files.payPath = null;
  rootStore.state.files.datosPath = null;
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
  rootStore.state.files.payPath = null;
  rootStore.state.files.datosPath = null;
});
</script>

<template>
  <v-card>
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
</style>
