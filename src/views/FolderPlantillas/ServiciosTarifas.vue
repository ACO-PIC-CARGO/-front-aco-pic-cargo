<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import ServiciosTarifasComponent from "@/components/FolderPlantillas/ServiciosTarifasComponent.vue";
import EditarTarifasComponent from "@/components/FolderPlantillas/EditarTarifasComponent.vue";
import { usePricingStore } from "@/stores/pricing";

const route = useRoute();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const undeclaredAppState = appStore as typeof appStore & { spinner?: boolean };

const componentKey = ref(0);

const modoEditar = computed(() => {
  return route.query.modo === 'editar' && route.query.cotizacion;
});

onMounted(async () => {
  if (undeclaredAppState.spinner !== undefined) {
    undeclaredAppState.spinner = true;
  }
  await Promise.all([
    pricingStore.getModality(),
    pricingStore.getShipment(),
    appStore._getProveedor(),
  ]);
  if (undeclaredAppState.spinner !== undefined) {
    undeclaredAppState.spinner = false;
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
