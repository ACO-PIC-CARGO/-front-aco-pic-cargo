<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePermissions } from "@/composables/usePermissions";
import moment from "moment";
import PreviewQuote from "./PreviewQuote.vue";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import type {
  ClienteFiltroCalculadora,
  ConceptoCotizacionCalculadora,
  FiltroUsuariosCalculadora,
  PuertoFiltroCalculadora,
  UsuarioCalculadora,
} from "@/types/calculadora";
import type { EstadoCotizacion } from "@/types/cotizacion";

interface LlamadaCalculadora {
  iduser?: string;
  statuscall?: unknown;
  isuser?: string;
  date?: string;
  comentario?: unknown;
  fecha?: Date;
  identities?: { id_entitie?: unknown; name?: string };
}

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();
const { can } = usePermissions();
const pricingStore = usePricingStore();
const router = useRouter();

const dialog = false;
const dialogCotizacion = ref(false);
const dialogEditarEstado = ref(false);
const expanded = ref<string[]>([]);
const search = ref("");
const dialogCalls = ref(false);
const dialogCallHistory = ref(false);
const loading = ref(false);
const loadingList = ref(false);
const loadingFilters = ref(true);
const filterOpen = ref(false);
const filterError = ref("");
const emptyFilter = (): FiltroUsuariosCalculadora => ({
  id_status: null,
  id_cliente: null,
  id_port_begin: null,
  id_port_end: null,
});
const filtro = ref<FiltroUsuariosCalculadora>(emptyFilter());
const filtroAplicado = ref<FiltroUsuariosCalculadora>(emptyFilter());
const puertosOrigen = ref<PuertoFiltroCalculadora[]>([]);
const puertosDestino = ref<PuertoFiltroCalculadora[]>([]);
const clientes = ref<ClienteFiltroCalculadora[]>([]);
const estadosCotizacion = ref<EstadoCotizacion[]>([]);
const title = ref("");
const fecha = ref(moment().format("YYYY-MM-DD"));
const headers = [
  { title: "Acciones", key: "action", sortable: false },
  // { title: "", key: "accion" },
  { title: "Fecha Registro", key: "created_at" },
  { title: "Estado Cotización", key: "estado_cotizacion" },
  { title: "Cliente", key: "nombre" },
  { title: "Tipo", key: "tipo" },
  { title: "Puerto Origen", key: "port_origen" },
  { title: "Puerto Destino", key: "port_destino" },
  { title: "Peso", key: "peso" },
  { title: "Volumen", key: "volumen" },
  // { text: "", value: "servicios" },
  { title: "Valor Mercancía", key: "valormercancia" },
  { title: "Correo", key: "email" },
  { title: "Teléfono", key: "telefono" },
  // { title: "Estado", key: "estadocotizacion" },
];

const datos = ref<Record<string, unknown>>({
  desgloseKey: [],
  desglose: false,
  desgloseValues: [],
  desgloseValuesCostos: [],
  resumen: [],
  show: false,
  flete: [],
  impuestosBajos: [],
  totalVenta: [],
  impuestosMedios: [],
  impuestosAltos: [],
  honorarios: [],
  servicioLogistico: [],
  Serviciologis: [],
  impuestosAltosTotal: [],
  impuestosBajosTotal: [],
  impuestosMediosTotal: [],
  servicioLogisticoTotal: [],
  venta: [],
  token: [],
  tipo: [],
  totalIGVFleteCostos: [],
  totalIGVCostos: [],
  activar: false,
  cliente: "",
  contacto: "",
  correo: "",
  ejecutivo: "",
  naviera: [],
});
const dataCotizacion = ref<Partial<UsuarioCalculadora>>({});
// Plain, non-reactive fields.
let user: UsuarioCalculadora | undefined;
let call: LlamadaCalculadora | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let calls: unknown[] | undefined;
const frmComentario = useTemplateRef("frmComentario");
// The template never declares this ref, so it stays undefined.
const frmCall = ref<{ validate: () => Promise<{ valid: boolean }> }>();

onMounted(async () => {
  try {
    await cargarListado(filtroAplicado.value);
    const [origen, destino, clientesCotizacion, estados] = await Promise.all([
      calculadorasStore.listarPuertosOrigenCotizacionCalculadora(),
      calculadorasStore.listarPuertosDestinoCotizacionCalculadora(),
      calculadorasStore.listarClientesCotizacionCalculadora(),
      calculadorasStore.listarEstadosCotizacionCalculadora(),
    ]);
    puertosOrigen.value = origen;
    puertosDestino.value = destino;
    clientes.value = clientesCotizacion;
    estadosCotizacion.value = estados;
  } catch (error) {
    console.error("Error al cargar los filtros de usuarios de calculadora:", error);
    await Swal.fire({ icon: "error", text: "No se pudieron cargar los filtros. Recarga la página para intentarlo nuevamente." });
  } finally {
    loadingFilters.value = false;
  }
});

async function cargarListado(filtros: FiltroUsuariosCalculadora): Promise<boolean> {
  loadingList.value = true;
  try {
    return await calculadorasStore.getListUserCalc(filtros);
  } catch (error) {
    console.error("Error al cargar usuarios de calculadora:", error);
    await Swal.fire({ icon: "error", text: "No se pudo cargar el listado. Inténtalo nuevamente." });
    return false;
  } finally {
    loadingList.value = false;
  }
}
function abrirFiltro() {
  filtro.value = { ...filtroAplicado.value };
  filterError.value = "";
  filterOpen.value = true;
}
async function aplicarFiltro() {
  filterError.value = "";
  const next = { ...filtro.value };
  if (await cargarListado(next)) {
    filtroAplicado.value = next;
    filterOpen.value = false;
  }
}
async function limpiarFiltro() {
  filtro.value = emptyFilter();
  await aplicarFiltro();
}

function abrirModalCambiarEstado(data: UsuarioCalculadora) {
  dataCotizacion.value = { ...data };
  dialogEditarEstado.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rowTrainerClass(item: UsuarioCalculadora) {
  const index = calculadorasStore.listUser.indexOf(item);
  return index % 2 === 0 ? "fila-par" : "fila-impar";
}
async function guardarEstadoCotizacion() {
  if ((await frmComentario.value!.validate()).valid) {
    if (!(await calculadorasStore.actualizarEstadoCotizacionCalculadora(dataCotizacion.value))) return;
    dialogEditarEstado.value = false;
    appStore.spiner = true;
    await cargarListado(filtroAplicado.value);
    appStore.spiner = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFecha(fecha: moment.MomentInput) {
  moment.locale("es");
  return moment(fecha).format("YYYY-MMM-DD");
}
function abrirModalPreview(data: UsuarioCalculadora) {
  Swal.fire({
    title: "Tipo de cálculo de cotización",
    html: `
    <p style="margin: 0; color: #555;">
      Selecciona la modalidad que deseas visualizar para esta cotización:
    </p>
  `,
    icon: "question",
    showCloseButton: true,
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: '<i class="fa fa-user"></i> Individual', // Opcional si usas FontAwesome
    denyButtonText: '<i class="fa fa-users"></i> Grupal',
    showDenyButton: data.tienegrupalflag,
    showConfirmButton: data.tieneindividualflag,
    reverseButtons: true, // Ordena mejor los botones de acción
    allowEnterKey: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((respuesta) => {
    if (respuesta.isConfirmed) {
      const routeData = router.resolve({
        name: "VerCotizacionCalculadora",
        query: { id: data.id, individualflag: 1, esgrupalflag: 0 },
      });

      window.open(routeData.href, "_blank");
    }
    if (respuesta.isDenied) {
      const routeData = router.resolve({
        name: "VerCotizacionCalculadora",
        query: { id: data.id, individualflag: 0, esgrupalflag: 1 },
      });

      window.open(routeData.href, "_blank");
    }
  });
}
async function exportar() {
  loading.value = true;
  await calculadorasStore.ExportarListUser(filtroAplicado.value);
  loading.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openCall(userRow: UsuarioCalculadora) {
  user = userRow;
  const fechahora = moment(fecha.value).format("YYYY-MM-DDTHH:mm");
  call!.date = fechahora;
  dialogCalls.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function registrarLlamada() {
  if ((await frmCall.value!.validate()).valid) {
    const data = {
      iduser: user!.usuario_id,
      statuscall: call!.statuscall,
      isuser: user!.usuario_system,
      date: moment(call!.date).format("YYYY-MM-DD HH:mm"),
      comentario: call!.comentario,
      identities: call!.identities!.id_entitie
        ? call!.identities!.name
        : `${
            JSON.parse(sessionStorage.getItem("dataUser") as string)[0].surname
          } ${
            JSON.parse(sessionStorage.getItem("dataUser") as string)[0]
              .second_surname
          } ${
            JSON.parse(sessionStorage.getItem("dataUser") as string)[0].names
          }`,
    };
    calculadorasStore.overlay = true;
    await calculadorasStore.SetCall(data);
    // await this.getListUserCalc();

    call = {
      iduser: "",
      statuscall: "",
      isuser: "",
      date: "",
      comentario: "",
      fecha: new Date(),
    };
    dialogCalls.value = false;

    calculadorasStore.overlay = false;
  }
}
function abrirImg(item: UsuarioCalculadora) {
  window.open(item.capture_cotizacion!, "_blank");
}
function enviarCotizacionAPricing(item: UsuarioCalculadora) {
  if (item.estadocotizacion == 1) {
    continuarEnviarCotizacionAPricing(item);
  }
  if (item.estadocotizacion == 2) {
    Swal.fire({
      icon: "warning",
      title: "Cotización ya envíada",
      text: "¿La cotización ya fue envíada a Princing, desea crear una nueva cotización con los mismos datos?",
      confirmButtonText: "Si, envíar.",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    }).then((respuesta) => {
      if (respuesta.isConfirmed) {
        continuarEnviarCotizacionAPricing(item);
      }
    });
  }
}
function continuarEnviarCotizacionAPricing(item: UsuarioCalculadora) {
  Swal.fire({
    title: "Gestión de Envío a Pricing",
    text: "¿Cómo desea procesar el envío de esta cotización?",
    icon: "question",
    showCancelButton: true,
    showDenyButton: item.tienegrupalflag,
    showConfirmButton: item.tieneindividualflag,
    confirmButtonText: "Enviar Opción Individual",
    denyButtonText: "Enviar Opción Grupal",
    cancelButtonText: "Cancelar",
    // Asignación de colores y clases personalizadas para los botones
    confirmButtonColor: "#28a745", // Éxito / Verde
    denyButtonColor: "#17a2b8", // Info / Celeste
    cancelButtonColor: "#dc3545", // Rojo / Peligro
    reverseButtons: true, // Opcional: invierte el orden para mejor UX
  }).then((result) => {
    if (result.isConfirmed) {
      // Lógica para envío individual
      enviarCotizacion({
        id: item.id,
        individualflag: true,
        grupalflag: false,
      });
    } else if (result.isDenied) {
      // Lógica para envío grupal
      enviarCotizacion({
        id: item.id,
        individualflag: false,
        grupalflag: true,
      });
    }
  });
}
async function enviarCotizacion({
  id = null,
  individualflag = false,
  grupalflag = false,
}: {
  id?: string | null;
  individualflag?: boolean;
  grupalflag?: boolean;
}) {
  await calculadorasStore.EnviarCotizacionCalculadoraAPrincing({
    id: id,
    individualflag: individualflag,
    grupalflag: grupalflag,
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openHistoryCall(item: UsuarioCalculadora) {
  user = item;
  calls = item.list_call;

  dialogCallHistory.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clickRow(item: string, event: { isExpanded: boolean }) {
  if (event.isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function obtener_fecha(date: moment.MomentInput) {
  moment.locale("es");
  return moment(date).format("YYYY-MMM-DD HH:mm");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obtenerFCL(token: string, item: UsuarioCalculadora) {
  title.value =
    "Número de cotización:" +
    token +
    "-FCL." +
    " Cliente: " +
    item.usuario_nombre;
  const tipoCon = "Maritimo - Completo";

  await calculadorasStore.GetCotFCL(token);
  await calculadorasStore.GetCotFCLResumen(token);
  await calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
  await calculo(tipoCon);
  dialogCotizacion.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obtenerLCL(token: string, item: UsuarioCalculadora) {
  title.value =
    "Número de cotización:" +
    token +
    "-LCL." +
    " Cliente: " +
    item.usuario_nombre;
  const tipoCon = "Maritimo - Compartido";

  await calculadorasStore.GetCotLCL(token);
  await calculadorasStore.GetCotLCLResumen(token);
  await calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
  await calculo(tipoCon);
  dialogCotizacion.value = true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obtenerAEREO(token: string, item: UsuarioCalculadora) {
  title.value =
    "Número de cotización:" +
    token +
    "-AEREO." +
    " Cliente: " +
    item.usuario_nombre;
  const tipoCon = "Aereo";

  await calculadorasStore.GetCotAereo(token);
  await calculadorasStore.GetCotAereoResumen(token);
  await pricingStore.getModulesEntities();
  await calculoPrincpipal("FLETE AÉREO", tipoCon);
  await calculo(tipoCon);
  dialogCotizacion.value = true;
}

// -----------------------------------------------------------
function calculo(tipoCon: string) {
  const resumen2 = calculadorasStore.datosresumen!;

  const impuestosBajosTotal = resumen2
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
        return item;
      }
    })
    .map(function (duration) {
      return duration.valor.toFixed(2);
    });

  const impuestosMediosTotal = resumen2
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
        return item;
      }
    })
    .map(function (duration) {
      return duration.valor.toFixed(2);
    });

  const impuestosAltosTotal = resumen2
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
        return item;
      }
    })
    .map(function (duration) {
      return duration.valor.toFixed(2);
    });
  let Serviciologistico;
  const preServiciologistico = resumen2
    .filter(function (item) {
      if (
        item.tipo == "SERVICIO LOGÍSTICO" ||
        item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
      ) {
        return item;
      }
    })
    .map(function (duration) {
      return duration.valor.toFixed(2);
    });

  if (preServiciologistico.length > 1) {
    Serviciologistico = (
      (preServiciologistico as unknown[]).reduce(function (
        accumulator,
        current,
      ) {
        return [+(accumulator as number) + +(current as number)];
      }) as number[]
    ).map(function (duration) {
      return duration.toFixed(2);
    });
  } else {
    Serviciologistico = preServiciologistico;
  }

  const venta = resumen2.filter(function (item) {
    if (
      item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA MEDIOS"
    ) {
      return item;
    }
  });

  datos.value.impuestosAltosTotal = impuestosAltosTotal;
  datos.value.impuestosMediosTotal = impuestosMediosTotal;
  datos.value.impuestosBajosTotal = impuestosBajosTotal;
  datos.value.Serviciologis = Serviciologistico;
  datos.value.venta = venta;
  datos.value.tipo = tipoCon;
}
// ----------------------------------------------------------------------
function calculoPrincpipal(transportes: string, tipoCon: string) {
  const response = calculadorasStore.datos!;
  const flete = response
    .filter(function (item) {
      if (item.tipo == transportes) {
        return item;
      }
    })
    .filter(function (item) {
      if (item.valor > 0) {
        return item;
      }
    });

  const impuestosBajos = response
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
        return item;
      } else {
        return false;
      }
    })
    .map(function (duration) {
      if ((duration as unknown) !== false) {
        return duration.valor.toFixed(2);
      } else {
        return duration;
      }
    });

  // let IPM = response
  //   .filter(function (item) {
  //     if (
  //       item.tipo == "IMPUESTOS DE ADUANA BAJOS" &&
  //       item.nombre == "IPM"
  //     ) {
  //       return item;
  //     } else {
  //       return false;
  //     }
  //   })
  //   .map(function (duration) {
  //     if (duration !== false) {
  //       return duration.valor.toFixed(2);
  //     } else {
  //       return duration;
  //     }
  //   });

  const impuestosMedios = response
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
        return item;
      } else {
        return false;
      }
    })
    .map(function (duration) {
      if ((duration as unknown) !== false) {
        return duration.valor.toFixed(2);
      } else {
        return duration;
      }
    });

  const impuestosAltos = response
    .filter(function (item) {
      if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
        return item;
      } else {
        return false;
      }
    })
    .map(function (duration) {
      if ((duration as unknown) !== false) {
        return duration.valor.toFixed(2);
      } else {
        return duration;
      }
    });

  const transporte = response.filter(function (item) {
    if (item.tipo == "TRANSPORTE DE MERCANCÍA") {
      return item;
    } else {
      return false;
    }
  });

  const honorarios = response.filter(function (item) {
    if (item.tipo == "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA") {
      return item;
    } else {
      return false;
    }
  });

  const seguro = response.filter(function (item) {
    if (item.tipo == "SEGURO DE MERCANCÍA SUGERIDO") {
      return item;
    } else {
      return false;
    }
  });

  const servicioLogistico = response.filter(function (item) {
    if (
      item.tipo == "SERVICIO LOGÍSTICO" ||
      item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
      item.detalles == "Ganancia"
    ) {
      return item;
    } else {
      return false;
    }
  });

  const desgloseValuesCostos = response.filter(function (item) {
    if (
      item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
      item.tipo !== transportes &&
      item.tipo !== "SERVICIO LOGÍSTICO" &&
      item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
      item.detalles !== "Ganancia" &&
      item.tipo !== "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA"
    ) {
      if (item.valor > 0) {
        return item;
      }
    }
  });

  const desgloseValues = response.filter(function (item) {
    if (
      item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
      item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
      item.tipo !== transportes &&
      item.tipo !== "SERVICIO LOGÍSTICO" &&
      item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
      item.detalles !== "Ganancia"
    ) {
      if (item.valor !== 0) {
        return item;
      }
    }
  });

  let PretotalIGVCostos: ConceptoCotizacionCalculadora[],
    totalIGVCostos: unknown[] | undefined;

  switch (flete[0]!.detalles_calculos.pais_destino) {
    case "PERU":
      PretotalIGVCostos = response.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.tipo !== transportes &&
          item.tipo !== "FLETE" &&
          item.detalles !== "Ganancia" &&
          item.tipo !== "THCD" &&
          item.tipo !== "TCHD DOCUMENTACION" &&
          item.tipo !== "SEGURO DE MERCANCÍA SUGERIDO"
        ) {
          if (item.valor > 0) {
            return item;
          }
        }
      });
      totalIGVCostos = [0];

      if (PretotalIGVCostos.length > 1) {
        totalIGVCostos = (
          (
            PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.18).toFixed(2);
            }) as unknown[]
          ).reduce(function (accumulator, current) {
            return [+(accumulator as number) + +(current as number)];
          }) as number[]
        ).map(function (duration) {
          return duration.toFixed(2);
        });
      }

      break;
    case "PANAMA":
      PretotalIGVCostos = response.filter(function (item) {
        if (item.tipo == "PORT CHARGES" || item.tipo == "MANEJOS") {
          if (item.valor > 0) {
            return item;
          }
        }
      });
      totalIGVCostos = [0];

      if (PretotalIGVCostos.length > 1) {
        totalIGVCostos = (
          (
            PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.07).toFixed(2);
            }) as unknown[]
          ).reduce(function (accumulator, current) {
            return [+(accumulator as number) + +(current as number)];
          }) as number[]
        ).map(function (duration) {
          return duration.toFixed(2);
        });
      }

      break;
    case "VENEZUELA":
      totalIGVCostos = [0];
      break;

    default:
  }

  const desgloseTotal = (
    response
      .filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.detalles !== "Ganancia"
        ) {
          if (item.valor > 0) {
            return item;
          }
        }
      })
      .map(function (duration) {
        return duration.valor.toFixed(2);
      }) as unknown[]
  ).reduce(function (accumulator, current) {
    return [+(accumulator as number) + +(current as number)];
  }) as number[];

  const preservicioLogisticoTotal = response
    .filter(function (item) {
      if (
        item.tipo == "SERVICIO LOGÍSTICO" ||
        item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
        item.detalles == "Ganancia"
      ) {
        return item;
      }
    })
    .map(function (duration) {
      return duration.valor;
    });
  let servicioLogisticoTotal;
  if (preservicioLogisticoTotal.length > 1) {
    servicioLogisticoTotal = (preservicioLogisticoTotal as unknown[]).reduce(
      function (accumulator, current) {
        return [+(accumulator as number) + +(current as number)];
      },
    ) as number[];
  } else {
    servicioLogisticoTotal = preservicioLogisticoTotal;
  }

  const totalIGVFleteCostos =
    Number(desgloseTotal[0]) + Number(totalIGVCostos![0]);

  const totalVenta =
    Number(servicioLogisticoTotal[0]) + Number(desgloseTotal[0]);

  let naviera;
  switch (tipoCon) {
    case "Maritimo - Completo":
      {
        naviera = flete[0]!.detalles_calculos.naviera;
      }
      break;
    case "Maritimo - Compartido":
      {
        naviera = flete[0]!.detalles_calculos.agentes_lcl_nombre;
      }
      break;
    case "Aereo":
      {
        naviera = flete[0]!.detalles_calculos.agentes_aereo_nombre;
      }
      break;

    default:
  }

  datos.value.desgloseValues = desgloseValues;
  datos.value.desgloseValuesCostos = desgloseValuesCostos;
  datos.value.show = true;
  datos.value.flete = flete;
  datos.value.impuestosAltos = impuestosAltos;
  datos.value.impuestosMedios = impuestosMedios;
  datos.value.impuestosBajos = impuestosBajos;
  datos.value.servicioLogistico = servicioLogistico;
  datos.value.transporte = transporte;
  datos.value.seguro = seguro;
  datos.value.honorarios = honorarios;
  datos.value.naviera = naviera;
  datos.value.totalIGVFleteCostos = totalIGVFleteCostos.toFixed(2);
  datos.value.totalIGVCostos = totalIGVCostos![0];
  datos.value.servicioLogisticoTotal = servicioLogisticoTotal;
  datos.value.desgloseTotal = desgloseTotal[0];
  datos.value.totalVenta = totalVenta;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function igv(
  item: ConceptoCotizacionCalculadora,
  pais: string,
  totalIGVCostos: number,
) {
  let valor;
  switch (pais) {
    case "PERU":
      if (
        item.tipo != "THCD" &&
        item.tipo != "TCHD DOCUMENTACION" &&
        item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
        item.tipo != "FLETE" &&
        item.tipo != "FLETE MARÍTIMO" &&
        item.tipo != "FLETE AÉREO" &&
        totalIGVCostos > 0
      ) {
        if (
          item.tipo == "SERVICIO LOGÍSTICO" ||
          item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
        ) {
          valor = ((item.valor / 3) * 2 * 0.18).toFixed(2);
        } else {
          valor = (item.valor * 0.18).toFixed(2);
        }
      } else {
        valor = "n/a";
      }

      break;
    case "PANAMA":
      if (
        item.tipo == "PORT CHARGES" ||
        (item.tipo == "MANEJOS" && totalIGVCostos > 0)
      ) {
        valor = (item.valor * 0.07).toFixed(2);
      } else {
        valor = "n/a";
      }

      break;
    case "VENEZUELA":
      valor = "n/a";
      break;

    default:
  }
  return valor;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function igvMasTotal(
  item: ConceptoCotizacionCalculadora,
  pais: string,
  totalIGVCostos: number,
) {
  let valor;
  switch (pais) {
    case "PERU":
      if (
        item.tipo != "THCD" &&
        item.tipo != "TCHD DOCUMENTACION" &&
        item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
        item.tipo != "FLETE" &&
        item.tipo != "FLETE MARÍTIMO" &&
        item.tipo != "FLETE AÉREO" &&
        totalIGVCostos > 0
      ) {
        if (
          item.tipo == "SERVICIO LOGÍSTICO" ||
          item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
        ) {
          valor = ((item.valor / 3) * 2 * 0.18 + item.valor).toFixed(2);
        } else {
          valor = (item.valor * 1.18).toFixed(2);
        }
      } else {
        valor = item.valor;
      }

      break;
    case "PANAMA":
      if (
        item.tipo == "PORT CHARGES" ||
        (item.tipo == "MANEJOS" && totalIGVCostos > 0)
      ) {
        valor = (item.valor * 0.07 + item.valor).toFixed(2);
      } else {
        valor = item.valor;
      }

      break;
    case "VENEZUELA":
      valor = item.valor;
      break;

    default:
  }
  return valor;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function totalGeneralCostos(item: unknown, pais: string) {
  let valor;
  switch (pais) {
    case "PERU":
      valor = item;
      break;
    case "PANAMA":
      valor = item;
      break;
    case "VENEZUELA":
      valor = "";
      break;

    default:
  }
  return valor;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function totalGeneralMasIGVGanancias(
  item: unknown,
  item2: unknown,
  pais: string,
  totalIGVCostos: number,
) {
  let valor;
  switch (pais) {
    case "PERU":
      if (totalIGVCostos > 0) {
        valor = ((Number(item) / 3) * 2 * 0.18 + Number(item2)).toFixed(2);
      } else {
        valor = "n/a";
      }

      break;
    case "PANAMA":
      if (totalIGVCostos > 0) {
        valor = Number(item2).toFixed(2);
      } else {
        valor = "n/a";
      }

      break;
    case "VENEZUELA":
      valor = "n/a";
      break;

    default:
  }
  return valor;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function totalGeneralMasIgvVEnta(
  servicioLogisticoTotal: number,
  totalIGVFleteCostos: unknown,
  pais: string,
  totalIGVCostos: number,
  totalVenta: unknown,
) {
  let valor;
  switch (pais) {
    case "PERU":
      if (totalIGVCostos > 0) {
        valor = (
          Number(totalIGVFleteCostos) +
          Number(
            (servicioLogisticoTotal / 3) * 2 * 0.18 + servicioLogisticoTotal,
          )
        ).toFixed(2);
      } else {
        valor = "n/a";
      }

      break;
    case "PANAMA":
      if (totalIGVCostos > 0) {
        valor = (Number(totalVenta) + Number(totalIGVCostos)).toFixed(2);
      } else {
        valor = "n/a";
      }

      break;
    case "VENEZUELA":
      valor = "n/a";
      break;

    default:
  }
  return valor;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function conver_conten(valor: ConceptoCotizacionCalculadora[]) {
  let contenedores = " ";
  const flete = valor[0]!.input_contenedores!;
  for (let i = 0; i < flete.length; i++) {
    switch (flete[i]![0]) {
      case 1:
        contenedores += flete[i]![1] + "*20' STD, ";
        break;
      case 2:
        contenedores += flete[i]![1] + "*40' STD, ";
        break;
      case 3:
        contenedores += flete[i]![1] + "*40' HC, ";
        break;
      case 4:
        contenedores += flete[i]![1] + "*40' NOR";
        break;

      default:
    }
  }
  return contenedores;
}
</script>

<template>
  <v-container fluid class="calc-users-container">
    <v-card class="calc-users-card px-5">
      <v-card-title class="calc-users-toolbar d-flex align-center flex-wrap">
        <v-text-field
          v-model="search"
          class="calc-users-search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar usuario"
          single-line
          hide-details
          variant="outlined"
          density="compact"
          clearable
        />
        <v-spacer />
        <v-btn
          v-if="can('listUserCalc', 'EXPORTAR')"
          class="calc-users-export"
          variant="flat"
          prepend-icon="mdi-download"
          @click="exportar()"
          :loading="loading"
          :disabled="loadingList"
        >
          Exportar
        </v-btn>
        <v-btn
          class="calc-users-filter"
          variant="flat"
          prepend-icon="mdi-filter-outline"
          :disabled="loadingList"
          @click="abrirFiltro"
        >
          Filtrar
        </v-btn>
      </v-card-title>
        <div class="calc-users-search-hint">
          La búsqueda rápida solo filtra la tabla; la exportación utiliza los filtros aplicados.
        </div>
        <v-data-table
          :headers="headers"
          :items="calculadorasStore.listUser"
          :search="search"
          item-value="id"
          id="tblListUser"
          class="calc-users-table"
          :loading="loadingList"
          :items-per-page="10"
          show-expand
          expand-strategy="single"
          v-model:expanded="expanded"
        >
          <!-- <template v-slot:[`item.accion`]="{ item }">
            
          </template> -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <v-table>
                  <thead class="headerDetails">
                    <tr>
                      <th>Fecha</th>
                      <th>Comentario</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody v-if="item.detalle!.length > 0">
                    <tr v-for="(i, index) in item.detalle" :key="i.id || index">
                      <td>{{ i.fecha }}</td>
                      <td>{{ i.comentario }}</td>
                      <td>{{ i.nombrecompleto }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
          <template #[`item.estadocotizacion`]="{ item }">
            <v-chip
              v-if="item.estadocotizacion == 2"
              class="ma-2 text-white"
              color="green"
              variant="flat"
            >
              Aprobado
            </v-chip>
            <v-chip
              v-if="item.estadocotizacion == 1"
              class="ma-2"
              color="primary"
            >
              En Espera
            </v-chip>
          </template>
          <template #[`item.estado_cotizacion`]="{ item }">
            <v-chip v-if="item.estado_cotizacion" size="small" color="primary" variant="tonal">
              {{ item.estado_cotizacion }}
            </v-chip>
          </template>
          <template #[`item.action`]="{ item }">
            <div class="calc-users-actions">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    class="calc-users-action calc-users-action-call"
                    variant="flat"
                    icon
                    size="small"
                    v-bind="props"
                    @click="abrirModalCambiarEstado(item)"
                    aria-label="Registro Llamada"
                    v-if="can('listUserCalc', 'MODIFICAR')"
                  >
                    <v-icon color="primary">mdi-phone-plus</v-icon>
                  </v-btn>
                </template>
                <span>Registro Llamada</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    class="calc-users-action calc-users-action-image"
                    variant="flat"
                    icon
                    size="small"
                    v-bind="props"
                    @click="abrirImg(item)"
                    aria-label="Ver Capture"
                    v-if="item.capture_cotizacion"
                  >
                    <v-icon color="#B71C1C">mdi-image-area</v-icon>
                  </v-btn>
                </template>
                <span>Ver Capture</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    class="calc-users-action calc-users-action-view"
                    variant="flat"
                    icon
                    size="small"
                    v-bind="props"
                    @click="abrirModalPreview(item)"
                    aria-label="Ver Costos"
                    v-if="item.estadocotizacion == 1"
                  >
                    <v-icon color="#4A148C">mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span> Ver Costos</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    class="calc-users-action calc-users-action-send"
                    variant="flat"
                    icon
                    size="small"
                    v-bind="props"
                    @click="enviarCotizacionAPricing(item)"
                    aria-label="Enviar Pricing"
                    v-if="item.estadocotizacion == 1 && can('listUserCalc', 'MODIFICAR')"
                  >
                    <v-icon color="#01579B">
                      mdi-invoice-text-send-outline
                    </v-icon>
                  </v-btn>
                </template>
                <span>Enviar Pricing</span>
              </v-tooltip>
            </div>
            <!-- <v-btn x-small icon color="primary" @click="openCall(item)">
            <v-icon>mdi-phone</v-icon>
          </v-btn>
          <v-btn x-small icon color="info" @click="openHistoryCall(item)">
            <v-icon>mdi-clipboard-text-clock</v-icon>
          </v-btn> -->
          </template>
        </v-data-table>
    </v-card>
    <v-navigation-drawer
      v-model="filterOpen"
      class="calc-users-filter-drawer"
      location="right"
      temporary
      width="min(480px, 100vw)"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">Filtrar Registros</v-list-item-title>
      </v-list-item>
      <v-container>
        <v-card-text>
          <v-progress-linear v-if="loadingFilters" indeterminate color="primary" class="mb-4" />
          <v-row>
            <v-col cols="12">
              <v-autocomplete v-model="filtro.id_port_begin" :items="puertosOrigen" item-title="port_origen" item-value="id_port" label="Puerto origen" variant="outlined" density="compact" hide-details clearable />
            </v-col>
            <v-col cols="12">
              <v-autocomplete v-model="filtro.id_port_end" :items="puertosDestino" item-title="port_destino" item-value="id_port" label="Puerto destino" variant="outlined" density="compact" hide-details clearable />
            </v-col>
            <v-col cols="12">
              <v-autocomplete v-model="filtro.id_cliente" :items="clientes" item-title="nombre" item-value="id" label="Cliente" variant="outlined" density="compact" hide-details clearable />
            </v-col>
            <v-col cols="12">
              <v-autocomplete v-model="filtro.id_status" :items="estadosCotizacion" item-title="name" item-value="id" label="Estado de cotización" variant="outlined" density="compact" hide-details clearable />
            </v-col>
          </v-row>
          <v-alert v-if="filterError" type="error" density="compact" class="mt-4">{{ filterError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="success" variant="flat" :loading="loadingList" :disabled="loadingFilters" @click="aplicarFiltro">Aceptar</v-btn>
          <v-btn variant="flat" :disabled="loadingList" @click="limpiarFiltro">Limpiar</v-btn>
          <v-btn color="warning" variant="flat" :disabled="loadingList" @click="filterOpen = false">Cerrar</v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>
    <PreviewQuote :dialog="dialog" :data="dataCotizacion" />
    <v-dialog v-model="dialogEditarEstado" max-width="30%">
      <v-card>
        <v-card-title class="text-headline-medium pb-0">
          <p>Detalle de Nota de llamada</p>
        </v-card-title>
        <v-card-text>
          <v-card-subtitle class="pt-0">
            {{ dataCotizacion.nombre }} | {{ dataCotizacion.telefono }}
          </v-card-subtitle>
          <br />
          <v-form ref="frmComentario">
            <v-text-field
              label="Fecha "
              id="id"
              v-model="fecha"
              readonly
              variant="outlined"
              prepend-inner-icon="mdi-calendar-account-outline"
              density="compact"
            />

            <v-textarea
              auto-grow
              rows="1"
              label="Descripción"
              variant="outlined"
              :rules="[(v) => !!v || 'Dato Requerido']"
              density="compact"
              v-model="dataCotizacion.comentario"
            />

            <v-select
              v-model="dataCotizacion.id_status_quote"
              :items="calculadorasStore.estatusCotizacion"
              item-title="name"
              item-value="id"
              label="Estado Cotización"
              :rules="[(v) => !!v || 'Dato Requerido']"
              density="compact"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="success" @click="guardarEstadoCotizacion()">
            Guardar
          </v-btn>
          <v-btn color="red" variant="text" @click="dialogEditarEstado = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.calc-users-card {
  border-radius: 18px;
}
.calc-users-toolbar {
  gap: 12px;
  padding: 20px 4px 16px;
}
.calc-users-search {
  flex: 0 1 400px;
  min-width: 220px;
}
.calc-users-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}
.calc-users-search-hint {
  margin: -8px 4px 12px;
  color: #5b6372;
  font-size: 0.8rem;
}
.calc-users-filter {
  color: #17448e;
  background-color: #e8f0fe;
}
.calc-users-export {
  color: #00695c;
  background-color: #e0f2f1;
}
.calc-users-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}
.calc-users-table :deep(> .v-table__wrapper > table > thead) {
  color: #14264e;
  background-color: #e8effb;
}
.calc-users-table :deep(> .v-table__wrapper > table > tbody > tr:nth-of-type(even)) {
  background-color: #f5f7fb;
}
.calc-users-table :deep(> .v-table__wrapper > table > tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}
.calc-users-actions {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 4px;
}
.calc-users-action {
  border-radius: 9px;
}
.calc-users-action-call {
  background-color: #e8efff !important;
}
.calc-users-action-image {
  background-color: #ffebeb !important;
}
.calc-users-action-view {
  background-color: #f1e9fa !important;
}
.calc-users-action-send {
  background-color: #e0f2f1 !important;
}
</style>
