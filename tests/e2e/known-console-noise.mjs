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
    reason: "pre-existing on Vue 2: viewAccountPaysCxC, EditAccountPaysCxC, controlAccountReceivable",
    routes: ["viewAccountPaysCxC", "EditAccountPaysCxC", "controlAccountReceivable"],
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
    pattern: /^TypeError: Cannot read properties of undefined \(reading '(fecha_fin|cantidad_semanas)'\)(\n|$)/,
    reason: "same pre-existing issue as the listFlujoMensual 'fecha_inicio' entry, Vue 3 wording: each slot renders on its own, so the empty lstFlujoOperacionesMes[0] also fails at fecha_fin and cantidad_semanas",
    routes: ["listFlujoMensual"],
  },
  {
    pattern: /^\[Vue warn\]: Property "(_isVue|constructor)" was accessed during render but is not defined on instance\.[\s\S]*\n\s+at <FlujoOperacionPorMes>/,
    reason: "same pre-existing issue as the listFlujoMensual 'fecha_inicio' entry, Vue 3 wording: Sentry's component trace reads vm._isVue / vm.constructor during the failing render",
    routes: ["listFlujoMensual"],
  },
  {
    pattern: /^Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: verQuote, editQuote (listado_files answers 500: the SharePoint folder is unreachable locally)",
    routes: ["verQuote", "editQuote"],
  },
  {
    pattern: /^Error en crearCarpetaOneDrive: Error: Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: newQuote (the OneDrive/SharePoint folder is unreachable locally)",
    routes: ["newQuote"],
  },
  {
    pattern: /^Error en crearCarpetaOneDrive: AxiosError: Request failed with status code 500(\n|$)/,
    reason: "same pre-existing issue as the newQuote crearCarpetaOneDrive entry above, axios 1 wording (AxiosError)",
    routes: ["newQuote"],
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
    pattern: /^Error al obtener los datos: AxiosError: Request failed with status code 500(\n|$)/,
    reason: "same pre-existing issue as the listTypePhone getListTypePhone entry below, axios 1 wording (AxiosError)",
    routes: ["listTypePhone"],
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
    pattern: /^\[Vue warn\]: Property "(_isVue|constructor)" was accessed during render but is not defined on instance\.[\s\S]*\n\s+at <(DatosCargaComponent|DatosCostosComponent|InstructivoComponent)[ >]/,
    reason: "same pre-existing issue as the newCotizacionAduana / VerAduana 'Error in render ... nro_propuesta' entries, Vue 3 wording: Sentry's component trace reads vm._isVue / vm.constructor during the failing render",
    routes: ["newCotizacionAduana", "VerAduana"],
  },
  {
    pattern: /^\[Vue warn\]: Write operation failed: computed property "opcionesSeleccionadas" is readonly\.(\n|$)/,
    reason: "same pre-existing issue as the 'Computed property \"opcionesSeleccionadas\" was assigned to but it has no setter' entry, Vue 3 wording",
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
    pattern: /^Cannot read properties of undefined \(reading 'name'\)$/,
    reason: "pre-existing timing race: folderAduana/ComparativaComponent builds its headers 120 ms after mount and throws when tipo_costo_x_embarque answers later (same with the pre-conversion files)",
    routes: ["EditarAduana"],
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
  {
    pattern: /^\[Vue warn\]: Error in mounted hook \(Promise\/async\): "ReferenceError: vm is not defined"(\n|$)/,
    reason: "pre-existing on Vue 2: controlHouseEditar (folderHouse/dataGen.vue _validaData uses vm outside its scope for a house without client)",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^ReferenceError: vm is not defined(\n|$)/,
    reason: "pre-existing on Vue 2: controlHouseEditar (folderHouse/dataGen.vue _validaData uses vm outside its scope for a house without client)",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^\[Vue warn\]: Error in v-on handler: "TypeError: Cannot read properties of undefined \(reading 'push'\)"[\s\S]*<DataGen> at src\/components\/folderHouse\/dataGen\.vue/,
    reason: "pre-existing: folderHouse/dataGen.vue guardar() uses this.router",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'push'\)\n\s+at VueComponent\.guardar \(/,
    reason: "pre-existing: folderHouse/dataGen.vue guardar() uses this.router",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^TypeError: Cannot read properties of undefined \(reading 'push'\)\n\s+at Proxy\.guardar \(\S+\/src\/components\/folderHouse\/dataGen\.vue:/,
    reason: "same pre-existing issue as the 'at VueComponent.guardar' entry (folderHouse/dataGen.vue guardar() uses this.router), Vue 3 wording",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^Request failed with status code 500(\n|$)/,
    reason: "pre-existing on Vue 2: controlHouseEditar (crear-carpeta-house answers 500: the OneDrive/SharePoint folder is unreachable locally)",
    routes: ["controlHouseEditar"],
  },
  {
    pattern: /^\[Vue warn\]: Invalid prop: type check failed for prop "initialUrl"\. Expected String with value "\d+", got Number with value \d+\.(\n|$)/,
    reason: "pre-existing on Vue 2: addAccountPays (controlAccountPays passes the numeric uploaded file id as initial-url)",
    routes: ["addAccountPays"],
  },
  {
    pattern: /^\[Vue warn\]: Invalid prop: type check failed for prop "initialUrl"\. Expected String with value "\d+", got Number with value \d+\. ?\n\s+at <ArrastraYSolarComponent[ >]/,
    reason: "same pre-existing issue as the addAccountPays 'initialUrl' entry, Vue 3 wording: controlAccountPays passes the numeric uploaded file id as initial-url",
    routes: ["addAccountPays"],
  },
  {
    pattern: /^\[Vue warn\]: Property "auto" was accessed during render but is not defined on instance\./,
    reason: "same pre-existing issue as the viewAccountPaysCxC 'auto' entry, Vue 3 wording: controlAccountReceivable binds :hide-details=\"auto\" to a property it does not define",
    routes: ["viewAccountPaysCxC", "EditAccountPaysCxC", "controlAccountReceivable"],
  },
  {
    pattern: /^\[Vue warn\]: Property "calcularTotal" was accessed during render but is not defined on instance\./,
    reason: "same pre-existing issue as the verPagosPorProveedor 'calcularTotal' entries, Vue 3 wording: verEditarPayForProveedor binds a calcularTotal method it does not define",
    routes: ["verPagosPorProveedor", "editarPagosPorProveedor"],
  },
  {
    pattern: /^\[Vue warn\]: Property "(_isVue|constructor)" was accessed during render but is not defined on instance\.[\s\S]*\n\s+at <EditarCobroCliente[ >]/,
    reason: "same pre-existing issue as the EditarCobroCliente 'reading forEach' entries, Vue 3 wording: Sentry's component trace reads vm._isVue / vm.constructor during the failing render",
    routes: ["EditarCobroCliente"],
  },
  {
    pattern: /^\[Vue warn\]: Method "computed" has type "object" in the component definition\. Did you reference the function correctly\? \n\s+at <CalculadoraComponent>/,
    reason: "same pre-existing issue as the cargaMasivaCalc 'Method \"computed\"' entry, Vue 3 wording: CalculadoraComponent nests a computed block inside methods",
    routes: ["cargaMasivaCalc"],
  },
  {
    pattern: /^\[Vue warn\]: Property "showNombreFiscal" was accessed during render but is not defined on instance\./,
    reason: "same pre-existing issue as the nuevoClientes 'showNombreFiscal' entry, Vue 3 wording: seccionCliente renders v-if=\"showNombreFiscal\" without defining it",
    routes: ["nuevoClientes", "verCliente", "editarCliente"],
  },
  {
    pattern: /^\[Vue warn\]: Invalid prop: type check failed for prop "newId"\. Expected (?:Number with value 0|Number \| Null), got String with value ""\./,
    reason: "pre-existing on Vue 2 (same binding at 5b31ae9): ConfiguracionDatosEmpresaComponent passes datoEmpresa.id_pais \"\" to CboPais's Number prop newId; the baseline smoke never opened step 1; the CboPais conversion changed the message text from \"Expected Number with value 0\" to \"Expected Number | Null\"",
    routes: ["ConfiguracionInicial"],
  },
];

export const isKnownNoise = (text, routeName) =>
  KNOWN_CONSOLE_NOISE.some(({ pattern, routes }) => (!routes || routes.includes(routeName)) && pattern.test(text));
