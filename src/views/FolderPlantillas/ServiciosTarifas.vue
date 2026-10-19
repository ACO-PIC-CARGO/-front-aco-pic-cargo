<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import ServiciosTarifasComponent from "@/components/FolderPlantillas/ServiciosTarifasComponent.vue";
import EditarTarifasComponent from "@/components/FolderPlantillas/EditarTarifasComponent.vue";

const route = useRoute();
const rootStore = useStore();

const componentKey = ref(0);

const modoEditar = computed(() => {
  return route.query.modo === 'editar' && route.query.cotizacion;
});

onMounted(async () => {
  if (rootStore.state.spinner !== undefined) {
    rootStore.state.spinner = true;
  }
  await Promise.all([
    rootStore.dispatch("getModality"),
    rootStore.dispatch("getShipment"),
    rootStore.dispatch("_getProveedor"),
  ]);
  if (rootStore.state.spinner !== undefined) {
    rootStore.state.spinner = false;
  }
});
watch(() => route.query, () => {
  // Forzar remount del componente cuando cambian los query parameters
  componentKey.value += 1;
});
</script>

<template>
  <div>
    <!-- Lista de cotizaciones -->
    <ServiciosTarifasComponent 
      v-if="!modoEditar"
      :key="componentKey" 
      :initial-shipment-code="route.query.shipment as string"
    />
    
    <!-- Edición de tarifas específicas -->
    <EditarTarifasComponent 
      v-else
      :key="componentKey" 
    />
  </div>
</template>

<style scoped>
</style>
