<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import listPayForCliente from "../../components/folderBanks/ListPayForClienteComponent.vue";
// Cambia la "l" por "L"
import listPayForClienteDetalle from "../../components/folderBanks/ListPayForClienteDetalles.vue";

const appStore = useAppStore();
const tab = ref("agrupado");

onMounted(() => {
  appStore.mainTitle = "LISTADO DE INGRESOS";
});
</script>

<template>
  <v-container
    fluid
    class="pt-0 mt-0"
  >
    <v-tabs
      v-model="tab"
      align-tabs="center"
    >
      <v-tab
        color="primary"
        value="agrupado"
      >
        Datos Agrupado
      </v-tab>

      <v-tab value="detallado">
        Detallado
      </v-tab>
    </v-tabs>
    <v-tabs-window
      v-model="tab"
      class="fill-height"
    >
      <v-tabs-window-item value="agrupado">
        <listPayForCliente />
      </v-tabs-window-item>
      <v-tabs-window-item value="detallado">
        <listPayForClienteDetalle />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<style></style>
