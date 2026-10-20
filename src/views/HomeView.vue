<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import HelloWorld from "../components/HelloWorld.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.dataControl_id_user = JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id;
});
</script>

<template>
  <hello-world />
</template>
