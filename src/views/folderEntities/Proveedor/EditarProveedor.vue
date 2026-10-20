<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const EditarProveedor = defineAsyncComponent(() =>
  import("@/components/folderEntities/Proveedor/EditarProveedorComponet.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `MODIFICAR PROVEEDOR`;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <EditarProveedor />
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
