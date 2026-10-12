<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Users: defineAsyncComponent(() => import("@/components/Users/NuevoUserComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `NUEVO USUARIO`;
  },
};
</script>

<style></style>
