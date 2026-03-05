<template>
  <v-card-text>
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
  </v-card-text>
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
      if (vm.file) {
        await this._uploadFile(vm.file);
        vm.$emit("idArchivoCargado", {
          id: vm.$store.state.files.payPath,
          archivo: vm.$store.state.files.datosPath,
        });
      }
    },
  },
};
</script>

<style></style>
