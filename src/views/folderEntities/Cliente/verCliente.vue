<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <VerCliente />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    VerCliente: defineAsyncComponent(() =>
      import("@/components/folderEntities/Cliente/VerClienteComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `VER CLIENTE`;
  },
};
</script>

<style scoped>
.imagen-personalizada {
  margin: 5%;
  padding: auto;
  max-width: 100%; /* Ajusta el valor según tus necesidades */
  height: auto; /* Esto asegura que la altura se ajuste automáticamente */
}
</style>
