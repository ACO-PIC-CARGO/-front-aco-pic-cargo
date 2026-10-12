export const BACKEND_CRASHES = [
  {
    endpoint: "cargar_master_detalle_tipo_persona",
    reason:
      "pre-existing backend bug: ListarPersonaTipoPersona reads rows[0].mensaje on an empty result (branch 22) and crashes the process",
  },
  {
    endpoint: "listar_persona_tipo_persona",
    reason:
      "pre-existing backend bug: ListarPersonaTipoPersona (entities.controller) reads rows[0].mensaje on an empty result (branch 22) and crashes the process",
  },
  {
    endpoint: "ver_registro_ingresos",
    reason:
      "pre-existing backend bug: verRegistroIngresos (spayment.controller) reads response.rows[0].estadoflag when the id does not exist and crashes the process",
  },
  {
    endpoint: "ver_cobro",
    reason:
      "pre-existing backend bug: VerCobroRealizado (banks.controller) reads response.rows[0].estadoflag when the nro_operacion does not exist and crashes the process",
  },
  {
    endpoint: "listado_houses",
    reason:
      "pre-existing backend bug: getListarHouses (house.controller) reads response.rows before checking err, so a database error crashes the process",
  },
  {
    endpoint: "calc/multiplicador",
    reason:
      "pre-existing backend bug: getCalcMultiplicador (calculadoraFletes) reads rows[0].mensaje on an empty result and crashes the process",
  },
  {
    endpoint: "house_ver",
    reason:
      "pre-existing backend bug: house_ver handler (house.controller) reads response.rows[0].estadoflag when the id does not exist and crashes the process",
  },
];

export const HANGING_ENDPOINTS = [
  "calc/cargar/opciones",
  "calc/estatus",
  "calc/opcion_listado",
  "calc/profit_list",
  "calc/servicio",
  "calc/transporte",
  "calc/ver_cotizacion",
  "cargar_moneda",
  "control_gastos_list",
  "control_gastos_listhouses",
  "entitie/cargar_datos_tarifas",
  "getControlList",
  "getHouseListAll",
  "getInvoiceAdmin",
  "getInvoiceAdminCxC",
  "getMasterList",
  "getQuoteList",
  "getVerInvoiceAdmin",
  "list_quote_status",
  "listado_llamadas",
  "listar_groupservices",
  "listar_montos_finales_aduana",
  "listar_montos_finales_quote",
  "obtener_totales_master_general",
  "obtener_totales_master_genetal_general",
  "obtener_totales_master_genetal_por_mes",
  "obtener_totales_master_por_mes",
  "text_whatsapp",
  "ver_incoterms_config",
  "ver_pago",
  "getPortEnd",
  "getPortBegin",
  "getNroHouse",
  "getMasterId",
  "listar_usuarios_calculadora",
  "getRegularizar",
  "getReportAccounts",
  "getDebsToPay",
];

export const HANG_REASON =
  "the local database lacks or mismatches the function this endpoint calls, so the request never gets a response";

export const ABORTED_ENDPOINTS = [
  ...BACKEND_CRASHES.map(({ endpoint }) => endpoint),
  ...HANGING_ENDPOINTS,
];

export async function abortRequestsThatCrashTheBackend(pageOrContext) {
  for (const endpoint of ABORTED_ENDPOINTS) {
    await pageOrContext.route(new RegExp(`/${endpoint}(\\?|/|$)`), (route) => route.abort("connectionreset"));
  }
}
