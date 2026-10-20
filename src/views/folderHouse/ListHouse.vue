<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import listMasterCom from "@/components/folderHouse/ListHouseComponent.vue";
import FiltroHouse from "@/components/filtros/FiltroHouse.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "LISTA DE EXPEDIENTES HOUSE's";
});
</script>

<template>
  <div>
    <listMasterCom />

    <v-navigation-drawer
      v-model="rootStore.state.house_filtrarData"
      location="right"

      width="30%"
      temporary
      v-if="rootStore.state.house_filtrarData"
    >
      <v-card elevation="0">
        <FiltroHouse />
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
