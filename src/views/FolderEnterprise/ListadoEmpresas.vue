<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListEnterpriseComponent = defineAsyncComponent(
  () => import("@/components/FolderEnterprise/ListadoEmpresasComponent.vue"),
);

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "EMPRESAS";
});
</script>

<template>
  <ListEnterpriseComponent />
</template>

<style></style>
