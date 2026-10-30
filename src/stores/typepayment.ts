import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroTipoPago, TipoPago } from "@/types/catalogos";
import { request } from "@/utils/request";

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
    const { code, name, description, status } = filtros.value;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_type_payments",
      params: { code: code || "", name: name || "", description: description || "", status },
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

  async function saveTypePayment(method: "post" | "put", endpoint: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + endpoint,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  const setTypePayment = () => saveTypePayment("post", "insertar_type_payments");
  const ActualizarTypePayment = () => saveTypePayment("put", "actualizar_type_payments");

  return { tipo, drawer, lstTypePayment, filtros, model, GetListTypePayment, setTypePayment, ActualizarTypePayment };
});
