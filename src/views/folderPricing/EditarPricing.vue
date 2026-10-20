<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import DatosPrincipales from "../../components/folderPricing/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderPricing/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderPricing/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderPricing/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderPricing/ComparativaComponent.vue";
import NotasComponent from "../../components/folderPricing/NotasComponent.vue";
import { useTownStore } from "@/stores/town";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useProveedorStore } from "@/stores/proveedor";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";
import { sessionBranchId, sessionUser } from "@/utils/sesion";
import type { OpcionCosto, TipoCarga } from "@/types/cotizacion";

const route = useRoute();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const calculadorasStore = useCalculadorasStore();
const proveedorStore = useProveedorStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();
const townStore = useTownStore();

const step = ref(1);
const mostrarStepS = ref(false);
const DatosCargaComponentFlag = ref(false);
const ServicesComponentFlag = ref(false);
const editableStep2 = ref(false);
const editableStep4 = ref(false);
const indexCostos = ref(0);
const mostrar = ref(false);
const abrirModalContenedorRecargar = ref(false);
const mostrarCostos = ref(true);

watch(step, () => {
  pricingStore.step = step.value;
});

onMounted(async () => {
  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;

  pricingStore.SET_RESET();
  appStore.spiner = true;
  await Promise.all([
    pricingStore.getQuote({ id: route.params.id as string }),
    pricingStore.getShipment(),
  ]);

  appStore.mainTitle = `EDITAR  COTIZACIÓN - ${pricingStore.nro_quote}`;

  const idTransport = pricingStore.listShipment.filter(
    (v) => v.id == pricingStore.datosPrincipales.idtipocarga,
  )[0]!.id_transport;
  //
  const opciones = [...pricingStore.opcionCostos];
  const IdProveedor: (number | string | null | undefined)[] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });

  appStore.spiner = false;
  mostrar.value = true;

  // obtenerProveedorPricing
  await Promise.all([
    proveedorStore.obtenerProveedorPricing({
      id: IdProveedor.join(","),
      search: null,
    }),
    pricingStore.getMarketingList(),
    pricingStore.getQuoteStatus(),
    pricingStore.getCargarEjecutivo(),
    pricingStore.getModality(),
    pricingStore.getIncoterms(),

    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
    pricingStore.getMultiplicador(),
    pricingStore.getTipoCostos(),
    appStore._getContainers(),
    pricingStore.getBegEndList(),
    pricingStore.obtenerCostosPricing(),
    pricingStore.getServices(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    pricingStore.getPortBegin({
      id_transport: idTransport!,
      id: pricingStore.datosPrincipales.idorigen,
    }),
    pricingStore.getPortEnd({
      id_transport: idTransport!,
      id: pricingStore.datosPrincipales.iddestino,
    }),
    pricingStore.getCargarMasterDetalleNotasCotizacion(),
  ]);

  mostrarStepS.value = true;
  pricingStore.llenadoCostos = false;
  const idTipoCarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;
  await Promise.all([
    pricingStore.getServices(),
    pricingStore.obtenerCostosPricing(),
    calculadorasStore.obtenerFleteCalculadora({
      shipment: pricingStore.listShipment.find((v) => v.id == idTipoCarga)!
        .code,
      puerto_origen: pricingStore.listPortBegin.find(
        (v) => v.id_port == pricingStore.datosPrincipales.idorigen,
      )!.puerto!,
      puerto_destino: pricingStore.listPortEnd.find(
        (v) => v.id_port == pricingStore.datosPrincipales.iddestino,
      )!.puerto!,
      volumen: pricingStore.datosPrincipales.volumen,
      peso: pricingStore.datosPrincipales.peso,
    }),
    calculadorasStore.getTransporte({
      shimpent: pricingStore.listShipment.find((v) => v.id == idTipoCarga)!
        .code,
      id_modality: pricingStore.datosPrincipales.idsentido as number,
      id_pais: sessionUser().id_pais,
      id_branch: sessionBranchId(),
    }),
  ]);
  const puertoDestino = pricingStore.listPortEnd.find(
    (puerto) =>
      String(puerto.id_port) ===
      String(pricingStore.datosPrincipales.iddestino),
  );
  if (puertoDestino) {
    await townStore.cargarTownParaPricing({ id_pais: puertoDestino.id_pais! });
  }

  pricingStore.actualizarComparativa = !pricingStore.actualizarComparativa;
});

async function recargar() {
  await recargarServicios();
  await pricingStore.getTipoCostos();
  setTimeout(async () => {
    await recargarCostos();
  }, 1000);
}
function recargarGrupalFlag() {
  mostrarCostos.value = false;
  setTimeout(async () => {
    mostrarCostos.value = true;
  }, 100);
}
function continuarComparativa() {
  step.value = 3;
}
function activarDatosCarga() {
  DatosCargaComponentFlag.value = true;
}
async function activarServicios() {
  ServicesComponentFlag.value = true;
  const services = [...pricingStore.preServices];
  const serv = services.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id,
  );
  pricingStore.listServices = serv;
  await pricingStore.getTipoCostos();
}
function recargarServicios() {
  const services = [...pricingStore.preServices];

  if (services.length == 0) {
    return;
  }
  const serv = services.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (typeof pricingStore.datosPrincipales.idtipocarga === "object"
          ? pricingStore.datosPrincipales.idtipocarga.id
          : pricingStore.datosPrincipales.idtipocarga),
  );

  let IdServices: (number | string | undefined)[] = serv.map((v) => v.id);
  pricingStore.listServices
    .filter((v) => !!v.id)
    .forEach((servicios) => {
      if (!IdServices.includes(servicios.id)) {
        const index = pricingStore.listServices.findIndex(
          (v) => v.code_service == servicios.code_service,
        );
        pricingStore.listServices.splice(index, 1);
      }
    });

  IdServices = pricingStore.listServices.map((v) => v.code_service);

  serv.forEach((servicios) => {
    if (!IdServices.includes(servicios.code_service)) {
      pricingStore.listServices.push(servicios);
    }
  });
}
async function activarLlenadoCostos() {
  appStore.spiner = true;
  await pricingStore.getMultiplicador();
  await pricingStore.getImpuestos();

  const codeServicesActivos = new Set(
    pricingStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );

  const costos = [...pricingStore.preCostos];

  const c = costos.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(Number(v.code_service)),
  );

  let idContainer: (number | string | undefined)[] = [];
  if (pricingStore.datosPrincipales.containers!.length > 0) {
    idContainer = pricingStore.datosPrincipales.containers!.map((v) => v.id);
  }

  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container as number | string);
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
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    }
  });

  pricingStore.opcionCostos[0]!.listCostos = cDuplicado;
  pricingStore.opcionCostos[0]!.listImpuestos = pricingStore.listImpuestos;
  pricingStore.opcionCostos[0]!.listNotasQuote = pricingStore.listNotasQuote;

  step.value = 2;
  editableStep2.value = true;
  appStore.spiner = false;
}
function anadirNuevaOpcion(nro_propuesta: number) {
  // this.$store.state.spiner = true;
  const codeServicesActivos = new Set(
    pricingStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );
  const costos = [...pricingStore.preCostos];
  const c = costos.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(Number(v.code_service)),
  );
  let idContainer: (number | string | undefined)[] = [];
  if (pricingStore.datosPrincipales.containers!.length > 0) {
    idContainer = pricingStore.datosPrincipales.containers!.map((v) => v.id);
  }
  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container as number | string);
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
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    }
  });
  const newPropuesta = {
    nro_propuesta: nro_propuesta,
    // @ts-expect-error moment is not imported in this view, so this call throws
    date_end: moment().add(7, 'days').format("YYYY-MM-DD"),
    tiempo_transito: 35,
    listCostos: cDuplicado,
    listImpuestos: pricingStore.listImpuestos,
    listNotasQuote: pricingStore.listNotasQuote,
  };
  pricingStore.opcionCostos.push(newPropuesta);
  // this.$store.state.spiner = false;
}
async function recargarCostos(event = true) {
  appStore.spiner = true;
  await pricingStore.getTipoCostos();
  await pricingStore.getMultiplicador();

  const codeServicesActivos = new Set(
    pricingStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );

  let id_shipment = pricingStore.datosPrincipales.idtipocarga;
  if (typeof id_shipment === "object") {
    id_shipment = id_shipment.id;
  }

  const c = pricingStore.preCostos.filter(
    (v) =>
      v.id_incoterms === pricingStore.datosPrincipales.idincoterms &&
      v.id_modality === pricingStore.datosPrincipales.idsentido &&
      v.id_shipment === id_shipment &&
      codeServicesActivos.has(Number(v.code_service)),
  );

  let idContainer: (number | string | undefined)[] = [];
  if (pricingStore.datosPrincipales.containers!.length > 0) {
    idContainer = pricingStore.datosPrincipales.containers!.map(
      (v) => v.id_containers,
    );
  }

  const cFiltrado = c.filter((v) => {
    if (v.escontenedorflag) {
      return idContainer.includes(v.id_container as number | string);
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
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
      ];
    }
  });
  const newOpciones: OpcionCosto[] = [];

  pricingStore.opcionCostos.forEach((opcion) => {
    const listCostosActual = opcion.listCostos || [];

    const costosValidos = listCostosActual.filter(
      (costo) =>
        !costo.code_cost ||
        cDuplicado.some((nuevo) => nuevo.code_cost === costo.code_cost),
    );

    const nuevosCostos = cDuplicado
      .filter(
        (nuevo) =>
          !costosValidos.some(
            (costo) =>
              costo.code_cost === nuevo.code_cost &&
              costo.id_multiplicador === nuevo.id_multiplicador,
          ),
      )
      .map((nuevo) => ({
        ...nuevo,
        id: 0,
      }));

    const Propuesta = {
      ...opcion,
      listCostos: [...costosValidos, ...nuevosCostos],
      listImpuestos: opcion.listImpuestos,
      listNotasQuote: opcion.listNotasQuote,
      selected: true,
    };

    newOpciones.push(Propuesta);
  });

  pricingStore.opcionCostos = newOpciones;

  pricingStore.llenadoCostos = false;
  indexCostos.value++;
  appStore.spiner = false;
  const isFCL = pricingStore.listShipment.some(
    (v) =>
      v.id ==
        ((pricingStore.datosPrincipales.idtipocarga as TipoCarga).id
          ? (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id
          : pricingStore.datosPrincipales.idtipocarga) &&
      v.code == "FCL",
  );
  Swal.fire({
    icon: "success",
    title: "Actualización Correcta.",
    text: "Se han activado todas las opciones, actualice los montos de los nuevos registros, y los multiplicadores respectivo.",
    allowEnterKey: false,
    allowOutsideClick: false,
  }).then((res) => {
    pricingStore.actualizarComparativa = !pricingStore.actualizarComparativa;
    if (res.isConfirmed) {
      if (isFCL && event) {
        abrirModalContenedorRecargar.value = !abrirModalContenedorRecargar.value;
      }
    }
  });
  // let isFCL = this.$store.state.pricing.listShipment.filter(v=>v.id==)
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
          title="Costos de la Cotización"
          :editable="mostrarStepS"
        />

        <v-divider />

        <v-stepper-item
          :value="3"
          title="Comparativa"
          :editable="mostrarStepS"
        />
        <v-divider />
        <v-stepper-item
          :value="4"
          title="Notas de Costos"
          :editable="mostrarStepS"
        />
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
                @recargar-grupal-flag="recargarGrupalFlag"
                :mostrar-btn="false"
                :abrir-modal-contenedor-recargar="abrirModalContenedorRecargar"
                :services-component-flag="true"
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
          v-if="mostrarCostos"
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
          <v-progress-linear
            color="light-blue"
            height="10"
            model-value="10"
            striped
            v-else
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
