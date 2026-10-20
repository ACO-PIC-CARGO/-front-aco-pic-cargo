<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const VerComponent = defineAsyncComponent(() =>
  import("@/components/folderEntities/Proveedor/VerProveedorComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `VER PROVEEDOR`;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <VerComponent />
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
