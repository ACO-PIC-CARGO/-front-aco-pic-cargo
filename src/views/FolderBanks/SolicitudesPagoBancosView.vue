<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { request } from "@/utils/request";
import SolicitudesPagoBandeja from "@/components/folderBanks/SolicitudesPagoBandejaComponent.vue";
import type { OpcionFiltroSolicitudPago, TabBandejaSolicitudPago } from "@/types/billingEntries";

// Administración > Bancos > Solicitudes de Pago
const appStore = useAppStore();
const tab = ref<TabBandejaSolicitudPago>("PEN");
const opciones = ref<OpcionFiltroSolicitudPago[]>([]);
const totales = ref<Record<TabBandejaSolicitudPago, number | null>>({ PEN: null, REC: null, HIS: null });

const TABS: { valor: TabBandejaSolicitudPago; titulo: string; icono: string; color: string }[] = [
  { valor: "PEN", titulo: "Pendientes", icono: "mdi-clock-outline", color: "primary" },
  { valor: "REC", titulo: "Rechazadas", icono: "mdi-close-circle-outline", color: "error" },
  { valor: "HIS", titulo: "Histórico", icono: "mdi-history", color: "grey-darken-1" },
];

// aprobar / rechazar / subir soporte mueve la solicitud de pestaña: se recargan las tres
const bandejas = ref<InstanceType<typeof SolicitudesPagoBandeja>[]>([]);
function recargarTodas() {
  bandejas.value.forEach((b) => b.cargar());
}

onMounted(async () => {
  appStore.mainTitle = "BANCOS - SOLICITUDES DE PAGO";
  const response = await request<OpcionFiltroSolicitudPago>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_bandeja_filtros",
  });
  opciones.value = response.estadoflag ? response.data : [];
});
</script>

<template>
  <v-container
    fluid
    class="pt-2"
  >
    <v-card
      class="pa-4"
      rounded="lg"
    >
      <v-tabs
        v-model="tab"
        color="primary"
        class="mb-4"
      >
        <v-tab
          v-for="t in TABS"
          :key="t.valor"
          :value="t.valor"
          :prepend-icon="t.icono"
        >
          {{ t.titulo }}
          <v-chip
            v-if="totales[t.valor] !== null"
            size="x-small"
            class="ml-2"
            :color="t.color"
            variant="flat"
          >
            {{ totales[t.valor] }}
          </v-chip>
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <!-- eager: cada pestaña carga su primera página para mostrar los totales -->
        <v-tabs-window-item
          v-for="t in TABS"
          :key="t.valor"
          :value="t.valor"
          eager
        >
          <SolicitudesPagoBandeja
            ref="bandejas"
            :tab="t.valor"
            :opciones="opciones"
            @total="totales[t.valor] = $event"
            @actualizado="recargarTodas"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-container>
</template>
