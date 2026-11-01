<script setup lang="ts">
import { onMounted } from "vue";
import PermissionListComponent from "@/components/Roles/PermissionListComponent.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "LISTADO DE PERMISOS";
});
</script>

<template>
  <v-container fluid>
    <PermissionListComponent />
  </v-container>
</template>
