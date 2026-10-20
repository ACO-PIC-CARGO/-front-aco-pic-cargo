<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function nueva() {
  router.push({
    name: "newConsolidation",
  });
}
</script>

<template>
  <div>
    <v-btn
      @click="nueva()"
      color="success"
      variant="text"
    >
      Nueva
    </v-btn>
  </div>
</template>

<style></style>
