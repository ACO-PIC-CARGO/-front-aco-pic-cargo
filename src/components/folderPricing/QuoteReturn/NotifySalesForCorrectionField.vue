<script setup lang="ts">
defineProps<{ readonly?: boolean }>();
const notify = defineModel<boolean>({ required: true });
</script>

<template>
  <div>
    <div class="d-flex align-center rounded-lg bg-blue-lighten-5 pa-3 ga-3">
      <v-icon
        color="primary"
        size="28"
      >
        mdi-send-outline
      </v-icon>
      <div class="flex-grow-1 notify-sales__text">
        <div class="font-weight-bold">
          ¿Notificar a Ventas para Corrección?
        </div>
        <div class="text-body-medium">
          Pricing solicitará al vendedor corregir o completar la información de la cotización
        </div>
      </div>
      <v-btn-toggle
        v-model="notify"
        mandatory
        divided
        rounded="pill"
        color="primary"
        variant="outlined"
        density="comfortable"
        selected-class="bg-primary"
        class="flex-shrink-0"
        aria-describedby="notify-sales-note"
        :disabled="readonly"
      >
        <v-btn
          :value="true"
          :prepend-icon="notify ? 'mdi-check' : undefined"
        >
          Sí
        </v-btn>
        <v-btn
          :value="false"
          :prepend-icon="notify ? undefined : 'mdi-check'"
        >
          No
        </v-btn>
      </v-btn-toggle>
    </div>
    <div
      id="notify-sales-note"
      class="d-flex align-center rounded-lg bg-blue-lighten-5 pa-3 ga-3 mt-2 text-body-medium"
    >
      <v-icon color="primary">
        mdi-information
      </v-icon>
      <span>
        Al seleccionar 'Sí', la cotización se mostrará en el tab <strong>OBSERVADAS POR PRICING</strong> y se registrará la fecha de retorno a Ventas
      </span>
    </div>
  </div>
</template>

<style scoped>
.notify-sales__text {
  min-width: 0;
}
</style>
