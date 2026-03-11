<template>
  <v-card>
    <v-card-text>
      <div v-if="$store.state.files.payPath">
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
          <v-icon color="red" size="xl">mdi-close-circle</v-icon></v-btn
        >
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
              @click="openFileInput"
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
      isDragging: true,
      boolFile: false,
      payPath: 0,
      msgfile: "",
      file: "",
    };
  },
  mounted() {
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
        setTimeout(async () => {
          await this.uploadFile();
          this.loading = false;
        }, 1000);
      } else {
        this.loading = false;
      }
    },
    openFileInput() {
      this.$refs.fileInput.$el.click();
    },
    openFileInput() {
      this.$refs.fileInput.$el.click();
    },
    async uploadFile() {
      var vm = this;
      vm.msgfile = "";
      vm.errfile = "";
      console.log(vm.file);
      if (vm.file) {
        await this._uploadFile(vm.file);
        alert("Archivo Cargado");
        console.log(this.$store.state.files.datosPath);
        vm.$emit("idArchivoCargado", {
          id: vm.$store.state.files.payPath,
          archivo: vm.$store.state.files.datosPath,
        });
      }
    },
    eliminarFile() {
      this.$store.state.files.payPath = null;
      this.$store.state.files.datosPath = null;
    },
  },
};
</script>

<style></style>
