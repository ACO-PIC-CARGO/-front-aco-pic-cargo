<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <v-alert
    type="info"
    variant="tonal"
    title="No encontramos este rol"
  >
    Puede que ya no exista o que no pertenezca a tu empresa. Vuelve al listado y elige otro rol.
    <div class="mt-3">
      <v-btn
        color="primary"
        variant="flat"
        @click="router.push({ name: 'lstPosition' })"
      >
        Volver al listado
      </v-btn>
    </div>
  </v-alert>
</template>
