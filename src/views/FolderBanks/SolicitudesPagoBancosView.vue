<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import { useAppStore } from "@/stores/app";
import { request } from "@/utils/request";
import SolicitudesPagoBandeja from "@/components/folderBanks/SolicitudesPagoBandejaComponent.vue";
import type { OpcionFiltroSolicitudPago, TabBandejaSolicitudPago } from "@/types/billingEntries";

// Administración > Bancos > Solicitudes de Pago
const appStore = useAppStore();
// en celular menos margen para que las tarjetas tengan ancho
const { smAndDown } = useDisplay();
const tab = ref<TabBandejaSolicitudPago>("PEN");
const opciones = ref<OpcionFiltroSolicitudPago[]>([]);
const totales = ref<Record<TabBandejaSolicitudPago, number | null>>({ PEN: null, PPG: null, REC: null, HIS: null });

const TABS: { valor: TabBandejaSolicitudPago; titulo: string; icono: string; color: string }[] = [
  { valor: "PEN", titulo: "Pendientes", icono: "mdi-clock-outline", color: "primary" },
  // pasaron las validaciones y aún no se pagan / registran en Bancos
  { valor: "PPG", titulo: "Pendiente de Pago", icono: "mdi-cash-clock", color: "warning" },
  { valor: "REC", titulo: "Rechazadas", icono: "mdi-close-circle-outline", color: "error" },
  { valor: "HIS", titulo: "Histórico", icono: "mdi-history", color: "grey-darken-1" },
];

// Al entrar se cargan las cuatro pestañas. Cualquier acción (aprobar, rechazar, editar, eliminar,
// subir soporte, registrar...) recarga las cuatro. Volver a la ventana (alt+tab) no consulta nada.
const bandejas = ref<InstanceType<typeof SolicitudesPagoBandeja>[]>([]);
function recargarTodas() {
  bandejas.value.forEach((b) => b.cargar());
}

// Ya no se recargan las cuatro pestañas al volver a la pestaña del navegador (eran 3 consultas cada vez):
// se usa el botón "Actualizar" de la bandeja.

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
    :class="smAndDown ? 'pa-1' : 'pt-2'"
  >
    <v-card
      :class="smAndDown ? 'pa-2' : 'pa-4'"
      rounded="lg"
    >
      <!-- celular: las cuatro pestañas siempre visibles, a lo ancho y con su contador -->
      <div
        v-if="smAndDown"
        class="spbv-tabs"
        role="tablist"
      >
        <button
          v-for="t in TABS"
          :key="t.valor"
          type="button"
          role="tab"
          class="spbv-tab"
          :class="[`spbv-tab--${t.valor}`, { 'spbv-tab--activa': tab === t.valor }]"
          :aria-selected="tab === t.valor"
          @click="tab = t.valor"
        >
          <span class="spbv-tab__icon">
            <v-icon size="20">{{ t.icono }}</v-icon>
            <span
              v-if="totales[t.valor] !== null"
              class="spbv-tab__count"
            >{{ totales[t.valor] }}</span>
          </span>
          <span class="spbv-tab__label">{{ t.titulo }}</span>
        </button>
      </div>
      <v-tabs
        v-else
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
        <!-- solo la pestaña visible consulta; el total de las otras aparece al abrirlas -->
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

<style scoped>
.spbv-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 16px;
  background: #eef3fb;
}
.spbv-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 8px 4px 7px;
  border-radius: 12px;
  color: #5b6b86;
  font-size: 0.8rem;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.spbv-tab__icon {
  position: relative;
  display: inline-flex;
}
.spbv-tab__count {
  position: absolute;
  top: -6px;
  left: calc(100% - 4px);
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #94a3b8;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}
/* cuatro pestañas: "Pendiente de Pago" pasa a dos líneas en vez de cortarse */
.spbv-tab__label {
  max-width: 100%;
  line-height: 1.15;
  text-align: center;
}
.spbv-tab--activa {
  background: #fff;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.14);
}
.spbv-tab--PEN.spbv-tab--activa { color: #1e5bd8; }
.spbv-tab--PPG.spbv-tab--activa { color: #b45309; }
.spbv-tab--REC.spbv-tab--activa { color: #c62828; }
.spbv-tab--HIS.spbv-tab--activa { color: #374151; }
.spbv-tab--PEN.spbv-tab--activa .spbv-tab__count { background: #1e5bd8; }
.spbv-tab--PPG.spbv-tab--activa .spbv-tab__count { background: #b45309; }
.spbv-tab--REC.spbv-tab--activa .spbv-tab__count { background: #c62828; }
.spbv-tab--HIS.spbv-tab--activa .spbv-tab__count { background: #374151; }
</style>
