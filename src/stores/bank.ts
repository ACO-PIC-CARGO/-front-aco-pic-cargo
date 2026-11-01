import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type {
  BancoFila,
  BancoRegistro,
  DeudaPendiente,
  DeudaSeleccionable,
  FiltroBancos,
} from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";
import { downloadPdf } from "@/utils/pdfDownload";
import { request } from "@/utils/request";
import { usePermissions } from "@/composables/usePermissions";

export const useBankStore = defineStore("bank", () => {
  const list = ref<BancoFila[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<BancoRegistro>({});
  const loading = ref(false);
  const deudaAProveedor = ref<DeudaSeleccionable[]>([]);
  const deudaACliente = ref<DeudaSeleccionable[]>([]);
  const id = ref<number | null>(null);

  async function fetchDataBank(data: FiltroBancos): Promise<void> {
    loading.value = false;
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_bank?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&acronym=${encodeURIComponent(String(data.acronym))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&status=${data.status}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<BancoFila[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        const lista = data.estadoflag ? data.data : [];
        list.value = lista;
        loading.value = true;
        if (!data.estadoflag) {
          if (data.status == "401") {
            Swal.fire({
              icon: data.status == "401" ? "error" : "info",
              text: data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  const insertBank = (data: Record<string, unknown>) => saveBank("post", "insertar_bank", data);
  const updateBank = (data: Record<string, unknown>) => saveBank("put", "actualizar_bank", data);
  async function saveBank(method: "post" | "put", path: string, data: Record<string, unknown>): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data: data,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
      showCancelButton: false,
      confirmButtonText: "Ok",
    });
    fetchDataBank({ name: "", code: "", acronym: "", description: "", status: 1 });
    return response.estadoflag;
  }
  async function readBank(id: number | string): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_bank?id=${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios<ApiResponse<BancoRegistro[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          record.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: data.status == "401" ? "error" : "info",
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && data.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function getBanksListCargar(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getBanksList/",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<BancoFila[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          list.value = response.data.data;
        } else {
          list.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function guardarCuentaDetalle(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_cuenta",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          const data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            status: 1,
          };
          fetchDataBank(data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function eliminarCuentaDetalle(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "eliminar_cuenta",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          const data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            status: 1,
          };
          fetchDataBank(data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function verPagoRealizado(nro_operacion: number | string): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_pago?nro_operacion=${nro_operacion}&id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<BancoRegistro[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          record.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: "warning",
            text: data.mensaje,
          }).then((response) => {
            if (response.isConfirmed) {
              router.go(-1);
            }
          });
          record.value = {};
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function anularPagoRealizado(id: number | string): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `anular_pago`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function actualizarPagoRealizadoSombreado(data: unknown): Promise<ApiResponse | null> {
    // Shadowed by the later actualizarPagoRealizado, so this body never ran.
    let res: ApiResponse | null = null;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_pago`,
      headers: {
        "Content-Type": "application/json",
      },
      data: { lstPago: data },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function verCobroRealizado(nro_operacion: number | string): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_cobro?nro_operacion=${nro_operacion}&id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<BancoRegistro[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          record.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: "warning",
            text: data.mensaje,
          }).then((response) => {
            if (response.isConfirmed) {
              router.go(-1);
            }
          });
          record.value = {};
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function anularCobroRealizado(data: Record<string, unknown>): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `anular_cobro`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function actualizarPagoRealizado(data: unknown): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_cobro`,
      headers: {
        "Content-Type": "application/json",
      },
      data: { lstPago: data },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function validateNroOperacion(data: Record<string, unknown>): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validate_nro_operacion_cobro`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function verVacturas(data: Record<string, unknown>): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_facturas`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  async function getDeudaAProveedorPorSucursal(id_proveedor: number | string): Promise<ApiResponse<DeudaPendiente[]> | null> {
    let res: ApiResponse<DeudaPendiente[]> | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `deuda_a_proveedor_por_sucursal`,
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        id_proveedor: id_proveedor,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<DeudaPendiente[]>>(config)
      .then(function (response) {
        res = response.data;
        if (res.estadoflag) {
          deudaAProveedor.value = res.data.map((item, index) => {
            return {
              ...item,
              id: index + 1,
              nuevoflag: false,
              parcialflag: false,
              montoparcial: 0,
              saldo: 0,
              tipocambio: parseFloat(
                String(
                  (item.saldo_pendiente_local ? item.saldo_pendiente_local : 1) /
                    (item.saldo_pendiente ? item.saldo_pendiente : 1),
                ),
              ).toFixed(4),
            };
          });
        } else {
          deudaAProveedor.value = [];
          Swal.fire({
            icon: "warning",
            text: res.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  async function getDeudaDeClientePorSucursal(id_cliente: number | string): Promise<ApiResponse<DeudaPendiente[]> | null> {
    let res: ApiResponse<DeudaPendiente[]> | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `deuda_de_cliente_por_sucursal`,
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        id_cliente: id_cliente,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<DeudaPendiente[]>>(config)
      .then(function (response) {
        res = response.data;
        if (res.estadoflag) {
          deudaACliente.value = res.data.map((item, index) => {
            return {
              ...item,
              id: index + 1,
              nuevoflag: false,
              parcialflag: false,
              montoparcial: 0,
              saldo: 0,
            };
          });
        } else {
          deudaACliente.value = [];
          Swal.fire({
            icon: "warning",
            text: res.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  const notifyRefusal = (answer: ApiResponse) =>
    Swal.fire({ icon: answer.tipomensaje === "TMSGERR" ? "error" : "warning", text: answer.mensaje });

  const paymentRequest = (method: "post" | "put" | "delete", path: string, data: Record<string, unknown>) =>
    request<Record<string, number>>({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data,
    });

  async function registerPayment(
    path: string,
    data: Record<string, unknown>,
    list: string,
    screen: string,
    printVoucher: (row: Record<string, number>) => Promise<boolean>,
  ): Promise<boolean> {
    const answer = await paymentRequest("post", path, data);
    if (!answer.estadoflag) {
      notifyRefusal(answer);
      return false;
    }
    const choice = await Swal.fire({
      icon: "success",
      text: answer.mensaje,
      showConfirmButton: usePermissions().can(screen, "EXPORTAR"),
      confirmButtonText: "Imprimir comprobante",
      cancelButtonText: "Ir al listado",
      showCancelButton: true,
    });
    if (choice.isConfirmed) await printVoucher(answer.data[0]!);
    router.push({ name: list });
    return true;
  }

  async function updatePayment(path: string, data: Record<string, unknown>, list: string): Promise<boolean> {
    const answer = await paymentRequest("put", path, data);
    if (!answer.estadoflag) {
      notifyRefusal(answer);
      return false;
    }
    await Swal.fire({ icon: "success", text: answer.mensaje });
    router.push({ name: list });
    return true;
  }

  async function annulPayment(path: string, data: Record<string, unknown>): Promise<boolean> {
    const answer = await paymentRequest("delete", path, data);
    if (!answer.estadoflag) {
      notifyRefusal(answer);
      return false;
    }
    Swal.fire({ icon: "success", text: answer.mensaje });
    return true;
  }

  const setRegistroEgresos = (data: Record<string, unknown>) =>
    registerPayment("registro_egresos", data, "listBankCxP", "registroPayForProveedor", (row) =>
      imprimirComprobanteEgreso({ id: row.v_id }));

  const updateRegistroEgresos = (data: Record<string, unknown>) => updatePayment("actualizar_egresos", data, "listBankCxP");

  const updateRegistroIgresos = (data: Record<string, unknown>) => updatePayment("actualizar_ingresos", data, "listBankCxC");

  const setRegistroIgresos = (data: Record<string, unknown>) =>
    registerPayment("registro_ingresos", data, "listBankCxC", "registroPayForCliente", (row) =>
      imprimirComprobanteIngreso({ id: row.v_id_pago }));

  async function getRegistroEgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listado_egresos",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<BancoFila[]>>(config)
      .then(function (response) {
        const data = response.data;
        list.value = data.estadoflag ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getRegistroIngresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listado_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<BancoFila[]>>(config)
      .then(function (response) {
        const data = response.data;
        list.value = data.estadoflag ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function verRegistroIngresos(data: Record<string, unknown>): Promise<BancoRegistro> {
    let res: BancoRegistro = {};
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "ver_registro_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<BancoRegistro[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          res = data.data[0]!;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  const eliminarRegistroIngresos = (data: Record<string, unknown>) => annulPayment("eliminar_registro_ingresos", data);

  const eliminarRegistroEgresos = (data: Record<string, unknown>) => annulPayment("eliminar_registro_egresos", data);

  async function verRegistroEgresos(data: Record<string, unknown>): Promise<BancoRegistro> {
    let res: BancoRegistro = {};
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "ver_registro_egresos",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<BancoRegistro[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          res = data.data[0]!;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function validarIngresoNroOperacion(data: Record<string, unknown>): Promise<unknown> {
    let res: unknown = {};
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_nrooperacion_ingreso",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        res = data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function validarEgresoNroOperacion(data: Record<string, unknown>): Promise<unknown> {
    let res: unknown = {};
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_nrooperacion_egreso",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        res = data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  const printVoucher = (path: string, id: unknown, fileName: string) =>
    downloadPdf({ method: "get", url: import.meta.env.VITE_URL_MAIN + path, params: { id } }, `${fileName} ${id}.pdf`);

  const imprimirComprobanteIngreso = (data: Record<string, unknown>) =>
    printVoucher("imprimir_registro_ingresos", data.id, "Comprobante de ingreso");

  const imprimirComprobanteEgreso = (data: Record<string, unknown>) =>
    printVoucher("imprimir_registro_egreso", data.id, "Comprobante de salida");

  return {
    list,
    response,
    record,
    loading,
    deudaAProveedor,
    deudaACliente,
    id,
    fetchDataBank,
    insertBank,
    readBank,
    updateBank,
    getBanksListCargar,
    guardarCuentaDetalle,
    eliminarCuentaDetalle,
    verPagoRealizado,
    anularPagoRealizado,
    actualizarPagoRealizadoSombreado,
    verCobroRealizado,
    anularCobroRealizado,
    actualizarPagoRealizado,
    validateNroOperacion,
    verVacturas,
    getDeudaAProveedorPorSucursal,
    getDeudaDeClientePorSucursal,
    setRegistroEgresos,
    updateRegistroEgresos,
    updateRegistroIgresos,
    setRegistroIgresos,
    getRegistroEgresos,
    getRegistroIngresos,
    verRegistroIngresos,
    eliminarRegistroIngresos,
    eliminarRegistroEgresos,
    verRegistroEgresos,
    validarIngresoNroOperacion,
    validarEgresoNroOperacion,
    imprimirComprobanteIngreso,
    imprimirComprobanteEgreso,
  };
});
