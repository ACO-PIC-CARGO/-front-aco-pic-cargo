<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { readSheet as readXlsFile } from "read-excel-file/browser";
import type { Row } from "read-excel-file/browser";
import moment from "moment";
import DatosPrincipales from "../../components/folderPricing/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderPricing/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderPricing/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderPricing/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderPricing/ComparativaComponent.vue";
import NotasComponent from "../../components/folderPricing/NotasComponent.vue";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useProveedorStore } from "@/stores/proveedor";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";
import { sessionBranchId, sessionUser } from "@/utils/sesion";
import type {
  Costo,
  FleteOpcionCosto,
  Numerico,
  Servicio,
  TipoCarga,
} from "@/types/cotizacion";

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const calculadorasStore = useCalculadorasStore();
const masterusuariosStore = useMasterusuariosStore();
const quoteStatusStore = useQuoteStatusStore();
const proveedorStore = useProveedorStore();
const enterprisesStore = useEnterprisesStore();
const { calcularFac } = useCotizacionCalculos();

const step = ref(1);
const editableStep3 = ref(false);
const DatosCargaComponentFlag = ref(false);
const ServicesComponentFlag = ref(false);
const editableStep2 = ref(false);
const editableStep4 = ref(false);
const indexCostos = ref(0);
const dialogDistrito = ref(false);
const dialogPesoVolumen = ref(false);
const excelInput = ref<HTMLInputElement>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mostrarCostos: boolean | undefined;

onMounted(async () => {
  pricingStore.step = 1;
  pricingStore.SET_RESET();
  appStore.mainTitle = "Nueva Cotización";
  await Promise.all([
    // await this.resetQuoteNew(),
    pricingStore.getMarketingList(),
    pricingStore.getQuoteStatus(),
    ensurePreliminarStatus(),
    pricingStore.getModality(),
    pricingStore.getShipment(),
    pricingStore.getIncoterms(),
    pricingStore.getCargarEjecutivo(),
  ]);

  await setDefaultStatusPreliminar();
  const opciones = [...pricingStore.opcionCostos];
  const IdProveedor: (number | string | null | undefined)[] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });
  await Promise.all([
    pricingStore.getBegEndList(),
    pricingStore.getServices(),
    pricingStore.obtenerCostosPricing(),
    pricingStore.getImpuestos(),
    pricingStore.getCargarMasterDetalleNotasCotizacion(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    masterusuariosStore.cargarMasterDetallePercepcionAduana(),
    appStore._getContainers(),
  ]);
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: null,
  });
});

function recargar() {
  if (pricingStore.listServices.length > 0) {
    recargarServicios();
    pricingStore.getTipoCostos();
  }
  if (editableStep2.value) {
    recargarCostos();
    // this.$store.state.pricing.index = 0;
  }
}
function continuarComparativa() {
  step.value = 3;
  pricingStore.step = 3;
}
async function activarDatosCarga() {
  appStore.spiner = true;
  await Promise.all([
    pricingStore.getPortBegin({
      id_transport: ((pricingStore.datosPrincipales.idtipocarga as TipoCarga)
        .id_transport
        ? (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id_transport
        : pricingStore.datosPrincipales.idtipocarga) as number | string,
    }),
    pricingStore.getPortEnd({
      id_transport: ((pricingStore.datosPrincipales.idtipocarga as TipoCarga)
        .id_transport
        ? (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id_transport
        : pricingStore.datosPrincipales.idtipocarga) as number | string,
    }),
  ]);
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
  const idTipoCarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;

  const services = [...pricingStore.preServices];
  let serv: Servicio[] = services.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ==
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id,
  );
  Promise.all([
    pricingStore.getTipoCostos(),

    calculadorasStore.getTransporte({
      shimpent: pricingStore.listShipment.find((v) => v.id == idTipoCarga)!
        .code,
      id_modality: pricingStore.datosPrincipales.idsentido as number,
      id_pais: sessionUser().id_pais,
      id_branch: sessionBranchId(),
    }),
  ]);
  const { esgrupalflag } = pricingStore.datosPrincipales;

  if (esgrupalflag) {
    serv = serv.map((v) => {
      if (v.code_service == 14) {
        return {
          ...v,
          status: 0,
        };
      }

      return v;
    });
  }
  pricingStore.listServices = serv;
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
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id,
  );
  // eliminando los servicios que ya no van
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
  // agregando los servicios que faltan
  IdServices = pricingStore.listServices.map((v) => v.code_service);

  serv.forEach((servicios) => {
    if (!IdServices.includes(servicios.code_service)) {
      pricingStore.listServices.push(servicios);
    }
  });
}
async function activarLlenadoCostos() {
  const existeTransporteDestino = pricingStore.listServices.some(
    (v) => v.code_service == 14 && v.status == 1,
  );
  const { id_town, peso } = pricingStore.datosPrincipales;

  let val = calculadorasStore.lstTransporte.some(
    (v) =>
      v.id_distrito == id_town &&
      Number(peso || 0) >= Number(v.peso_desde || 0) &&
      Number(peso || 0) <= Number(v.peso_hasta || 0),
  );

  if (existeTransporteDestino && !val) {
    val = calculadorasStore.lstTransporte.some(
      (v) => v.id_distrito == id_town,
    );
    if (!val) {
      dialogDistrito.value = true;

      return;
    } else {
      dialogPesoVolumen.value = true;

      return;
    }
  }
  continuarLlenadoCostos();
}
async function continuarLlenadoCostos() {
  dialogPesoVolumen.value = false;
  dialogDistrito.value = false;
  const idTipoCarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;

  const { esindividualflag, esgrupalflag } = pricingStore.datosPrincipales;
  appStore.spiner = true;
  await Promise.all([
    pricingStore.getMultiplicador(),

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
  ]);
  appStore.spiner = false;
  if (esgrupalflag) {
    await activarLlenadoCostosGrupal();
  } else if (esindividualflag) {
    await activarLlenadoCostosIndividual();
  }
}
async function activarLlenadoCostosGrupal(
  indiceOpcion = 0,
  mostrarConfirmacion = true,
) {
  appStore.spiner = true;

  const {
    datosPrincipales,
    listServices,
    preCostos,
    listImpuestos,
    listNotasQuote,
    opcionCostos,
  } = pricingStore;
  const {
    idincoterms,
    idsentido,
    idtipocarga,
    containers,
    id_percepcionaduana,
  } = datosPrincipales;
  const codeServicesActivos = new Set(
    listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );
  const idContainersSet = new Set(containers!.map((v) => v.id));
  const COSTOS_ESPECIALES = [69, 114, 105, 39];
  const tipoImportacion = masterusuariosStore.lstPercepcionAduana.find(
    (v) => v.id == id_percepcionaduana,
  );
  const codigoImportacion = tipoImportacion?.codigo;
  const cFiltrado = preCostos.filter(
    (v) =>
      v.id_incoterms == idincoterms &&
      v.id_modality == idsentido &&
      v.id_shipment == (idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(v.code_service) &&
      (!v.escontenedorflag ||
        idContainersSet.has(v.id_container as number | string)),
  );
  const cDuplicado = cFiltrado.flatMap((item) => {
    const flete = obtenerFleteOpcionGrupal(item);
    const fleteVenta = obtenerFleteOpcionVentaGrupal(item);
    const transporte = obtenerTransporteGrupal(item);
    const costoBaseUnitario = 0;
    const baseItem = {
      ...item,
      status: true,
      nro_propuesta: 1,
    };
    const cif = 0;
    const seguro = 0;

    if (COSTOS_ESPECIALES.includes(item.code_cost as number)) {
      return [
        {
          ...baseItem,
          esopcionflag: 1,
          esventaflag: 0,
          cif,
          seguro,
          costounitario:
            costoBaseUnitario +
            parseFloat((flete.monto || 0) as string) +
            parseFloat((fleteVenta.monto || 0) as string),
          tienefleteflag: false,
          fechavigencia: null,
        },
      ];
    }
    let montoprofit: Numerico = 0;
    if ((item.profit_ganancia_pricing?.length as number) > 0) {
      const profitObj = item.profit_ganancia_pricing!.find(
        (v) => v.esgrupalflag,
      );
      if (profitObj) {
        if (codigoImportacion === "01")
          montoprofit = profitObj.profitprimeraimportacion;
        else if (codigoImportacion === "02")
          montoprofit = profitObj.profitsegundaimportacion;
      }
    }
    return [
      {
        ...baseItem,
        esopcionflag: 1,
        esventaflag: 0,
        cif,
        seguro,
        costounitario:
          costoBaseUnitario + parseFloat((flete.monto || 0) as string),
        tienefleteflag: flete.tienefleteflag,
        fechavigencia: flete.fechavigencia,
      },
      {
        ...baseItem,
        esopcionflag: 0,
        esventaflag: 1,
        cif,
        seguro,
        costounitario:
          item.code_cost == 13
            ? parseFloat(String(transporte))
            : parseFloat(String(costoBaseUnitario)) +
              parseFloat((montoprofit || 0) as string) +
              parseFloat((fleteVenta.monto || 0) as string),
        tieneprofitflag: parseFloat(montoprofit as string) > 0,
        tienefleteflag: fleteVenta.tienefleteflag,
        fechavigencia: fleteVenta.fechavigencia,
      },
    ];
  });
  const nro_propuesta = opcionCostos[indiceOpcion]!.nro_propuesta;
  opcionCostos[indiceOpcion]!.listCostos = cDuplicado.map((costo) => ({
    ...costo,
    nro_propuesta,
  }));
  opcionCostos[indiceOpcion]!.listImpuestos = listImpuestos.map(
    (impuesto) => ({ ...impuesto, nro_propuesta }),
  );
  opcionCostos[indiceOpcion]!.listNotasQuote = listNotasQuote
    .filter((v) => v.grupalflag)
    .map((nota) => ({ ...nota, nro_propuesta }));
  appStore.spiner = false;
  if (mostrarConfirmacion) {
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
      showCloseButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        step.value = 2;
        pricingStore.step = 2;
        editableStep2.value = true;
      } else if (result.isDenied) {
        await guardar();
      }
    });
  }
}
async function activarLlenadoCostosIndividual(
  indiceOpcion = 0,
  mostrarConfirmacion = true,
) {
  appStore.spiner = true;

  const {
    datosPrincipales,
    listServices,
    preCostos,
    listImpuestos,
    listNotasQuote,
    opcionCostos,
  } = pricingStore;
  const {
    idincoterms,
    idsentido,
    idtipocarga,
    containers,
    id_percepcionaduana,
  } = datosPrincipales;
  const codeServicesActivos = new Set(
    listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );
  const idContainersSet = new Set(containers!.map((v) => v.id));
  const COSTOS_ESPECIALES = [69, 114, 105, 39];
  const tipoImportacion = masterusuariosStore.lstPercepcionAduana.find(
    (v) => v.id == id_percepcionaduana,
  );
  const codigoImportacion = tipoImportacion?.codigo;
  const cFiltrado = preCostos.filter(
    (v) =>
      v.id_incoterms == idincoterms &&
      v.id_modality == idsentido &&
      v.id_shipment == (idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(v.code_service) &&
      (!v.escontenedorflag ||
        idContainersSet.has(v.id_container as number | string)),
  );
  const cDuplicado = cFiltrado.flatMap((item) => {
    const flete = obtenerFleteOpcionIndividual(item);
    const transporte = obtenerTransporteIndividual(item);
    const costoBaseUnitario = parseFloat((item.costounitario || 0) as string);
    const baseItem = {
      ...item,
      status: true,
      nro_propuesta: 1,
    };
    const cif = parseFloat(String(0.35));
    const seguro = parseFloat(String(0.45));

    if (COSTOS_ESPECIALES.includes(item.code_cost as number)) {
      return [
        {
          ...baseItem,
          esopcionflag: 1,
          esventaflag: 0,
          cif,
          seguro,
          costounitario:
            costoBaseUnitario + parseFloat((flete.monto || 0) as string),
          tienefleteflag: false,
          fechavigencia: null,
        },
      ];
    }

    let montoprofit: Numerico = 0;
    if ((item.profit_ganancia_pricing?.length as number) > 0) {
      const profitObj = item.profit_ganancia_pricing!.find(
        (v) => v.esindividualflag,
      );
      if (profitObj) {
        if (codigoImportacion === "01")
          montoprofit = profitObj.profitprimeraimportacion;
        else if (codigoImportacion === "02")
          montoprofit = profitObj.profitsegundaimportacion;
      }
    }

    return [
      {
        ...baseItem,
        esopcionflag: 1,
        esventaflag: 0,
        cif,
        seguro,
        costounitario:
          (item.code_cost == 13 ? transporte : costoBaseUnitario) +
          parseFloat((flete.monto || 0) as string),
        tienefleteflag: flete.tienefleteflag,
        fechavigencia: flete.fechavigencia,
      },
      {
        ...baseItem,
        esopcionflag: 0,
        esventaflag: 1,
        cif,
        seguro,
        costounitario:
          item.code_cost == 13
            ? parseFloat(String(transporte))
            : costoBaseUnitario +
              parseFloat((montoprofit || 0) as string) +
              parseFloat((flete.monto || 0) as string),
        tieneprofitflag: parseFloat(montoprofit as string) > 0,
        tienefleteflag: flete.tienefleteflag,
        fechavigencia: flete.fechavigencia,
      },
    ];
  });
  const nro_propuesta = opcionCostos[indiceOpcion]!.nro_propuesta;
  opcionCostos[indiceOpcion]!.listCostos = cDuplicado.map((costo) => ({
    ...costo,
    nro_propuesta,
  }));
  opcionCostos[indiceOpcion]!.listImpuestos = listImpuestos.map(
    (impuesto) => ({ ...impuesto, nro_propuesta }),
  );
  opcionCostos[indiceOpcion]!.listNotasQuote = listNotasQuote
    .filter((v) => v.individualflag)
    .map((nota) => ({ ...nota, nro_propuesta }));
  appStore.spiner = false;
  if (mostrarConfirmacion) {
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
      showCloseButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        step.value = 2;
        pricingStore.step = 2;
        editableStep2.value = true;
      } else if (result.isDenied) {
        await guardar();
      }
    });
  }
}
function obtenerFleteOpcionGrupal(item: Costo) {
  const datoFlete: FleteOpcionCosto = { monto: 0, tienefleteflag: false, fechavigencia: null };
  if (item.code_cost == 4) {
    const val = !!calculadorasStore.fletePricing.monto_flete_grupal;
    datoFlete.monto = val
      ? obtenerPrecioUnitarioGrupal(
          item,
          calculadorasStore.fletePricing.monto_flete_grupal,
        )
      : 0;
    datoFlete.tienefleteflag = val;
    datoFlete.fechavigencia = val
      ? calculadorasStore.fletePricing.vigencia_grupal || null
      : null;
  }
  return datoFlete;
}
function obtenerFleteOpcionVentaGrupal(item: Costo) {
  const datoFlete: FleteOpcionCosto = { monto: 0, tienefleteflag: false, fechavigencia: null };
  if (item.code_cost == 7) {
    const tieneFleteVenta =
      !!calculadorasStore.fletePricing.monto_flete_grupal_venta;
    datoFlete.monto = tieneFleteVenta
      ? obtenerPrecioUnitarioGrupal(
          item,
          parseFloat(
            (calculadorasStore.fletePricing.monto_flete_grupal_venta || 0) as string,
          ) -
            parseFloat(
              (calculadorasStore.fletePricing.monto_flete_grupal || 0) as string,
            ),
        )
      : 0;
    datoFlete.tienefleteflag = tieneFleteVenta;
    datoFlete.fechavigencia = tieneFleteVenta
      ? calculadorasStore.fletePricing.vigencia_grupal_venta || null
      : null;
  }
  if (item.code_cost == 4) {
    const tieneFleteVenta =
      !!calculadorasStore.fletePricing.monto_flete_grupal;
    datoFlete.monto = tieneFleteVenta
      ? obtenerPrecioUnitarioGrupal(
          item,
          calculadorasStore.fletePricing.monto_flete_grupal,
        )
      : 0;
    datoFlete.tienefleteflag = tieneFleteVenta;
    datoFlete.fechavigencia = tieneFleteVenta
      ? calculadorasStore.fletePricing.vigencia_grupal || null
      : null;
  }
  if ((datoFlete.monto as number) < 0) {
    datoFlete.monto = 0;
  }
  return datoFlete;
}
function obtenerPrecioUnitarioGrupal(item: Costo, monto: Numerico) {
  let factor = parseFloat(formatearCostoTotal(item) as string) || 0;
  if (
    item.code_cost == 4 &&
    (pricingStore.datosPrincipales.volumen as number) < 1 &&
    factor < 1
  ) {
    factor = 1;
  }
  return factor > 0
    ? Number((parseFloat((monto || 0) as string) / factor).toFixed(3))
    : 0;
}
function obtenerTransporteGrupal(item: Costo) {
  let monto = 0;
  if (item.code_cost == 13) {
    const opcion = 2;
    const pesoActual =
      parseFloat(pricingStore.datosPrincipales.peso as string) || 0;

    const transporte = calculadorasStore.lstTransporte.find(
      (v) =>
        v.id_distrito == pricingStore.datosPrincipales.id_town &&
        v.opcion == opcion &&
        pesoActual >= parseFloat(v.peso_desde as string) &&
        pesoActual <= parseFloat(v.peso_hasta as string),
    );

    if (transporte) {
      monto = parseFloat(transporte.tarifadolar as string);
    }
  }
  return monto;
}
function obtenerFleteOpcionIndividual(item: Costo) {
  const datoFlete: FleteOpcionCosto = { monto: 0, tienefleteflag: false, fechavigencia: null };
  if (item.code_cost == 4) {
    const val = !!calculadorasStore.fletePricing.monto_flete;
    datoFlete.monto = val ? calculadorasStore.fletePricing.monto_flete : 0;
    datoFlete.tienefleteflag = val;
    datoFlete.fechavigencia = val
      ? calculadorasStore.fletePricing.vigencia
      : null;
  }
  return datoFlete;
}
function obtenerTransporteIndividual(item: Costo) {
  let monto = 0;
  if (item.code_cost == 13) {
    const opcion = 1;
    const pesoActual =
      parseFloat(pricingStore.datosPrincipales.peso as string) || 0;
    const transporte = calculadorasStore.lstTransporte.find(
      (v) =>
        v.id_distrito == pricingStore.datosPrincipales.id_town &&
        v.opcion == opcion &&
        pesoActual >= parseFloat(v.peso_desde as string) &&
        pesoActual <= parseFloat(v.peso_hasta as string),
    );
    if (transporte) {
      monto = parseFloat(transporte.tarifadolar as string);
    }
  }
  return monto;
}
async function guardar() {
  appStore.spiner = true;

  pricingStore.opcionCostos[0]!.selected = true;
  await pricingStore.registrarQuote({ fullflag: false }).catch(() => {});
  if (pricingStore.nro_quote) {
    appStore.spiner = false;

    Swal.fire({
      icon: "success",
      title: "Aviso",
      text: pricingStore.mensaje,
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
      const urlGenerada = await pricingStore.crearCarpetaOneDrive({
        nro_quote: pricingStore.nro_quote,
        nombre: pricingStore.datosPrincipales.nombre,
      });

      if (urlGenerada) {
        await pricingStore.actualizarURLEnElQuote({
          id: pricingStore.id,
          url: urlGenerada,
        });
      } else {
        console.error(
          "No se obtuvo URL de OneDrive, se saltó la actualización.",
        );
      }
    }
  }
}
async function anadirNuevaOpcion(nro_propuesta: number) {
  const pricing = pricingStore;
  pricing.opcionCostos.push({
    nro_propuesta,
    date_end: moment().add(7, "days").format("YYYY-MM-DD"),
    tiempo_transito: 35,
    listCostos: [],
    listImpuestos: [],
    listNotasQuote: [],
    selected: false,
  });

  const indiceOpcion = pricing.opcionCostos.length - 1;
  if (pricing.datosPrincipales.esgrupalflag) {
    await activarLlenadoCostosGrupal(indiceOpcion, false);
  } else if (pricing.datosPrincipales.esindividualflag) {
    await activarLlenadoCostosIndividual(indiceOpcion, false);
  }
}
async function recargarCostos() {
  Promise.all([pricingStore.getTipoCostos(), pricingStore.getMultiplicador()]);
  const codeServicesActivos = new Set(
    (pricingStore.listServices || [])
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => v.code_service),
  );

  const c = (pricingStore.preCostos || []).filter(
    (v) =>
      v.id_incoterms === pricingStore.datosPrincipales.idincoterms &&
      v.id_modality === pricingStore.datosPrincipales.idsentido &&
      v.id_shipment ===
        (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id &&
      codeServicesActivos.has(v.code_service),
  );

  let idContainer: (number | string | undefined)[] = [];
  if ((pricingStore.datosPrincipales.containers || []).length > 0) {
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
          cif: pricingStore.datosPrincipales.esgrupalflag
            ? 0
            : parseFloat(String(0.35)),
          seguro: pricingStore.datosPrincipales.esgrupalflag
            ? 0
            : parseFloat(String(0.45)),
          costounitario: pricingStore.datosPrincipales.esgrupalflag
            ? 0
            : item.costounitario,
          nro_propuesta: 1,
        },
      ];
    }

    let montoprofit: Numerico = 0;
    const tipoImportacion = masterusuariosStore.lstPercepcionAduana.find(
      (v) =>
        String(v.id) ===
        String(pricingStore.datosPrincipales.id_percepcionaduana),
    );
    const profitList = item.profit_ganancia_pricing || [];

    if (pricingStore.datosPrincipales.esindividualflag) {
      const profitObj = profitList.find((v) => v.esindividualflag);
      if (tipoImportacion?.codigo == "01") {
        montoprofit = profitObj?.profitprimeraimportacion || 0;
      }
      if (tipoImportacion?.codigo == "02") {
        montoprofit = profitObj?.profitsegundaimportacion || 0;
      }
    }

    if (pricingStore.datosPrincipales.esgrupalflag) {
      const profitObj = profitList.find((v) => v.esgrupalflag);
      if (tipoImportacion?.codigo == "01") {
        montoprofit = profitObj?.profitprimeraimportacion || 0;
      }
      if (tipoImportacion?.codigo == "02") {
        montoprofit = profitObj?.profitsegundaimportacion || 0;
      }
    }

    return [
      {
        ...item,
        nro_propuesta: 1,
        esopcionflag: 1,
        esventaflag: 0,
        status: true,
        cif: pricingStore.datosPrincipales.esgrupalflag
          ? 0
          : parseFloat(String(0.35)),
        seguro: pricingStore.datosPrincipales.esgrupalflag
          ? 0
          : parseFloat(String(0.45)),
        costounitario: pricingStore.datosPrincipales.esgrupalflag
          ? 0
          : item.costounitario,
      },
      {
        ...item,
        nro_propuesta: 1,
        esopcionflag: 0,
        esventaflag: 1,
        status: true,
        cif: parseFloat(String(0.35)),
        seguro: parseFloat(String(0.45)),
        costounitario:
          parseFloat(
            (pricingStore.datosPrincipales.esgrupalflag
              ? 0
              : item.costounitario) as string,
          ) + parseFloat(montoprofit as string),
        tieneprofitflag: parseFloat(montoprofit as string) > 0,
      },
    ];
  });

  pricingStore.opcionCostos = (pricingStore.opcionCostos || []).slice(0, 1);
  pricingStore.index = 0;
  pricingStore.opcionCostos[0]!.listCostos = cDuplicado;
  pricingStore.opcionCostos[0]!.listImpuestos = pricingStore.listImpuestos;
  pricingStore.opcionCostos[0]!.listNotasQuote = pricingStore.listNotasQuote;

  pricingStore.llenadoCostos = true;
  indexCostos.value++;
}
function irVentaCliente() {
  step.value = 2;
  pricingStore.step = 2;
  editableStep3.value = true;
}
function irANotas() {
  step.value = 4;
  pricingStore.step = 4;
  editableStep4.value = true;
  pricingStore.btnRegistrar = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function triggerExcel() {
  if (excelInput.value) excelInput.value.click();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function onExcelSelected(e: { target: { files: FileList | null; value: string | null } }) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  appStore.spiner = true;
  try {
    const rows = await readXlsFile(file);
    const { actualizados } = cargarDesdeExcelDatosPrincipales(rows);
    Swal.fire({
      icon: "success",
      title: "Excel cargado",
      text: `Se actualizaron ${actualizados} campos de la cotización.`,
    });
    await ensurePreliminarStatus();
    await pricingStore.getQuoteStatus();
    await setDefaultStatusPreliminar();
    await emitirPreliminarAuto();
  } catch {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo leer el archivo Excel.",
    });
  } finally {
    appStore.spiner = false;
    e.target.value = null;
  }
}
function cargarDesdeExcelDatosPrincipales(rows: Row[]) {
  if (!Array.isArray(rows) || rows.length < 2) return { actualizados: 0 };
  const norm = (v: unknown) => (v == null ? "" : String(v).trim().toLowerCase());
  const headers = rows[0]!.map((h) => norm(h));
  const findIdx = (...names: string[]) => {
    const targets = names.map((n) => norm(n));
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i]!;
      if (targets.some((t) => h === t || h.includes(t))) return i;
    }
    return -1;
  };
  const row =
    rows.slice(1).find((r) => (r || []).some((v) => norm(v) !== "")) ||
    rows[1]!;
  let cambios = 0;
  const sp = pricingStore;

  const idxMarketing = findIdx("marketing", "tipo de marketing");
  const idxStatus = findIdx(
    "status",
    "estado",
    "estado de la cotizacion",
    "estado de la cotización",
  );
  const idxEjecutivo = findIdx("ejecutivo", "vendedor");
  const idxPricing = findIdx("pricing", "analista pricing");
  const idxCliente = findIdx(
    "cliente",
    "nombre cliente",
    "razon social",
    "razón social",
  );
  const idxTelefono = findIdx("telefono", "teléfono");
  const idxSentido = findIdx("sentido", "modality", "modalidad");
  const idxShipment = findIdx("tipo de embarque", "embarque", "shipment");
  const idxIncoterms = findIdx("incoterms", "incoterm");
  const idxProveedor = findIdx("proveedor", "nombre proveedor");
  const idxTelProveedor = findIdx(
    "telefono proveedor",
    "teléfono proveedor",
  );
  const idxDirProveedor = findIdx(
    "direccion proveedor",
    "dirección proveedor",
  );

  if (idxMarketing > -1) {
    const val = norm(row[idxMarketing]);
    const it = (sp.listMarketing || []).find(
      (x) => x && norm(x.name) === val,
    );
    if (it) {
      sp.datosPrincipales.id_marketing = it.id;
      cambios++;
    }
  }
  if (idxStatus > -1) {
    const val = norm(row[idxStatus]);
    const it = (sp.listQuoteStatus || []).find(
      (x) => x && norm(x.name) === val,
    );
    if (it) {
      sp.datosPrincipales.id_status = it.id;
      cambios++;
    }
  }
  if (idxEjecutivo > -1) {
    const val = norm(row[idxEjecutivo]);
    const it = (sp.listEjecutivo || []).find(
      (x) => x && norm(x.nombrecompleto) === val,
    );
    if (it) {
      sp.datosPrincipales.id_vendedor = it.id;
      cambios++;
    }
  }
  if (idxPricing > -1) {
    const val = norm(row[idxPricing]);
    const it = (sp.listEjecutivo || []).find(
      (x) => x && norm(x.nombrecompleto) === val,
    );
    if (it) {
      sp.datosPrincipales.id_pricing = it.id;
      cambios++;
    }
  }
  if (idxCliente > -1) {
    const val = row[idxCliente];
    if (norm(val) !== "") {
      sp.datosPrincipales.nombre = String(val);
      cambios++;
    }
  }
  if (idxTelefono > -1) {
    const val = row[idxTelefono];
    if (norm(val) !== "") {
      sp.datosPrincipales.telefono = String(val);
      cambios++;
    }
  }
  if (idxSentido > -1) {
    const val = norm(row[idxSentido]);
    const it = (sp.listModality || []).find(
      (x) =>
        norm(x.name) === val ||
        norm(x.name).includes(val) ||
        val.includes(norm(x.name)),
    );
    if (it) {
      sp.datosPrincipales.idsentido = it.id;
      cambios++;
    }
  }
  if (idxShipment > -1) {
    const val = norm(row[idxShipment]);
    const it = (sp.listShipment || []).find(
      (x) =>
        norm(x.embarque) === val ||
        norm(x.embarque).includes(val) ||
        val.includes(norm(x.embarque)),
    );
    if (it) {
      sp.datosPrincipales.idtipocarga = it;
      cambios++;
    }
  }
  if (idxIncoterms > -1) {
    const val = norm(row[idxIncoterms]);
    const it = (sp.listIncoterms || []).find(
      (x) => x && (norm(x.name) === val || norm(x.text || "") === val),
    );
    if (it) {
      sp.datosPrincipales.idincoterms = it.id;
      cambios++;
    }
  }
  if (idxProveedor > -1) {
    const val = row[idxProveedor];
    if (norm(val) !== "") {
      sp.datosPrincipales.proveedor = String(val);
      cambios++;
    }
  }
  if (idxTelProveedor > -1) {
    const val = row[idxTelProveedor];
    if (norm(val) !== "") {
      sp.datosPrincipales.telefonoproveedor = String(val);
      cambios++;
    }
  }
  if (idxDirProveedor > -1) {
    const val = row[idxDirProveedor];
    if (norm(val) !== "") {
      sp.datosPrincipales.direccionproveedor = String(val);
      cambios++;
    }
  }
  return { actualizados: cambios };
}
async function ensurePreliminarStatus() {
  const estados = pricingStore.listQuoteStatus || [];
  const existe = estados.some(
    (e) =>
      typeof e.name === "string" &&
      e.name.toLowerCase().includes("preliminar"),
  );
  if (existe) return;
  // await this.createPreliminarStatus();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createPreliminarStatus() {
  try {
    await quoteStatusStore.MaxPositionQuoteStatus();
    const max = quoteStatusStore;
    const id_branch = sessionBranchId();
    quoteStatusStore.StatusModel = {
      id: "",
      name: "PRELIMINAR",
      code: "",
      position: (max.max_position || 0) + 1,
      position_select: (max.max_position_select || 0) + 1,
      position_report: (max.max_position_report || 0) + 1,
      position_calls: (max.max_position_calls || 0) + 1,
      status_calls: 0,
      status_calls_all: 0,
      description: "Cotización preliminar",
      status: 1,
      id_branch,
    };
    await quoteStatusStore.setQuoteStatus();
  } catch {}
}
function setDefaultStatusPreliminar() {
  const estados = pricingStore.listQuoteStatus || [];
  if (!Array.isArray(estados) || estados.length === 0) return;
  const prelim = estados.find(
    (e) =>
      typeof e.name === "string" &&
      e.name.toLowerCase().includes("preliminar") &&
      e.status == 1,
  );
  if (prelim) {
    pricingStore.datosPrincipales.id_status = prelim.id;
    return;
  }
  const activo = estados.find((e) => e.status == 1) || estados[0];
  if (activo) {
    pricingStore.datosPrincipales.id_status = activo.id;
  }
}
async function emitirPreliminarAuto() {
  pricingStore.opcionCostos[0]!.selected = true;
  try {
    await pricingStore.registrarQuote({ fullflag: false });
    Swal.fire({
      icon: "success",
      title: "Preliminar emitida",
      text: "La cotización preliminar fue registrada automáticamente.",
    });
  } catch {}
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recargarGrupalFlag() {
  mostrarCostos = false;
  setTimeout(async () => {
    mostrarCostos = true;
  }, 200);
}
function formatearCostoTotal(valor: Costo) {
  // 1. Desestructuración de los estados del Vuex para escribir menos y más limpio
  const { listMultiplicador, datosPrincipales } = pricingStore;
  const multiplicadores = listMultiplicador || [];

  // 2. Buscamos el multiplicador correspondiente UNA SOLA VEZ
  const multEncontrado = multiplicadores.find(
    (v) => v.id === valor.id_multiplicador,
  );

  // 3. Extraemos las variables con valores por defecto si no existe el multiplicador
  const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0; // eslint-disable-line @typescript-eslint/no-unused-vars
  const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

  // 4. Ejecutamos la función calcularFac pasándole los datos de pricing
  const factorCalculado = calcularFac(
    codigoMultiplicador,
    datosPrincipales.volumen,
    datosPrincipales.peso,
    datosPrincipales.containers,
    datosPrincipales.amount,
  );
  return factorCalculado;
}
// ...mapState(["preServices", "preCostos"]),
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
          :editable="editableStep3"
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
                    @recargar-servicios-costos="recargar"
                    @activar-datos-carga="activarDatosCarga"
                    :recargar-flag="DatosCargaComponentFlag"
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
                :services-component-flag="ServicesComponentFlag"
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

    <!-- DIÁLOGO: NO EXISTE TARIFA DE TRANSPORTE -->
    <v-dialog
      v-model="dialogPesoVolumen"
      max-width="30%"
      persistent
    >
      <v-card
        class="alert-card text-center"
        elevation="0"
      >
        <div class="alert-illustration">
          <v-img
            src="/img/jpg/transporte.jpg"
            max-width="250"
            height="225"
          />
        </div>

        <div class="alert-heading">
          <div class="alert-title">
            NO EXISTE TARIFA DE
          </div>

          <div class="alert-banner">
            TRANSPORTE
          </div>
        </div>

        <div class="alert-description">
          El peso o volumen ingresado
          <strong>supera lo registrado</strong>
          en el sistema.
        </div>

        <v-card-actions class="justify-center alert-actions">
          <v-btn
            color="primary"
            class="alert-button"
            rounded
            variant="flat"
            @click="continuarLlenadoCostos()"
          >
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: DISTRITO SIN TARIFA -->
    <v-dialog
      v-model="dialogDistrito"
      max-width="30%"
      persistent
    >
      <v-card
        class="alert-card text-center"
        elevation="0"
      >
        <div class="alert-illustration">
          <v-img
            src="/img/jpg/map.jpg"
            max-width="250"
            height="225"
          />
        </div>

        <div class="alert-heading">
          <div class="alert-title alert-title-single">
            DISTRITO
          </div>

          <div class="alert-banner">
            SIN TARIFA
          </div>
        </div>

        <div class="alert-description">
          El distrito seleccionado
          <strong>no cuenta con tarifa</strong>
          en el sistema.
        </div>

        <v-card-actions class="justify-center alert-actions">
          <v-btn
            color="primary"
            class="alert-button"
            rounded
            variant="flat"
            @click="continuarLlenadoCostos()"
          >
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.align-right {
  text-align: right;
}

.alert-card {
  padding: 10px 10px 8px;
  border: 2px solid #d2edfc;
  border-radius: 17px !important;
  background: #edf7fd !important;
  overflow: hidden;
}

.alert-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  margin-bottom: 3px;
}

.alert-illustration .v-img {
  max-width: 145px !important;
  height: 120px !important;
}

.alert-heading {
  margin: 0 0 10px;
  color: #08234d;
  font-weight: 900;
  letter-spacing: -0.4px;
  line-height: 1.1;
}

.alert-title {
  font-size: 19px;
  margin-bottom: 5px;
}

.alert-title-single {
  font-size: 27px;
  margin-bottom: 5px;
}

.alert-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 43px;
  padding: 5px 6px;
  border-radius: 8px;
  background: #2169b4;
  color: #fff;
  font-size: 27px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1.05;
}

.alert-description {
  padding: 10px 7px;
  margin-bottom: 3px;
  border: 1px solid #edf1f5;
  border-radius: 13px;
  background: #fff;
  color: #435977;
  font-size: 14px;
  line-height: 1.4;
}

.alert-description strong {
  color: #2169b4;
  font-weight: 800;
}

.alert-actions {
  padding: 6px 0 0;
}

.alert-button {
  min-width: 110px !important;
  min-height: 34px !important;
  padding: 0 18px !important;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 400px) {
  .alert-title {
    font-size: 16px;
  }

  .alert-banner {
    font-size: 23px;
    min-height: 39px;
  }

  .alert-description {
    font-size: 12px;
    padding: 9px 6px;
  }
}
</style>
