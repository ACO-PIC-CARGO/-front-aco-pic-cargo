<script setup lang="ts">
import { onMounted } from "vue";
import RoleListComponent from "@/components/Roles/RoleListComponent.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "LISTADO DE ROLES DE USUARIOS";
});
</script>

<template>
  <v-container fluid>
    <RoleListComponent />
  </v-container>
</template>
