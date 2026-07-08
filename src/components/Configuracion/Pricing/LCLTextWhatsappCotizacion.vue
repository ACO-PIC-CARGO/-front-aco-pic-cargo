<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.pdf"
          label="Texto para envío de PDF"
          auto-grow
          outlined
        />
      </v-col>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.link"
          label="Texto para envío de Link de Descarga"
          auto-grow
          outlined
        />
      </v-col>
      <v-col cols="12">
        <v-spacer></v-spacer>
        <v-btn color="primary" class="mt-4" @click="guardar">Guardar</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex';
export default {
  data() {
    return {
      textoWhasappLCL: {
        pdf: "dssssssssssssssss",
        link: "sssssssssss",
      },
    };
  },
  mounted() {
    console.log("Texto WhatsApp LCL:", this.lcl);
  },
  methods: {
    guardar() {
      // Lógica para guardar los textos
      console.log("Textos guardados",this.lcl);
    },
  },
  computed: {
    ...mapState("configuracion", ["lcl"]),
  },
};
</script>

<style></style>
