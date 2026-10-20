<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import HelloWorld from "../components/HelloWorld.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.dataControl_id_user = JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id;
});
</script>

<template>
  <hello-world />
</template>
