<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import { useAppStore } from "@/stores/app";
import { request } from "@/utils/request";
import SolicitudesCobroBandeja from "@/components/folderBanks/SolicitudesCobroBandejaComponent.vue";
import type { OpcionFiltroSolicitudCobro, TabBandejaSolicitudCobro } from "@/types/solicitudCobro";

// Operaciones > Facturación y Bancos > Ingresos pendientes por confirmar (solicitudes de cobro)
const appStore = useAppStore();
const { smAndDown } = useDisplay();
const tab = ref<TabBandejaSolicitudCobro>("PEN");
const opciones = ref<OpcionFiltroSolicitudCobro[]>([]);
const totales = ref<Record<TabBandejaSolicitudCobro, number | null>>({ PEN: null, REC: null, HIS: null });

const TABS: { valor: TabBandejaSolicitudCobro; titulo: string; icono: string; color: string }[] = [
  { valor: "PEN", titulo: "Pendientes", icono: "mdi-clock-outline", color: "primary" },
  { valor: "REC", titulo: "Rechazadas", icono: "mdi-close-circle-outline", color: "error" },
  { valor: "HIS", titulo: "Histórico", icono: "mdi-history", color: "grey-darken-1" },
];

// confirmar / rechazar / registrar mueve la solicitud de pestaña: la visible se consulta ya,
// las otras quedan pendientes hasta que se abren (no se consulta lo que no se ve)
const bandejas = ref<InstanceType<typeof SolicitudesCobroBandeja>[]>([]);
function recargarTodas() {
  bandejas.value.forEach((b) => b.cargar());
}

onMounted(async () => {
  appStore.mainTitle = "INGRESOS PENDIENTES POR CONFIRMAR";
  const response = await request<OpcionFiltroSolicitudCobro>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_bandeja_filtros",
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
      <v-tabs
        v-model="tab"
        color="primary"
        :grow="smAndDown"
        density="compact"
        class="mb-3"
      >
        <v-tab
          v-for="t in TABS"
          :key="t.valor"
          :value="t.valor"
          :prepend-icon="smAndDown ? undefined : t.icono"
        >
          <v-icon
            v-if="smAndDown"
            size="20"
          >
            {{ t.icono }}
          </v-icon>
          <span :class="{ 'ml-1': smAndDown }">{{ t.titulo }}</span>
          <v-badge
            v-if="totales[t.valor] !== null"
            :content="totales[t.valor]!"
            :color="t.color"
            inline
          />
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item
          v-for="t in TABS"
          :key="t.valor"
          :value="t.valor"
          eager
        >
          <SolicitudesCobroBandeja
            ref="bandejas"
            :tab="t.valor"
            :opciones="opciones"
            :activa="tab === t.valor"
            @total="totales[t.valor] = $event"
            @actualizado="recargarTodas"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-container>
</template>
