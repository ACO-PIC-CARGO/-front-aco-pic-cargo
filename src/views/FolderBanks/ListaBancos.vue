<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListBankComponent = defineAsyncComponent(() =>
  import("@/components/folderBanks/ListaBancosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Banco";
});
</script>

<template>
  <ListBankComponent />
</template>

<style></style>
