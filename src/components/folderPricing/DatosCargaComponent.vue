<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useTownStore } from "@/stores/town";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";
import { sessionIsoPais, sessionSucursal } from "@/utils/sesion";
import type { TipoContenedor } from "@/types/catalogos";
import type {
  Costo,
  FilaMedidaCarga,
  FleteOpcionCosto,
  FormMedidasCarga,
  Numerico,
  Puerto,
  TipoCarga,
  TotalMedidaCarga,
} from "@/types/cotizacion";

const props = withDefaults(
  defineProps<{
    mostrarBtn?: boolean;
    abrirModalContenedorRecargar?: boolean;
    servicesComponentFlag?: boolean;
  }>(),
  { mostrarBtn: true, abrirModalContenedorRecargar: false, servicesComponentFlag: false },
);
const emit = defineEmits<{
  recargarGrupalFlag: [];
  recargarCostos: [abrirModal?: boolean];
  activarServicios: [];
}>();

const rootStore = useStore();
const pricingStore = usePricingStore();
const calculadorasStore = useCalculadorasStore();
const masterusuariosStore = useMasterusuariosStore();
const townStore = useTownStore();
const { calcularFac } = useCotizacionCalculos();

const dialogCambiarPercepcionAduana = ref(false);
const dialogSeleccionDistrito = ref(false);
const idTownSeleccionado = ref<number | string | null>(null);
const errorIdTown = ref("");
const mostrarContinuarFlag = ref(true);
const headers = [
  { title: "", key: "action" },
  { title: "#", key: "number" },
  { title: "Tipo Contendor", key: "description" },
  { title: "Cantidad", key: "cantidad" },
];
const id_percepcionaduana = ref<number | string | null | undefined>(null);
const dialogConteiner = ref(false);
const numerobultos = ref("");
const volumen = ref("");
const peso = ref("");
const err = ref("");
const containers = ref({
  container: "" as unknown as TipoContenedor,
  cantidad: "",
});
const calculadoraFlag = ref(false);
const puertoOrigenDebounce = ref<ReturnType<typeof setTimeout> | null>(null);
const puertoDestinoDebounce = ref<ReturnType<typeof setTimeout> | null>(null);
const unidadesLongitud = [
  { text: "Centimetros", value: 1, factor: 0.01 },
  { text: "Metros", value: 2, factor: 1 },
  { text: "Pulgadas", value: 3, factor: 0.0254 },
  { text: "Pie", value: 4, factor: 0.3048 },
  { text: "Milímetros", value: 5, factor: 0.001 },
];
const unidadesPeso = [
  { text: "Kilo", value: 1, factor: 1 },
  { text: "Libra", value: 2, factor: 0.4535 },
  { text: "Tonelada", value: 3, factor: 1000 },
];
const fromMedidas = ref<FormMedidasCarga>({
  idLongitud: null,
  idpeso: null,
  bultos: null,
  largo: null,
  ancho: null,
  alto: null,
  peso: null,
});
const tblMedida = ref<FilaMedidaCarga[]>([]);
const tblTotal = ref<TotalMedidaCarga>({
  descripcion: null,
  uni: null,
  peso: null,
  volumen: null,
});
const frmPuerto = useTemplateRef("frmPuerto");
const frmDatosCarga = useTemplateRef("frmDatosCarga");
const frmContainer = useTemplateRef("frmContainer");
const calcularPesoFrom = useTemplateRef("calcularPesoFrom");

const abrirModalContenedor = computed(() => pricingStore.abrirModalContenedor);
const containersList = computed(() => {
  const containers = pricingStore.datosPrincipales.containers;
  return Array.isArray(containers) ? containers : [];
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPuertoOrigen = computed(() => {
  let puertos: Puerto[] = [];

  if (pricingStore.datosPrincipales.iddestino) {
    const id_port = pricingStore.listPortEnd.filter(
      (v) => v.id_port == pricingStore.datosPrincipales.iddestino,
    )[0]!.id_port;
    puertos = pricingStore.listPortBegin.filter((v) => v.id_port != id_port);
  } else {
    return pricingStore.listPortBegin;
  }
  return puertos;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPuertoDestino = computed(() => {
  let puertos: Puerto[] = [];
  if (pricingStore.datosPrincipales.idorigen) {
    const id_port = pricingStore.listPortBegin.filter(
      (v) => v.id_port == pricingStore.datosPrincipales.idorigen,
    )[0]!.id_port;
    puertos = pricingStore.listPortEnd.filter((v) => v.id_port != id_port);
  } else {
    puertos = pricingStore.listPortEnd;
  }
  return puertos;
});

const isFcl = computed(() => {
  const tipoCarga = pricingStore.datosPrincipales.idtipocarga;
  if (tipoCarga && typeof tipoCarga === "object") {
    return tipoCarga.code === "FCL";
  }
  return (pricingStore.listShipment || []).some(
    (item) => item && item.id == tipoCarga && item.code == "FCL",
  );
});
const isAereo = computed(() => {
  const inVal = ["Aéreo", "LCL"];
  const tipo = pricingStore.datosPrincipales.idtipocarga;
  const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
  if (!id) return false;
  const items = pricingStore.listShipment || [];
  const it = items.find((v) => v.id == id);
  return it && inVal.includes(it.code!);
});
const ocultarLCL = computed(() => {
  const inVal = ["LCL"];
  const tipo = pricingStore.datosPrincipales.idtipocarga;
  const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
  if (!id) return false;
  const items = pricingStore.listShipment || [];
  const it = items.find((v) => v.id == id);
  return it && inVal.includes(it.code!);
});
const pesoVolumetrico = computed(() => {
  if (!isAereo.value) return null;

  const datos = pricingStore.datosPrincipales || {};
  const volumen = parseFloat((datos.volumen || 0) as string); // m³
  if (!volumen) return null;

  const pv = volumen > 0 ? volumen * 166.66 : 0;
  if (!pv || !isFinite(pv)) return null;
  return parseFloat(pv.toFixed(2));
});
const pesoCargable = computed(() => {
  if (!isAereo.value) return null;

  const datos = pricingStore.datosPrincipales || {};
  const pesoReal = parseFloat((datos.peso || 0) as string); // kg
  const volumen = parseFloat((datos.volumen || 0) as string); // m³

  if (!pesoReal && !volumen) return null;

  const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

  const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
  if (!chargeable || !isFinite(chargeable)) return null;
  return parseFloat(chargeable.toFixed(2));
});
const proxyIndividual = computed({
  get() {
    return pricingStore.datosPrincipales.esindividualflag;
  },
  set(valor) {
    if (pricingStore.datosPrincipales.id) {
      confirmarCambio("individual", valor);
    } else {
      const cambioDesdeGrupal = pricingStore.datosPrincipales.esgrupalflag;
      pricingStore.datosPrincipales.esindividualflag = true;
      pricingStore.datosPrincipales.esgrupalflag = false;
      if (cambioDesdeGrupal) {
        cambiarServicioTransporteActivo();
      }
      cambiarNotasIndividualGrupal({
        esgrupalflag: false,
        esindividualflag: true,
      });
      setTimeout(() => {
        cambiarImpuesto();
        if (cambioDesdeGrupal) {
          id_percepcionaduana.value =
            pricingStore.datosPrincipales.id_percepcionaduana;
          dialogCambiarPercepcionAduana.value = true;
        }
      }, 100);
    }
  },
});
const proxyGrupal = computed({
  get() {
    return pricingStore.datosPrincipales.esgrupalflag;
  },
  set(valor) {
    if (pricingStore.datosPrincipales.id) {
      confirmarCambio("grupal", valor);
    } else {
      const percepcionAduana = masterusuariosStore.lstPercepcionAduana.find(
        (v) => v.codigo == "02",
      );
      pricingStore.datosPrincipales.id_percepcionaduana = percepcionAduana!.id;
      pricingStore.datosPrincipales.esgrupalflag = true;
      pricingStore.datosPrincipales.esindividualflag = false;
      desactivarTransporteParaGrupal();
      cambiarNotasIndividualGrupal({
        esgrupalflag: true,
        esindividualflag: false,
      });
      setTimeout(() => {
        cambiarImpuesto();
      }, 100);
    }
  },
});

watch(
  () => props.abrirModalContenedorRecargar,
  () => {
    if (containersList.value.length == 0) {
      dialogConteiner.value = true;
    }
  },
);
watch(abrirModalContenedor, async () => {
  const isFCL = pricingStore.listShipment.some(
    (v) =>
      v.id ==
        ((pricingStore.datosPrincipales.idtipocarga as TipoCarga).id
          ? (pricingStore.datosPrincipales.idtipocarga as TipoCarga).id
          : pricingStore.datosPrincipales.idtipocarga) &&
      v.code == "FCL",
  );
  if (isFCL && containersList.value.length == 0) {
    dialogConteiner.value = true;
  }
  if (
    !isFCL &&
    (pricingStore.datosPrincipales.numerobultos == 0 ||
      pricingStore.datosPrincipales.peso == 0 ||
      pricingStore.datosPrincipales.volumen == 0)
  ) {
    Swal.fire({
      icon: "info",
      title: "Importante",
      text: "Es necesario llenar los datos, el Nro Bultos, Volumen, Peso.",
    });
  }
});

// console.log("listPortEnd", this.$store.state.pricing.listPortEnd);
onBeforeUnmount(() => {
  clearTimeout(puertoOrigenDebounce.value!);
  clearTimeout(puertoDestinoDebounce.value!);
});

function cambiarGrupalIndividual() {
  const { esindividualflag, esgrupalflag } = pricingStore.datosPrincipales;

  if (esgrupalflag) {
    if (esgrupalflag === true) {
      pricingStore.datosPrincipales.esindividualflag = false;
      const percepcionAduana = masterusuariosStore.lstPercepcionAduana.find(
        (v) => v.codigo == "02",
      );
      pricingStore.datosPrincipales.id_percepcionaduana = percepcionAduana!.id;
      setTimeout(() => {
        Promise.all([
          cambiarMontosACero({
            esgrupalflag: esgrupalflag,
            esindividualflag: esindividualflag,
          }),
          cambiarNotasIndividualGrupal({
            esgrupalflag: esgrupalflag,
            esindividualflag: esindividualflag,
          }),
        ]);
      }, 500);
    }
  } else if (esindividualflag) {
    pricingStore.datosPrincipales.esgrupalflag = false;
    setTimeout(() => {
      Promise.all([
        cambiarMontosACero({
          esgrupalflag: esgrupalflag,
          esindividualflag: esindividualflag,
        }),
        cambiarNotasIndividualGrupal({
          esgrupalflag: false,
          esindividualflag: true,
        }),
      ]);
    }, 100);
  }
  cambiarImpuesto();
}
function cambiarMontosACero({
  esgrupalflag = false,
  esindividualflag = false,
}: {
  esgrupalflag?: boolean;
  esindividualflag?: boolean;
}) {
  const codeServicesActivos = new Set(
    pricingStore.listServices
      .filter((v) => v.status === true || v.status === 1)
      .map((v) => Number(v.code_service)),
  );

  const costos = [...pricingStore.preCostos];
  const idTipoCarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;

  const preCostosFiltrados = costos.filter(
    (v) =>
      v.id_incoterms == pricingStore.datosPrincipales.idincoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment == idTipoCarga &&
      codeServicesActivos.has(Number(v.code_service)),
  );

  const tipoImportacion = masterusuariosStore.lstPercepcionAduana.find(
    (v) => v.id == pricingStore.datosPrincipales.id_percepcionaduana,
  );
  const codigoImportacion = tipoImportacion?.codigo;

  const COSTOS_ESPECIALES = [69, 114, 105, 39];

  pricingStore.opcionCostos.forEach((opcion) => {
    opcion.listCostos.forEach((element) => {
      const esCostoTransporte = Number(element.code_cost) === 13;

      if (esCostoTransporte && !pricingStore.datosPrincipales.id_town) {
        element.costounitario = 0;
        element.tienefleteflag = false;
        element.fechavigencia = null;
        element.tieneprofitflag = false;
        element.cif = esgrupalflag ? 0 : parseFloat(String(0.35));
        element.seguro = esgrupalflag ? 0 : parseFloat(String(0.45));
        return;
      }

      const flete = obtenerFleteOpcion(element);
      const fleteVenta = obtenerFleteOpcionVenta(element);
      const transporte = obtenerTransporte(element);

      const costoBase = preCostosFiltrados.find(
        (v) => v.code_cost == element.code_cost,
      );

      if (costoBase) {
        const costoBaseUnitario = parseFloat(
          (esgrupalflag ? 0 : costoBase.costounitario || 0) as string,
        );

        // CASO A: COSTOS ESPECIALES
        if (COSTOS_ESPECIALES.includes(element.code_cost as number)) {
          element.costounitario =
            costoBaseUnitario +
            parseFloat((flete.monto || 0) as string) +
            parseFloat((fleteVenta.monto || 0) as string);
          element.tienefleteflag = false;
          element.fechavigencia = null;
        } else {
          // CASO B: COSTOS NORMALES CON CODE_COST
          if (element.esventaflag === 1 || element.esventaflag === true) {
            let montoprofit: Numerico = 0;

            if ((costoBase.profit_ganancia_pricing?.length as number) > 0) {
              const profitObj = costoBase.profit_ganancia_pricing!.find((v) =>
                esindividualflag ? v.esindividualflag : v.esgrupalflag,
              );
              if (profitObj) {
                if (codigoImportacion === "01")
                  montoprofit = profitObj.profitprimeraimportacion || 0;
                else if (codigoImportacion === "02")
                  montoprofit = profitObj.profitsegundaimportacion || 0;
              }
            }

            element.costounitario =
              element.code_cost == 13
                ? parseFloat(String(transporte))
                : parseFloat(String(costoBaseUnitario)) +
                  parseFloat(montoprofit as string) +
                  parseFloat((!esgrupalflag ? flete.monto || 0 : 0) as string) +
                  parseFloat((esgrupalflag ? fleteVenta.monto || 0 : 0) as string);

            element.tieneprofitflag = parseFloat(montoprofit as string) > 0;
            element.tienefleteflag = esindividualflag
              ? flete.tienefleteflag
              : fleteVenta.tienefleteflag;
            element.fechavigencia = esindividualflag
              ? flete.fechavigencia
              : fleteVenta.fechavigencia;
          } else if (
            element.esopcionflag === 1 ||
            element.esopcionflag === true
          ) {
            element.costounitario =
              (esgrupalflag
                ? 0
                : element.code_cost == 13
                ? transporte
                : costoBaseUnitario) + parseFloat((flete.monto || 0) as string);

            element.tienefleteflag = flete.tienefleteflag;
            element.fechavigencia = flete.fechavigencia;
          }
        }
      } else {
        // CASO C: ÍTEMS SIN CODE_COST
        // Se conserva el ítem en la lista, pero si pasa a grupal, su monto se resetea a 0
        if (esgrupalflag) {
          element.costounitario = 0;
          element.tienefleteflag = false;
          element.fechavigencia = null;
          element.tieneprofitflag = false;
        }
      }

      // Asignación de CIF y Seguro según modalidad
      element.cif = esgrupalflag ? 0 : parseFloat(String(0.35));
      element.seguro = esgrupalflag ? 0 : parseFloat(String(0.45));
    });
  });

  setTimeout(() => {
    emit("recargarGrupalFlag");
  }, 500);
}
function cambiarNotasIndividualGrupal({
  esgrupalflag = false,
  esindividualflag = false,
}: {
  esgrupalflag?: boolean;
  esindividualflag?: boolean;
} = {}) {
  const newNotas = pricingStore.listNotasQuote.filter((v) =>
    esindividualflag ? v.individualflag : esgrupalflag && v.grupalflag,
  );

  pricingStore.opcionCostos.forEach((element) => {
    element.listNotasQuote = [
      ...element.listNotasQuote.filter((v) => v.estado == 0),
      ...newNotas.map((v) => ({ ...v, id: null, estado: 1 })),
    ];
  });
}
function esFobFlag() {
  const valBranch = [1, 2, "1", "2"];
  const branch = sessionSucursal();

  if (!valBranch.includes(branch.id)) return false;
  return true;
  // return this.$store.state.pricing.listIncoterms.some(
  //   (v) =>
  //     v.id == this.$store.state.pricing.datosPrincipales.idincoterms &&
  //     v.name == "FOB",
  // );
}
function obtenerFleteOpcion(item: Costo) {
  const datoFlete: FleteOpcionCosto = { monto: 0, tienefleteflag: false, fechavigencia: null };
  if (item.code_cost == 4) {
    if (pricingStore.datosPrincipales.esindividualflag) {
      const val = !!calculadorasStore.fletePricing.monto_flete;
      datoFlete.monto = val ? calculadorasStore.fletePricing.monto_flete : 0;
      datoFlete.tienefleteflag = val;
      datoFlete.fechavigencia = val
        ? calculadorasStore.fletePricing.vigencia
        : null;
    }
    if (pricingStore.datosPrincipales.esgrupalflag) {
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
  }
  return datoFlete;
}
function obtenerFleteOpcionVenta(item: Costo) {
  const datoFlete: FleteOpcionCosto = { monto: 0, tienefleteflag: false, fechavigencia: null };
  if (item.code_cost == 7 && item.esventaflag == 1) {
    if (pricingStore.datosPrincipales.esgrupalflag) {
      const val = !!calculadorasStore.fletePricing.monto_flete_grupal_venta;
      datoFlete.monto = val
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
      datoFlete.tienefleteflag = val;
      datoFlete.fechavigencia = val
        ? calculadorasStore.fletePricing.vigencia_grupal_venta || null
        : null;
    }
  }
  if (item.code_cost == 4 && item.esventaflag == 1) {
    if (pricingStore.datosPrincipales.esgrupalflag) {
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
  }
  if ((datoFlete.monto as number) < 0) {
    datoFlete.monto = 0;
  }
  return datoFlete;
}
function obtenerPrecioUnitarioGrupal(item: Costo, monto: Numerico) {
  const { listMultiplicador, datosPrincipales } = pricingStore;
  const multiplicador = (listMultiplicador || []).find(
    (v) => v.id == item.id_multiplicador,
  );
  let factor: Numerico = multiplicador
    ? calcularFac(
        multiplicador.code,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      )
    : 0;
  if (
    item.code_cost == 4 &&
    (datosPrincipales.volumen as number) < 1 &&
    (factor as number) < 1
  ) {
    factor = 1;
  }
  return (factor as number) > 0
    ? Number((parseFloat((monto || 0) as string) / (factor as number)).toFixed(3))
    : 0;
}
function recargarPuertoOrigen(textoBuscar: string) {
  clearTimeout(puertoOrigenDebounce.value!);
  if (!textoBuscar) return;

  puertoOrigenDebounce.value = setTimeout(() => {
    buscarPuertoOrigen(textoBuscar);
  }, 300);
}
async function buscarPuertoOrigen(textoBuscar: string) {
  const idtipocarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;

  const id_transport = pricingStore.listShipment.filter(
    (v) => v.id == idtipocarga,
  );

  await pricingStore.getPortBegin({
    id_transport: id_transport[0]!.id_transport!,
    id: pricingStore.datosPrincipales.idorigen,
    search: textoBuscar,
  });
}

function recargarPuertoDestino(textoBuscar: string) {
  clearTimeout(puertoDestinoDebounce.value!);
  if (!textoBuscar) return;

  puertoDestinoDebounce.value = setTimeout(() => {
    buscarPuertoDestino(textoBuscar);
  }, 300);
}
async function buscarPuertoDestino(textoBuscar: string) {
  const idtipocarga =
    typeof pricingStore.datosPrincipales.idtipocarga === "object"
      ? pricingStore.datosPrincipales.idtipocarga.id
      : pricingStore.datosPrincipales.idtipocarga;
  const id_transport = pricingStore.listShipment.filter(
    (v) => v.id == idtipocarga,
  );
  await pricingStore.getPortEnd({
    id_transport: id_transport[0]!.id_transport!,
    id: pricingStore.datosPrincipales.iddestino,
    search: textoBuscar,
  });
}
async function anadirCarga() {
  if ((await frmDatosCarga.value!.validate()).valid) {
    pricingStore.datosPrincipales.numerobultos = numerobultos.value;
    pricingStore.datosPrincipales.volumen = volumen.value;
    pricingStore.datosPrincipales.peso = peso.value;
    const datos = pricingStore.datosPrincipales;
    const idTipoCarga =
      typeof datos.idtipocarga === "object"
        ? datos.idtipocarga.id
        : datos.idtipocarga;
    const shipment = pricingStore.listShipment.find(
      (v) => v.id == idTipoCarga,
    );
    const puertoOrigen = pricingStore.listPortBegin.find(
      (v) => v.id_port == datos.idorigen,
    );
    const puertoDestino = pricingStore.listPortEnd.find(
      (v) => v.id_port == datos.iddestino,
    );
    rootStore.state.spiner = true;
    if (!!datos.idorigen && !!datos.iddestino) {
      await calculadorasStore.obtenerFleteCalculadora({
        shipment: shipment!.code,
        puerto_origen: puertoOrigen!.puerto!,
        puerto_destino: puertoDestino!.puerto!,
        volumen: datos.volumen,
        peso: datos.peso,
      });
    }
    rootStore.state.spiner = false;
    const { esgrupalflag, esindividualflag } = datos;
    cambiarMontosACero({ esgrupalflag, esindividualflag });
    frmDatosCarga.value!.reset();
    pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
  }
}
function cambiarServicioTransporteActivo() {
  const servicio = pricingStore.listServices.find(
    (s) => Number(s.code_service) === 14,
  );

  if (servicio) {
    servicio.status = 1;
  }

  const { datosPrincipales, preCostos, opcionCostos } = pricingStore;
  const idTipoCarga =
    typeof datosPrincipales.idtipocarga === "object"
      ? datosPrincipales.idtipocarga.id
      : datosPrincipales.idtipocarga;
  const idContainers = new Set(
    (datosPrincipales.containers || []).map((container) =>
      Number(container.id || container.id_containers),
    ),
  );
  const costosServicio = (preCostos || []).filter(
    (costo) =>
      (Number(costo.code_service) === 14 ||
        (servicio?.id_groupservices &&
          Number(costo.id_groupservices) ===
            Number(servicio.id_groupservices)) ||
        (servicio?.id &&
          Number(costo.id_services) === Number(servicio.id))) &&
      Number(costo.id_incoterms) === Number(datosPrincipales.idincoterms) &&
      Number(costo.id_modality) === Number(datosPrincipales.idsentido) &&
      Number(costo.id_shipment) === Number(idTipoCarga) &&
      (!costo.escontenedorflag ||
        idContainers.has(Number(costo.id_container))),
  );
  const costosEspeciales = [69, 114, 105, 39];

  opcionCostos.forEach((opcion) => {
    const costosActuales = opcion.listCostos || [];
    const nuevosCostos = costosServicio.flatMap((costo) => {
      const tiposCosto = costosEspeciales.includes(Number(costo.code_cost))
        ? [{ esopcionflag: 1, esventaflag: 0 }]
        : [
            { esopcionflag: 1, esventaflag: 0 },
            { esopcionflag: 0, esventaflag: 1 },
          ];

      return tiposCosto
        .filter(
          ({ esopcionflag, esventaflag }) =>
            !costosActuales.some(
              (actual) =>
                (Number(actual.code_service) === 14 ||
                  (servicio?.id_groupservices &&
                    Number(actual.id_groupservices) ===
                      Number(servicio.id_groupservices)) ||
                  (servicio?.id &&
                    Number(actual.id_services) === Number(servicio.id))) &&
                Number(actual.code_cost) === Number(costo.code_cost) &&
                String(actual.id_multiplicador || "N") ===
                  String(costo.id_multiplicador || "N") &&
                Number(actual.id_container || 0) ===
                  Number(costo.id_container || 0) &&
                Number(actual.esopcionflag) === esopcionflag &&
                Number(actual.esventaflag) === esventaflag,
            ),
        )
        .map((tipoCosto) => ({
          ...costo,
          ...tipoCosto,
          id: 0,
          nro_propuesta: opcion.nro_propuesta,
          status: true,
          costounitario: 0,
          cif: 0.35,
          seguro: 0.45,
        }));
    });

    if (nuevosCostos.length) {
      opcion.listCostos = [...costosActuales, ...nuevosCostos];
    }
  });
}
function desactivarTransporteParaGrupal() {
  const servicioTransporte = pricingStore.listServices.find(
    (servicio) => Number(servicio.code_service) === 14,
  );
  if (servicioTransporte) {
    servicioTransporte.status = false;
  }
  pricingStore.datosPrincipales.id_town = null;
}
async function guardarContainer() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cantCostos = pricingStore.listCostos.length;

  err.value = "";
  if ((await frmContainer.value!.validate()).valid) {
    if (!Array.isArray(pricingStore.datosPrincipales.containers)) {
      pricingStore.datosPrincipales.containers = [];
    }
    if (
      containersList.value.filter(
        (v) => v.id == containers.value.container.id,
      ).length == 0
    ) {
      containersList.value.push({
        id_containers: containers.value.container.id,
        id: containers.value.container.id,
        description: containers.value.container.name,
        cantidad: containers.value.cantidad as unknown as number,
        code: containers.value.container.code,
      });
      dialogConteiner.value = false;
      containers.value = {
        container: "" as unknown as TipoContenedor,
        cantidad: "",
      };
      emit("recargarCostos", false);
    } else {
      err.value = "Contenedor ya se encuentra en la lista";
    }
  }
}
async function eliminarContainer({ index = null }: { index?: number | null }) {
  containersList.value.splice(index as number, 1);
  emit("recargarCostos");
}
async function aceptar() {
  let validate = true;

  if (
    !pricingStore.datosPrincipales.esgrupalflag &&
    !pricingStore.datosPrincipales.esindividualflag
  ) {
    Swal.fire({
      icon: "warning",
      title: "Tipo de Cotización",
      text: "Por favor seleccione, el tipo de cotización.",
    });
    return;
  }

  if (pricingStore.datosPrincipales.esgrupalflag) {
    if (
      !pricingStore.listPortBegin.some(
        (v) =>
          v.id == pricingStore.datosPrincipales.idorigen &&
          v.puerto == "NINGBO",
      )
    ) {
      Swal.fire({
        icon: "warning",
        title: "Cotización Grupal",
        text: "Para una cotización grupal, el puerto de salida debe ser NINGBO",
      });
      return;
    }
  }
  if ((await frmPuerto.value!.validate()).valid) {
    if (isFcl.value) {
      if (containersList.value.length == 0) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita al menos un contenedor",
        });
        validate = false;
      }
    }
    if (!isFcl.value) {
      if (
        !pricingStore.datosPrincipales.numerobultos &&
        !pricingStore.datosPrincipales.volumen &&
        !pricingStore.datosPrincipales.peso
      ) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita los datos de la carga",
        });
        validate = false;
      }
    }
    if (!!validate) {
      emit("activarServicios");
      mostrarContinuarFlag.value = false;
    }
    //
  }
  // this.$store.commit("SET_STEP_3", true);
}

//
async function calcular() {
  if ((await calcularPesoFrom.value!.validate()).valid) {
    const factLongitud = unidadesLongitud.filter(
      (v) => v.value == fromMedidas.value.idLongitud,
    )[0]!.factor;

    const facPeso = unidadesPeso.filter(
      (v) => v.value == fromMedidas.value.idpeso,
    )[0]!.factor;

    const volumen =
      (fromMedidas.value.largo as number) *
      (fromMedidas.value.ancho as number) *
      (fromMedidas.value.alto as number) *
      Math.pow(factLongitud, 3);

    const peso =
      facPeso *
      (fromMedidas.value.peso as number) *
      (fromMedidas.value.bultos as number);
    tblMedida.value.push({
      uni: fromMedidas.value.bultos,
      peso: parseFloat(String(peso)).toFixed(2),
      volumen: parseFloat(
        String((fromMedidas.value.bultos as number) * volumen),
      ).toFixed(2),
      largo: fromMedidas.value.largo,
      ancho: fromMedidas.value.ancho,
      alto: fromMedidas.value.alto,
      pesoXBulto: fromMedidas.value.peso,
    });

    nextTick(() => {
      calcularPesoFrom.value!.reset();
      total();
    });
  }
}

function total() {
  tblTotal.value = null as unknown as TotalMedidaCarga;
  let uni = 0;
  let peso = 0;
  let volumen = 0;
  tblMedida.value.forEach((element) => {
    uni += parseFloat(element.uni as string);
    peso += parseFloat(element.peso as string);
    volumen += parseFloat(element.volumen as string);
  });
  tblTotal.value = {
    descripcion: "Total:",
    uni: uni,
    peso: peso,
    volumen: volumen,
  };
}

function borrarFila(i: number) {
  tblMedida.value.splice(i, 1);
  total();
}

function guardarDatosCalculadora() {
  pricingStore.datosPrincipales.numerobultos = tblTotal.value.uni;
  pricingStore.datosPrincipales.volumen = tblTotal.value.volumen;
  pricingStore.datosPrincipales.peso = tblTotal.value.peso;
  calculadoraFlag.value = false;
  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
}
function mostrarComboPercepcionAduana() {
  const esPeru = sessionIsoPais() == 9589;
  return (
    esPeru &&
    pricingStore.listModality.some(
      (v) =>
        v.id == pricingStore.datosPrincipales.idsentido && v.code == "I",
    )
  );
}

function cambiarImpuesto() {
  let porcentaje: string | undefined = "10";
  if (pricingStore.listImpuestos.length > 0) {
    pricingStore.listImpuestos.filter((v) => v.codigo == "09")[0]!.codigo01 =
      "10";
  }

  if (pricingStore.datosPrincipales.id_percepcionaduana) {
    porcentaje = masterusuariosStore.lstPercepcionAduana.filter(
      (v) => v.id == pricingStore.datosPrincipales.id_percepcionaduana,
    )[0]!.codigo01;

    if (pricingStore.listImpuestos.length > 0) {
      pricingStore.listImpuestos.filter((v) => v.codigo == "09")[0]!.codigo01 =
        "10";
    }
  }
  const newImpuesto = [...pricingStore.listImpuestos];
  if (newImpuesto.length > 0) {
    newImpuesto.filter((v) => v.codigo == "09")[0]!.codigo01 = porcentaje;

    pricingStore.listImpuestos = newImpuesto;
    rootStore.commit("ACTUALIZAR_IMPUEST", newImpuesto);
  }

  pricingStore.opcionCostos.forEach((element) => {
    if (element.listImpuestos.length > 0) {
      element.listImpuestos.filter((v) => v.codigo == "09")[0]!.codigo01 =
        porcentaje;
    }
  });
}
function recalcularCalculadora() {
  let uni = 0;
  let peso = 0;
  let volumen = 0;
  tblMedida.value.forEach((element) => {
    uni += parseFloat(element.uni as string);
    peso += parseFloat(element.peso as string);
    volumen += parseFloat(element.volumen as string);
  });
  tblTotal.value.uni = parseFloat(String(uni)).toFixed(2);
  tblTotal.value.peso = parseFloat(String(peso)).toFixed(2);
  tblTotal.value.volumen = parseFloat(String(volumen)).toFixed(2);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calcularCostoUnitario(costo: Costo, costoAsociado: Costo) {
  let costounitario = costo.costounitario;
  const esindividualflag = pricingStore.datosPrincipales.esindividualflag;
  const esgrupalflag = pricingStore.datosPrincipales.esgrupalflag;
  let montoprofit: Numerico = 0;
  const flete = obtenerFleteOpcion(costo);
  const fleteVenta = obtenerFleteOpcionVenta(costo);
  const transporte = obtenerTransporte(costo);
  const tipoImportacion = masterusuariosStore.lstPercepcionAduana.find(
    (v) => v.id == pricingStore.datosPrincipales.id_percepcionaduana,
  );
  // OBTENIENDO LOS PROFIT
  if (costoAsociado.profit_ganancia_pricing!.length > 0 && esindividualflag) {
    if (tipoImportacion!.codigo == "01") {
      montoprofit = costoAsociado.profit_ganancia_pricing!.find(
        (v) => v.esindividualflag,
      )!.profitprimeraimportacion;
    }
    if (tipoImportacion!.codigo == "02") {
      montoprofit = costoAsociado.profit_ganancia_pricing!.find(
        (v) => v.esindividualflag,
      )!.profitsegundaimportacion;
    }
  }
  if (costoAsociado.profit_ganancia_pricing!.length > 0 && esgrupalflag) {
    if (tipoImportacion!.codigo == "01") {
      montoprofit = costoAsociado.profit_ganancia_pricing!.find(
        (v) => v.esgrupalflag,
      )!.profitprimeraimportacion;
    }
    if (tipoImportacion!.codigo == "02") {
      montoprofit = costoAsociado.profit_ganancia_pricing!.find(
        (v) => v.esgrupalflag,
      )!.profitsegundaimportacion;
    }
  }
  /* -------- CALCUALAR COSTO UNITARIO ---------------*/

  if (esgrupalflag) {
    if (costo.esopcionflag == 1) {
      if (costo.code_cost == 13) {
        costounitario = transporte;
      } else if (costo.code_cost == 4 || costo.code_cost == 7) {
        costounitario =
          parseFloat(costoAsociado.costounitario as string) +
          parseFloat(montoprofit as string) +
          parseFloat(flete.monto as string) +
          parseFloat(fleteVenta.monto as string);
      } else {
        costounitario = 0;
      }
    }
    if (costo.esventaflag == 1) {
      costounitario =
        parseFloat(costoAsociado.costounitario as string) +
        parseFloat(montoprofit as string) +
        parseFloat(flete.monto as string) +
        parseFloat(fleteVenta.monto as string);
    }
  }

  if (esindividualflag) {
    if (costo.esopcionflag == 1) {
      if (costo.code_cost == 13) {
        costounitario = transporte;
      } else {
        costounitario =
          parseFloat(costoAsociado.costounitario as string) +
          parseFloat(flete.monto as string);
      }
    }
    if (costo.esventaflag == 1) {
      if (costo.code_cost == 13) {
        costounitario = transporte;
      } else {
        costounitario =
          parseFloat(costoAsociado.costounitario as string) +
          parseFloat(montoprofit as string) +
          parseFloat(flete.monto as string) +
          parseFloat(fleteVenta.monto as string);
      }
    }
  }

  return {
    costounitario: costounitario,
    flete: flete,
    fleteVenta: fleteVenta,
  };
}
function obtenerTransporte(item: Costo) {
  let monto = 0;
  if (item.code_cost == 13) {
    const opcion = pricingStore.datosPrincipales.esindividualflag
      ? 1
      : pricingStore.datosPrincipales.esgrupalflag
      ? 2
      : 0;
    const pesoActual = parseFloat(pricingStore.datosPrincipales.peso as string) || 0;

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
async function confirmarCambio(tipo: string, nuevoValor: boolean | undefined) {
  id_percepcionaduana.value = null;

  if (!nuevoValor) {
    if (tipo === "grupal") pricingStore.datosPrincipales.esgrupalflag = false;
    if (tipo === "individual")
      pricingStore.datosPrincipales.esindividualflag = false;
    return;
  }

  if (tipo === "grupal") {
    const result = await Swal.fire({
      title:
        '<span style="color: #3F51B5;">¿Cambiar a modalidad grupal?</span>',
      html: `
            <div style="text-align: left; line-height: 1.5; font-size: 15px;">
              <p style="margin-bottom: 12px;">Al seleccionar la opción <b>Grupal</b>, el sistema realizará los siguientes ajustes automáticos:</p>

              <div style="background-color: #e8eaf6; color: #1a237e; padding: 12px; border-radius: 6px; font-size: 14px; border: 1px solid #c5cae9; margin-bottom: 12px;">
                📦 <b>Actualización de costos:</b> Se actualizará la estructura tarifaria según el esquema consolidado.
              </div>

              <p style="font-size: 14px; color: #555;">¿Desea continuar con la aplicación de estos cambios?</p>
            </div>
          `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "SI CAMBIAR A GRUPAL",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
    });

    if (result.isConfirmed) {
      pricingStore.datosPrincipales.esgrupalflag = true;
      pricingStore.datosPrincipales.esindividualflag = false;
      desactivarTransporteParaGrupal();
      setTimeout(() => {
        cambiarGrupalIndividual();
      }, 100);
    } else {
      pricingStore.datosPrincipales.esgrupalflag = true;
      nextTick(() => {
        pricingStore.datosPrincipales.esgrupalflag = false;
        pricingStore.datosPrincipales.esindividualflag = true;
      });
    }
  }

  // Lógica para cambio a INDIVIDUAL
  else if (tipo === "individual") {
    const result = await Swal.fire({
      title:
        '<span style="color: #3F51B5;">¿Cambiar a modalidad individual?</span>',
      html: `
            <div style="text-align: left; line-height: 1.5; font-size: 15px;">
              <p style="margin-bottom: 12px;">Está a punto de cambiar los parámetros de la cotización:</p>

              <div style="background-color: #e1f5fe; color: #01579b; padding: 12px; border-radius: 6px; font-size: 14px; border: 1px solid #b3e5fc; margin-bottom: 12px;">
                👤 <b>Recálculo individual:</b> El sistema ajustará los costos base y beneficios aplicables a este esquema.
              </div>

              <p style="font-size: 14px; color: #555;">¿Desea proceder con esta modificación?</p>
            </div>
          `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "SÍ, CAMBIAR A INDIVIDUAL",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
    });

    if (result.isConfirmed) {
      pricingStore.datosPrincipales.esindividualflag = true;
      pricingStore.datosPrincipales.esgrupalflag = false;
      cambiarServicioTransporteActivo();
      setTimeout(() => {
        cambiarGrupalIndividual();
        id_percepcionaduana.value =
          pricingStore.datosPrincipales.id_percepcionaduana;
        dialogCambiarPercepcionAduana.value = true;
      }, 200);
    } else {
      pricingStore.datosPrincipales.esindividualflag = true;
      nextTick(() => {
        pricingStore.datosPrincipales.esindividualflag = false;
        pricingStore.datosPrincipales.esgrupalflag = true;
      });
    }
  }
}
function cambiarPercepcionAduana() {
  pricingStore.datosPrincipales.id_percepcionaduana = id_percepcionaduana.value;
  cambiarImpuesto();
  cerrarDialogCambiarPercepcionAduana();
}
function cerrarDialogCambiarPercepcionAduana() {
  dialogCambiarPercepcionAduana.value = false;
  nextTick(() => {
    errorIdTown.value = "";
    const servicioTransporteActivo = pricingStore.listServices.some(
      (servicio) =>
        Number(servicio.code_service) === 14 &&
        (servicio.status === true || Number(servicio.status) === 1),
    );
    if (!servicioTransporteActivo) {
      return;
    }
    idTownSeleccionado.value = null;
    dialogSeleccionDistrito.value = true;
  });
}
function confirmarSeleccionDistrito() {
  const idTown = idTownSeleccionado.value;
  if (!idTown) {
    errorIdTown.value = "Selecciona un distrito";
    return;
  }

  pricingStore.datosPrincipales.id_town = idTown;

  pricingStore.opcionCostos.forEach((opcion) => {
    (opcion.listCostos || []).forEach((costo) => {
      if (Number(costo.code_cost) === 13) {
        costo.costounitario = obtenerTransporte(costo);
      }
    });
  });

  dialogSeleccionDistrito.value = false;
  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
}
</script>

<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-card elevation="0">
      <v-card-title> Datos de la Carga </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Proveedor"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="rootStore.state.itemsProveedorList"
                item-title="namelong"
                item-value="id"
                v-model="pricingStore.datosPrincipales.id_proveedor"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
            >
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="pricingStore.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.idorigen"
                @update:search="recargarPuertoOrigen"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
            >
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="pricingStore.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.iddestino"
                @update:search="recargarPuertoDestino"
              />
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1 rows"
              v-if="esFobFlag()"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-checkbox
                    label="Individual"
                    v-model="proxyIndividual"
                    density="compact"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-checkbox
                    label="Grupal"
                    v-model="proxyGrupal"
                    density="compact"
                  />
                </v-col>
              </v-row>
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
              v-if="mostrarComboPercepcionAduana()"
            >
              <v-autocomplete
                label="Primera o Segunda Importación"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  pricingStore.datosPrincipales.id_percepcionaduana
                "
                @update:model-value="cambiarImpuesto()"
              />
            </v-col>
          </v-row>
        </v-form>

        <v-row>
          <v-col class="center">
            <v-icon color="red">
              mdi-arrow-down-left-bold
            </v-icon>
            <b>LLENAR ESTOS CAMPOS</b>
            <v-icon color="red">
              mdi-arrow-down-right-bold
            </v-icon>
          </v-col>
        </v-row>
        <v-form ref="frmDatosCarga">
          <v-row v-if="!isFcl">
            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Número Bultos"
                v-model="numerobultos"
                variant="outlined"
                density="compact"
                type="number"
                suffix="uni"
                :error-messages="err"
                step="1"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) =>
                    /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                @keyup.enter="anadirCarga()"
              />
            </v-col>

            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Peso"
                v-model="peso"
                variant="outlined"
                density="compact"
                type="number"
                suffix="kg"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                @keyup.enter="anadirCarga()"
              />
            </v-col>
            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Volumen"
                v-model="volumen"
                variant="outlined"
                density="compact"
                type="number"
                suffix="m3"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                @keyup.enter="anadirCarga()"
              />
            </v-col>
            <v-col
              cols="12"
              align="center"
            >
              <v-btn
                class="mx-1"
                size="small"
                color="info"
                @click="anadirCarga()"
              >
                AGREGAR
              </v-btn>
              <v-btn
                class="mx-1"
                size="small"
                color="warning"
                @click="calculadoraFlag = !calculadoraFlag"
              >
                USAR CALCULADORA
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              v-if="isAereo"
            >
              <v-table
                density="compact"
                class="elevation-1 my-2"
              >
                <thead class="bg-teal-lighten-2 text-white">
                  <tr>
                    <th>Cant. Bultos</th>
                    <th>Peso (kg)</th>
                    <th>Volumen (m³)</th>
                    <th v-if="!ocultarLCL">
                      Peso volumétrico (kg)
                    </th>
                    <th v-if="!ocultarLCL">
                      Peso cargable (kg)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {{ pricingStore.datosPrincipales.numerobultos }}
                    </td>
                    <td>{{ pricingStore.datosPrincipales.peso }}</td>
                    <td>{{ pricingStore.datosPrincipales.volumen }}</td>
                    <td v-if="!ocultarLCL">
                      {{
                        pesoVolumetrico !== null ? pesoVolumetrico + " kg" : ""
                      }}
                    </td>
                    <td v-if="!ocultarLCL">
                      {{ pesoCargable !== null ? pesoCargable + " kg" : "" }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col
              cols="12"
              align="right"
            >
              <v-btn
                color="success"
                @click="dialogConteiner = !dialogConteiner"
              >
                Agregar Contenedor
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headers"
                :items="containersList"
                class="elevation-1"
              >
                <template #[`item.action`]="item">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarContainer({ index: item.index })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
                <template #[`item.number`]="item">
                  {{ item.index + 1 }}
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions
        class="mt-auto"
        v-if="mostrarContinuarFlag && mostrarBtn"
      >
        <v-spacer />
        <v-btn
          color="#3F51B5"
          size="small"
          @click="aceptar()"
        >
          Continuar Servicios
        </v-btn>
      </v-card-actions>
    </v-card>
    <!-- AGREGAR CONTAINER -->
    <v-dialog
      v-model="dialogConteiner"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title> Añadir Contenedor </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="rootStore.state.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-title="name"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :error-messages="err"
              return-object
            />
            <v-text-field
              name="Cantidad"
              label="Cantidad"
              v-model="containers.cantidad"
              type="number"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="guardarContainer()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            @click="dialogConteiner = !dialogConteiner"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- USAR CALCULADORA -->
    <v-dialog
      v-model="calculadoraFlag"
      max-width="40%"
    >
      <v-card>
        <v-card-title class="custom-card-title justify-center">
          <h3>CALCULADORA VOLUMÉTRICA</h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="calcularPesoFrom">
              <v-row>
                <v-col cols="4">
                  <v-autocomplete
                    item-title="text"
                    density="compact"
                    :items="unidadesLongitud"
                    label="Longitud"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.idLongitud"
                  />
                </v-col>

                <v-col cols="4">
                  <v-autocomplete
                    item-title="text"
                    density="compact"
                    :items="unidadesPeso"
                    label="Peso"
                    :rules="[(v) => !!v || 'Dato Requerido.']"
                    v-model="fromMedidas.idpeso"
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    type="number"
                    min="1"
                    label="N° Bultos"
                    required
                    density="compact"
                    step="1"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                      (v) => v > 0 || 'El dato debe ser positivo',
                    ]"
                    v-model="fromMedidas.bultos"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="t-blue justify-center"
                >
                  <b>MEDIDAS POR CADA BULTO</b>
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Largo"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.largo"
                    inputmode="numeric"
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Ancho"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.ancho"
                    inputmode="numeric"
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Alto"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.alto"
                    inputmode="numeric"
                  />
                </v-col>

                <v-col cols="3">
                  <v-text-field
                    type="number"
                    min="0"
                    step="0.01"
                    label="Peso X Bulto"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.peso"
                  />
                </v-col>
                <div class="flex-grow-1 text-right">
                  <v-btn
                    size="small"
                    color="#fb9514"
                    class="me-2 text-white"
                    @click="calcular()"
                  >
                    <b>Calcular</b>
                  </v-btn>
                </div>
              </v-row>
            </v-form>
            <v-col cols="12">
              <span class="mt-2 ma-1 pa-1">
                Nota: Los valores de Peso y Volumen serán convertidos
                automáticamente al sistema MKS (Metros, Kilogramos, segundos)
                respectivamente.
              </span>
              <v-table
                density="compact"
                class="elevation-1"
                v-if="tblMedida.length > 0"
              >
                <thead class="bg-success text-white">
                  <tr>
                    <td>#</td>
                    <td>Uni(s)</td>
                    <td>Medidas (L x A x H)</td>
                    <td>Peso x Bulto</td>
                    <td>Peso (Kg.)</td>
                    <td>Volumen (m <sup>3</sup>)</td>
                    <td />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(medida, i) in tblMedida"
                    :key="i"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>
                      <v-text-field
                        v-model="medida.uni"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      {{ medida.largo }} x {{ medida.ancho }} x
                      {{ medida.alto }}
                    </td>
                    <td>
                      {{ medida.pesoXBulto }}
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.peso"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.volumen"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      <v-btn
                        variant="text"
                        class="ma-0 pa-0"
                        icon
                      >
                        <v-icon
                          color="orange-darken-4"
                          @click="borrarFila(i)"
                        >
                          mdi-delete-circle
                        </v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ tblTotal.descripcion }}</td>
                    <td>{{ tblTotal.uni }}</td>
                    <td />
                    <td />
                    <td>{{ tblTotal.peso }}</td>
                    <td>{{ tblTotal.volumen }}</td>
                    <td />
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            size="small"
            :disabled="tblMedida.length < 0"
            @click="guardarDatosCalculadora()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            class="text-white"
            size="small"
            @click="calculadoraFlag = !calculadoraFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCambiarPercepcionAduana"
      max-width="560px"
      persistent
    >
      <v-card
        class="dialog-impuestos"
        rounded="lg"
      >
        <!-- ENCABEZADO -->
        <v-card-title class="px-6 pt-5 pb-3">
          <div class="d-flex align-center flex-grow-1">
            <v-avatar
              size="72"
              color="blue-lighten-5"
              class="mr-4"
            >
              <v-icon
                size="38"
                color="blue-darken-2"
              >
                mdi-file-percent-outline
              </v-icon>
            </v-avatar>

            <div class="text-headline-medium font-weight-bold text-uppercase">
              Cálculo de impuestos
            </div>

            <v-spacer />

            <v-btn
              variant="text"
              icon
              @click="cerrarDialogCambiarPercepcionAduana"
            >
              <v-icon color="blue-grey">
                mdi-close
              </v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <!-- CONTENIDO -->
        <v-card-text class="px-6 pt-2 pb-5">
          <v-alert
            color="blue-lighten-5"
            variant="tonal"
            class="alerta-impuestos mb-5"
          >
            <div class="d-flex align-center">
              <v-icon
                color="blue-darken-1"
                size="32"
                class="mr-4"
              >
                mdi-information
              </v-icon>

              <div class="texto-aviso">
                Confirma si se mantiene como
                <strong>primera o segunda importación.</strong>
              </div>
            </div>
          </v-alert>

          <v-autocomplete
            v-model="id_percepcionaduana"
            :items="masterusuariosStore.lstPercepcionAduana"
            item-title="descripcion"
            item-value="id"
            label="Tipo de importación"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :rules="[
              (v) =>
                (v !== null && v !== undefined && v !== '') ||
                'Selecciona el tipo de importación',
            ]"
          />
        </v-card-text>

        <v-divider />

        <!-- BOTONES -->
        <v-card-actions class="px-6 py-4">
          <v-spacer />

          <v-btn
            color="blue-grey-lighten-5"
            variant="flat"
            class="btn-impuestos btn-cancelar"
            @click="cerrarDialogCambiarPercepcionAduana"
          >
            Cancelar
          </v-btn>

          <v-btn
            color="blue-darken-1"
            variant="flat"
            class="btn-impuestos"
            :disabled="
              id_percepcionaduana === null ||
                id_percepcionaduana === undefined ||
                id_percepcionaduana === ''
            "
            @click="cambiarPercepcionAduana"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogSeleccionDistrito"
      max-width="560px"
      persistent
    >
      <v-card rounded="lg">
        <v-card-title class="text-headline-medium font-weight-bold">
          Seleccionar distrito
        </v-card-title>
        <v-card-text>
          <p>Selecciona el distrito para calcular la tarifa de transporte.</p>
          <v-autocomplete
            v-model="idTownSeleccionado"
            :items="townStore.lstTown"
            item-title="nombrecompleto"
            item-value="id"
            density="compact"
            variant="outlined"
            label="Distrito"
            :error-messages="errorIdTown"
            @update:model-value="errorIdTown = ''"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            color="primary"
            @click="confirmarSeleccionDistrito"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style>
.center {
  align-content: center !important;
  align-items: center !important;
  text-align: center !important;
}

.custom-card-title {
  background-color: #64b5f6 !important;
}

.justify-center {
  text-align: center !important;
}
.t-blue {
  color: blue !important;
}
</style>

<style scoped>
.dialog-impuestos {
  border-radius: 12px !important;
  overflow: hidden;
}

.alerta-impuestos {
  border-radius: 9px;
  margin-left: 0;
  margin-right: 0;
}

.texto-aviso {
  color: #173b69;
  font-size: 16px;
  line-height: 1.5;
}

.texto-aviso strong {
  display: block;
  color: #1565c0;
  font-weight: 700;
}

.btn-impuestos {
  min-width: 125px !important;
  height: 42px !important;
  border-radius: 7px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.btn-cancelar {
  color: #526176 !important;
}

@media (max-width: 600px) {
  .dialog-impuestos .text-headline-medium {
    font-size: 17px !important;
  }

  .dialog-impuestos .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .texto-aviso {
    font-size: 14px;
  }

  .btn-impuestos {
    min-width: 0 !important;
    padding: 0 12px !important;
  }
}
</style>
