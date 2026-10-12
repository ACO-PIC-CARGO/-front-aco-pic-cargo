export const KNOWN_CONSOLE_NOISE = [
  {
    pattern: /^\[Vue warn\]: Property or method "showNombreFiscal" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: nuevoClientes, verCliente, editarCliente",
    routes: ["nuevoClientes", "verCliente", "editarCliente"],
  },
  {
    pattern: /^Error al listar montos finales quote: Error: Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: controlHouse (listar_montos_finales_quote answers 500 on the development DB)",
    routes: ["controlHouse"],
  },
  {
    pattern: /^Cannot set properties of undefined \(setting 'text'\)(\n|$)/,
    reason: "pre-existing on Vue 2: billControlGastos, billControlGastosControl, editControlGasto, verControlGasto",
    routes: ["billControlGastos", "billControlGastosControl", "editControlGasto", "verControlGasto"],
  },
  {
    pattern: /^\[Vue warn\]: Property or method "payoperacion" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: controlPaymentFile",
    routes: ["controlPaymentFile"],
  },
  {
    pattern: /^\[Vue warn\]: Invalid prop: type check failed for prop "items"\. Expected Array, got Object (\n|$)/,
    reason: "pre-existing on Vue 2: lstProyeccionCXP, nuevaProyeccionCXP, verProyeccion, editarProyeccion",
    routes: ["lstProyeccionCXP", "nuevaProyeccionCXP", "verProyeccion", "editarProyeccion"],
  },
  {
    pattern: /^\[Vue warn\]: Property or method "auto" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: viewAccountPaysCxC, EditAccountPaysCxC",
    routes: ["viewAccountPaysCxC", "EditAccountPaysCxC"],
  },
  {
    pattern: /^\[Vue warn\]: Property or method "calcularTotal" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
    routes: ["verPagosPorProveedor", "editarPagosPorProveedor"],
  },
  {
    pattern: /^\[Vue warn\]: Error in callback for watcher "selected": "TypeError: this\.calcularTotal is not a function"(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
    routes: ["verPagosPorProveedor", "editarPagosPorProveedor"],
  },
  {
    pattern: /^TypeError: this\.calcularTotal is not a function(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
    routes: ["verPagosPorProveedor", "editarPagosPorProveedor"],
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'fecha_inicio'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: listFlujoMensual",
    routes: ["listFlujoMensual"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'fecha_inicio'\)(\n|$)/,
    reason: "pre-existing on Vue 2: listFlujoMensual",
    routes: ["listFlujoMensual"],
  },
  {
    pattern: /^Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: verQuote, editQuote (listado_files answers 500: the SharePoint folder is unreachable locally)",
    routes: ["verQuote", "editQuote"],
  },
  {
    pattern: /^\[Vue warn\]: Method "computed" has type "object" in the component definition\. Did you reference the function correctly\?(\n|$)/,
    reason: "pre-existing on Vue 2: cargaMasivaCalc",
    routes: ["cargaMasivaCalc"],
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'resetValidation'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: newEnterprise",
    routes: ["newEnterprise"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'resetValidation'\)(\n|$)/,
    reason: "pre-existing on Vue 2: newEnterprise",
    routes: ["newEnterprise"],
  },
  {
    pattern: /^Error al obtener los datos: Error: Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: listTypePhone (getListTypePhone answers 500: the development DB has no function_list_table_type_phone)",
    routes: ["listTypePhone"],
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'forEach'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: EditarCobroCliente",
    routes: ["EditarCobroCliente"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'forEach'\)(\n|$)/,
    reason: "pre-existing on Vue 2: EditarCobroCliente",
    routes: ["EditarCobroCliente"],
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'nro_propuesta'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana, VerAduana",
    routes: ["newCotizacionAduana", "VerAduana"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'nro_propuesta'\)(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana, VerAduana",
    routes: ["newCotizacionAduana", "VerAduana"],
  },
  {
    pattern: /^\[Vue warn\]: Computed property "opcionesSeleccionadas" was assigned to but it has no setter\.(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana, EditarAduana",
    routes: ["newCotizacionAduana", "EditarAduana"],
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'id_port'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
    routes: ["VerAduana"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'id_port'\)(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
    routes: ["VerAduana"],
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'name'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
    routes: ["VerAduana"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'name'\)(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
    routes: ["VerAduana"],
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of null \(reading 'forEach'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: VerCotizacionCalculadora",
    routes: ["VerCotizacionCalculadora"],
  },
  {
    pattern: /^TypeError: Cannot read properties of null \(reading 'forEach'\)(\n|$)/,
    reason: "pre-existing on Vue 2: VerCotizacionCalculadora",
    routes: ["VerCotizacionCalculadora"],
  },
];

export const isKnownNoise = (text, routeName) =>
  KNOWN_CONSOLE_NOISE.some(({ pattern, routes }) => (!routes || routes.includes(routeName)) && pattern.test(text));
