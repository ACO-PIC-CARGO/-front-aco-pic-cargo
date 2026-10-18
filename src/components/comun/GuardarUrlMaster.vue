<template>
  <v-container fluid>
    <v-card>
      <v-dialog
        :model-value="dialogUrl"
        scrollable
        persistent
        max-width="30%"
        transition="dialog-transition"
      >
        <v-card>
          <v-card-title> Actualizar URL Carpeta </v-card-title>
          <v-card-text>
            <v-btn
              color="success"
              size="small"
              :disabled="!masterEditar.url_folderonedrive"
              @click="to_link({ url: masterEditar.url_folderonedrive })"
            >
              Abrir <v-icon class="mx-1">mdi-folder-open-outline</v-icon>
            </v-btn>
            <v-divider class="my-3"></v-divider>
            <v-text-field
              label="Nueva URL"
              id="id"
              v-model="url_folderonedrive"
              :error-messages="err"
            ></v-text-field>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="success" @click="actualizarUrl">
                <v-icon>mdi-save</v-icon> Guardar
              </v-btn>
              <v-btn color="error" @click="cerrarDialog">Cerrar</v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
export default {
  emits: ["cerrar"],
  props: {
    dialogUrl: {
      type: Boolean,
      default: false,
    },
    masterEditar: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return { url_folderonedrive: "", err: "" };
  },
  methods: {
    ...mapActions(["actualizarURLEnElMaster"]),
    to_link({ url = "" }) {
      window.open(url, "_blank");
    },
    async actualizarUrl() {
      this.err = "";
      if (!this.url_folderonedrive) {
        this.err = "Dato requerido";
        return;
      }
      await this.actualizarURLEnElMaster({
        id: this.masterEditar.id,
        url: this.url_folderonedrive,
      });
      this.masterEditar.url_folderonedrive = this.url_folderonedrive;
      this.cerrarDialog();
    },
    cerrarDialog() {
      this.$emit("cerrar");
    },
  },
  watch: {
    dialogUrl() {
      this.url_folderonedrive = "";
    },
    url_folderonedrive() {
      this.err = "";
      if (this.url_folderonedrive.length == 0) {
        this.err = "Dato requerido";
      }
    },
  },
};
</script>

<style></style>
