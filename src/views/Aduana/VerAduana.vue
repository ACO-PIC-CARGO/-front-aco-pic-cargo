<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

const DatosPrincipales = defineAsyncComponent(() =>
  import(
    "../../components/folderAduana/VerComponent/DatosPrincipalesComponent.vue"
  ));
const DatosCarga = defineAsyncComponent(() =>
  import(
    "../../components/folderAduana/VerComponent/DatosCargaComponent.vue"
  ));
const Services = defineAsyncComponent(() =>
  import(
    "../../components/folderAduana/VerComponent/ServicesComponent.vue"
  ));
const Costos = defineAsyncComponent(() =>
  import(
    "../../components/folderAduana/VerComponent/DatosCostosComponent.vue"
  ));
const Notas = defineAsyncComponent(() =>
  import("../../components/folderAduana/VerComponent/NotasComponent.vue"));
const Instructivo = defineAsyncComponent(() =>
  import(
    "../../components/folderAduana/VerComponent/InstructivoComponent.vue"
  ));
const Comparativa = defineAsyncComponent(() =>
  import("@/components/folderAduana/VerComponent/ComparativaComponent.vue"));
const UnificarCotizacion = defineAsyncComponent(() =>
  import("@/components/folderAduana/VerComponent/UnificarCotizacion.vue"));

const route = useRoute();
const rootStore = useStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const editable1 = true;
const mostrarStepS = ref(false);
const verFlag = ref(true);

onMounted(async () => {
  rootStore.state.spiner = true;
  verFlag.value = false;
  await Promise.all([
    aduanaStore.getAdunaVer({ id: route.params.id as string }),
    aduanaStore.getShipmentAduana(),
  ]);
  rootStore.state.mainTitle = `VER  COTIZACIÓN - ${aduanaStore.nro_quote}`;
  rootStore.state.spiner = false;
  verFlag.value = true;

  const idTipoCarga = aduanaStore.listShipment.filter(
    (v) => v.id == (aduanaStore.datosPrincipales.idtipocarga as number | string)
  )[0]!.id_transport;

  await Promise.all([
    aduanaStore.getPortBeginAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.idorigen,
    }),
    aduanaStore.getPortEndAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.iddestino,
    }),
    pricingStore.getMarketingList(),
    pricingStore.getQuoteStatus(),
    aduanaStore.getModalityAduana(),
    aduanaStore.getIncotermsAduana(),
    aduanaStore.getPersonalPricingAduana(),
    aduanaStore.getMultiplicadorAduana(),
    rootStore.dispatch("cargarProveedores"),
    // this.getBegEndList(),
    aduanaStore.getTipoCostosAduana(),
    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    // await this.getModulesEntities(),

    aduanaStore.getCotizacionUnificar(route.params.id as string),
    aduanaStore.getInstructivoIdAduana({ id: route.params.id as string }),
  ]);
  mostrarStepS.value = true;

  aduanaStore.actualizarCostosFlag =
    !aduanaStore.actualizarCostosFlag;

  aduanaStore.actualizarComparativa =
    !aduanaStore.actualizarComparativa;
  setTimeout(() => {
    aduanaStore.generaInstructivoAduana();
  }, 1000);
  aduanaStore.actualizarCostosFlag = false;
  rootStore.state.drawer = false;

  if (route.params.step) {
    aduanaStore.e1 = route.params.step
      ? Number(route.params.step)
      : 1;
  }

  setTimeout(async () => {
    const aprobadas = aduanaStore.opcionCostos.filter(
      (v) => v.selected
    );

    if (aprobadas.length && !aduanaStore.aprobadoflag) {
      await aduanaStore.GuardaCostosFinalesAduana();
    }
  }, 300);
});
</script>

<template>
  <v-container
    fluid
    class="pa-0"
    v-if="verFlag"
  >
    <v-card elevation="5">
      <v-stepper
        v-model="aduanaStore.e1"
        non-linear
      >
        <v-stepper-header>
          <v-stepper-item
            complete
            :value="1"
            title="Datos de la Carga"
            :editable="editable1"
          />

          <v-divider />

          <v-stepper-item
            complete
            :value="2"
            :editable="mostrarStepS"
          >
            <template #title>
              <span v-if="mostrarStepS"> costos de la Cotización </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              />
            </template>
          </v-stepper-item>

          <v-divider />
          <v-stepper-item
            :value="3"
            complete
            :editable="mostrarStepS"
          >
            <template #title>
              <span v-if="mostrarStepS"> Comparativa </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              />
            </template>
          </v-stepper-item>
          <v-divider />
          <v-stepper-item
            complete
            :value="4"
            :editable="mostrarStepS"
          >
            <template #title>
              <span v-if="mostrarStepS"> Notas de Costos </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              />
            </template>
          </v-stepper-item>
          <v-divider />

          <v-stepper-item
            complete
            :value="5"
            :editable="mostrarStepS"
          >
            <!-- Instructivo -->
            <template #title>
              <span v-if="mostrarStepS"> Enviar a Operaciones </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              />
            </template>
          </v-stepper-item>
          <v-stepper-item
            complete
            :value="6"
            :editable="mostrarStepS"
          >
            <template #title>
              <span v-if="mostrarStepS"> Unificar Cotización </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              />
            </template>
          </v-stepper-item>
        </v-stepper-header>
        <!-- DATA -->
        <v-stepper-window>
          <v-stepper-window-item
            :value="1"
            eager
          >
            <v-row class="my-1">
              <v-col
                cols="12"
                md="6"
                class="pa-0"
              >
                <DatosPrincipales />
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="pa-0"
              >
                <DatosCarga />
              </v-col>
              <v-col cols="12">
                <Services />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="2"
            eager
          >
            <v-row class="my-1">
              <v-col cols="12">
                <Costos v-if="mostrarStepS" />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="3"
            eager
          >
            <Comparativa v-if="mostrarStepS" />
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="4"
            eager
          >
            <Notas v-if="mostrarStepS" />
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="5"
            eager
          >
            <Instructivo v-if="mostrarStepS" />
            <!-- COMBINAR -->
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="6"
            eager
          >
            <UnificarCotizacion v-if="mostrarStepS" />
            <!-- COMBINAR -->
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<style></style>
