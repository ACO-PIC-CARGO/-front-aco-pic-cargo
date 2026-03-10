import Vue from "vue";
import VueRouter from "vue-router";
import Login from "../views/Login.vue";
import Main from "../views/dashboard/Main.vue";
import Home from "../views/dashboard/Home.vue";
import LisEntities from "../views/folderEntities/listEntities.vue";
import controlEntities from "../views/folderEntities/controlEntities.vue";

import ListMaster from "../views/folderMaster/listMaster.vue";
import controlMaster from "../views/folderMaster/controlMaster.vue";

import ListHouse from "../views/folderHouse/listHouse.vue";
import controlHouse from "../views/folderHouse/controlHouse.vue";
import ConfiguracionAvisoLlegada from "../views/folderHouse/ConfiguracionAvisoLlegada.vue";

import reportControlFile from "../views/folderReports/reportsControlFile.vue";
import reportControlFileDetails from "../views/folderReports/reportsControlFileDetails.vue";

import billingControlGastos from "../views/folderBilling/billControlGastos";
import listControlGastos from "../views/folderBilling/listControlGastos";

import ControlRequest from "../views/requests/controlRequest";
import ControlPaymentFile from "../views/requests/controlPaymentFile";
import debstopay from "../views/requests/reportDebstoPay";
import accountsreceivable from "../views/requests/accountsreceivable";
import checkDebs from "../views/requests/checkDebs";
import cashFlow from "../views/requests/cashFlow";
import controlAccountPays from "../views/folderModulesPays/moduleAccountPays";
import moduleAccountReceivable from "../views/folderModulesPays/moduleAccountReceivable";
import addAccountPays from "../views/folderModulesPays/controlAccountPays";
import viewAccountPays from "../views/folderModulesPays/controlAccountPaysView";
import viewAccountPaysCxC from "../views/folderModulesPays/controlAccountPaysCxCView";
import EditviewAccountPays from "../views/folderModulesPays/controlAccountPaysEdit";
import EditviewAccountPaysCxC from "../views/folderModulesPays/controlAccountPaysCxCEdit";
import regularizarProformace from "../views/folderModulesPays/regularizarProformace";
import controlAccountReceivable from "../views/folderModulesPays/controlAccountReceivable";
import listadoPagosPorProveedor from "../views/FolderBanks/listadoPagosPorProveedor";
import registroPayForProveedor from "../views/FolderBanks/registroPagoProveedor";
import verPagosPorProveedor from "../views/FolderBanks/verPagosPorProveedor";
import listadoPagosPorCliente from "../views/FolderBanks/listadoPagosPorCliente";
import registroPayForCliente from "../views/FolderBanks/registroPagoCliente";
import verPagosPorCliente from "../views/FolderBanks/verPagosPorCliente";
import litProgrammedPayment from "../views/programmedPayment/listProgrammedPayment";
import listFacturacion from "../views/folderBilling/listFacturacionView";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
  {
    path: "/registro_empresa",
    name: "RegistroEmpresa",
    component: () =>
      import("../views/FolderEnterprise/RegistroNuevaEmpresa.vue"),
  },

  {
    path: "/home",
    meta: { requiresAuth: true },
    component: Main,
    children: [
      {
        path: "",
        redirect: "/home/main",
      },
      {
        path: "main",
        name: "Main",
        component: Home,
      },
      {
        path: "main/configuracion_inicial",
        name: "ConfiguracionInicial",
        component: () =>
          import("../views/FolderEnterprise/ConfiguracionInicial.vue"),
      },

      {
        path: "folderEntities/list/:id_role",
        name: "listEntitie",
        component: LisEntities,
      },
      {
        path: "folderEntities/listado-proveedores",
        name: "listProveedor",
        component: () =>
          import("../views/folderEntities/Proveedor/listProveedor.vue"),
      },
      {
        path: "folderEntities/nuevo-proveedor",
        name: "nuevoProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/nuevoProveedor"),
      },
      {
        path: "folderEntities/ver-proveedor/:id",
        name: "verProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/verProveedor"),
      },
      {
        path: "folderEntities/editar-proveedor/:id",
        name: "editarProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/editarProveedor"),
      },
      {
        path: "folderEntities/listado-cliente",
        name: "listClientes",
        component: () =>
          import("../views/folderEntities/Cliente/listCliente.vue"),
      },
      {
        path: "folderEntities/nuevo-cliente",
        name: "nuevoClientes",
        component: () =>
          import("../views/folderEntities/Cliente/nuevoCliente.vue"),
      },
      {
        path: "folderEntities/ver-cliente/:id",
        name: "verCliente",
        component: () =>
          import("../views/folderEntities/Cliente/verCliente.vue"),
      },
      {
        path: "folderEntities/editar-cliente/:id",
        name: "editarCliente",
        component: () =>
          import("../views/folderEntities/Cliente/editarCliente.vue"),
      },
      {
        path: "folderEntities/list-personal-rol",
        name: "listPersonaRol",
        component: () => import("../views/Security/RolPersona/listPersonaRol"),
      },
      {
        path: "folderEntities/control/:id_role",
        name: "controlEntitie",
        component: controlEntities,
      },
      {
        path: "folderEntities/control/edit/:id",
        name: "controlEntitieEdit",
        component: controlEntities,
      },
      {
        path: "folderMaster/list",
        name: "listMaster",
        component: ListMaster,
      },
      {
        path: "folderMaster/control",
        name: "controlMaster",
        component: controlMaster,
      },
      {
        path: "folderMaster/control/editar/:id",
        name: "controlMasterEditar",
        component: controlMaster,
      },
      {
        path: "folderMaster/control/ver/:id",
        name: "controlMasterVer",
        component: controlMaster,
      },
      {
        path: "folderMaster/control/:id",
        name: "controlMasterId",
        component: controlMaster,
      },
      {
        path: "folderMaster/control/:id/:params",
        name: "controlMasterParams",
        component: controlMaster,
      },
      {
        path: "folderHouse/list",
        name: "listHouse",
        component: ListHouse,
      },
      {
        path: "folderHouse/control",
        name: "controlHouse",
        component: controlHouse,
      },
      {
        path: "folderHouse/confAvisoLlegada",
        name: "confAvisoLlegada",
        component: ConfiguracionAvisoLlegada,
      },
      {
        path: "folderHouse/control/editar/:id/:activar?",
        name: "controlHouseEditar",
        component: controlHouse,
      },
      {
        path: "folderHouse/control/ver/:id",
        name: "controlHouseVer",
        component: () => import("../views/folderHouse/VerHouse.vue"),
      },
      {
        path: "folderHouse/control/:id",
        name: "controlHouseId",
        component: controlHouse,
      },
      {
        path: "folderReports/list",
        name: "reportsControlFile",
        component: reportControlFile,
      },
      {
        path: "folderReports/listDetails",
        name: "reportsControlFileDetails",
        component: reportControlFileDetails,
      },
      {
        path: "folderBilling/billControlGastos/:id_house",
        name: "billControlGastos",
        component: billingControlGastos,
      },
      {
        path: "folderBilling/billControlGastos/view/:id_house/:id_control/:id_orders/:code",
        name: "billControlGastosControl",
        component: billingControlGastos,
      },
      {
        path: "folderBilling/listControlGastos",
        name: "listControlGastos",
        component: listControlGastos,
      },
      // {
      //   path: "folderBilling/editControlGastos/view/:code_master/:id_branch",
      //   name: "editControlGasto",
      //   component: () => import("../views/folderBilling/frmControlGastos.vue"),
      // },
      {
        path: "folderBilling/editControlGastos/view/:id/:id_branch",
        name: "editControlGasto",
        component: () => import("../views/folderBilling/frmControlGastos.vue"),
      },
      {
        path: "folderBilling/verControlGastos/view/:id/:id_branch",
        name: "verControlGasto",
        component: () => import("../views/folderBilling/frmControlGastosVer.vue"),
      },
      {
        path: "folderRequest/controlRequest",
        name: "controlRequest",
        component: ControlRequest,
      },
      {
        path: "folderRequest/debstopay",
        name: "debstopay",
        component: debstopay,
      },
      {
        path: "folderRequest/controlPaymentFile",
        name: "controlPaymentFile",
        component: ControlPaymentFile,
      },
      {
        path: "folderRequest/accountsReceivable",
        name: "accountsreceivable",
        component: accountsreceivable,
      },
      {
        path: "folderRequest/checkDebs",
        name: "checkDebs",
        component: checkDebs,
      },
      {
        path: "folderRequest/cashflow",
        name: "cashFlow",
        component: cashFlow,
      },
      {
        path: "folderModulesPays/controlAccountPays",
        name: "controlAccountPays",
        component: controlAccountPays,
      },
      {
        path: "folderModulesPays/addmodulesAccountPays",
        name: "addAccountPays",
        component: addAccountPays,
      },

      {
        path: "folderModulesPays/moduleAccountReceivable",
        name: "moduleAccountReceivable",
        component: moduleAccountReceivable,
      },
      {
        path: "folderModulesPays/regularizarProformace",
        name: "controlRegulizarPro",
        component: regularizarProformace,
      },
      {
        path: "folderModulesPays/viewAccountPays/:id",
        name: "viewAccountPays",
        component: viewAccountPays,
      },
      {
        path: "folderModulesPays/EditAccountPays/:id",
        name: "EditAccountPays",
        component: EditviewAccountPays,
      },
      {
        path: "folderModulesPays/lstProyeccion",
        name: "lstProyeccionCXP",
        component: () =>
          import("../views/folderProyeccion/listProyeccionCXP.vue"),
      },
      {
        path: "folderModulesPays/nuevaProyeccion",
        name: "nuevaProyeccionCXP",
        component: () =>
          import("../views/folderProyeccion/nuevaProyeccionCXP.vue"),
      },
      {
        path: "folderModulesPays/verProyeccion/:id",
        name: "verProyeccion",
        component: () => import("../views/folderProyeccion/verProyeccion"),
      },
      {
        path: "folderModulesPays/editarProyeccion/:id",
        name: "editarProyeccion",
        component: () => import("../views/folderProyeccion/editarProyeccion"),
      },

      {
        path: "viewAccountPaysCxC/controlAccountReceivable",
        name: "controlAccountReceivable",
        component: controlAccountReceivable,
      },
      {
        path: "viewAccountPaysCxC/:id",
        name: "viewAccountPaysCxC",
        component: viewAccountPaysCxC,
      },
      {
        path: "EditviewAccountPaysCxC/:id",
        name: "EditAccountPaysCxC",
        component: EditviewAccountPaysCxC,
      },
      {
        path: "FolderBanks/listadoPagosPorProveedor",
        name: "listBankCxP",
        component: listadoPagosPorProveedor,
      },
      {
        path: "FolderBanks/registroPayForProveedor",
        name: "registroPayForProveedor",
        component: registroPayForProveedor,
      },
      {
        path: "FolderBanks/verPagosPorProveedor/:id",
        name: "verPagosPorProveedor",
        component: verPagosPorProveedor,
      },
      {
        path: "FolderBanks/listadoPagosPorCliente",
        name: "listBankCxC",
        component: listadoPagosPorCliente,
      },
      {
        path: "FolderBanks/registroPayForCliente",
        name: "registroPayForCliente",
        component: registroPayForCliente,
      },
      {
        path: "FolderBanks/verPagosPorCliente/:id",
        name: "verPagosPorCliente",
        component: verPagosPorCliente,
      },
      {
        path: "folderReports/listProgrammedPayment",
        name: "listProgrammedPayment",
        component: litProgrammedPayment,
      },
      {
        path: "folderBilling/lstFacturacion",
        name: "lstFacturacion",
        component: listFacturacion,
      },
      {
        path: "folderConsolidation",
        name: "lstConsolidation",
        component: () =>
          import("../views/folderConsolidacion/ConsolidacionView.vue"),
      },
      {
        path: "folderConsolidation/registro",
        name: "newConsolidation",
        component: () =>
          import("../views/folderConsolidacion/NuevaConsolidacionView"),
      },
      {
        path: "folderReports/balanceGanancia",
        name: "lstEstadoGanancias",
        component: () => import("../views/balance/balanceGanancia"),
      },
      {
        path: "folderRequest/listFlujoMensual",
        name: "listFlujoMensual",
        component: () => import("../views/balance/flujoOperacionesMes.vue"),
      },
      {
        path: "folderPricing/lstQuote",
        name: "lstQuote",
        component: () => import("../views/folderPricing/ListPricing.vue"),
      },
      {
        path: "folderPricing/newQuote",
        name: "newQuote",
        component: () => import("../views/folderPricing/NewQuote.vue"),
      },
      {
        path: "folderPricing/verQuote/:id/:step?",
        name: "verQuote",
        component: () => import("../views/folderPricing/VerPricing.vue"),
      },
      {
        path: "folderPricing/editQuote/:id",
        name: "editQuote",
        component: () => import("../views/folderPricing/EditarPricing.vue"),
      },
      {
        path: "folterCargaMasiva/carga_calculadora",
        name: "cargaMasivaCalc",
        component: () =>
          import("../../src/views/folterCargaMasiva/Calculadora"),
      },
      {
        path: "folterCargaMasiva/carga_control_gastos",
        name: "cargaMasivaControlGasto",
        component: () =>
          import("../../src/views/folterCargaMasiva/ControlGastos.vue"),
      },
      {
        path: "folterCalculadora/list_user_calc",
        name: "listUserCalc",
        component: () => import("../../src/views/Calculadora/ListUserCalc.vue"),
      },
      {
        path: "enterprise/listado",
        name: "listEnterprise",
        component: () => import("../views/FolderEnterprise/listado.vue"),
      },
      {
        path: "enterprise/nuevo",
        name: "newEnterprise",
        component: () => import("../views/FolderEnterprise/nuevo.vue"),
      },
      {
        path: "enterprise/read/:id",
        name: "readEnterprise",
        component: () => import("../views/FolderEnterprise/read.vue"),
      },
      {
        path: "enterprise/update/:id",
        name: "updateEnterprise",
        component: () => import("../views/FolderEnterprise/update.vue"),
      },
      {
        path: "marketing/list",
        name: "listMarketing",
        component: () => import("../views/FolderMarketing/list.vue"),
      },
      {
        path: "type_phone/list",
        name: "listTypePhone",
        component: () => import("../views/FolderTypePhone/list.vue"),
      },
      {
        path: "document/list",
        name: "listDocument",
        component: () => import("../views/FolderDocument/list.vue"),
      },
      {
        path: "year/list",
        name: "listYear",
        component: () => import("../views/FolderYear/list.vue"),
      },
      {
        path: "sex/list",
        name: "listSex",
        component: () => import("../views/FolderSex/list.vue"),
      },
      {
        path: "groupservices/list",
        name: "listGroupServices",
        component: () => import("../views/FolderGroupServices/list.vue"),
      },
      {
        path: "item_services/listado",
        name: "listItemServices",
        component: () =>
          import("../views/FolderGroupServices/ItemServices.vue"),
      },
      {
        path: "incoterms/list",
        name: "incotermsServices",
        component: () => import("../views/FolderIncoterm/list.vue"),
      },
      {
        path: "performance/list",
        name: "performance",
        component: () => import("../views/FolderPerformance/list.vue"),
      },
      {
        path: "bank/list",
        name: "bankList",
        component: () => import("../views/FolderBanks/list.vue"),
      },
      {
        path: "modality/list",
        name: "listModality",
        component: () => import("../views/FolderModality/list.vue"),
      },
      {
        path: "transport/list",
        name: "listTransport",
        component: () => import("../views/FolderTransport/list.vue"),
      },
      {
        path: "gastos/list",
        name: "listGastos",
        component: () => import("../views/FolderGasto/list.vue"),
      },
      {
        path: "sub_gasto/list",
        name: "listSubGasto",
        component: () => import("../views/FolderGasto/listSubGasto.vue"),
      },
      {
        path: "coins/list",
        name: "listCoins",
        component: () => import("../views/FolderCoins/list.vue"),
      },
      {
        path: "ingreso/list",
        name: "listIngresos",
        component: () => import("../views/FolderIngresos/list.vue"),
      },
      {
        path: "sub_ingreso/listado",
        name: "listSubIngresos",
        component: () => import("../views/FolderIngresos/listSubIngreso.vue"),
      },
      {
        path: "containers/list",
        name: "listContainers",
        component: () => import("../views/FolderContainers/list.vue"),
      },
      {
        path: "shipment/listado",
        name: "listShipment",
        component: () => import("../views/FolderTipoCarga/list.vue"),
      },
      {
        path: "multiplicador/listado",
        name: "listMultiplicador",
        component: () => import("../views/FolderMultiplicador/list.vue"),
      },
      {
        path: "airlines/listado",
        name: "listAirlines",
        component: () => import("../views/Airlines/ListAirlines.vue"),
      },
      {
        path: "quote_status/listado",
        name: "listQuoteStatus",
        component: () => import("../views/StatusQuote/listQuoteStatus.vue"),
      },
      {
        path: "puertos/listado",
        name: "listPort",
        component: () => import("../views/Port/ListPort.vue"),
      },
      {
        path: "motonave/listado",
        name: "listMotonave",
        component: () => import("../views/Motonave/ListMotonave.vue"),
      },
      {
        path: "state/listado",
        name: "listState",
        component: () => import("../views/State/ListState.vue"),
      },
      {
        path: "city/listado",
        name: "listCity",
        component: () => import("../views/City/ListCity.vue"),
      },
      {
        path: "town/listado",
        name: "listTown",
        component: () => import("../views/Town/ListTown.vue"),
      },
      {
        path: "impuestos/listado",
        name: "listImpuestos",
        component: () => import("../views/MasterUsuario/ListImpuesto.vue"),
      },
      {
        path: "tipo_telefono/listado",
        name: "listTipoTelefeno",
        component: () => import("../views/MasterUsuario/ListTipoTelefono.vue"),
      },
      {
        path: "notas_cotizacion/listado",
        name: "ListNotasCotizacion",
        component: () =>
          import("../views/MasterUsuario/ListNotasCotizacion.vue"),
      },
      {
        path: "categoria_servicio/listado",
        name: "ListBegend",
        component: () => import("../views/Begend/ListBegend.vue"),
      },
      {
        path: "type_servicio/listado",
        name: "ListPayment",
        component: () => import("../views/TypePayment/ListTypePayment.vue"),
      },
      {
        path: "usuarios/listado",
        name: "listUser",
        component: () => import("../views/Users/ListUsuarios.vue"),
      },
      {
        path: "usuarios/nuevo",
        name: "registroUser",
        component: () => import("../views/Users/NuevoUsuaurio.vue"),
      },
      {
        path: "usuarios/editar/:id",
        name: "editarUser",
        component: () => import("../views/Users/EditarUsuario.vue"),
      },
      {
        path: "usuarios/ver/:id",
        name: "verUser",
        component: () => import("../views/Users/VerUsuario.vue"),
      },
      {
        path: "posicion/listado",
        name: "lstPosition",
        component: () => import("../views/Posicion/ListPosicion.vue"),
      },
      {
        path: "posicion/editar/:id",
        name: "editarPosicion",
        component: () => import("../views/Posicion/EditarPosicion.vue"),
      },
      {
        path: "posicion/ver/:id",
        name: "verPosicion",
        component: () => import("../views/Posicion/VerPosicion.vue"),
      },
      // {
      //   path: "/reporte/control_file",
      //   name: "reportsControlFile",
      //   component: () =>
      //     import("../views/folderReports/reportsControlFile.vue"),
      // },
      {
        path: "comentarios_predefinidos/listado",
        name: "listComentariosPredefinidos",
        component: () =>
          import("../views/FolderComentariosPredefinidos/list.vue"),
      },
      {
        path: "suscripcion",
        name: "lstPlanes",
        component: () =>
          import("../views/Membresia/RegistroMembresiacarlos.vue"),
      },
      {
        path: "suscripcion3",
        name: "lstPlanes",
        component: () =>
          import("../views/Membresia/RegistroMembresiacarlos2.vue"),
      },
      {
        path: "suscripcion2",
        name: "lstPlanes",
        component: () =>
          import("../views/Membresia/RegistroMembresia.vue"),
      },
      {
        path: "folderFolderBanks/editar_salida/:nro_operacion",
        name: "EditarSalida",
        component: () =>
          import("../views/FolderBanks/EditarPagoPorProveedor.vue"),
      },
      {
        path: "folderFolderBanks/editar_ingreso/:nro_operacion",
        name: "EditarCobroCliente",
        component: () => import("../views/FolderBanks/EditarCobroCliente.vue"),
      },
      {
        path: "ficheros/listado_status_house",
        name: "lstEstadoBitaco",
        component: () => import("../views/StatusHouse/ListStatusHouse.vue"),
      },
      {
        path: "lstEnterpriseRegister",
        name: "lstEnterpriseRegister",
        component: () => import("../views/Branch/ListadoBranch.vue"),
      },
      {
        path: "newCotizacionAduana",
        name: "newCotizacionAduana",
        component: () => import("../views/Aduana/NewQuote.vue"),
      },
      {
        path: "lstQuoteAduanaAduana",
        name: "lstQuoteAduanaAduana",
        component: () => import("../views/Aduana/ListAduana.vue"),
      },
      // {
      //   path: "lstQuoteAduanaAduana",
      //   name: "lstQuoteAduanaAduana",
      //   component: () => import("../views/Aduana/ListAduana.vue"),
      // },
      {
        path: "EditarAduana/:id",
        name: "EditarAduana",
        component: () => import("../views/Aduana/EditarAduana.vue"),
      },
      {
        path: "VerAduana/:id/:step?",
        name: "VerAduana",
        component: () => import("../views/Aduana/VerAduana.vue"),
      },
      {
        path: "RegistroSuscripcion",
        name: "RegistroSuscripcion",
        component: () => import("../views/Suscripcion/RegistroSuscripcion.vue"),
      },
      {
        path: "ServiciosCostosFijosFCL",
        name: "ServiciosCostosFijosFCL",
        component: () =>
          import("../views/Calculadora/FCL/ServiciosCostosFijosFCL"),
      },
      {
        path: "ServiciosCostosFijosLCL",
        name: "ServiciosCostosFijosLCL",
        component: () =>
          import("../views/Calculadora/LCL/ServiciosCostosFijosLCL"),
      },
      {
        path: "ServiciosCostosFijosAereo",
        name: "ServiciosCostosFijosAereo",
        component: () =>
          import("../views/Calculadora/AEREO/ServiciosCostosFijosAereo"),
      },
      {
        path: "folterCalculadora/cotizacion/:id",
        name: "UserCalculadoraVer",
        component: () => import("../views/Calculadora/UserCalculadoraVer"),
        path: "folderPlantillas/servicios_tarifas",
        name: "ServiciosTarifasPlantillas",
        component: () =>
          import("../views/FolderPlantillas/ServiciosTarifas.vue"),
      },
      {
        path: "folderConfig/estatus_defecto",
        name: "EstatusDefecto",
        component: () => import("../views/FolderConfig/EstatusDefecto.vue"),
      },
      {
        path: "configuracion/costos",
        name: "CostosPricing",
        component: () =>
          import("../views/Configuracion/Pricing/CostosPricing.vue"),
      },
    ],
  },
  {
    path: "/tracking/:token",
    name: "tracking",
    component: () => import("../views/folderHouse/tracking.vue"),
  },
  {
    path: "/reestablecer_clave/:token",
    name: "ReestablecerClave",
    component: () => import("../views/Security/ReestablecerClave.vue"),
  },

  // {
  //   path: "*",

  //   component: Main,
  //   children: [
  //     {
  //       path: "",
  //       redirect: "/home/main",
  //     },
  //   ],
  // },
];

const router = new VueRouter({
  base: process.env.BASE_URL,
  mode: "history",
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        selector: to.hash,
        behavior: "smooth",
      };
    } else {
      return savedPosition;
    }
  },
});
// Guard global de autenticación
router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta && record.meta.requiresAuth)) {
    const token = sessionStorage.getItem("auth-token");
    if (!token) {
      return next({ name: "Login" });
    }
  }
  next();
});
export default router;
