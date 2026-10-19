<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListModalityComponent = defineAsyncComponent(() => import("@/components/FolderModality/ListaModalidadesComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "MODALIDADES (SENTIDOS)";
});
</script>

<template>
  <ListModalityComponent />
</template>

<style></style>
