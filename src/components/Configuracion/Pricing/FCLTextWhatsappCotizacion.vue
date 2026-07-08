<template>
  <v-container>
    <v-row v-for="(text, index) in textoWhasappFCL" :key="index">
      <v-col cols="12" md="6">
        <vTextarea
          v-model="text.texto.pdf"
          :label="`Texto para envío de PDF - ${text.name}`"
          auto-grow
          outlined
        />
      </v-col>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="text.texto.link"
          :label="`Texto para envío de Link de Descarga - ${text.name}`"
          auto-grow
          outlined
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      textoWhasappFCL: [
        {
          id_container: 1,
          name: "20C'",
          texto: {
            pdf: "dssssssssssssssss",
            link: "sssssssssss",
          },
        },
        {
          id_container: 2,
          name: "40C'",
          texto: {
            pdf: "dssssssssssssssss",
            link: "sssssssssss",
          },
        },
      ],
    };
  },
  methods: {
    guardar() {
      // Lógica para guardar los textos
      console.log("Textos guardados");
    },
  },
};
</script>

<style></style>
