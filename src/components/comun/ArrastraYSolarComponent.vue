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
        <!-- 1. Estado: Archivo Cargado -->
        <div v-if="$store.state.files.payPath" class="clsArchivoCargado">
          <span><b>Archivo Cargado:</b></span>
          {{ file ? file.name : "Soporte adjunto" }}
          <v-btn
            color="info"
            icon
            :href="$store.state.files.datosPath.ruta"
            target="_blank"
          >
            <v-icon color="info" size="xl">mdi-file</v-icon>
          </v-btn>
          <v-btn color="red" icon @click="eliminarFile">
            <v-icon color="red" size="xl">mdi-close-circle</v-icon>
          </v-btn>
        </div>

        <!-- 2. Estado: Zona Dropzone (Sube / Arrastra) -->
        <div v-else>
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
            <v-card color="primary" dark>
              <v-card-text>
                Se están analizando los archivos, un momento por favor....
                <v-progress-linear
                  indeterminate
                  color="white"
                  class="mb-0 mt-2"
                ></v-progress-linear>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-input>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  props: {
    // Propiedad para interceptar las reglas pasadas por el v-form
    rules: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      isDragging: true,
      boolFile: false,
      payPath: 0,
      msgfile: "",
      file: null,
      errorState: false,
    };
  },
  computed: {
    // Retorna el ID cargado para que v-input valide si existe o es null
    archivoValido() {
      return this.$store.state.files.payPath || null;
    },
  },
  mounted() {
    this.$store.state.files.payPath = null;
    this.$store.state.files.datosPath = null;
  },
  methods: {
    ...mapActions(["_uploadFile"]),

    async handleDrop(event) {
      event.preventDefault();
      this.isDragging = false;
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles.length > 0) {
        this.file = droppedFiles[0];
        await this.uploadFile();
      }
    },

    openFileInput() {
      this.$refs.fileInput.$el.click();
    },

    async uploadFile() {
      const vm = this;
      if (!vm.file) return;

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
      vm.msgfile = "";

      try {
        await this._uploadFile(vm.file);
        Swal.fire({
          icon: "success",
          title: "Archivo Cargado Correctamente",
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
      }
    },

    eliminarFile() {
      this.$store.state.files.payPath = null;
      this.$store.state.files.datosPath = null;
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
  height: 100px;
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
  padding: 10px 16px;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
