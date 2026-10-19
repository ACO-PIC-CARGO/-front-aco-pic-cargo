<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListCoinsComponent = defineAsyncComponent(() => import("@/components/FolderCoins/ListaMonedasComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Monedas";
});
</script>

<template>
  <ListCoinsComponent />
</template>

<style></style>
