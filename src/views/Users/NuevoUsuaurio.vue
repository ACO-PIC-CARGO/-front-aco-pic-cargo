<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const Users = defineAsyncComponent(() => import("@/components/Users/NuevoUserComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `NUEVO USUARIO`;
});
</script>

<template>
  <v-container fluid>
    <Users />
  </v-container>
</template>

<style></style>
