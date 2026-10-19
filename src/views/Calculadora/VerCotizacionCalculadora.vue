<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const DatosPrincipales = defineAsyncComponent(() =>
  import(
    "../../components/folderPricing/VerComponent/DatosPrincipalesComponent.vue"
  ));
const DatosCarga = defineAsyncComponent(() =>
  import(
    "../../components/folderPricing/VerComponent/DatosCargaComponent.vue"
  ));
const Services = defineAsyncComponent(() =>
  import(
    "../../components/folderPricing/VerComponent/ServicesComponent.vue"
  ));
const Costos = defineAsyncComponent(() =>
  import(
    "../../components/folderPricing/VerComponent/DatosCostosComponent.vue"
  ));

const route = useRoute();
const rootStore = useStore();
const masterusuariosStore = useMasterusuariosStore();

const editable1 = true;
const verFlag = ref(true);

onMounted(async () => {
  verFlag.value = false;

  await Promise.all([
    rootStore.dispatch("getCotzacionCalculadora", {
      id: route.query.id,
      individualflag: route.query.individualflag == '1' ? true : false,
      esgrupalflag: route.query.esgrupalflag == '1' ? true : false,
    }),
    rootStore.dispatch("getShipment"),
  ]);

  // this.$store.state.mainTitle = `VER  COTIZACIÓN - ${this.$store.state.pricing.nro_quote}`;

  // this.$store.state.spiner = false;
  verFlag.value = true;

  // Buscar el tipo de carga y validar que existe
  const tipoCargaItem = rootStore.state.pricing.listShipment.find(
    (v: { id: unknown }) => v.id == rootStore.state.pricing.datosPrincipales.idtipocarga,
  );

  const idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;

  // Solo cargar puertos si tenemos un id_transport válido
  const promisesToLoad = [
    rootStore.dispatch("getModality"),
    rootStore.dispatch("getIncoterms"),

    rootStore.dispatch("getMultiplicador"),
    rootStore.dispatch("cargarProveedores"),
    rootStore.dispatch("getBegEndList"),
    rootStore.dispatch("getTipoCostos"),
    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
  ];

  if (idTipoCarga) {
    promisesToLoad.unshift(
      rootStore.dispatch("getPortBegin", {
        id_transport: idTipoCarga,
        id: rootStore.state.pricing.datosPrincipales.idorigen,
      }),
      rootStore.dispatch("getPortEnd", {
        id_transport: idTipoCarga,
        id: rootStore.state.pricing.datosPrincipales.iddestino,
      }),
    );
  }
  // //
  await Promise.all(promisesToLoad);
  // this.mostrarStepS = true;

  rootStore.state.drawer = false;

  // this.$forceUpdate;

  rootStore.state.spiner = false;
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
        v-model="rootStore.state.pricing.e1"
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
                <DatosPrincipales
                  :mostrarmarketing="false"
                  :mostrarmarestado="false"
                  :mostrarmarejecutivo="false"
                  :mostrarmarpricing="false"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="pa-0"
              >
                <DatosCarga :mostrarproveedor="false" />
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
        </v-stepper-window>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<style></style>
