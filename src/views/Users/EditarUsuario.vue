<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Users: defineAsyncComponent(() => import("@/components/Users/EditUserComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `EDITAR USUARIO`;
  },
};
</script>

<style></style>
