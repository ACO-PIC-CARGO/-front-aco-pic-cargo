<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListPersonaRol = defineAsyncComponent(
  () => import("../../../components/Security/RolPersona/ListPersonaRolComponent.vue"),
);

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "ASIGNAR ROLES A PERSONAS";
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
