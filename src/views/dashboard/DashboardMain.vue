<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import type { SweetAlertIcon } from "sweetalert2";
import moment from "moment";
import { io } from "socket.io-client";
import axios from "@/api/http";
import ListMenu from "@/components/ListMenu.vue";
import CotizacionPilotoAutomatico from "@/components/folderPricing/CotizacionPilotoAutomatico.vue";
import FormatFecha from "../../components/comun/FormatFecha.vue";
import LoadingComponent from "../../components/comun/LoadingComponent.vue";
import BtnIrAlListado from "../../components/comun/BtnIrAlListado.vue";
import BotonesHeader from "../../components/comun/BotonesHeader.vue";
import PlanStatusBadge from "../../components/SubscriptionPackages/PlanStatusBadge.vue";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useTownStore } from "@/stores/town";
import { validateCost } from "@/utils/cotizacion";
import type { ApiResponse } from "@/types/api";
import type {
  ArchivoDrive,
  DatoTarifaProveedor,
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
  InformacionBancaria,
  Operador,
  RolProveedor,
  TarifaEntidad,
  TelefonoEntidad,
  TipoTransaccion,
} from "@/types/entidades";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const townStore = useTownStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const socket = io(import.meta.env.VITE_URL_MAIN, {
  transports: ["polling"],
});
socket.on("connect_error", (err) => {
  console.error("Error al conectar con Socket.IO:", err);
});

const dialogSeleccionDistrito = ref(false);
const dialogCambiarFecha = ref(false);
const fechaVigencia = ref<string | null>("");
const snackbar = ref(false);
const dataMensaje = ref("");
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
const formVigencia = useTemplateRef("formVigencia");

onMounted(async () => {
  const urlPricing = ["newQuote", "verQuote", "editQuote"];
  socket.emit(
    "join-empresa",
    JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
  );

  socket.on("nueva-operacion", (data: { mensaje: string }) => {
    if (!urlPricing.includes(route.name as string)) {
      dataMensaje.value = data.mensaje;
      snackbar.value = true;
    }
  });
  abrirSwalConfigFlete();
  nextTick(() => {
    rootStore.state.drawer = false;
  });
});
onBeforeMount(() => {
  mostrarBtnMenu.value = !JSON.parse(sessionStorage.getItem("dataBranch") as string)[0]
    .esnuevoflag;
  rootStore.state.drawer = mostrarBtnMenu.value;
});

const itemsOperadorList = computed<Operador[]>(() => rootStore.state.itemsOperadorList);
const listadoFilesDrive = computed<ArchivoDrive[]>(() => rootStore.state.pricing.listadoFilesDrive);
const operadorNombre = computed(() => {
  const isHousePage =
    route.name &&
    ((route.name as string).includes("House") ||
      (route.name as string).includes("controlHouse"));

  if (!isHousePage) {
    return "";
  }

  if (rootStore.state.dataHouse_operador) {
    return rootStore.state.dataHouse_operador;
  }

  const operadorId =
    rootStore.state.houses && rootStore.state.houses.house
      ? rootStore.state.houses.house.id_operador
      : null;

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
    await rootStore.dispatch("actualizarFechaVigencia", fechaVigencia.value);
    dialogCambiarFecha.value = false;
  }
}
function abrirSwalConfigFlete() {
  const routesHome = ["Home", "Main"];
  const positions = ["01", "02"];
  const dataBranch: SucursalSesion | undefined = JSON.parse(sessionStorage.getItem("dataBranch") as string)?.[0];
  const dataUser: UsuarioSesion | undefined = JSON.parse(sessionStorage.getItem("dataUser") as string)?.[0];
  const position = dataUser?.position_code?.[0];
  if (!dataBranch || !position) return;

  const { tienefleteactivo, dias_restantes, vigencia } = dataBranch;
  const routeHome = route.name as string;

  if (
    !tienefleteactivo &&
    routesHome.includes(routeHome) &&
    positions.includes(position)
  ) {
    // 1. Textos actualizados enfocados en el riesgo de cálculos incorrectos
    let tituloAlerta = "";
    let mensajeAlerta = "";
    let iconoAlerta: SweetAlertIcon = "warning";

    if (dias_restantes < 0) {
      const diasVencidos = Math.abs(dias_restantes);
      tituloAlerta = "¡ATENCIÓN: FLETE VENCIDO!";
      mensajeAlerta = `Su flete venció hace <b>${
        dias_restantes === -1 ? "1 día" : `${diasVencidos} días`
      }</b>.<br>Debe actualizarlo urgentemente; de lo contrario, <b>los cálculos saldrán incorrectos</b> en las cotizaciones.<br><br><span style="color: #e74c3c; font-weight: bold;">Fecha de vigencia: ${vigencia}</span>`;
      iconoAlerta = "error";
    } else if (dias_restantes === 0) {
      tituloAlerta = "¡FLETE VENCE HOY!";
      mensajeAlerta = `Su flete expira <b>hoy mismo</b>.<br>Actualice los costos para evitar que <b>los cálculos saldrán incorrectos</b> en las cotizaciones.<br><br><span style="color: #f39c12; font-weight: bold;">Fecha de vigencia: ${vigencia}</span>`;
      iconoAlerta = "warning";
    } else {
      tituloAlerta = "¡AVISO DE VIGENCIA DE FLETE!";
      mensajeAlerta = `Su flete está próximo a vencer en <b>${dias_restantes} ${
        dias_restantes === 1 ? "día" : "días"
      }</b>.<br>Manténgalo al día para asegurar que <b>los cálculos no salgan incorrectos</b> en las cotizaciones.<br><br><span style="color: #f39c12; font-weight: bold;">Fecha de vigencia: ${vigencia}</span>`;
      iconoAlerta = "warning";
    }

    // 2. Alerta con 3 botones con iconos y bloqueo total de 5 segundos
    Swal.fire({
      icon: iconoAlerta,
      title: tituloAlerta,
      html: mensajeAlerta,
      allowOutsideClick: false,
      allowEscapeKey: false,

      // Botón principal (Ir a Configurar Flete)
      confirmButtonText: "Espere (5s)...",
      confirmButtonColor: "#00a65a",

      // Tercer botón (Actualizar Fecha)
      showDenyButton: true,
      denyButtonText: '<i class="fa fa-calendar-alt"></i> Actualizar Fecha',
      denyButtonColor: "#3085d6",

      // Botón secundario (Cancelar)
      showCancelButton: true,
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',

      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton()!;
        const denyBtn = Swal.getDenyButton();
        const cancelBtn = Swal.getCancelButton();

        // Deshabilitamos los 3 botones al inicio
        confirmBtn.disabled = true;
        confirmBtn.style.backgroundColor = "#95a5a6";

        if (denyBtn) {
          denyBtn.disabled = true;
          denyBtn.style.backgroundColor = "#95a5a6";
        }

        if (cancelBtn) {
          cancelBtn.disabled = true;
        }

        let timerSecs = 5;
        confirmBtn.innerHTML = `Por favor lea (${timerSecs}s)`;

        const interval = setInterval(() => {
          timerSecs--;
          if (timerSecs > 0) {
            confirmBtn.innerHTML = `Por favor lea (${timerSecs}s)`;
          } else {
            clearInterval(interval);

            // Habilitamos y restauramos los botones con sus respectivos iconos al pasar los 5 segundos
            confirmBtn.disabled = false;
            confirmBtn.innerHTML =
              '<i class="fa fa-cog"></i> Ir a Configurar Flete';
            confirmBtn.style.backgroundColor = "#00a65a";

            if (denyBtn) {
              denyBtn.disabled = false;
              denyBtn.innerHTML =
                '<i class="fa fa-calendar-alt"></i> Actualizar Fecha';
              denyBtn.style.backgroundColor = "#3085d6";
            }

            if (cancelBtn) {
              cancelBtn.disabled = false;
            }
          }
        }, 1000);
      },
    }).then((res) => {
      if (res.isConfirmed) {
        // Acción para "Ir a Configurar Flete"
        router.push({
          name: "ServiciosCostosFijosLCL",
        });
      } else if (res.isDenied) {
        dialogCambiarFecha.value = true;
      }
    });
  }
}
async function guardarCotizacion() {
  const validacion = validarRegistro();
  if (!!validacion) {
    rootStore.state.spiner = true;
    await rootStore.dispatch("registrarQuote", { fullflag: true }).catch((err: unknown) => {
      console.error("registrarQuote", err);
    });

    rootStore.state.spiner = false;
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: rootStore.state.pricing.mensaje,
      confirmButtonText: "Ir a ver",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({
          name: "verQuote",
          params: { id: rootStore.state.pricing.id },
        });
      }
    });
    const id_branch = JSON.parse(sessionStorage.getItem("dataUser") as string)[0]
      .id_branch;
    const branchCreacion = [1, 2];
    if (branchCreacion.includes(id_branch)) {
      const urlGenerada = await rootStore.dispatch("crearCarpetaOneDrive", {
        nro_quote: rootStore.state.pricing.nro_quote,
        nombre: rootStore.state.pricing.datosPrincipales.nombre,
      });

      if (urlGenerada) {
        await rootStore.dispatch("actualizarURLEnElQuote", {
          id: rootStore.state.pricing.id,
          url: urlGenerada,
        }).catch((e: unknown) => {
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
  val = !rootStore.state.pricing.opcionCostos.some(
    (v: OpcionCosto) =>
      !v.date_end || !v.tiempo_transito || !isDateValid(v.date_end),
  );

  // // -----------------------------------------------------
  if (val) {
    rootStore.state.spiner = false;
    await rootStore.dispatch("updateQuote");

    const destino = {
      name: "verQuote",
      params: {
        id: rootStore.state.pricing.id,
        step: rootStore.state.pricing.step
          ? rootStore.state.pricing.step
          : 1,
      },
    };
    if (
      router.resolve(destino).fullPath !==
      route.fullPath
    ) {
      await router.push(destino);
    }
    rootStore.state.spiner = false;
  } else {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "Existe una o más Fechas de validez y/o tiempos en tránsito, INCOMPLETOS. Verifique.",
    });
    rootStore.state.pricing.tab = 2;
  }
}
async function editarCotizacionAduana() {
  // let val = await this.validarCosto();
  let val = true;
  val = !rootStore.state.aduana.opcionCostos.some(
    (v: OpcionCosto) =>
      !v.date_end || !v.tiempo_transito || !isDateValid(v.date_end),
  );

  // // -----------------------------------------------------
  if (val) {
    rootStore.state.spiner = false;
    await rootStore.dispatch("actualizarQuoteAduana");

    router.push({
      name: "VerAduana",
      params: {
        id: rootStore.state.aduana.id,
        step: rootStore.state.aduana.step
          ? rootStore.state.aduana.step
          : 1,
      },
    });
    rootStore.state.spiner = false;
  } else {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "Existe una o más Fechas de validez y/o tiempos en tránsito, INCOMPLETOS. Verifique.",
    });
    rootStore.state.aduana.tab = 2;
  }
}
async function abrirCorreo() {
  const codeLCL = [9017];
  const codeFCL = [9017, 9001, 9002];
  const codeAereo = [9017, 9024];
  idRole.value = [];
  dialogProveedor.value = true;
  await rootStore.dispatch("_getRole");
  const code = rootStore.state.pricing.listShipment.find(
    (v: TipoCarga) => v.id == rootStore.state.pricing.datosPrincipales.idtipocarga,
  ).code;
  switch (code) {
    case "LCL":
      idRole.value = rootStore.state.itemsDataRoleList
        .filter((v: RolProveedor) => codeLCL.includes(v.code))
        .map((v: RolProveedor) => v.id);
      break;
    case "FCL":
      idRole.value = rootStore.state.itemsDataRoleList
        .filter((v: RolProveedor) => codeFCL.includes(v.code))
        .map((v: RolProveedor) => v.id);
      break;
    case "Aéreo":
      idRole.value = rootStore.state.itemsDataRoleList
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
async function abrirCorreoSend() {
  const valIncoterms = ["EXW", "FCA", "FOB"];
  const selected = lstDatosTarifa.value.filter((v) => v.selected);
  const nameCliente = rootStore.state.pricing.dataCliente.nombrecompleto;
  const to = selected
    .map((v) => v.email)
    .filter((e) => e)
    .join(";");

  const incoterms = rootStore.state.pricing.listIncoterms.find(
    (v: Incoterm) => v.id == rootStore.state.pricing.datosPrincipales.idincoterms,
  );
  let subject = ``;

  const miEmail = sessionStorage.getItem("dataUser")
    ? JSON.parse(sessionStorage.getItem("dataUser") as string)[0].correoemail
    : "";

  const origen = rootStore.state.pricing.listPortBegin.find(
    (v: Puerto) => v.id_port == rootStore.state.pricing.datosPrincipales.idorigen,
  );

  const destino = rootStore.state.pricing.listPortEnd.find(
    (v: Puerto) =>
      v.id_port == rootStore.state.pricing.datosPrincipales.iddestino,
  );
  let tablaHtml = "";

  if (!valIncoterms.includes(incoterms.name)) {
    Swal.fire({
      title: "ADVERTENCIA",
      icon: "error",
      text: "El INCOTERMS seleccionado no es compatible con el formato de correo automático. Por favor, seleccione EXW, FCA o FOB para usar esta función.",
    });
    return;
  }
  if (incoterms.name == "EXW") {
    subject = `QUOTE${rootStore.state.pricing.nro_quote} ${
      incoterms ? incoterms.name : ""
    } ${origen ? origen.name : ""} - ${destino ? destino.name : ""}  ${
      rootStore.state.pricing.datosPrincipales.peso || ""
    }KGS / ${
      rootStore.state.pricing.datosPrincipales.volumen || ""
    }M3 | CLIENTE: ${nameCliente}`;
    /* CREAR EL BOBY */
    tablaHtml = `
        <div style="font-family: Arial, sans-serif;">
          <p>Hola colega, me ayudas cotizando este embarque:</p>
          <table border="1" style="border-collapse: collapse; width: 100%; max-width: 800px;">
            <tr style="background-color: #eeeeee;">
              <th style="padding: 8px; border: 1px solid #333;"> CONCEPTO</th>
              <th style="padding: 8px; border: 1px solid #333;"> DETALLE</th>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #333;">INCOTERMS</td><td style="padding: 8px; border: 1px solid #333;">${
              incoterms ? incoterms.name : ""
            }</td></tr>
            <tr>
              <td> DIRECCIÓN:</td>
              <td> ${
                rootStore.state.pricing.datosPrincipales.direccionproveedor ||
                ""
              }</td>
              </tr>
            <tr>
              <td> PUERTO SALIDA:</td>
              <td> ${origen ? origen.name : ""}</td>
              </tr>
            <tr>
              <td> PUERTO LLEGADAA:</td>
              <td> ${destino ? destino.name : ""}</td>
              </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;"> PESO(Kgs)</td>
              <td style="padding: 8px; border: 1px solid #333;"> ${
                rootStore.state.pricing.datosPrincipales.peso || ""
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;">M3</td><td style="padding: 8px; border: 1px solid #333;">
                ${rootStore.state.pricing.datosPrincipales.volumen || ""}</td>
            </tr>
            <tr>
              <td> DESCRIPCIÓN DE LA MERCANCÍA:</td>
              <td>
                ${
                  rootStore.state.pricing.datosPrincipales.descripcioncarga ||
                  ""
                }
              </td>
            <tr>
          </table>
          <p>Saludos.</p>
        </div>
      `;
  }
  if (incoterms.name == "FCA" || incoterms.name == "FOB") {
    subject = `QUOTE${rootStore.state.pricing.nro_quote} ${
      incoterms ? incoterms.name : ""
    } ${origen ? origen.name : ""} - ${destino ? destino.name : ""}  ${
      rootStore.state.pricing.datosPrincipales.peso || ""
    }KGS / ${
      rootStore.state.pricing.datosPrincipales.volumen || ""
    }M3 | CLIENTE: ${nameCliente}`;
    /* CREAR EL BOBY */
    tablaHtml = `
        <div style="font-family: Arial, sans-serif;">
          <p>Hola colega, me ayudas cotizando este embarque:</p>
          <table border="1" style="border-collapse: collapse; width: 100%; max-width: 800px;">
            <tr style="background-color: #eeeeee;">
              <th style="padding: 8px; border: 1px solid #333;"> CONCEPTO</th>
              <th style="padding: 8px; border: 1px solid #333;"> DETALLE</th>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #333;"> INCOTERMS</td>
                <td style="padding: 8px; border: 1px solid #333;">${
                  incoterms ? incoterms.name : ""
                }</td>
            </tr>

            <tr>
              <td> PUERTO SALIDA:</td>
              <td>${origen ? origen.name : ""}</td>
              </tr>
            <tr>
              <td> PUERTO LLEGADAA:</td>
              <td> ${destino ? destino.name : ""}</td>
              </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;"> PESO</td>
              <td style="padding: 8px; border: 1px solid #333;"> ${
                rootStore.state.pricing.datosPrincipales.peso || ""
              }
              </td>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #333;">M3</td><td style="padding: 8px; border: 1px solid #333;"> ${
              rootStore.state.pricing.datosPrincipales.volumen || ""
            }</td>
            </tr>
            <tr>
              <td> DESCRIPCIÓN DE LA MERCANCÍA:</td>
              <td> ${
                rootStore.state.pricing.datosPrincipales.descripcioncarga ||
                ""
              }</td>
            <tr>
          </table>
          <p>Saludos.</p>
        </div>
      `;
  }

  try {
    const blob = new Blob([tablaHtml], { type: "text/html" });
    const data = [new ClipboardItem({ ["text/html"]: blob })];
    await navigator.clipboard.write(data);

    Swal.fire({
      icon: "info",
      title: "¡Casi listo!",
      html: `
              <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
                <h2 style="color: #333; margin-top: 0;">Tabla copiada con éxito</h2>

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

    const body = encodeURIComponent("Hola colega, (PEGA LA TABLA AQUI)");
    window.location.href = `mailto:${miEmail}?bcc=${to}&subject=${encodeURIComponent(
      subject,
    )}&body=${body}`;
    dialogProveedor.value = false;
  } catch (err) {
    console.error("Error al copiar:", err);
    alert("Hubo un problema al copiar los datos automáticamente.");
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
  const { servicios, id_town } = rootStore.state.pricing.datosPrincipales;

  if (
    servicios.some((v: Servicio) => v.code_service == "14" && v.status == 1) &&
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

    await rootStore.dispatch("copiarQuote", {
      fullflag: true,
      id: route.params.id,
    }).catch((err: unknown) => {
      console.error("copiarQuote", err);
    });

    const userStr = sessionStorage.getItem("dataUser");
    const id_branch = userStr ? JSON.parse(userStr)[0].id_branch : null;
    const branchCreacion = [1, 2];

    if (branchCreacion.includes(id_branch)) {
      // Aquí recibimos el return de la función anterior
      const urlGenerada = await rootStore.dispatch("crearCarpetaOneDrive", {
        nro_quote: rootStore.state.pricing.nro_quote,
        nombre: rootStore.state.pricing.datosPrincipales.nombre,
      });

      if (urlGenerada) {
        await Promise.all([
          rootStore.dispatch("actualizarURLEnElQuote", {
            id: rootStore.state.pricing.id,
            url: urlGenerada,
          }),
          rootStore.dispatch("moveFileToOneDrive", {
            fileIds: rootStore.state.pricing.selectedFile.map(
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
      text: rootStore.state.pricing.mensaje,
      confirmButtonText: "Ir a ver",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await router.push({
          name: "verQuote",
          params: { id: rootStore.state.pricing.id },
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

  if (
    rootStore.state.pricing.opcionCostos.some((v: OpcionCosto) => v.date_end == "")
  ) {
    Swal.fire({
      icon: "warning",
      title: "Aviso",
      text: "La fecha de validez para las opciones es requerida.",
    });
    val = false;
  } else {
    if (
      !rootStore.state.pricing.opcionCostos.some((v: OpcionCosto) =>
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
  if (
    !rootStore.state.pricing.opcionCostos.some((v: OpcionCosto) => v.tiempo_transito)
  ) {
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
  rootStore.state.pricing.opcionCostos.forEach((element: OpcionCosto) => {
    const validateCostos = validateCost({
      costo: element.listCostos.filter((v) => v.esopcionflag == 1),
      multiplicador: rootStore.state.pricing.listMultiplicador,
      services: rootStore.state.pricing.listServices,
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
  const Url = ["newQuote", "editQuote", "verQuote"];
  if (Url.includes(getNameUrl())) {
    if (
      rootStore.state.pricing.totalCosto -
        rootStore.state.pricing.totalVenta <
      0
    ) {
      type = "success";
    }
    if (
      rootStore.state.pricing.totalCosto -
        rootStore.state.pricing.totalVenta >
      0
    ) {
      type = "error";
    }
  }
  if (Url.includes(getNameUrl())) {
    if (
      rootStore.state.aduana.totalCosto -
        rootStore.state.aduana.totalVenta <
      0
    ) {
      type = "success";
    }
    if (
      rootStore.state.aduana.totalCosto -
        rootStore.state.aduana.totalVenta >
      0
    ) {
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
    const dataUser: UsuarioSesion[] | null = JSON.parse(sessionStorage.getItem("dataUser") as string);
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
  const pricing = rootStore.state.pricing;

  // Verificar aprobadoflag (boolean)
  if (pricing.aprobadoflag === true) {
    return true;
  }

  if (
    pricing.datosPrincipales &&
    pricing.datosPrincipales.nameStatusQuote
  ) {
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
        v.codigo == "02" &&
        v.id == entitiesStore.cliente.id_tipotransaccion
      );
    },
  );

  return val;
}
async function registrarCliente() {
  rootStore.state.spiner = true;
  await entitiesStore.guardarCliente();
  rootStore.state.spiner = false;
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
    entitiesStore.isStep1Valid =
      !entitiesStore.isStep1Valid;
  } else if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid =
      !entitiesStore.isStep2Valid;
  } else if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid =
      !entitiesStore.isStep3Valid;
  } else if (!okStep4) {
    entitiesStore.isStep4Valid =
      !entitiesStore.isStep4Valid;
  } else {
    rootStore.state.spiner = true;
    await entitiesStore.actualizarCliente();
    rootStore.state.spiner = false;
  }
}
function isProveedorInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v: TipoTransaccion) => {
      return (
        v.codigo == "02" &&
        v.id == entitiesStore.proveedor.id_tipotransaccion
      );
    },
  );

  return val;
}
function isShipper() {
  const val = rootStore.state.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "SHIPPER"
    );
  });

  return val;
}
function isNaviera() {
  const val = rootStore.state.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "NAVIERA"
    );
  });

  return val;
}
function isAlmacen() {
  const val = rootStore.state.itemsDataRoleList.some((v: RolProveedor) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "ALMACEN"
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
    entitiesStore.isStep4Valid =
      !entitiesStore.isStep4Valid;
  } else {
    rootStore.state.spiner = true;
    await entitiesStore.guardarProveedor();
    rootStore.state.spiner = false;
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
    } else if (
      isShipper() &&
      !entitiesStore.proveedor.producto
    ) {
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

    if (
      isNaviera() &&
      entitiesStore.proveedor.dias_sobreestadia < 0
    ) {
      okStep1 = false;
    }

    if (
      isAlmacen() &&
      entitiesStore.proveedor.dias_almacenaje < 0
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
    entitiesStore.isStep1Valid =
      !entitiesStore.isStep1Valid;
  } else if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid =
      !entitiesStore.isStep2Valid;
  } else if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid =
      !entitiesStore.isStep3Valid;
  } else if (!okStep4) {
    entitiesStore.isStep4Valid =
      !entitiesStore.isStep4Valid;
  } else {
    rootStore.state.spiner = true;
    await entitiesStore.actualizarProveedor();
    rootStore.state.spiner = false;
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
      id_modality: rootStore.state.pricing.datosPrincipales.idsentido,
      id_roles: idRole.value.join(","),
      id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0]
        .id_branch,
    },
  };

  await axios<ApiResponse<{ datos: DatoTarifaProveedor[] }>>(config).then((res) => {
    const data = res.data;
    lstDatosTarifa.value = data.data.datos.map((v) => {
      return { ...v, selected: v.proveedorprincipalflag };
    });
  });
});
</script>

<template>
  <div id="inspire">
    <v-navigation-drawer
      width="320"
      v-model="rootStore.state.drawer"
      v-if="mostrarBtnMenu"
    >
      <ListMenu />
    </v-navigation-drawer>

    <v-app-bar
      elevation="0"
      v-if="mostrarBtnMenu"
      :color="colorBar()"
    >
      <v-app-bar-nav-icon
        aria-label="Abrir menú"
        v-if="mostrarBtnMenu"
        @click="rootStore.state.drawer = !rootStore.state.drawer"
      />

      <v-toolbar-title class="flex-0-1">
        {{ rootStore.state.mainTitle }}
      </v-toolbar-title>

      <v-spacer />

      <v-chip
        v-if="operadorNombre"
        color="white"
        variant="flat"
        class="mx-4 text-primary"
      >
        <v-icon
          start
          color="primary"
        >
          mdi-account
        </v-icon>
        VENDEDOR: {{ operadorNombre }}
      </v-chip>

      <v-spacer />

      <b
        v-if="route.params.id_house"
        class="mr-10 text-headline-large"
      >
        PROFIT PR:
        {{
          (
            (rootStore.state.totalTotalIngresos
              ? rootStore.state.totalTotalIngresos
              : 0) -
            (rootStore.state.totalTotalEgresos
              ? rootStore.state.totalTotalEgresos
              : 0)
          ).toFixed(2)
        }}
        USD
      </b>

      <b
        v-if="route.params.id_house"
        class="mr-10 text-headline-large"
      >
        / OP:
        {{
          (
            (rootStore.state.totalTotalIngresosOp
              ? rootStore.state.totalTotalIngresosOp
              : 0) -
            (rootStore.state.totalTotalEgresosOp
              ? rootStore.state.totalTotalEgresosOp
              : 0)
          ).toFixed(2)
        }}
        USD
      </b>
      <!-- QUOTE -->
      <v-spacer />

      <!-- nuevo -->
      <label
        class="monto"
        v-if="getNameUrl() == 'newQuote'"
      >
        Profit / Ganancia
        {{
          currencyFormat(
            rootStore.state.pricing.totalVenta - rootStore.state.pricing.totalCosto,
          )
        }}
      </label>

      <v-spacer
        v-if="getNameUrl() == 'newQuote' && !!rootStore.state.pricing.btnRegistrar"
      />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'newQuote' && !!rootStore.state.pricing.btnRegistrar"
        @click="guardarCotizacion()"
        :disabled="rootStore.state.pricing.bloquearBtnImprimir"
      >
        GUARDAR
      </v-btn>
      <!-- editar -->
      <label
        class="monto"
        v-if="getNameUrl() == 'editQuote'"
      >
        Profit / Ganancia
        {{
          currencyFormat(
            rootStore.state.pricing.totalVenta - rootStore.state.pricing.totalCosto,
          )
        }}
      </label>
      <v-spacer v-if="getNameUrl() == 'editQuote'" />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'editQuote'"
        @click="editarCotizacion()"
      >
        <v-icon
          size="small"
          class="mx-1"
        >
          mdi-content-save-all
        </v-icon> GUARDAR
      </v-btn>
      <!-- ver -->
      <label
        class="monto"
        v-if="getNameUrl() == 'verQuote'"
      >
        Profit / Ganancia
        {{
          currencyFormat(
            rootStore.state.pricing.totalVenta - rootStore.state.pricing.totalCosto,
          )
        }}
      </label>
      <v-spacer v-if="getNameUrl() == 'verQuote'" />

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'verQuote'"
        @click="handleEditarQuote()"
      >
        <v-icon
          size="small"
          class="mx-1"
        >
          mdi-pencil
        </v-icon> EDITAR
      </v-btn>
      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'verQuote'"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirCorreo()"
      >
        <v-icon
          class="mx-1"
          size="small"
        >
          mdi-email-fast
        </v-icon>
        CORREO
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'editQuote'"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirCorreo()"
      >
        <v-icon
          class="mx-1"
          size="small"
        >
          mdi-email-fast
        </v-icon>
        CORREO
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'editQuote' || getNameUrl() == 'verQuote'"
        class="mx-1"
        color="#FFD600"
        @click="
          abrirCarpeta(rootStore.state.pricing.datosPrincipales.url_folderonedrive)
        "
      >
        <v-icon
          class="mx-1"
          size="small"
        >
          mdi-folder
        </v-icon>
        ABRIR
      </v-btn>

      <v-btn
        variant="elevated"
        v-if="getNameUrl() == 'verQuote'"
        class="mx-1"
        color="light-blue-darken-3"
        @click="abrirModalCopiarCotizacion()"
      >
        <v-icon
          class="mx-1"
          size="small"
        >
          mdi-content-copy
        </v-icon>
        COPIAR
      </v-btn>

      <!--MODULO CLIENTES-->
      <v-btn
        variant="elevated"
        v-if="
          getNameUrl() == 'nuevoClientes' &&
            entitiesStore.showBtnSaveFlag
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
            entitiesStore.showBtnSaveFlag
        "
        color="success"
        class="ml-auto"
        @click="registrarProveedor"
        :disabled="entitiesStore.disabledBtnSave"
      >
        Guardar Proveedor
      </v-btn>

      <label
        class="monto"
        v-if="routeAduana.includes(getNameUrl())"
      >
        {{
          currencyFormat(
            (rootStore.state.aduana.totalVenta
              ? rootStore.state.aduana.totalVenta
              : 0) -
              (rootStore.state.aduana.totalCosto
                ? rootStore.state.aduana.totalCosto
                : 0),
          )
        }}
      </label>

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="getNameUrl() == 'EditarAduana'"
        @click="editarCotizacionAduana()"
        size="small"
      >
        <v-icon class="mx-1">
          mdi-save
        </v-icon> GUARDAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="#009688"
        v-if="
          getNameUrl() == 'VerAduana' &&
            rootStore.state.aduana.mostrarBtnActualizarFlag
        "
        @click="ira('EditarAduana', route.params.id)"
      >
        <v-icon>mdi-account-tie-hat</v-icon> EDITAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="#009688"
        @click="abrirModalPilotoAutomatico()"
        v-if="getNameUrl() == 'editQuote'"
      >
        <v-icon class="mx-1">
          mdi-send
        </v-icon>AUTOMATICO
      </v-btn>

      <v-btn
        variant="elevated"
        color="info"
        @click="ira('EditAccountPaysCxC', route.params.id)"
        v-if="getNameUrl() == 'viewAccountPaysCxC'"
      >
        <v-icon class="mx-1">
          mdi-pencil
        </v-icon> IR EDITAR
      </v-btn>

      <v-btn
        variant="elevated"
        color="info"
        @click="ira('EditAccountPays', route.params.id)"
        v-if="getNameUrl() == 'viewAccountPays'"
      >
        <v-icon class="mx-1">
          mdi-pencil
        </v-icon> IR EDITAR
      </v-btn>
      <v-spacer />
      <PlanStatusBadge />
      <BotonesHeader />
      <BtnIrAlListado />
    </v-app-bar>

    <v-main class="main">
      <div class="main-content">
        <router-view />
      </div>
    </v-main>

    <div
      v-if="rootStore.state.dialogProcessing"
      class="dialogOverlay"
    />
    <div
      v-if="rootStore.state.dialogProcessing"
      class="dialogProcessing"
    >
      <!-- <div class="dialogOverlay"></div> -->
      <LoadingComponent />
    </div>

    <!-- Modal de autenticación admin para editar cotizaciones aprobadas -->
    <v-dialog
      v-model="dialogAdminAuth"
      max-width="400"
      persistent
    >
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
          <v-btn
            color="grey"
            variant="text"
            @click="cerrarDialogAdminAuth()"
          >
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

    <v-dialog
      v-model="dialogProveedor"
      width="35%"
    >
      <v-card>
        <v-card-title> Seleccionar proveedor: </v-card-title>
        <v-card-text>
          <v-autocomplete
            multiple
            :items="rootStore.state.itemsDataRoleList"
            chips
            item-value="id"
            item-title="name"
            persistent
            variant="outlined"
            label="Tipo Proveedor"
            v-model="idRole"
            :loading="rootStore.state.itemsDataRoleList.length == 0"
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
              <tr
                v-for="(dato, index) in lstDatosTarifa"
                :key="index"
              >
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
            @click="abrirCorreoSend"
          >
            Enviar Correo
          </v-btn>
          <v-btn
            color="error"
            @click="dialogProveedor = false"
          >
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
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
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

    <v-dialog
      v-model="dialogFiles"
      max-width="40%"
    >
      <v-card>
        <v-card-title> Archivos a Copiar </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFiles"
            :items="listadoFilesDrive"
            show-select
            v-model="rootStore.state.pricing.selectedFile"
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
          <v-btn
            size="small"
            color="success"
            @click="copiarCotizacion"
          >
            Continuar
          </v-btn>
          <v-btn
            size="small"
            color="error"
            @click="dialogFiles = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar">
      {{ dataMensaje }}
    </v-snackbar>

    <v-dialog
      persistent
      max-width="480"
      v-model="dialogCambiarFecha"
    >
      <v-card class="rounded-lg elevation-4">
        <!-- Cabecera profesional con color y título claro -->
        <v-card-title
          class="text-headline-medium bg-primary text-white py-3 px-4 d-flex align-center"
        >
          <v-icon
            start
            class="mr-2"
          >
            mdi-calendar-clock
          </v-icon>
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
            <v-icon
              start
              size="18"
            >
              mdi-check
            </v-icon>
            Actualizar Fecha
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
            v-model="rootStore.state.pricing.datosPrincipales.id_town"
            :items="townStore.lstTown"
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
            :disabled="!rootStore.state.pricing.datosPrincipales.id_town"
            @click="confirmarSeleccionDistrito"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
/* Oculta en móviles (menos de 992px) */
@media (max-width: 991.98px) {
  .ocultarMovil {
    display: none;
  }
}
</style>
