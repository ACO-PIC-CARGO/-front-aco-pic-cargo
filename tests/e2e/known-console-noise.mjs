export const KNOWN_CONSOLE_NOISE = [
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "Error: Network Error"(\n|$)/,
    reason: "pre-existing on Vue 2: nuevoProveedor, verProveedor, editarProveedor, nuevoClientes, editarCliente, verCliente and 9 more",
  },
  {
    pattern: /^Error: Network Error(\n|$)/,
    reason: "pre-existing on Vue 2: nuevoProveedor, verProveedor, editarProveedor, nuevoClientes, editarCliente, verCliente and 38 more",
  },
  {
    pattern: /^\[Vue warn\]: Property or method "showNombreFiscal" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: nuevoClientes, verCliente, editarCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'toLowerCase'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: editarCliente",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'toLowerCase'\)(\n|$)/,
    reason: "pre-existing on Vue 2: editarCliente",
  },
  {
    pattern: /^Error al listar montos finales quote: Error: Network Error(\n|$)/,
    reason: "pre-existing on Vue 2: controlHouse, controlHouseEditar, controlHouseId",
  },
  {
    pattern: /^Cannot set properties of undefined \(setting 'text'\)(\n|$)/,
    reason: "pre-existing on Vue 2: billControlGastos, billControlGastosControl, editControlGasto, verControlGasto",
  },
  {
    pattern: /^Network Error(\n|$)/,
    reason: "pre-existing on Vue 2: editControlGasto, verControlGasto, listUserCalc",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'acronym'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: debstopay, accountsreceivable",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'acronym'\)(\n|$)/,
    reason: "pre-existing on Vue 2: debstopay, accountsreceivable",
  },
  {
    pattern: /^\[Vue warn\]: Property or method "payoperacion" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: controlPaymentFile",
  },
  {
    pattern: /^\[Vue warn\]: Invalid prop: type check failed for prop "items"\. Expected Array, got Object (\n|$)/,
    reason: "pre-existing on Vue 2: lstProyeccionCXP, nuevaProyeccionCXP, verProyeccion, editarProyeccion",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'symbol'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: nuevaProyeccionCXP, verProyeccion, editarProyeccion, listProgrammedPayment",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'symbol'\)(\n|$)/,
    reason: "pre-existing on Vue 2: nuevaProyeccionCXP, verProyeccion, editarProyeccion, listProgrammedPayment",
  },
  {
    pattern: /^\[Vue warn\]: Property or method "auto" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: viewAccountPaysCxC, EditAccountPaysCxC",
  },
  {
    pattern: /^\[Vue warn\]: Property or method "calcularTotal" is not defined on the instance but referenced during render\. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property\. See: https:\/\/v2\.vuejs\.org\/v2\/guide\/reactivity\.html#Declaring-Reactive-Properties\.(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
  },
  {
    pattern: /^\[Vue warn\]: Error in callback for watcher "selected": "TypeError: this\.calcularTotal is not a function"(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
  },
  {
    pattern: /^TypeError: this\.calcularTotal is not a function(\n|$)/,
    reason: "pre-existing on Vue 2: verPagosPorProveedor, editarPagosPorProveedor",
  },
  {
    pattern: /^\[Vue warn\]: Error in callback for watcher "selected": "TypeError: Cannot read properties of undefined \(reading 'reduce'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'reduce'\)(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: this\.\$store\.state\.bank\.deudaAProveedor is not iterable"(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^TypeError: this\.\$store\.state\.bank\.deudaAProveedor is not iterable(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'reduce'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'length'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'length'\)(\n|$)/,
    reason: "pre-existing on Vue 2: editarPagosPorCliente, verPagosPorCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'fecha_inicio'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: listFlujoMensual",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'fecha_inicio'\)(\n|$)/,
    reason: "pre-existing on Vue 2: listFlujoMensual",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "Error: Request failed with status code 500"(\n|$)/,
    reason: "pre-existing on Vue 2: verQuote, editQuote",
  },
  {
    pattern: /^Error: Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: verQuote, editQuote",
  },
  {
    pattern: /^\[Vue warn\]: Method "computed" has type "object" in the component definition\. Did you reference the function correctly\?(\n|$)/,
    reason: "pre-existing on Vue 2: cargaMasivaCalc",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'resetValidation'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: newEnterprise",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'resetValidation'\)(\n|$)/,
    reason: "pre-existing on Vue 2: newEnterprise",
  },
  {
    pattern: /^Error al obtener los datos: Error: Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: listTypePhone",
  },
  {
    pattern: /^Error al obtener los datos: Error: Network Error(\n|$)/,
    reason: "pre-existing on Vue 2: listGroupServices, ReporteGanancia, ReporteGananciaDetallado",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'forEach'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: EditarSalida",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'forEach'\)(\n|$)/,
    reason: "pre-existing on Vue 2: EditarSalida, EditarCobroCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'forEach'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: EditarCobroCliente",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'nro_propuesta'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'nro_propuesta'\)(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana",
  },
  {
    pattern: /^\[Vue warn\]: Computed property "opcionesSeleccionadas" was assigned to but it has no setter\.(\n|$)/,
    reason: "pre-existing on Vue 2: newCotizacionAduana",
  },
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'id_transport'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: EditarAduana, VerAduana",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'id_transport'\)(\n|$)/,
    reason: "pre-existing on Vue 2: EditarAduana, VerAduana",
  },
  {
    pattern: /^\[Vue warn\]: Error in v-on handler \(Promise\/async\): "TypeError: Cannot read properties of undefined \(reading 'id_transport'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: EditarAduana",
  },
  {
    pattern: /^\[Vue warn\]: Error in render: "TypeError: Cannot read properties of undefined \(reading 'id_port'\)"(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'id_port'\)(\n|$)/,
    reason: "pre-existing on Vue 2: VerAduana",
  },
];

export const isKnownNoise = (text) => KNOWN_CONSOLE_NOISE.some(({ pattern }) => pattern.test(text));
