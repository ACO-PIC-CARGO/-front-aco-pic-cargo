<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const LitProgrammedPaymentView = defineAsyncComponent(() =>
  import("../../components/ProgrammedPayment/ListProgrammedPaymentComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "LISTADO DE PAGOS PROGRAMADOS";
});
</script>

<template>
  <LitProgrammedPaymentView />
</template>

<style></style>
