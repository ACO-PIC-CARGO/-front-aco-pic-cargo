<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const NuevoComponent = defineAsyncComponent(() =>
  import("@/components/folderEntities/Proveedor/NuevoProveedorComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `REGISTRAR PROVEEDOR`;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <NuevoComponent :is-pricing="false" />
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.imagen-personalizada {
  margin: auto;
  padding: auto;
  max-width: 80%; /* Ajusta el valor según tus necesidades */
  height: auto; /* Esto asegura que la altura se ajuste automáticamente */
}
</style>
