<template>
  <v-container>
    <v-row class="py-1">
      <v-col cols="12" md="6" class="py-1">
        <vTextarea
          v-model="lcl.pdf"
          label="Texto para envío de PDF"
          auto-grow
          outlined
          hide-details
        />
      </v-col>
      <v-col cols="12" md="6" class="py-1">
        <vTextarea
          v-model="lcl.link"
          label="Texto para envío de Link de Descarga"
          auto-grow
          outlined
          hide-details
        />
      </v-col>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="success" class="mt-4" @click="guardar">Guardar</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  data() {
    return {};
  },
  mounted() {
    // console.log("Texto WhatsApp LCL:", this.lcl);
  },
  methods: {
    ...mapActions("configuracion", ["setTextoWhatsappLCL"]),
    guardar() {
      // Lógica para guardar los textos
      this.setTextoWhatsappLCL({ lcl: this.lcl });
    },
  },
  computed: {
    ...mapState("configuracion", ["lcl"]),
  },
};
</script>

<style></style>
