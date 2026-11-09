<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useSecuritysStore } from "@/stores/securitys";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import { usePermissions } from "@/composables/usePermissions";
import type { ResumenEstadoCotizacion } from "@/types/cotizacion";

const ListQuote = defineAsyncComponent(() =>
  import("@/components/folderPricing/ListQuoteComponent.vue"));
const ListCall = defineAsyncComponent(() => import("@/components/folderPricing/ListCallComponent.vue"));
const FiltroQuote = defineAsyncComponent(() => import("@/components/filtros/FiltroQuote.vue"));
const FiltroCalls = defineAsyncComponent(() => import("@/components/filtros/FiltroCalls.vue"));
const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigCotizacion.vue"));

// ListCall: () => import("../folderPricing/comun/listCall.vue"),

const props = withDefaults(defineProps<{ pricingView?: "" | "pending_send" | "pricing_requested" }>(), {
  pricingView: "",
});

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
pricingStore.switchListView(props.pricingView);
const configEmpresaStore = useConfigEmpresaStore();
const masterusuariosStore = useMasterusuariosStore();
const securitysStore = useSecuritysStore();
const { can } = usePermissions();

const tabs = ref("quotes");
const dialog = ref(false);

function redirect() {
  nextTick(() => {
    router.push({
      name: "newQuote",
    });
  });
}
async function filtrarCotizaciones(item: ResumenEstadoCotizacion) {
  pricingStore.filtro.id_status = item.id;
  appStore.spiner = true;
  await pricingStore.reloadQuoteList();
  appStore.spiner = false;
}
async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialog.value = false;
}

onMounted(async () => {
  appStore.drawer = false;
  pricingStore.e1 = 1;
  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string) as { existecot?: boolean };
  dialog.value = !val.existecot;
  appStore.spiner = true;
  await Promise.all([pricingStore.getResumenPorEstado(), props.pricingView ? null : pricingStore.getQuoteCall()]);
  appStore.spiner = false;
  await Promise.all([
    pricingStore.cargarTrabajadores(),
    pricingStore.getQuoteStatus(),
    pricingStore.getMarketingList(),
    appStore.cargarClientes(),
    masterusuariosStore.cargarTemperaturaLeds(),
    // this.getListEnviadoCliente(),
    // this.getListRecibidoCotizacion(),
  ]);
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="">
        <v-row>
          <v-col
            cols="12"
            lg="2"
            xl="2"
            class="ocultarMovil"
            v-for="(item, index) in pricingStore.listadoResumen"
            :key="index"
          >
            <v-chip
              size="small"
              style="cursor: pointer"
              :color="item.color"
              variant="flat"
              @click="filtrarCotizaciones(item)"
            >
              {{ item.nombre_estado }}
              Total: {{ item.cantidad }}
            </v-chip>
          </v-col>

          <v-spacer />
          <v-btn
            v-if="can('lstQuote', 'NUEVO')"
            color="success"
            @click="redirect()"
            size="small"
            class="ml-auto my-auto mr-5"
          >
            NUEVA COTIZACIÓN
          </v-btn>
        </v-row>
      </v-card-title>
      <v-row>
        <v-col
          v-if="pricingView"
          cols="12"
        >
          <ListQuote />
        </v-col>
        <v-col
          v-else
          cols="12"
        >
          <v-tabs
            color="deep-purple-accent-4"
            align-tabs="end"
            v-model="tabs"
          >
            <v-tab value="quotes">
              Cotizaciones
            </v-tab>
            <v-tab value="calls">
              Llamadas
            </v-tab>
          </v-tabs>
          <v-tabs-window v-model="tabs">
            <v-tabs-window-item value="quotes">
              <ListQuote />
            </v-tabs-window-item>
            <v-tabs-window-item value="calls">
              <ListCall />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-card>
    <v-navigation-drawer
      v-model="pricingStore.filtrarQuoteFlag"
      location="right"
      width="40%"
      temporary
    >
      <v-card elevation="5">
        <FiltroQuote />
      </v-card>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="pricingStore.filtrarCallsFlag"
      location="right"
      width="40%"
      temporary
    >
      <v-card elevation="5">
        <FiltroCalls />
      </v-card>
    </v-navigation-drawer>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="guardarConfig()"
          >
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
