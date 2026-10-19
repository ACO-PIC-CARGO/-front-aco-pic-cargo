<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useAirlinesStore } from "@/stores/airlines";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";

const listQuoteStatus = defineAsyncComponent(() => import("./../../components/StatusQuote/ListQuoteStatusComponent.vue"));
const FilterQuoteStatus = defineAsyncComponent(() => import("../../components/filtros/FiltroQuoteStatus.vue"));

const QuoteStatusStore = useQuoteStatusStore();
const airlinesStore = useAirlinesStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE ESTADOS DE LA COTIZACIÓN`;
});
</script>

<template>
  <v-container fluid>
    <listQuoteStatus />
    <v-navigation-drawer
      v-model="QuoteStatusStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterQuoteStatus :type="airlinesStore.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
