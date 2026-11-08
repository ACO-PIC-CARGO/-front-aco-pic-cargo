<script setup lang="ts">
import PreviewQuote from "@/components/folderPricing/PreviewQuote.vue";
import type { DatosPrevisualizacion } from "@/types/cotizacion";

defineProps<{ data: DatosPrevisualizacion | null; index: number }>();
const emit = defineEmits<{ cerrar: [abierto: boolean] }>();
</script>

<template>
  <PreviewQuote
    :data="data"
    :index="index"
    @cerrar="emit('cerrar', $event)"
  />
</template>
