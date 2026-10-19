<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useTypepaymentStore } from "@/stores/typepayment";

const TypePayment = defineAsyncComponent(() => import("../../components/TypePayment/ListTypePaymentComponent.vue"));
const FilterTypePayment = defineAsyncComponent(() => import("../../components/filtros/FilterTypePayment.vue"));

const typepaymentStore = useTypepaymentStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE TIPOS DE PAGO`;
});
</script>

<template>
  <v-container fluid>
    <TypePayment />
    <v-navigation-drawer
      v-model="typepaymentStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTypePayment />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
