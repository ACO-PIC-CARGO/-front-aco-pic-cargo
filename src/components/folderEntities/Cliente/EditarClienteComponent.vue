<script setup lang="ts">
import ClienteFicha from "./ClienteFicha.vue";

// isPricing is accepted so the house/quote dialog's attribute does not land on the page's root element.
withDefaults(defineProps<{ houseIdConsigner?: number | null; isPricing?: boolean }>(), {
  houseIdConsigner: null,
  isPricing: false,
});
</script>

<template>
  <ClienteFicha
    mode="editar"
    :house-id-consigner="houseIdConsigner"
  />
</template>
