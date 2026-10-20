<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListPersonaRol = defineAsyncComponent(
  () => import("../../../components/Security/RolPersona/ListPersonaRolComponent.vue"),
);

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "ASIGNAR ROLES A PERSONAS";
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <ListPersonaRol />
    </v-card>
  </v-container>
</template>

<style></style>
