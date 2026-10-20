<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import CheckDebsComponent from "../../components/folderRequests/CheckDebsComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Abonos para confirmar";
});
</script>

<template>
  <div>
    <CheckDebsComponent />
  </div>
</template>
