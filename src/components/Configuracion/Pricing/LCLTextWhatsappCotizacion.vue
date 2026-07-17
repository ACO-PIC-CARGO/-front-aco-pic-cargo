<template>
  <v-container>
    <v-row class="py-1">
      <v-col cols="12">

        <p style="font-size: 1.2em; font-weight: bold">Texto para envío de PDF</p>
      </v-col>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.pdfindividual"
          label=""
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span>Texto para envío de PDF - INDIVIDUAL</span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6">
      
        <vTextarea
          v-model="lcl.pdfgrupal"
          label="Texto para envío de PDF - GRUPAL"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span>Texto para envío de PDF - GRUPAL</span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12">
      <p style="font-size: 1.2em; font-weight: bold">Texto para envío de LINK</p>
      </v-col>
      <!-- <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.linkindividual"
          label="Texto para envío de LINK - INDIVIDUAL"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK - INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.linkgrupal"
          label="Texto para envío de LINK - GRUPAL"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK - GRUPAL </span>
          </template>
        </vTextarea>
      </v-col> -->

      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="success" class="mt-4" :loading="loading" @click="guardar"
          >Guardar</v-btn
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  data() {
    return {
      loading: false,
    };
  },
  mounted() {
    // console.log("Texto WhatsApp LCL:", this.lcl);
  },
  methods: {
    ...mapActions("configuracion", ["setTextoWhatsappLCL"]),
    async guardar() {
      // Lógica para guardar los textos
      this.loading = true;
      await this.setTextoWhatsappLCL({ lcl: this.lcl });
      this.loading = false;
    },
  },
  computed: {
    ...mapState("configuracion", ["lcl"]),
  },
};
</script>

<style></style>
