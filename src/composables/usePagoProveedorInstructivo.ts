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
          { label: "Fecha en que nos pagó", icon: "mdi-calendar-month-outline", valor: fecha ? shortDate(fecha) : "" },
        ]
      : [],
  };
}

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
        monto,
        nroFactura,
        factura,
        comprobante,
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
    campos: [monto],
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
