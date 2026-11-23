<script setup lang="ts">
// Reporte de Cuentas por Cobrar / por Pagar: expediente ya amarrado a una solicitud (mismo diseño que la
// tarjeta "Solicitado a Administración" de Control de Gastos).
import { computed } from "vue";
import type { ExpedienteSolicitudReporte, TipoSolicitudReporte } from "@/types/solicitudReporte";
import SolicitudOrigenNota from "@/components/comun/SolicitudOrigenNota.vue";

const props = defineProps<{
  solicitud: ExpedienteSolicitudReporte;
  tipo: TipoSolicitudReporte;
  /** botón eliminar cargando */
  eliminando?: boolean;
}>();
// ver / editar / eliminar (editar y eliminar solo la registrada desde el reporte; la de Control de Gastos avisa)
defineEmits<{ ver: []; editar: []; eliminar: [] }>();
const rechazada = computed(() => props.solicitud.codigo_estado === "RECHAZADA");
</script>

<template>
  <span class="solamar-wrap">
    <span
      class="solamar"
      :class="{ 'solamar--rechazada': rechazada }"
      :title="`Solicitud ${solicitud.codigo_solicitud ?? ''} · ${solicitud.estado ?? ''}${solicitud.multiexpedienteflag ? ' · desde el reporte' : ''}`"
    >
      <span class="solamar__badge">
        <v-icon size="14">{{ rechazada ? "mdi-email-remove-outline" : "mdi-email-check-outline" }}</v-icon>
      </span>
      <span class="solamar__text">
        <span class="solamar__title">{{ solicitud.codigo_solicitud }}</span>
        <span class="solamar__estado">{{ solicitud.estado }}</span>
      </span>
      <!-- editar / eliminar solo donde se creó: desde el otro lado avisan dónde hacerlo -->
      <span class="solamar__acciones">
        <v-btn
          icon="mdi-eye-outline"
          size="x-small"
          variant="text"
          color="blue"
          density="comfortable"
          title="Ver solicitud"
          aria-label="Ver solicitud"
          @click.stop="$emit('ver')"
        />
        <v-btn
          icon="mdi-pencil-outline"
          size="x-small"
          variant="text"
          color="primary"
          density="comfortable"
          title="Editar solicitud (clave de administrador)"
          aria-label="Editar solicitud"
          @click.stop="$emit('editar')"
        />
        <v-btn
          icon="mdi-trash-can-outline"
          size="x-small"
          variant="text"
          color="error"
          density="comfortable"
          title="Eliminar solicitud (clave de administrador)"
          aria-label="Eliminar solicitud"
          :loading="eliminando"
          @click.stop="$emit('eliminar')"
        />
      </span>
    </span>
    <!-- pedida desde Control de Gastos: avisar dónde revisarla -->
    <SolicitudOrigenNota
      v-if="!solicitud.multiexpedienteflag"
      origen="cg"
      :tipo="tipo"
    />
  </span>
</template>

<style scoped>
.solamar-wrap {
  display: inline-flex;
  flex-direction: column;
  max-width: 100%;
  margin: 2px 0 2px 6px;
  vertical-align: middle;
}
.solamar-wrap .solorigen {
  max-width: 190px;
}
.solamar {
  --solamar-fg: #1d4ed8;
  --solamar-bg: #eff4ff;
  --solamar-border: #d1defc;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  max-width: 100%;
  padding: 2px 8px 2px 2px;
  border: 1px solid var(--solamar-border);
  border-radius: 10px;
  background: var(--solamar-bg);
  vertical-align: middle;
}
.solamar--rechazada {
  --solamar-fg: #c0261b;
  --solamar-bg: #fef3f2;
  --solamar-border: #fbd3cf;
}
.solamar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  color: var(--solamar-fg);
  box-shadow: 0 0 0 1px var(--solamar-border);
}
.solamar__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}
.solamar__title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--solamar-fg);
  white-space: nowrap;
}
.solamar__acciones {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 2px;
}
.solamar__estado {
  overflow: hidden;
  font-size: 0.6875rem;
  color: #667085;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
