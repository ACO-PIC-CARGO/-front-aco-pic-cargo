<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import listControlGastosCom from "@/components/folderBilling/ListControlGastosComponent.vue";
import FiltroControlGastos from "@/components/filtros/FiltroControlGastos.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "LISTA DE CONTROL DE GASTOS";
});
</script>

<template>
  <div>
    <listControlGastosCom></listControlGastosCom>

    <v-navigation-drawer
      v-model="rootStore.state.cg_filtrarData"
      location="right"
      
      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroControlGastos />
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
