<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import moment from "moment";
import { io } from "socket.io-client";
import axios from "@/api/http";
import QuoteNotificationPopup from "@/components/folderPricing/QuoteNotifications/QuoteNotificationPopup.vue";
import GeneratedQuoteDialog from "@/components/folderPricing/QuoteNotifications/GeneratedQuoteDialog.vue";
import ListMenu from "@/components/ListMenu.vue";
import CotizacionPilotoAutomatico from "@/components/folderPricing/CotizacionPilotoAutomatico.vue";
import { blockedQuoteSave } from "@/components/folderPricing/quoteRules";
import FormatFecha from "../../components/comun/FormatFecha.vue";
import LoadingComponent from "../../components/comun/LoadingComponent.vue";
import BtnIrAlListado from "../../components/comun/BtnIrAlListado.vue";
import BotonesHeader from "../../components/comun/BotonesHeader.vue";
import PlanStatusBadge from "../../components/SubscriptionPackages/PlanStatusBadge.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { useTownStore } from "@/stores/town";
import { validateCost } from "@/utils/cotizacion";
import type { ApiResponse } from "@/types/api";
import type {
  ArchivoDrive,
  EstadoCotizacion,
  Incoterm,
  OpcionCosto,
  Puerto,
  Servicio,
  TipoCarga,
} from "@/types/cotizacion";
import type {
  ContactoEntidad,
  ConvenioEntidad,
  DatoTarifaProveedor,
  InformacionBancaria,
  Operador,
  RolProveedor,
  TarifaEntidad,
  TelefonoEntidad,
  TipoTransaccion,
} from "@/types/entidades";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { useFilesStore } from "@/stores/files";
import { usePermissions } from "@/composables/usePermissions";
import { mostrarAvisoVigenciaFlete } from "./avisoVigenciaFlete";
import { TEMPLATE_NOT_FOUND, useProviderQuoteEmailTemplateStore } from "@/stores/providerQuoteEmailTemplate";
import { buildProviderQuoteEmail, buildProviderQuoteSubject } from "@/utils/providerQuoteEmail";
import { quoteEmailFieldValues, quoteShipmentId } from "@/utils/providerQuoteEmailFields";
import type { QuoteEmailLists } from "@/utils/providerQuoteEmailFields";
import type { EmailLanguage } from "@/types/providerQuoteEmailTemplate";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const filesStore = useFilesStore();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const townStore = useTownStore();
const calculadorasStore = useCalculadorasStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const providerQuoteEmailTemplateStore = useProviderQuoteEmailTemplateStore();
// Read on every render: this layout stays mounted when the session reloads its permissions.
const can = (screen: string, action: string) =>
  usePermissions().can(screen, action);

const socket = io(import.meta.env.VITE_URL_MAIN, {
  transports: ["polling"],
  auth: (cb) => cb({ token: sessionStorage.getItem("auth-token") }),
});
socket.on("connect_error", (err) => {
  console.error("Error al conectar con Socket.IO:", err);
});
onUnmounted(() => socket.disconnect());

const dialogSeleccionDistrito = ref(false);
const dialogCambiarFecha = ref(false);
const fechaVigencia = ref<string | null>("");
const snackbar = ref(false);
const tituloMensaje = ref("");
const dataMensaje = ref("");
const snackbarColor = ref<"operation">("operation");
const snackbarIcon = ref("mdi-bell-outline");
const dialogFiles = ref(false);
const headersFiles = [
  { title: "Archivo", key: "name" },
  { title: "", key: "action" },
];
const mostrarBtnMenu = ref(true);
const routeAduana = ["newCotizacionAduana", "EditarAduana", "VerAduana"];
const dialogAdminAuth = ref(false);
const adminUser = ref("");
const adminPassword = ref("");
const showAdminPassword = ref(false);
const adminAuthLoading = ref(false);
const adminAuthError = ref("");
const dialogProveedor = ref(false);
const dialogPilotoAutomatico = ref(false);
const idRole = ref<number[]>([]);
const lstDatosTarifa = ref<DatoTarifaProveedor[]>([]);
const templateLoadError = ref<string | null>(null);
const formVigencia = useTemplateRef("formVigencia");

onMounted(async () => {
  const urlPricing = [
    "lstQuote",
    "newQuote",
    "verQuote",
    "editQuote",
    "listClientes",
    "nuevoClientes",
    "verCliente",
    "editarCliente",
  ];
  socket.emit(
    "join-empresa",
    JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
  );

  socket.on("nueva-operacion", (data: { mensaje: string }) => {
    if (!urlPricing.includes(route.name as string)) {
      snackbarColor.value = "operation";
      snackbarIcon.value = "mdi-bell-outline";
      tituloMensaje.value = "Nueva operación";
      dataMensaje.value = data.mensaje;
      snackbar.value = true;
    }
  });

  abrirSwalConfigFlete();
  nextTick(() => {
    appStore.drawer = false;
  });
});

function descartarAvisoSocket(): void {
  snackbar.value = false;
}

onBeforeMount(() => {
  mostrarBtnMenu.value = !JSON.parse(
    sessionStorage.getItem("dataBranch") as string,
  )[0].esnuevoflag;
  appStore.drawer = mostrarBtnMenu.value;
});

const itemsOperadorList = computed<Operador[]>(
  () => appStore.itemsOperadorList,
);
const listadoFilesDrive = computed<ArchivoDrive[]>(
  () => pricingStore.listadoFilesDrive,
);
const operadorNombre = computed(() => {
  const isHousePage =
    route.name &&
    ((route.name as string).includes("House") ||
      (route.name as string).includes("controlHouse"));

  if (!isHousePage) {
    return "";
  }

  if (appStore.dataHouse_operador) {
    return appStore.dataHouse_operador;
  }

  const operadorId =
    housesStore && housesStore.house ? housesStore.house.id_operador : null;

  if (!operadorId || !itemsOperadorList.value) {
    return "";
  }

  const operador = itemsOperadorList.value.find((op) => op.id == operadorId);
  return operador ? operador.namelong : "";
});

// ...mapActions("calculadoras", ["actualizarFechaVigencia"]),
function abrirCarpeta(url?: string) {
  if (!url) {
    Swal.fire({
      icon: "warning",
      title: "Error",
      text: "No existe carpeta asociada.",
    });
    return;
  }
  window.open(url, "_blank");
}
async function guardarNuevaFecha() {
  if ((await formVigencia.value!.validate()).valid) {
    await calculadorasStore.actualizarFechaVigencia(fechaVigencia.value);
    dialogCambiarFecha.value = false;
  }
}
function abrirSwalConfigFlete() {
  const routesHome = ["Home", "Main"];
  const positions = ["01", "02"];
  const dataBranch: SucursalSesion | undefined = JSON.parse(
    sessionStorage.getItem("dataBranch") as string,
  )?.[0];
  const dataUser: UsuarioSesion | undefined = JSON.parse(
    sessionStorage.getItem("dataUser") as string,
  )?.[0];
  const position = dataUser?.position_code?.[0];
  if (!dataBranch || !position) return;

  const { tienefleteactivo, dias_restantes, vigencia } = dataBranch;
  const routeHome = route.name as string;

  if (
    !tienefleteactivo &&
    routesHome.includes(routeHome) &&
    positions.includes(position)
  ) {
    mostrarAvisoVigenciaFlete(dias_restantes, vigencia).then((res) => {
      if (res.isConfirmed) {
        dialogCambiarFecha.value = true;
      } else if (res.isDenied) {
        router.push({
          name: "ServiciosCostosFijosLCL",
        });
      }
    });
  }
}
async function guardarCotizacion() {
  const validacion = validarRegistro() && !blockedQuoteSave(pricingStore);
  if (!!validacion) {
    appStore.spiner = true;
    const respuesta = await pricingStore
      .registrarQuote({ fullflag: true })
      .finally(() => {
        appStore.spiner = false;
      });
    if (!respuesta.estadoflag) {
      Swal.fire({
        icon: "error",
        title: "No se guardó la cotización",
        text: respuesta.mensaje,
      });
      return;
    }
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: pricingStore.mensaje,
      confirmButtonText: "Ir a ver",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({
          name: "verQuote",
          params: { id: pricingStore.id },
        });
      }
    });
    const id_branch = JSON.parse(
      sessionStorage.getItem("dataUser") as string,
    )[0].id_branch;
    const branchCreacion = [1, 2];
    if (branchCreacion.includes(id_branch)) {
      const { url: urlGenerada } = await pricingStore.crearCarpetaOneDrive({
        nro_quote: pricingStore.nro_quote,
        nombre: pricingStore.datosPrincipales.nombre,
      });

      if (urlGenerada) {
        await pricingStore
          .actualizarURLEnElQuote({
            id: pricingStore.id,
            url: urlGenerada,
          })
          .catch((e: unknown) => {
            console.error(e);
          });
      } else {
        console.warn(
          "No se obtuvo URL de OneDrive, se saltó la actualización.",
        );
      }
    }
  }
}
async function editarCotizacion() {
  // let val = await this.validarCosto();
  let val = true;
  val = !pricingStore.opcionCostos.some(
    (v: OpcionCosto) =>
      !v.date_end || !v.tiempo_transito || !isDateValid(v.date_end),
  );

  // // -----------------------------------------------------
  if (val) {
    appStore.spiner = false;
    if (!(await pricingStore.updateQuote())) return;

    const destino = {
      name: "verQuote",
      params: {
        id: pricingStore.id,
        step: pricingStore.step ? pricingStore.step : 1,
      },
    };
    if (router.resolve(destino).fullPath !== route.fullPath) {
      await router.push(destino);
    }
    appStore.spiner = false;
  } else {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "Existe una o más Fechas de validez y/o tiempos en tránsito, INCOMPLETOS. Verifique.",
    });
    pricingStore.tab = 2;
  }
}
async function editarCotizacionAduana() {
  // let val = await this.validarCosto();
  let val = true;
  val = !aduanaStore.opcionCostos.some(
    (v: OpcionCosto) =>
      !v.date_end || !v.tiempo_transito || !isDateValid(v.date_end),
  );

  // // -----------------------------------------------------
  if (val) {
    appStore.spiner = false;
    await aduanaStore.actualizarQuoteAduana();

    router.push({
      name: "VerAduana",
      params: {
        id: aduanaStore.id,
        step: aduanaStore.step ? aduanaStore.step : 1,
      },
    });
    appStore.spiner = false;
  } else {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "Existe una o más Fechas de validez y/o tiempos en tránsito, INCOMPLETOS. Verifique.",
    });
    aduanaStore.tab = 2;
  }
}
async function abrirCorreo() {
  const codeLCL = [9017];
  const codeFCL = [9017, 9001, 9002, 9026];
  const codeAereo = [9017, 9024];
  idRole.value = [];
  dialogProveedor.value = true;
  const [loadError] = await Promise.all([providerQuoteEmailTemplateStore.load(), appStore._getRole()]);
  templateLoadError.value = loadError;
  const code = pricingStore.listShipment.find(
    (v: TipoCarga) => v.id == pricingStore.datosPrincipales.idtipocarga,
  )!.code;
  switch (code) {
    case "LCL":
      idRole.value = appStore.itemsDataRoleList
        .filter((v: RolProveedor) => codeLCL.includes(v.code))
        .map((v: RolProveedor) => v.id);
      break;
    case "FCL":
      idRole.value = appStore.itemsDataRoleList
        .filter((v: RolProveedor) => codeFCL.includes(v.code))
        .map((v: RolProveedor) => v.id);
      break;
    case "Aéreo":
      idRole.value = appStore.itemsDataRoleList
        .filter((v: RolProveedor) => codeAereo.includes(v.code))
        .map((v: RolProveedor) => v.id);
      break;
  }
}
// abrirCorreoSend() {
//   const selected = this.lstDatosTarifa.filter((v) => v.selected);
//   const to = selected
//     .map((v) => v.email)
//     .filter((e) => e)
//     .join(",");
//   let id_incoterms = this.$store.state.pricing.datosPrincipales.idincoterms
//     ? this.$store.state.pricing.datosPrincipales.idincoterms
//     : "";
//   let incoterms = this.$store.state.pricing.listIncoterms.find(
//     (v) => v.id == id_incoterms,
//   );
//   // Cambiamos acentos por letras normales
//   const subject = encodeURIComponent(
//     "Cotizacion Nro:" + this.$store.state.pricing.nro_quote,
//   );

//   const lineasBody = [
//     "Hola colega,",
//     "Me ayudas cotizando este embarque:",
//     "",

//     ` INCOTERMS:  ${incoterms.name}          `,
//     ` DIRECCION PROVEEDOR:  `,
//     ` PESO:  ${this.$store.state.pricing.datosPrincipales.peso || ""} `,
//     ` M3:  ${this.$store.state.pricing.datosPrincipales.volumen || ""} `,
//     ` COMMODITY:  `,
//     "-------------------------------------------",
//     "",
//     "Saludos cordiales.",
//   ];

//   const body = encodeURIComponent(lineasBody.join("\r\n"));
//   window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
// },
async function abrirCorreoSend(language: EmailLanguage) {
  const valIncoterms = ["EXW", "FCA", "FOB"];
  const selected = lstDatosTarifa.value.filter((v) => v.selected);
  const to = selected
    .map((v) => v.email)
    .filter((e) => e)
    .join(";");

  const incoterms = pricingStore.listIncoterms.find(
    (v: Incoterm) => v.id == pricingStore.datosPrincipales.idincoterms,
  )!;

  const miEmail = sessionStorage.getItem("dataUser")
    ? JSON.parse(sessionStorage.getItem("dataUser") as string)[0].correoemail
    : "";

  const origen = pricingStore.listPortBegin.find(
    (v: Puerto) => v.id_port == pricingStore.datosPrincipales.idorigen,
  );
  const destino = pricingStore.listPortEnd.find(
    (v: Puerto) => v.id_port == pricingStore.datosPrincipales.iddestino,
  );

  if (!valIncoterms.includes(incoterms.name!)) {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "El INCOTERMS seleccionado no es compatible con el formato de correo automático. Por favor, seleccione EXW, FCA o FOB para usar esta función.",
    });
    return;
  }

  const shipmentId = quoteShipmentId(pricingStore.datosPrincipales);
  const template = shipmentId === null ? null : providerQuoteEmailTemplateStore.templateFor(shipmentId, language);
  if (!template) {
    Swal.fire({ icon: "warning", text: templateLoadError.value ?? TEMPLATE_NOT_FOUND });
    return;
  }

  const shipment = {
    quoteNumber: pricingStore.nro_quote,
    client: pricingStore.dataCliente.nombrecompleto ?? "",
    incoterm: incoterms.name!,
    portOfLoading: origen?.name,
    portOfDischarge: destino?.name,
    weight: pricingStore.datosPrincipales.peso,
    volume: pricingStore.datosPrincipales.volumen,
  };
  const lists: QuoteEmailLists = {
    incoterms: pricingStore.listIncoterms.map((item) => ({ id: item.id!, name: item.name ?? "" })),
    portsOfLoading: pricingStore.listPortBegin.map((port) => ({ id: port.id_port!, name: port.name ?? "" })),
    portsOfDischarge: pricingStore.listPortEnd.map((port) => ({ id: port.id_port!, name: port.name ?? "" })),
    marketing: pricingStore.listMarketing.map((item) => ({ id: item.id!, name: item.name ?? "" })),
    statuses: pricingStore.listQuoteStatus.map((item) => ({ id: item.id!, name: item.name ?? "" })),
    staff: pricingStore.listEjecutivo.map((item) => ({ id: item.id!, name: item.nombrecompleto ?? "" })),
    directions: pricingStore.listModality.map((item) => ({ id: item.id!, name: item.name ?? "" })),
    shipmentTypes: pricingStore.listShipment.map((item) => ({ id: item.id!, name: item.embarque ?? "" })),
    providers: appStore.itemsProveedorList.map((item) => ({ id: item.id!, name: String(item.namelong ?? "") })),
    importOrders: masterusuariosStore.lstPercepcionAduana.map((item) => ({ id: item.id!, name: item.descripcion ?? "" })),
  };
  const subject = buildProviderQuoteSubject(language, shipment);
  const tablaHtml = buildProviderQuoteEmail(template, quoteEmailFieldValues(pricingStore.datosPrincipales, lists));

  try {
    const blob = new Blob([tablaHtml], { type: "text/html" });
    const data = [new ClipboardItem({ ["text/html"]: blob })];
    await navigator.clipboard.write(data);

    Swal.fire({
      icon: "info",
      title: "¡Casi listo!",
      html: `
              <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
                <h2 style="color: #333; margin-top: 0;">Correo copiado</h2>
                
                <div style="background-color: #eef6ff; border: 2px dashed #3085d6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="font-size: 1.1rem; color: #555; margin: 0;">
                    Para finalizar, abre <strong>Outlook</strong> y presiona:
                  </p>
                  <div style="margin: 15px 0;">
                    <kbd style="font-size: 1.5rem; background: #333; color: #fff; padding: 5px 15px; border-radius: 6px; box-shadow: 0 4px 0 #000;">
                      Ctrl + V
                    </kbd>
                  </div>
                  <p style="font-size: 0.9rem; color: #3085d6; font-weight: bold;">
                    ¡Asegúrate de pegar el contenido antes de cerrar esta ventana!
                  </p>
                </div>
              </div>
            `,
      // timer: 2500,
    });

    const body = encodeURIComponent("(PEGA AQUÍ EL CORREO CON CTRL + V)");
    window.location.href = `mailto:${miEmail}?bcc=${to}&subject=${encodeURIComponent(
      subject,
    )}&body=${body}`;
    dialogProveedor.value = false;
  } catch (err) {
    console.error("Error al copiar:", err);
    Swal.fire({
      icon: "error",
      text: "No pudimos copiar el correo. Revisa que el navegador permita usar el portapapeles e intenta de nuevo.",
    });
  }
}
function abrirModalCopiarCotizacion() {
  Swal.fire({
    title: "ADVERTENCIA",
    text: "¿Desea Crear una copia de esta cotización?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    denyButtonText: `Cancelar`,
  }).then(async (result) => {
    if (result.isConfirmed) {
      validarExistTransporte();
    }
  });
}
function validarExistTransporte() {
  const { servicios, id_town } = pricingStore.datosPrincipales;
  const hayDistritos = townStore.lstTownPricing.length > 0;

  if (
    servicios!.some((v: Servicio) => v.code_service == "14" && v.status == 1) &&
    hayDistritos &&
    !id_town
  ) {
    dialogSeleccionDistrito.value = true;
    return;
  }
  dialogFiles.value = true;
}
function confirmarSeleccionDistrito() {
  dialogSeleccionDistrito.value = false;
  dialogFiles.value = true;
}
function getColorIcon(item: ArchivoDrive) {
  if (item.folder) return "amber";
  const extension = item.extension ? item.extension.toLowerCase() : "";

  const colors: Record<string, string> = {
    pdf: "red",
    xlsx: "green",
    xls: "green",
    docx: "blue",
    doc: "blue",
    png: "purple",
    jpg: "purple",
  };

  return colors[extension] || "grey";
}
function getIconFile(item: ArchivoDrive) {
  if (item.folder) return "mdi-folder";

  const extension = item.extension ? item.extension.toLowerCase() : "";

  switch (extension) {
    case "pdf":
      return "mdi-file-pdf-box";
    case "xls":
    case "xlsx":
      return "mdi-file-excel";
    case "doc":
    case "docx":
      return "mdi-file-word";
    case "png":
    case "jpg":
    case "jpeg":
      return "mdi-file-image";
    case "zip":
    case "rar":
      return "mdi-zip-box";
    default:
      return "mdi-file";
  }
}

async function copiarCotizacion() {
  dialogFiles.value = false;
  try {
    Swal.fire({
      icon: "warning",
      text: "Cargando... un momento por favor",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const copyFailure = await pricingStore.copiarQuote({
      fullflag: true,
      id: route.params.id,
    });
    if (copyFailure) {
      Swal.fire({ icon: "error", title: "No se pudo copiar la cotización", text: copyFailure });
      return;
    }

    const userStr = sessionStorage.getItem("dataUser");
    const id_branch = userStr ? JSON.parse(userStr)[0].id_branch : null;
    const branchCreacion = [1, 2];

    if (branchCreacion.includes(id_branch)) {
      // Aquí recibimos el return de la función anterior
      const { url: urlGenerada } = await pricingStore.crearCarpetaOneDrive({
        nro_quote: pricingStore.nro_quote,
        nombre: pricingStore.datosPrincipales.nombre,
      });

      if (urlGenerada) {
        await Promise.all([
          pricingStore.actualizarURLEnElQuote({
            id: pricingStore.id,
            url: urlGenerada,
          }),
          filesStore.moveFileToOneDrive({
            fileIds: pricingStore.selectedFile.map(
              (file: ArchivoDrive) => file.id,
            ),
            destinationFolderUrl: urlGenerada,
          }),
        ]);
      } else {
        console.error(
          "No se obtuvo URL de OneDrive, se saltó la actualización.",
        );
      }
    }

    Swal.close();
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: pricingStore.mensaje,
      confirmButtonText: "Ir a ver",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await router.push({
          name: "verQuote",
          params: { id: pricingStore.id },
        });
        nextTick(() => {
          location.reload();
        });
        // setTimeout(() => {
        // }, 100);
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    // Swal.close();
  }
}
function validarRegistro() {
  let val = true;

  if (pricingStore.opcionCostos.some((v: OpcionCosto) => v.date_end == "")) {
    Swal.fire({
      icon: "warning",
      title: "Aviso",
      text: "La fecha de validez para las opciones es requerida.",
    });
    val = false;
  } else {
    if (
      !pricingStore.opcionCostos.some((v: OpcionCosto) =>
        isDateValid(v.date_end),
      )
    ) {
      Swal.fire({
        icon: "warning",
        title: "Aviso",
        text: "La fecha de validez  para las opciones debe ser mayor que la fecha actual.",
      });
      val = false;
    }
  }
  if (!pricingStore.opcionCostos.some((v: OpcionCosto) => v.tiempo_transito)) {
    Swal.fire({
      icon: "warning",
      title: "Aviso",
      text: "El tiempo de transito  para las opciones es requerido. ",
    });
    val = false;
  }
  if (val) {
    return val;
  }

  let validacioncosto = null as { estado: boolean; mensaje: string } | null;
  pricingStore.opcionCostos.forEach((element: OpcionCosto) => {
    const validateCostos = validateCost({
      costo: element.listCostos.filter((v) => v.esopcionflag == 1),
      multiplicador: pricingStore.listMultiplicador,
      services: pricingStore.listServices,
    });
    if (validateCostos.estado) {
      validacioncosto = validateCostos;
      val = false;
    }
  });
  if (val) {
    Swal.fire({
      icon: "warning",
      title: "Aviso",
      text: validacioncosto!.mensaje,
    });
    val = validacioncosto!.estado;
  }
  return val;
}
function getNameUrl() {
  const name = route.name as string;

  return name;
}
function obtenerTipoAlert() {
  let type = "red";
  const Url = ["newQuote", "editQuote", "verQuote", "VerCotizacionCalculadora"];
  if (Url.includes(getNameUrl())) {
    if (pricingStore.totalCosto - pricingStore.totalVenta < 0) {
      type = "success";
    }
    if (pricingStore.totalCosto - pricingStore.totalVenta > 0) {
      type = "error";
    }
  }
  if (Url.includes(getNameUrl())) {
    if (aduanaStore.totalCosto - aduanaStore.totalVenta < 0) {
      type = "success";
    }
    if (aduanaStore.totalCosto - aduanaStore.totalVenta > 0) {
      type = "error";
    }
  }

  return type;
}
function currencyFormat(number: number) {
  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
  }).format(number);
  return money;
}
function colorBar() {
  let color = "#252C32";
  const Url = [
    "newQuote",
    "editQuote",
    "verQuote",
    "VerCotizacionCalculadora",
    "newCotizacionAduana",
    "EditarAduana",
    "VerAduana",
  ];
  if (Url.includes(getNameUrl())) {
    color = obtenerTipoAlert();
  }
  return color;
}
function ira(ruta: string, id: string | string[] | undefined) {
  router.push({
    name: ruta,
    params: {
      id: id,
    },
  });
  setTimeout(() => {
    //window.location.reload();
  }, 100);
}
function esUsuarioAdmin() {
  try {
    const dataUser: UsuarioSesion[] | null = JSON.parse(
      sessionStorage.getItem("dataUser") as string,
    );
    if (dataUser && dataUser[0]) {
      // Verificar en ambos campos: 'user' y 'usuario'
      const userEmail = dataUser[0].user || dataUser[0].usuario || "";
      return userEmail.toLowerCase() === "cmrg1979a@gmail.com";
    }
  } catch (e) {
    console.error("Error al verificar usuario admin:", e);
  }
  return false;
}
function esCotizacionAprobada() {
  const pricing = pricingStore;

  // Verificar aprobadoflag (boolean)
  if (pricing.aprobadoflag === true) {
    return true;
  }

  if (pricing.datosPrincipales && pricing.datosPrincipales.nameStatusQuote) {
    const statusName = pricing.datosPrincipales.nameStatusQuote
      .toUpperCase()
      .trim();

    if (statusName === "APROBADO" || statusName === "APROBADA") {
      return true;
    }
  }

  if (pricing.datosPrincipales && pricing.datosPrincipales.id_status) {
    const statusList: EstadoCotizacion[] = pricing.listQuoteStatus || [];
    const currentStatus = statusList.find(
      (s) => s.id === pricing.datosPrincipales.id_status,
    );
    if (currentStatus && currentStatus.name) {
      const statusName = currentStatus.name.toUpperCase().trim();
      if (statusName === "APROBADO" || statusName === "APROBADA") {
        return true;
      }
    }
  }

  return false;
}
function handleEditarQuote() {
  const aprobada = esCotizacionAprobada();
  const esAdmin = esUsuarioAdmin();

  if (!aprobada) {
    ira("editQuote", route.params.id);
    return;
  }

  if (esAdmin) {
    ira("editQuote", route.params.id);
    return;
  }

  dialogAdminAuth.value = true;
  adminUser.value = "";
  adminPassword.value = "";
  adminAuthError.value = "";
}
function cerrarDialogAdminAuth() {
  dialogAdminAuth.value = false;
  adminUser.value = "";
  adminPassword.value = "";
  adminAuthError.value = "";
}
async function validarAdminAuth() {
  adminAuthError.value = "";

  if (!adminUser.value || !adminPassword.value) {
    adminAuthError.value = "Ingrese usuario y contraseña";
    return;
  }

  adminAuthLoading.value = true;

  try {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "singin",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        user: adminUser.value,
        password: adminPassword.value,
      }),
    };

    const response = await axios<ApiResponse<UsuarioSesion[]>>(config);

    if (response.data.estadoflag) {
      const userEmail =
        response.data.data[0]!.user || response.data.data[0]!.usuario;

      if (userEmail && userEmail.toLowerCase() === "cmrg1979a@gmail.com") {
        // Es el admin, permitir edición
        cerrarDialogAdminAuth();
        ira("editQuote", route.params.id);
      } else {
        adminAuthError.value =
          "Solo el usuario administrador puede editar cotizaciones aprobadas";
      }
    } else {
      adminAuthError.value =
        response.data.mensaje || "Credenciales incorrectas";
    }
  } catch (error) {
    console.error("Error en validación admin:", error);
    adminAuthError.value = "Error al validar credenciales";
  } finally {
    adminAuthLoading.value = false;
  }
}
function isDateValid(date?: string) {
  if (!date) {
    return true; // Pasa la validación si el campo está vacío
  }
  const selectedDate = moment(date, "YYYY-MM-DD", true);
  const today = moment();
  return selectedDate.isAfter(today);
}
function isClienteInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v: TipoTransaccion) => {
      return (
        v.codigo == "02" && v.id == entitiesStore.cliente.id_tipotransaccion
      );
    },
  );

  return val;
}
async function registrarCliente() {
  appStore.spiner = true;
  await entitiesStore.guardarCliente();
  appStore.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function modificarCliente() {
  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;
  entitiesStore.isStep5Valid = true;
  entitiesStore.isStep6Valid = true;

  let okStep1 = true;
  if (entitiesStore.cliente) {
    if (!entitiesStore.cliente.id_tipopersona) {
      okStep1 = false;
    }

    if (!entitiesStore.cliente.nombrecompleto) {
      okStep1 = false;
    }

    if (!entitiesStore.cliente.id_tipotransaccion) {
      okStep1 = false;
    }

    if (!entitiesStore.cliente.id_pais) {
      okStep1 = false;
    }

    if (
      entitiesStore.cliente.emailaddress &&
      !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        entitiesStore.cliente.emailaddress,
      )
    ) {
      okStep1 = false;
    }
  }

  let okStep2_1 = true;
  if (entitiesStore.lstTelefonos.length > 0) {
    entitiesStore.lstTelefonos.map((v: TelefonoEntidad) => {
      if (!v.id_tipotelefono) {
        okStep2_1 = false;
      }

      if (!v.telefono) {
        okStep2_1 = false;
      }
    });
  }

  let okStep2_2 = true;
  if (entitiesStore.lstContactos.length > 0) {
    entitiesStore.lstContactos.map((v: ContactoEntidad) => {
      if (!v.nombre) {
        okStep2_2 = false;
      }

      if (!v.id_tipotelefono) {
        okStep2_2 = false;
      }

      if (!v.telefono) {
        okStep2_2 = false;
      }
    });
  }

  let okStep3_1 = true;
  if (entitiesStore.lstConvenios.length > 0) {
    entitiesStore.lstConvenios.map((v: ConvenioEntidad) => {
      if (!v.fecha) {
        okStep3_1 = false;
      }

      if (v.dias_credito < 0) {
        okStep3_1 = false;
      }

      if (
        v.email_soporte &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_1 = false;
      }
    });
  }

  let okStep3_2 = true;
  if (entitiesStore.lstTarifas.length > 0) {
    entitiesStore.lstTarifas.map((v: TarifaEntidad) => {
      if (!v.fecha) {
        okStep3_2 = false;
      }

      if (!v.codigo) {
        okStep3_2 = false;
      }

      if (
        v.email_soporte &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_2 = false;
      }

      if (v.tarifa < 0) {
        okStep3_2 = false;
      }
    });
  }

  let okStep4 = true;
  if (entitiesStore.lstInformacionBancaria.length > 0) {
    entitiesStore.lstInformacionBancaria.map((v: InformacionBancaria) => {
      if (!v.nro_cuenta) {
        okStep4 = false;
      }

      if (!v.cci) {
        okStep4 = false;
      }

      if (!v.id_banco) {
        okStep4 = false;
      }

      if (!v.id_coins) {
        okStep4 = false;
      }

      if (isClienteInternacional()) {
        if (!v.nro_swift) {
          okStep4 = false;
        }

        if (!v.id_intermediario) {
          okStep4 = false;
        }

        if (!v.nro_cuenta_intermediario) {
          okStep4 = false;
        }
      }
    });
  }

  if (!okStep1) {
    entitiesStore.isStep1Valid = !entitiesStore.isStep1Valid;
  } else if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid = !entitiesStore.isStep2Valid;
  } else if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid = !entitiesStore.isStep3Valid;
  } else if (!okStep4) {
    entitiesStore.isStep4Valid = !entitiesStore.isStep4Valid;
  } else {
    appStore.spiner = true;
    await entitiesStore.actualizarCliente();
    appStore.spiner = false;
  }
}
function isProveedorInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v: TipoTransaccion) => {
      return (
        v.codigo == "02" && v.id == entitiesStore.proveedor.id_tipotransaccion
      );
    },
  );

  return val;
}
function isShipper() {
  const val = appStore.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor && item == "SHIPPER"
    );
  });

  return val;
}
function isNaviera() {
  const val = appStore.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor && item == "NAVIERA"
    );
  });

  return val;
}
function isAlmacen() {
  const val = appStore.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor && item == "ALMACEN"
    );
  });

  return val;
}
async function registrarProveedor() {
  entitiesStore.isStep4Valid = true;

  let okStep4 = true;
  if (entitiesStore.lstInformacionBancaria.length > 0) {
    entitiesStore.lstInformacionBancaria.map((v: InformacionBancaria) => {
      if (!v.nro_cuenta) {
        okStep4 = false;
      }

      if (!v.cci) {
        okStep4 = false;
      }

      if (!v.id_banco) {
        okStep4 = false;
      }

      if (!v.id_coins) {
        okStep4 = false;
      }

      if (isProveedorInternacional()) {
        if (!v.nro_swift) {
          okStep4 = false;
        }

        if (!v.id_intermediario) {
          okStep4 = false;
        }

        if (!v.nro_cuenta_intermediario) {
          okStep4 = false;
        }
      }
    });
  }

  if (!okStep4) {
    entitiesStore.isStep4Valid = !entitiesStore.isStep4Valid;
  } else {
    appStore.spiner = true;
    await entitiesStore.guardarProveedor();
    appStore.spiner = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function modificarProveedor() {
  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;

  let okStep1 = true;
  if (entitiesStore.proveedor) {
    if (!entitiesStore.proveedor.nombrecompleto) {
      okStep1 = false;
    }

    if (!entitiesStore.proveedor.id_tipoproveedor) {
      okStep1 = false;
    } else if (isShipper() && !entitiesStore.proveedor.producto) {
      okStep1 = false;
    }

    if (!entitiesStore.proveedor.id_tipotransaccion) {
      okStep1 = false;
    }

    if (!entitiesStore.proveedor.id_pais) {
      okStep1 = false;
    }

    if (
      entitiesStore.proveedor.emailaddress &&
      !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        entitiesStore.proveedor.emailaddress,
      )
    ) {
      okStep1 = false;
    }

    if (isNaviera() && entitiesStore.proveedor.dias_sobreestadia < 0) {
      okStep1 = false;
    }

    if (isAlmacen() && entitiesStore.proveedor.dias_almacenaje < 0) {
      okStep1 = false;
    }
  }

  let okStep2_1 = true;
  if (entitiesStore.lstTelefonos.length > 0) {
    entitiesStore.lstTelefonos.map((v: TelefonoEntidad) => {
      if (!v.id_tipotelefono) {
        okStep2_1 = false;
      }

      if (!v.telefono) {
        okStep2_1 = false;
      }
    });
  }

  let okStep2_2 = true;
  if (entitiesStore.lstContactos.length > 0) {
    entitiesStore.lstContactos.map((v: ContactoEntidad) => {
      if (!v.nombre) {
        okStep2_2 = false;
      }

      if (!v.id_tipotelefono) {
        okStep2_2 = false;
      }

      if (!v.telefono) {
        okStep2_2 = false;
      }
    });
  }

  let okStep3_1 = true;
  if (entitiesStore.lstConvenios.length > 0) {
    entitiesStore.lstConvenios.map((v: ConvenioEntidad) => {
      if (!v.fecha) {
        okStep3_1 = false;
      }

      if (v.dias_credito < 0) {
        okStep3_1 = false;
      }

      if (
        v.email_soporte &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_1 = false;
      }
    });
  }

  let okStep3_2 = true;
  if (entitiesStore.lstTarifas.length > 0) {
    entitiesStore.lstTarifas.map((v: TarifaEntidad) => {
      if (!v.fecha) {
        okStep3_2 = false;
      }

      if (!v.codigo) {
        okStep3_2 = false;
      }

      if (
        v.email_soporte &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_2 = false;
      }

      if (v.tarifa < 0) {
        okStep3_2 = false;
      }
    });
  }

  let okStep4 = true;
  if (entitiesStore.lstInformacionBancaria.length > 0) {
    entitiesStore.lstInformacionBancaria.map((v: InformacionBancaria) => {
      if (!v.nro_cuenta) {
        okStep4 = false;
      }

      if (!v.cci) {
        okStep4 = false;
      }

      if (!v.id_banco) {
        okStep4 = false;
      }

      if (!v.id_coins) {
        okStep4 = false;
      }

      if (isProveedorInternacional()) {
        if (!v.nro_swift) {
          okStep4 = false;
        }

        if (!v.id_intermediario) {
          okStep4 = false;
        }

        if (!v.nro_cuenta_intermediario) {
          okStep4 = false;
        }
      }
    });
  }

  if (!okStep1) {
    entitiesStore.isStep1Valid = !entitiesStore.isStep1Valid;
  } else if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid = !entitiesStore.isStep2Valid;
  } else if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid = !entitiesStore.isStep3Valid;
  } else if (!okStep4) {
    entitiesStore.isStep4Valid = !entitiesStore.isStep4Valid;
  } else {
    appStore.spiner = true;
    await entitiesStore.actualizarProveedor();
    appStore.spiner = false;
  }
}
function abrirModalPilotoAutomatico() {
  dialogPilotoAutomatico.value = true;
}

watch(idRole, async () => {
  lstDatosTarifa.value = [];
  if (idRole.value.length == 0) {
    return;
  }
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "entities/obtener_datos_tarifa",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      id_modality: pricingStore.datosPrincipales.idsentido,
      id_roles: idRole.value.join(","),
      id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0]
        .id_branch,
    },
  };

  await axios<ApiResponse<{ datos: DatoTarifaProveedor[] }>>(config).then(
    (res) => {
      const data = res.data;
      lstDatosTarifa.value = data.data.datos.map((v) => {
        return { ...v, selected: v.proveedorprincipalflag };
      });
    },
  );
});
</script>

<template>
  <div id="inspire">
    <v-navigation-drawer
      width="320"
      v-model="appStore.drawer"
      v-if="mostrarBtnMenu"
    >
      <ListMenu />
    </v-navigation-drawer>

    <v-app-bar elevation="0" v-if="mostrarBtnMenu" :color="colorBar()">
      <v-app-bar-nav-icon
        aria-label="Abrir menú"
        v-if="mostrarBtnMenu"
        @click="appStore.drawer = !appStore.drawer"
      />

      <v-toolbar-title class="flex-0-1">
        {{ appStore.mainTitle }}
      </v-toolbar-title>

      <v-spacer />

      <v-chip
        v-if="operadorNombre"
        color="white"
        variant="flat"
        class="mx-4 text-primary"
      >
        <v-icon start color="primary"> mdi-account </v-icon>
        VENDEDOR: {{ operadorNombre }}
      </v-chip>

      <v-spacer />

      <b v-if="route.params.id_house" class="mr-10 text-headline-large">
        PROFIT PR:
        {{
          (
            (appStore.totalTotalIngresos ? appStore.totalTotalIngresos : 0) -
            (appStore.totalTotalEgresos ? appStore.totalTotalEgresos : 0)
          ).toFixed(2)
        }}
        USD
      </b>

      <b v-if="route.params.id_house" class="mr-10 text-headline-large">
        / OP:
        {{
          (
            (appStore.totalTotalIngresosOp
              ? appStore.totalTotalIngresosOp
              : 0) -
            (appStore.totalTotalEgresosOp ? appStore.totalTotalEgresosOp : 0)
          ).toFixed(2)
        }}
        USD
      </b>
      <!-- QUOTE -->
      <v-spacer />

      <!-- nuevo -->
      <label class="monto" v-if="getNameUrl() == 'newQuote'">
        Profit / Ganancia
        {{ currencyFormat(pricingStore.totalVenta - pricingStore.totalCosto) }}
      </label>

      <v-spacer
        v-if="getNameUrl() == 'newQuote' && !!pricingStore.btnRegistrar"
      />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="
          getNameUrl() == 'newQuote' &&
          !!pricingStore.btnRegistrar &&
          can('newQuote', 'NUEVO')
        "
        @click="guardarCotizacion()"
        :disabled="pricingStore.bloquearBtnImprimir"
      >
        GUARDAR
      </v-btn>
      <!-- editar -->
      <label class="monto" v-if="getNameUrl() == 'editQuote'">
        Profit / Ganancia
        {{ currencyFormat(pricingStore.totalVenta - pricingStore.totalCosto) }}
      </label>
      <v-spacer v-if="getNameUrl() == 'editQuote'" />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'editQuote' && can('lstQuote', 'MODIFICAR')"
        @click="editarCotizacion()"
      >
        <v-icon size="small" class="mx-1"> mdi-content-save-all </v-icon>
        GUARDAR
      </v-btn>
      <!-- ver -->
      <label class="monto" v-if="['verQuote', 'VerCotizacionCalculadora'].includes(getNameUrl())">
        Profit / Ganancia
        {{ currencyFormat(pricingStore.totalVenta - pricingStore.totalCosto) }}
      </label>
      <v-spacer v-if="['verQuote', 'VerCotizacionCalculadora'].includes(getNameUrl())" />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'verQuote' && can('lstQuote', 'MODIFICAR')"
        @click="handleEditarQuote()"
      >
        <v-icon size="small" class="mx-1"> mdi-pencil </v-icon> EDITAR
      </v-btn>
      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'verQuote'"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirCorreo()"
      >
        <v-icon class="mx-1" size="small"> mdi-email-fast </v-icon>
        SOLICITAR TARIFA
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'editQuote'"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirCorreo()"
      >
        <v-icon class="mx-1" size="small"> mdi-email-fast </v-icon>
        SOLICITAR TARIFA
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'editQuote' || getNameUrl() == 'verQuote'"
        class="mx-1"
        color="#FFD600"
        @click="abrirCarpeta(pricingStore.datosPrincipales.url_folderonedrive!)"
      >
        <v-icon class="mx-1" size="small"> mdi-folder </v-icon>
        ABRIR
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'verQuote' && can('lstQuote', 'COPIAR')"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirModalCopiarCotizacion()"
      >
        <v-icon class="mx-1" size="small"> mdi-content-copy </v-icon>
        COPIAR
      </v-btn>

      <!--MODULO CLIENTES-->
      <v-btn
        variant="elevated"
        v-if="
          getNameUrl() == 'nuevoClientes' &&
          entitiesStore.showBtnSaveFlag &&
          can('listClientes', 'NUEVO')
        "
        color="success"
        class="ml-auto"
        @click="registrarCliente"
      >
        Guardar CLIENTE
      </v-btn>

      <!--MODULO PROVEEDORES-->
      <v-btn
        variant="elevated"
        v-if="
          getNameUrl() == 'nuevoProveedor' &&
          entitiesStore.showBtnSaveFlag &&
          can('listProveedor', 'NUEVO')
        "
        color="success"
        class="ml-auto"
        @click="registrarProveedor"
        :disabled="entitiesStore.disabledBtnSave"
      >
        Guardar Proveedor
      </v-btn>

      <label class="monto" v-if="routeAduana.includes(getNameUrl())">
        {{
          currencyFormat(
            (aduanaStore.totalVenta ? aduanaStore.totalVenta : 0) -
              (aduanaStore.totalCosto ? aduanaStore.totalCosto : 0),
          )
        }}
      </label>

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="
          getNameUrl() == 'EditarAduana' &&
          can('lstQuoteAduanaAduana', 'MODIFICAR')
        "
        @click="editarCotizacionAduana()"
        size="small"
      >
        <v-icon class="mx-1"> mdi-save </v-icon> GUARDAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="
          getNameUrl() == 'VerAduana' &&
          aduanaStore.mostrarBtnActualizarFlag &&
          can('lstQuoteAduanaAduana', 'MODIFICAR')
        "
        @click="ira('EditarAduana', route.params.id)"
      >
        <v-icon>mdi-account-tie-hat</v-icon> EDITAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="#009688"
        @click="abrirModalPilotoAutomatico()"
        v-if="getNameUrl() == 'editQuote' && can('lstQuote', 'MODIFICAR')"
      >
        <v-icon class="mx-1"> mdi-send </v-icon>AUTOMATICO
      </v-btn>

      <v-btn
        variant="elevated"
        color="info"
        @click="ira('EditAccountPaysCxC', route.params.id)"
        v-if="getNameUrl() == 'viewAccountPaysCxC'"
      >
        <v-icon class="mx-1"> mdi-pencil </v-icon> IR EDITAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="info"
        @click="ira('EditAccountPays', route.params.id)"
        v-if="getNameUrl() == 'viewAccountPays'"
      >
        <v-icon class="mx-1"> mdi-pencil </v-icon> IR EDITAR
      </v-btn>
      <v-spacer />
      <span
        id="house-header-actions"
        class="d-flex align-center ga-2 mr-2"
      />
      <PlanStatusBadge />
      <BotonesHeader />
      <BtnIrAlListado />
    </v-app-bar>

    <v-main class="main">
      <div class="main-content">
        <router-view />
      </div>
    </v-main>

    <div v-if="appStore.dialogProcessing" class="dialogOverlay" />
    <div v-if="appStore.dialogProcessing" class="dialogProcessing">
      <!-- <div class="dialogOverlay"></div> -->
      <LoadingComponent />
    </div>

    <!-- Modal de autenticación admin para editar cotizaciones aprobadas -->
    <v-dialog v-model="dialogAdminAuth" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Autenticación Requerida
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">
            Esta cotización está <strong>APROBADA</strong>. Ingrese las
            credenciales de administrador para continuar.
          </p>
          <v-text-field
            v-model="adminUser"
            label="Usuario o Email"
            prepend-icon="mdi-account"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="adminPassword"
            label="Contraseña"
            prepend-icon="mdi-lock"
            :type="showAdminPassword ? 'text' : 'password'"
            :append-inner-icon="showAdminPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showAdminPassword = !showAdminPassword"
            variant="outlined"
            density="compact"
          />
          <v-alert
            v-if="adminAuthError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ adminAuthError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="cerrarDialogAdminAuth()">
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            :loading="adminAuthLoading"
            @click="validarAdminAuth()"
          >
            Ingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogProveedor" width="35%">
      <v-card>
        <v-card-title> Seleccionar proveedor: </v-card-title>
        <v-card-text>
          <v-autocomplete
            multiple
            :items="appStore.itemsDataRoleList"
            chips
            item-value="id"
            item-title="name"
            persistent
            variant="outlined"
            label="Tipo Proveedor"
            v-model="idRole"
            :loading="appStore.itemsDataRoleList.length == 0"
          />
          <v-table>
            <thead>
              <tr>
                <th />
                <th>Contacto</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(dato, index) in lstDatosTarifa" :key="index">
                <td>
                  <v-checkbox v-model="dato.selected" />
                </td>
                <td>{{ dato.contacto }}</td>
                <td>{{ dato.email }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            :loading="providerQuoteEmailTemplateStore.loading"
            @click="abrirCorreoSend('es')"
          >
            Enviar en español
          </v-btn>
          <v-btn
            color="success"
            :loading="providerQuoteEmailTemplateStore.loading"
            @click="abrirCorreoSend('en')"
          >
            Enviar en inglés
          </v-btn>
          <v-btn color="error" @click="dialogProveedor = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogPilotoAutomatico"
      scrollable
      persistent
      max-width="75%"
    >
      <v-card v-if="dialogPilotoAutomatico">
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          COTIZACIÓN PILOTO AUTOMÁTICO
          <v-spacer />
          <v-btn
            variant="text"
            color="info"
            icon
            @click="dialogPilotoAutomatico = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <CotizacionPilotoAutomatico @close="dialogPilotoAutomatico = false" />
        </v-card-text>
        <!-- <v-card-actions> </v-card-actions> -->
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogFiles" max-width="40%">
      <v-card>
        <v-card-title> Archivos a Copiar </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFiles"
            :items="listadoFilesDrive"
            show-select
            v-model="pricingStore.selectedFile"
            item-value="id"
            return-object
          >
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                icon
                size="small"
                :color="getColorIcon(item)"
                :href="item.webUrl"
                target="_blank"
              >
                <v-icon>{{ getIconFile(item) }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn size="small" color="success" @click="copiarCotizacion">
            Continuar
          </v-btn>
          <v-btn size="small" color="error" @click="dialogFiles = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      v-model="snackbar"
      :class="['socket-notification-snackbar', `socket-notification--${snackbarColor}`]"
      :timeout="5000"
      location="bottom center"
    >
      <div class="socket-notification" role="status" aria-live="polite">
        <div class="socket-notification__icon">
          <v-icon>{{ snackbarIcon }}</v-icon>
        </div>
        <div class="socket-notification__divider" />
        <div class="socket-notification__text">
          <div class="socket-notification__title">{{ tituloMensaje }}</div>
          <div class="socket-notification__message">{{ dataMensaje }}</div>
        </div>
        <div class="socket-notification__actions">
          <v-btn
            class="socket-notification__primary-action"
            variant="flat"
            @click="descartarAvisoSocket"
          >
            Entendido
          </v-btn>
          <v-btn
            class="socket-notification__close"
            icon="mdi-close"
            variant="text"
            aria-label="Cerrar notificación"
            @click="descartarAvisoSocket"
          />
        </div>
      </div>
    </v-snackbar>

    <v-dialog persistent max-width="480" v-model="dialogCambiarFecha">
      <v-card class="rounded-lg elevation-4">
        <!-- Cabecera profesional con color y título claro -->
        <v-card-title
          class="text-headline-medium bg-primary text-white py-3 px-4 d-flex align-center"
        >
          <v-icon start class="mr-2"> mdi-calendar-clock </v-icon>
          <span class="font-weight-bold">Actualizar Vigencia de Flete</span>
        </v-card-title>

        <!-- Cuerpo del diálogo -->
        <v-card-text class="pt-4 pb-2">
          <div class="text-body-medium mb-4">
            Selecciona la nueva fecha límite de vigencia. Esto actualizará los
            cálculos en las nuevas cotizaciones, calculadora y bot de whatsapp.
          </div>

          <v-form ref="formVigencia">
            <FormatFecha
              outlined
              dense
              label="Nueva Fecha de Vigencia"
              v-model="fechaVigencia"
              :rules="[(v) => !!fechaVigencia || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>

        <v-divider />

        <!-- Acciones con botones bien diferenciados -->
        <v-card-actions class="px-4 py-3 justify-end">
          <v-btn
            color="grey-darken-1"
            variant="text"
            class="text-none font-weight-medium"
            @click="dialogCambiarFecha = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            class="text-none font-weight-bold px-4 ml-2"
            elevation="1"
            @click="guardarNuevaFecha"
          >
            <v-icon start size="18"> mdi-check </v-icon>
            Actualizar Fecha
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogSeleccionDistrito" max-width="560px" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-headline-medium font-weight-bold">
          Seleccionar distrito
        </v-card-title>
        <v-card-text>
          <p>Selecciona el distrito para calcular la tarifa de transporte.</p>
          <v-autocomplete
            v-model="pricingStore.datosPrincipales.id_town"
            :items="townStore.lstTownPricing"
            item-title="nombrecompleto"
            item-value="id"
            density="compact"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="!pricingStore.datosPrincipales.id_town"
            @click="confirmarSeleccionDistrito"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <QuoteNotificationPopup :socket="socket" />
    <GeneratedQuoteDialog :socket="socket" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  background: #f4f7fa;
}
.main-content {
  padding: 10px;
}
.perdida {
  background: red !important;
  color: white !important;
}
.ganancia {
  background: green !important;
  color: white !important;
}
.v-stepper v-stepper--is-booted v-stepper--non-linear v-sheet theme--light {
  color: white !important;
}
.monto {
  font-size: 2rem;
}
.dialogOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99960;
}
.dialogProcessing {
  min-height: 50%;
  width: 50%;
  margin-left: auto;
  margin-right: auto;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  z-index: 99999;
  text-align: center;
}
.wrap-text-button {
  white-space: normal !important;
  line-height: 1.2;
  text-align: center;
  padding: 8px 16px; /* ajustable */
}
</style>

<style>
.freight-alert.swal2-popup {
  width: min(620px, calc(100vw - 32px));
  padding: 18px 22px 22px;
  border-radius: 22px;
  color: #0a1f44;
}
.freight-alert .swal2-icon {
  width: 92px;
  height: 64px;
  margin: 4px auto 6px;
  border: 0;
  color: #0b74e5;
}
.freight-alert .swal2-icon.swal2-error {
  color: #d8392b;
}
.freight-alert .swal2-icon .swal2-icon-content,
.freight-alert .swal2-icon svg {
  width: 100%;
  height: 100%;
}
.freight-alert-title.swal2-title {
  padding: 0;
  color: #0a1f44;
  font-size: clamp(1.6rem, 6vw, 2.3rem);
  font-weight: 900;
}
.freight-alert-content.swal2-html-container {
  margin: 8px 0 0;
  overflow: visible;
  color: #0a1f44;
}
.freight-alert-heading {
  padding: 6px 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #0b5fd6 0%, #0846a8 100%);
  color: white;
  font-size: clamp(1.5rem, 6vw, 2.1rem);
  font-weight: 900;
  line-height: 1.15;
}
.freight-alert .swal2-icon.swal2-error ~ .swal2-html-container .freight-alert-heading {
  background: #d8392b;
}
.freight-alert-deadline {
  margin-top: 12px;
  padding: 8px;
  border-radius: 16px;
  background: #dcebfd;
  color: #0a1f44;
  font-size: clamp(1.3rem, 5vw, 1.8rem);
  font-weight: 800;
}
.freight-alert-deadline-value {
  color: #0b74e5;
}
.freight-alert-date {
  margin-top: 8px;
  color: #4a5670;
  font-size: 1rem;
}
/* SweetAlert pone display en línea a las acciones y botones: se fuerza el layout */
.freight-alert-actions.swal2-actions {
  display: grid !important;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  width: 100%;
  margin: 18px 0 0;
}
.freight-alert-continue.swal2-cancel {
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 4px 6px 4px 14px !important;
}
.freight-alert-actions .swal2-styled {
  display: inline-flex !important;
  flex-wrap: nowrap;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  margin: 0;
  padding: 6px 10px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.85rem;
}
.freight-alert-update.swal2-confirm {
  background: linear-gradient(180deg, #43b02a 0%, #2f9a1f 100%);
}
.freight-alert-update .mdi {
  font-size: 1.3rem;
}
.freight-alert-config.swal2-deny {
  background: #dcebfd;
  color: #0a1f44;
}
.freight-alert-continue.swal2-cancel {
  background: #e9edf3;
  color: #0a1f44;
}
.freight-alert-actions .swal2-styled:disabled {
  opacity: 1;
  cursor: not-allowed;
}
.freight-alert-countdown {
  --freight-progress: 100%;
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  min-width: 40px;
  height: 40px;
  box-sizing: border-box;
  place-items: center;
  border: 4px solid transparent;
  border-radius: 50%;
  background: linear-gradient(white, white) padding-box,
    conic-gradient(#0b5fd6 var(--freight-progress), #cfd8e6 0) border-box;
  color: #0b5fd6;
  font-size: 0.85rem;
  font-weight: 900;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .freight-alert-actions.swal2-actions {
    grid-template-columns: 1fr;
  }
  .freight-alert-actions .swal2-styled {
    white-space: normal;
  }
}
.socket-notification-snackbar .v-snackbar__wrapper,
.socket-notification-snackbar.v-snackbar__wrapper {
  width: min(560px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  padding: 0;
  border: 2px solid #b8cce0 !important;
  border-radius: 18px;
  background: #fff !important;
  color: #17324d !important;
  box-shadow: 0 14px 34px rgba(14, 43, 74, 0.3) !important;
}
.socket-notification-snackbar .v-snackbar__content {
  width: 100%;
  padding: 0;
}
.socket-notification {
  display: flex;
  min-height: 76px;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #d5e1ed;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(14, 43, 74, 0.24);
}
.socket-notification__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 50%;
}
.socket-notification__icon .v-icon {
  font-size: 30px;
}
.socket-notification__divider {
  width: 1px;
  height: 42px;
  flex: 0 0 1px;
  background: #d8e2eb;
}
.socket-notification__text {
  min-width: 0;
  flex: 1;
}
.socket-notification__title {
  color: #17324d;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
}
.socket-notification__message {
  margin-top: 2px;
  color: #4a5d70;
  font-size: 0.84rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.socket-notification__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}
.socket-notification__primary-action {
  min-width: 0;
  border-radius: 20px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.socket-notification__close {
  color: #687889;
}
.socket-notification--operation .socket-notification__icon {
  background: #edf4ff;
  color: #1769d2;
}
.socket-notification--operation .socket-notification__primary-action {
  background: #1769d2;
}
.socket-notification--success .socket-notification__icon {
  background: #e8f7ed;
  color: #0c8b49;
}
.socket-notification--success .socket-notification__primary-action {
  background: #0c8b49;
}
.socket-notification--info .socket-notification__icon {
  background: #e8f2ff;
  color: #1769d2;
}
.socket-notification--info .socket-notification__primary-action {
  background: #1769d2;
}
.socket-notification__primary-action:hover {
  filter: brightness(0.94);
}
@media (max-width: 600px) {
  .socket-notification {
    gap: 9px;
    padding: 10px;
  }
  .socket-notification__icon {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
  }
  .socket-notification__icon .v-icon {
    font-size: 25px;
  }
  .socket-notification__actions {
    gap: 0;
  }
  .socket-notification__primary-action {
    padding-inline: 8px;
  }
}
/* Oculta en móviles (menos de 992px) */
@media (max-width: 991.98px) {
  .ocultarMovil {
    display: none;
  }
}
</style>
