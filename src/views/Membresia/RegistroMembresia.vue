<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const OpcionesMembresia = defineAsyncComponent(() =>
  import("@/components/Membresia/OpcionesMembresia.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.drawer = false;
  appStore.mainTitle = "Membresía";
});
</script>

<template>
  <v-container fluid>
    <div class="centrado">
      <h4>¡Selecciona el/los módulos que deseas contratar para tu empresa!</h4>
    </div>
    <OpcionesMembresia />
  </v-container>
</template>

<style scope>
.centrado {
  text-align: center;
  align-content: center;
}
</style>
