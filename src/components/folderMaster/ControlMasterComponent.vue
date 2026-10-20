<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import dataGen from "./DataGenMaster.vue";
import houselist from "./HouseListMaster.vue";
import dataEmbar from "./DataEmbarMaster.vue";
import dataFechas from "./FechasMaster.vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { sessionBranchId } from "@/utils/sesion";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const route = useRoute();
const appRouter = useRouter();
const itemsOperadorList = computed(() => appStore.itemsOperadorList);

const formControlMasterReadonly = ref(false);
const loadingBotonNuevoHouse = ref(false);
const fab = ref(false);
const hover = false;
const transition = "slide-y-reverse-transition";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const operadorNombre = computed(() => {
  if (!mastersStore.master_id_operador || !itemsOperadorList.value) {
    return "";
  }
  const operador = itemsOperadorList.value.find(
    (op: { id: number; namelong: string }) => op.id == mastersStore.master_id_operador,
  );
  return operador ? operador.namelong : "";
});

async function recargarDatos() {
  await appStore._getHouseList();
}
async function irAVerMaster() {
  await appRouter.push({
    name: "controlMasterEditar",
    // @ts-expect-error id is not a known route location property
    id: route.params.id,
  });
  window.location.reload();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createCarpetaOneDrive({ name = "" }: { name?: string }) {
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `crear-carpeta-master?nromaster=${name}`,
    headers: {
      "Content-Type": "application/json",
    },
  };
  const res = await axios(config)
    .then(async function (response) {
      return response.data.data;
    })
    .catch((e) => {
     console.error(e);
      return false;
    });
  return res;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actualizarMaster({ id = 0, url = "" }: { id?: number; url?: string }) {
  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + `update_folder_onedrive`,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      id: id,
      url: url,
    },
  };
  await axios(config).then(async function (response) {
    return response.data.data;
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setMasterContainer(
  id_master: number,
  id_containers: number,
  nrocontainer: string,
  nroprecinto: string,
  quantity: number,
) {
  //vm._getnroMaster();
  const data = JSON.stringify({
    id_master: id_master,
    id_containers: id_containers,
    nro_containers: nrocontainer,
    nro_precinto: nroprecinto,
    quantity: quantity,
    status: 1,
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setMasterContainers",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error,
      });
    });
}
function _setHouseContainer(
  id_house: number,
  id_containers: number,
  nrocontainer: string,
  nroprecinto: string,
  quantity: number,
) {
  //vm._getnroMaster();
  const data = JSON.stringify({
    id_house: id_house,
    id_containers: id_containers,
    nro_containers: nrocontainer,
    nro_precinto: nroprecinto,
    quantity: quantity,
    status: 1,
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setHouseContainers",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function () {})
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error,
      });
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setMasterServices(id_master: number, id_house: number, i: number) {
  mastersStore.itemsServicesList.map(function (item: { id_begend: number; nameservice: string; price: number }) {
    const data = {
      id_house: id_house,
      id_begend: item.id_begend,
      nameservice: item.nameservice,
      price_services: item.price,
      status: 0,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setServices",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios(config)
      .then(function () {})
      .catch(function (error) {
        console.error(error);
      });
  });

  mastersStore.statusData = true;
  (appStore.master_itemsContainers as { id: number; nro_container: string; nro_precinto: string; cantidad: number }[]).map(function (item) {
    /*vm._setMasterContainer(
      id_master,
      item.id,
      item.nro_container,
      item.nro_precinto,
      item.cantidad
    );*/

    _setHouseContainer(
      id_house,
      item.id,
      item.nro_container,
      item.nro_precinto,
      item.cantidad,
    );
  });

  appStore._getHouseList();

  if (i == mastersStore.master_cantidad_house) {
    Swal.fire({
      icon: "success",
      title: "Excelente",
      text:
        "Master registrado éxitosamente con el número " +
        mastersStore.master_expediente,
    });
  }
}
async function addNewHouse() {
  loadingBotonNuevoHouse.value = !loadingBotonNuevoHouse.value;

  await _setHouse(mastersStore.master_insertId as unknown as Parameters<typeof _setHouse>[0]);
  await appStore._getHouseList();

  loadingBotonNuevoHouse.value = !loadingBotonNuevoHouse.value;

  // if (vm.$store.state.itemsHouseList.length > 1) {
  //   vm.$swal({
  //     icon: "question",
  //     html: "<b>¿Desea actualizar los costos en el Control de Gastos ahora?</b>",
  //     showConfirmButton: true,
  //     confirmButtonText: "Sí",
  //     confirmButtonColor: "#4CAF50",
  //     showDenyButton: true,
  //     denyButtonText: "No, en otro momento",
  //     allowOutsideClick: false,
  //   }).then(({ isConfirmed }) => {
  //     if (isConfirmed) {
  //       vm.$router.push({
  //         name: "editControlGasto",
  //         params: {
  //           code_master: vm.$store.state.master_nro_expediente,
  //           id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
  //             .id_branch,
  //         },
  //       });
  //     }
  //   });
  // }
}
async function _setHouse({ id_master = "", pintaSuccess = true }) {
  console.log("ssssssssssss");
  const finalIdMaster = id_master || mastersStore.master_insertId;
  if (!finalIdMaster) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se puede crear el House porque no existe un Master asociado.",
    });
    return null; // Retorna algo para indicar que falló la validación
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const i = appStore.itemsHouseList.length + 1;
  const data = JSON.stringify({
    id_master: finalIdMaster,
    // ... rest of your data object
    id_branch: sessionBranchId(),
    id_consigner_real: null,
    id_consigner: null,
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setHouse",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    // 1. IMPORTANTE: Ponemos el 'return' antes del await
    const response = await axios(config);

    const res = response.data.data;
    sessionStorage.setItem("auth-token", response.data.token);

    // Manejo de sesión expirada
    if (
      response.data.status == "401" ||
      response.data.mensaje === "Sesión Expirada"
    ) {
      await Swal.fire({
        /* ... tus opciones de Swal ... */
      });
      // @ts-expect-error router is not defined in this scope
      router.push({ name: "Login" });
      return null;
    }
    if (pintaSuccess) {
      Swal.fire({
        icon: "success",
        title: res[0].mensaje,
      });
    }

    // 2. Este return ahora sí devolverá el valor a quien llamó a _setHouse
    return res;
  } catch (error) {
    console.error("_setHouse: Error al crear House:", error);
    return null; // O el error, según prefieras
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setMasterHouse(id_master: number | string) {
  for (let i = 1; i <= mastersStore.master_cantidad_house; i++) {
    const data = JSON.stringify({
      code_house: appStore.house_expediente + "-" + i,
      id_master: !id_master || id_master == "" ? null : id_master,
      nro_house:
        !mastersStore.house_nro_expediente ||
        mastersStore.house_nro_expediente == ""
          ? null
          : mastersStore.house_nro_expediente,
      id_agent:
        !appStore.master_id_agente ||
        appStore.master_id_agente == ""
          ? null
          : appStore.master_id_agente,
      id_consigner: null,
      id_notify:
        !mastersStore.master_id_notify ||
        mastersStore.master_id_notify == ""
          ? null
          : mastersStore.master_id_notify,
      id_aerolinea:
        !mastersStore.master_id_airlines ||
        mastersStore.master_id_airlines == ""
          ? null
          : mastersStore.master_id_airlines,
      id_coloader:
        !mastersStore.master_id_coloader ||
        mastersStore.master_id_coloader == ""
          ? null
          : mastersStore.master_id_coloader,
      id_naviera:
        !mastersStore.master_id_naviera ||
        mastersStore.master_id_naviera == ""
          ? null
          : mastersStore.master_id_naviera,
      id_incoterms:
        !mastersStore.master_incoterms ||
        mastersStore.master_incoterms == ""
          ? null
          : mastersStore.master_incoterms,
      nro_hbl:
        !mastersStore.master_blmaster ||
        mastersStore.master_blmaster == ""
          ? null
          : mastersStore.master_blmaster,
      id_motonave:
        !mastersStore.master_id_motonave ||
        mastersStore.master_id_motonave == ""
          ? null
          : mastersStore.master_id_motonave,
      nro_viaje:
        !mastersStore.master_viaje || mastersStore.master_viaje == ""
          ? null
          : mastersStore.master_viaje,
      bultos:
        !mastersStore.master_bultos ||
        mastersStore.master_bultos == ""
          ? null
          : mastersStore.master_bultos,
      peso:
        !mastersStore.master_peso || mastersStore.master_peso == ""
          ? null
          : mastersStore.master_peso,
      volumen:
        !mastersStore.master_volumen ||
        mastersStore.master_volumen == ""
          ? null
          : mastersStore.master_volumen,
      id_conditions:
        !mastersStore.master_id_condicion ||
        mastersStore.master_id_condicion == ""
          ? null
          : mastersStore.master_id_condicion,
      id_moneda:
        !mastersStore.master_id_coins ||
        mastersStore.master_id_coins == ""
          ? null
          : mastersStore.master_id_coins,
      monto:
        !mastersStore.master_monto || mastersStore.master_monto == ""
          ? null
          : mastersStore.master_monto,
      status: 1,
      id_branch: sessionBranchId(),
    });

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setHouse",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        if (response.data.status == 200) {
          // vm._setMasterServices(id_master, response.data.data.insertid, i);
        }

        cleanData();
      })
      .catch(function (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: error,
        });
      });
  }
}
async function _putMaster() {
  if (validate()) {
    appStore.spiner = true;

    const cuotas = [];
    for (let i = 0; i < appStore.nro_cuotas; i++) {
      cuotas.push({
        porcentaje: appStore.cuota[i],
        fecha: appStore.fechacuota[i],
      });
    }

    const data = JSON.stringify({
      nro_master: mastersStore.nro_master,
      code_master: mastersStore.master_expediente,
      id_cot: mastersStore.master_cotizanion,
      id_modality: mastersStore.master_sentido,
      id_shipment:
        appStore.master_id_trasnport &&
        appStore.master_id_trasnport.id
          ? appStore.master_id_trasnport.id
          : appStore.master_id_trasnport,
      id_incoterms: mastersStore.master_incoterms,
      id_port_begin:
        !appStore.master_origen ||
        appStore.master_origen == ""
          ? null
          : appStore.master_origen,
      id_port_end:
        !appStore.master_destino ||
        appStore.master_destino == ""
          ? null
          : appStore.master_destino,
      id_operador:
        !mastersStore.master_id_operador ||
        mastersStore.master_id_operador == ""
          ? null
          : mastersStore.master_id_operador,
      fecha_eta:
        !mastersStore.master_fecha_eta ||
        mastersStore.master_fecha_eta == ""
          ? null
          : mastersStore.master_fecha_eta,
      fecha_etd:
        !mastersStore.master_fecha_etd ||
        mastersStore.master_fecha_etd == ""
          ? null
          : mastersStore.master_fecha_etd,
      fecha_disponibilidad:
        !mastersStore.master_fecha_disponibilidad ||
        mastersStore.master_fecha_disponibilidad == ""
          ? null
          : mastersStore.master_fecha_disponibilidad,
      ganancia_pricing:
        !mastersStore.master_ganancia_pricing ||
        mastersStore.master_ganancia_pricing == ""
          ? null
          : mastersStore.master_ganancia_pricing,
      ganancia_operaciones:
        !mastersStore.master_ganancia_operaciones ||
        mastersStore.master_ganancia_operaciones == ""
          ? null
          : mastersStore.master_ganancia_operaciones,
      id_agent:
        !appStore.master_id_agente ||
        appStore.master_id_agente == ""
          ? null
          : appStore.master_id_agente,
      id_consigner:
        !mastersStore.master_id_consigner ||
        mastersStore.master_id_consigner == ""
          ? null
          : mastersStore.master_id_consigner,
      id_notify:
        !mastersStore.master_id_notify ||
        mastersStore.master_id_notify == ""
          ? null
          : mastersStore.master_id_notify,
      id_aerolinea:
        !mastersStore.master_id_airlines ||
        mastersStore.master_id_airlines == ""
          ? null
          : mastersStore.master_id_airlines,
      id_coloader:
        !mastersStore.master_id_coloader ||
        mastersStore.master_id_coloader == ""
          ? null
          : mastersStore.master_id_coloader,
      id_naviera:
        !mastersStore.master_id_naviera ||
        mastersStore.master_id_naviera == ""
          ? null
          : mastersStore.master_id_naviera,
      nro_mbl:
        !mastersStore.master_blmaster ||
        mastersStore.master_blmaster == ""
          ? null
          : mastersStore.master_blmaster,
      id_motonave:
        !mastersStore.master_id_motonave ||
        mastersStore.master_id_motonave == ""
          ? null
          : mastersStore.master_id_motonave,
      nro_viaje:
        !mastersStore.master_viaje || mastersStore.master_viaje == ""
          ? null
          : mastersStore.master_viaje,
      bultos:
        !mastersStore.master_bultos ||
        mastersStore.master_bultos == ""
          ? null
          : mastersStore.master_bultos,
      peso:
        !mastersStore.master_peso || mastersStore.master_peso == ""
          ? null
          : mastersStore.master_peso,
      volumen:
        !mastersStore.master_volumen ||
        mastersStore.master_volumen == ""
          ? null
          : mastersStore.master_volumen,
      id_conditions:
        !mastersStore.master_id_condicion ||
        mastersStore.master_id_condicion == ""
          ? null
          : mastersStore.master_id_condicion,
      id_moneda:
        !mastersStore.master_id_coins ||
        mastersStore.master_id_coins == ""
          ? null
          : mastersStore.master_id_coins,
      monto:
        !mastersStore.master_monto || mastersStore.master_monto == ""
          ? null
          : mastersStore.master_monto,
      status: 1,
      id_branch: sessionBranchId(),
      cuotas: cuotas,
      nro_cuotas: appStore.nro_cuotas,
      grupalflag: mastersStore.grupalflag,
      fecha_libre_almacenaje: mastersStore.fecha_libre_almacenaje,
      fecha_libre_sobreestadia:
        mastersStore.fecha_libre_sobreestadia || null,
      almacen_recepcion: mastersStore.almacen_recepcion,
      dias_sobreestadia: mastersStore.dias_sobreestadia,
      id_canal: mastersStore.id_canal,
      nro_manifiesto: mastersStore.nro_manifiesto,
      namecampaign: mastersStore.namecampaign,
      master_itemsContainers: appStore.master_itemsContainers,
      vuelo: mastersStore.master_vuelo || null,
      nro_containers: appStore.master_nro_containers || null,
      nro_precinto: appStore.master_nro_precinto || null,
      salidaflag: mastersStore.salidaflag || null,
      llegadaflag: mastersStore.llegadaflag || null,
      disponibilidadflag: mastersStore.disponibilidadflag || null,
    });

    const config = {
      method: "post",
      url:
        import.meta.env.VITE_URL_MAIN +
        "editMaster/" +
        mastersStore.master_Id_get,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.status == 200) {
          Swal.fire({
            icon: "success",
            title: "Excelente",
            text: "Expediente actualizado con éxito",
          });
        } else {
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && response.data.status == "401") {
              // @ts-expect-error router is not defined in this scope
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }

        // vm.cleanData();
        // vm.$router.go(-1);
      })
      .catch(function (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: error,
        });
      });
    appStore.spiner = false;
  }
}
function cleanData() {
  mastersStore.master_nro_expediente = "";
  // vm.$store.state.master_expediente = "";
  //id_cot: vm.$store.state.master_cotizanion
  mastersStore.master_sentido = "";
  appStore.master_id_trasnport = "" as never;
  mastersStore.master_incoterms = "";
  appStore.master_origen = "";
  appStore.master_destino = "";
  mastersStore.master_id_operador = "";
  mastersStore.master_ganancia_pricing = "";
  mastersStore.master_ganancia_operaciones = "";
  appStore.master_id_agente = "";
  mastersStore.master_id_consigner = "";
  mastersStore.master_id_notify = "";
  mastersStore.master_id_airlines = "";
  mastersStore.master_id_coloader = "";
  mastersStore.master_id_naviera = "";
  mastersStore.master_blmaster = "";
  mastersStore.master_id_motonave = "";
  mastersStore.master_viaje = "";
  mastersStore.master_bultos = "";
  mastersStore.master_peso = "";
  mastersStore.master_volumen = "";
  mastersStore.master_id_condicion = "";
  mastersStore.master_id_coins = "";
  mastersStore.master_monto = "";
  mastersStore.cuotas = 3;
  mastersStore.grupalflag = false;
  appStore.cuota = [];
  appStore.fechacuota = [];
  mastersStore.url_folderonedrive = "";
  appStore.master_itemsContainers = [];
}
function validate() {
  let val = true;
  let sum = 0;
  let html = "<ul>";
  if (mastersStore.grupalflag) {
    let fechaAnterior = "";
    for (let i = 0; i < appStore.nro_cuotas; i++) {
      if ((appStore.cuota[i] as number) < 0) {
        val = false;
        html += `<li> El porcentaje ${i + 1} no puede ser negativo</li>`;
      }

      if ((appStore.cuota[i] as number) > 100) {
        val = false;
        html += `<li> El porcentaje ${
          i + 1
        }  no puede ser mayor que el 100% </li>`;
      }

      sum += parseFloat(appStore.cuota[i] as string);

      if (!appStore.fechacuota[i]) {
        html += `<li> La fecha de pago ${i + 1} es requerida</li>`;
      } else if (appStore.fechacuota[i]! < fechaAnterior) {
        html += `<li> La fecha de pago ${
          i + 1
        } debe ser mayor o igual a la anterior</li>`;
      }

      fechaAnterior = appStore.fechacuota[i]!;
    }

    if (sum != 100) {
      val = false;
      html += "<li>El porcentaje final debe ser igual al 100%</li>";
    }
  }

  if (mastersStore.dias_sobreestadia) {
    if ((mastersStore.dias_sobreestadia as number) < 0) {
      val = false;
      html +=
        "<li>Días Libres de Sobreestadía no pueden ser negativos</li>";
    }
  }
  if (!mastersStore.master_sentido) {
    val = false;
    html += "<li>El sentido es requerido</li>";
  }
  if (!appStore.master_id_trasnport) {
    val = false;
    html += "<li>El tipo de embarque es requerido</li>";
  }
  if (!mastersStore.master_incoterms) {
    val = false;
    html += "<li>El incoterms es requerido</li>";
  }
  if (!appStore.master_origen) {
    val = false;
    html += "<li>El origen es requerido</li>";
  }
  if (!appStore.master_destino) {
    val = false;
    html += "<li>El destino es requerido</li>";
  }
  if (!mastersStore.master_fecha_eta) {
    val = false;
    html += "<li>La fecha eta es requerida</li>";
  }
  if (!mastersStore.master_fecha_etd) {
    val = false;
    html += "<li>La fecha etd es requerida</li>";
  }
  if (
    mastersStore.statusData &&
    !appStore.itemsHouseList.length
  ) {
    val = false;
    html +=
      "<li>Debe asignar un Expediente House como mínimo para guardar el expediente máster</li>";
  }

  html += "</ul>";
  if (!val) {
    Swal.fire({
      icon: "error",
      html: html,
    });
  }
  return val;
}
async function _setMaster() {
  if (validate()) {
    appStore.spiner = true;

    const cuotas = [];
    for (let i = 0; i < appStore.nro_cuotas; i++) {
      cuotas.push({
        porcentaje: appStore.cuota[i],
        fecha: appStore.fechacuota[i],
      });
    }
    //vm._getnroMaster();
    const data = JSON.stringify({
      nro_master: mastersStore.master_nro_expediente,
      code_master: mastersStore.master_expediente,
      id_cot: mastersStore.master_cotizanion
        ? mastersStore.master_cotizanion
        : null,
      id_modality: mastersStore.master_sentido,
      id_shipment: appStore.master_id_trasnport.id,
      id_incoterms: mastersStore.master_incoterms,
      id_port_begin:
        !appStore.master_origen ||
        appStore.master_origen == ""
          ? null
          : appStore.master_origen,
      id_port_end:
        !appStore.master_destino ||
        appStore.master_destino == ""
          ? null
          : appStore.master_destino,
      id_operador:
        !mastersStore.master_id_operador ||
        mastersStore.master_id_operador == ""
          ? null
          : mastersStore.master_id_operador,
      fecha_eta: mastersStore.master_fecha_eta,
      fecha_etd: mastersStore.master_fecha_etd,
      fecha_disponibilidad: mastersStore.master_fecha_disponibilidad,
      ganancia_pricing: mastersStore.master_ganancia_pricing
        ? mastersStore.master_ganancia_pricing
        : null,
      ganancia_operaciones: mastersStore.master_ganancia_operaciones
        ? mastersStore.master_ganancia_operaciones
        : null,
      id_agent: appStore.master_id_agente
        ? appStore.master_id_agente
        : null,
      id_consigner: mastersStore.master_id_consigner,
      id_notify:
        !mastersStore.master_id_notify ||
        mastersStore.master_id_notify == ""
          ? null
          : mastersStore.master_id_notify,
      id_aerolinea: mastersStore.master_id_airlines
        ? mastersStore.master_id_airlines
        : null,
      id_coloader:
        !mastersStore.master_id_coloader ||
        mastersStore.master_id_coloader == ""
          ? null
          : mastersStore.master_id_coloader,
      id_naviera:
        !mastersStore.master_id_naviera ||
        mastersStore.master_id_naviera == ""
          ? null
          : mastersStore.master_id_naviera,
      nro_mbl:
        !mastersStore.master_blmaster ||
        mastersStore.master_blmaster == ""
          ? null
          : mastersStore.master_blmaster,
      id_motonave:
        !mastersStore.master_id_motonave ||
        mastersStore.master_id_motonave == ""
          ? null
          : mastersStore.master_id_motonave,
      nro_viaje:
        !mastersStore.master_viaje || mastersStore.master_viaje == ""
          ? null
          : mastersStore.master_viaje,
      bultos:
        !mastersStore.master_bultos ||
        mastersStore.master_bultos == ""
          ? null
          : mastersStore.master_bultos,
      peso:
        !mastersStore.master_peso || mastersStore.master_peso == ""
          ? null
          : mastersStore.master_peso,
      volumen:
        !mastersStore.master_volumen ||
        mastersStore.master_volumen == ""
          ? null
          : mastersStore.master_volumen,
      id_conditions:
        !mastersStore.master_id_condicion ||
        mastersStore.master_id_condicion == ""
          ? null
          : mastersStore.master_id_condicion,
      id_moneda:
        !mastersStore.master_id_coins ||
        mastersStore.master_id_coins == ""
          ? null
          : mastersStore.master_id_coins,
      monto:
        !mastersStore.master_monto || mastersStore.master_monto == ""
          ? null
          : mastersStore.master_monto,
      status: 1,
      id_branch: sessionBranchId(),
      cuotas: cuotas,
      nro_cuotas: appStore.nro_cuotas,
      grupalflag: mastersStore.grupalflag,
      fecha_libre_almacenaje: mastersStore.fecha_libre_almacenaje,
      fecha_libre_sobreestadia:
        mastersStore.fecha_libre_sobreestadia || null,
      almacen_recepcion: mastersStore.almacen_recepcion,
      dias_sobreestadia: mastersStore.dias_sobreestadia,
      id_canal: mastersStore.id_canal,
      nro_manifiesto: mastersStore.nro_manifiesto,
      namecampaign: mastersStore.namecampaign,
      master_itemsContainers: appStore.master_itemsContainers,
      // Nuevos campos para embarque
      vuelo: mastersStore.master_vuelo || null,
      nro_containers: appStore.master_nro_containers || null,
      nro_precinto: appStore.master_nro_precinto || null,
      salidaflag: mastersStore.salidaflag || null,
      llegadaflag: mastersStore.llegadaflag || null,
      disponibilidadflag: mastersStore.disponibilidadflag || null,
    });

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setMaster",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(async function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        // Solo redirigir a login cuando es 401 o sesión expirada
        if (
          response.data.status == "401" ||
          response.data.mensaje === "Sesión Expirada"
        ) {
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then(function (resSwal) {
            if (resSwal.isConfirmed) {
              // @ts-expect-error router is not defined in this scope
              router.push({ name: "Login" });
              setTimeout(function () {
                window.location.reload();
              }, 10);
            }
          });
          appStore.spiner = false;
          return;
        }

        const masterRow =
          response.data.data && response.data.data[0]
            ? response.data.data[0]
            : null;

        const id_master = masterRow
          ? masterRow.id || masterRow.insertid
          : null;

        if (!id_master) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID del expediente creado. Revise la consola para más detalles.",
          });
          appStore.spiner = false;
          return;
        }

        Swal.fire({
          icon: "info",
          title: "Espera",
          timerProgressBar: true,
          text: "Generando expediente...",
        });

        const id_branch = sessionBranchId();
        const branchCreacion = [1, 2];
        if (branchCreacion.includes(id_branch)) {
          // var url = await vm.createCarpetaOneDrive({
          //   name: vm.$store.state.master_nro_expediente,
          // });
          // await vm.actualizarMaster({
          //   id: id_master,
          //   url: url,
          // });
        }

        const res = await _setHouse({
          id_master: id_master,
          pintaSuccess: false,
        });
        Swal.close();
        console.log("_setMaster: Respuesta de _setHouse:", res);
        if (res[0].estadoflag) {
          appRouter.push({
            name: "controlHouseEditar",
            params: {
              id: res[0].insertid,
              activar: 1,
            },
          });
        }
        appStore.itemsHouseList = [];
        mastersStore.master_insertId = id_master;

        // vm.$router.push({
        //   name: "controlMasterEditar",
        //   params: {
        //     id: id_master,
        //   },
        // });
        // window.location.reload();
      })
      .catch(function (error) {
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: "Error al crear el expediente: " + (error.message || error),
        });
      });
    appStore.spiner = false;
  }
}

onMounted(async () => {
  // this.$store.state.spiner = true;

  if (route.name == "controlMaster") {
    appStore.mainTitle = "CONTROL DE EXPEDIENTE MÁSTER";
  } else if (route.name == "controlMasterEditar") {
    nextTick(() => {
      setTimeout(() => {
        appStore.mainTitle =
          "CONTROL DE EXPEDIENTE MÁSTER [EDITAR] - N° Exp:" +
          mastersStore.nro_master;
      }, 2000);
    });
  } else if (route.name == "controlMasterVer") {
    appStore.mainTitle = "CONTROL DE EXPEDIENTE MÁSTER [MODO VISTA]";
    formControlMasterReadonly.value = true;
  }
  await Promise.all([cleanData(), appStore._getnroHouse()]);

  // this.$store.state.spiner = false;

  //this._validaData();
});
</script>

<template>
  <v-form
    ref="formControlMaster"
    :readonly="formControlMasterReadonly"
  >
    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <dataGen />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="5"
        >
          <v-card>
            <v-card-text>
              <dataEmbar :is-form-actions-disabled="formControlMasterReadonly" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="3"
        >
          <v-card>
            <v-card-text>
              <h3>Fechas</h3>
              <dataFechas />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12">
          <houselist
            v-if="mastersStore.statusData"
            @recargar-datos="recargarDatos"
          />
        </v-col>
        <div style="position: fixed; bottom: 16px; right: 16px; z-index: 3000">
          <v-fab-transition v-if="formControlMasterReadonly">
            <v-btn
              icon
              size="large"
              location="bottom left"
              color="info"
              @click="irAVerMaster()"
            >
              <v-icon> mdi-pencil </v-icon>
            </v-btn>
          </v-fab-transition>
          <v-speed-dial
            v-else
            v-model="fab"
            location="top end"
            :open-on-hover="hover"
            :transition="transition"
            content-class="acciones-dial"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="info"
                icon
                aria-label="Acciones"
              >
                <v-icon v-if="fab">
                  mdi-close
                </v-icon>
                <v-icon v-else>
                  mdi-tools
                </v-icon>
              </v-btn>
            </template>
            <!-- Invertimos el orden en el DOM para que el último quede ARRIBA al abrir hacia arriba -->
            <v-btn
              v-if="mastersStore.url_folderonedrive"
              @click="mastersStore.openURL({ url: mastersStore.url_folderonedrive })"
              color="yellow"
            >
              <v-icon start>
                mdi-folder
              </v-icon>
              Carpeta
            </v-btn>
            <v-btn
              v-if="mastersStore.statusData"
              @click="addNewHouse()"
              color="primary"
              :loading="loadingBotonNuevoHouse"
            >
              <v-icon start>
                mdi-home-plus
              </v-icon>
              Agregar House
            </v-btn>
            <v-btn
              color="light-green-lighten-1"
              @click="_putMaster()"
              v-if="route.params.id"
            >
              <v-icon start>
                mdi-content-save
              </v-icon>
              Guardar Cambios
            </v-btn>
            <v-btn
              color="light-green-lighten-1"
              @click="_setMaster()"
              v-if="!route.params.id"
            >
              <v-icon start>
                mdi-content-save
              </v-icon>
              Guardar
            </v-btn>
          </v-speed-dial>
        </div>
      </v-row>
    </v-container>
  </v-form>
</template>

<style lang="scss" scoped>
._content__bitacora {
  height: 90vh;
  overflow-y: scroll;
  --scrollbar-width: none !important;
}

.div__button_bottom {
  text-decoration: none;
  text-align: center;
  margin-right: 20px;
  display: block;
}

.title_button_bottom {
  text-decoration: none;
  color: #252c32;
}

:global(.acciones-dial.v-speed-dial__content) {
  flex-direction: column-reverse;
  align-items: flex-end;
}
.acciones-dial .v-btn {
  min-width: 220px;
}
.acciones-dial .v-btn :deep(.v-btn__content) {
  justify-content: flex-start;
  width: 100%;
  font-size: 1.2rem;
  line-height: 1.4;
}
.acciones-dial .v-btn .v-icon {
  font-size: 22px !important;
  margin-right: 8px;
}
</style>
