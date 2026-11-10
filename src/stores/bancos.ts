import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import { useAppStore } from "@/stores/app";
import type { ApiResponse } from "@/types/api";
import type { Moneda } from "@/types/catalogos";
import type {
  CuentaBancariaForm,
  CuentaBancariaListado,
  CuentaBancariaPic,
  FiltroCuentasBancarias,
  OpcionBanco,
} from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";
import { request } from "@/utils/request";

const JSON_HEADERS = { "Content-Type": "application/json" };
const url = (path: string) => import.meta.env.VITE_URL_MAIN + path;

const filledFilters = (filters: Partial<FiltroCuentasBancarias>) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  );

export const useBancosStore = defineStore("bancos", () => {
  const cuentas = ref<CuentaBancariaPic[]>([]);
  const validacionBanco = ref<ApiResponse | null>(null);
  const cuentasListado = ref<CuentaBancariaListado[]>([]);
  const bancosOpciones = ref<OpcionBanco[]>([]);
  const monedasOpciones = ref<Moneda[]>([]);

  async function loadCuentasListado(filters: Partial<FiltroCuentasBancarias> = {}): Promise<ApiResponse<CuentaBancariaListado[]>> {
    const answer = await request<CuentaBancariaListado>({
      method: "get",
      url: url("listar_cuentas"),
      params: { id_branch: sessionBranchId(), ...filledFilters(filters) },
      headers: JSON_HEADERS,
    });
    cuentasListado.value = answer.estadoflag ? answer.data : [];
    return answer;
  }

  async function loadBancosOpciones(): Promise<void> {
    const answer = await request<OpcionBanco>({
      method: "post",
      url: url("getBanksList/"),
      headers: JSON_HEADERS,
      data: { id_branch: sessionBranchId() },
    });
    bancosOpciones.value = answer.estadoflag ? answer.data : [];
  }

  async function loadMonedasOpciones(): Promise<void> {
    const answer = await request<Moneda>({
      method: "get",
      url: url("getCoinsList"),
      params: { id_branch: sessionBranchId() },
      headers: JSON_HEADERS,
    });
    monedasOpciones.value = answer.estadoflag ? answer.data : [];
  }

  const loadCatalogosCuenta = () => Promise.all([loadBancosOpciones(), loadMonedasOpciones()]);

  const saveCuenta = (cuenta: CuentaBancariaForm) =>
    cuenta.id
      ? request({ method: "put", url: url("editar_cuenta"), headers: JSON_HEADERS, data: cuenta })
      : request({ method: "post", url: url("nueva_cuenta"), headers: JSON_HEADERS, data: cuenta });

  const deleteCuenta = (cuenta: CuentaBancariaListado) =>
    request({ method: "put", url: url("eliminar_cuenta_logica"), headers: JSON_HEADERS, data: { id: cuenta.id } });

  async function getListBanksDetailsCargar(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CuentaBancariaPic[]>>(config)
      .then(function (response) {
        useAppStore().cuentas_pic = response.data.data;
        cuentas.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getValidaNroOp(nro_operacion: string | number): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_nro_operacion?nro_operacion=" + nro_operacion,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        validacionBanco.value = response.data;
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  return {
    cuentas,
    validacionBanco,
    cuentasListado,
    bancosOpciones,
    monedasOpciones,
    getListBanksDetailsCargar,
    getValidaNroOp,
    loadCuentasListado,
    loadCatalogosCuenta,
    saveCuenta,
    deleteCuenta,
  };
});
