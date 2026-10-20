<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionListado } from "@/types/cotizacion";
import type { CotizacionAsociableHouse, ServicioHouse } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";
import type { BegEndHouseRaiz, TipoEmbarqueRaiz } from "@/types/app";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const recargarClienteFlag = computed(() => appStore.recargarClienteFlag);

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
  const v = housesStore.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = appStore.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "Aéreo";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const esFCL = computed(() => {
  const v = housesStore.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = appStore.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "FCL";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const esLCL = computed(() => {
  const v = housesStore.house_id_trasnport;
  const id = v && typeof v === "object" ? v.id : v;
  const shipment = appStore.itemsShipment.find((s: { id: number }) => s.id == id);
  return shipment && shipment.code === "LCL";
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isDisabled(item: { porasignar?: boolean }) {
  return !item.porasignar; // Deshabilita si el estado no es "activo"
}
function irAMaster() {
  console.log("ir a master", housesStore.id_master);
  appRouter.push({
    name: "controlMasterVer",
    params: {
      id: housesStore.id_master,
    },
  });
}
function reset() {
  housesStore.copy_house = null as never;
  housesStore.dataHouse_transporte = null;
  housesStore.house_origen = null;
  housesStore.house_destino = null;
  housesStore.house_sentido = null;
  housesStore.house_id_trasnport = null;
  housesStore.house_incoterms = null;
  housesStore.house_cotizacion = null;
  housesStore.house_cotizacionaduana = null;
  housesStore.house_origen = null;
  housesStore.house_destino = null;
  appStore.house_expediente = null;
  housesStore.house_master = null;
  housesStore.house_master_expediente = null;
  housesStore.house_id_agente = null;
  appStore.house_id_consigner = null;
  housesStore.house_id_notify = null;
  housesStore.house_id_airlines = null;
  housesStore.house_id_coloader = null;
  housesStore.house_id_naviera = null;
  housesStore.house_blmaster = null;
  housesStore.house_id_motonave = null;
  housesStore.house_viaje = null;
  housesStore.house_bultos = null;
  housesStore.house_peso = null;
  housesStore.house_volumen = null;
  housesStore.house_id_condicion = null;
  housesStore.house_id_coins = null;
  housesStore.house_monto = null;
  housesStore.house_id = null;
  housesStore.url_onedrive = null;
  housesStore.house_id_consigner_real = null;
  housesStore.itemsHouseContainers = null;
  housesStore.house_nro_declaracion_aduana = null;
  housesStore.house_canal_aduana = null;
  housesStore.house_enlace_tracking = null as never;
}
function _callModalEntitie(id_role: number) {
  appStore.id_role_actual = id_role;
  if (id_role == 1) {
    appStore.modalAgente = !appStore.modalAgente;
  } else if (id_role == 11) {
    appStore.modalEntitie = !appStore.modalEntitie;
  } else if (id_role == 17) {
    appStore.modalColoader = !appStore.modalColoader;
  } else if (id_role == 2) {
    appStore.modalNaviera = !appStore.modalNaviera;
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
  if (!appStore.house_id_consigner) {
    error.value = "Dato Requerido";
    return false;
  }

  loadingBotonGuardarHouse = true;

  const lstservices = (appStore.itemsHouseServices || []).map(
    (item: ServicioHouse) => ({
      id: item.id || null,
      id_begend: item.id_begend || null,
      nameservice: item.nameservice || null,
      status: item.status ? 1 : 0,
      date_service: item.date_service || null,
    }),
  );

  const data = JSON.stringify({
    id_modality: housesStore.house_sentido
      ? housesStore.house_sentido
      : "",
    id_shipment: housesStore.house_id_trasnport
      ? housesStore.house_id_trasnport
      : "",
    id_consigner_real: housesStore.house_id_consigner_real
      ? housesStore.house_id_consigner_real
      : "",
    id_port_begin: housesStore.house_origen
      ? housesStore.house_origen
      : "",
    id_port_end: housesStore.house_destino
      ? housesStore.house_destino
      : "",
    id_proveedor: housesStore.house_id_agente
      ? housesStore.house_id_agente
      : "",
    id_consigner: appStore.house_id_consigner
      ? appStore.house_id_consigner
      : "",
    id_notify: housesStore.house_id_notify
      ? housesStore.house_id_notify
      : "",
    id_aerolinea: housesStore.house_id_airlines
      ? housesStore.house_id_airlines
      : "",
    id_coloader: housesStore.house_id_coloader
      ? housesStore.house_id_coloader
      : "",
    id_naviera: housesStore.house_id_naviera
      ? housesStore.house_id_naviera
      : "",
    id_incoterms: housesStore.house_incoterms
      ? housesStore.house_incoterms
      : "",
    nro_hbl: housesStore.house_blmaster
      ? housesStore.house_blmaster
      : "",
    id_motonave: housesStore.house_id_motonave
      ? housesStore.house_id_motonave
      : "",
    nro_viaje: housesStore.house_viaje
      ? housesStore.house_viaje
      : "",
    bultos: housesStore.house_bultos
      ? housesStore.house_bultos
      : "",
    peso: housesStore.house_peso ? housesStore.house_peso : "",
    volumen: housesStore.house_volumen
      ? housesStore.house_volumen
      : "",
    id_conditions: housesStore.house_id_condicion
      ? housesStore.house_id_condicion
      : "",
    id_moneda: housesStore.house_id_coins
      ? housesStore.house_id_coins
      : "",
    monto: housesStore.house_monto ? housesStore.house_monto : "",
    id_branch: sessionBranchId(),
    id_cot: housesStore.house_cotizacion
      ? housesStore.house_cotizacion
      : "",
    lstservices,
    id: housesStore.house_id,
    nro_declaracion_aduana:
      housesStore.house_nro_declaracion_aduana || "",
    canal_aduana: housesStore.house_canal_aduana || "",
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

    if (!housesStore.url_onedrive) {
      const proveedor = appStore.clientes.find(
        (v: { id: number }) => v.id == appStore.house_id_consigner,
      );
      const id_branch = sessionBranchId();
      const id_branchs = ["1", "2", 1, 2];
      if (id_branchs.includes(id_branch)) {
        await housesStore.guardarCarpetaHouse({
          id: housesStore.house_master,
          nroMaster: `${housesStore.house_master_expediente}_${proveedor!.namelong}`,
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
        id: housesStore.house_cotizacion,
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
    (v) => v.id == housesStore.house_cotizacion,
  )[0] as CotizacionAsociableHouse;
  dialogCostos.value = true;
}
async function asignarDatosAduana() {
  dataAprobar.value = aduanaStore.listQuotes2.filter(
    (v) => v.id == housesStore.house_cotizacionaduana,
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
    id_quote: housesStore.house_cotizacion, //
    nuevoexpediente: false, //
    id_exp: housesStore.house_master, //
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
    id_quote: housesStore.house_cotizacionaduana, //
    nuevoexpediente: false, //
    id_exp: housesStore.house_master, //
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

    housesStore.copy_house = house;
    housesStore.id_master = house.id_master;
    housesStore.telexconfirmado = house.telexconfirmado;
    housesStore.fechaconfirmaciontelex = house.fechaconfirmaciontelex;
    housesStore.dataHouse_transporte = house.id_transport;
    housesStore.house_origen = house.id_port_begin;
    housesStore.house_destino = house.id_port_end;
    housesStore.house_sentido = house.id_modality;
    housesStore.house_id_trasnport = house.id_shipment;
    housesStore.house_incoterms = house.id_incoterms;
    housesStore.house_cotizacion = house.id_cot;
    housesStore.house_cotizacionaduana = house.id_quoteaduana;

    id_transport = house.id_transport;

    housesStore.house_origen = house.id_port_begin;
    housesStore.house_destino = house.id_port_end;
    appStore.house_expediente = house.code_house;
    housesStore.house_master = house.id_master;
    housesStore.house_master_expediente = house.code_master;
    housesStore.house_id_agente = house.id_proveedor;
    appStore.house_id_consigner = house.id_consigner;
    housesStore.house_id_notify = house.id_notify;
    housesStore.house_id_airlines = house.id_aerolinea;
    housesStore.house_id_coloader = house.id_coloader;
    housesStore.house_id_vendedor = house.id_vendedor;
    housesStore.house_id_pricing = house.id_pricing;
    //this.$store.state.house_id_agente = house.id_agent;
    housesStore.house_id_naviera = house.id_naviera;
    housesStore.house_blmaster = house.nro_hbl;
    housesStore.house_id_motonave = house.id_motonave;
    housesStore.house_viaje = house.nro_viaje;
    housesStore.house_bultos = house.bultos;
    housesStore.house_peso = house.peso;
    housesStore.house_volumen = house.volumen;
    housesStore.house_id_condicion = house.id_conditions;
    housesStore.house_id_coins = house.id_moneda;
    housesStore.house_monto = house.monto;
    housesStore.house_id = house.id;
    housesStore.url_onedrive = house.url_onedrive;
    housesStore.house_id_consigner_real = house.id_consigner_real;
    housesStore.itemsHouseContainers = house.itemshousecontainers as typeof housesStore.itemsHouseContainers;
    housesStore.house_nro_declaracion_aduana =
      house.nro_declaracion_aduana || "";
    housesStore.house_canal_aduana = house.canal_aduana || "";
    const id_cot = house.id_cot;
    const id_quote = house.id_quoteaduana;
    bloquearQuote.value = !!(id_cot || id_quote);
    Promise.all([
      appStore._getPortBegin({
        id_transport: house.id_transport,
        id: house.id_port_begin,
      }),
      appStore._getPortEnd({
        id_transport: house.id_transport,
        id: house.id_port_end,
      }),
      mastersStore._getServicesBegin(),
      housesStore._getBitacoraLineal({
        id_modalidad: housesStore.house_sentido,
        id_shipment: housesStore.house_id_trasnport,
        id_incoterms: housesStore.house_incoterms,
      }),
      // this._getComentariosPredefinidos(),
    ]);
    housesStore.house_enlace_tracking = house.token_rastreo
      ? "https://aco.agentedecargaonline.com/tracking/" +
        house.token_rastreo
      : "";
    if (
      !appStore.house_id_consigner &&
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
  await appStore._getPortBegin({ id_transport: id_transport });
  await appStore._getPortEnd({ id_transport: id_transport });
  if (appStore.master_id_trasnport.id == 1) {
    appStore.embar_title_nacn = "Aerolinea";
  } else if (appStore.master_id_trasnport.id == 2) {
    appStore.embar_title_nacn = "Naviera";
  } else if (appStore.master_id_trasnport.id == 3) {
    appStore.embar_title_nacn = "Coloader";
  } else {
    appStore.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
function _getDataService() {
  mastersStore._getServicesBegin();
  // this._getBitacoraList();
  // this._getBitacoraLineal();
}
async function setNewService() {
  if ((await formNewService.value!.validate()).valid) {
    const dataBegend =
      appStore.itemsBegEndList.find(
        (v: { id: number }) => v.id === house_service_id_begend.value,
      ) || ({} as BegEndHouseRaiz);
    const dataService = {
      id_begend: house_service_id_begend.value as number,
      namebegend: dataBegend.name as string,
      position_begend: dataBegend.position_begend,
      nameservice: house_service_name.value,
      status: 0,
    };

    let value_itemImpuestos = null;
    const index_itemImpuestos = appStore.itemsHouseServices.findIndex(
      (item: ServicioHouse) => item.nameservice!.toUpperCase() == "IMPUESTOS",
    );
    if (index_itemImpuestos !== -1) {
      value_itemImpuestos =
        appStore.itemsHouseServices[index_itemImpuestos]!;
      appStore.itemsHouseServices.splice(index_itemImpuestos, 1);
    }

    appStore.itemsHouseServices.push(dataService);

    if (value_itemImpuestos !== null) {
      appStore.itemsHouseServices.push(value_itemImpuestos);
    }

    housesStore.modalServices_manualMode = false;
  }

  formNewService.value!.reset();
}
function cancelNewService() {
  formNewService.value!.reset();
  housesStore.modalServices_manualMode =
    !housesStore.modalServices_manualMode;
}

watch(recargarClienteFlag, async () => {
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `ver_proveedor?id=${appStore.house_id_consigner}`,
    headers: {
     
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(function (response) {
      const res = response.data;
      if (res.estadoflag) {
        const proveedor = res.data[0];
        housesStore.copy_house.emailaddress_clientefinal =
          proveedor.emailaddress;
        console.log(housesStore.copy_house.emailaddress_clientefinal);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
});

onMounted(async () => {
  appStore.spiner = false;
  appStore.spiner = true;
  reset();
  // console.log(this.$route.params)
  nextTick(() => {
    if (route.params.activar == "1") {
      dialogCliente.value = true;
    }
  });
  await Promise.all([
    _validaData(),
    appStore._getModality(),
    appStore._getShipment(),
    appStore._getIncoterms(),
    mastersStore._getnroMaster(),
    appStore._getAgents(),
    appStore._getConsigners(),
    appStore._getNotify(),
    housesStore._getColoaders(),
    appStore._getAirlines(),
    appStore._getNavieras(),
    mastersStore._getProveedorRolNaviera(),
    appStore._getMotonave(),
    appStore._getContainers(),
    appStore._getFleteCon(),
    appStore._getCoinsList(),

    appStore._getProveedor(),
    appStore._getBegEndList(),
    housesStore._getHouseContainers({ id: route.params.id }),
  ]);
  if (
    housesStore.house_cotizacion ||
    housesStore.house_cotizacionaduana
  ) {
    await pricingStore.getQuoteNoAsignadoHouse();
  } else {
    await pricingStore.ListarMontosFinalesQuoteMONGODB();
    await aduanaStore.ListarMontosFinalesAduanaMONGODB();
  }

  housesStore.house_id_coins = appStore.itemsCoinsList.filter(
    (v: { symbol: string }) => v.symbol === "USD",
  )[0]!.id;

  appStore.spiner = false;
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
          v-model="housesStore.house_master_expediente"
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
          v-model="housesStore.house_cotizacion"
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
          v-model="housesStore.house_cotizacionaduana"
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
          :items="appStore.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          v-model="housesStore.house_sentido"
          @update:model-value="_getDataService()"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="appStore.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo de Embarque"
          return-object
          v-model="housesStore.house_id_trasnport as TipoEmbarqueRaiz"
          @update:model-value="_activePort((housesStore.house_id_trasnport as TipoEmbarqueRaiz).id_transport)"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="appStore.itemsIncoterms"
          item-title="name"
          item-value="id"
          label="Incoterms"
          v-model="housesStore.house_incoterms"
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
          :items="appStore.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          readonly
          v-model="housesStore.house_origen"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="appStore.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          readonly
          v-model="housesStore.house_destino"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="housesStore.itemsColoaders"
          item-title="namelong"
          item-value="id"
          label="Coloader"
          v-model="housesStore.house_id_coloader"
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
          v-model="housesStore.house_bultos"
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
          v-model="housesStore.house_peso"
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
          v-model="housesStore.house_volumen"
          label="Volumen"
        />
      </v-col>
    </v-row>

    <v-dialog
      v-model="housesStore.modalServices_manualMode"
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
              housesStore.modalServices_manualMode =
                !housesStore.modalServices_manualMode
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
                    :items="appStore.itemsBegEndList"
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
            :items="appStore.clientes"
            item-title="namelong"
            item-value="id"
            label="Cliente HBL"
            v-model="appStore.house_id_consigner"
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
            :loading="appStore.spiner"
          >
            Guardar
          </v-btn>
          <span
            style="color: red"
            class="mx-2"
          >
            {{
              appStore.spiner
                ? "Se está terminando de cargar los datos. Un momento Por favor "
                : ""
            }}
          </span>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


