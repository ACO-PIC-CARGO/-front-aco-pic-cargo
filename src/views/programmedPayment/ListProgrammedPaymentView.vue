<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const LitProgrammedPaymentView = defineAsyncComponent(() =>
  import("../../components/ProgrammedPayment/ListProgrammedPaymentComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "LISTADO DE PAGOS PROGRAMADOS";
});
</script>

<template>
  <LitProgrammedPaymentView />
</template>

<style></style>
