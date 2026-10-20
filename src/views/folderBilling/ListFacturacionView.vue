<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import listControlGastosCom from "@/components/folderBilling/ListadoFacturacion.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "LISTA DE FACTURAS";
});
</script>

<template>
  <div>
    <listControlGastosCom></listControlGastosCom>
  </div>
</template>
