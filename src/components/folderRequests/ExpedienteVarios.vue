<script setup lang="ts">
// Celda "Expediente" de una solicitud: si viene del Reporte de Cuentas por Pagar / por Cobrar con más de un
// expediente muestra "Varios" + "Ver Detalle" (modal Expedientes Asociados); si no, el contenido de siempre (slot).
import { computed, ref } from "vue";
import { tieneVariosExpedientes } from "@/utils/solicitudVista";
import ExpedientesAsociadosDialog from "./ExpedientesAsociadosDialog.vue";
import type { TipoSolicitudReporte } from "@/types/solicitudReporte";

const props = defineProps<{
  tipo: TipoSolicitudReporte;
  solicitud: {
    id?: number | null;
    codigo?: string | null;
    expediente?: string | null;
    correlativo?: string | null;
    multiexpedienteflag?: boolean | null;
    /** Control de Gastos: expedientes de la solicitud del reporte separados por coma */
    expedientes_solicitud?: string | null;
  };
  /** solo el botón "Ver Detalle" (tarjetas de Control de Gastos, que no muestran el expediente) */
  soloBoton?: boolean;
}>();

/** más de un expediente (o correlativo): la bandeja los manda separados por coma */
const varios = computed(() => tieneVariosExpedientes(props.solicitud));
const abierto = ref(false);
</script>

<template>
  <span
    v-if="varios"
    class="expvarios"
  >
    <b
      v-if="!soloBoton"
      class="expvarios__texto"
    >Varios</b>
    <v-btn
      size="small"
      variant="flat"
      color="primary"
      prepend-icon="mdi-eye-outline"
      class="expvarios__btn"
      data-modo-ver="permitido"
      @click.stop="abierto = true"
    >
      Ver Detalle
    </v-btn>
    <ExpedientesAsociadosDialog
      v-model="abierto"
      :tipo="tipo"
      :id-solicitud="solicitud.id ?? null"
      :codigo="solicitud.codigo ?? null"
    />
  </span>
  <slot v-else />
</template>

<style scoped>
.expvarios {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.expvarios__texto {
  color: #0a1f44;
}
/* botón visible: sólido, texto legible y sin cortarse en la celda */
.expvarios__btn {
  min-width: 118px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
}
</style>
