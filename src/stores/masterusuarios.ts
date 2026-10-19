import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { TipoTransaccion } from "@/types/entidades";
import type { FiltroMasterDetalle, FormMasterDetalle, MasterDetalle } from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useMasterusuariosStore = defineStore("masterusuarios", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstCanales = ref<TipoTransaccion[]>([]);
  const lstTipoProveedor = ref<TipoTransaccion[]>([]);
  const lstPercepcionAduana = ref<TipoTransaccion[]>([]);
  const lstTipoTransaccion = ref<TipoTransaccion[]>([]);
  const lstTipoTelefono = ref<(MasterDetalle | TipoTransaccion)[]>([]);
  const lstImpuesto = ref<MasterDetalle[]>([]);
  const lstNotasQuote = ref<MasterDetalle[]>([]);
  const lstTipoPersona = ref<TipoTransaccion[]>([]);
  const lstImpRenta = ref<TipoTransaccion[]>([]);
  const lstTemperatura = ref<TipoTransaccion[]>();
  const filtros = ref<FiltroMasterDetalle>({
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    escomunflag: false,
    individualflag: true,
    grupalflag: true,
    orden: null,
  });
  const model = ref<FormMasterDetalle>({
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    id_branch: "",
    escomunflag: "",
    individualflag: true,
    grupalflag: true,
    orden: null,
  });

  async function ActualizarMasterDetalle(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_master_detalle`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListImpuestos(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_master_detalle_impuesto?&id_branch=${sessionBranchId()}&id_master=${filtros.value.id_master}&valorcodigo=${
          filtros.value.valorcodigo == "" || filtros.value.valorcodigo == null ? "" : filtros.value.valorcodigo
        }&codigo01=${
          filtros.value.codigo01 == "" || filtros.value.codigo01 == null ? "" : filtros.value.codigo01
        }&codigo02=${filtros.value.codigo02}&description=${
          filtros.value.description == "" || filtros.value.description == null ? "" : filtros.value.description
        }&status=${filtros.value.status}&escomunflag=${filtros.value.escomunflag}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<MasterDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstImpuesto.value = data.data;
          } else {
            lstImpuesto.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListNotasCotizacion(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_master_detalle_notas_cotizacion?&id_branch=${sessionBranchId()}&id_master=${filtros.value.id_master}&valorcodigo=${
          filtros.value.valorcodigo == "" || filtros.value.valorcodigo == null ? "" : filtros.value.valorcodigo
        }&codigo01=${filtros.value.codigo01}&codigo02=${
          filtros.value.codigo02 == "" || filtros.value.codigo02 == null ? "" : filtros.value.codigo02
        }&description=${
          filtros.value.description == "" || filtros.value.description == null ? "" : filtros.value.description
        }&status=${filtros.value.status == null ? "" : filtros.value.status}&escomunflag=${filtros.value.escomunflag}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<MasterDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstNotasQuote.value = data.data;
          } else {
            lstNotasQuote.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListTipoTelefono(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_master_detalle_tipotelefono?&id_branch=${sessionBranchId()}&id_master=${filtros.value.id_master}&valorcodigo=${
          filtros.value.valorcodigo == "" || filtros.value.valorcodigo == null ? "" : filtros.value.valorcodigo
        }&codigo01=${
          filtros.value.codigo01 == "" || filtros.value.codigo01 == null ? "" : filtros.value.codigo01
        }&codigo02=${filtros.value.codigo02}&description=${
          filtros.value.description == "" || filtros.value.description == null ? "" : filtros.value.description
        }&status=${filtros.value.status}&escomunflag=${filtros.value.escomunflag}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<MasterDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstTipoTelefono.value = data.data;
          } else {
            lstTipoTelefono.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarMasterDetalleCanal(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_canal?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };

    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstCanales.value = response.data.data;
      } else {
        lstCanales.value = [];
      }
    });
  }

  async function cargarMasterDetalleTipoProveedor(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_tipo_proveedor?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstTipoProveedor.value = response.data.data;
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        lstTipoProveedor.value = [];
      }
    });
  }

  async function cargarMasterDetallePercepcionAduana(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_percepcion_aduana?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstPercepcionAduana.value = response.data.data;
      } else {
        lstPercepcionAduana.value = [];
      }
    });
  }

  async function cargarMasterDetalleTipoTransaccion(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_tipo_percepcion?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstTipoTransaccion.value = response.data.data;
      } else {
        lstTipoTransaccion.value = [];
      }
    });
  }

  async function cargarTipoTelefono(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_tipo_telefono?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstTipoTelefono.value = response.data.data;
      } else {
        lstTipoTelefono.value = [];
      }
    });
  }

  async function RegistrarMasterDetalleTipoTelefono(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_master_detalle_tipotelefono`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function RegistrarMasterDetalleNotasCotizacion(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_master_detalle_notas_cotizacion`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarTipoPersona(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_tipo_persona?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstTipoPersona.value = response.data.data;
      } else {
        lstTipoPersona.value = [];
      }
    });
  }

  async function cargarImpuestoRenta(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_impuesto_renta?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstImpRenta.value = response.data.data;
      } else {
        lstImpRenta.value = [];
      }
    });
  }

  async function cargarTemperaturaLeds(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_temperatura_leads`,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.estadoflag == true) {
        lstTemperatura.value = response.data.data;
      } else {
        lstTemperatura.value = [];
      }
    });
  }

  return {
    tipo,
    drawer,
    lstCanales,
    lstTipoProveedor,
    lstPercepcionAduana,
    lstTipoTransaccion,
    lstTipoTelefono,
    lstImpuesto,
    lstNotasQuote,
    lstTipoPersona,
    lstImpRenta,
    lstTemperatura,
    filtros,
    model,
    ActualizarMasterDetalle,
    GetListImpuestos,
    GetListNotasCotizacion,
    GetListTipoTelefono,
    cargarMasterDetalleCanal,
    cargarMasterDetalleTipoProveedor,
    cargarMasterDetallePercepcionAduana,
    cargarMasterDetalleTipoTransaccion,
    cargarTipoTelefono,
    RegistrarMasterDetalleTipoTelefono,
    RegistrarMasterDetalleNotasCotizacion,
    cargarTipoPersona,
    cargarImpuestoRenta,
    cargarTemperaturaLeds,
  };
});
