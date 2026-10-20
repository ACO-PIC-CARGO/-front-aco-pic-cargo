<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const Users = defineAsyncComponent(() => import("@/components/Users/EditUserComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `EDITAR USUARIO`;
});
</script>

<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<style></style>
