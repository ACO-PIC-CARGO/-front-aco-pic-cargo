<template>
  <v-container fluid>
    <Users />
    <v-navigation-drawer
      v-model="$store.state.user.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterUsers />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Users: defineAsyncComponent(() => import("@/components/Users/ListUserComponet.vue")),
    FilterUsers: defineAsyncComponent(() => import("@/components/filtros/FilterUsers.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE USUARIOS`;
  },
};
</script>

<style></style>
