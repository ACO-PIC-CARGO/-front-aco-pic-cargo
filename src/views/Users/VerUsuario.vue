<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const Users = defineAsyncComponent(() => import("@/components/Users/VerUserComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `VER USUARIO`;
});
</script>

<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<style></style>
