import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import { shortDate } from "@/utils/dates";
import { CODIGO_METODO_PAGO, CODIGOS_ALIBABA, CODIGOS_MADE_IN_CHINA } from "@/composables/useMetodosPagoProveedor";

// Detalle del pago al proveedor del instructivo de Pricing (paso 6.3), guardado al aprobar la cotización
// (controlgastos_pago_proveedor). Se ve en Control de Gastos (correlativo "Pago Proveedor") y en
// Bancos > Solicitudes de pago.

export interface ArchivoPago {
  ruta: string;
  name: string;
}

export interface PagoProveedorInstructivo {
  id: number;
  codigo: string;
  id_egreso: number;
  id_master: number;
  id_proveedor: number;
  proveedor: string;
  id_correlativo: number | null;
  correlativo: string | null;
  id_quote: number | null;
  nro_quote: string | null;
  concepto: string;
  monto: number | string | null;
  moneda: string | null;
  metodo_codigo: string | null;
  metodo: string | null;
  datos: Record<string, unknown>;
  fecha: string | null;
}

export interface CampoPago {
  label: string;
  icon: string;
  valor?: string;
  // archivo cargado en el instructivo (se ve con el ojo); marcado sin archivo: solo el texto
  archivo?: ArchivoPago | null;
  sinArchivo?: string;
}

export interface DetallePago {
  titulo: string;
  subtitulo: string;
  plataforma: "Alibaba" | "Made in China" | null;
  icono: string;
  campos: CampoPago[];
}

function texto(valor: unknown) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
}

// {ruta, name} del archivo (formato de uploadAllPath) o de un documento de "Se adjunta" ({flag, file}).
export function archivoDe(valor: unknown): ArchivoPago | null {
  if (!valor || typeof valor !== "object") return null;
  const objeto = valor as { ruta?: unknown; name?: unknown; file?: unknown; archivo?: unknown };
  if (objeto.file !== undefined) return archivoDe(objeto.file);
  if (objeto.archivo) return archivoDe(objeto.archivo);
  const ruta = texto(objeto.ruta);
  if (!ruta) return null;
  const nombre = texto(objeto.name);
  return { ruta, name: nombre.includes("http") ? nombre.substring(nombre.lastIndexOf("/") + 1) : nombre || "Archivo" };
}

function documento(label: string, icon: string, valor: unknown): CampoPago {
  const archivo = archivoDe(valor);
  const marcado = !archivo && !!(valor as { flag?: boolean } | null)?.flag;
  return { label, icon, archivo, sinArchivo: marcado ? "Marcado en «Se adjunta» (sin archivo)" : "" };
}

function montoTexto(monto: unknown, moneda: unknown) {
  const valor = texto(monto);
  if (!valor) return "";
  const numero = Number(valor);
  const formateado = Number.isFinite(numero)
    ? numero.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : valor;
  return `${texto(moneda) || "USD"} ${formateado}`;
}

// 6.1: varios soportes (comprobantesPagoCliente); los instructivos anteriores traen uno solo.
function comprobantesCliente(d: Record<string, unknown>) {
  const lista = Array.isArray(d.comprobantesPagoCliente) ? (d.comprobantesPagoCliente as unknown[]) : [d.comprobantePagoCliente];
  return lista.filter((archivo) => archivoDe(archivo));
}

// 6.1 "¿El cliente ya nos pagó?" (de la cotización). null en registros sin ese dato.
export function detalleClientePago(datos: Record<string, unknown>): { pago: boolean; campos: CampoPago[] } | null {
  const d = datos ?? {};
  if (!("clientePago" in d)) return null;
  const pago = /^s[ií]/i.test(texto(d.clientePago));
  const fecha = texto(d.fechaPagoCliente);
  return {
    pago,
    campos: pago
      ? [
          { label: "Monto que nos pagó", icon: "mdi-database-outline", valor: montoTexto(d.montoRecibido, d.monedaRecibido) },
          // comprobante del cliente (antes "Comprobante de Transferencia" del 6.3); solo si se adjuntó
          ...comprobantesCliente(d).map((archivo, i, todos) =>
            documento(todos.length > 1 ? `Soporte de pago del cliente (${i + 1})` : "Comprobante de pago del cliente",
              "mdi-file-upload-outline", archivo)),
          // cuenta de la empresa y banco del cliente (el nombre se guarda en el instructivo junto al id)
          ...(texto(d.cuentaPagoClienteTexto)
            ? [{ label: "Cuenta donde depositó", icon: "mdi-bank-outline", valor: texto(d.cuentaPagoClienteTexto) }]
            : []),
          ...(texto(d.bancoPagoClienteTexto)
            ? [{ label: "Banco del cliente", icon: "mdi-bank-transfer-out", valor: texto(d.bancoPagoClienteTexto) }]
            : []),
          { label: "Fecha en que nos pagó", icon: "mdi-calendar-month-outline", valor: fecha ? shortDate(fecha) : "" },
        ]
      : [],
  };
}

const TIPOS_DOCUMENTO: Record<string, string> = { 1: "Factura Fiscal", 2: "Proforma", 3: "Otros (ej. email)" };

const CAMPOS_TRANSFERENCIA:{ key: string; label: string; icon: string }[] = [
  { key: "nombreBeneficiario", label: "Beneficiario", icon: "mdi-account-outline" },
  { key: "direccionBeneficiario", label: "Dirección del beneficiario", icon: "mdi-map-marker-outline" },
  { key: "bancoBenbeficiario", label: "Banco beneficiario", icon: "mdi-bank-outline" },
  { key: "direccionBancoBeneficiario", label: "Dirección del banco", icon: "mdi-map-marker-outline" },
  { key: "codigoSwift", label: "Código SWIFT", icon: "mdi-web" },
  { key: "numeroCuentaBeneficiario", label: "N.° de cuenta", icon: "mdi-credit-card-outline" },
];

// Campos del 6.3 según el método (mismo orden que el formulario del instructivo).
export function detallePagoProveedor(datos: Record<string, unknown>, metodo?: string | null): DetallePago {
  const d = datos ?? {};
  const codigo = texto(d.metodoPagoCodigo);
  const plataforma = CODIGOS_ALIBABA.includes(codigo) ? "Alibaba" : CODIGOS_MADE_IN_CHINA.includes(codigo) ? "Made in China" : null;
  const nombreMetodo = texto(metodo) || texto(d.metodoPagoNombre) || codigo;
  const monto: CampoPago = { label: "Monto a pagar al proveedor", icon: "mdi-cash-multiple", valor: montoTexto(d.monto, d.monedaPago) };
  // tipo del documento a pagar (se cargó solo en Facturas y Proformas); solo si se eligió
  const tipoDocumento: CampoPago[] = TIPOS_DOCUMENTO[texto(d.tipoDocumentoPago)]
    ? [{ label: "Tipo de documento", icon: "mdi-file-document-multiple-outline", valor: TIPOS_DOCUMENTO[texto(d.tipoDocumentoPago)] }]
    : [];
  const nroFactura: CampoPago = { label: "N.° de Factura Comercial", icon: "mdi-pound-box-outline", valor: texto(d.nroFactura) };
  const factura = documento("Factura Comercial / Proforma", "mdi-file-document-outline", d.facturaPago);
  const comprobante = documento("Comprobante de Transferencia", "mdi-swap-horizontal", d.comprobantePago);
  const transferencia = CAMPOS_TRANSFERENCIA.map((campo) => ({ label: campo.label, icon: campo.icon, valor: texto(d[campo.key]) }));

  if (plataforma) {
    const conTransferencia = codigo === CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA || codigo === CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA;
    return {
      titulo: `Pago al Proveedor – ${plataforma}`,
      subtitulo: conTransferencia ? "(Transferencia)" : "(Tarjeta de Débito / Crédito)",
      plataforma,
      icono: "mdi-storefront-outline",
      campos: [
        ...tipoDocumento,
        monto,
        nroFactura,
        factura,
        { label: "Link de pago", icon: "mdi-link-variant", valor: texto(d.linkDePagoAlibaba) },
        documento(`Contrato de ${plataforma}`, "mdi-file-sign", d.contratoAlibaba),
        { label: "Número de contrato", icon: "mdi-pound", valor: texto(d.numeroContratoAlibaba) },
        ...(conTransferencia ? [...transferencia, documento("Comprobante / Datos de Transferencia", "mdi-swap-horizontal", d.comprobantePago)] : []),
      ],
    };
  }
  if (codigo === CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL) {
    return {
      titulo: "Pago al Proveedor – Transferencia Internacional",
      subtitulo: "(No Alibaba)",
      plataforma: null,
      icono: "mdi-bank-transfer",
      campos: [
        ...tipoDocumento,
        monto,
        nroFactura,
        factura,
        // el comprobante pasó al 6.1 (pago del cliente): aquí solo en registros antiguos que lo tienen
        ...(comprobante.archivo || comprobante.sinArchivo ? [comprobante] : []),
        documento("Captura de los Datos Bancarios del Proveedor", "mdi-image-outline", d.capturaDatosBancarios),
        ...transferencia,
      ],
    };
  }
  if (codigo === CODIGO_METODO_PAGO.ALIPAY) {
    return {
      titulo: "Pago al Proveedor – Alipay",
      subtitulo: "(Alipay / WeChat Pay)",
      plataforma: null,
      icono: "mdi-qrcode",
      campos: [
        ...tipoDocumento,
        nroFactura,
        documento("QR de pago (Alipay / WeChat Pay)", "mdi-qrcode", d.qrPagoProveedor),
        { label: "Monto a transferir (CNY)", icon: "mdi-currency-cny", valor: montoTexto(d.montoCNY, "CNY") },
        { label: "Equivalente en dólares (USD)", icon: "mdi-currency-usd", valor: montoTexto(d.montoUSD, "USD") },
      ],
    };
  }
  if (codigo === CODIGO_METODO_PAGO.OTROS) {
    const otro = texto(d.metodoPagoOtro);
    return {
      titulo: "Pago al Proveedor – Otros",
      subtitulo: otro ? `(${otro})` : "",
      plataforma: null,
      icono: "mdi-dots-horizontal-circle-outline",
      campos: [
        ...tipoDocumento,
        { label: "Método de Pago (Otros)", icon: "mdi-format-list-bulleted", valor: otro },
        monto,
        documento("Comprobante / Datos de Transferencia", "mdi-swap-horizontal", d.comprobantePago),
        nroFactura,
      ],
    };
  }
  return {
    titulo: "Pago al Proveedor",
    subtitulo: nombreMetodo ? `(${nombreMetodo})` : "",
    plataforma: null,
    icono: "mdi-cash-multiple",
    campos: [...tipoDocumento, monto],
  };
}

// "Captura de los datos bancarios": solo la sección de datos bancarios del proveedor (captura + transferencia)
export function datosBancariosProveedor(datos: Record<string, unknown>): DetallePago {
  const d = datos ?? {};
  const captura = documento("Captura de los Datos Bancarios del Proveedor", "mdi-image-outline", d.capturaDatosBancarios);
  const comprobante = documento("Comprobante / Datos de Transferencia", "mdi-swap-horizontal", d.comprobantePago);
  const codigo = texto(d.metodoPagoCodigo);
  // Alipay no tiene datos bancarios: sus datos de pago son el QR y los montos
  if (codigo === CODIGO_METODO_PAGO.ALIPAY) {
    return {
      titulo: "Datos de pago Alipay / WeChat Pay",
      subtitulo: "",
      plataforma: null,
      icono: "mdi-qrcode",
      campos: [
        documento("QR de pago (Alipay / WeChat Pay)", "mdi-qrcode", d.qrPagoProveedor),
        { label: "Monto a transferir (CNY)", icon: "mdi-currency-cny", valor: montoTexto(d.montoCNY, "CNY") },
        { label: "Equivalente en dólares (USD)", icon: "mdi-currency-usd", valor: montoTexto(d.montoUSD, "USD") },
      ],
    };
  }
  // la sección solo existe con transferencia (Alibaba / Made in China con transferencia y Transferencia Internacional)
  const conTransferencia = ([
    CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA,
    CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA,
    CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL,
  ] as string[]).includes(codigo);
  if (!conTransferencia) {
    return { titulo: "Datos de la Transferencia Internacional", subtitulo: "", plataforma: null, icono: "mdi-bank-outline", campos: [] };
  }
  return {
    titulo: "Datos de la Transferencia Internacional",
    subtitulo: "(datos bancarios del proveedor)",
    plataforma: null,
    icono: "mdi-bank-outline",
    campos: [
      ...(captura.archivo || captura.sinArchivo ? [captura] : []),
      ...CAMPOS_TRANSFERENCIA.map((campo) => ({ label: campo.label, icon: campo.icon, valor: texto(d[campo.key]) })),
      // comprobante de la transferencia (Alibaba / Made in China con transferencia y registros anteriores)
      ...(comprobante.archivo || comprobante.sinArchivo ? [comprobante] : []),
    ],
  };
}

const URL = import.meta.env.VITE_URL_MAIN;

export function usePagoProveedorInstructivo() {
  const pagos = ref<PagoProveedorInstructivo[]>([]);
  const cargando = ref(false);

  async function listar(filtro: { id_master: number; id_proveedor?: number | null; id_correlativo?: number | null }) {
    cargando.value = true;
    try {
      const { data } = await axios.get<ApiResponse<PagoProveedorInstructivo[]>>(`${URL}pago_proveedor_instructivo`, {
        params: {
          id_master: filtro.id_master,
          id_proveedor: filtro.id_proveedor ?? undefined,
          id_correlativo: filtro.id_correlativo ?? undefined,
        },
      });
      pagos.value = data.estadoflag ? (data.data ?? []) : [];
    } catch (error) {
      console.error(error);
      pagos.value = [];
    } finally {
      cargando.value = false;
    }
    return pagos.value;
  }

  return { pagos, cargando, listar };
}

// Bancos > Salidas: pagos al proveedor del instructivo por salida (solo las que pagan un "Pago a Proveedor"
// que viene de una aprobación). Devuelve { id_salida: pagos }.
export async function pagosInstructivoPorSalida(ids: number[]): Promise<Record<number, PagoProveedorInstructivo[]>> {
  const unicos = [...new Set(ids.filter((id) => Number(id) > 0))];
  if (!unicos.length) return {};
  try {
    const { data } = await axios.get<ApiResponse<(PagoProveedorInstructivo & { id_pago: number })[]>>(
      `${URL}pago_proveedor_instructivo_salidas`,
      { params: { ids: unicos.join(",") } },
    );
    const porSalida: Record<number, PagoProveedorInstructivo[]> = {};
    for (const pago of data.estadoflag ? (data.data ?? []) : []) {
      (porSalida[Number(pago.id_pago)] ??= []).push(pago);
    }
    return porSalida;
  } catch (error) {
    console.error(error);
    return {};
  }
}

// Bancos > Solicitudes de pago y Control de Gastos: de cada solicitud que viene del instructivo, el N.° de factura
// comercial, la "Captura de los datos bancarios" y la "Factura del proveedor" (para abrir el archivo directo).
export interface ArchivosInstructivoSolicitud {
  nro_factura: string | null;
  captura: ArchivoPago | null;
  factura: ArchivoPago | null;
  /** datos de la transferencia del instructivo */
  codigo_swift?: string | null;
  beneficiario?: string | null;
}
interface FilaArchivosInstructivo {
  id_solicitudpago: number;
  nro_factura: string | null;
  captura_ruta: string | null;
  captura_nombre: string | null;
  factura_ruta: string | null;
  factura_nombre: string | null;
  codigo_swift?: string | null;
  beneficiario?: string | null;
}
export async function archivosInstructivoPorSolicitud(ids: number[]): Promise<Record<number, ArchivosInstructivoSolicitud>> {
  const unicos = [...new Set(ids.filter((id) => Number(id) > 0))];
  if (!unicos.length) return {};
  try {
    const { data } = await axios.get<ApiResponse<FilaArchivosInstructivo[]>>(`${URL}solicitud_pago_instructivo_archivos`, {
      params: { ids: unicos.join(",") },
    });
    const porSolicitud: Record<number, ArchivosInstructivoSolicitud> = {};
    for (const fila of data.estadoflag ? (data.data ?? []) : []) {
      porSolicitud[Number(fila.id_solicitudpago)] = {
        nro_factura: fila.nro_factura,
        captura: fila.captura_ruta ? { ruta: fila.captura_ruta, name: fila.captura_nombre || "Datos bancarios" } : null,
        factura: fila.factura_ruta ? { ruta: fila.factura_ruta, name: fila.factura_nombre || "Factura del proveedor" } : null,
        codigo_swift: fila.codigo_swift ?? null,
        beneficiario: fila.beneficiario ?? null,
      };
    }
    return porSolicitud;
  } catch (error) {
    console.error(error);
    return {};
  }
}
