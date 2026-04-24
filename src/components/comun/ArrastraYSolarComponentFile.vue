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
  // 1. Agregamos los props para recibir la data del padre
  props: {
    id: String,
    archivoInicial: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      isDragging: false,
      file: null,
      msgfile: "",
      errfile: "",
      archivoSubidoExitosamente: false,
      rutaDescarga: "",
    };
  },
  // 2. Agregamos un watch por si la data tarda un poco en llegar desde la BD
  watch: {
    archivoInicial: {
      handler(newValue) {
        // Si newValue existe y tiene una ruta (ya sea adentro de .archivo o directo)
        if (newValue && (newValue.ruta || newValue.archivo)) {
          this.cargarDataExistente(newValue);
        } else {
          // Si no hay archivo, reseteamos el estado visual
          this.archivoSubidoExitosamente = false;
          this.file = null;
        }
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    this.$store.state.files.payPath = null;
    this.$store.state.files.datosPath = null;
  },
  methods: {
    ...mapActions(["_uploadFile"]),

    // 3. Este método se encarga de pintar visualmente el archivo existente
    cargarDataExistente(data) {
      this.archivoSubidoExitosamente = true;
      this.rutaDescarga = data.archivo ? data.archivo.ruta : "";

      // Creamos un objeto similar al que genera el input de file nativo
      // para que se dibuje el nombre en la etiqueta {{ file.name }}
      this.file = {
        name: data.archivo ? data.archivo.name : "Archivo cargado",
      };
    },

    async handleDrop(event) {
      this.loading = true;
      event.preventDefault();
      this.isDragging = false;
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles.length > 0) {
        this.file = droppedFiles[0];

        setTimeout(async () => {
          await this.uploadFile();
          this.loading = false;
        }, 1000);
      } else {
        this.loading = false;
      }
    },

    openFileInput() {
      this.$refs.fileInput.$el.querySelector("input").click();
    },

    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";

      if (this.file) {
        this.loading = true;
        try {
          await this._uploadFile(this.file);
          alert("Archivo Cargado");

          this.rutaDescarga = this.$store.state.files.datosPath
            ? this.$store.state.files.datosPath.ruta
            : "";
          this.archivoSubidoExitosamente = true;

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
      this.$emit("archivo-eliminado");

      this.file = null;
      this.archivoSubidoExitosamente = false;
      this.rutaDescarga = "";

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
