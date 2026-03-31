<template>
  <v-card>
    <v-card-text>
      <div v-if="archivoSubidoExitosamente">
        <span><b>Archivo Cargado:</b></span>
        {{ file ? file.name : "Archivo listo" }}

        <v-btn color="info" icon :href="rutaDescarga" target="_blank">
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
            Arrastra y suelta el archivo aquí
            <v-file-input
              ref="fileInput"
              v-model="file"
              hide-details
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
import axios from "axios";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      loading: false,
      isDragging: false, // Lo ideal es que inicie en false
      file: null, // Cambiado a null para mejor manejo de archivos
      msgfile: "",
      errfile: "", // Agregado porque lo usas en uploadFile

      // NUEVAS VARIABLES LOCALES (La clave del éxito 🔑)
      archivoSubidoExitosamente: false,
      rutaDescarga: "",
    };
  },
  mounted() {
    // Al montar el componente, limpiamos el store para evitar basura de cargas anteriores
    this.$store.state.files.payPath = null;
    this.$store.state.files.datosPath = null;
  },
  methods: {
    ...mapActions(["_uploadFile"]),

    async handleDrop(event) {
      this.loading = true;
      event.preventDefault();
      this.isDragging = false;
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles.length > 0) {
        this.file = droppedFiles[0];

        // El setTimeout que tenías para simular análisis
        setTimeout(async () => {
          await this.uploadFile();
          this.loading = false;
        }, 1000);
      } else {
        this.loading = false;
      }
    },

    openFileInput() {
      // Usamos el click nativo del input oculto
      this.$refs.fileInput.$el.querySelector("input").click();
    },

    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";

      if (this.file) {
        this.loading = true; // Aseguramos el loading también aquí
        try {
          await this._uploadFile(this.file);
          alert("Archivo Cargado");

          // 1. Guardamos los datos del store en variables de este componente hijo
          this.rutaDescarga = this.$store.state.files.datosPath
            ? this.$store.state.files.datosPath.ruta
            : "";
          this.archivoSubidoExitosamente = true;

          // 2. Emitimos los datos al padre
          this.$emit("archivo-cargado", {
            id: this.$store.state.files.payPath,
            archivo: this.$store.state.files.datosPath,
          });
        } catch (error) {
          console.error("Error al subir:", error);
        } finally {
          this.loading = false;
        }
      }
    },

    eliminarFile() {
      // 1. Notificamos al padre para que quite el check
      this.$emit("archivo-eliminado");

      // 2. Limpiamos el estado visual de ESTE hijo
      this.file = null;
      this.archivoSubidoExitosamente = false;
      this.rutaDescarga = "";

      // 3. Limpiamos el store global
      this.$store.state.files.payPath = null;
      this.$store.state.files.datosPath = null;
    },
  },
};
</script>
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
