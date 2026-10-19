<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListMarketingComponent = defineAsyncComponent(() => import("@/components/FolderMarketing/ListaMarketingComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "TIPO DE MARKETING";
});
</script>

<template>
  <ListMarketingComponent />
</template>

<style></style>
