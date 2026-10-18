<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <VerComponent />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  data() {
    return {
      code: "",
    };
  },
  components: {
    VerComponent: defineAsyncComponent(() =>
      import("@/components/folderEntities/Proveedor/verProveedorComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `VER PROVEEDOR`;
  },
};
</script>

<style scoped>
.imagen-personalizada {
  margin: auto;
  padding: auto;
  max-width: 80%; /* Ajusta el valor según tus necesidades */
  height: auto; /* Esto asegura que la altura se ajuste automáticamente */
}
</style>
