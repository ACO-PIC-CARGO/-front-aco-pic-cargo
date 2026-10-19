<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListYearComponent = defineAsyncComponent(() => import("@/components/FolderYear/ListaAniosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Años";
});
</script>

<template>
  <ListYearComponent />
</template>

<style></style>
