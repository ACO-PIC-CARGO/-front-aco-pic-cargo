import { createRouter, createWebHistory } from "vue-router";
import planAccessGuard from "./planAccessGuard";
import resetSessionOnLogin from "./resetSessionOnLogin";

const routes = [
  {
    path: "/",
    name: "Login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/registro_empresa",
    name: "RegistroEmpresa",
    component: () =>
      import("../views/FolderEnterprise/RegistroNuevaEmpresa.vue"),
  },
  {
    path: "/planes",
    name: "Planes",
    component: () => import("../views/Planes/PlanesView.vue"),
  },
  {
    path: "/terminos",
    name: "LegalTerms",
    component: () => import("../views/Legal/LegalPage.vue"),
    props: { page: "terminos" },
    meta: { scrollToTop: true },
  },
  {
    path: "/privacidad",
    name: "LegalPrivacy",
    component: () => import("../views/Legal/LegalPage.vue"),
    props: { page: "privacidad" },
    meta: { scrollToTop: true },
  },
  {
    path: "/reembolsos",
    name: "LegalRefunds",
    component: () => import("../views/Legal/LegalPage.vue"),
    props: { page: "reembolsos" },
    meta: { scrollToTop: true },
  },

  {
    path: "/home",
    meta: { requiresAuth: true },
    component: () => import("../views/dashboard/DashboardMain.vue"),
    children: [
      {
        path: "",
        redirect: "/home/main",
        name:"Home"
      },
      {
        path: "main",
        name: "Main",
        component: () => import("../views/dashboard/DashboardHome.vue"),
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
        component: () => import("../views/folderEntities/ListEntities.vue"),
      },
      {
        path: "folderEntities/listado-proveedores",
        name: "listProveedor",
        component: () =>
          import("../views/folderEntities/Proveedor/ListProveedor.vue"),
      },
      {
        path: "folderEntities/nuevo-proveedor",
        name: "nuevoProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/NuevoProveedor.vue"),
      },
      {
        path: "folderEntities/ver-proveedor/:id",
        name: "verProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/VerProveedor.vue"),
      },
      {
        path: "folderEntities/editar-proveedor/:id",
        name: "editarProveedor",
        component: () =>
          import("@/views/folderEntities/Proveedor/EditarProveedor.vue"),
      },
      {
        path: "folderEntities/listado-cliente",
        name: "listClientes",
        component: () =>
          import("../views/folderEntities/Cliente/ListCliente.vue"),
      },
      {
        path: "folderEntities/nuevo-cliente",
        name: "nuevoClientes",
        component: () =>
          import("../views/folderEntities/Cliente/NuevoCliente.vue"),
      },
      {
        path: "folderEntities/ver-cliente/:id",
        name: "verCliente",
        component: () =>
          import("../views/folderEntities/Cliente/VerCliente.vue"),
      },
      {
        path: "folderEntities/editar-cliente/:id",
        name: "editarCliente",
        component: () =>
          import("../views/folderEntities/Cliente/EditarCliente.vue"),
      },
      {
        path: "folderEntities/list-personal-rol",
        name: "listPersonaRol",
        component: () => import("../views/Security/RolPersona/ListPersonaRol.vue"),
      },
      {
        path: "folderEntities/control/:id_role",
        name: "controlEntitie",
        component: () => import("../views/folderEntities/ControlEntities.vue"),
      },
      {
        path: "folderEntities/control/edit/:id",
        name: "controlEntitieEdit",
        component: () => import("../views/folderEntities/ControlEntities.vue"),
      },
      {
        path: "folderMaster/list",
        name: "listMaster",
        component: () => import("../views/folderMaster/ListMaster.vue"),
      },
      {
        path: "folderMaster/control",
        name: "controlMaster",
        component: () => import("../views/folderMaster/ControlMaster.vue"),
      },
      {
        path: "folderMaster/control/editar/:id",
        name: "controlMasterEditar",
        component: () => import("../views/folderMaster/ControlMaster.vue"),
      },
      {
        path: "folderMaster/control/ver/:id",
        name: "controlMasterVer",
        component: () => import("../views/folderMaster/ControlMaster.vue"),
      },
      {
        path: "folderMaster/control/:id",
        name: "controlMasterId",
        component: () => import("../views/folderMaster/ControlMaster.vue"),
      },
      {
        path: "folderMaster/control/:id/:params",
        name: "controlMasterParams",
        component: () => import("../views/folderMaster/ControlMaster.vue"),
      },
      {
        path: "folderHouse/list",
        name: "listHouse",
        component: () => import("../views/folderHouse/ListHouse.vue"),
      },
      {
        path: "folderHouse/control",
        name: "controlHouse",
        component: () => import("../views/folderHouse/ControlHouse.vue"),
      },
      {
        path: "folderHouse/confAvisoLlegada",
        name: "confAvisoLlegada",
        component: () => import("../views/folderHouse/ConfiguracionAvisoLlegada.vue"),
      },
      {
        path: "folderHouse/control/editar/:id/:activar?",
        name: "controlHouseEditar",
        component: () => import("../views/folderHouse/ControlHouse.vue"),
      },
      {
        path: "folderHouse/control/ver/:id",
        name: "controlHouseVer",
        component: () => import("../views/folderHouse/VerHouse.vue"),
      },
      {
        path: "folderHouse/control/:id",
        name: "controlHouseId",
        component: () => import("../views/folderHouse/ControlHouse.vue"),
      },
      {
        path: "folderReports/list",
        name: "reportsControlFile",
        component: () => import("../views/folderReports/reportsControlFile.vue"),
      },
      {
        path: "folderReports/listDetails",
        name: "reportsControlFileDetails",
        component: () => import("../views/folderReports/reportsControlFileDetails.vue"),
      },
      {
        path: "folderBilling/billControlGastos/:id_house",
        name: "billControlGastos",
        component: () => import("../views/folderBilling/BillControlGastos.vue"),
      },
      {
        path: "folderBilling/billControlGastos/view/:id_house/:id_control/:id_orders/:code",
        name: "billControlGastosControl",
        component: () => import("../views/folderBilling/BillControlGastos.vue"),
      },
      {
        path: "folderBilling/listControlGastos",
        name: "listControlGastos",
        component: () => import("../views/folderBilling/ListControlGastos.vue"),
      },
      // {
      //   path: "folderBilling/editControlGastos/view/:code_master/:id_branch",
      //   name: "editControlGasto",
      //   component: () => import("../views/folderBilling/frmControlGastos.vue"),
      // },
      {
        path: "folderBilling/editControlGastos/view/:id/:id_branch",
        name: "editControlGasto",
        component: () => import("../views/folderBilling/FrmControlGastos.vue"),
      },
      {
        path: "folderBilling/verControlGastos/view/:id/:id_branch",
        name: "verControlGasto",
        component: () => import("../views/folderBilling/FrmControlGastosVer.vue"),
      },
      {
        path: "folderRequest/controlRequest",
        name: "controlRequest",
        component: () => import("../views/requests/controlRequest.vue"),
      },
      {
        path: "folderRequest/debstopay",
        name: "debstopay",
        component: () => import("../views/requests/reportDebstoPay.vue"),
      },
      {
        path: "folderRequest/controlPaymentFile",
        name: "controlPaymentFile",
        component: () => import("../views/requests/controlPaymentFile.vue"),
      },
      {
        path: "folderRequest/accountsReceivable",
        name: "accountsreceivable",
        component: () => import("../views/requests/accountsreceivable.vue"),
      },
      {
        path: "folderRequest/checkDebs",
        name: "checkDebs",
        component: () => import("../views/requests/checkDebs.vue"),
      },
      {
        path: "folderRequest/cashflow",
        name: "cashFlow",
        component: () => import("../views/requests/cashFlow.vue"),
      },
      {
        path: "folderModulesPays/controlAccountPays",
        name: "controlAccountPays",
        component: () => import("../views/folderModulesPays/moduleAccountPays.vue"),
      },
      {
        path: "folderModulesPays/addmodulesAccountPays",
        name: "addAccountPays",
        component: () => import("../views/folderModulesPays/controlAccountPays.vue"),
      },

      {
        path: "folderModulesPays/moduleAccountReceivable",
        name: "moduleAccountReceivable",
        component: () => import("../views/folderModulesPays/moduleAccountReceivable.vue"),
      },
      {
        path: "folderModulesPays/regularizarProformace",
        name: "controlRegulizarPro",
        component: () => import("../views/folderModulesPays/regularizarProformace.vue"),
      },
      {
        path: "folderModulesPays/viewAccountPays/:id",
        name: "viewAccountPays",
        component: () => import("../views/folderModulesPays/controlAccountPaysView.vue"),
      },
      {
        path: "folderModulesPays/EditAccountPays/:id",
        name: "EditAccountPays",
        component: () => import("../views/folderModulesPays/controlAccountPaysEdit.vue"),
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
        component: () => import("../views/folderProyeccion/verProyeccion.vue"),
      },
      {
        path: "folderModulesPays/editarProyeccion/:id",
        name: "editarProyeccion",
        component: () => import("../views/folderProyeccion/editarProyeccion.vue"),
      },

      {
        path: "viewAccountPaysCxC/controlAccountReceivable",
        name: "controlAccountReceivable",
        component: () => import("../views/folderModulesPays/controlAccountReceivable.vue"),
      },
      {
        path: "viewAccountPaysCxC/:id",
        name: "viewAccountPaysCxC",
        component: () => import("../views/folderModulesPays/controlAccountPaysCxCView.vue"),
      },
      {
        path: "EditviewAccountPaysCxC/:id",
        name: "EditAccountPaysCxC",
        component: () => import("../views/folderModulesPays/controlAccountPaysCxCEdit.vue"),
      },
      {
        path: "FolderBanks/listadoPagosPorProveedor",
        name: "listBankCxP",
        component: () => import("../views/FolderBanks/listadoPagosPorProveedor.vue"),
      },
      {
        path: "FolderBanks/registroPayForProveedor",
        name: "registroPayForProveedor",
        component: () => import("../views/FolderBanks/registroPagoProveedor.vue"),
      },
      {
        path: "FolderBanks/verPagosPorProveedor/:id",
        name: "verPagosPorProveedor",
        component: () => import("../views/FolderBanks/verPagosPorProveedor.vue"),
      },
      {
        path: "FolderBanks/editarPagosPorProveedor/:id",
        name: "editarPagosPorProveedor",
        component: () => import("../views/FolderBanks/editarPagosPorProveedor.vue"),
      },
      {
        path: "FolderBanks/editarPagosPorCliente/:id",
        name: "editarPagosPorCliente",
        component: () => import("../views/FolderBanks/editarPagosPorCliente.vue"),
      },
      {
        path: "FolderBanks/listadoPagosPorCliente",
        name: "listBankCxC",
        component: () => import("../views/FolderBanks/listadoPagosPorCliente.vue"),
      },
      {
        path: "FolderBanks/registroPayForCliente",
        name: "registroPayForCliente",
        component: () => import("../views/FolderBanks/registroPagoCliente.vue"),
      },
      {
        path: "FolderBanks/verPagosPorCliente/:id",
        name: "verPagosPorCliente",
        component: () => import("../views/FolderBanks/verPagosPorCliente.vue"),
      },
      {
        path: "folderReports/listProgrammedPayment",
        name: "listProgrammedPayment",
        component: () => import("../views/programmedPayment/listProgrammedPayment.vue"),
      },
      {
        path: "folderBilling/lstFacturacion",
        name: "lstFacturacion",
        component: () => import("../views/folderBilling/ListFacturacionView.vue"),
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
          import("../views/folderConsolidacion/NuevaConsolidacionView.vue"),
      },
      {
        path: "folderReports/balanceGanancia",
        name: "lstEstadoGanancias",
        component: () => import("../views/balance/balanceGanancia.vue"),
      },
      {
        path: "folderRequest/listFlujoMensual",
        name: "listFlujoMensual",
        component: () => import("../views/balance/FlujoOperacionesMesView.vue"),
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
          import("../../src/views/folterCargaMasiva/CargaMasivaCalculadora.vue"),
      },
      {
        path: "folterCargaMasiva/carga_control_gastos",
        name: "cargaMasivaControlGasto",
        component: () =>
          import("../../src/views/folterCargaMasiva/CargaMasivaControlGastos.vue"),
      },
      {
        path: "folterCalculadora/list_user_calc",
        name: "listUserCalc",
        component: () => import("../../src/views/Calculadora/ListUserCalc.vue"),
      },
      {
        path: "enterprise/listado",
        name: "listEnterprise",
        component: () => import("../views/FolderEnterprise/ListadoEmpresas.vue"),
      },
      {
        path: "enterprise/nuevo",
        name: "newEnterprise",
        component: () => import("../views/FolderEnterprise/NuevaEmpresa.vue"),
      },
      {
        path: "enterprise/read/:id",
        name: "readEnterprise",
        component: () => import("../views/FolderEnterprise/VerEmpresa.vue"),
      },
      {
        path: "enterprise/update/:id",
        name: "updateEnterprise",
        component: () => import("../views/FolderEnterprise/ActualizarEmpresa.vue"),
      },
      {
        path: "marketing/list",
        name: "listMarketing",
        component: () => import("../views/FolderMarketing/ListaMarketing.vue"),
      },
      {
        path: "type_phone/list",
        name: "listTypePhone",
        component: () => import("../views/FolderTypePhone/ListaTiposTelefono.vue"),
      },
      {
        path: "document/list",
        name: "listDocument",
        component: () => import("../views/FolderDocument/ListaDocumentos.vue"),
      },
      {
        path: "year/list",
        name: "listYear",
        component: () => import("../views/FolderYear/ListaAnios.vue"),
      },
      {
        path: "sex/list",
        name: "listSex",
        component: () => import("../views/FolderSex/ListaGeneros.vue"),
      },
      {
        path: "groupservices/list",
        name: "listGroupServices",
        component: () => import("../views/FolderGroupServices/ListaServicios.vue"),
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
        component: () => import("../views/FolderIncoterm/ListaIncoterms.vue"),
      },
      {
        path: "performance/list",
        name: "performance",
        component: () => import("../views/FolderPerformance/ListaPerformance.vue"),
      },
      {
        path: "bank/list",
        name: "bankList",
        component: () => import("../views/FolderBanks/list.vue"),
      },
      {
        path: "modality/list",
        name: "listModality",
        component: () => import("../views/FolderModality/ListaModalidades.vue"),
      },
      {
        path: "transport/list",
        name: "listTransport",
        component: () => import("../views/FolderTransport/ListaTransportes.vue"),
      },
      {
        path: "gastos/list",
        name: "listGastos",
        component: () => import("../views/FolderGasto/ListaGastos.vue"),
      },
      {
        path: "sub_gasto/list",
        name: "listSubGasto",
        component: () => import("../views/FolderGasto/ListSubGasto.vue"),
      },
      {
        path: "coins/list",
        name: "listCoins",
        component: () => import("../views/FolderCoins/ListaMonedas.vue"),
      },
      {
        path: "ingreso/list",
        name: "listIngresos",
        component: () => import("../views/FolderIngresos/ListaIngresos.vue"),
      },
      {
        path: "sub_ingreso/listado",
        name: "listSubIngresos",
        component: () => import("../views/FolderIngresos/ListSubIngreso.vue"),
      },
      {
        path: "containers/list",
        name: "listContainers",
        component: () => import("../views/FolderContainers/ListaContenedores.vue"),
      },
      {
        path: "shipment/listado",
        name: "listShipment",
        component: () => import("../views/FolderTipoCarga/ListaTiposCarga.vue"),
      },
      {
        path: "multiplicador/listado",
        name: "listMultiplicador",
        component: () => import("../views/FolderMultiplicador/ListaMultiplicadores.vue"),
      },
      {
        path: "airlines/listado",
        name: "listAirlines",
        component: () => import("../views/Airlines/ListAirlines.vue"),
      },
      {
        path: "quote_status/listado",
        name: "listQuoteStatus",
        component: () => import("../views/StatusQuote/ListQuoteStatus.vue"),
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
          import("../views/FolderComentariosPredefinidos/ListaComentariosPredefinidos.vue"),
      },
      {
        path: "suscripcion",
        name: "lstPlanes",
        component: () =>
          import("../views/SubscriptionPackages/SubscriptionPackages.vue"),
      },
      {
        path: "mi-plan",
        name: "miPlan",
        component: () => import("../views/MyPlan/MyPlan.vue"),
      },
      {
        path: "paginas-legales",
        name: "legalPagesAdmin",
        component: () => import("../views/Legal/LegalPagesAdmin.vue"),
      },
      {
        path: "historial-facturacion",
        name: "billingHistory",
        component: () => import("../views/BillingHistory/BillingHistory.vue"),
      },
      // {
      //   path: "suscripcion3",
      //   name: "lstPlanes",
      //   component: () =>
      //     import("../views/Membresia/RegistroMembresiacarlos2.vue"),
      // },
      // {
      //   path: "suscripcion2",
      //   name: "lstPlanes",
      //   component: () =>
      //     import("../views/Membresia/RegistroMembresia.vue"),
      // },
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
          import("../views/Calculadora/FCL/ServiciosCostosFijosFCL.vue"),
      },
      {
        path: "ServiciosCostosFijosLCL",
        name: "ServiciosCostosFijosLCL",
        component: () =>
          import("../views/Calculadora/LCL/ServiciosCostosFijosLCL.vue"),
      },
      {
        path: "ServiciosCostosFijosAereo",
        name: "ServiciosCostosFijosAereo",
        component: () =>
          import("../views/Calculadora/AEREO/ServiciosCostosFijosAereo.vue"),
      },
      {
        path: "folterCalculadora/cotizacion/:id",
        name: "UserCalculadoraVer",
        component: () => import("../views/Calculadora/UserCalculadoraVer.vue"),
        // @ts-expect-error duplicate keys of the unreachable UserCalculadoraVer route are kept as is
        path: "folderPlantillas/servicios_tarifas",
        // @ts-expect-error duplicate keys of the unreachable UserCalculadoraVer route are kept as is
        name: "ServiciosTarifasPlantillas",
        // @ts-expect-error duplicate keys of the unreachable UserCalculadoraVer route are kept as is
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
      {
        path: "pricing/profit",
        name: "listPricingProfit",
        component: () =>
          import("../views/PricingProfit/ListadoProfitPricing.vue"),
      },
      {
        path: "pricing/profit/registro",
        name: "RegistroProfitPricing",
        component: () =>
          import("../views/PricingProfit/RegistroProfitPricing.vue"),
      },
      {
        path: "configuracion/texto_whatsapp_cotizacion",
        name: "TextoWhatsappCotizacion",
        component: () =>
          import("../views/Configuracion/Pricing/TextoWhatsappCotizacion.vue"),
      },
      {
        path: "reporte/ReporteGanancia",
        name: "ReporteGanancia",
        component: () =>
          import("../views/folderReports/ReporteGanancia.vue"),
      },
      {
        path: "reporte/ReporteGananciaDetallado",
        name: "ReporteGananciaDetallado",
        component: () =>
          import("../views/folderReports/ReporteGananciaDetallado.vue"),
      },
      {
        path: "calculadora/ver_cotizacion",
        name: "VerCotizacionCalculadora",
        component: () =>
          import("../views/Calculadora/VerCotizacionCalculadora.vue"),
      },
      {
        path: "calculadora/configuracion_opciones",
        name: "calcOpciones",
        component: () =>
          import("../views/Calculadora/ConfiguracionOpcionCalculadora.vue"),
      },
    ],
  },
  {
    path: "/tracking/:token",
    name: "tracking",
    component: () => import("../views/folderHouse/TrackingHouse.vue"),
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    if (savedPosition || !to.meta.scrollToTop) return savedPosition ?? undefined;
    return { left: 0, top: 0 };
  },
});

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth);
  if (requiresAuth && !sessionStorage.getItem("auth-token")) return { name: "Login" };
});
router.beforeEach(resetSessionOnLogin);
router.beforeEach(planAccessGuard);
export default router;
