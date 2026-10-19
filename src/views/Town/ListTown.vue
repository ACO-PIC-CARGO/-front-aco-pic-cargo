<template>
  <v-container fluid>
    <Town />
    <v-navigation-drawer
      v-model="townStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useTownStore } from "@/stores/town";
export default {
  components: {
    Town: defineAsyncComponent(() => import("../../components/Town/ListTownComponet.vue")),
    FilterTown: defineAsyncComponent(() => import("../../components/filtros/FilterTown.vue")),
  },
  computed: {
    ...mapStores(useTownStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DISTRITOS`;
  },
};
</script>

<style></style>
