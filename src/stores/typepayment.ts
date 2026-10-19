import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroTipoPago, TipoPago } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

export const useTypepaymentStore = defineStore("typepayment", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstTypePayment = ref<TipoPago[]>([]);
  const filtros = ref<FiltroTipoPago>({
    id: "",
    code: "",
    name: "",
    description: "",
    status: true,
  });
  const model = ref<Partial<TipoPago>>({
    id: "",
    code: "",
    name: "",
    description: "",
    status: true,
  });

  async function GetListTypePayment(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_type_payments?&id_branch=${sessionBranchId()}&code=${filtros.value.code ? filtros.value.code : ""}&name=${
          filtros.value.name ? filtros.value.name : ""
        }&description=${filtros.value.description ? filtros.value.description : ""}&status=${
          filtros.value.status ? filtros.value.status : ""
        }`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<TipoPago[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            lstTypePayment.value = data.data;
          } else {
            lstTypePayment.value = [];
            Swal.fire({
              icon: "warning",
              title: "Aviso",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function setTypePayment(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_type_payments`,
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

  async function ActualizarTypePayment(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_type_payments`,
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

  return { tipo, drawer, lstTypePayment, filtros, model, GetListTypePayment, setTypePayment, ActualizarTypePayment };
});
