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
export default {
  components: {
    Users: () => import("@/components/Users/ListUserComponet.vue"),
    FilterUsers: () => import("@/components/filtros/FilterUsers.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE USUARIOS`;
  },
};
</script>

<style></style>
