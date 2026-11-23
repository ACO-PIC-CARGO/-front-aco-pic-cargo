<script setup lang="ts">
// Nota bajo la marca de "ya solicitada" que avisa desde dónde se pidió la solicitud:
//  - origen "cg": se pidió desde Control de Gastos (se ve en el Reporte de Cuentas por Cobrar / Pagar)
//  - origen "adm": se pidió desde el Reporte, por Administración (se ve en Control de Gastos)
import { computed } from "vue";

const props = defineProps<{ origen: "cg" | "adm"; tipo: "pago" | "cobro" }>();

const titulo = computed(() => (props.origen === "cg" ? "Solicitada por Control de Gastos" : "Solicitada por Administración"));
const detalle = computed(() =>
  props.origen === "cg"
    ? `Revisar Solicitudes de ${props.tipo === "pago" ? "Pago" : "Cobro"} Pendiente`
    : "Comuníquese con el área administrativa",
);
</script>

<template>
  <span
    class="solorigen"
    role="note"
  >
    <v-icon
      size="14"
      class="solorigen__icono"
    >
      mdi-information-outline
    </v-icon>
    <span class="solorigen__texto">
      <b>{{ titulo }}</b>
      <span>{{ detalle }}</span>
    </span>
  </span>
</template>

<style scoped>
.solorigen {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  max-width: 100%;
  margin-top: 4px;
  color: #92400e;
  font-size: 0.6875rem;
  line-height: 1.25;
  text-align: left;
  /* las tarjetas y celdas donde va usan nowrap: la nota siempre baja de línea, no se corta */
  white-space: normal !important;
  overflow-wrap: anywhere;
}
.solorigen__texto,
.solorigen__texto > * {
  white-space: normal !important;
}
.solorigen__icono {
  flex-shrink: 0;
  margin-top: 1px;
  color: #b45309;
}
.solorigen__texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.solorigen__texto b {
  font-weight: 700;
}
</style>
