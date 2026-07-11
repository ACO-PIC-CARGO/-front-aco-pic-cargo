<template>
  <div class="">
    <v-btn color="#25D366" dark @click="abrirModal">
      <v-icon class="mr-2">mdi-whatsapp</v-icon> ENVIAR A WHATSAPP
    </v-btn>
    <v-dialog v-model="dialog" persistent max-width="50%">
      <v-card>
        <v-card-title primary-title>
          <span style="font-size: 1.2em; font-weight: bold"
            >Mensaje para el cliente
          </span>
        </v-card-title>
        <v-card-text>
          <v-tabs v-model="tabIndex" centered slider-color="primary">
            <v-tab href="#pdfflag"> PDF </v-tab>
            <v-tab href="#linkflag"> LINK </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabIndex">
            <v-tab-item value="linkflag" class="px-10">
              <v-card-text>
                <v-textarea
                  v-model="texto_link"
                  auto-grow
                  outlined
                  class="my-2"
                />
              </v-card-text>
            </v-tab-item>
            <v-tab-item value="pdfflag" class="px-10">
              <v-textarea v-model="texto_pdf" auto-grow outlined class="my-2" />
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="enviarWsp" :loading="loading">
            Enviar
            {{ tabIndex == "pdfflag" ? "PDF" : "LINK" }} Cotización</v-btn
          >
          <v-btn color="error" @click="dialog = false" text :loading="loading"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      dialog: false,
      tabIndex: "pdfflag",
      loading: false,
    };
  },
  mounted() {
    this.obtenerDatosEmpresa();
  },
  computed: {
    ...mapState({
      texto_pdf: (state) => {
        const list = state.pricing.textWhatsapp;
        if (Array.isArray(list) && list.length > 0 && list[0]) {
          return list[0].texto_pdf || "";
        }
        return "Configuración no disponible";
      },
      texto_link: (state) => {
        const list = state.pricing.textWhatsapp;
        if (Array.isArray(list) && list.length > 0 && list[0]) {
          return list[0].texto_link || "";
        }
        return "Configuración no disponible";
      },
    }),
  },
  methods: {
    ...mapActions(["generarReporte", "obtenerDatosEmpresa"]),
    abrirModal() {
      this.dialog = true;
    },
   async enviarWsp() {
      this.loading = true;
      await this.generarReporte({
        enviarWspCliente: true,
        guardarFlag: true,
        textWhatsapp:
          this.tabIndex == "pdfflag" ? this.texto_pdf : this.texto_link,
        pdfflag: this.tabIndex == "pdfflag",
        linkflag: this.tabIndex == "linkflag",
      });
      this.loading = false;
      this.dialog =false
    },
  },
};
</script>

<style></style>
