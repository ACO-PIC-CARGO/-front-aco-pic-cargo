<template>
  <v-btn
    color="success"
    class="mt-10 py-6 btnChatea"
    fixed
    location="bottom right"
    
    @click="abriChat()"
  >
    <v-icon class="mx-5" size="x-large">mdi-whatsapp</v-icon>
    Chatea con nosotros
  </v-btn>
</template>

<script>
export default {
  data() {
    return {
      numero: "51998146389",
    };
  },
  methods: {
    abriChat() {
      let text = `https://api.whatsapp.com/send/?phone=${this.numero}&text=Hola, ACO. Me gustaría contactar con alguien&type=phone_number&app_absent=0`;
      window.open(text);
    },
  },
};
</script>
<style scoped>
@media (min-width: 919px) {
  .btnChatea {
    margin-top: 100px !important;
  }
}
</style>
