<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "@/api/http";
import FileSequenceInstructivo from "../../comun/FileSequenceInstructivo.vue";
import { generateIdempotencyKey } from "@/utils/idempotencia";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import { useSecuritysStore } from "@/stores/securitys";
import type { ArchivoDrive, ExpedienteMaster, HouseAsociadoMaster, OpcionCosto } from "@/types/cotizacion";
import type { ProveedorPricing } from "@/types/entidades";

const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigExpediente.vue"));

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const notaForm = useTemplateRef("nota");
const frmSeleccionQuote = useTemplateRef("frmSeleccionQuote");
const frmAsociarExpediente = useTemplateRef("frmAsociarExpediente");

const dialogCorrelativos = ref(false);
const correlativos = ref<{ code: string }[]>([]);
const IdempotencyKey = ref("");
const verPrevisualizacion = ref(true);
const verDatosPreview = ref(true);
const proveedorInstructivo = ref<unknown>({});
const dialogSequenceInstructivo = ref(false);
const dialogFiles = ref(false);
const nuevoexpediente = ref<string | boolean>("");
const aprobarflag = ref(false);
const id_exp = ref<number | string>("");
const fecha_validez = ref<string | undefined>("");
const descripcionNota = ref("");
const dialog = ref(false);
const seleccionQuoteAprobar = ref(false);
const page = ref(1);
const nro_propuesta = ref<number | string>("");
const mostrarAdvertencia = ref(false);
const textValidacionCotizacionMaster = ref<string[]>([]);
const dialogConfig = ref(false);
const dialogCostos = ref(false);
const textValidacionPago = ref("");
const activarBtnContinuar = ref(true);
const loading = ref(false);
const lstHouse = ref<HouseAsociadoMaster[]>([]);
const dialogHouse = ref(false);
const id_house = ref<number | string>("");
const optionCostos = [
  { id: "0", text: "No hacer ninguna acción" },
  { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
  {
    id: "2",
    text: "Sumar los nuevos costos, a los costos ya existentes de proveedores",
  },
];
const optionHouse = [
  // { id: "0", text: "Crear un nuevo house" },
  {
    id: "1",
    text: "Reemplazar los nuevos montos, ya existente del house",
  },
  {
    id: "2",
    text: "Sumar los nuevos montos, a los costos ya existentes del house",
  },
];
const id_opcion = ref<number | string>("0");
const id_opcion_house = ref<number | string>("0");
const headersFiles = [
  { title: "Archivo", key: "name" },
  { title: "", key: "action" },
];
const url_folderonedrive = ref<string | undefined>("");
let stepAprobado: number | undefined;

const activarBotonAsociarMaster = computed(() => {
  if (id_opcion.value == 1) {
    const exp = rootStore.state.itemsMasterList.find(
      (v: ExpedienteMaster) => v.id == id_exp.value,
    );
    const clienteVarios = "CLIENTE VARIOS";

    if (exp && exp.Expediente) {
      const esMultiple = exp.Expediente.includes(clienteVarios);

      if (esMultiple) {
        return false;
      }
    }
  }
  return true;
});
const mostrarMensajeClienteVariosExp = computed(() => {
  if (id_opcion.value == 1) {
    const exp = rootStore.state.itemsMasterList.find(
      (v: ExpedienteMaster) => v.id == id_exp.value,
    );
    const clienteVarios = "CLIENTE VARIOS";
    if (exp && exp.code_master) {
      const esMultiple = exp.code_master.includes(clienteVarios);

      if (esMultiple) {
        return true;
      }
    }
  }
  return false;
});
const ingresosInstructivoActual = computed(() => {
  const lista = pricingStore.listIngresosInstructivo;
  const index = page.value - 1;
  if (!lista || !lista.length || index < 0 || index >= lista.length) {
    return [];
  }
  const item = lista[index];
  return item && item.opcion ? item.opcion : [];
});
const costosInstructivoActual = computed(() => {
  const lista = pricingStore.listCostosInstructivo;
  const index = page.value - 1;
  if (!lista || !lista.length || index < 0 || index >= lista.length) {
    return [];
  }
  const item = lista[index];
  return item && item.opcion ? item.opcion : [];
});
const impuestosInstructivoActual = computed(() => {
  const lista = pricingStore.listImpuestosInstructivo;
  const index = page.value - 1;
  if (!lista || !lista.length || index < 0 || index >= lista.length) {
    return [];
  }
  const item = lista[index];
  return item && item.opcion ? item.opcion : [];
});
const nroPropuestaActual = computed(() => {
  const lista = pricingStore.listIngresosInstructivo;
  const index = page.value - 1;
  if (!lista || !lista.length || index < 0 || index >= lista.length) {
    return "";
  }
  const item = lista[index];
  return item && item.nro_propuesta ? item.nro_propuesta : "";
});
const correlativoPrincipal = computed(() => {
  return (correlativos.value.length ? correlativos.value[0]! : "") as unknown as { code?: string };
});
const correlativosSecundarios = computed(() => {
  return correlativos.value.slice(1);
});

onMounted(async () => {
  IdempotencyKey.value = generateIdempotencyKey();
  stepAprobado = route.params.step
    ? parseInt(route.params.step as string)
    : 1;
  nextTick(async () => {
    setTimeout(async () => {
      await pricingStore.generaInstructivoparaguardata();
      if (pricingStore.aprobadoflag && stepAprobado == 5) {
        dialogSequenceInstructivo.value = true;
      }
    }, 4000);
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function tienePagosAsociados() {
  if (id_exp.value) {
    const val = rootStore.state.itemsMasterList.find(
      (v: ExpedienteMaster) => v.id == id_exp.value,
    );
    if (val.tienepagos) {
      return true;
    }
  }
  return false;
}
function abrirCarpeta(url?: string | null) {
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
function irAControlDeGastos() {
  console.log();
  Swal.fire({
    icon: "question",
    title: "Ir a Control de Gastos",
    text: "¿Desea Ir al control de Gastos Asociado a esta Cotización?",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    confirmButtonText: "Si, ir al control de Gastos",
    denyButtonText: "Cancelar",
    showCloseButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      router.push({
        name: "editControlGasto",
        params: {
          id: pricingStore.id_master,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0]
            .id_branch,
        },
      });
    }
  });
}
function cerrarDialogoSequenceInstructivo() {
  Swal.fire({
    icon: "warning",
    title: "Advertencia",
    text: "Si cierra esta pestaña no se guardará ningún cambio. Está seguro de cerrar esta pestaña.",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    confirmButtonText: "Si, cerrar.",
    cancelButtonText: "Cancelar",
    cancelButtonColor: "red",
    showCancelButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      dialogSequenceInstructivo.value = false;
    }
  });
  // dialogSequenceInstructivo
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
async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialogConfig.value = false;
  abrirSeleccionDeQuoteAAprobar();
}
function verificarMaster() {
  mostrarAdvertencia.value = false;
  textValidacionCotizacionMaster.value = [];
  const master = rootStore.state.itemsMasterList.find(
    (v: ExpedienteMaster) => v.id == id_exp.value,
  );
  url_folderonedrive.value = master.url_folderonedrive;
  if (
    !(
      pricingStore.datosPrincipales.idsentido ==
      master.id_modality
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Modalidad");
  }
  if (
    !(
      pricingStore.datosPrincipales.idtipocarga ==
      master.id_shipment
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Tipó de Cargar");
  }
  if (
    !(
      pricingStore.datosPrincipales.idincoterms ==
      master.id_incoterms
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Incoterms");
  }

  if (
    !(
      pricingStore.datosPrincipales.idorigen ==
      master.id_port_begin
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Puerto de origien");
  }
  if (
    !(
      pricingStore.datosPrincipales.iddestino ==
      master.id_port_end
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Puerto de Destino");
  }
}
async function imprimir() {
  for (
    let index = 0;
    index <
    pricingStore.opcionCostos.filter((v) => !!v.selected)
      .length;
    index++
  ) {
    ((index: number) => {
      pricingStore.imprimirInstructivoQuote({
        nro_propuesta:
          pricingStore.opcionCostos[index]!.nro_propuesta,
        url_folderonedrive:
          pricingStore.datosPrincipales.url_folderonedrive,
      } as { nro_propuesta?: number });
    })(index); // Pasamos 'index' como argumento y establecemos el contexto a 'this'
  }
}
async function guardarNota() {
  if ((await notaForm.value!.validate()).valid) {
    rootStore.state.spiner = true;
    const data = {
      name: descripcionNota.value,
      id_quote: route.params.id,
    };
    await pricingStore.setNoteQuote(data);
    notaForm.value!.reset();
    await pricingStore.getInstructivoId({ id: route.params.id as string });
    dialog.value = false;
    rootStore.state.spiner = false;
  }
}
async function abrirSeleccionDeQuoteAAprobar() {
  if (!pricingStore.datosPrincipales.id_proveedor) {
    Swal.fire({
      icon: "warning",
      title: "Proveedor",
      text: "Para Aprobar la cotización necesita un proveedor",
    });
    return;
  }
  const opcionCostos = pricingStore.opcionCostos.filter(
    (v) => !!v.selected,
  );
  if (opcionCostos.length != 1) {
    Swal.fire({
      icon: "warning",
      title: "Costos",
      text: "Es necesario seleccionar opción para cotizar",
    });
    return;
  }
  const costosFlete = opcionCostos[0]!.listCostos.filter(
    (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
  );

  const proveedoresUnicos = [
    ...new Set(costosFlete.map((v) => v.id_proveedor)),
  ];
  if (proveedoresUnicos.length > 1) {
    Swal.fire({
      icon: "warning",
      title: "Costos",
      text: "Para aprobar, en la sección Flete y gastos de origen, debe tener un solo proveedor",
    });
    return;
  }
  proveedorInstructivo.value = rootStore.state.provedores.find(
    (v: ProveedorPricing) => v.id == proveedoresUnicos[0],
  );

  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string);
  dialogConfig.value = !val.existemaster;
  if (dialogConfig.value) {
    return false;
  }

  await rootStore.dispatch("cargarMaster", pricingStore.datosPrincipales);

  seleccionQuoteAprobar.value = true;
}
function mostrarBtnAprobar() {
  return !pricingStore.aprobadoflag;
}
function abrirModalListadoArchivos() {
  dialogFiles.value = true;
}
function abrirSeleccionCorreo() {
  Swal.fire({
    icon: "question",
    title: "¿Empezar Instructivo?",
    showConfirmButton: true,
    confirmButtonText: "Empezar",
    cancelButtonText: "Cancelar",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
  }).then((confirmacion) => {
    if (confirmacion.isConfirmed) {
      dialogFiles.value = false;
      dialogSequenceInstructivo.value = true;
    }
  });
}
async function abrirModalAprobar() {
  dialogFiles.value = false;
  dialogSequenceInstructivo.value = false;
  await pricingStore.generaInstructivoparaguardata();
  await nextTick();
  const formulario = frmSeleccionQuote.value;
  if (!formulario) {
    return false;
  }
  if ((await formulario.validate()).valid) {
    const fechaValidezOpcion = pricingStore.opcionCostos.filter(
      (v) => v.nro_propuesta == nro_propuesta.value,
    )[0]!.date_end;
    let esValida = moment(fechaValidezOpcion).isSameOrAfter(moment(), "day");
    if (!esValida) {
      return Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "No se puede aprobar ya que la validez ya expiró.",
      }).then(() => false);
    }
    esValida = moment(fechaValidezOpcion, "YYYY-MM-DD").isSameOrAfter(
      moment().add(15, "days").startOf("day"),
    );
    const hoy = moment();
    const newFechaValize = moment(fechaValidezOpcion);
    const cantFecha = newFechaValize.diff(hoy, "days");

    if (!esValida) {
      return Swal.fire({
        icon: "question",
        title: "Advertencia",
        text: `Quedan ${
          cantFecha + 1
        } días de validez. ¿Desea continuar.? `,
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: "Enviar a Operaciones.",
        cancelButtonText: "No aprobar.",
      }).then((res) => {
        if (res.isDismissed) {
          return false;
        }

        nuevoexpediente.value = true;
        id_exp.value = "";
        Swal.fire({
          icon: "question",
          iconColor: "red",
          width: 1000,
          html:
            rootStore.state.itemsMasterList.length > 0
              ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
              : "<h1>¿Desea crear un nuevo expediente?</h1>",
          showConfirmButton: true,
          confirmButtonText: "CREAR NUEVO EXPEDIENTE",
          showDenyButton: rootStore.state.itemsMasterList.length > 0,
          denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
          showCloseButton: true,
          showCancelButton: false,
          allowOutsideClick: false,
        }).then(async (res) => {
          if (res.isConfirmed) {
            Swal.fire({
              icon: "warning",
              width: 1000,
              title: "Fecha de Disponibilidad - Master",
              html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
              allowOutsideClick: false,
              confirmButtonText: "ACEPTAR",
              showCancelButton: true,
              cancelButtonText: "CANCELAR",
              preConfirm: () => {
                const dateInput =
                  (document.getElementById("swal-input1") as HTMLInputElement).value;
                if (!dateInput) {
                  Swal.showValidationMessage(
                    "La fecha de validez es requerida",
                  );
                } else {
                  const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                  const currentDate = moment(); // Obtiene la fecha actual

                  if (selectedDate.isSameOrBefore(currentDate)) {
                    Swal.showValidationMessage(
                      "La fecha debe ser mayor que la fecha actual",
                    );
                  } else {
                    return dateInput;
                  }
                }
              },
            }).then(async (res) => {
              fecha_validez.value = res.value;
              console.log(
                "b",
                pricingStore.listIngresosInstructivoAprobar,
              );
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const sum =
                pricingStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value,
                );
              const igv =
                pricingStore.listIngresosInstructivoAprobar
                  .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                  .dataIngresos.filter(
                    (v) => v.descripcion === "TOTAL",
                  )[0]!.igv;
              const valor =
                pricingStore.listIngresosInstructivoAprobar
                  .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                  .dataIngresos.filter(
                    (v) => v.descripcion === "TOTAL",
                  )[0]!.valor;
              const listCostosInstructivo =
                pricingStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value,
                )[0]!.dataCostos;
              const listVentasInstructivo =
                pricingStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value,
                )[0]!.dataVentas;
              if (res.isConfirmed) {
                Swal.fire({
                  icon: "info",
                  title: "Aprobando Cotizacion",
                  timerProgressBar: true,
                  allowOutsideClick: false,
                  timer: null as unknown as number,
                  didOpen: () => {
                    Swal.showLoading();
                  },
                });
                await pricingStore.aprobarCotizacion({
                  IdempotencyKey: IdempotencyKey.value,
                  id_quote: route.params.id,
                  nuevoexpediente: true,
                  id_exp: id_exp.value,
                  fecha_validez: fecha_validez.value,
                  totalIngreso: valor,
                  igvIngreso: igv,
                  valorIngreso: valor,
                  listCostosInstructivo: listCostosInstructivo,
                  listVentasInstructivo: listVentasInstructivo,
                  id_house: id_house.value,
                  id_opcion: id_opcion.value,
                  url_folderonedrive: url_folderonedrive.value,
                });
                rootStore.state.spiner = true;

                rootStore.state.spiner = false;
              }
            });
          }
          if (res.isDenied) {
            nuevoexpediente.value = false;
            aprobarflag.value = true;
          }
        });
      });
    } else {
      nuevoexpediente.value = true;
      id_exp.value = "";
      Swal.fire({
        icon: "question",
        iconColor: "red",
        width: 1000,
        html:
          rootStore.state.itemsMasterList.length > 0
            ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
            : "<h1>¿Desea crear un nuevo expediente?</h1>",
        showConfirmButton: true,
        confirmButtonText: "CREAR NUEVO EXPEDIENTE",
        showDenyButton: rootStore.state.itemsMasterList.length > 0,
        denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
        showCloseButton: true,
        showCancelButton: false,
        allowOutsideClick: false,
      }).then(async (res) => {
        if (res.isConfirmed) {
          Swal.fire({
            icon: "warning",
            width: 1000,
            title: "Fecha de Disponibilidad - Master",
            html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
            allowOutsideClick: false,
            confirmButtonText: "ACEPTAR",
            showCancelButton: true,
            cancelButtonText: "CANCELAR",
            preConfirm: () => {
              const dateInput =
                (document.getElementById("swal-input1") as HTMLInputElement).value;
              if (!dateInput) {
                Swal.showValidationMessage(
                  "La fecha de validez es requerida",
                );
              } else {
                const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                const currentDate = moment(); // Obtiene la fecha actual

                if (selectedDate.isSameOrBefore(currentDate)) {
                  Swal.showValidationMessage(
                    "La fecha debe ser mayor que la fecha actual",
                  );
                } else {
                  return dateInput;
                }
              }
            },
          }).then(async (res) => {
            fecha_validez.value = res.value;
            console.log(
              "a",
              pricingStore.listIngresosInstructivoAprobar,
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const sum =
              pricingStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value,
              );
            const igv =
              pricingStore.listIngresosInstructivoAprobar
                .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                .dataIngresos.filter(
                  (v) => v.descripcion === "TOTAL",
                )[0]!.igv;
            const valor =
              pricingStore.listIngresosInstructivoAprobar
                .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                .dataIngresos.filter(
                  (v) => v.descripcion === "TOTAL",
                )[0]!.valor;
            const listCostosInstructivo =
              pricingStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value,
              )[0]!.dataCostos;
            const listVentasInstructivo =
              pricingStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value,
              )[0]!.dataVentas;
            if (res.isConfirmed) {
              Swal.fire({
                icon: "info",
                title: "Aprobando Cotizacion",
                timerProgressBar: true,
                allowOutsideClick: false,
                timer: null as unknown as number,
                didOpen: () => {
                  Swal.showLoading();
                },
              });
              await pricingStore.aprobarCotizacion({
                IdempotencyKey: IdempotencyKey.value,
                id_quote: route.params.id,
                nuevoexpediente: true,
                id_exp: id_exp.value,
                fecha_validez: fecha_validez.value,
                totalIngreso: valor,
                igvIngreso: igv,
                valorIngreso: valor,
                listCostosInstructivo: listCostosInstructivo,
                listVentasInstructivo: listVentasInstructivo,
                id_house: id_house.value,
                id_opcion: id_opcion.value,
                url_folderonedrive: url_folderonedrive.value,
              });
              rootStore.state.spiner = true;

              rootStore.state.spiner = false;
            }
          });
        }
        if (res.isDenied) {
          nuevoexpediente.value = false;
          aprobarflag.value = true;
        }
      });
    }
  }
}
function regresarSeleccionoMaster() {
  dialogCostos.value = !dialogCostos.value;
  aprobarflag.value = true;
}
async function validarExistePagosMaster() {
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  if (id_opcion.value == "1") {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_existe_pago_master",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        id: id_exp.value,
      },
    };
    const res = await axios(config).then((res) => {
      return res.data;
    });
    activarBtnContinuar.value = res.estadoflag;
    textValidacionPago.value = res.mensaje;
    loading.value = false;
    return;
  }
  activarBtnContinuar.value = false;
}
async function validarExistePagosHouse() {
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";

  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "validar_existe_pago_house",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      id: id_house.value,
    },
  };
  const res = await axios(config).then((res) => {
    return res.data;
  });
  activarBtnContinuar.value = res.estadoflag;
  textValidacionPago.value = res.mensaje;
  return;
}
async function buscarHouseAsociadosAMaster() {
  lstHouse.value = [];
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "cargar_house_asociado_master",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      id_master: id_exp.value,
    },
  };
  loading.value = true;
  const res = await axios(config).then((res) => {
    return res.data;
  });
  loading.value = false;

  if (!!res.estadoflag) {
    lstHouse.value = res.data;
  }
  lstHouse.value.unshift({
    id: 0,
    code_house: "CREAR UN NUEVO HOUSE",
  });
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  aprobarflag.value = false;
  dialogHouse.value = true;
}
function continuarAprobar() {
  id_opcion.value = "";
  aprobarflag.value = false;
  dialogCostos.value = true;
}
async function aprobar() {
  if (id_opcion_house.value == 1) {
    const house = lstHouse.value.find((v) => v.id == id_house.value)!;

    correlativos.value = house.correlativos
      ? house.correlativos.split(",").map((item) => ({
          code: item.trim(),
        }))
      : [];
    dialogCorrelativos.value = true;
  } else {
    continuarAprobarHouses();
  }
}
async function continuarAprobarHouses() {
  dialogCorrelativos.value = false;
  await pricingStore.generaInstructivoparaguardata();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sum = pricingStore.listIngresosInstructivoAprobar.filter(
    (v) => v.nro_propuesta == nro_propuesta.value,
  );
  const igv = pricingStore.listIngresosInstructivoAprobar
    .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
    .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0]!.igv;
  const valor = pricingStore.listIngresosInstructivoAprobar
    .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
    .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0]!.valor;
  const listCostosInstructivo =
    pricingStore.listIngresosInstructivoAprobar.filter(
      (v) => v.nro_propuesta == nro_propuesta.value,
    )[0]!.dataCostos;
  const listVentasInstructivo =
    pricingStore.listIngresosInstructivoAprobar.filter(
      (v) => v.nro_propuesta == nro_propuesta.value,
    )[0]!.dataVentas;
  const formulario = frmAsociarExpediente.value;
  if (formulario && !(await formulario.validate()).valid) {
    return;
  }
  if (formulario || id_exp.value || nuevoexpediente.value) {
    Swal.fire({
      icon: "info",
      title: "Aprobando Cotizacion",
      timerProgressBar: true,
      allowOutsideClick: false,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await pricingStore.aprobarCotizacion({
      IdempotencyKey: IdempotencyKey.value,
      id_quote: route.params.id,
      nuevoexpediente: false,
      id_exp: id_exp.value,
      fecha_validez: fecha_validez.value,
      totalIngreso: valor,
      igvIngreso: igv,
      valorIngreso: valor,
      listCostosInstructivo: listCostosInstructivo,
      listVentasInstructivo: listVentasInstructivo,
      id_house: id_house.value,
      id_opcion: id_opcion.value,
      id_opcion_house: id_opcion_house.value,
      url_folderonedrive: url_folderonedrive.value,
    });
    rootStore.state.spiner = true;
    aprobarflag.value = false;
    rootStore.state.spiner = false;
  }
}

function noDataText() {
  return `No se encontraron Masters con la misma Modalidad, Tipo de Carga, Incoterms y/o Puerto Origen/ Destino asociados a la cotización.`;
}
function getProveedor(element: OpcionCosto) {
  const id_proveedor = element.listCostos.some(
    (v) => v.code_cost == 4 && v.esopcionflag == 1,
  )
    ? element.listCostos.filter(
        (v) => v.code_cost == 4 && v.esopcionflag == 1,
      )[0]!.id_proveedor
    : "";
  const nameProveedor = id_proveedor
    ? rootStore.state.provedores.find((v: ProveedorPricing) => v.id == id_proveedor)
    : "";
  return nameProveedor ? nameProveedor.namelong : " Sin Proveedor";
}
</script>

<template>
  <v-container v-if="(pricingStore.listInstructivo || []).length">
    <v-col cols="12">
      <div class="text-center">
        <v-pagination
          v-model="page"
          :length="
            (pricingStore.opcionCostos || []).filter((v) => !!v.selected)
              .length
          "
          rounded
        />
      </div>
    </v-col>
    <v-dialog
      v-model="aprobarflag"
      eager
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="aprobarflag = !aprobarflag"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAsociarExpediente">
            <v-row>
              <v-autocomplete
                :items="rootStore.state.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-title="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :no-data-text="noDataText()"
                @update:model-value="verificarMaster()"
                class="mx-5 my-5"
              />
            </v-row>
          </v-form>

          <v-alert
            v-if="mostrarAdvertencia"
            border="start"
            border-color="error"
            type="error"
            elevation="2"
          >
            El Master seleccionado no coincide con
            {{ textValidacionCotizacionMaster.join(", ") }} asociados a la
            cotización.
            <h3>¿Está seguro, de asociar la cotización a este registro?</h3>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            @click="continuarAprobar()"
            color="success"
            :loading="loading"
          >
            SELECCIONAR
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="aprobarflag = !aprobarflag"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="seleccionQuoteAprobar"
      eager
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card class="pa-5">
        <h2 class="text-blue justify--text">
          ESTÁS A PUNTO DE GENERAR UN INSTRUCTIVO A OPERACIONES
        </h2>
        Seleccione la opción aprobada por el cliente:

        <v-card-text>
          <v-form ref="frmSeleccionQuote">
            <v-radio-group
              v-model="nro_propuesta"
              :rules="[(v) => !!v || 'Seleccione una opción']"
            >
              <v-radio
                :value="opcion.nro_propuesta"
                v-for="(
                  opcion, index
                ) in pricingStore.opcionCostos.filter(
                  (v) => v.selected,
                )"
                :key="index"
                :label="`Opción ${opcion.nro_propuesta} - ${getProveedor(
                  opcion,
                )}`"
              />
            </v-radio-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            @click="abrirModalListadoArchivos()"
            color="success"
          >
            Enviar a Operaciones - Tráfico
          </v-btn>
          <v-btn
            class="mx-1"
            color="error"
            @click="seleccionQuoteAprobar = !seleccionQuoteAprobar"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-col
      cols="12"
      class="mb-0 pa-0"
    >
      <v-btn
        class="mx-1"
        color="#FF4500"
        elevation="2"
        size="small"
        @click="imprimir()"
      >
        <v-icon color="white">
          mdi-printer-outline
        </v-icon>
      </v-btn>

      <v-btn
        class="mx-1"
        color="#01579B"
        elevation="2"
        size="small"
        v-if="!mostrarBtnAprobar()"
        @click="dialogSequenceInstructivo = true"
      >
        <v-icon>mdi-email-outline</v-icon> Instructivo
      </v-btn>
      <v-btn
        class="mx-1"
        color="#004D40"
        elevation="2"
        v-if="mostrarBtnAprobar()"
        size="small"
        @click="abrirSeleccionDeQuoteAAprobar()"
      >
        <span style="color: #ffffff">Enviar a Operaciones/ Tráfico</span>
      </v-btn>
      <center>
        <h3>
          INSTRUCTIVO COMPRA
          {{ pricingStore.listInstructivo[0]!.expediente }} - N°{{
            nroPropuestaActual
          }}
        </h3>

        <h3 class="mb-1 ml-1">
          {{
            pricingStore.aprobadoflag == true
              ? "APROBADO"
              : "POR APROBAR"
          }}
          |
          <v-btn
            v-if="pricingStore.listInstructivo[0]!.code_master"
            color="info"
            style="color: black"
            @click="irAControlDeGastos"
          >
            Exp. Master:
            {{
              pricingStore.listInstructivo[0]!.code_master
                ? pricingStore.listInstructivo[0]!.code_master
                : "--"
            }}
            | Exp. House:
            {{
              pricingStore.listInstructivo[0]!.code_house
                ? pricingStore.listInstructivo[0]!.code_house
                : "--"
            }}
            <v-icon class="mx-5">
              mdi-cash-fast
            </v-icon>
          </v-btn>
        </h3>
        <h4 class="mb-1 ml-1">
          {{ pricingStore.listInstructivo[0]!.sentido }} -
          {{ pricingStore.listInstructivo[0]!.carga }} -
          {{ pricingStore.listInstructivo[0]!.incoterms }}
        </h4>
      </center>
    </v-col>
    <v-row>
      <v-col
        cols="12"
        md="4"
        lg="4"
        xl="4"
      >
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              DATOS DEL CLIENTE
            </h4>
            <v-text-field
              class="my-1"
              readonly
              v-model="pricingStore.datosPrincipales.nombre"
              label="NOMBRE:"
              density="compact"
            />
            <v-text-field
              class="my-1"
              readonly
              v-model="pricingStore.listInstructivo[0]!.direccion"
              label="DIRECCIÓN:"
              density="compact"
            />
            <v-text-field
              class="my-1"
              readonly
              v-model="pricingStore.datosPrincipales.telefono"
              label="CONTACTO:"
              density="compact"
            />

            <v-text-field
              class="my-1"
              readonly
              v-model="pricingStore.vendedor"
              label="VENDEDOR:"
              density="compact"
            />
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-1 ml-1">
              SERVICIOS A REALIZAR
            </h4>
            <v-table density="compact">
              <tbody>
                <tr
                  v-for="(servicio, i) in pricingStore
                    .listServiciosInstructivo"
                  :key="i"
                >
                  <td>{{ servicio.name }}</td>
                  <td>{{ servicio.status }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              DATOS DE MOVIMIENTO DE MERCANCIA
            </h4>
            <v-text-field
              class="my-1"
              density="compact"
              label="NOMBRE DEL PROVEEDOR:"
              v-model="pricingStore.listInstructivo[0]!.proveedor"
              required
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="pricingStore.listInstructivo[0]!.direccionorigen"
              label="DIRECCION ORIGEN:"
              v-if="pricingStore.listInstructivo[0]!.icotems == 'SXWORK'"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="pricingStore.listInstructivo[0]!.origen"
              label="POL:"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="pricingStore.listInstructivo[0]!.destino"
              label="POD:"
            />
            <v-text-field
              class="my-1"
              density="compact"
              v-model="pricingStore.listInstructivo[0]!.fiscal"
              required
              label="NOMBRE FISCAL"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="pricingStore.listInstructivo[0]!.ruc"
              label="RUC:"
            />
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              NOTAS ESPECIALES:
              <v-btn
                variant="text"
                color="success"
                @click="dialog = !dialog"
                icon
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </h4>
            <v-table
              density="compact"
              border
            >
              <tbody>
                <tr
                  v-for="(nota, i) in pricingStore.listInstructivo[0]!
                    .notas as { description?: string }[]"
                  :key="i"
                >
                  <td>{{ nota.description }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" />
      </v-col>

      <v-col
        cols="12"
        md="8"
        lg="8"
        xl="8"
      >
        <v-row>
          <v-col cols="12">
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                INGRESOS
              </h4>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header align-right" />
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>
                    <th class="header align-right" />
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(venta, index) in ingresosInstructivoActual"
                    :key="index"
                    :class="[
                      venta.descripcion === 'TOTAL'
                        ? 'totalClass'
                        : venta.descripcion === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                      venta.service === 'TOTAL'
                        ? 'totalClass'
                        : venta.service === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ venta.descripcion }}
                    </td>
                    <td>
                      {{ venta.service }}
                    </td>
                    <td class="align-right">
                      {{ venta.igv }}
                    </td>
                    <td class="align-right">
                      {{ venta.total }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                COSTOS:
              </h4>

              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header" />
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in costosInstructivoActual"
                    :key="index"
                    :class="[
                      costo.proveedor === 'TOTAL'
                        ? 'totalClass'
                        : costo.proveedor === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                      costo.service === 'TOTAL'
                        ? 'totalClass'
                        : costo.service === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ costo.proveedor }}
                    </td>
                    <td>
                      {{ costo.service }}
                    </td>
                    <td class="align-right">
                      {{ costo.total }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            v-if="(pricingStore.listImpuestosInstructivo || []).length > 0"
          >
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                IMPUESTOS
              </h4>

              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>

                    <th class="header align-left">
                      PORCENTAJE
                    </th>
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in impuestosInstructivoActual"
                    :key="index"
                    :class="[
                      costo.name === 'TOTAL'
                        ? 'totalClass'
                        : costo.name === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ costo.name }}
                    </td>
                    <td>
                      {{ costo.percentage }}
                    </td>

                    <td class="align-right">
                      {{ costo.valor }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialog"
      max-width="600px"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          NUEVA NOTA:
        </v-card-title>
        <v-card-text>
          <v-form ref="nota">
            <v-text-field
              label="DESCRIPCIÓN"
              v-model="descripcionNota"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            variant="text"
            @click="guardarNota"
          >
            Añadir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogConfig"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="guardarConfig()"
          >
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogHouse"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5 ">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          CREAR NUEVO HOUSE O ASOCIAR A UNO
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogHouse = !dialogHouse"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="lstHouse"
            v-model="id_house"
            item-title="code_house"
            item-value="id"
            @update:model-value="validarExistePagosHouse"
          />
          <v-autocomplete
            item-title="text"
            v-if="id_house != 0 && !textValidacionPago"
            :items="optionHouse"
            v-model="id_opcion_house"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
          <p class="text-red mx-5 my-0">
            {{ textValidacionPago }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="aprobar()"
            :disabled="activarBtnContinuar"
          >
            APROBAR
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="dialogHouse = !dialogHouse"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCostos"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCostos = !dialogCostos"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            item-title="text"
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
        </v-card-text>
        <v-alert
          v-if="mostrarMensajeClienteVariosExp"
          border="start"
          border-color="warning"
          type="warning"
          elevation="2"
          class="mx-5"
        >
          No puede reemplazar los costos, porqué es un expediente grupal.
        </v-alert>
        
        <v-alert
          v-if="textValidacionPago"
          border="start"
          border-color="error"
          type="error"
          elevation="2"
          class="mx-5"
        >
          {{ textValidacionPago }}
        </v-alert>
        
        <v-card-actions>
          <v-spacer />
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="buscarHouseAsociadosAMaster"
            :disabled="activarBtnContinuar && activarBotonAsociarMaster"
          >
            CONITNUAR
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="warning"
            @click="regresarSeleccionoMaster()"
          >
            Volver
          </v-btn>
        </v-card-actions>
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
            :items="pricingStore.listadoFilesDrive"
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
          <v-btn
            size="small"
            color="success"
            @click="abrirSeleccionCorreo"
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
    <v-dialog
      v-model="dialogSequenceInstructivo"
      fullscreen
      persistent
      scrollable
      v-if="dialogSequenceInstructivo"
    >
      <v-card
        tile
        shadow="none"
      >
        <v-card-title class="pa-0">
          <v-toolbar
            flat
            theme="dark"
            color="primary"
          >
            <v-toolbar-title>Datos Manuales Instructivo</v-toolbar-title>
            <v-spacer />
            <v-btn
              variant="elevated"
              class="mx-1"
              color="#FFD600"
              @click="
                abrirCarpeta(
                  pricingStore.datosPrincipales.url_folderonedrive,
                )
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
              size="small"
              class="mx-1"
              v-if="verPrevisualizacion"
              color="#01579B"
              @click="verDatosPreview = !verDatosPreview"
            >
              <v-icon
                class="mx-1"
                size="small"
                v-if="verDatosPreview"
              >
                mdi-eye-off
              </v-icon>
              <v-icon
                class="mx-1"
                size="small"
                v-else
              >
                mdi-lead-pencil
              </v-icon>
              {{ verDatosPreview ? "Ocultar Datos" : "Editar Datos" }}
            </v-btn>
            <v-btn
              variant="elevated"
              size="small"
              class="mx-1"
              v-if="verDatosPreview"
              color="#01579B"
              @click="verPrevisualizacion = !verPrevisualizacion"
            >
              <v-icon
                class="mx-1"
                size="small"
                v-if="verPrevisualizacion"
              >
                mdi-eye-off
              </v-icon>
              <v-icon
                class="mx-1"
                size="small"
                v-else
              >
                mdi-eye
              </v-icon>
              {{
                verPrevisualizacion
                  ? "Ocultar Previsualización"
                  : "Ver Previsualización"
              }}
            </v-btn>
            <v-btn
              variant="text"
              icon
              @click="cerrarDialogoSequenceInstructivo"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
        </v-card-title>

        <v-card-text class="pa-0">
          <v-container
            fluid
            class="pa-0"
          >
            <v-row no-gutters>
              <v-col cols="12">
                <FileSequenceInstructivo
                  @continuar="abrirModalAprobar"
                  :aprobadoflag="pricingStore.aprobadoflag"
                  :ver-previsualizacion="verPrevisualizacion"
                  :ver-datos-preview="verDatosPreview"
                  @cerrar-dialogo="cerrarDialogoSequenceInstructivo"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCorrelativos"
      max-width="900px"
      persistent
    >
      <v-card class="correlativos-dialog">
        <!-- BOTÓN CERRAR -->
        <v-btn
          variant="text"
          icon
          class="close-dialog"
          @click="dialogCorrelativos = false"
        >
          <v-icon size="38">
            mdi-close
          </v-icon>
        </v-btn>

        <v-card-text class="pa-0">
          <div class="dialog-content">
            <!-- COLUMNA DEL ICONO -->
            <div class="warning-section">
              <div class="warning-circle">
                <v-icon
                  color="#ff9800"
                  size="100"
                >
                  mdi-alert
                </v-icon>
              </div>
            </div>

            <!-- CONTENIDO -->
            <div class="main-section">
              <div class="dialog-title">
                Correlativos asociados a este House
              </div>

              <div class="dialog-description">
                Se ha detectado que este House tiene varios correlativos
                asociados:
              </div>

              <!-- CORRELATIVOS -->
              <div class="correlativos-list">
                <div
                  v-for="(item, index) in correlativos"
                  :key="index"
                  class="correlativo-item"
                >
                  {{ item.code }}
                </div>
              </div>
            </div>
          </div>

          <!-- INFORMACIÓN -->
          <div class="info-container">
            <div class="info-icon">
              <v-icon
                color="white"
                size="32"
              >
                mdi-information
              </v-icon>
            </div>

            <div class="info-text">
              <div>
                Solo se sustituirán todos los costos del
                <strong>correlativo {{ correlativoPrincipal.code }}</strong>.
              </div>

              <div class="info-secondary">
                Los correlativos
                <strong
                  v-for="(item, index) in correlativosSecundarios"
                  :key="index"
                >
                  {{ item.code
                  }}<span v-if="index < correlativosSecundarios.length - 1">
                    y
                  </span>
                </strong>
                no serán modificados.
              </div>
            </div>
          </div>

          <!-- PREGUNTA -->
          <div class="question-text">
            ¿Deseas continuar?
          </div>
        </v-card-text>

        <!-- FOOTER -->
        <v-card-actions class="dialog-footer">
          <v-btn
            variant="outlined"
            class="btn-cancelar"
            @click="dialogCorrelativos = false"
          >
            Cancelar
          </v-btn>

          <v-btn
            variant="flat"
            class="btn-confirmar"
            @click="continuarAprobarHouses"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.header {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  /* text-align: center !important; */
}
.align-left {
  text-align: left !important;
}
.align-center {
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
.header align-right[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
/* .tableClass:hover[data-v-44bc4a93] { */
/* .v-data-table >>> tr:hover {
  background: unset !important;
} */
.classDialog {
  min-height: 900px !important;
}
</style>
<style scoped>
/* =========================
   DIALOG
========================= */

.correlativos-dialog {
  border-radius: 14px !important;
  overflow: hidden !important;
  background: #ffffff;
  position: relative;
}

/* =========================
   CERRAR
========================= */

.close-dialog {
  position: absolute !important;
  right: 18px;
  top: 16px;
  z-index: 10;
}

.close-dialog .v-icon {
  color: #8a929e;
  font-size: 32px !important;
}

/* =========================
   CONTENIDO PRINCIPAL
========================= */

.dialog-content {
  display: flex;
  padding: 40px 42px 28px 42px;
}

/* =========================
   WARNING
========================= */

.warning-section {
  width: 190px;
  min-width: 190px;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  border-right: 2px solid #e4e8ed;
  padding-top: 5px;
}

.warning-circle {
  width: 125px;
  height: 125px;

  border-radius: 50%;

  background: #fff5dc;

  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-circle .v-icon {
  font-size: 70px !important;
}

/* =========================
   CONTENIDO
========================= */

.main-section {
  padding-left: 38px;
  padding-right: 5px;
  flex: 1;
  min-width: 0;
}

.dialog-title {
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  color: #0d1b3d;
  margin-bottom: 10px;
  padding-right: 35px;
}

.dialog-description {
  font-size: 20px;
  line-height: 1.4;
  color: #667085;
  max-width: 650px;
}

/* =========================
   CORRELATIVOS
========================= */

.correlativos-list {
  display: flex;
  gap: 18px;
  margin-top: 18px;
  width: 100%;
  overflow: hidden;
}

.correlativo-item {
  flex: 1;
  min-width: 0;

  height: 70px;

  border-radius: 10px;

  background: #f0f5fd;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 32px;
  font-weight: 700;

  color: #0d1b3d;
}

/* =========================
   INFORMACIÓN
========================= */

.info-container {
  margin: 0 42px 25px 42px;

  min-height: 95px;

  border-radius: 15px;

  background: #eaf5ff;

  display: flex;
  align-items: center;

  padding: 18px 25px;
}

.info-icon {
  width: 52px;
  height: 52px;

  min-width: 52px;

  border-radius: 50%;

  background: #168be5;

  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon .v-icon {
  font-size: 25px !important;
}

.info-text {
  padding-left: 25px;

  font-size: 19px;
  line-height: 1.45;

  color: #123d75;
}

.info-text strong {
  font-weight: 700;
}

.info-secondary {
  color: #667085;
  margin-top: 3px;
}

/* =========================
   PREGUNTA
========================= */

.question-text {
  padding: 0 42px 28px 42px;

  font-size: 23px;
  font-weight: 400;

  color: #0d1b3d;
}

/* =========================
   FOOTER
========================= */

.dialog-footer {
  border-top: 1px solid #e1e5ea;

  padding: 18px 30px;

  display: flex;
  justify-content: flex-end;

  gap: 15px;
}

.btn-cancelar,
.btn-confirmar {
  height: 52px !important;

  min-width: 170px;

  border-radius: 9px !important;

  font-size: 19px !important;

  font-weight: 700 !important;

  text-transform: none !important;
}

.btn-cancelar {
  border: 2px solid #d4d9e0 !important;
  color: #667085 !important;
  background: #ffffff !important;
}

.btn-confirmar {
  background: #1769e8 !important;
  color: white !important;
}
</style>
