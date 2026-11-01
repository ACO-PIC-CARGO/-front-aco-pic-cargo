<script setup lang="ts">
import { onMounted } from "vue";
import RoleDetailComponent from "@/components/Roles/RoleDetailComponent.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "ROL DE USUARIOS – Modo Vista";
});
</script>

<template>
  <v-container fluid>
    <RoleDetailComponent />
  </v-container>
</template>
