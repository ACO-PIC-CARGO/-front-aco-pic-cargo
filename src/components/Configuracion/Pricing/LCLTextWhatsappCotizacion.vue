<template>
  <v-container>
    <v-row class="py-1">
      <v-col cols="12" md="6">
        <p style="font-size: 1.2em; font-weight: bold">Texto para envío de PDF</p>
        <vTextarea
          v-model="lcl.pdf"
          label="Texto para envío de PDF"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span></span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6">
        <p style="font-size: 1.2em; font-weight: bold">
          Texto para envío de Link de Descarga
        </p>
        <vTextarea
          v-model="lcl.link"
          label="Texto para envío de Link de Descarga"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span></span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="success" class="mt-4"  :loading="loading" @click="guardar">Guardar</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  data() {
    return {
      loading:false,
    };
  },
  mounted() {
    // console.log("Texto WhatsApp LCL:", this.lcl);
  },
  methods: {
    ...mapActions("configuracion", ["setTextoWhatsappLCL"]),
    async guardar() {
      // Lógica para guardar los textos
      this.loading = true
      await this.setTextoWhatsappLCL({ lcl: this.lcl });
      this.loading = false
    },
  },
  computed: {
    ...mapState("configuracion", ["lcl"]),
  },
};
</script>

<style></style>
