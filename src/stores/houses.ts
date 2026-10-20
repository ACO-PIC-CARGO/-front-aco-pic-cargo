import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type { HouseListado } from "@/types/cotizacion";
import type { FacturaFiscal, FiltroHouseConsulta, HouseDetalle, HouseFacturable } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

export const useHousesStore = defineStore("houses", () => {
  const listHouse = ref<HouseListado[]>([]);
  const house = ref<HouseDetalle>({});
  const lstFacturasFiscales = ref<FacturaFiscal[]>([]);

  // getCargarHouse
  async function verHouse(filtros: FiltroHouseConsulta): Promise<void> {
    filtros.id_branch = sessionBranchId();
    await axios
      .get<ApiResponse<HouseDetalle[] | undefined>>(import.meta.env.VITE_URL_MAIN + `house_ver`, {
        params: filtros,

        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
      .then(function (response) {
        const data = response.data;
        house.value = data.data ? data.data[0]! : {};
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setConfirmarTelex(data: Record<string, unknown>): Promise<void> {
    await axios
      .put<ApiResponse>(import.meta.env.VITE_URL_MAIN + `houses_confirmar_telex`, data, {
        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
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
  }

  async function guardarCarpetaHouse(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `crear-carpeta-house`,
      headers: headers,
      data: data,
    };

    axios<ApiResponse>(config).then((response) => {
      const res = response.data;
      console.log("Respuesta de guardarCarpetaHouse:", res);
    });
  }
  async function listarHouse(filtros: FiltroHouseConsulta): Promise<void> {
    filtros.id_branch = sessionBranchId();
    await axios
      .get<ApiResponse<HouseListado[] | undefined>>(import.meta.env.VITE_URL_MAIN + `listado_houses`, {
        params: filtros,

        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
      .then(function (response) {
        const data = response.data;

        listHouse.value = data.data ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarHouse(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_house?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<HouseListado[] | undefined>>(config)
      .then(function (response) {
        const data = response.data;

        listHouse.value = data.data ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function insertComentarioHouse(dataObj: Record<string, unknown> = {}): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertComentarioHouse`,
      headers: {
        "Content-Type": "application/json",
      },
      data: dataObj,
    };

    await axios<ApiResponse>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);

        const res = response.data;
        if (res.status == "401") {
          Swal.fire({
            icon: "error",
            text: res.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && res.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        } else {
          Swal.fire({
            icon: res.estadoflag ? "success" : "error",
            text: res.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function deleteHouse(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "setHouseDelete",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse & { statusBol?: boolean }>(config).then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      if (response.data.status == "401") {
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && response.data.status == "401") {
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      }

      if (response.data.statusBol) {
        Swal.fire({
          icon: "success",
          title: "REGISTRO ELIMINADO.",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            const ruta = router.currentRoute.value.name;
            console.log("ruta", ruta);
            if (ruta === "controlHouseEditar") {
              const id_master = store.state.copy_house.id_master;
              router.push({
                name: "controlMasterEditar",
                params: {
                  id: id_master,
                },
              });
            } else if (ruta === "controlMasterEditar") {
              window.location.reload();
            }
          }
        });
      }
    });
  }
  async function getFacturasFiscales(houseFacturable: HouseFacturable = {}): Promise<void> {
    lstFacturasFiscales.value = [];

    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getFacturasFiscales`,
      params: {
        id_house: houseFacturable.id_house,
        id_correlativo: houseFacturable.id_correlativo,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios<ApiResponse<FacturaFiscal[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);

        if (!!response.data.data[0]!.estadoflag) {
          lstFacturasFiscales.value = response.data.data;
        } else {
          lstFacturasFiscales.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    listHouse,
    house,
    lstFacturasFiscales,
    verHouse,
    setConfirmarTelex,
    guardarCarpetaHouse,
    listarHouse,
    getCargarHouse,
    insertComentarioHouse,
    deleteHouse,
    getFacturasFiscales,
  };
});
