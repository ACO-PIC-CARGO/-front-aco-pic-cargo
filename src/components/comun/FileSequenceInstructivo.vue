<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useAppStore } from "@/stores/app";
import ArrastraYSolarComponent from "./ArrastraYSolarComponentFile.vue";
import { usePuertoStore } from "@/stores/puerto";
import { usePricingStore } from "@/stores/pricing";
import type { ArchivoInicial } from "@/types/archivos";
import type { Modalidad } from "@/types/catalogos";
import type { ProveedorPricing } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";
import type {
  DatosManualesInstructivo,
  DocumentoInstructivo,
  FichaInstructivo,
  Puerto,
  TipoCarga,
} from "@/types/cotizacion";

const props = withDefaults(
  defineProps<{
    aprobadoflag?: boolean;
    verPrevisualizacion?: boolean;
    verDatosPreview?: boolean;
  }>(),
  {
    aprobadoflag: false,
    verPrevisualizacion: true,
    verDatosPreview: true,
  },
);
const emit = defineEmits<{ cerrarDialogo: []; continuar: [] }>();

const route = useRoute();
const appStore = useAppStore();
const filesStore = useFilesStore();
const pricingStore = usePricingStore() as ReturnType<typeof usePricingStore> & {
  emailaddress?: string;
  itemsProveedorList?: FichaInstructivo[];
};
const puertoStore = usePuertoStore();

const txtServicio = useTemplateRef("txtServicio");
const txtEmail = useTemplateRef("txtEmail");

const listaDocumentos = ref<DocumentoInstructivo[]>([
  {
    key: "cotizacion",
    label: "COTIZACIÓN DE VENTAS",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "facturaCommercial",
    label: "FACTURA COMERCIAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "listaEmpaque",
    label: "LISTA DE EMPAQUE",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "proforma",
    label: "PROFORMA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "fichaTecnica",
    label: "FICHA TÉCNICA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soportePagoAlibaba",
    label: "SOPORTE DE PAGO DE ALIBABA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soporteTransferenciaInternacional",
    label: "SOPORTE DE TRANSFERENCIA INTERNACIONAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "otros",
    label: "OTROS",
    flag: false,
    file: null,
    editable: true,
  },
  // {
  //   key: "agregarOtros",
  //   label: "AGREGAR OTROS",
  //   flag: false,
  //   file: null,
  //   editable: true,
  // },
]);
const nro_quote = ref("");
const cboSiNo = [
  { value: true, text: "Si" },
  { value: false, text: "No" },
];
const fecha = ref(moment().format("YYYY-MM-DD HH:MM"));
const tabPreview = ref("op");
const Modality = ref<Partial<Modalidad> | null>(null);
const Shipment = ref<Partial<TipoCarga>>({ code: "" });
const Proveedor = ref<FichaInstructivo>({
  namelong: "",
});
const proveedorInstructivo = ref<FichaInstructivo>({
  namelong: "",
});
const asesor = ref<FichaInstructivo>({});
const asesorPricing = ref<FichaInstructivo>({});
const incoterms = ref<FichaInstructivo>({});
const proveedor = ref<FichaInstructivo>({});
const cliente = ref<FichaInstructivo>({});
const pricing = pricingStore;
const datosPrincipales = pricingStore.datosPrincipales;
const filesLinkPagoAlibaba = ref<{ name?: string; nombre?: string }[]>([]);
const datosFile = ref<unknown[]>([]);
const e6 = ref(1);
const datosManualesNoAplica = ref<Record<string, boolean>>({
  servicio: false,
  email: false,
  monto: false,

  clientePago: false,
  linkDePago: false,
  condiciones: false,
  nroFactura: false,
  seguro: false,
  observacion1: false,
  observacion2: false,
});
const datosManuales = ref<DatosManualesInstructivo>({
  servicio: "",
  email: "",
  monto: 0,
  listDiaFecha: "",
  grupoWhatsapp: "",
  pagarProveedor: true,
  metodoPagarProveedor: "1",
  condicionesLink: "",
  dondePagar: "",
  clientePago: "",
  linkDePago: "",
  linkDePagoAlibaba: "",
  condiciones: "",
  nroFactura: "",
  seguro: "",
  observacion1: "",
  observacion2: "",
  id_path: [],
  montoRecibido: 0,
  bancoBenbeficiario: "",
  direccionBancoBeneficiario: "",
  nombreBeneficiario: "",
  direccionBeneficiario: "",
  numeroCuentaBeneficiario: null,
  paisReceptor: null,
  porcentajePago: 0,
  cotizacionDeVentasFlag: false,
  cotizacionFlag: false,
  facturaCommercialFlag: false,
  listaEmpaqueFlag: false,
  proformaFlag: false,
  fichaTecnicaFlag: false,
  soportePagoAlibabaFlag: false,
  soporteTransferenciaInternacionalFlag: false,
  otrosFlag: false,
  agregarOtrosFlag: false,
  cotizacionDeVentas: null,
  cotizacion: null,
  facturaCommercial: null,
  listaEmpaque: null,
  proforma: null,
  fichaTecnica: null,
  soportePagoAlibaba: null,
  soporteTransferenciaInternacional: null,
  otros: null,
  agregarOtros: null,
  numeroContratoAlibaba: null,
});
const puertoOrigen = ref<Puerto | null>(null);

const puertoDestino = ref<Puerto | null>(null);

const mostrarPagarProveedorAlibaba = computed(() => {
  if (datosManuales.value.pagarProveedor) {
    if (datosManuales.value.metodoPagarProveedor == 1) {
      return true;
    }
  }
  return false;
});
const mostrarPagarProveedorInternacional = computed(() => {
  if (datosManuales.value.pagarProveedor) {
    if (datosManuales.value.metodoPagarProveedor == 2) {
      return true;
    }
  }
  return false;
});

const formatearArchivos = computed(() => {
  // Filtramos solo los que tienen el flag activo (el checkbox marcado)
  const seleccionados = listaDocumentos.value.filter((doc) => doc.flag);

  if (seleccionados.length === 0) {
    return "No hay archivos seleccionados";
  }

  return seleccionados
    .map((doc) => {
      let nombreLimpio = "";

      // Validamos si existe el objeto file y si tiene un nombre
      if (doc.file && (doc.file as { name?: string }).name) {
        const nombreRaw = (doc.file as { name?: string }).name!;
        // Limpiamos si es una URL de OneDrive/S3 o similar
        nombreLimpio = nombreRaw.includes("http")
          ? nombreRaw.substring(nombreRaw.lastIndexOf("/") + 1)
          : nombreRaw;
      } else {
        // SI NO HAY ARCHIVO PERO EL FLAG ESTÁ ACTIVO
        nombreLimpio = "DOCUMENTO CONFIRMADO";
      }

      // Retornamos el formato con negritas y el detalle
      return `• <b>${doc.label.toUpperCase()}:</b> ${nombreLimpio}`;
    })
    .join("<br />");
});


const rehidratarDesdeFormatoViejo = undefined as unknown as (datos: unknown) => void;
const itemsProveedorList = undefined as FichaInstructivo[] | undefined;

watch(() => pricingStore.datosPrincipales.datosinstructivomanual, (newData) => {
  if (newData && newData.listaDocumentos) {
    listaDocumentos.value = JSON.parse(
      JSON.stringify(newData.listaDocumentos),
    );
  } else if (newData) {
    rehidratarDesdeFormatoViejo(newData);
  }
}, { immediate: true, deep: true });

function pasarASeguro() {
  e6.value = 23;
}
function continuarPagarProveedor() {
  if (!datosManuales.value.pagarProveedor) {
    cambiarPagarProvedor();
  } else {
    continuar();
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cargarArchivo(datoEmit: { id?: unknown; archivo?: unknown } | null | undefined, name: string) {
  if (datoEmit) {
    const flagName = name.replace("File", "Flag");

    datosManuales.value[name] = {
      id: datoEmit.id,
      archivo: datoEmit.archivo,
      name: name,
    };

    datosManuales.value[flagName] = true;
    filesLinkPagoAlibaba.value.push(datosManuales.value[name] as { name?: string });
  }
}
function cargarArchivoDinamico(datoEmit: { archivo?: unknown }, doc: DocumentoInstructivo) {
  doc.file = datoEmit.archivo;
  doc.flag = true;
}
function eliminarArchivoDinamico(doc: DocumentoInstructivo) {
  doc.file = null;
  doc.flag = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function eliminarArchivoPadre(name: string) {

  const flagName = name.replace("File", "Flag");
  datosManuales.value[flagName] = false;

  filesLinkPagoAlibaba.value = filesLinkPagoAlibaba.value.filter(
    (file) => file.name !== name,
  );

  datosManuales.value[name] = null;
}
function cambiarPagarProvedor() {
  datosManuales.value.condicionesLink = "No Aplica";
  datosManuales.value.dondePagar = "No Aplica";
  datosManuales.value.clientePago = "No Aplica";
  datosManuales.value.linkDePago = "No Aplica";
  datosManuales.value.condiciones = "No Aplica";
  datosManuales.value.nroFactura = "No Aplica";
  e6.value = 13;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarEmail() {
  if (!datosManuales.value.servicio) {
    txtServicio.value!.focus();
    return;
  }
  e6.value = 2;
}

function setDatosInstructivo() {
  if (listaDocumentos.value.some((v) => !v.flag && v.key == "cotizacion")) {
    Swal.fire({
      icon: "warning",
      title: "Soporte de Cotización",
      text: "Es Requerido adjuntar: COTIZACIÓN DE VENTAS ",
    });
    return;
  }

  pricingStore.guardarDatosInstructivo({
    id: route.params.id,
    datosInstructivoManual: {
      ...datosManuales.value,
      listaDocumentos: listaDocumentos.value,
      table_allpath_list: listaDocumentos.value,
    },
  });
  emit("continuar");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarListaDiaFecha() {
  if (!datosManuales.value.email) {
    txtEmail.value!.focus();
    return;
  }
  e6.value = 3;
}
function continuar() {
  e6.value++;
}
function regresar() {
  e6.value--;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _uploadFile(file: File) {
  const data = new FormData();
  const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
  data.append("name", nameWithoutExtension);
  data.append("file", file);
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
    headers: {},
    data: data,
  };

  try {
    const response = await axios(config);
    const res = response.data.data[0];

    datosManuales.value.id_path.push(res.insertid);
    datosFile.value.push({
      name: nameWithoutExtension,
      url: res.ruta,
    });

    await filesStore.uploadFileFromUrlToOneDrive({
      fileUrl: res.ruta,
      destinationFolderUrl:
        pricingStore.datosPrincipales.url_folderonedrive,
    });
  } catch (error) {
    console.error(error);
  }
}
function guardarYGenenarCorreo() {
  Promise.all([
    pricingStore.guardarDatosInstructivo({
      id: route.params.id,
      datosInstructivoManual: {
        ...datosManuales.value,
        listaDocumentos: listaDocumentos.value,
        table_allpath_list: listaDocumentos.value,
      },
    }),
    generarHTML(),
    generarHTMLPDF(true),
  ]);
}
async function generarHTMLPDF(guardarFlag?: boolean) {
  const state = pricingStore;
  const main = state.datosPrincipales;
  const cliente = state.dataCliente;

  const nro_quote_clean = (state.nro_quote || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  const subjectStr = `INSTRUCTIVO_VENTAS_${nro_quote_clean}_EXPEDIENTE_${pricing.nro_exp}`;
  const subject = encodeURIComponent(subjectStr);
  const dataBranch =
    JSON.parse(sessionStorage.getItem("dataBranch") as string)?.[0] || {};
  const esAlibaba = !!mostrarPagarProveedorAlibaba.value;
  const esInternacional = !!mostrarPagarProveedorInternacional.value;
  const requierePagar =
    datosManuales.value.pagarProveedor === true ||
    datosManuales.value.pagarProveedor === "Si" ||
    esAlibaba ||
    esInternacional;

  await pricingStore.quotePreviewInstructivoManual({
    ...datosManuales.value,

    guardarFlag: guardarFlag,
    subject: subject,
    asesor: asesor.value.name || "",
    asesorPricing: asesorPricing.value.name || "",
    nro_quote: state.nro_quote || "",
    PortBegin: puertoOrigen.value!.name || "",
    Incoterms: incoterms.value.name || "",
    peso: main.peso || 0,
    volumen: main.volumen || 0,
    descripcioncarga: main.descripcioncarga || "",

    nombrecompletoProveedor: proveedor.value.namelong || "",
    contactoProveedor: proveedor.value.contacto || "",
    addressProveedor: proveedor.value.emailaddress || "",
    contactoPhoneProveedor: proveedor.value.contacto_phone || "",

    nombrecompletoCliente: cliente.nombrecompleto || "",
    documentCliente: cliente.document || "",
    addressCliente: cliente.address || "",
    emailaddressCliente: state.emailaddress || "",

    Shipment: Shipment.value.code || "",
    url_folderonedrive: datosPrincipales.url_folderonedrive,
    url_folderonedriveexp: datosPrincipales.url_folderonedriveexp,

    namelongColoader: proveedorInstructivo.value.namelong || "",
    contactoColoader: proveedorInstructivo.value.contacto || "",
    phoneColoader: proveedorInstructivo.value.contacto_phone || "",

    seAdjunta:
      filesLinkPagoAlibaba.value?.length > 0
        ? filesLinkPagoAlibaba.value
            .map((file) => `• ${file.nombre || file}`)
            .join("<br />")
        : "No hay archivos",

    url_logo: dataBranch.logo || "",
    document: dataBranch.document || "",
    address: dataBranch.address || "",
    phone: dataBranch.phone || "",

    pagarProveedor: requierePagar,
    mostrarPagarProveedorAlibaba: esAlibaba,
    mostrarPagarProveedorInternacional: esInternacional,
    listaDocumentos: listaDocumentos.value,
  });
}
async function generarHTML() {
  const documentosSeleccionados = listaDocumentos.value.filter(
    (doc) => doc.flag,
  );

  const listaArchivos =
    documentosSeleccionados.length > 0
      ? documentosSeleccionados
          .map((doc) => {
            let nombreArchivo = "";

            // VALIDACIÓN: Si hay archivo, extraemos el nombre; si no, ponemos el aviso
            if (doc.file) {
              const nombreRaw =
                (doc.file as { name?: string }).name ||
                (typeof doc.file === "string" ? doc.file : "");

              // Limpiamos el nombre si viene con la ruta completa
              nombreArchivo = nombreRaw.includes("/")
                ? nombreRaw.substring(nombreRaw.lastIndexOf("/") + 1)
                : nombreRaw;
            } else {
              // SI EL FLAG ESTÁ ACTIVO PERO NO HAY ARCHIVO
              nombreArchivo = "DOCUMENTO CONFIRMADO";
            }

            const detalle = `: <span style="color: #555;">${nombreArchivo}</span>`;

            return `• <b>${doc.label.toUpperCase()}</b>${detalle}`;
          })
          .join("<br />")
      : "No hay archivos seleccionados";

  let datosPagoAlibaba = "";
  if (mostrarPagarProveedorAlibaba.value) {
    datosPagoAlibaba = `
      <b>MONTO A PAGAR:</b> ${datosManuales.value.monto || ""}<br>
      <b>CLIENTE YA NOS PAGÓ:</b> ${datosManuales.value.clientePago || ""}<br>
      <b>MONTO RECIBIDO DEL CLIENTE:</b> ${
    datosManuales.value.montoRecibido || ""
  }<br>
      <b>FECHA DE PAGO DEL CLIENTE:</b> ${
    datosManuales.value.fechaPagoCliente || ""
  }<br>
      <b>LINK DE PAGO ALIBABA:</b> ${
    datosManuales.value.linkDePagoAlibaba || ""
  }<br>
      <b>NÚMERO DE CONTRATO DE ALIBABA:</b> ${
    datosManuales.value.numeroContratoAlibaba || ""
  }
        `;
  }
  let datosPagoInternacional = "";
  if (mostrarPagarProveedorInternacional.value) {
    datosPagoInternacional = `
      <b>MONTO A PAGAR:</b> ${datosManuales.value.monto || ""}<br>
      <b>Nro Factura:</b> ${datosManuales.value.nroFactura || ""}<br>
      <b>Banco Beneficiario:</b> ${
    datosManuales.value.bancoBenbeficiario || ""
  }<br>
      <b>Dirección del banco beneficiario:</b> ${
    datosManuales.value.direccionBancoBeneficiario || ""
  }<br>
      <b>Nombre del Beneficiario:</b> ${
    datosManuales.value.nombreBeneficiario || ""
  }<br>
      <b>Dirección del Beneficiario:</b> ${
    datosManuales.value.direccionBeneficiario || ""
  }<br>
      <b>Número de Cuenta:</b> ${
    datosManuales.value.numeroCuentaBeneficiario || ""
  }<br>
      <b>Porcentaje de Pago:</b> ${datosManuales.value.porcentajePago || ""}<br>
      <b>País Receptor:</b> ${datosManuales.value.paisReceptor || ""}
              `;
  }

  const valorDatosBancarios = mostrarPagarProveedorAlibaba.value
    ? datosPagoAlibaba
    : mostrarPagarProveedorInternacional.value
    ? datosPagoInternacional
    : "No especificado";

  const htmlTable = `
    <p style="font-family: Arial, sans-serif;">Hola Compañero,</p>
    <p style="font-family: Arial, sans-serif;">Hemos logrado cerrar esta nueva carga, abajo los detalles:</p>
    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-family: Arial, sans-serif; width: 100%;">
      <tbody>
        ${_tr("FECHA", moment().format("DD/MM/YYYY"))}
       ${_tr(
     "ASESOR/ PRICING",
     `${asesor.value?.name || ""} / ${asesorPricing.value?.name || ""}`,
   )}
    ${_tr("N° QUOTE", pricing.nro_quote)}
    ${_tr("TIPO DE EMBARQUE", Shipment.value.code)}
        ${_tr("SERVICIO", datosManuales.value.servicio)}
        ${_tr(
      "COLOADER/AGENTE",
      `
          <b>Datos:</b> ${proveedorInstructivo.value.namelong || ""}<br>
          <b>Contacto:</b> ${proveedorInstructivo.value.contacto || ""}<br>
          <b>Teléfono:</b> ${proveedorInstructivo.value.contacto_phone || ""}
        `,
    )}
        ${_tr("Email de Seguimiento", datosManuales.value.email)}
        ${_tr("PUERTO DE SALIDA", puertoOrigen.value!.name || "")}
        ${_tr(
      "DATOS DE LA CARGA<br><span style='color:red;font-size:10px;'>Si es EXW enviar dirección de recolecta</span>",
      `
          <b>INCOTERMS:</b> ${incoterms.value.name || ""}<br>
          <b>PESO:</b> ${datosPrincipales.peso || 0} KG<br>
          <b>VOLUMEN:</b> ${datosPrincipales.volumen || 0} M3<br>
          <b>TIPO DE MERCANCIA:</b> ${
        datosPrincipales.descripcioncarga || ""
      }
        `,
    )}
        ${_tr(
      "DETALLES DEL PROVEEDOR",
      `
          <b>NOMBRE:</b> ${proveedor.value.namelong || ""}<br>
          <b>CONTACTO:</b> ${proveedor.value.contacto || ""}<br>
          <b>EMAIL:</b> <a href="mailto:${
        proveedor.value.emailaddress || ""
      }">${proveedor.value.emailaddress || ""}</a><br>
          <b>TELÉFONO:</b> ${proveedor.value.contacto_phone || ""}
        `,
    )}
        ${_tr(
      "CLIENTE / RAZON SOCIAL",
      `
          <b>NOMBRE:</b> ${pricing.dataCliente.nombrecompleto || ""}<br>
          <b>RUC:</b> ${pricing.dataCliente.document || ""}<br>
          <b>DIRECCIÓN:</b> ${pricing.dataCliente.address || ""}<br>
          <b>EMAIL:</b> ${pricing.emailaddress || ""}
        `,
    )}
        ${_tr(
      "<b>NOTIFY</b>",
      `
          PIC LOGISTICA SAC <br>
          RUC: 20609852861 <br>
          AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
          Contacto: Carlos Ramirez <br>
          CORREO: ASESOR2@PIC-CARGO.COM
        `,
    )}
        ${_tr(
      "<b>CARGA LISTA DIA FECHA</b>",
      datosManuales.value.listDiaFecha,
    )}
        ${_tr(
      "<b>GRUPO DE WHATSAPP</b>",
      datosManuales.value.grupoWhatsapp,
    )}
        ${_tr("<b>SE ADJUNTA</b>", listaArchivos)}
        ${_tr(
      "<b>TIPO DE MERCANCIA</b>",
      datosPrincipales.descripcioncarga || "",
    )}
        ${_tr(
      "<b>DEBEMOS PAGAR AL PROVEEDOR</b><br><span style='color:red;font-size:10px;'>Solo aplica si el cliente nos cancela a nosotros y debemos pagar al proveedor</span>",
      datosManuales.value.pagarProveedor ? "Si" : "No",
    )}
        
        ${
      mostrarPagarProveedorAlibaba.value
        ? _tr(
            "<b>DONDE SE DEBE PAGAR</b>",
            datosManuales.value.dondePagar,
          )
        : ""
    }
        
        ${
      datosManuales.value.pagarProveedor
        ? _tr(
            "<b>DATOS BANCARIOS PARA TRANSFERENCIA</b>",
            valorDatosBancarios,
          )
        : ""
    }
        
        ${_tr("<b>SEGURO DE MERCANCIA</b>", datosManuales.value.seguro)}
        ${_tr(
      "OBSERVACIONES ADICIONALES 1",
      datosManuales.value.observacion1,
    )}
        ${_tr(
      "OBSERVACIONES ADICIONALES 2",
      datosManuales.value.observacion2,
    )}
        ${
      datosPrincipales.url_folderonedriveexp
        ? _tr(
            "CARPETA OPERATIVA",
            `<a href="${datosPrincipales.url_folderonedriveexp}" target="_blank" style="color: blue; font-weight: bold;">CLICK AQUÍ</a>`,
          )
        : ""
    }
      </tbody>
    </table>
    <br>
    <p style="font-family: Arial, sans-serif;">Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos.</p>
  `;

  try {
    const blob = new Blob([htmlTable], { type: "text/html" });
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": blob }),
    ]);
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
    }).then((res) => {
      if (res.isConfirmed) {
        const clean = (str?: string | null) =>
          str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

        const subject = `EXPEDIENTE-${pricing.nro_exp} | QUOTE${
          pricing.nro_quote
        } ${clean(pricing.dataCliente.nombrecompleto)} ${clean(
          incoterms.value.name,
        )} ${clean(Modality.value!.name!.toUpperCase())} | AGREGAR INSTRUCTIVO INTERNO`;

        const body =
          "Hola colega, adjunto los detalles del expediente (Pega la tabla aquí):\n\n";

        setTimeout(() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(
            subject,
          )}&body=${encodeURIComponent(body)}`;
          abrirModalSegundoCorreo();
        }, 500);
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

function abrirModalSegundoCorreo() {
  setTimeout(() => {
    Swal.fire({
      icon: "info",
      title: "",
      html: `
          <h1 style="font-size: 2.5em; font-weight: bold;">📧 Crear email al agente</h1>

              <h1 style="font-size: 2em; font-weight: bold;">🚨 OBLIGATORIO</h1>
              <h2 style="font-size: 1.5em;">Antes de abrir el segundo correo, primero envía el email a Operaciones.</h2>
            `,
      confirmButtonText: "☑️ Ya envié el email a Operaciones. Continuar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "#00C853",
      cancelButtonColor: "red",
      customClass: {
        title: "custom-title-class",
        confirmButton: "custom-button-class",
      },
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();
        confirmBtn!.style.display = "none";
        cancelBtn!.style.display = "none";
        setTimeout(() => {
          confirmBtn!.style.display = "inline-block";
          cancelBtn!.style.display = "inline-block";
        }, 2000);
      },
    }).then((res) => {
      if (res.isConfirmed) {
        GenerartSegundoCorreo();
      }
    });
  }, 3000);
}
async function GenerartSegundoCorreo() {
  const cargaDetalles = `
            <strong>INCOTERMS:</strong> ${incoterms.value.name || ""}<br/>
            <strong>PESO:</strong> ${datosPrincipales.peso || 0} KG <br/>
            <strong>VOLUMEN:</strong> ${
          datosPrincipales.volumen || 0
        } M3 <br/>
            <strong>TIPO DE MERCANCIA:</strong> ${
          datosPrincipales.descripcioncarga || ""
        }
                `;

  const proveedorDetalles = `
            NOMBRE: ${proveedor.value.namelong || ""}<br>
            CONTACTO: ${proveedor.value.contacto || ""}<br>
            EMAIL: ${proveedor.value.emailaddress || ""}<br>
            TELÉFONO: ${proveedor.value.contacto_phone || ""}
          `;

  const clienteDetalles = `
          ${pricing.dataCliente.nombrecompleto || ""}<br />
              RUC: ${pricing.dataCliente.document || ""}<br />
              DIRECCION: ${pricing.dataCliente.address || ""} <br />
              EMAIL: ${
            pricing.emailaddress
              ? `<a href="mailto:${pricing.emailaddress}">${pricing.emailaddress}</a>`
              : ""
          }
        `;

  const htmlBody = `
            <p>Hola Colega Por aquí tenemos una nueva carga, por indicarnos tu numero de routing order y que Customer seguirá el tema</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
              <tbody>
                ${_tr("PUERTO DE SALIDA", puertoOrigen.value!.name || "")}
            ${_tr("TIPO DE EMBARQUE", Shipment.value.code || "")}
                ${_tr(
              "DATOS DE LA CARGA<br/><small style='font-weight:normal;'>Si es EXWORK enviar dirección de recolecta</small>",
              cargaDetalles,
            )}
                ${_tr("DETALLES DEL PROVEEDOR", proveedorDetalles)}
                ${_tr("CLIENTE / RAZON SOCIAL", clienteDetalles)}
                ${_tr(
              "NOTIFY",
              "PIC LOGISTICA SAC<br/>RUC: 20609852861<br/>AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br/>Contacto: Carlos Ramirez<br/>CORREO: ASESOR2@PIC-CARGO.COM",
            )}
                ${_tr(
              "CARGA LISTA DIA FECHA",
              datosManuales.value.listDiaFecha || "Pendiente",
            )}
              </tbody>
            </table>
          <p>Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos</p>`;

  try {
    const blob = new Blob([htmlBody], { type: "text/html" });
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": blob }),
    ]);

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
      timer: 2500,
    });

    const clean = (str?: string | null) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const subject = `EXPEDIENTE-${pricing.nro_exp} | QUOTE${
      pricing.nro_quote
    } ${clean(pricing.dataCliente.nombrecompleto)} ${clean(
      incoterms.value.name,
    )} ${clean(Modality.value!.name!.toUpperCase())}`;

    window.location.href = `mailto:${
      cliente.value.emailaddress || ""
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      "Hola colega, (PEGA LA TABLA AQUÍ)",
    )}`;

    emit("continuar");
  } catch (err) {
    console.error("Error:", err);
  }
}
function checkNoAplica(step: number) {
  const campos: Record<number, string> = {
    1: "servicio",
    2: "email",
    3: "listDiaFecha",
    4: "grupoWhatsapp",
    6: "pagarProveedor",
    7: "dondePagar",
    8: "monto",
    9: "clientePago",
    10: "linkDePago",
    11: "condicionesLink",
    12: "nroFactura",
    13: "seguro",
    24: "observacion1",
    25: "observacion2",
  };

  const propiedad = campos[step];

  if (propiedad) {
    datosManuales.value[propiedad] = datosManualesNoAplica.value[propiedad]
      ? "No Aplica"
      : "";
  }
}
function _tr(label: string, value?: unknown) {
  return `
    <tr>
      <td valign="top" style="width:123pt; border:solid windowtext 1.0pt; padding:4pt;">
        <p style="margin:0; font-size:11px;">${label}</p>
      </td>
      <td valign="top" style="border:solid windowtext 1.0pt; border-left:none; padding:4pt;">
        <p style="margin:0; font-size:11px;">${value || ""}</p>
      </td>
    </tr>`;
}

function cargarDatosModality() {
  if (!pricing?.listModality || !datosPrincipales) return;
  Modality.value =
    pricing.listModality.find(
      (v) => v.id == datosPrincipales.idsentido,
    ) || {};
}

function cargarDatosShipment() {
  if (!pricing?.listShipment || !datosPrincipales) return;
  Shipment.value =
    pricing.listShipment.find(
      (v) => v.id == datosPrincipales.idtipocarga,
    ) || {};
}

// Shadowed by the later cargarDatosProveedor, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cargarDatosProveedorSombreado() {
  const lista = pricing?.itemsProveedorList || itemsProveedorList;
  if (!lista || !datosPrincipales) return;

  Proveedor.value =
    lista.find((v) => v.id == datosPrincipales.id_proveedor) || {};
}
function cargarDatosAsesor() {
  asesor.value = encontrar(
    pricing.listEjecutivo,
    datosPrincipales.id_vendedor,
    "id_entitie",
  );
}
function cargarDatosAsesorPricing() {
  asesorPricing.value = encontrar(
    pricing.listEjecutivo,
    datosPrincipales.id_pricing,
    "id_entitie",
  );
}
function cargarDatosIncoterms() {
  incoterms.value = encontrar(
    pricing.listIncoterms,
    datosPrincipales.idincoterms,
  );
}

function cargarDatosProveedor() {

  proveedor.value = encontrar(
    appStore.itemsProveedorList,
    datosPrincipales.id_proveedor,
  );
}
function cargarDatosCliente() {
  cliente.value = { ...pricingStore.dataCliente };
  cliente.value.nombre_clean = (cliente.value.nombrecompleto || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function encontrar(lista: object[], id: unknown, campo = "id"): FichaInstructivo {
  return (lista.find((v) => (v as Record<string, unknown>)[campo] == id) || {}) as FichaInstructivo;
}

function cargaNroQuote() {
  if (!pricing?.nro_quote) {
    nro_quote.value = "";
    return;
  }
  nro_quote.value = pricing.nro_quote
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payPath: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payfile: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let msgfile = "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let errfile = "";
// It watched a name this component never had, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recibirId(file: { inserid?: unknown; archivo?: unknown }) {
  payPath = file.inserid;
  payfile = file.archivo;

  msgfile = "Archivo procesado y vinculado correctamente.";
  errfile = "";
}

onMounted(async () => {
  if (props.aprobadoflag) {
    e6.value = 26;
  }
  Promise.all([
    cargarDatosModality(),
    cargarDatosShipment(),
    cargarDatosIncoterms(),
    cargarDatosProveedor(),
    cargaNroQuote(),
    cargarDatosAsesor(),
    cargarDatosIncoterms(),
    cargarDatosCliente(),
    cargarDatosAsesorPricing(),
  ]);

  const tipoCargaItem = pricingStore.listShipment.find(
    (v) => v.id == pricingStore.datosPrincipales.idtipocarga,
  );

  const idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;
  if (pricingStore.datosPrincipales.datosinstructivomanual) {
    datosManuales.value =
      pricingStore.datosPrincipales.datosinstructivomanual;
    datosFile.value =
      pricingStore.datosPrincipales.datosinstructivomanual.table_allpath_list as unknown[];
    const opcionCostos = pricingStore.opcionCostos.filter(
      (v) => !!v.selected,
    );
    const costosFlete = opcionCostos[0]!.listCostos.filter(
      (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
    );

    const proveedoresUnicos = [
      ...new Set(costosFlete.map((v) => v.id_proveedor)),
    ];
    const idBuscado =
      proveedoresUnicos.length > 0 ? proveedoresUnicos[0] : null;
    proveedorInstructivo.value =
      appStore.provedores.find((v: ProveedorPricing) => v.id == idBuscado) || {};
  }
  puertoOrigen.value = (await puertoStore.verPuerto({
    id_transport: idTipoCarga as number | undefined,
    id: pricingStore.datosPrincipales.idorigen!,
  })) as Puerto | null;
  puertoDestino.value = (await puertoStore.verPuerto({
    id_transport: idTipoCarga as number | undefined,
    id: pricingStore.datosPrincipales.iddestino!,
  })) as Puerto | null;
});

watch(() => datosManuales.value.cotizacionFile, () => {
  if (!datosManuales.value.cotizacionFile) {
    datosManuales.value.cotizacionFlag = false;
  }
});
watch(() => datosManuales.value.facturaCommercial, () => {
  if (!datosManuales.value.facturaCommercial) {
    datosManuales.value.facturaCommercialFlag = false;
  }
});
watch(() => datosManuales.value.listaEmpaque, () => {
  if (!datosManuales.value.listaEmpaque) {
    datosManuales.value.listaEmpaqueFlag = false;
  }
});
watch(() => datosManuales.value.proforma, () => {
  if (!datosManuales.value.proforma) {
    datosManuales.value.proformaFlag = false;
  }
});
watch(() => datosManuales.value.fichaTecnica, () => {
  if (!datosManuales.value.fichaTecnica) {
    datosManuales.value.fichaTecnicaFlag = false;
  }
});
watch(() => datosManuales.value.soportePagoAlibaba, () => {
  if (!datosManuales.value.soportePagoAlibaba) {
    datosManuales.value.soportePagoAlibabaFlag = false;
  }
});
watch(() => datosManuales.value.soporteTransferenciaInternacional, () => {
  if (!datosManuales.value.soporteTransferenciaInternacional) {
    datosManuales.value.soporteTransferenciaInternacionalFlag = false;
  }
});
watch(() => datosManuales.value.otros, () => {
  if (!datosManuales.value.otros) {
    datosManuales.value.otrosFlag = false;
  }
});
watch(() => datosManuales.value.agregarOtros, () => {
  if (!datosManuales.value.agregarOtros) {
    datosManuales.value.agregarOtrosFlag = false;
  }
});
</script>

<template>
  <v-card>
    <v-container
      fluid
      class="px-5"
    >
      <v-row no-gutters>
        <v-col
          v-if="verDatosPreview"
          :cols="verPrevisualizacion ? 5 : 12"
        >
          <div class="clsSequence">
            <v-stepper-vertical
              v-model="e6"
              non-linear
              hide-actions
            >
              <!-- SERVICIO -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 1"
                :value="1"
                title="SERVICIO"
              >
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      placeholder="Individual/ Grupal"
                      v-model="datosManuales.servicio"
                      ref="txtServicio"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>

              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 2"
                :value="2"
                title="EMAIL DE SEGUIMIENTO"
              >
                <v-row>
                  <v-col cols="12">
                    <p class="text-red">
                      Email de Seguimiento con el coloader o Agente donde se
                      consiguió la tarifa
                    </p>
                    <v-text-field
                      placeholder="example@mail.com"
                      v-model="datosManuales.email"
                      ref="txtEmail"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>

              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 3"
                :value="3"
                title="CARGA LISTA DIA FECHA"
                class="pt-0"
              >
                <v-row>
                  <v-col
                    cols="12"
                    class="pt-0"
                  >
                    <v-textarea
                      rows="1"
                      auto-grow
                      placeholder=""
                      v-model="datosManuales.listDiaFecha"
                      ref="txtcondiciones"
                      class="txtNroFactura"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 4"
                :value="4"
                title="GRUPO DE WHATSAPP"
              >
                <v-row>
                  <v-col cols="12">
                    <v-textarea
                      rows="1"
                      auto-grow
                      placeholder=""
                      v-model="datosManuales.grupoWhatsapp"
                      ref="txtcondiciones"
                      class="txtNroFactura"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 5"
                :value="5"
                title="SE ADJUNTA"
              >
                <v-row>
                  <v-col cols="12">
                    <p class="text-red">
                      si se adjunta todo lo que más puedas facturas permisos,
                      fotos, y cualquier información relevante
                    </p>
                  </v-col>
                  <v-col cols="12">
                    <v-table>
                      <tbody>
                        <tr
                          v-for="(doc, index) in listaDocumentos"
                          :key="index"
                        >
                          <td width="5%">
                            <v-checkbox
                              v-model="doc.flag"
                              color="success"
                              hide-details
                            />
                          </td>

                          <td width="45%">
                            <div v-if="doc.editable">
                              <v-text-field
                                v-model="doc.label"
                                density="compact"
                                hide-details
                                placeholder="Nombre del documento personalizado"
                                variant="underlined"
                              />
                            </div>
                            <div v-else>
                              {{ doc.label }}
                            </div>
                          </td>

                          <td width="50%">
                            <ArrastraYSolarComponent
                              :id="doc.key"
                              :archivo-inicial="doc.file as ArchivoInicial"
                              @archivo-cargado="
                                (datoEmit) =>
                                  cargarArchivoDinamico(datoEmit, doc)
                              "
                              @archivo-eliminado="eliminarArchivoDinamico(doc)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar()"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>

              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 6"
                :value="6"
                title="DEBEMOS PAGAR AL PROVEEDOR"
              >
                <v-row>
                  <v-col cols="12">
                    <p class="text-red">
                      solo aplica si el cliente nos cancela a nosotros y
                      nosotros debemos pagar al proveedor
                    </p>
                    <v-select
                      item-title="text"
                      density="compact"
                      :items="cboSiNo"
                      v-model="datosManuales.pagarProveedor"
                      variant="outlined"
                      label="Si/ No"
                      hide-details
                      style="width: 120px; margin-top: 10px"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuarPagarProveedor"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>

              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 7"
                v-if="datosManuales.pagarProveedor"
                :value="7"
                title="ESCOGE UNA OPCIÓN DE PAGO"
              >
                <v-row>
                  <v-col cols="12">
                    <v-radio-group
                      v-model="datosManuales.metodoPagarProveedor"
                      density="compact"
                    >
                      <v-radio
                        label="Pago por Alibaba"
                        value="1"
                      />
                      <v-radio
                        label="Transferencia Internacional"
                        value="2"
                      />
                      <v-radio
                        label="Otros"
                        value="3"
                      />
                    </v-radio-group>
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
              <!-- MONTO A PAGAR -->
              <div
                class=""
                v-if="datosManuales.pagarProveedor"
              >
                <!-- Monto -->
                <v-stepper-vertical-item
                  :editable="true"
                  :complete="e6 > 8"
                  :value="8"
                  title="MONTO A PAGAR"
                >
                  <v-row>
                    <v-col cols="12">
                      <p class="text-red">
                        Solo aplica si el cliente nos cancela a nosotros...
                      </p>
                      <v-text-field
                        v-model="datosManuales.monto"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continue
                      </v-btn>
                      <v-btn
                        color="error"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-stepper-vertical-item>
                <!-- ALIBABA -->
                <div v-if="mostrarPagarProveedorAlibaba">
                  <!--  -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 9"
                    v-if="datosManuales.pagarProveedor"
                    :value="9"
                    title="CLIENTE YA NOS PAGÓ"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-select
                          item-title="text"
                          :items="cboSiNo"
                          v-model="datosManualesNoAplica.clientePago"
                          variant="outlined"
                          label="Si/ No"
                          style="width: 120px; margin-top: 10px"
                          hide-details
                        />
                        <v-text-field
                          v-model="datosManuales.clientePago"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- MONTO RECIBIDO  -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 10"
                    :value="10"
                    title="MONTO RECIBIDO DEL CLIENTE"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          type="number"
                          v-model="datosManuales.montoRecibido"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- FECHA DE PAGO DEL CLIENTE -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 11"
                    :value="11"
                    title="FECHA DE PAGO DEL CLIENTE"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          type="date"
                          v-model="datosManuales.fechaPagoCliente"
                          style="width: 280px"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- LINK DE PAGO ALIBABA -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 12"
                    :value="12"
                    title="LINK DE PAGO ALIBABA"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          name="linkPagoAlibaba"
                          label="Link de Pago Alibaba"
                          id="linkPagoAlibaba"
                          v-model="datosManuales.linkDePagoAlibaba"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- NRO DE CONTRATO DE ALIBABA -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 13"
                    :value="13"
                    title="NÚMERO DE CONTRATO DE ALIBABA"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          name="linkPagoAlibaba"
                          label="Número de Contrato de Alibaba (De Acuerdo a la Factura comercial)"
                          id="numeroContratoAlibaba"
                          v-model="datosManuales.numeroContratoAlibaba"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="pasarASeguro"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                </div>

                <div v-if="mostrarPagarProveedorInternacional">
                  <!-- Nro Factura -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 14"
                    :value="14"
                    title="NRO DE FACTURA"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-checkbox
                          v-model="datosManualesNoAplica.nroFactura"
                          @update:model-value="checkNoAplica(13)"
                          label="No Aplica"
                        />
                        <v-text-field
                          v-model="datosManuales.nroFactura"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- Banco Beneficiario o Cuenta Beneficiario -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 15"
                    :value="15"
                    title="BANCO BENEFICIARIO"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.bancoBenbeficiario"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>

                  <!-- Dirección del banco beneficiario -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 16"
                    :value="16"
                    title="DIRECCIÓN DEL BANCO BENEFICIARIO"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.direccionBancoBeneficiario"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                  <!-- Nombre del Beneficiario -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 17"
                    :value="17"
                    title="NOMBRE DEL BENEFICIARIO"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.nombreBeneficiario"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                  <!-- Dirección del Beneficiario -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 18"
                    :value="18"
                    title="DIRECCIÓN DEL BENEFICIARIO"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.direccionBeneficiario"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                  <!-- Número de Cuenta -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 19"
                    :value="19"
                    title="NÚMERO DE CUENTA"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.numeroCuentaBeneficiario"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                  <!-- Porcentaje de Pago -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 20"
                    :value="20"
                    title="PORCENTAJE DE PAGO"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.porcentajePago"
                          class="txtNroFactura"
                          type="number"
                          step="0.01"
                          suffix="%"
                          style="max-width: 100px"
                          max="100"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="continuar"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                  <!-- País Recepto -->
                  <v-stepper-vertical-item
                    :editable="true"
                    :complete="e6 > 21"
                    :value="21"
                    title="PAÍS RECEPTOR"
                  >
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="datosManuales.paisReceptor"
                          class="txtNroFactura"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-spacer />
                        <v-btn
                          color="primary"
                          class="mx-1"
                          @click="pasarASeguro"
                        >
                          Continue
                        </v-btn>
                        <v-btn
                          color="error"
                          class="mx-1"
                          @click="regresar()"
                        >
                          Volver
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-stepper-vertical-item>
                </div>
                <!-- ------------------------------------------ -->
                <v-stepper-vertical-item
                  :editable="true"
                  :complete="e6 > 22"
                  v-if="false"
                  :value="22"
                  title="DONDE SE DEBE PAGAR"
                >
                  <v-row>
                    <v-col cols="12">
                      <p class="text-red">
                        solo aplica si el cliente nos cancela a nosotros...
                      </p>
                      <v-checkbox
                        v-model="datosManualesNoAplica.dondePagar"
                        @update:model-value="checkNoAplica(8)"
                        label="No Aplica"
                      />
                      <v-text-field
                        v-model="datosManuales.dondePagar"
                        ref="txtClientePago"
                      />
                    </v-col>
                  </v-row>
                </v-stepper-vertical-item>
              </div>
              <!-- SEGURO DE MERCANCIA -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 23"
                :value="23"
                title="SEGURO DE MERCANCIA"
              >
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="datosManuales.seguro"
                      placeholder="Si/No"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 24"
                :value="24"
                title="OBSERVACIONES ADICIONALES 1"
              >
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      label="No Aplica"
                      v-model="datosManualesNoAplica.observacion1"
                      @update:model-value="checkNoAplica(24)"
                    />
                    <v-textarea
                      v-model="datosManuales.observacion1"
                      auto-grow
                      rows="1"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
              <!--  -->
              <v-stepper-vertical-item
                :editable="true"
                :complete="e6 > 25"
                :value="25"
                title="OBSERVACIONES ADICIONALES 2"
              >
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      label="No Aplica"
                      v-model="datosManualesNoAplica.observacion2"
                      @update:model-value="checkNoAplica(25)"
                    />
                    <v-textarea
                      v-model="datosManuales.observacion2"
                      auto-grow
                      rows="1"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continue
                    </v-btn>
                    <v-btn
                      color="error"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-vertical-item>
            </v-stepper-vertical>
          </div>
        </v-col>
        <v-col
          v-if="verPrevisualizacion"
          :cols="verDatosPreview ? 7 : 12"
          class="px-10"
        >
          <v-tabs
            color="deep-purple-accent-4"
            align-tabs="end"
            v-model="tabPreview"
          >
            <v-spacer />
            <v-tab value="op">
              INSTRUCTIVO A OPERACIONES
            </v-tab>
            <v-tab value="agente">
              INSTRUCTIVO AL AGENTE
            </v-tab>
          </v-tabs>
          <v-tabs-window
            v-model="tabPreview"
            class="mt-5"
          >
            <v-tabs-window-item value="op">
              <div class="clsInstructivo">
                <v-table>
                  <tbody>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt"
                      >
                        <p class="MsoNormal my-0">
                          FECHA
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border: solid windowtext 1pt;
                            border-left: none;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ fecha || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          ASESOR/ PRICING
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ asesor ? asesor.name : "" }}
                          / {{ asesorPricing ? asesorPricing.name : "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          N° QUOTE
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ nro_quote || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          TIPO DE EMBARQUE
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ Shipment.code || "" }}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          SERVICIO
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.servicio || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          COLOADER/AGENTE
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0 my-0">
                          Datos:

                          {{
                            Object.keys(proveedorInstructivo).length
                              ? proveedorInstructivo.namelong
                              : ""
                          }}
                        </p>
                        <p class="MsoNormal my-0 my-0">
                          Contacto:
                          {{
                            Object.keys(proveedorInstructivo).length
                              ? proveedorInstructivo.contacto
                              : ""
                          }}
                        </p>
                        <p class="MsoNormal my-0 my-0">
                          Téfono:
                          {{
                            Object.keys(proveedorInstructivo).length
                              ? proveedorInstructivo.contacto_phone
                              : ""
                          }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          Email de Seguimiento
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.email || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          PUERTO DE SALIDA
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ puertoOrigen ? puertoOrigen.name : "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          DATOS DE LA CARGA <br>
                          <span style="color: red">Si es EXWORD enviar dirección de recolecta</span>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          INCOTERMS: {{ incoterms.name || "" }}<br>
                          PESO:{{ datosPrincipales.peso || "" }} KG<br>
                          VOLUMEN:
                          {{ datosPrincipales.volumen || "" }} M3<br>
                          TIPO DE MERCANCIA:
                          {{ datosPrincipales.descripcioncarga || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          DETALLES DEL PROVEEDOR
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          NOMBRE: {{ proveedor.namelong || "" }} <br>
                          CONTACTO: {{ proveedor.contacto || "" }} <br>
                          EMAIL:
                          <a
                            class="text-primary"
                            :href="`mailto:${proveedor.emailaddress}`"
                          >
                            {{ proveedor.emailaddress || "" }} </a><br>
                          TELEFONO: {{ proveedor.contacto_phone || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          CLIENTE / RAZON SOCIAL
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ cliente ? cliente.nombrecompleto : "" }} <br>
                          RUC: {{ cliente ? cliente.document : "" }} <br>
                          DIRECCION: {{ cliente ? cliente.address : "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>NOTIFY</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          PIC LOGISTICA SAC <br>
                          RUC: 20609852861 <br>
                          AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
                          Contacto: Carlos Ramirez <br>
                          CORREO: ASESOR2@PIC-CARGO.COM
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>CARGA LISTA DIA FECHA</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.listDiaFecha }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>GRUPO DE WHATSAPP</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.grupoWhatsapp }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>SE ADJUNTA</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <!-- eslint-disable vue/no-v-html -->
                        <p
                          class="MsoNormal my-0"
                          v-html="formatearArchivos"
                        />
                        <!-- eslint-enable vue/no-v-html -->
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>TIPO DE MERCANCIA</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosPrincipales.descripcioncarga || "" }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>DEBEMOS PAGAR AL PROVEEDOR</b>
                        </p>
                        <span style="color: red">Solo aplica si el cliente nos cancela a nosotros y
                          nosotros debemos pagar al proveedor</span>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.pagarProveedor ? "Si" : "No" }}
                        </p>
                      </td>
                    </tr>

                    <tr v-if="mostrarPagarProveedorAlibaba">
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>DONDE SE DEBE PAGAR</b>
                        </p>
                        <span style="color: red">Solo aplica si el cliente nos cancela a nosotros y
                          nosotros debemos pagar al proveedor</span>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.dondePagar }}
                        </p>
                      </td>
                    </tr>

                    <tr v-if="datosManuales.pagarProveedor">
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>DATOS BANCARIOS PARA TRASNFERENCIA </b>
                        </p>
                        <span style="color: red" />
                      </td>
                      <td
                        v-if="mostrarPagarProveedorAlibaba"
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            MONTO A PAGAR:
                          </span>
                          {{ datosManuales.monto }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            CLIENTE YA NOS PAGÓ:
                          </span>
                          {{ datosManuales.clientePago }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            MONTO RECIBIDO DEL CLIENTE:
                          </span>
                          {{ datosManuales.montoRecibido }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            FECHA DE PAGO DEL CLIENTE:
                          </span>
                          {{ datosManuales.fechaPagoCliente }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            LINK DE PAGO ALIBABA:
                          </span>
                          {{ datosManuales.linkDePagoAlibaba }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            NÚMERO DE CONTRATO DE ALIBABA:
                          </span>
                          {{ datosManuales.numeroContratoAlibaba }}
                        </p>
                      </td>
                      <td
                        v-if="mostrarPagarProveedorInternacional"
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            MONTO A PAGAR:
                          </span>
                          {{ datosManuales.monto }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Nro Factura:
                          </span>
                          {{ datosManuales.nroFactura }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Banco Beneficiario:
                          </span>
                          {{ datosManuales.bancoBenbeficiario }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Dirección del banco beneficiario:
                          </span>
                          {{ datosManuales.direccionBancoBeneficiario }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Nombre del Beneficiario:
                          </span>
                          {{ datosManuales.nombreBeneficiario }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Dirección del Beneficiario:
                          </span>
                          {{ datosManuales.direccionBeneficiario }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Número de Cuenta:
                          </span>
                          {{ datosManuales.numeroCuentaBeneficiario }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            Porcentaje de Pago:
                          </span>
                          {{ datosManuales.porcentajePago }}
                        </p>
                        <p class="MsoNormal my-0">
                          <span
                            style="
                                font-weight: bold;
                                text-transform: uppercase;
                              "
                          >
                            País Receptor:
                          </span>
                          {{ datosManuales.paisReceptor }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          <b>SEGURO DE MERCANCIA</b>
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.seguro }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          OBSERVACIONES ADICIONALES 1
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.observacion1 }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          OBSERVACIONES ADICIONALES 2
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.observacion2 }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          CARPETA OPERATIVA
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p
                          class="MsoNormal my-0"
                          v-if="datosPrincipales.url_folderonedriveexp"
                        >
                          CARPETA OPERATIVA
                          <a
                            :href="datosPrincipales.url_folderonedriveexp"
                            target="_blank"
                            style="color: blue; font-weight: bold"
                          >CLICK AQUÍ</a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-tabs-window-item>
            <v-tabs-window-item value="agente">
              <div class="clsInstructivo">
                <v-table>
                  <tbody>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt"
                      >
                        <p class="MsoNormal my-0">
                          PUERTO DE SALIDA
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border: solid windowtext 1pt;
                            border-left: none;
                          "
                      >
                        {{ puertoOrigen ? puertoOrigen.name : "" }}
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          TIPO DE EMBARQUE
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ Shipment.code || "" }}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          DATOS DE LA CARGA Si es EXWORK enviar dirección de
                          recolecta
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          INCOTERMS: {{ incoterms.name || "" }}<br>
                          PESO:{{ datosPrincipales.peso || "" }} KG<br>
                          VOLUMEN:
                          {{ datosPrincipales.volumen || "" }} M3<br>
                          TIPO DE MERCANCIA:
                          {{ datosPrincipales.descripcioncarga || "" }}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          DETALLES DEL PROVEEDOR
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          NOMBRE: {{ proveedor.namelong || "" }} <br>
                          CONTACTO: {{ proveedor.contacto || "" }} <br>
                          EMAIL:
                          <a
                            class="text-primary"
                            :href="`mailto:${proveedor.emailaddress}`"
                          >
                            {{ proveedor.emailaddress || "" }} </a><br>
                          TELEFONO: {{ proveedor.contacto_phone || "" }}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          CLIENTE / RAZON SOCIAL
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ cliente ? cliente.nombrecompleto : "" }} <br>
                          RUC: {{ cliente ? cliente.document : "" }} <br>
                          DIRECCION: {{ cliente ? cliente.address : "" }}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          NOTIFY
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        PIC LOGISTICA SAC <br>
                        RUC: 20609852861 <br>
                        AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
                        Contacto: Carlos Ramirez <br>
                        CORREO: ASESOR2@PIC-CARGO.COM
                      </td>
                    </tr>
                    <tr>
                      <td
                        valign="top"
                        style="border: solid windowtext 1pt; border-top: none"
                      >
                        <p class="MsoNormal my-0">
                          CARGA LISTA DIA FECHA
                        </p>
                      </td>
                      <td
                        valign="top"
                        style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                      >
                        <p class="MsoNormal my-0">
                          {{ datosManuales.listDiaFecha }}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
        <v-col cols="12 my-5">
          <v-spacer />
          <v-btn
            color="success"
            v-if="!aprobadoflag"
            @click="setDatosInstructivo"
            class="mx-2"
          >
            Guardar Borrador Y Continuar
          </v-btn>
          <v-btn
            color="success"
            v-if="aprobadoflag"
            @click="guardarYGenenarCorreo"
            class="mx-2"
          >
            <v-icon class="mx-2">
              mdi-content-save-move
            </v-icon> Guardar y Enviar
            Email a Operaciones
          </v-btn>
          <v-btn
            color="red"
            class="mx-1"
            v-if="aprobadoflag"
            @click="generarHTMLPDF()"
          >
            <v-icon class="mx-2">
              mdi-file-pdf-box
            </v-icon> Imprimir
          </v-btn>
          <v-btn
            color="#E65100"
            @click="$emit('cerrarDialogo')"
          >
            <v-icon class="mx-1">
              mdi-close
            </v-icon> Cerrar
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped>
.txtCondiciones {
  field-sizing: content !important;
}

.clsInstructivo {
  height: 500px;
  overflow-y: scroll;
  scrollbar-gutter: stable;
}
.clsSequence {
  height: 550px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  position: relative;
  will-change: scroll-position;
}

.custom-title-class {
  font-size: 2.5rem !important;
}

.custom-button-class {
  font-size: 1.5rem !important;
  padding: 15px 30px !important;
}
</style>
