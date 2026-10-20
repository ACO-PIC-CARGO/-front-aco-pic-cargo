<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";

const Users = defineAsyncComponent(() => import("@/components/Users/ListUserComponet.vue"));
const FilterUsers = defineAsyncComponent(() => import("@/components/filtros/FilterUsers.vue"));

const userStore = useUserStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE USUARIOS`;
});
</script>

<template>
  <v-container fluid>
    <Users />
    <v-navigation-drawer
      v-model="userStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterUsers />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
