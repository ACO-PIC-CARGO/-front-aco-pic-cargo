<script setup lang="ts">
import { useRouter } from "vue-router";

const props = defineProps<{ file: { code_traffic: string; id_house: number } }>();

const router = useRouter();
const openFile = () => router.push({ name: "trafficVer", params: { id: props.file.id_house } });
</script>

<template>
  <v-alert
    type="info"
    variant="tonal"
    density="compact"
    class="mb-2"
  >
    <div class="d-flex flex-wrap align-center ga-2">
      <span>
        Esta cotización está en Tráfico como <strong>{{ file.code_traffic }}</strong>. Envíala a Operaciones desde Embarques.
      </span>
      <v-spacer />
      <v-btn
        size="small"
        color="primary"
        variant="flat"
        @click="openFile"
      >
        Abrir {{ file.code_traffic }}
      </v-btn>
    </div>
  </v-alert>
</template>
