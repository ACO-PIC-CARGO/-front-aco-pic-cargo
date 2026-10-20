<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const formularioControlGastos = defineAsyncComponent(() =>
  import("@/components/folderBilling/FrmControlGastosComponent.vue"));
</script>

<template>
  <formularioControlGastos :editable="false" />
</template>
