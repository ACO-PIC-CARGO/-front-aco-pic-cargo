<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListTypePhoneComponent = defineAsyncComponent(() => import("@/components/FolderTypePhone/ListaTiposTelefonoComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "TIPO DE TELÉFONO";
});
</script>

<template>
  <ListTypePhoneComponent />
</template>

<style></style>
