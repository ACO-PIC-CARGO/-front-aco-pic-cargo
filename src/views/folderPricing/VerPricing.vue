<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

const DatosPrincipales = defineAsyncComponent(
  () =>
    import(
      "../../components/folderPricing/VerComponent/DatosPrincipalesComponent.vue"
    ),
);
const DatosCarga = defineAsyncComponent(
  () =>
    import(
      "../../components/folderPricing/VerComponent/DatosCargaComponent.vue"
    ),
);
const Services = defineAsyncComponent(
  () =>
    import(
      "../../components/folderPricing/VerComponent/ServicesComponent.vue"
    ),
);
const Costos = defineAsyncComponent(
  () =>
    import(
      "../../components/folderPricing/VerComponent/DatosCostosComponent.vue"
    ),
);
const Notas = defineAsyncComponent(
  () =>
    import("../../components/folderPricing/VerComponent/NotasComponent.vue"),
);
const Instructivo = defineAsyncComponent(
  () =>
    import(
      "../../components/folderPricing/VerComponent/InstructivoComponent.vue"
    ),
);
const Comparativa = defineAsyncComponent(
  () =>
    import("@/components/folderPricing/VerComponent/ComparativaComponent.vue"),
);
const UnificarCotizacion = defineAsyncComponent(
  () =>
    import("@/components/folderPricing/VerComponent/UnificarCotizacion.vue"),
);

const route = useRoute();
const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const editable1 = true;
const verFlag = ref(true);
const mostrarStepS = ref(false);

onMounted(async () => {
  // this.$store.commit("SET_RESET");
  appStore.spiner = true;
  verFlag.value = false;
  await Promise.all([
    pricingStore.getQuote({ id: route.params.id as string }),
    pricingStore.getShipment(),
  ]);

  appStore.mainTitle = `VER  COTIZACIÓN - ${pricingStore.nro_quote}`;

  appStore.spiner = false;
  verFlag.value = true;

  // Buscar el tipo de carga y validar que existe
  const tipoCargaItem = pricingStore.listShipment.find(
    (v) => v.id == pricingStore.datosPrincipales.idtipocarga,
  );

  const idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;

  // Solo cargar puertos si tenemos un id_transport válido
  const promisesToLoad: Promise<unknown>[] = [
    pricingStore.getMarketingList(),
    pricingStore.getQuoteStatus(),
    pricingStore.getModality(),
    pricingStore.getIncoterms(),
    pricingStore.getPersonalPricing(),
    pricingStore.getMultiplicador(),
    appStore.cargarProveedores(),
    pricingStore.getBegEndList(),
    pricingStore.getTipoCostos(),
    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    aduanaStore.getAduanaUnificar(route.params.id as string),
    pricingStore.getInstructivoId({ id: route.params.id as string }),
  ];

  // Agregar carga de puertos solo si tenemos id_transport
  if (idTipoCarga) {
    promisesToLoad.unshift(
      pricingStore.getPortBegin({
        id_transport: idTipoCarga,
        id: pricingStore.datosPrincipales.idorigen,
      }),
      pricingStore.getPortEnd({
        id_transport: idTipoCarga,
        id: pricingStore.datosPrincipales.iddestino,
      }),
    );
  }
  //
  await Promise.all(promisesToLoad);
  mostrarStepS.value = true;

  pricingStore.llenadoCostos = false;
  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
  pricingStore.actualizarComparativa = !pricingStore.actualizarComparativa;
  setTimeout(async () => {
    await pricingStore.generaInstructivo();
  }, 1000);
  pricingStore.actualizarCostosFlag = false;
  pricingStore.step2 = true;

  // await this.getImpuestos();
  // await this.getCargarMasterDetalleNotasCotizacion();
  // await this._getEntities();

  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;

  appStore.drawer = false;
  if (route.params.step) {
    nextTick(() => {
      setTimeout(() => {
        pricingStore.e1 = route.params.step ? Number(route.params.step) : 1;
      }, 100);
    });
  }
  aduanaStore.getAduanaUnificar(route.params.id as string);
  setTimeout(async () => {
    const aprobadas = pricingStore.opcionCostos.filter((v) => v.selected);
    if (aprobadas.length && !pricingStore.aprobadoflag) {
      await pricingStore.GuardaCostosFinalesQuote();
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
        v-model="pricingStore.e1"
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
            title="costos de la Cotización"
            editable
          />

          <v-divider />
          <v-stepper-item
            :value="3"
            title="Comparativa"
            complete
            editable
          />
          <v-divider />
          <v-stepper-item
            complete
            :value="4"
            title="Notas de Costos"
            editable
          />
          <v-divider />

          <v-stepper-item
            complete
            :value="5"
            title="Enviar a Operaciones"
            editable
          />
          <v-stepper-item
            complete
            :value="6"
            title="Unificar Cotización"
            editable
          />
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
                <Costos />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="3"
            eager
          >
            <Comparativa />
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="4"
            eager
          >
            <Notas />
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="5"
            eager
          >
            <Instructivo />
          </v-stepper-window-item>
          <v-stepper-window-item
            :value="6"
            eager
          >
            <UnificarCotizacion />
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<style></style>
