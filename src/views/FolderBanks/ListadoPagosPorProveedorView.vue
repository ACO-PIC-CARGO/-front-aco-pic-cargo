<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import listPayForProveedor from "@/components/folderBanks/ListPayForProveedorComponent.vue";
import pagosPorProveedorDetallado from "../../components/folderBanks/PagosPorProveedorDetalladoComponent.vue";

const appStore = useAppStore();
const tab = ref("agrupado");

onMounted(() => {
  appStore.mainTitle = "LISTADO DE SALIDAS";
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
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="agrupado">
        <listPayForProveedor />
      </v-tabs-window-item>
      <v-tabs-window-item value="detallado">
        <pagosPorProveedorDetallado />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<style></style>
