<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useSecuritysStore } from "@/stores/securitys";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import type { ResumenEstadoCotizacion } from "@/types/cotizacion";

const ListQuote = defineAsyncComponent(() =>
  import("@/components/folderPricing/ListQuoteComponent.vue"));
const ListCall = defineAsyncComponent(() => import("@/components/folderPricing/ListCallComponent.vue"));
const FiltroQuote = defineAsyncComponent(() => import("@/components/filtros/FiltroQuote.vue"));
const FiltroCalls = defineAsyncComponent(() => import("@/components/filtros/FiltroCalls.vue"));
const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigCotizacion.vue"));

// ListCall: () => import("../folderPricing/comun/listCall.vue"),

const router = useRouter();
const rootStore = useStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const masterusuariosStore = useMasterusuariosStore();
const securitysStore = useSecuritysStore();

const tabs = ref("quotes");
const dialog = ref(false);

function redirect() {
  nextTick(() => {
    router.push({
      name: "newQuote",
    });
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function filtrarCotizaciones(item: ResumenEstadoCotizacion) {
  rootStore.state.spiner = true;

  rootStore.state.spiner = false;
}
async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialog.value = false;
}

onMounted(async () => {
  rootStore.state.drawer = false;
  pricingStore.e1 = 1;
  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string) as { existecot?: boolean };
  dialog.value = !val.existecot;
  rootStore.state.spiner = true;
  await Promise.all([pricingStore.getListQuote(), pricingStore.getQuoteCall()]);
  rootStore.state.spiner = false;
  await Promise.all([
    pricingStore.cargarTrabajadores(),
    pricingStore.getQuoteStatus(),
    pricingStore.getMarketingList(),
    pricingStore.getResumenPorEstado(),
    rootStore.dispatch("cargarClientes"),
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
