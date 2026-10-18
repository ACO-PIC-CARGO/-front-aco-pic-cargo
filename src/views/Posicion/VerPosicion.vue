<template>
  <v-container>
    <Posicion  />
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Posicion: defineAsyncComponent(() => import("../../components/Posicion/VerPosicionComponet.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `ROLES DE USUARIOS DEL SISTEMA – Modo Vista`;
  },
};
</script>

<style></style>
