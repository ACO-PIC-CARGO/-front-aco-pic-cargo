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
import { sessionBranchId, sessionSucursal } from "@/utils/sesion";

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
  async function insertBank(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_bank",
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
  async function updateBank(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_bank",
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
            position: "",
            status: 1,
          };
          fetchDataBank(data);
        });
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
    // Shadowed by the later actualizarPagoRealizado, so the old module never ran this body.
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
  async function setRegistroEgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "registro_egresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<{ v_id: number }[]>>(config)
      .then(function (response) {
        const data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
          confirmButtonText: "Imprimir comprobante",
          cancelButtonText: "Ir A listado",
          showCancelButton: true,
        }).then(async (res) => {
          if (res.isConfirmed) {
            await imprimirComprobanteEgreso({
              id: data.data[0]!.v_id,
            });
            router.push({
              name: "listBankCxP",
            });
          }
          // @ts-expect-error Kept: SweetAlertResult has no cancelButtonText, so this branch never runs.
          if (res.cancelButtonText) {
            router.push({
              name: "listBankCxP",
            });
          }
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function updateRegistroEgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_egresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        console.log("Respuesta del servidor al registrar egreso:", data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function updateRegistroIgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        console.log("Respuesta del servidor al registrar ingreso:", data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setRegistroIgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "registro_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...data,
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<{ v_id_pago: number }[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
            confirmButtonText: "Imprimir comprobante",
            cancelButtonText: "Ir A listado",
            showCancelButton: true,
          }).then(async (res) => {
            if (res.isConfirmed) {
              await imprimirComprobanteIngreso({
                id: data.data[0]!.v_id_pago,
              });
              router.push({
                name: "listBankCxC",
              });
            }
            // @ts-expect-error Kept: SweetAlertResult has no cancelButtonText, so this branch never runs.
            if (res.cancelButtonText) {
              router.push({
                name: "listBankCxC",
              });
            }
          });
        } else {
          Swal.fire({
            icon: "error",
            text: "Ocurrió un Error, comuníquese con el área de sistemas.",
          });
        }
        console.log("Respuesta del servidor al registrar egreso:", data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
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
  async function eliminarRegistroIngresos(data: Record<string, unknown>): Promise<BancoRegistro> {
    const res: BancoRegistro = {};
    const config = {
      method: "delete",
      url: import.meta.env.VITE_URL_MAIN + "eliminar_registro_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  async function eliminarRegistroEgresos(data: Record<string, unknown>): Promise<BancoRegistro> {
    const res: BancoRegistro = {};
    const config = {
      method: "delete",
      url: import.meta.env.VITE_URL_MAIN + "eliminar_registro_egresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
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
  async function imprimirComprobanteIngreso(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "imprimir_registro_ingresos",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
        logo: sessionSucursal().logo,
      },
    };
    Swal.fire({
      icon: "info",
      title: "Generando impresión",
      text: "Estamos preparando la impresión del ingreso. Por favor, espera un momento.",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios<{ path: string }>(config)
      .then(function (response) {
        const data = response.data;
        window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function imprimirComprobanteEgreso(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "imprimir_registro_egreso",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        ...data,
        id_branch: sessionBranchId(),
        logo: sessionSucursal().logo,
      },
    };
    Swal.fire({
      icon: "info",
      title: "Generando impresión",
      text: "Estamos preparando la impresión del egreso. Por favor, espera un momento.",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios<{ path: string }>(config)
      .then(function (response) {
        const data = response.data;
        window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
  }

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
