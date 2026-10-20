<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const EditarCliente = defineAsyncComponent(() =>
  import("@/components/folderEntities/Cliente/EditarClienteComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `MODIFICAR CLIENTE`;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <EditarCliente />
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.imagen-personalizada {
  margin: 5%;
  padding: auto;
  max-width: 100%; /* Ajusta el valor según tus necesidades */
  height: auto; /* Esto asegura que la altura se ajuste automáticamente */
}
</style>
