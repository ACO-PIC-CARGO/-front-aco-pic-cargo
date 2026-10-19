import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import type {
  CuentaEmpresa,
  DatosRegistroEmpresa,
  EmpresaDetalle,
  EmpresaListado,
  FiltroEmpresa,
  FormCuentaEmpresa,
  FormEmpresa,
  ImpuestoEmpresa,
  RegistroNuevaEmpresaRow,
} from "@/types/empresas";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useEnterprisesStore = defineStore("enterprises", () => {
  const lstCuentas = ref<CuentaEmpresa[]>([]);
  const list = ref<EmpresaListado[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<EmpresaDetalle>({});
  const loading = ref(false);
  const model = ref<FormEmpresa>({
    id_logo: "",
    document: "",
    trade_name: "",
    business_name: "",
    phone: "",
    slogan: "",
    address: "",
    status: "1",
    id_pais: "",
    id_state: "",
    id_city: "",
    id_town: "",
    id_document: "",
    ic: "",
  });
  const data = ref<DatosRegistroEmpresa>({
    trade_name: "",
    id_pais: "",
    names: "",
    surname: "",
    second_surname: "",
    email: "",
    phone: "",
    clave: "",
  });
  const impuesto = ref<ImpuestoEmpresa>({});
  const step = ref(1);
  const inicioFlag = ref(true);
  const datoEmpresaFlag = ref(false);
  const datoAdminFlag = ref(false);
  const datoProveedorFlag = ref(false);
  const datoClienteFlag = ref(false);
  const datoCostosFlag = ref(false);

  function defaultFilter(): Partial<FiltroEmpresa> {
    return {
      id_branch: sessionBranchId(),
      document: "",
      trade_name: "",
      business_name: "",
      address: "",
      status: 1,
      id_pais: "",
      id_state: "",
      id_city: "",
      id_town: "",
      id_document: "",
    };
  }

  async function fetchDataEnterprise(filter: Partial<FiltroEmpresa>): Promise<void> {
    filter.id_branch = sessionBranchId();
    loading.value = false;
    axios<ApiResponse<EmpresaListado[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_enterprise`,
      params: filter,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        list.value = data.estadoflag ? data.data : [];
        loading.value = true;
        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertEnterprise(): Promise<void> {
    const body = {
      user: useUserStore().model,
      enterprise: model.value,
    };
    console.log(useUserStore().model);
    console.log(model.value);
    axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_enterprise",
      headers: { "Content-Type": "application/json" },
      data: body,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("listado");
          }
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readEnterprise(id: number | string): Promise<void> {
    axios<ApiResponse<EmpresaDetalle[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_enterprise?id=${id}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          record.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  function refreshListOrOpenIt(): void {
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name !== "listEnterprise") {
      router.push({ name: "listEnterprise" });
    } else {
      fetchDataEnterprise(defaultFilter());
    }
  }

  async function updateEnterprise(body: unknown): Promise<void> {
    axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_enterprise",
      headers: { "Content-Type": "application/json" },
      data: body,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(refreshListOrOpenIt);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function eliminarBranch(body: unknown): Promise<void> {
    axios<ApiResponse>({
      method: "delete",
      url: import.meta.env.VITE_URL_MAIN + "eliminar_sucursal",
      headers: { "Content-Type": "application/json" },
      data: body,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(refreshListOrOpenIt);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function RegistroNuevaEmpresa(): Promise<boolean> {
    await axios<ApiResponse<RegistroNuevaEmpresaRow[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "registro_nueva_empresa",
      headers: { "Content-Type": "application/json" },
      data: data.value,
    })
      .then((response) => {
        sessionStorage.setItem("security", String(response.data.data[0]!.data_users.id_secutiry));

        const dataUser = response.data.data[0]!.data_users; // es un array
        const dataBranch = response.data.data[0]!.data_branch;
        dataUser[0]!.id_user = dataUser[0]!.id;
        dataUser[0]!.id = dataUser[0]!.id_entitie;
        sessionStorage.setItem("dataUser", JSON.stringify(dataUser));
        sessionStorage.setItem("auth-token", response.data.token!);
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        localStorage.setItem("dataUser", JSON.stringify(dataUser));
        localStorage.setItem("auth-token", response.data.token!);
        localStorage.setItem("dataBranch", JSON.stringify(dataBranch));

        // dispatch("security/", null, { root: true });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return true;
  }

  async function enviarCorreoValidacion(): Promise<void> {
    await axios<ApiResponse>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `enviar_codigo_validacion_email?email=${data.value.email}`,
      headers: { "Content-Type": "application/json" },
      data: data.value,
    }).catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
  }

  async function validarCodigoVerificacion(eliminar = false): Promise<ApiResponse | never[]> {
    let res: ApiResponse | never[] = [];
    await axios<ApiResponse>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_token_registro?email=${data.value.email}&codigo=${data.value.codigo}&eliminartoken=${eliminar}`,
      headers: { "Content-Type": "application/json" },
      data: data.value,
    })
      .then((response) => {
        res = response.data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return res;
  }

  async function validarCorreoRegistro(): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    await axios<ApiResponse>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validar_correo_registro?email=${data.value.email}`,
      headers: { "Content-Type": "application/json" },
      data: data.value,
    })
      .then((response) => {
        res = response.data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return res;
  }

  async function obtenerImpuestoXEmpresa(id_branch: number | string | null = null): Promise<void> {
    const branch = id_branch ? id_branch : sessionBranchId();
    await axios<ApiResponse<ImpuestoEmpresa[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "obtener_impuestos_branch?id_branch=" + branch,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        impuesto.value = response.data.data[0]!;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function listarCuentaEmpresa(): Promise<void> {
    const branch = sessionBranchId();
    await axios<ApiResponse<CuentaEmpresa[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listado_cuentas_empresa?id_branch=" + branch,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        lstCuentas.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function registrarCuentaEmpresa(account: FormCuentaEmpresa): Promise<void> {
    account.id_branch = sessionBranchId();
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "banco_registrar",
      headers: { "Content-Type": "application/json" },
      data: account,
    })
      .then(function (response) {
        const data = response.data;
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
        listarCuentaEmpresa();
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    lstCuentas,
    list,
    response,
    record,
    loading,
    model,
    data,
    impuesto,
    step,
    inicioFlag,
    datoEmpresaFlag,
    datoAdminFlag,
    datoProveedorFlag,
    datoClienteFlag,
    datoCostosFlag,
    fetchDataEnterprise,
    insertEnterprise,
    readEnterprise,
    updateEnterprise,
    eliminarBranch,
    RegistroNuevaEmpresa,
    enviarCorreoValidacion,
    validarCodigoVerificacion,
    validarCorreoRegistro,
    obtenerImpuestoXEmpresa,
    listarCuentaEmpresa,
    registrarCuentaEmpresa,
  };
});
