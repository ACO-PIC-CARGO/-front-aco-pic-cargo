<script setup lang="ts">
import { useRoute } from "vue-router";
import registroPayForCliente from "@/components/folderBanks/RegistroPayForClienteComponent.vue";

// Bancos > Nuevo Ingreso precargado desde una Solicitud de Cobro confirmada
const route = useRoute();
</script>

<template>
  <registroPayForCliente
    :key="String(route.params.token)"
    :token="String(route.params.token)"
  />
</template>
