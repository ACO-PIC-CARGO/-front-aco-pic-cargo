<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import listMasterCom from "@/components/folderHouse/ListHouseComponent.vue";
import FiltroHouse from "@/components/filtros/FiltroHouse.vue";

const appStore = useAppStore();
const housesStore = useHousesStore();

onMounted(() => {
  appStore.mainTitle = "LISTA DE EXPEDIENTES HOUSE's";
});
</script>

<template>
  <div>
    <listMasterCom />

    <v-navigation-drawer
      v-model="housesStore.house_filtrarData"
      location="right"

      width="30%"
      temporary
      v-if="housesStore.house_filtrarData"
    >
      <v-card elevation="0">
        <FiltroHouse />
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
