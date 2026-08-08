<template>
  <div>
    <listMasterCom></listMasterCom>

    <v-navigation-drawer
      v-model="$store.state.house_filtrarData"
      right
      absolute
      bottom
      persistent
      width="30%"
      temporary
      v-if="$store.state.house_filtrarData"
    >
      <v-card elevation="0">
        <FiltroHouse />
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
<script>
import listMasterCom from "@/components/folderHouse/listHouse.vue";
import FiltroHouse from "@/components/filtros/FiltroHouse.vue";
export default {
  name: "listEntities",
  components: {
    listMasterCom,
    FiltroHouse,
  },
  data() {
    return {};
  },
  mounted() {
    this.$store.state.mainTitle = "LISTA DE EXPEDIENTES HOUSE's";
  },
};
</script>
