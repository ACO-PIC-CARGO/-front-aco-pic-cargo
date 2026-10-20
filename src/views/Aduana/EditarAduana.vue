<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import DatosPrincipales from "../../components/folderAduana/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderAduana/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderAduana/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderAduana/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderAduana/ComparativaComponent.vue";
import NotasComponent from "../../components/folderAduana/NotasComponent.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import type { Costo, OpcionCosto, TipoCarga } from "@/types/cotizacion";

const route = useRoute();
const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const step = ref(1);
const mostrarStepS = ref(false);
const DatosCargaComponentFlag = ref(false);
const ServicesComponentFlag = ref(false);
const editableStep2 = ref(false);
const editableStep4 = ref(false);
const indexCostos = ref(0);
const mostrar = ref(false);
const abrirModalContenedorRecargar = ref(false);

watch(step, () => {
  aduanaStore.step = step.value;
});

onMounted(async () => {
  appStore.spiner = true;
  await Promise.all([
    await aduanaStore.getAdunaVer({ id: route.params.id as string }),
    await aduanaStore.getShipmentAduana(),
  ]);

  appStore.mainTitle = `EDITAR  COTIZACIÓN - ${aduanaStore.nro_quote}`;
  appStore.spiner = false;
  mostrar.value = true;
  const idTipoCarga = aduanaStore.listShipment.filter(
    (v) => v.id == (aduanaStore.datosPrincipales.idtipocarga as number | string)
  )[0]!.id_transport;
  const opciones = [...aduanaStore.opcionCostos];
  const IdProveedor: (number | string | null | undefined)[] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });

  Promise.all([
    aduanaStore.getPortBeginAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.idorigen,
    }),
    aduanaStore.getPortEndAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.idorigen,
    }),
    pricingStore.getMarketingList(),
    pricingStore.getQuoteStatus(),
    pricingStore.getCargarEjecutivo(),
    aduanaStore.getModalityAduana(),
    aduanaStore.getIncotermsAduana(),
    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
    aduanaStore.getMultiplicadorAduana(),
    aduanaStore.getTipoCostosAduana(),
  ]);
  mostrarStepS.value = true;
  aduanaStore.llenadoCostos = false;
  await Promise.all([
    appStore._getContainers(),
    pricingStore.getBegEndList(),
    aduanaStore.obtenerCostosAduana(),
    aduanaStore.getServicesAduana(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    aduanaStore.getPortBeginAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.idorigen,
    }),
    aduanaStore.getPortEndAduana({
      id_transport: idTipoCarga!,
      id: aduanaStore.datosPrincipales.idorigen,
    }),

    // this.cargarProveedores(),
  ]);
  aduanaStore.llenadoCostos = false;
  mostrarStepS.value = true;
});

async function recargar() {
  await recargarServicios();
  await aduanaStore.getTipoCostosAduana();
  setTimeout(async () => {
    await recargarCostos();
  }, 1000);
}
function continuarComparativa() {
  step.value = 3;
}
function activarDatosCarga() {
  DatosCargaComponentFlag.value = true;
}
async function activarServicios() {
  ServicesComponentFlag.value = true;
  const services = [...aduanaStore.preServices];
  const serv = services.filter(
    (v) =>
      v.id_incoterms ==
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ==
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
  );
  aduanaStore.listServices = serv;
  await aduanaStore.getTipoCostosAduana();
}
function recargarServicios() {
  const services = [...aduanaStore.preServices];

  if (services.length == 0) {
    return;
  }
  const serv = services.filter(
    (v) =>
      v.id_incoterms ==
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ==
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (typeof aduanaStore.datosPrincipales.idtipocarga ===
        "object"
          ? aduanaStore.datosPrincipales.idtipocarga.id
          : aduanaStore.datosPrincipales.idtipocarga)
  );

  let IdServices: (number | string | undefined)[] = serv.map((v) => v.id);
  aduanaStore.listServices
    .filter((v) => !!v.id)
    .forEach((servicios) => {
      if (!IdServices.includes(servicios.id)) {
        const index = aduanaStore.listServices.findIndex(
          (v) => v.code_service == servicios.code_service
        );
        aduanaStore.listServices.splice(index, 1);
      }
    });

  IdServices = aduanaStore.listServices.map(
    (v) => v.code_service
  );

  serv.forEach((servicios) => {
    if (!IdServices.includes(servicios.code_service)) {
      aduanaStore.listServices.push(servicios);
    }
  });
}
async function activarLlenadoCostos() {
  appStore.spiner = true;
  await aduanaStore.getMultiplicadorAduana();
  await pricingStore.getImpuestos();

  const codeServicesActivos = new Set(
    aduanaStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service)
  );

  const costos = [...aduanaStore.preCostos];

  const c = costos.filter(
    (v) =>
      v.id_incoterms ==
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ==
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(Number(v.code_service))
  );

  let idContainer: (number | string | null | undefined)[] = [];
  if (aduanaStore.datosPrincipales.containers!.length > 0) {
    idContainer = aduanaStore.datosPrincipales.containers!.map(
      (v) => v.id
    );
  }

  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container);
    }
    return true;
  });

  const codeCost = [69, 114, 105, 39];

  const cDuplicado = cFiltrado.flatMap((item) => {
    if (codeCost.includes(item.code_cost as number)) {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    } else {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
        {
          ...item,
          esopcionflag: 0,
          esventaflag: 1,
          status: true,
          cif: 0,
          seguro: 0,
        },
      ];
    }
  });

  aduanaStore.opcionCostos[0]!.listCostos = cDuplicado as Costo[];
  aduanaStore.opcionCostos[0]!.listImpuestos =
    aduanaStore.listImpuestos;
  aduanaStore.opcionCostos[0]!.listNotasQuote =
    aduanaStore.listNotasQuote;

  step.value = 2;
  editableStep2.value = true;
  appStore.spiner = false;
}
function anadirNuevaOpcion(nro_propuesta: number) {
  // this.$store.state.spiner = true;
  const codeServicesActivos = new Set(
    aduanaStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service)
  );
  const costos = [...aduanaStore.preCostos];
  const c = costos.filter(
    (v) =>
      v.id_incoterms ==
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ==
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(Number(v.code_service))
  );
  let idContainer: (number | string | null | undefined)[] = [];
  if (aduanaStore.datosPrincipales.containers!.length > 0) {
    idContainer = aduanaStore.datosPrincipales.containers!.map(
      (v) => v.id
    );
  }
  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container);
    }
    return true;
  });

  const codeCost = [69, 114, 105, 39];

  const cDuplicado = cFiltrado.flatMap((item) => {
    if (codeCost.includes(item.code_cost as number)) {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    } else {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
        {
          ...item,
          esopcionflag: 0,
          esventaflag: 1,
          status: true,
          cif: 0,
          seguro: 0,
        },
      ];
    }
  });
  const newPropuesta = {
    nro_propuesta: nro_propuesta,
    date_end: "",
    tiempo_transito: 0,
    listCostos: cDuplicado as Costo[],
    listImpuestos: aduanaStore.listImpuestos,
    listNotasQuote: aduanaStore.listNotasQuote,
  };
  aduanaStore.opcionCostos.push(newPropuesta);
  // this.$store.state.spiner = false;
}
async function recargarCostos(event = true) {
  appStore.spiner = true;
  await aduanaStore.getTipoCostosAduana();
  await aduanaStore.getMultiplicadorAduana();

  const codeServicesActivos = new Set(
    aduanaStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service)
  );

  let id_shipment = aduanaStore.datosPrincipales.idtipocarga;
  if (typeof id_shipment === "object") {
    id_shipment = id_shipment.id;
  }

  const c = aduanaStore.preCostos.filter(
    (v) =>
      v.id_incoterms ===
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ===
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment === id_shipment &&
      codeServicesActivos.has(Number(v.code_service))
  );

  let idContainer: (number | string | null | undefined)[] = [];
  if (aduanaStore.datosPrincipales.containers!.length > 0) {
    idContainer = aduanaStore.datosPrincipales.containers!.map(
      (v) => v.id_containers
    );
  }

  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container);
    }
    return true;
  });

  const codeCost = [69, 114, 105, 39];

  const cDuplicado = cFiltrado.flatMap((item) => {
    if (codeCost.includes(item.code_cost as number)) {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: 1,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    } else {
      return [
        {
          ...item,
          esopcionflag: 1,
          esventaflag: 0,
          status: 1,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
        {
          ...item,
          esopcionflag: 0,
          esventaflag: 1,
          status: 1,
          cif: 0,
          seguro: 0,
        },
      ];
    }
  });
  const newOpciones: OpcionCosto[] = [];

  aduanaStore.opcionCostos.forEach((opcion) => {
    const listCostosActual = opcion.listCostos || [];

    const costosValidos = listCostosActual.filter(
      (costo) =>
        !costo.code_cost ||
        cDuplicado.some((nuevo) => nuevo.code_cost === costo.code_cost)
    );

    const nuevosCostos = cDuplicado
      .filter(
        (nuevo) =>
          !costosValidos.some(
            (costo) =>
              costo.code_cost === nuevo.code_cost &&
              costo.id_multiplicador === nuevo.id_multiplicador
          )
      )
      .map((nuevo) => ({
        ...nuevo,
        id: 0,
      }));

    const Propuesta = {
      ...opcion,
      listCostos: [...costosValidos, ...nuevosCostos] as Costo[],
      listImpuestos: opcion.listImpuestos,
      listNotasQuote: opcion.listNotasQuote,
      selected: true,
    };

    newOpciones.push(Propuesta);
  });

  aduanaStore.opcionCostos = newOpciones;

  aduanaStore.llenadoCostos = false;
  indexCostos.value++;
  appStore.spiner = false;
  const isFCL = aduanaStore.listShipment.some(
    (v) =>
      v.id ==
        ((aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
          ? (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
          : aduanaStore.datosPrincipales.idtipocarga) &&
      v.code == "FCL"
  );
  Swal.fire({
    icon: "success",
    title: "Actualización Correcta.",
    text: "Se han activado todas las opciones, actualice los montos de los nuevos registros, y los multiplicadores respectivo.",
    allowEnterKey: false,
    allowOutsideClick: false,
  }).then((res) => {
    aduanaStore.actualizarComparativa =
      !aduanaStore.actualizarComparativa;
    if (res.isConfirmed) {
      if (isFCL && event) {
        abrirModalContenedorRecargar.value =
          !abrirModalContenedorRecargar.value;
      }
    }
  });
  // let isFCL = this.$store.state.aduana.listShipment.filter(v=>v.id==)
}
function irVentaCliente() {
  step.value = 2;
}
function irANotas() {
  step.value = 4;
  editableStep4.value = true;
}
</script>

<template>
  <v-container
    fluid
    class="pt-0 px-0"
    v-if="mostrar"
  >
    <v-stepper
      v-model="step"
      class="pt-0"
    >
      <v-stepper-header>
        <v-stepper-item
          :complete="step > 1"
          :value="1"
          title="Datos de la Carga"
          editable
        />

        <v-divider />

        <v-stepper-item
          :complete="step > 2"
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
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item
          :value="1"
          eager
        >
          <v-row class="my-1">
            <v-col
              cols="12"
              md="6"
              class="pt-0"
            >
              <v-row>
                <v-col
                  cols="12"
                  class="my-0 py-0"
                >
                  <DatosPrincipales
                    @recargar-servicios-costos="recargar"
                    @activar-datos-carga="activarDatosCarga"
                    :mostrar-btn="false"
                    :editable-flag="false"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="my-0 py-0"
            >
              <DatosCargaComponent
                @activar-servicios="activarServicios"
                @recargar-costos="recargarCostos"
                :mostrar-btn="false"
                :abrir-modal-contenedor-recargar="abrirModalContenedorRecargar"
              />
            </v-col>
            <v-col cols="12">
              <ServicesComponent
                @activar-llenado-costos="activarLlenadoCostos()"
                @recargar-costos="recargarCostos()"
                :mostrar-btn="false"
              />
            </v-col>
          </v-row>

          <!-- <v-btn color="primary" @click="step = 2"> Continue </v-btn>

          <v-btn text> Cancel </v-btn> -->
        </v-stepper-window-item>

        <v-stepper-window-item
          :value="2"
          eager
        >
          <DatosCostosComponent
            :key="indexCostos"
            :mostrar-btn="false"
            @anadir-nueva-opcion="anadirNuevaOpcion"
            @continuar-comparativa="continuarComparativa"
            @ir-a-notas="irANotas"
            :mostrar-impuestos-editar="true"
            v-if="mostrarStepS"
          />
        </v-stepper-window-item>

        <v-stepper-window-item
          :value="3"
          eager
        >
          <ComparativaComponent
            @ir-venta-cliente="irVentaCliente"
            v-if="mostrarStepS"
          />
        </v-stepper-window-item>
        <v-stepper-window-item
          :value="4"
          eager
        >
          <NotasComponent
            :editable="editableStep4"
            v-if="mostrarStepS"
          />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-container>
</template>

<style scoped>
.align-right {
  text-align: right;
}
</style>
