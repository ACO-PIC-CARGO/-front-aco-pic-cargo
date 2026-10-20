<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
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
import { sessionBranchId } from "@/utils/sesion";
import type { Costo, TipoCarga } from "@/types/cotizacion";

const router = useRouter();
const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const step = ref(1);
const DatosCargaComponentFlag = ref(false);
const ServicesComponentFlag = ref(false);
const editableStep2 = ref(false);
const editableStep4 = ref(false);
const indexCostos = ref(0);
// ...mapState(["preServices", "preCostos"]),

// The old component calls these three helpers but never defined them, so each call throws.
const recargarServicios = undefined as unknown as () => void;
const crearCarpetaOneDrive = undefined as unknown as (
  data: Record<string, unknown>
) => Promise<void>;
const actualizarURLEnElQuote = undefined as unknown as (
  data: Record<string, unknown>
) => Promise<void>;

onMounted(async () => {
  appStore.mainTitle = "Nueva Cotización";
  await pricingStore.resetQuoteNew();
  await pricingStore.getMarketingList();
  await pricingStore.getQuoteStatus();
  await aduanaStore.getModalityAduana();
  await aduanaStore.getShipmentAduana();
  await aduanaStore.getIncotermsAduana();
  await pricingStore.getCargarEjecutivo();
  await pricingStore.getBegEndList();
  await aduanaStore.getServicesAduana();
  await aduanaStore.obtenerCostosAduana();
  await appStore.cargarProveedores();
  await pricingStore.getImpuestos();
  await aduanaStore.getCargarMasterDetalleNotasCotizacionAduana();
  await enterprisesStore.obtenerImpuestoXEmpresa();
  await masterusuariosStore.cargarMasterDetallePercepcionAduana();
  await appStore._getContainers();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recargar() {
  if (aduanaStore.listServices.length > 0) {
    recargarServicios();
    aduanaStore.getTipoCostosAduana();
  }
  if (editableStep2.value) {
    recargarCostos();
    // this.$store.state.aduana.index = 0;
  }
}
function continuarComparativa() {
  step.value = 3;
}
async function activarDatosCarga() {
  appStore.spiner = true;
  await aduanaStore.getPortBeginAduana({
    id_transport: ((aduanaStore.datosPrincipales.idtipocarga as TipoCarga)
      .id_transport
      ? (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id_transport
      : aduanaStore.datosPrincipales.idtipocarga) as number | string,
  });
  await aduanaStore.getPortEndAduana({
    id_transport: ((aduanaStore.datosPrincipales.idtipocarga as TipoCarga)
      .id_transport
      ? (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id_transport
      : aduanaStore.datosPrincipales.idtipocarga) as number | string,
  });
  DatosCargaComponentFlag.value = true;
  nextTick(() => {
    // setTimeout(() => {
    const element = document.getElementById("DatosCargaComponent");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // }, 100);
  });
  appStore.spiner = false;
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
  aduanaStore.getTipoCostosAduana();
  aduanaStore.listServices = serv;
  nextTick(() => {
    // setTimeout(() => {
    const element = document.getElementById("ServicesComponent");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // }, 100);
  });
  appStore.spiner = false;
}
function recargarServiciosCostos() {
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
        (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
  );
  // eliminando los servicios que ya no van
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
  // agregando los servicios que faltan
  IdServices = aduanaStore.listServices.map(
    (v) => v.code_service
  );

  serv.forEach((servicios) => {
    if (!IdServices.includes(servicios.code_service)) {
      aduanaStore.listServices.push(servicios);
    }
  });
  recargarCostos();
}
async function activarLlenadoCostos() {
  try {
    appStore.spiner = true;
    await aduanaStore.getMultiplicadorAduana();
    // await this.getImpuestos();

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
        codeServicesActivos.has(v.code_service)
    );

    let idContainer: (number | string | null | undefined)[] = [];
    if (aduanaStore.datosPrincipales.containers!.length > 0) {
      idContainer =
        aduanaStore.datosPrincipales.containers!.map(
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
            nro_propuesta: 1,
          },
        ];
      } else {
        return [
          {
            ...item,
            nro_propuesta: 1,
            esopcionflag: 1,
            esventaflag: 0,
            status: true,
            cif: parseFloat(String(0.35)),
            seguro: parseFloat(String(0.45)),
          },
          {
            ...item,
            nro_propuesta: 1,
            esopcionflag: 0,
            esventaflag: 1,
            status: true,
            costounitario: 0,
            cif: parseFloat(String(0.35)),
            seguro: parseFloat(String(0.45)),
          },
        ];
      }
    });

    aduanaStore.opcionCostos[0]!.listCostos = cDuplicado as Costo[];
    aduanaStore.opcionCostos[0]!.listImpuestos =
      aduanaStore.listImpuestos;
    aduanaStore.opcionCostos[0]!.listNotasQuote =
      aduanaStore.listNotasQuote;
    appStore.spiner = false;
    Swal.fire({
      icon: "question",
      title: "Cotizar",
      text: "¿Desea pasar a Cotizar?",
      confirmButtonText: "Pasar a Cotizar",
      denyButtonText: "Guardar Borrador",
      allowEnterKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "green",
      showDenyButton: true,
      allowEscapeKey: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        step.value = 2;
        editableStep2.value = true;
      }
      if (result.isDenied) {
        await guardar();
      }
    });
  } catch (error) {
    console.error(error);
  }
}
async function guardar() {
  appStore.spiner = true;
  aduanaStore.opcionCostos[0]!.selected = true;
  await pricingStore.registrarQuote({ fullflag: false }).catch((e) => {
    console.error("registrarQuote", e);
  });
  if (aduanaStore.nro_quote) {
    appStore.spiner = false;

    Swal.fire({
      icon: "success",
      title: "Aviso",
      text: aduanaStore.mensaje,
      confirmButtonText: "Ir al listado",
      showConfirmButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({
          name: "lstQuote",
        });
      }
      if (result.isDismissed) {
        router.push({
          name: "lstQuote",
        });
      }
    });
    const id_branch = sessionBranchId();
    const branchCreacion = [1, 2];
    if (branchCreacion.includes(id_branch)) {
      await crearCarpetaOneDrive({
        nro_quote: aduanaStore.nro_quote,
        nombre: aduanaStore.datosPrincipales.nombre,
      }).catch((e) => {
        console.error("crearCarpetaOneDrive", e);
      });

      await actualizarURLEnElQuote({
        id: aduanaStore.id,
        url: aduanaStore.urlFolder,
      }).catch((e) => {
        console.error("actualizarURLEnElQuote", e);
      });
    }
  }
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
      codeServicesActivos.has(v.code_service)
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
          nro_propuesta: nro_propuesta,
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
          nro_propuesta: nro_propuesta,
          esventaflag: 0,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        },
        {
          ...item,
          esopcionflag: 0,
          nro_propuesta: nro_propuesta,
          esventaflag: 1,
          status: true,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
          costounitario: 0,
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
  appStore.spiner = false;
}
async function recargarCostos() {
  await aduanaStore.getTipoCostosAduana();
  await aduanaStore.getMultiplicadorAduana();
  const codeServicesActivos = new Set(
    aduanaStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service)
  );

  const c = aduanaStore.preCostos.filter(
    (v) =>
      v.id_incoterms ===
        aduanaStore.datosPrincipales.idincoterms &&
      v.id_modality ===
        aduanaStore.datosPrincipales.idsentido &&
      v.id_shipment ===
        (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(v.code_service)
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
          nro_propuesta: 1,
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
          nro_propuesta: 1,
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
          costounitario: 0,
        },
      ];
    }
  });

  aduanaStore.opcionCostos =
    aduanaStore.opcionCostos.slice(0, 1);
  aduanaStore.index = 0;
  aduanaStore.opcionCostos[0]!.listCostos = cDuplicado as Costo[];
  aduanaStore.opcionCostos[0]!.listImpuestos =
    aduanaStore.listImpuestos;
  aduanaStore.opcionCostos[0]!.listNotasQuote =
    aduanaStore.listNotasQuote;

  aduanaStore.llenadoCostos = true;
  indexCostos.value++;
}
function irVentaCliente() {
  step.value = 2;
}
function irANotas() {
  step.value = 4;
  editableStep4.value = true;
  aduanaStore.btnRegistrar = true;
}
</script>

<template>
  <v-container
    fluid
    class="pt-0 px-0"
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
          title="costos de la Cotización"
          :editable="editableStep2"
        />

        <v-divider />

        <v-stepper-item
          :value="3"
          title="Comparativa"
        />
        <v-divider />
        <v-stepper-item
          :value="4"
          title="Notas de Costos"
        />
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item
          :value="1"
          eager
        >
          <v-row class="my-1">
            <!-- <v-col cols="12" md="6" class="pt-0"> -->
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
                    @recargar-servicios-costos="recargarServiciosCostos"
                    @activar-datos-carga="activarDatosCarga"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="my-0 py-0"
              id="DatosCargaComponent"
            >
              <DatosCargaComponent
                v-if="DatosCargaComponentFlag"
                @activar-servicios="activarServicios()"
                @recargar-costos="recargarCostos"
              />
            </v-col>
            <v-col
              cols="12"
              id="ServicesComponent"
            >
              <ServicesComponent
                v-if="ServicesComponentFlag"
                @activar-llenado-costos="activarLlenadoCostos()"
                @recargar-costos="recargarCostos()"
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
            @anadir-nueva-opcion="anadirNuevaOpcion"
            @continuar-comparativa="continuarComparativa"
            @ir-a-notas="irANotas"
            :mostrar-impuestos-editar="true"
          />
        </v-stepper-window-item>

        <v-stepper-window-item
          :value="3"
          eager
        >
          <ComparativaComponent @ir-venta-cliente="irVentaCliente" />
        </v-stepper-window-item>
        <v-stepper-window-item
          :value="4"
          eager
        >
          <NotasComponent :editable="editableStep4" />
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
