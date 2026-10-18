<script setup lang="ts">
import { ref } from "vue";

const numero = ref("51998146389");

function abriChat() {
  const text = `https://api.whatsapp.com/send/?phone=${numero.value}&text=Hola, ACO. Me gustaría contactar con alguien&type=phone_number&app_absent=0`;
  window.open(text);
}
</script>

<template>
  <v-btn
    color="success"
    class="mt-10 mb-4 mr-4 py-6 btnChatea"
    position="fixed"
    location="bottom right"
    @click="abriChat()"
  >
    <v-icon
      class="mx-5"
      size="x-large"
    >
      mdi-whatsapp
    </v-icon>
    Chatea con nosotros
  </v-btn>
</template>

<style scoped>
@media (min-width: 919px) {
  .btnChatea {
    margin-top: 100px !important;
  }
}
</style>
