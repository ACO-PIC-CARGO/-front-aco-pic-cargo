<template>
  <!-- Contenedor nativo de validación de Vuetify -->
  <v-input
    :rules="rules"
    :value="archivoValido"
    class="pa-0 ma-0"
    hide-details="auto"
  >
    <v-card class="py-0 elevation-0 width-100">
      <v-card-text class="pa-0">
        <!-- 1. Estado: Archivo Cargado (Ya sea por Prop Inicial o subido recientemente) -->
        <div v-if="tieneArchivo" class="clsArchivoCargado">
          <div class="d-flex align-center overflow-hidden">
            <v-icon color="success" class="mr-2"
              >mdi-check-circle-outline</v-icon
            >
            <span class="text-truncate">
              <b>Archivo Cargado:</b>
              {{ nombreArchivo }}
            </span>
          </div>

          <div class="d-flex align-center">
            <!-- Botón Ver/Descargar -->
            <v-btn
              v-if="urlVisor"
              color="info"
              icon
              :href="urlVisor"
              target="_blank"
              title="Ver archivo"
            >
              <v-icon color="info" size="22">mdi-open-in-new</v-icon>
            </v-btn>

            <!-- Botón Eliminar (Deshabilitado si solo es lectura / modo 'ver') -->
            <v-btn
              v-if="!readOnly"
              color="red"
              icon
              @click="eliminarFile"
              title="Eliminar archivo"
            >
              <v-icon color="red" size="22">mdi-close-circle</v-icon>
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
              <v-icon color="grey darken-1" class="mr-1"
                >mdi-cloud-upload</v-icon
              >
              Arrastra y suelta el archivo aquí o haz clic para seleccionar
              <v-file-input
                ref="fileInput"
                v-model="file"
                hide-details
                accept="image/*, application/pdf"
                @change="uploadFile()"
                style="display: none"
              ></v-file-input>
            </label>
          </div>

          <!-- 3. Estado: Cargando -->
          <div v-else>
            <v-card color="primary" dark class="pa-2">
              <v-card-text class="pa-2 text-center">
                Se está procesando el archivo, un momento por favor...
                <v-progress-linear
                  indeterminate
                  color="white"
                  class="mb-0 mt-2"
                ></v-progress-linear>
              </v-card-text>
            </v-card>
          </div>
        </div>

        <!-- 4. Estado: No hay archivo y es solo lectura -->
        <div v-else class="text-caption grey--text text--darken-1 pa-2 italic">
          <v-icon small color="grey">mdi-file-hidden</v-icon> No se ha adjuntado
          ningún soporte.
        </div>
      </v-card-text>
    </v-card>
  </v-input>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  name: "ArrastraYSolarComponent",
  props: {
    // Reglas de validación para v-form
    rules: {
      type: Array,
      default: () => [],
    },
    // URL previa del archivo (si la tienes desde BD)
    initialUrl: {
      type: String,
      default: null,
    },
    // ID previo del archivo (si la tienes desde BD)
    initialId: {
      type: [String, Number],
      default: null,
    },
    // Si se pasa true, deshabilita eliminar y subir (Ideal para tipo == 'ver')
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      isDragging: false,
      file: null,
      errorState: false,
      // Manejo local cuando se pasa prop previa
      existingUrl: null,
      existingId: null,
    };
  },
  computed: {
    // Evalúa si hay archivo (ya sea subido nuevo o enviado por Props)
    tieneArchivo() {
      return (
        !!this.$store.state.files.payPath ||
        !!this.existingUrl ||
        !!this.existingId
      );
    },
    // Retorna el ID actual para que v-input valide si existe
    archivoValido() {
      return (
        this.$store.state.files.payPath ||
        this.existingId ||
        this.existingUrl ||
        null
      );
    },
    // URL para ver el archivo en el botón
    urlVisor() {
      if (this.$store.state.files.datosPath?.ruta) {
        return this.$store.state.files.datosPath.ruta;
      }
      return this.existingUrl || null;
    },
    // Nombre a mostrar en la tarjeta
    // Nombre a mostrar en la tarjeta
    nombreArchivo() {
      if (this.file) return this.file.name;
      if (this.existingUrl !== null && this.existingUrl !== undefined) {
        // Convierte a String por si acaso se pasa un número por error desde el padre
        const urlStr = String(this.existingUrl);
        // Extrae el nombre del archivo si es una URL válida, o muestra el valor/ID
        const filename = urlStr.includes("/")
          ? urlStr.split("/").pop()
          : urlStr;
        return filename || "Soporte adjunto";
      }
      return "Soporte adjunto";
    },
  },
  watch: {
    initialUrl: {
      immediate: true,
      handler(val) {
        this.existingUrl = val;
      },
    },
    initialId: {
      immediate: true,
      handler(val) {
        this.existingId = val;
      },
    },
  },
  mounted() {
    // Reseteamos el store al montar para no arrastrar basura de otras vistas
    this.$store.state.files.payPath = null;
    this.$store.state.files.datosPath = null;
  },
  methods: {
    ...mapActions(["_uploadFile"]),

    async handleDrop(event) {
      if (this.readOnly) return;
      event.preventDefault();
      this.isDragging = false;
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles.length > 0) {
        this.file = droppedFiles[0];
        await this.uploadFile();
      }
    },

    openFileInput() {
      if (this.readOnly) return;
      this.$refs.fileInput.$el.click();
    },

    async uploadFile() {
      const vm = this;
      // BLOQUEO: Si ya está cargando, ignora nuevos intentos para romper el bucle
      if (vm.loading || !vm.file) return;

      const isValidType =
        vm.file.type === "application/pdf" || vm.file.type.startsWith("image/");

      if (!isValidType) {
        vm.file = null;
        Swal.fire({
          icon: "error",
          title: "Formato no válido",
          text: "Por favor, selecciona únicamente una imagen o un archivo PDF.",
        });
        return;
      }

      vm.loading = true;

      try {
        await this._uploadFile(vm.file);

        this.existingUrl = null;
        this.existingId = null;

        Swal.fire({
          icon: "success",
          title: "Archivo Cargado Correctamente",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });

        vm.$emit("idArchivoCargado", {
          id: vm.$store.state.files.payPath,
          archivo: vm.$store.state.files.datosPath,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error al cargar",
          text: "Ocurrió un problema al subir el archivo.",
        });
      } finally {
        vm.loading = false;
        vm.file = null; // Limpia la referencia para permitir reintentos limpios
      }
    },

    eliminarFile() {
      this.$store.state.files.payPath = null;
      this.$store.state.files.datosPath = null;
      this.existingUrl = null;
      this.existingId = null;
      this.file = null;
      this.$emit("idArchivoCargado", { id: null, archivo: null });
    },
  },
};
</script>

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
.v-input--has-state.error--text .drop-area {
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
