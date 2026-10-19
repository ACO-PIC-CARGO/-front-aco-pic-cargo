<template>
  <v-container fluid>
    <Users />
    <v-navigation-drawer
      v-model="userStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterUsers />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useUserStore } from "@/stores/user";
export default {
  components: {
    Users: defineAsyncComponent(() => import("@/components/Users/ListUserComponet.vue")),
    FilterUsers: defineAsyncComponent(() => import("@/components/filtros/FilterUsers.vue")),
  },
  computed: {
    ...mapStores(useUserStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE USUARIOS`;
  },
};
</script>

<style></style>
