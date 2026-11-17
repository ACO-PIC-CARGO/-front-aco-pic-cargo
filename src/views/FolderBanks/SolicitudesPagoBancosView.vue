<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
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

// Control de Gastos puede cambiar una solicitud en otra pestaña: al volver aquí se recargan las tres
function recargarAlVolver() {
  if (document.visibilityState === "visible") recargarTodas();
}
onBeforeUnmount(() => document.removeEventListener("visibilitychange", recargarAlVolver));

onMounted(async () => {
  document.addEventListener("visibilitychange", recargarAlVolver);
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
      <!-- celular: las tres pestañas siempre visibles, a lo ancho y con su contador -->
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

<style scoped>
.spbv-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.spbv-tab__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spbv-tab--activa {
  background: #fff;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.14);
}
.spbv-tab--PEN.spbv-tab--activa { color: #1e5bd8; }
.spbv-tab--REC.spbv-tab--activa { color: #c62828; }
.spbv-tab--HIS.spbv-tab--activa { color: #374151; }
.spbv-tab--PEN.spbv-tab--activa .spbv-tab__count { background: #1e5bd8; }
.spbv-tab--REC.spbv-tab--activa .spbv-tab__count { background: #c62828; }
.spbv-tab--HIS.spbv-tab--activa .spbv-tab__count { background: #374151; }
</style>
