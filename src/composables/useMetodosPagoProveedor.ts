import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";

// Maestro METPAGPROV (table_masterdetalle, por sucursal). Toda regla del instructivo va por código.
export const CODIGO_METODO_PAGO = {
  ALIBABA_TARJETA: "01",
  ALIBABA_TRANSFERENCIA: "02",
  TRANSFERENCIA_INTERNACIONAL: "03",
  ALIPAY: "04",
  MADE_IN_CHINA_TRANSFERENCIA: "05",
  MADE_IN_CHINA_TARJETA: "06",
  OTROS: "07",
} as const;

// Códigos que usan el formulario 7.3 "Pago al Proveedor – Alibaba".
export const CODIGOS_ALIBABA: string[] = [CODIGO_METODO_PAGO.ALIBABA_TARJETA, CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA];
// Made in China: mismo formulario que Alibaba (06 tarjeta como 01, 05 transferencia como 02).
export const CODIGOS_MADE_IN_CHINA: string[] = [
  CODIGO_METODO_PAGO.MADE_IN_CHINA_TARJETA,
  CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA,
];

export interface MetodoPagoProveedor {
  id: number;
  codigo: string;
  descripcion: string;
  detalle: string | null;
  estado: boolean;
  orden: number | null;
}

export function nombreMetodoPago(metodo: Pick<MetodoPagoProveedor, "descripcion" | "detalle"> | null | undefined) {
  if (!metodo) return "";
  return metodo.detalle ? `${metodo.descripcion} (${metodo.detalle})` : metodo.descripcion;
}

const URL = import.meta.env.VITE_URL_MAIN;

export function useMetodosPagoProveedor() {
  const metodos = ref<MetodoPagoProveedor[]>([]);
  const cargando = ref(false);

  async function listar() {
    cargando.value = true;
    try {
      const { data } = await axios.get<ApiResponse<MetodoPagoProveedor[]>>(`${URL}listar_metodos_pago_proveedor`);
      metodos.value = data.estadoflag ? (data.data ?? []) : [];
    } catch (error) {
      console.error(error);
      metodos.value = [];
    } finally {
      cargando.value = false;
    }
  }

  async function guardar(datos: { codigo?: string | null; descripcion: string; detalle?: string | null; estado: boolean }) {
    const cuerpo = { descripcion: datos.descripcion, detalle: datos.detalle ?? null, estado: datos.estado };
    const { data } = datos.codigo
      ? await axios.put<ApiResponse>(`${URL}metodos_pago_proveedor/${encodeURIComponent(datos.codigo)}`, cuerpo)
      : await axios.post<ApiResponse>(`${URL}metodos_pago_proveedor`, cuerpo);
    return data;
  }

  async function ordenar(codigos: string[]) {
    const { data } = await axios.put<ApiResponse>(`${URL}metodos_pago_proveedor/orden`, { codigos });
    return data;
  }

  return { metodos, cargando, listar, guardar, ordenar };
}
