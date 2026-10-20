<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionListado } from "@/types/cotizacion";
import type { CotizacionAsociableHouse, ServicioHouse } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const recargarClienteFlag = computed(() => rootStore.state.recargarClienteFlag);

const error = ref("");
const dialogCliente = ref(false);
const searchHouseCotizacion = ref("");
const searchHouseCotizacionAduana = ref("");
const house_service_id_begend = ref<number | string>("");
const house_service_name = ref("");
const bloquearQuote = ref(false);
const dataAprobar = ref<CotizacionAsociableHouse>({} as CotizacionAsociableHouse);
const id_opcion = ref("");
const activarBtnContinuar = ref(false);
const dialogCostos = ref(false);
const dialogCostosAduana = ref(false);
const textValidacionPago = ref("");
const optionCostos = [
  { id: "0", text: "No hacer ninguna acción" },
  { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
  {
    id: "2",
    text: "Sumar los nuevos costos, a los costos ya existentes de proveedores",
  },
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadingBotonGuardarHouse: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let statusData: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let id_transport: number | string | undefined;
const formNewService = useTemplateRef("formNewService");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const esAereo = computed(() => {
  const v = rootStore.state.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = rootStore.state.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "Aéreo";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const esFCL = computed(() => {
  const v = rootStore.state.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = rootStore.state.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "FCL";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const esLCL = computed(() => {
  const v = rootStore.state.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = rootStore.state.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "LCL";
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isDisabled(item: { porasignar?: boolean }) {
  return !item.porasignar; // Deshabilita si el estado no es "activo"
}
function irAMaster() {
  console.log("ir a master", rootStore.state.id_master);
  appRouter.push({
    name: "controlMasterVer",
    params: {
      id: rootStore.state.id_master,
    },
  });
}
function reset() {
  rootStore.state.copy_house = null;
  rootStore.state.dataHouse_transporte = null;
  rootStore.state.house_origen = null;
  rootStore.state.house_destino = null;
  rootStore.state.house_sentido = null;
  rootStore.state.house_id_trasnport = null;
  rootStore.state.house_incoterms = null;
  rootStore.state.house_cotizacion = null;
  rootStore.state.house_cotizacionaduana = null;
  rootStore.state.house_origen = null;
  rootStore.state.house_destino = null;
  rootStore.state.house_expediente = null;
  rootStore.state.house_master = null;
  rootStore.state.house_master_expediente = null;
  rootStore.state.house_id_agente = null;
  rootStore.state.house_id_consigner = null;
  rootStore.state.house_id_notify = null;
  rootStore.state.house_id_airlines = null;
  rootStore.state.house_id_coloader = null;
  rootStore.state.house_id_naviera = null;
  rootStore.state.house_blmaster = null;
  rootStore.state.house_id_motonave = null;
  rootStore.state.house_viaje = null;
  rootStore.state.house_bultos = null;
  rootStore.state.house_peso = null;
  rootStore.state.house_volumen = null;
  rootStore.state.house_id_condicion = null;
  rootStore.state.house_id_coins = null;
  rootStore.state.house_monto = null;
  rootStore.state.house_id = null;
  rootStore.state.url_onedrive = null;
  rootStore.state.house_id_consigner_real = null;
  rootStore.state.itemsHouseContainers = null;
  rootStore.state.house_nro_declaracion_aduana = null;
  rootStore.state.house_canal_aduana = null;
  rootStore.state.house_enlace_tracking = null;
}
function _callModalEntitie(id_role: number) {
  rootStore.state.id_role_actual = id_role;
  if (id_role == 1) {
    rootStore.state.modalAgente = !rootStore.state.modalAgente;
  } else if (id_role == 11) {
    rootStore.state.modalEntitie = !rootStore.state.modalEntitie;
  } else if (id_role == 17) {
    rootStore.state.modalColoader = !rootStore.state.modalColoader;
  } else if (id_role == 2) {
    rootStore.state.modalNaviera = !rootStore.state.modalNaviera;
  }
}
function aduanaaprobada(item: CotizacionListado) {
  return item.aprobadoflag; // Deshabilita si el estado no es "activo"
}
async function guardar() {
  const guardado = await _setHouseEdit();
  if (!guardado) {
    return;
  }

  appRouter.push({
    name: "controlHouseVer",
    params: {
      id: route.params.id,
    },
  });
  dialogCliente.value = false;
}
async function _setHouseEdit() {
  error.value = "";
  if (!rootStore.state.house_id_consigner) {
    error.value = "Dato Requerido";
    return false;
  }

  loadingBotonGuardarHouse = true;

  const lstservices = (rootStore.state.itemsHouseServices || []).map(
    (item: ServicioHouse) => ({
      id: item.id || null,
      id_begend: item.id_begend || null,
      nameservice: item.nameservice || null,
      status: item.status ? 1 : 0,
      date_service: item.date_service || null,
    }),
  );

  const data = JSON.stringify({
    id_modality: rootStore.state.house_sentido
      ? rootStore.state.house_sentido
      : "",
    id_shipment: rootStore.state.house_id_trasnport
      ? rootStore.state.house_id_trasnport
      : "",
    id_consigner_real: rootStore.state.house_id_consigner_real
      ? rootStore.state.house_id_consigner_real
      : "",
    id_port_begin: rootStore.state.house_origen
      ? rootStore.state.house_origen
      : "",
    id_port_end: rootStore.state.house_destino
      ? rootStore.state.house_destino
      : "",
    id_proveedor: rootStore.state.house_id_agente
      ? rootStore.state.house_id_agente
      : "",
    id_consigner: rootStore.state.house_id_consigner
      ? rootStore.state.house_id_consigner
      : "",
    id_notify: rootStore.state.house_id_notify
      ? rootStore.state.house_id_notify
      : "",
    id_aerolinea: rootStore.state.house_id_airlines
      ? rootStore.state.house_id_airlines
      : "",
    id_coloader: rootStore.state.house_id_coloader
      ? rootStore.state.house_id_coloader
      : "",
    id_naviera: rootStore.state.house_id_naviera
      ? rootStore.state.house_id_naviera
      : "",
    id_incoterms: rootStore.state.house_incoterms
      ? rootStore.state.house_incoterms
      : "",
    nro_hbl: rootStore.state.house_blmaster
      ? rootStore.state.house_blmaster
      : "",
    id_motonave: rootStore.state.house_id_motonave
      ? rootStore.state.house_id_motonave
      : "",
    nro_viaje: rootStore.state.house_viaje
      ? rootStore.state.house_viaje
      : "",
    bultos: rootStore.state.house_bultos
      ? rootStore.state.house_bultos
      : "",
    peso: rootStore.state.house_peso ? rootStore.state.house_peso : "",
    volumen: rootStore.state.house_volumen
      ? rootStore.state.house_volumen
      : "",
    id_conditions: rootStore.state.house_id_condicion
      ? rootStore.state.house_id_condicion
      : "",
    id_moneda: rootStore.state.house_id_coins
      ? rootStore.state.house_id_coins
      : "",
    monto: rootStore.state.house_monto ? rootStore.state.house_monto : "",
    id_branch: sessionBranchId(),
    id_cot: rootStore.state.house_cotizacion
      ? rootStore.state.house_cotizacion
      : "",
    lstservices,
    id: rootStore.state.house_id,
    nro_declaracion_aduana:
      rootStore.state.house_nro_declaracion_aduana || "",
    canal_aduana: rootStore.state.house_canal_aduana || "",
  });

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "setHouseEdit",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios(config);
    sessionStorage.setItem("auth-token", response.data.token);

    if (response.data.status == "401") {
      loadingBotonGuardarHouse = false;
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
      return false;
    }

    statusData = true;

    if (!rootStore.state.url_onedrive) {
      const proveedor = rootStore.state.clientes.find(
        (v: { id: number }) => v.id == rootStore.state.house_id_consigner,
      );
      const id_branch = sessionBranchId();
      const id_branchs = ["1", "2", 1, 2];
      if (id_branchs.includes(id_branch)) {
        await housesStore.guardarCarpetaHouse({
          id: rootStore.state.house_master,
          nroMaster: `${rootStore.state.house_master_expediente}_${proveedor.namelong}`,
        });
      }
    }

    loadingBotonGuardarHouse = false;
    await Swal.fire({
      icon: "success",
      title: "Excelente",
      text: "House actualizado éxitosamente",
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    return true;
  } catch (error) {
    console.error(error);
    loadingBotonGuardarHouse = false;
    Swal.fire({
      icon: "error",
      title: "Lo sentimos",
      text: error as string,
    });
    return false;
  } finally {
    loadingBotonGuardarHouse = false;
  }
}
async function validarExistePagosMaster() {
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  if (id_opcion.value == "1") {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_existe_pago_master",
      headers: {
        "Content-Type": "application/json",
       
      },
      params: {
        id: rootStore.state.house_cotizacion,
      },
    };
    const res = await axios(config).then((res) => {
      return res.data;
    });
    activarBtnContinuar.value = res.estadoflag;
    textValidacionPago.value = res.mensaje;
    return;
  }
  activarBtnContinuar.value = false;
}
async function asignarDatos() {
  dataAprobar.value = pricingStore.listQuotes.filter(
    (v) => v.id == rootStore.state.house_cotizacion,
  )[0] as CotizacionAsociableHouse;
  dialogCostos.value = true;
}
async function asignarDatosAduana() {
  dataAprobar.value = aduanaStore.listQuotes2.filter(
    (v) => v.id == rootStore.state.house_cotizacionaduana,
  )[0] as CotizacionAsociableHouse;
  console.log(dataAprobar.value);
  dialogCostosAduana.value = true;
}
async function asociarCotizacionP() {
  const valor = dataAprobar.value.listIngresosInstructivo.filter(
    (v) => v.descripcion === "TOTAL",
  )[0]!.valor;
  const igv = dataAprobar.value.listIngresosInstructivo.filter(
    (v) => v.descripcion === "TOTAL",
  )[0]!.igv;
  await pricingStore.aprobarCotizacion({
    id_quote: rootStore.state.house_cotizacion, //
    nuevoexpediente: false, //
    id_exp: rootStore.state.house_master, //
    fecha_validez: "", //
    totalIngreso: valor, //
    igvIngreso: igv, //
    valorIngreso: valor, //
    listCostosInstructivo: dataAprobar.value.listCostosInstructivo, //
    listVentasInstructivo: dataAprobar.value.listIngresosInstructivo, //
    id_house: route.params.id, //
    id_opcion: id_opcion.value, //
  });
}
async function asociarCotizacionA() {
  const valor = dataAprobar.value.listIngresosInstructivo.filter(
    (v) => v.descripcion === "TOTAL",
  )[0]!.valor;
  const igv = dataAprobar.value.listIngresosInstructivo.filter(
    (v) => v.descripcion === "TOTAL",
  )[0]!.igv;
  await aduanaStore.aprobarCotizacionAduana({
    id_quote: rootStore.state.house_cotizacionaduana, //
    nuevoexpediente: false, //
    id_exp: rootStore.state.house_master, //
    fecha_validez: "", //
    totalIngreso: valor, //
    igvIngreso: igv, //
    valorIngreso: valor, //
    listCostosInstructivo: dataAprobar.value.listCostosInstructivo, //
    listVentasInstructivo: dataAprobar.value.listIngresosInstructivo, //
    id_house: route.params.id, //
    id_opcion: id_opcion.value, //
  });
}
async function _validaData() {
  if (route.params.id) {
    await housesStore.verHouse(route.params);
    const house = housesStore.house;

    rootStore.state.copy_house = house;
    rootStore.state.id_master = house.id_master;
    rootStore.state.telexconfirmado = house.telexconfirmado;
    rootStore.state.fechaconfirmaciontelex = house.fechaconfirmaciontelex;
    rootStore.state.dataHouse_transporte = house.id_transport;
    rootStore.state.house_origen = house.id_port_begin;
    rootStore.state.house_destino = house.id_port_end;
    rootStore.state.house_sentido = house.id_modality;
    rootStore.state.house_id_trasnport = house.id_shipment;
    rootStore.state.house_incoterms = house.id_incoterms;
    rootStore.state.house_cotizacion = house.id_cot;
    rootStore.state.house_cotizacionaduana = house.id_quoteaduana;

    id_transport = house.id_transport;

    rootStore.state.house_origen = house.id_port_begin;
    rootStore.state.house_destino = house.id_port_end;
    rootStore.state.house_expediente = house.code_house;
    rootStore.state.house_master = house.id_master;
    rootStore.state.house_master_expediente = house.code_master;
    rootStore.state.house_id_agente = house.id_proveedor;
    rootStore.state.house_id_consigner = house.id_consigner;
    rootStore.state.house_id_notify = house.id_notify;
    rootStore.state.house_id_airlines = house.id_aerolinea;
    rootStore.state.house_id_coloader = house.id_coloader;
    rootStore.state.house_id_vendedor = house.id_vendedor;
    rootStore.state.house_id_pricing = house.id_pricing;
    //this.$store.state.house_id_agente = house.id_agent;
    rootStore.state.house_id_naviera = house.id_naviera;
    rootStore.state.house_blmaster = house.nro_hbl;
    rootStore.state.house_id_motonave = house.id_motonave;
    rootStore.state.house_viaje = house.nro_viaje;
    rootStore.state.house_bultos = house.bultos;
    rootStore.state.house_peso = house.peso;
    rootStore.state.house_volumen = house.volumen;
    rootStore.state.house_id_condicion = house.id_conditions;
    rootStore.state.house_id_coins = house.id_moneda;
    rootStore.state.house_monto = house.monto;
    rootStore.state.house_id = house.id;
    rootStore.state.url_onedrive = house.url_onedrive;
    rootStore.state.house_id_consigner_real = house.id_consigner_real;
    rootStore.state.itemsHouseContainers = house.itemshousecontainers;
    rootStore.state.house_nro_declaracion_aduana =
      house.nro_declaracion_aduana || "";
    rootStore.state.house_canal_aduana = house.canal_aduana || "";
    const id_cot = house.id_cot;
    const id_quote = house.id_quoteaduana;
    bloquearQuote.value = !!(id_cot || id_quote);
    Promise.all([
      rootStore.dispatch("_getPortBegin", {
        id_transport: house.id_transport,
        id: house.id_port_begin,
      }),
      rootStore.dispatch("_getPortEnd", {
        id_transport: house.id_transport,
        id: house.id_port_end,
      }),
      rootStore.dispatch("_getServicesBegin"),
      rootStore.dispatch("_getBitacoraLineal", {
        id_modalidad: rootStore.state.house_sentido,
        id_shipment: rootStore.state.house_id_trasnport,
        id_incoterms: rootStore.state.house_incoterms,
      }),
      // this._getComentariosPredefinidos(),
    ]);
    rootStore.state.house_enlace_tracking = house.token_rastreo
      ? "https://aco.agentedecargaonline.com/tracking/" +
        house.token_rastreo
      : "";
    if (
      !rootStore.state.house_id_consigner &&
      !!route.params.activar
    ) {
      dialogCliente.value = true;
    } else {
      dialogCliente.value = false;
    }
  }
  // if (vm.$route.params.id) {
  //   var data = {
  //     id: vm.$route.params.id,
  //     id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
  //       .id_branch,
  //   };
  //   var config = {
  //     method: "post",
  //     url: import.meta.env.VITE_URL_MAIN + "getHouseListId/",
  //     headers: {
  //      
  //       "Content-Type": "application/json",
  //     },
  //     data: data,
  //   };
  //   await axios(config)
  //     .then(async function (response) {
  //       sessionStorage.setItem("auth-token", response.data.token);

  //       vm.$store.state.copy_house = response.data.data[0];
  //       vm.$store.state.dataHouse_transporte =
  //         response.data.data[0].id_transport;
  //       vm.$store.state.house_origen = response.data.data[0].id_port_begin;
  //       vm.$store.state.house_destino = response.data.data[0].id_port_end;
  //       vm.$store.state.house_sentido = response.data.data[0].id_modality;
  //       vm.$store.state.house_id_trasnport =
  //         response.data.data[0].id_shipment;
  //       vm.$store.state.house_incoterms =
  //         response.data.data[0].id_incoterms;
  //       vm.$store.state.house_cotizacion = response.data.data[0].id_cot;
  //       vm.$store.state.house_cotizacionaduana =
  //         response.data.data[0].id_quoteaduana;

  //       vm.id_transport = response.data.data[0].id_transport;
  //       await vm._getPortBegin({
  //         id_transport: response.data.data[0].id_transport,
  //         id: response.data.data[0].id_port_begin,
  //       });
  //       await vm._getPortEnd({
  //         id_transport: response.data.data[0].id_transport,
  //         id: response.data.data[0].id_port_end,
  //       });
  //       vm.$store.state.house_origen = response.data.data[0].id_port_begin;
  //       vm.$store.state.house_destino = response.data.data[0].id_port_end;
  //       vm.$store.state.house_expediente = response.data.data[0].code_house;
  //       vm.$store.state.house_master = response.data.data[0].id_master;
  //       vm.$store.state.house_master_expediente =
  //         response.data.data[0].code_master;
  //       vm.$store.state.house_id_agente =
  //         response.data.data[0].id_proveedor;
  //       vm.$store.state.house_id_consigner =
  //         response.data.data[0].id_consigner;
  //       vm.$store.state.house_id_notify = response.data.data[0].id_notify;
  //       vm.$store.state.house_id_airlines =
  //         response.data.data[0].id_aerolinea;
  //       vm.$store.state.house_id_coloader =
  //         response.data.data[0].id_coloader;
  //       //vm.$store.state.house_id_agente = response.data.data[0].id_agent;
  //       vm.$store.state.house_id_naviera = response.data.data[0].id_naviera;
  //       vm.$store.state.house_blmaster = response.data.data[0].nro_hbl;
  //       vm.$store.state.house_id_motonave =
  //         response.data.data[0].id_motonave;
  //       vm.$store.state.house_viaje = response.data.data[0].nro_viaje;
  //       vm.$store.state.house_bultos = response.data.data[0].bultos;
  //       vm.$store.state.house_peso = response.data.data[0].peso;
  //       vm.$store.state.house_volumen = response.data.data[0].volumen;
  //       vm.$store.state.house_id_condicion =
  //         response.data.data[0].id_conditions;
  //       vm.$store.state.house_id_coins = response.data.data[0].id_moneda;
  //       vm.$store.state.house_monto = response.data.data[0].monto;
  //       vm.$store.state.house_id = response.data.data[0].id;
  //       vm.$store.state.url_onedrive = response.data.data[0].url_onedrive;
  //       vm.$store.state.house_id_consigner_real =
  //         response.data.data[0].id_consigner_real;
  //       vm.$store.state.itemsHouseContainers =
  //         response.data.data[0].itemshousecontainers;
  //       vm.$store.state.house_nro_declaracion_aduana =
  //         response.data.data[0].nro_declaracion_aduana || "";
  //       vm.$store.state.house_canal_aduana =
  //         response.data.data[0].canal_aduana || "";
  //       const id_cot = response.data.data[0].id_cot;
  //       const id_quote = response.data.data[0].id_quoteaduana;
  //       vm.bloquearQuote = !!(id_cot || id_quote);

  //       await vm._getServicesBegin();
  //       // await vm._getBitacoraLineal();
  //       vm.$store.state.house_enlace_tracking = response.data.data[0]
  //         .token_rastreo
  //         ? "https://aco.agentedecargaonline.com/tracking/" +
  //           response.data.data[0].token_rastreo
  //         : "";

  //       if (
  //         !vm.$store.state.house_id_consigner &&
  //         !!vm.$route.params.activar
  //       ) {
  //         vm.dialogCliente = true;
  //       }
  //     })
  //     .catch(function (error) {
  //       console.error(error);
  //     });
  //   vm.$store.state.spiner = false;
  //   await vm._getBitacoraLineal({
  //     id_modalidad: vm.$store.state.house_sentido,
  //     id_shipment: vm.$store.state.house_id_trasnport,
  //     id_incoterms: vm.$store.state.house_incoterms,
  //   });
  //   // await this._getComentariosPredefinidos();
  // }
}
async function _activePort(id_transport: number) {
  await rootStore.dispatch("_getPortBegin", { id_transport: id_transport });
  await rootStore.dispatch("_getPortEnd", { id_transport: id_transport });
  if (rootStore.state.master_id_trasnport.id == 1) {
    rootStore.state.embar_title_nacn = "Aerolinea";
  } else if (rootStore.state.master_id_trasnport.id == 2) {
    rootStore.state.embar_title_nacn = "Naviera";
  } else if (rootStore.state.master_id_trasnport.id == 3) {
    rootStore.state.embar_title_nacn = "Coloader";
  } else {
    rootStore.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
function _getDataService() {
  rootStore.dispatch("_getServicesBegin");
  // this._getBitacoraList();
  // this._getBitacoraLineal();
}
async function setNewService() {
  if ((await formNewService.value!.validate()).valid) {
    const dataBegend =
      rootStore.state.itemsBegEndList.find(
        (v: { id: number }) => v.id === house_service_id_begend.value,
      ) || {};
    const dataService = {
      id_begend: house_service_id_begend.value,
      namebegend: dataBegend.name,
      position_begend: dataBegend.position_begend,
      nameservice: house_service_name.value,
      status: 0,
    };

    let value_itemImpuestos = null;
    const index_itemImpuestos = rootStore.state.itemsHouseServices.findIndex(
      (item: ServicioHouse) => item.nameservice!.toUpperCase() == "IMPUESTOS",
    );
    if (index_itemImpuestos !== -1) {
      value_itemImpuestos =
        rootStore.state.itemsHouseServices[index_itemImpuestos];
      rootStore.state.itemsHouseServices.splice(index_itemImpuestos, 1);
    }

    rootStore.state.itemsHouseServices.push(dataService);

    if (value_itemImpuestos !== null) {
      rootStore.state.itemsHouseServices.push(value_itemImpuestos);
    }

    rootStore.state.modalServices_manualMode = false;
  }

  formNewService.value!.reset();
}
function cancelNewService() {
  formNewService.value!.reset();
  rootStore.state.modalServices_manualMode =
    !rootStore.state.modalServices_manualMode;
}

watch(recargarClienteFlag, async () => {
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `ver_proveedor?id=${rootStore.state.house_id_consigner}`,
    headers: {
     
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(function (response) {
      const res = response.data;
      if (res.estadoflag) {
        const proveedor = res.data[0];
        rootStore.state.copy_house.emailaddress_clientefinal =
          proveedor.emailaddress;
        console.log(rootStore.state.copy_house.emailaddress_clientefinal);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
});

onMounted(async () => {
  rootStore.state.spiner = false;
  rootStore.state.spiner = true;
  reset();
  // console.log(this.$route.params)
  nextTick(() => {
    if (route.params.activar == "1") {
      dialogCliente.value = true;
    }
  });
  await Promise.all([
    _validaData(),
    rootStore.dispatch("_getModality"),
    rootStore.dispatch("_getShipment"),
    rootStore.dispatch("_getIncoterms"),
    rootStore.dispatch("_getnroMaster"),
    rootStore.dispatch("_getAgents"),
    rootStore.dispatch("_getConsigners"),
    rootStore.dispatch("_getNotify"),
    rootStore.dispatch("_getColoaders"),
    rootStore.dispatch("_getAirlines"),
    rootStore.dispatch("_getNavieras"),
    rootStore.dispatch("_getProveedorRolNaviera"),
    rootStore.dispatch("_getMotonave"),
    rootStore.dispatch("_getContainers"),
    rootStore.dispatch("_getFleteCon"),
    rootStore.dispatch("_getCoinsList"),

    rootStore.dispatch("_getProveedor"),
    rootStore.dispatch("_getBegEndList"),
    rootStore.dispatch("_getHouseContainers", { id: route.params.id }),
  ]);
  if (
    rootStore.state.house_cotizacion ||
    rootStore.state.house_cotizacionaduana
  ) {
    await pricingStore.getQuoteNoAsignadoHouse();
  } else {
    await pricingStore.ListarMontosFinalesQuoteMONGODB();
    await aduanaStore.ListarMontosFinalesAduanaMONGODB();
  }

  rootStore.state.house_id_coins = rootStore.state.itemsCoinsList.filter(
    (v: { symbol: string }) => v.symbol === "USD",
  )[0].id;

  rootStore.state.spiner = false;
});
</script>

<template>
  <div>
    <h3>Datos y Servicios a Realizar</h3>
    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          readonly
          v-model="rootStore.state.house_master_expediente"
          label="N° de Expedientes Master"
          append-inner-icon="mdi-eye"
          @click:append-inner="irAMaster()"
        />
      </v-col>
      <!-- <v-col cols="12" md="6">
        <v-text-field
          readonly
          v-model="$store.state.house_expediente"
          label="N° de Expedientes House"
        ></v-text-field>
      </v-col> -->
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          label="Cot Nro"
          :items="pricingStore.listQuotes"
          item-title="code"
          item-value="id"
          v-model:search="searchHouseCotizacion"
          v-model="rootStore.state.house_cotizacion"
          @update:model-value="asignarDatos()"
          clearable
          :disabled="bloquearQuote"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          label="Aduana Asociado al House"
          :items="aduanaStore.listQuotes2"
          item-title="quote"
          item-value="id"
          v-model:search="searchHouseCotizacionAduana"
          v-model="rootStore.state.house_cotizacionaduana"
          @update:model-value="asignarDatosAduana()"
          clearable
          :item-props="(item) => ({ disabled: aduanaaprobada(item) })"
          :disabled="bloquearQuote"
        />
      </v-col>
    </v-row>
    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          v-model="rootStore.state.house_sentido"
          @update:model-value="_getDataService()"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo de Embarque"
          return-object
          v-model="rootStore.state.house_id_trasnport"
          @update:model-value="_activePort(rootStore.state.house_id_trasnport.id_transport)"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsIncoterms"
          item-title="name"
          item-value="id"
          label="Incoterms"
          v-model="rootStore.state.house_incoterms"
          @update:model-value="_getDataService()"
        />
      </v-col>
    </v-row>
    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          readonly
          v-model="rootStore.state.house_origen"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          readonly
          v-model="rootStore.state.house_destino"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="rootStore.state.itemsColoaders"
          item-title="namelong"
          item-value="id"
          label="Coloader"
          v-model="rootStore.state.house_id_coloader"
        >
          <template #selection="{ item, internalItem }">
            <span
              v-if="typeof item === 'object'"
              class="v-autocomplete__selection-text"
            >{{ internalItem.title }}</span>
          </template>
        </v-autocomplete>
      </v-col>
    </v-row>

    <v-row
      density="compact"
      class="mt-0"
    >
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          type="number"
          v-model="rootStore.state.house_bultos"
          label="Bultos"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          type="number"
          suffix="kg"
          v-model="rootStore.state.house_peso"
          label="Peso"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          type="number"
          suffix="m3"
          v-model="rootStore.state.house_volumen"
          label="Volumen"
        />
      </v-col>
    </v-row>

    <v-dialog
      v-model="rootStore.state.modalServices_manualMode"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-headline-small d-flex align-center flex-wrap">
          Agregar Servicio Manual <v-spacer />
          <v-btn
            variant="text"
            icon
            color="red"
            @click="
              rootStore.state.modalServices_manualMode =
                !rootStore.state.modalServices_manualMode
            "
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formNewService">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="rootStore.state.itemsBegEndList"
                    item-title="name"
                    item-value="id"
                    label="Ubicación/Tramo"
                    v-model="house_service_id_begend"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="house_service_name"
                    label="Nombre Servicio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="red"
            rounded
            @click="cancelNewService"
          >
            CANCELAR
          </v-btn>
          <v-btn
            color="success"
            class="ml-2"
            rounded
            @click="setNewService"
          >
            ACEPTAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCostos"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCostos = !dialogCostos"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            item-title="text"
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="text-red mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer />
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="asociarCotizacionP"
            :disabled="activarBtnContinuar"
          >
            ASOCIAR COTIZACIÓN
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCostosAduana"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCostos = !dialogCostos"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            item-title="text"
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="text-red mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer />
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="asociarCotizacionA"
            :disabled="activarBtnContinuar"
          >
            ASOCIAR COTIZACIÓN
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCliente"
      max-width="30%"
      persistent
    >
      <v-card>
        <v-card-title>
          Es Necesario que registre un cliente para continuar:
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="rootStore.state.clientes"
            item-title="namelong"
            item-value="id"
            label="Cliente HBL"
            v-model="rootStore.state.house_id_consigner"
            :error-messages="error"
            menu-icon=""
          >
            <template #append-inner>
              <v-icon
                @mousedown.stop
                @click.stop="_callModalEntitie(11)"
                class="btn__add"
                color="primary"
              >
                mdi-plus
              </v-icon>
            </template>
          </v-autocomplete>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            @click="guardar"
            :loading="rootStore.state.spiner"
          >
            Guardar
          </v-btn>
          <span
            style="color: red"
            class="mx-2"
          >
            {{
              rootStore.state.spiner
                ? "Se está terminando de cargar los datos. Un momento Por favor "
                : ""
            }}
          </span>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


