<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import RoleFormComponent from "@/components/Roles/RoleFormComponent.vue";
import { useAppStore } from "@/stores/app";

const route = useRoute();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = route.params.id ? "MODIFICAR ROL" : "NUEVO ROL";
});
</script>

<template>
  <v-container fluid>
    <RoleFormComponent />
  </v-container>
</template>
