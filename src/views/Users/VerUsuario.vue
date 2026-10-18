<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Users: defineAsyncComponent(() => import("@/components/Users/VerUserComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `VER USUARIO`;
  },
};
</script>

<style></style>
