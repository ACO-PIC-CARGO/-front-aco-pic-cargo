<script setup lang="ts">
import { computed } from "vue";
import type { ClientePagoEstado } from "@/types/billingEntries";

// "Cliente Pagó" de una solicitud de pago: el cliente de esos costos pagó todo, una parte o nada.
// Lo usan Control de Gastos > Solicitudes de Pagos Administración y Bancos > Solicitudes de Pago.
const props = defineProps<{ estado?: ClientePagoEstado | null }>();

const CHIPS: Record<ClientePagoEstado, { texto: string; color: string; icono: string; ayuda: string }> = {
  SI: { texto: "Sí", color: "success", icono: "mdi-check-circle", ayuda: "El cliente pagó todo" },
  PARCIAL: { texto: "Parcial", color: "orange-darken-1", icono: "mdi-circle-half-full", ayuda: "El cliente pagó una parte" },
  NO: { texto: "No", color: "error", icono: "mdi-close-circle", ayuda: "El cliente no tiene ningún pago" },
};

const chip = computed(() => (props.estado ? CHIPS[props.estado] : null));
</script>

<template>
  <v-chip
    v-if="chip"
    :color="chip.color"
    :prepend-icon="chip.icono"
    :title="chip.ayuda"
    size="small"
    variant="flat"
    class="font-weight-bold"
  >
    {{ chip.texto }}
  </v-chip>
  <span
    v-else
    class="text-medium-emphasis"
  >—</span>
</template>
