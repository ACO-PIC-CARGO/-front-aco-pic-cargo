<template>
  <v-card class="py-0">
    <v-card-text>
      <div v-if="$store.state.files.payPath" class="clsArchivoCargado">
        <span><b>Archivo Cargado:</b></span>
        {{ file.name }}
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
      <div v-else>
        <div
          class="drop-area"
          @dragover.prevent
          @drop="handleDrop"
          @click="openFileInput"
          v-if="!loading"
        >
          <label>
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
        <div v-else>
          <v-card color="primary" dark>
            <v-card-text>
              Se está analizando los archivos, un momento por favor....
              <v-progress-linear
                indeterminate
                color="white"
                class="mb-0"
              ></v-progress-linear>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  data() {
    return {
      loading: false,
      isDragging: true,
      boolFile: false,
      payPath: 0,
      msgfile: "",
      file: null,
    };
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

      // 1. Validar el tipo de archivo (PDF o Imagen)
      const isValidType =
        vm.file.type === "application/pdf" || vm.file.type.startsWith("image/");

      if (!isValidType) {
        vm.file = null; // Limpiar el archivo inválido
        Swal.fire({
          icon: "error",
          title: "Formato no válido",
          text: "Por favor, selecciona únicamente una imagen o un archivo PDF.",
        });
        return;
      }

      // 2. Iniciar la carga si el archivo es válido
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
      this.file = null; // También limpiamos la variable local
    },
  },
};
</script>

<style scoped>
.drop-area {
  width: 100%;
  height: 150px;
  border: 2px dashed #ccc;
  text-align: center;
  line-height: 150px;
  cursor: pointer;
  background: #fafafa;
}
.clsArchivoCargado {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #e8f5e9;
}
</style>
