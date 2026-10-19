<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListIncotermComponent = defineAsyncComponent(() => import("@/components/FolderIncoterm/ListaIncotermsComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Incoterm";
});
</script>

<template>
  <ListIncotermComponent />
</template>

<style></style>
