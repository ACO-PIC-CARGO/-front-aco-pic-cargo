<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListBankComponent = defineAsyncComponent(() =>
  import("@/components/folderBanks/ListaBancosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Banco";
});
</script>

<template>
  <ListBankComponent />
</template>

<style></style>
