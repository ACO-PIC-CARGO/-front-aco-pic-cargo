<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <NuevoComponent :isPricing="false" />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    NuevoComponent: defineAsyncComponent(() =>
      import("@/components/folderEntities/Cliente/NuevoClienteComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `REGISTRAR CLIENTE`;
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
