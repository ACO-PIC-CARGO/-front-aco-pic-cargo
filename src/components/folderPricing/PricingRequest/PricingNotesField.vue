<script setup lang="ts">
import { watch } from "vue";
import { usePricingStore } from "@/stores/pricing";
import { getPricingRequestInfo } from "./pricingRequestApi";

const props = withDefaults(defineProps<{ quoteId?: number | string | null; readonly?: boolean }>(), {
  quoteId: null,
  readonly: false,
});

const pricingStore = usePricingStore();

watch(
  () => props.quoteId !== null && String(pricingStore.id) === String(props.quoteId),
  async (quoteLoaded) => {
    if (!quoteLoaded) return;
    try {
      const response = await getPricingRequestInfo(props.quoteId!);
      if (response.estadoflag && response.data[0]) pricingStore.datosPrincipales.pricing_notes = response.data[0].pricing_notes;
    } catch {
      // Left undefined, the notes are not sent on save, so the stored ones are kept.
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-textarea
    v-model="pricingStore.datosPrincipales.pricing_notes"
    label="Notas a pricing"
    placeholder="Escribe lo que pricing debe saber para cotizar"
    :readonly="readonly"
    rows="3"
    auto-grow
  />
</template>
