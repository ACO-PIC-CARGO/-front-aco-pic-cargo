<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useSecuritysStore } from "@/stores/securitys";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import type { ResumenEstadoCotizacion } from "@/types/cotizacion";

const ListQuote = defineAsyncComponent(() =>
  import("@/components/folderAduana/ListAduanaComponent.vue"));
const ListCall = defineAsyncComponent(() => import("@/components/folderAduana/ListCallComponent.vue"));
// FiltroQuote: () => import("@/components/filtros/FiltroQuote.vue"),
// FiltroCalls: () => import("@/components/filtros/FiltroCalls"),
const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigCotizacion.vue"));

// ListCall: () => import("../folderPricing/comun/listCall.vue"),

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const tabs = ref("quotes");
const dialog = ref(false);

function redirect() {
  nextTick(() => {
    router.push({
      name: "newCotizacionAduana",
    });
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function filtrarCotizaciones(item: ResumenEstadoCotizacion) {
  appStore.spiner = true;
  pricingStore.filtro = {
    id_marketing: "",
    id_status: item.id,
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  };
  // await this.getListQuoteAduana();
  appStore.spiner = false;
}
async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialog.value = false;
}

onMounted(() => {
  appStore.drawer = false;
  pricingStore.e1 = 1;
  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string) as { existecot?: boolean };
  dialog.value = !val.existecot;
  pricingStore.getResumenPorEstado();
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        <!-- DASHBOARD
        <v-chip
          style="cursor: pointer"
          class="mx-1 my-0"
          :color="item.color"
          v-for="(item, index) in $store.state.pricing.listadoResumen"
          :key="index"
          @click="filtrarCotizaciones(item)"
        >
          {{ item.nombre_estado }}
          Total: {{ item.cantidad }}
        </v-chip> -->

        <v-spacer />
        <v-btn
          color="success"
          @click="redirect()"
          size="small"
          class="ml-auto"
        >
          NUEVA COTIZACIÓN
        </v-btn>
      </v-card-title>
      <v-row>
        <v-col cols="12">
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
      
      width="20%"
      temporary
    >
      <!-- <v-card elevation="10">
        <FiltroQuote />
      </v-card> -->
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="pricingStore.filtrarCallsFlag"
      location="right"
      
      width="20%"
      temporary
    >
      <!-- <v-card elevation="10">
        <FiltroCalls />
      </v-card> -->
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
