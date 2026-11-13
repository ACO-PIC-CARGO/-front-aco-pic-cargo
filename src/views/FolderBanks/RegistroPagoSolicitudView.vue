<script setup lang="ts">
import { useRoute } from "vue-router";
import registroPayForProveedor from "@/components/folderBanks/RegistroPayForProveedorComponent.vue";

const route = useRoute();
</script>

<template>
  <registroPayForProveedor
    :key="String(route.params.token)"
    tipo="nuevo"
    :token="String(route.params.token)"
  />
</template>
