<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListSexComponent = defineAsyncComponent(() => import("@/components/FolderSex/ListaGenerosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Géneros";
});
</script>

<template>
  <ListSexComponent />
</template>

<style></style>
