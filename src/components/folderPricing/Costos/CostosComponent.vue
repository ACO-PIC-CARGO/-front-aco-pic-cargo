<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import type { Ref } from "vue";
import { useAppStore } from "@/stores/app";
import NuevoProveedorComponentVue from "@/components/folderEntities/Proveedor/NuevoProveedorComponent.vue";
import CboMultiplicador from "@/components/comun/CboMultiplicador.vue";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useEntitiesStore } from "@/stores/entities";
import { useProveedorStore } from "@/stores/proveedor";
import { usePricingStore } from "@/stores/pricing";
import { calcularValor, comienzaNoConCaracter, currencyFormat } from "@/utils/cotizacion";
import type { Costo, FormNuevoCosto, Numerico } from "@/types/cotizacion";
import type { TipoCostoConfig } from "@/types/empresas";

const props = defineProps<{
  valores: Costo[];
  actualizarCostosFlag?: boolean;
  amount?: Numerico;
  index?: number | string;
  recargarSegmentos?: boolean;
}>();

const appStore = useAppStore();
const pricingStore = usePricingStore();
const proveedorStore = useProveedorStore();
const entitiesStore = useEntitiesStore();
const { calcularFac } = useCotizacionCalculos();

const costo = ref<Costo>({});
const dialogNuevoProveedor = ref(false);
const totalOption = ref(0);
const valueFleteImport = ref(0);
const valueOrigen = ref(0);
const valueLocal = ref(0);
const valueAduana = ref(0);
const valueFleteExport = ref(0);
const valueAlmacen = ref(0);
const valueGastosTerceros = ref(0);
const resumenOpcion = ref({
  flete: 0,
  origen: 0,
  gasto: 0,
  aduana: 0,
  almacen: 0,
  gastostercero: 0,
});
const dialog = ref(false);
// -----------------------------
const mostrarBtnFleteImportFlag = ref(true);
const mostrarBtnOrigenFlag = ref(true);
const mostrarBtnLocalFlag = ref(true);
const mostrarBtnAduanaFlag = ref(true);
const mostrarBtnFleteExportFlag = ref(true);
const mostrarBtnAlmacenFlag = ref(true);
const mostrarBtnGastosTercerosFlag = ref(true);
// -----------------------------

// -----------------------------
const mostrarFleteImportFlag = ref(false);
const mostrarOrigenFlag = ref(false);
const mostrarLocalFlag = ref(false);
const mostrarAduanaFlag = ref(false);
const mostrarFleteExportFlag = ref(false);
const mostrarAlmacenFlag = ref(false);
const mostrarGastosTercerosFlag = ref(false);
// -----------------------------
const fromDataService = ref<FormNuevoCosto>({
  ventaFlag: 0,
  esopcionflag: 1,
  id_begend: 0,
  costounitario: "",
  esorigenflag: 0,
  eslocalflag: 0,
  esaduanaflag: 0,
  esalmacenflag: 0,
  esgastostercerosflag: 0,
  seguro: 0,
  cif: 0,
  esventaflag: 0,
  status: 1,
  id_groupservices: 0,
  id_multiplicador: 0,
  id_proveedor: 0,
  id: 0,
});
const frmNuevoCosto = useTemplateRef("frmNuevoCosto");

const flagRefs: Record<string, Ref<boolean>> = {
  mostrarOrigenFlag,
  mostrarLocalFlag,
  mostrarAduanaFlag,
  mostrarFleteExportFlag,
  mostrarAlmacenFlag,
  mostrarGastosTercerosFlag,
};
const valueRefs: Record<string, Ref<number>> = {
  valueOrigen,
  valueLocal,
  valueAduana,
  valueFleteExport,
  valueAlmacen,
  valueGastosTerceros,
};
const btnRefs: Record<string, Ref<boolean>> = {
  mostrarBtnOrigenFlag,
  mostrarBtnLocalFlag,
  mostrarBtnAduanaFlag,
  mostrarBtnFleteExportFlag,
  mostrarBtnAlmacenFlag,
  mostrarBtnGastosTercerosFlag,
};
// Not defined anywhere, so calling these throws.
const mostrarSiguienteOrigen = undefined as unknown as () => void;
const mostrarSiguienteLocal = undefined as unknown as () => void;
const mostrarSiguienteAduana = undefined as unknown as () => void;
const mostrarSiguienteFleteExport = undefined as unknown as () => void;

const cancelarLlenadoNuevaOpcion = computed(
  () => pricingStore.cancelarLlenadoNuevaOpcion,
);
const totalFlete = computed(() => pricingStore.totalFlete);
const isFlete = computed(() => {
  const val = props.valores.some(
    (v) => v.esfleteflag == 1 && v.status == true,
  );
  return val;
});
const isOrigen = computed(() => {
  const val = props.valores.some(
    (v) => v.esorigenflag == 1 && v.status == true,
  );

  return val;
});
const isLocal = computed(() => {
  const val = props.valores.some((v) => v.eslocalflag == 1 && v.status == true);
  return val;
});
const isAduana = computed(() => {
  const val = props.valores.some(
    (v) => v.esaduanaflag == 1 && v.status == true,
  );
  return val;
});
const isGastosTercero = computed(() => {
  const val = props.valores.some(
    (v) => v.esgastostercerosflag == 1 && v.status == true,
  );
  return val;
});
const isAlmacen = computed(() => {
  const val = props.valores.some(
    (v) => v.esalmacenflag == 1 && v.status == true,
  );
  return val;
});
const isImport = computed(() => {
  return pricingStore.listModality.some(
    (v) => v.id == pricingStore.datosPrincipales.idsentido && v.code == "I",
  );
});
const mostrarFleteImport = computed(() => {
  return isImport.value && mostrarFleteImportFlag.value;
});
const mostrarOrigen = computed(() => {
  return mostrarOrigenFlag.value;
});
const mostrarLocal = computed(() => {
  return mostrarLocalFlag.value;
});
const mostrarAduana = computed(() => {
  return mostrarAduanaFlag.value;
});
const mostrarFleteExport = computed(() => {
  return !isImport.value && mostrarFleteExportFlag.value;
});
const mostrarAlmacen = computed(() => {
  return mostrarAlmacenFlag.value;
});
const mostrarGastosTerceros = computed(() => {
  return mostrarGastosTercerosFlag.value;
});
const tipoOpcion = computed(() => {
  const tipos: TipoCostoConfig[] = [];
  pricingStore.listTipoCostos.forEach((element) => {
    switch (element.codigo) {
      case "GT":
        if (mostrarGastosTerceros.value) {
          tipos.push(element);
        }
        break;
      case "FL":
        if (mostrarFleteImport.value || mostrarFleteExport.value) {
          tipos.push(element);
        }
        break;
      case "OR":
        if (mostrarOrigen.value) {
          tipos.push(element);
        }
        break;
      case "LO":
        if (mostrarLocal.value) {
          tipos.push(element);
        }
        break;
      case "AD":
        if (mostrarAduana.value) {
          tipos.push(element);
        }
        break;
      case "AL":
        if (mostrarAlmacen.value) {
          tipos.push(element);
        }
        break;

      default:
        break;
    }
  });
  return tipos;
});

async function nuevoProveedor() {
  const res = await entitiesStore.guardarProveedor();
  if (!!res.estadoflag) {
    await appStore.cargarProveedores();
    costo.value.id_proveedor = res.data![0]!.id_entitie;
    dialogNuevoProveedor.value = false;
  }
  const opciones = [...pricingStore.opcionCostos];
  const IdProveedor: Costo["id_proveedor"][] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: null,
  });
}
async function recargarProveedores(e: string | null) {
  const opciones = [...pricingStore.opcionCostos];
  const IdProveedor: Costo["id_proveedor"][] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: e,
  });
}
function isITBM(code: Numerico) {
  return code == 38 ? true : false;
}
function guardarProveedorE(val: number) {
  costo.value.id_proveedor = val;
  dialogNuevoProveedor.value = false;
}
function abrirModalRegistroProveedor(item: Costo) {
  costo.value = item;
  dialogNuevoProveedor.value = true;
}
function mostrarBtnRegistroProveedor() {
  if (!entitiesStore.proveedor.nombrecompleto) {
    return false;
  }
  if (!entitiesStore.proveedor.id_tipoproveedor) {
    return false;
  }
  if (!entitiesStore.proveedor.id_tipotransaccion) {
    return false;
  }
  if (!entitiesStore.proveedor.id_pais) {
    return false;
  }
  return true;
}
function habilidarCuandoYaHayOpciones() {
  nextTick(() => {
    if (isFlete.value && isImport.value) {
      mostrarFleteImportFlag.value = true;
    }
    if (isOrigen.value) {
      mostrarOrigenFlag.value = true;
    }
    if (isLocal.value) {
      mostrarLocalFlag.value = true;
    }

    if (isAduana.value) {
      mostrarAduanaFlag.value = true;
    }
    if (isFlete.value && !isImport.value) {
      mostrarFleteExportFlag.value = true;
    }
    if (isAlmacen.value) {
      mostrarAlmacenFlag.value = true;
    }
    if (isGastosTercero.value) {
      mostrarGastosTercerosFlag.value = true;
    }
    mostrarBtnFleteImportFlag.value = false;
    mostrarBtnOrigenFlag.value = false;
    mostrarBtnLocalFlag.value = false;
    mostrarBtnAduanaFlag.value = false;
    mostrarBtnFleteExportFlag.value = false;
    mostrarBtnAlmacenFlag.value = false;
    mostrarBtnGastosTercerosFlag.value = false;
    valueFleteImport.value = 1;
    valueOrigen.value = 1;
    valueLocal.value = 1;
    valueAduana.value = 1;
    valueFleteExport.value = 1;
    valueAlmacen.value = 1;
    valueGastosTerceros.value = 1;
    
  });
}
function habilidarPrimeraAccion() {
  // 1. Agrupamos la lógica de Fletes
  if (isFlete.value) {
    if (isImport.value) {
      mostrarFleteImportFlag.value = true;
    } else {
      mostrarFleteExportFlag.value = true;
    }
    return true;
  }

  // 2. Evaluamos el resto de flags secuencialmente
  if (isOrigen.value) {
    mostrarOrigenFlag.value = true;
    return true;
  }
  if (isLocal.value) {
    mostrarLocalFlag.value = true;
    return true;
  }
  if (isAduana.value) {
    mostrarAduanaFlag.value = true;
    return true;
  }
  if (isAlmacen.value) {
    mostrarAlmacenFlag.value = true;
    return true;
  }
  if (isGastosTercero.value) {
    mostrarGastosTercerosFlag.value = true;
    return true;
  }

  return false; // Es una buena práctica retornar false si ninguna condición se cumplió
}
function comprobarFleteImport() {
  let tieneErrores = false;

  // 1. Filtramos y evaluamos en un solo recorrido eficiente
  props.valores
    .filter((v) => v.esfleteflag == 1 && v.status === true)
    .forEach((element) => {
      const tieneErrorCosto = validateCost({ costo: element });

      if (tieneErrorCosto) {
        element.error = "El costo que tiene un valor 0.00.";
        tieneErrores = true; // Si encontramos al menos uno, activamos la bandera
      } else {
        element.error = "";
      }
    });

  // 2. Si no hubo errores, avanzamos a la siguiente acción
  if (!tieneErrores) {
    mostrarSiguienteFleteImport();
    valueFleteImport.value = 1;
    mostrarBtnFleteImportFlag.value = false;
  }
}

function mostrarSiguienteFleteImport() {
  // Diccionario de condiciones para evitar los 'if' repetitivos
  const pasos = [
    { condicion: isOrigen.value, flag: "mostrarOrigenFlag" },
    { condicion: isLocal.value, flag: "mostrarLocalFlag" },
    { condicion: isAduana.value, flag: "mostrarAduanaFlag" },
    {
      condicion: isFlete.value && !isImport.value,
      flag: "mostrarFleteExportFlag",
    },
    { condicion: isAlmacen.value, flag: "mostrarAlmacenFlag" },
    { condicion: isGastosTercero.value, flag: "mostrarGastosTercerosFlag" },
  ];

  // Buscamos el primer paso que se cumpla
  const pasoSiguiente = pasos.find((p) => p.condicion);

  if (pasoSiguiente) {
    flagRefs[pasoSiguiente.flag]!.value = true;
    return true;
  }

  // Si no se cumplió ninguna condición anterior, se habilita el botón de guardar
  pricingStore.mostrarGuardarCostos = true;
}
function avanzarFlujoFormulario() {
  // Lista única con el orden estricto de prioridad de tus pantallas
  const pasos = [
    { condicion: isOrigen.value, flag: "mostrarOrigenFlag" },
    { condicion: isLocal.value, flag: "mostrarLocalFlag" },
    { condicion: isAduana.value, flag: "mostrarAduanaFlag" },
    {
      condicion: isFlete.value && !isImport.value,
      flag: "mostrarFleteExportFlag",
    },
    { condicion: isAlmacen.value, flag: "mostrarAlmacenFlag" },
    { condicion: isGastosTercero.value, flag: "mostrarGastosTercerosFlag" },
  ];

  // Buscamos el PRIMER paso que esté activo en la cotización y que todavía esté oculto
  const proximoPaso = pasos.find((p) => p.condicion && !flagRefs[p.flag]!.value);

  if (proximoPaso) {
    flagRefs[proximoPaso.flag]!.value = true;
    return true; // Se abrió una nueva sección con éxito
  }

  // Si ya se recorrieron o mostraron todas las secciones activas, liberamos el botón final
  pricingStore.mostrarGuardarCostos = true;
  return false;
}

// ========================================================
// 2. VALIDADOR ÚNICO: Reutiliza la lógica de filtrado y errores
// ========================================================
function procesarValidacionSeccion(
  flagFiltro: string,
  propiedadValor: string,
  flagBoton: string,
) {
  let tieneErrores = false;

  // Filtramos dinámicamente según la bandera de la fila (ej: 'esorigenflag')
  props.valores
    .filter((v) => v[flagFiltro] == 1 && v.status === true)
    .forEach((element) => {
      const tieneErrorCosto = validateCost({ costo: element });

      if (tieneErrorCosto) {
        element.error = "El costo que tiene un valor 0.00.";
        tieneErrores = true;
      } else {
        element.error = "";
      }
    });

  // Si no hay errores, cerramos el paso actual y disparamos el flujo al siguiente paso
  if (!tieneErrores) {
    valueRefs[propiedadValor]!.value = 1; // Ej: this.valueOrigen = 1
    btnRefs[flagBoton]!.value = false; // Ej: this.mostrarBtnOrigenFlag = false
    avanzarFlujoFormulario(); // Calcula automáticamente cuál sigue o si ya guarda
  }
}

// ========================================================
// 3. TUS MÉTODOS (Ahora solo invocan al validador único)
// ========================================================
function comprobarOrigen() {
  procesarValidacionSeccion(
    "esorigenflag",
    "valueOrigen",
    "mostrarBtnOrigenFlag",
  );
}

function comprobarLocal() {
  procesarValidacionSeccion(
    "eslocalflag",
    "valueLocal",
    "mostrarBtnLocalFlag",
  );
}

function comprobarAduana() {
  procesarValidacionSeccion(
    "esaduanaflag",
    "valueAduana",
    "mostrarBtnAduanaFlag",
  );
}

function comprobarFleteExport() {
  procesarValidacionSeccion(
    "esfleteflag",
    "valueFleteExport",
    "mostrarBtnFleteExportFlag",
  );
}

function comprobarAlmacen() {
  procesarValidacionSeccion(
    "esalmacenflag",
    "valueAlmacen",
    "mostrarBtnAlmacenFlag",
  );
}

function comprobarGastosTerceros() {
  procesarValidacionSeccion(
    "esgastostercerosflag",
    "valueGastosTerceros",
    "mostrarBtnGastosTercerosFlag",
  );
}

function validateCost({ costo }: { costo: Costo }) {
  const service = pricingStore.listServices.filter(
    (v) => v.status == 1,
  );
  const multiplocadores = pricingStore.listMultiplicador.filter(
    (v) => {
      return comienzaNoConCaracter(v.text as string, "%");
    },
  );
  const idMultiplicador = multiplocadores.map((v) => v.id);
  const idServices = service.map((v) => v.id_groupservices);
  if (
    !!idMultiplicador.includes(costo.id_multiplicador) &&
    !!idServices.includes(costo.id_groupservices) &&
    !!(costo.costounitario == 0)
  ) {
    return true;
  } else {
    return false;
  }
}
function eliminarCostos({ costo = null }: { costo?: Costo | null }) {
  costo!.status = 0;
  pricingStore.listCostos =
    pricingStore.listCostos.filter((v) => v.status == 1);
  setTimeout(() => {
    calcTotales();
  }, 10);
}

async function calcTotales() {
  setTimeout(async () => {
    // this.$store.state.pricing.totalFlete = 0.0;
    await calcularTotalesFlete();
    await calcularTotalesNoFlete();
    await calcTotal();
  }, 100);
}
function obtenerCostoElemento(element: Costo) {
  const { listMultiplicador, datosPrincipales, totalFlete } =
    pricingStore;
  const multiplicadores = listMultiplicador || [];

  // Buscamos el multiplicador una sola vez por elemento
  const multEncontrado = multiplicadores.find(
    (v) => v.id === element.id_multiplicador,
  );

  const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
  const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

  // CASO A: No es porcentaje (Cálculo basado en factor)
  if (isNotPorcentaje(element, element.id_multiplicador)) {
    let factorCalculado = calcularFac(
      codigoMultiplicador,
      datosPrincipales.volumen,
      datosPrincipales.peso,
      datosPrincipales.containers,
      datosPrincipales.amount,
    );
    if (
      element.code_cost == 4 &&
      (pricingStore.datosPrincipales.volumen as number) < 1
    ) {
      if ((factorCalculado as number) < 1) {
        factorCalculado = 1;
      }
    }

    let operacionFinal =
      (valorMultiplicador as number) *
      (element.costounitario as number) *
      (factorCalculado as number);
    if (element.considerarvalorminimoflag) {
      if (element.costounitario != 0) {
        operacionFinal =
          Number(element.minimo || 0) > Number(operacionFinal)
            ? Number(element.minimo)
            : operacionFinal;
      }
    }
    return operacionFinal;
  }

  // CASO B: Sí es porcentaje (Cálculo basado en CIF / Seguro)
  const codigosEspeciales = [13, 14, 15, 5];
  const parametroEspecial = codigosEspeciales.includes(codigoMultiplicador as number)
    ? element.cif
    : element.seguro;

  return calcularValor(
    datosPrincipales.amount,
    totalFlete,
    multEncontrado ? codigoMultiplicador : "",
    parametroEspecial,
    element.minimo as number,
  );
}

// ==========================================
// 2. MÉTODOS PRINCIPALES SIMPLIFICADOS
// ==========================================
function calcularTotalesFlete() {
  totalOption.value = 0;
  resumenOpcion.value = {
    flete: 0,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };

  if (!isFlete.value) return;

  props.valores
    .filter(
      (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
    )
    .forEach((element) => {
      resumenOpcion.value.flete += obtenerCostoElemento(element);
    });
}

function calcularTotalesNoFlete() {
  // Mantener el flete acumulado previamente
  resumenOpcion.value = {
    ...resumenOpcion.value,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };

  props.valores
    .filter((v) => v.status == 1)
    .forEach((element) => {
      // Usamos el helper para obtener el costo procesado una sola vez
      const costo = obtenerCostoElemento(element);

      if (element.esorigenflag == 1) {
        resumenOpcion.value.origen += Number(costo);
      }
      if (element.eslocalflag == 1) {
        resumenOpcion.value.gasto += Number(costo);
      }
      if (element.esaduanaflag == 1) {
        resumenOpcion.value.aduana += Number(costo);
      }
      if (element.esalmacenflag == 1) {
        resumenOpcion.value.almacen += Number(costo);
      }
      if (element.esgastostercerosflag == 1) {
        resumenOpcion.value.gastostercero += Number(costo);
      }
    });
}
function calcTotal() {
  totalOption.value = 0;
  totalOption.value =
    (Number(resumenOpcion.value.flete) || 0) +
    (Number(resumenOpcion.value.gasto) || 0) +
    (Number(resumenOpcion.value.aduana) || 0) +
    (Number(resumenOpcion.value.origen) || 0) +
    (Number(resumenOpcion.value.almacen) || 0) +
    (Number(resumenOpcion.value.gastostercero) || 0);

  pricingStore.totalCosto = totalOption.value;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cerrarModalNuevoCosto() {
  // this.$refs.frmNuevoCosto.reset();
  dialog.value = !dialog.value;
}
function guardarCosto() {
  switch (fromDataService.value.idOpcion) {
    case "GT":
      fromDataService.value.esgastostercerosflag = 1;
      break;
    case "FL":
      fromDataService.value.esfleteflag = 1;
      break;
    case "OR":
      fromDataService.value.esorigenflag = 1;
      break;
    case "LO":
      fromDataService.value.eslocalflag = 1;
      break;
    case "AD":
      fromDataService.value.esaduanaflag = 1;
      break;
    case "AL":
      fromDataService.value.esalmacenflag = 1;
      break;
  }

  pricingStore.opcionCostos
    .filter((v) => v.nro_propuesta == props.valores[0]!.nro_propuesta)[0]!
    .listCostos.push(fromDataService.value);

  dialog.value = !dialog.value;
  
  calcTotales();
}
function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]) {
  const code = [5, 13, 14, 15];

  const mul = pricingStore.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes(v.code as number),
  );

  return !mul;
}
function abrirModal() {
  dialog.value = !dialog.value;
  nextTick(() => {
    frmNuevoCosto.value!.resetValidation();
  });
  limpiar();
}

function montoConfeccion(item: Costo) {
  let monto = 0;
  if (item.code_cost == 33) {
    const amount = pricingStore.datosPrincipales.amount;
    const cif =
      parseFloat(String(amount)) +
      parseFloat(String(pricingStore.totalFlete)) +
      (parseFloat(String(amount)) +
        parseFloat(String(pricingStore.totalFlete))) *
        0.01;

    if (cif < 5000) {
      monto = 50;
    }
    if (cif >= 5000 && cif < 10000) {
      monto = 80;
    }
    if (cif >= 10000) {
      monto = 80 + parseFloat(String(cif * 0.0025));
    }
  }

  item.costounitario = parseFloat(String(monto)).toFixed(2);
  return currencyFormat(monto);
}

function montoITBM(item: Costo) {
  let montoTotal = 0;
  const codigosFiltrar = [29, 36, 41, 68];

  if (item.code_cost === 38) {
    const { listMultiplicador, datosPrincipales } =
      pricingStore;
    const valoresFiltrados = props.valores.filter((v) =>
      codigosFiltrar.includes(v.code_cost as number),
    );

    valoresFiltrados.forEach((element) => {
      const multiplicador = listMultiplicador.find(
        (v) => v.id == element.id_multiplicador,
      );
      const valorMultiplicador = multiplicador
        ? parseFloat(String(multiplicador.valor))
        : 0;
      const codigoMultiplicador = multiplicador ? multiplicador.code : "N";
      const factor = calcularFac(
        codigoMultiplicador,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      );
      const costoUnitario = parseFloat(String(element.costounitario || 0));
      montoTotal += valorMultiplicador * costoUnitario * (factor as number);
    });
  }
  const itbmCalculado = (montoTotal * 0.07).toFixed(2);
  item.costounitario = parseFloat(String(itbmCalculado));

  return currencyFormat(itbmCalculado);
}

function montoNotaCredito(item: Costo) {
  let monto = 0 as Numerico;
  const code = [33];
  if (item.code_cost == 69) {
    const val = props.valores.filter((v) => code.includes(v.code_cost as number));
    val.forEach((element) => {
      monto = element.costounitario;
    });
  }
  item.costounitario = -1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2));
  return currencyFormat(-1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2)));
}
function limpiar() {
  fromDataService.value = {
    ventaFlag: 0,
    esopcionflag: 1,
    id_begend: 0,
    costounitario: "",
    esorigenflag: 0,
    eslocalflag: 0,
    esaduanaflag: 0,
    esalmacenflag: 0,
    seguro: 0,
    cif: 0,
    esventaflag: 0,
    status: 1,
    id_groupservices: 0,
    id_multiplicador: 0,
    id_proveedor: 0,
  };
}

function mostrarAdvertencia(data: Costo[]) {
  return data.some(
    (v) => v.status == 1 && v.error != null && v.error !== "",
  );
}
function isConfeccion(code: Numerico) {
  return code == 33 ? true : false;
}
function isNotaCredito(code: Numerico) {
  return code == 69 ? true : false;
}
function formatearValorCalculado(valor: Costo) {
  const pricingState = pricingStore;
  const multiplicadores = pricingState.listMultiplicador || [];

  const multiplicadorEncontrado = multiplicadores.find(
    (v) => v.id === valor.id_multiplicador,
  );

  const codigoMultiplicador = multiplicadorEncontrado
    ? multiplicadorEncontrado.code
    : "";

  let tercerParametro: Numerico = 0;
  if (multiplicadorEncontrado) {
    const codigosEspeciales = [13, 14, 15, 5];
    tercerParametro = codigosEspeciales.includes(
      multiplicadorEncontrado.code as number,
    )
      ? valor.cif
      : valor.seguro;
  }

  const resultadoCalculado = calcularValor(
    pricingState.datosPrincipales.amount,
    pricingState.totalFlete,
    codigoMultiplicador,
    tercerParametro,
    valor.minimo as number,
  );

  return currencyFormat(resultadoCalculado);
}
function formatearCostoTotal(valor: Costo) {
  // 1. Desestructuración de los estados del Vuex para escribir menos y más limpio
  const { listMultiplicador, datosPrincipales } = pricingStore;
  const multiplicadores = listMultiplicador || [];

  // 2. Buscamos el multiplicador correspondiente UNA SOLA VEZ
  const multEncontrado = multiplicadores.find(
    (v) => v.id === valor.id_multiplicador,
  );

  // 3. Extraemos las variables con valores por defecto si no existe el multiplicador
  const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
  const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

  // 4. Ejecutamos la función calcularFac pasándole los datos de pricing
  let factorCalculado = calcularFac(
    codigoMultiplicador,
    datosPrincipales.volumen,
    datosPrincipales.peso,
    datosPrincipales.containers,
    datosPrincipales.amount,
  );
  if (
    valor.code_cost == 4 &&
    (pricingStore.datosPrincipales.volumen as number) < 1
  ) {
    if ((factorCalculado as number) < 1) {
      factorCalculado = 1;
    }
  }

  // 5. Realizamos la operación matemática final
  let operacionFinal =
    (valorMultiplicador as number) *
    (valor.costounitario as number) *
    (factorCalculado as number);
  if (valor.considerarvalorminimoflag) {
     if (valor.costounitario != 0) {
    operacionFinal =
      Number(valor.minimo || 0) > Number(operacionFinal)
        ? Number(valor.minimo)
        : operacionFinal;
     }
  }

  // 6. Retornamos el valor con su respectivo formato de moneda
  return currencyFormat(operacionFinal);
}
function textoFlete(data: Costo) {
  if (!!data && data.code_cost == 4) {
    if (data.tienefleteflag) {
      return `Tarifa del Tarifario. Vence: ${formatoFecha(
        data.fechavigencia,
      )}`;
    } else {
      return "No tiene tarifa vigente";
    }
  }

  return false;
}
function formatoFecha(fecha: string | null | undefined) {
  if (!fecha) return "";
  const soloFecha = fecha.split("T")[0]!;
  const partes = soloFecha.split("-");
  if (partes.length !== 3) return fecha;

  const year = partes[0];
  const month = parseInt(partes[1]!, 10) - 1;
  const day = partes[2]!.padStart(2, "0");
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return `${day}/${meses[month]}/${year}`;
}

watch(
  () => props.valores,
  () => {
    calcTotales();
  },
);
watch(
  () => props.actualizarCostosFlag,
  () => {
    calcTotales();
  },
);
watch(
  () => props.amount,
  () => {
    calcTotales();
  },
);
watch(cancelarLlenadoNuevaOpcion, () => {
  // this.habilidarPrimeraAccion();
  mostrarSiguienteFleteImport();
  mostrarSiguienteOrigen();
  mostrarSiguienteLocal();
  mostrarSiguienteAduana();
  mostrarSiguienteFleteExport();
  valueFleteImport.value = 1;
  valueOrigen.value = 1;
  valueLocal.value = 1;
  valueAduana.value = 1;
  valueAlmacen.value = 1;
  valueFleteExport.value = 1;
  mostrarBtnFleteImportFlag.value = false;
  mostrarBtnOrigenFlag.value = false;
  mostrarBtnLocalFlag.value = false;
  mostrarBtnAduanaFlag.value = false;
  mostrarBtnFleteExportFlag.value = false;
  mostrarBtnAlmacenFlag.value = false;
  pricingStore.mostrarGuardarCostos = true;
});
watch(totalFlete, () => {
  calcTotales();
});
watch(
  () => props.recargarSegmentos,
  () => {
    habilidarCuandoYaHayOpciones();
  },
);

onMounted(async () => {
  calcTotales();
  pricingStore.mostrarGuardarCostos = false;
  await habilidarPrimeraAccion();
  if (props.index) {
    habilidarCuandoYaHayOpciones();
  }
});
</script>

<template>
  <v-container fluid>
    <div class="">
      <v-row>
        <v-col
          cols="12"
          lg="4"
          xl="4"
          class="my-1 py-2"
        >
          <span class="text-headline-small">
            Costos {{ currencyFormat(pricingStore.totalCosto) }}
            <v-btn
              variant="text"
              icon
              color="primary"
              @click="abrirModal"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
    <!-- ss{{ this.valores }} -->
    <div
      id="FleteImport"
      v-if="mostrarFleteImport"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueFleteImport"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "FL",
                    )[0]!.name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <template
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esfleteflag == 1 && v.status == 1,
                      )"
                      :key="'main-' + i"
                    >
                      <tr>
                        <td class="btnAccion">
                          <v-btn
                            variant="text"
                            icon
                            color="red"
                            size="x-small"
                            @click="eliminarCostos({ costo: valor })"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </td>
                        <td class="colProveedorMultiplicador">
                          <v-autocomplete
                            density="compact"
                            item-title="namelong"
                            item-value="id"
                            :items="proveedorStore.lstProveedores"
                            v-model="valor.id_proveedor"
                            @update:search="recargarProveedores"
                            hide-details
                            menu-icon=""
                          >
                            <template #append-inner>
                              <v-icon
                                icon="mdi-plus"
                                @mousedown.stop
                                @click.stop="abrirModalRegistroProveedor(valor)"
                              />
                            </template>
                          </v-autocomplete>
                        </td>
                        <td class="colConcepto">
                          <v-text-field
                            density="compact"
                            hide-details
                            v-model="valor.nameservice"
                          />
                        </td>
                        <td class="colProveedorMultiplicador">
                          <CboMultiplicador
                            v-model="valor.id_multiplicador"
                            placeholder="Multiplicador"
                            @change="calcTotales"
                            :hide-details="true"
                            :dense="true"
                            class="widthTD"
                            :readonly="
                              isITBM(valor.code_cost) ||
                                isConfeccion(valor.code_cost) ||
                                isNotaCredito(valor.code_cost)
                            "
                          />
                          <!-- <v-select item-title="text"
                            class="widthTD"
                            :items="$store.state.pricing.listMultiplicador"
                            v-model="valor.id_multiplicador"
                            placeholder="Multiplicador" @change="calcTotales"
                            hide-details
                            dense
                            @change="calcTotales"
                            :readonly="
                              isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                            "
                          ></v-select> -->
                        </td>

                        <td class="colCostos">
                          <v-text-field
                            class="derecha tdMontos"
                            v-if="
                              isNotPorcentaje(valor, valor.id_multiplicador) &&
                                !isConfeccion(valor.code_cost) &&
                                !isITBM(valor.code_cost) &&
                                !isNotaCredito(valor.code_cost)
                            "
                            density="compact"
                            v-model="valor.costounitario"
                            :error-messages="valor.error"
                            :rules="[
                              (v) => {
                                if (v > 0) {
                                  valor.error = ''; // Borra el mensaje de error si el valor es válido
                                  return true; // La regla se cumple
                                }
                                valor.error =
                                  'El costo que tiene un valor 0.00.';
                                return false; // La regla no se cumple
                              },
                            ]"
                            prefix="$"
                            type="number"
                            step="0.01"
                            :min="valor.minimo"
                            @blur="calcTotales"
                          />
                          <v-text-field
                            class="derecha tdMontos"
                            v-if="
                              pricingStore.listMultiplicador.some(
                                (v) =>
                                  v.id == valor.id_multiplicador &&
                                  (v.code == 13 ||
                                    v.code == 14 ||
                                    v.code == 15),
                              ) &&
                                !isITBM(valor.code_cost) &&
                                !isConfeccion(valor.code_cost) &&
                                !isNotaCredito(valor.code_cost)
                            "
                            hide-details
                            suffix="%"
                            density="compact"
                            max="100"
                            v-model="valor.cif"
                            type="number"
                            :min="valor.minimo"
                            step="0.01"
                            @blur="calcTotales"
                          />
                          <v-text-field
                            suffix="%"
                            class="derecha tdMontos"
                            v-if="
                              pricingStore.listMultiplicador.some(
                                (v) =>
                                  v.id == valor.id_multiplicador && v.code == 5,
                              ) &&
                                !isITBM(valor.code_cost) &&
                                !isConfeccion(valor.code_cost) &&
                                !isNotaCredito(valor.code_cost)
                            "
                            hide-details
                            density="compact"
                            max="100"
                            v-model="valor.seguro"
                            type="number"
                            :min="valor.minimo"
                            step="0.01"
                            @blur="calcTotales"
                          />

                          <v-text-field
                            v-if="isITBM(valor.code_cost)"
                            readonly
                            density="compact"
                            v-model="valor.costounitario"
                            :error-messages="valor.error"
                            prefix="$"
                          />

                          <v-text-field
                            v-if="isConfeccion(valor.code_cost)"
                            readonly
                            density="compact"
                            v-model="valor.costounitario"
                            :error-messages="valor.error"
                            prefix="$"
                          />
                          <v-text-field
                            v-if="isNotaCredito(valor.code_cost)"
                            readonly
                            density="compact"
                            v-model="valor.costounitario"
                            prefix="$"
                          />
                        </td>

                        <td
                          class="colCostos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isConfeccion(valor.code_cost) &&
                              !isITBM(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                        >
                          {{ formatearCostoTotal(valor) }}
                        </td>

                        <td
                          class="colCostos"
                          v-if="
                            !isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                        >
                          {{ formatearValorCalculado(valor) }}
                        </td>
                        <td
                          class="colCostos"
                          v-if="isConfeccion(valor.code_cost)"
                        >
                          {{ montoConfeccion(valor) }}
                        </td>
                        <td
                          class="colCostos"
                          v-if="isITBM(valor.code_cost)"
                        >
                          {{ montoITBM(valor) }}
                        </td>

                        <td
                          class="colCostos"
                          v-if="isNotaCredito(valor.code_cost)"
                        >
                          {{ montoNotaCredito(valor) }}
                        </td>
                      </tr>
                      <tr
                        :key="'flete-' + i"
                        v-if="textoFlete(valor)"
                      >
                        <td
                          colspan="5"
                          class="text-body-small text-left pt-0 pl-2"
                          style="color: #d50000"
                        >
                          {{ textoFlete(valor) }}
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnFleteImportFlag"
        >
          <v-btn
            color="success"
            @click="comprobarFleteImport()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      id="Origen"
      v-if="mostrarOrigen"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueOrigen"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "OR",
                    )[0]!.name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.origen) }}</span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esorigenflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esorigenflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          menu-icon=""
                          hide-details
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isConfeccion(valor.code_cost) &&
                              !isITBM(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnOrigenFlag"
        >
          <v-btn
            color="success"
            @click="comprobarOrigen()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div
      id="Local"
      v-if="mostrarLocal"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueLocal"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "LO",
                    )[0]!.name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.gasto) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.eslocalflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.eslocalflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isConfeccion(valor.code_cost) &&
                              !isITBM(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnLocalFlag"
        >
          <v-btn
            color="success"
            @click="comprobarLocal()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      id="Aduana"
      v-if="mostrarAduana"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueAduana"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "AD",
                    )[0]!.name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.aduana) }}</span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esaduanaflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esaduanaflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnAduanaFlag"
        >
          <v-btn
            color="success"
            @click="comprobarAduana()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      id="FleteExport"
      v-if="mostrarFleteExport"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueFleteExport"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "FL",
                    )[0]!.name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esfleteflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isConfeccion(valor.code_cost) &&
                              !isITBM(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnFleteExportFlag"
        >
          <v-btn
            color="success"
            @click="comprobarFleteExport()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      id="Almacen"
      v-if="mostrarAlmacen"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueAlmacen"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "AL",
                    )[0]!.name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.almacen) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esalmacenflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style="" />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esalmacenflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            (pricingStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador,
                            )[0]!.code == 14 ||
                              pricingStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador,
                              )[0]!.code == 5) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnAlmacenFlag"
        >
          <v-btn
            color="success"
            @click="comprobarAlmacen()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      id="gastosTerceros"
      v-if="mostrarGastosTerceros"
      class="my-0 py-0"
    >
      <v-row>
        <v-col
          cols="12"
          class="my-1 py-1"
        >
          <v-expansion-panels
            class="condensed"
            v-model="valueGastosTerceros"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  pricingStore.listTipoCostos.length > 0
                    ? pricingStore.listTipoCostos.filter(
                      (v) => v.codigo == "GT",
                    )[0]!.name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.gastostercero) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esgastostercerosflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style="" />
                      <th style="">
                        Proveedor
                      </th>
                      <th style="">
                        Conceptos
                      </th>
                      <th style="">
                        Multipicador
                      </th>
                      <th
                        class="derecha"
                        style=""
                      >
                        Costo Unitario
                      </th>
                      <th style="">
                        Sub Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esgastostercerosflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="proveedorStore.lstProveedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        />
                      </td>
                      <td class="colProveedorMultiplicador">
                        <CboMultiplicador
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          @change="calcTotales"
                          :hide-details="true"
                          :dense="true"
                          class="widthTD"
                          :readonly="
                            isITBM(valor.code_cost) ||
                              isConfeccion(valor.code_cost) ||
                              isNotaCredito(valor.code_cost)
                          "
                        />
                        <!-- <v-select item-title="text"
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador" @change="calcTotales"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select> -->
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            pricingStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          suffix="%"
                          density="compact"
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />
                        <v-text-field
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            (pricingStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador,
                            )[0]!.code == 14 ||
                              pricingStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador,
                              )[0]!.code == 5) &&
                              !isITBM(valor.code_cost) &&
                              !isConfeccion(valor.code_cost) &&
                              !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          density="compact"
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          @blur="calcTotales"
                        />

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        />
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        />
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isITBM(valor.code_cost)"
                      >
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col
          class="derecha"
          v-if="mostrarBtnGastosTercerosFlag"
        >
          <v-btn
            color="success"
            @click="comprobarGastosTerceros()"
          >
            Ver siguientes costos
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
    >
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title>
            Nuevo Costo
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-autocomplete
                  density="compact"
                  autocomplete="none"
                  :items="tipoOpcion"
                  label="Tipo"
                  item-value="codigo"
                  item-title="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-autocomplete
                  density="compact"
                  label="Proveedor"
                  item-title="namelong"
                  item-value="id"
                  :items="proveedorStore.lstProveedores"
                  v-model="fromDataService.id_proveedor"
                  @update:search="recargarProveedores"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <CboMultiplicador
                  v-model="fromDataService.id_multiplicador"
                  placeholder="Multiplicador"
                  label="Multiplicador"
                  :hide-details="true"
                  :dense="true"
                  class="widthTD"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
                <!-- <v-autocomplete item-title="text"
                  dense
                  label="Multiplicador"
                  :items="$store.state.pricing.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete> -->
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-text-field
                  density="compact"
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-text-field
                  density="compact"
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costounitario"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-alert
                  variant="outlined"
                  type="warning"
                  prominent
                  border="start"
                  class="px-5 mx-5"
                  density="compact"
                >
                  El concepto se verá reflejado al abrir la sección
                  correspondiente.
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn
              color="success"
              @click="guardarCosto()"
            >
              Aceptar
            </v-btn>
            <v-btn
              color="red"
              @click="dialog = !dialog"
            >
              cancelar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <v-dialog
      v-model="dialogNuevoProveedor"
      persistent
      max-width="80%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Ficha de Proveedores <v-spacer />
          <v-btn
            variant="text"
            icon
            color="red"
            @click="dialogNuevoProveedor = !dialogNuevoProveedor"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <NuevoProveedorComponentVue
            :is-pricing="true"
            v-show="dialogNuevoProveedor"
            @guardar-proveedor-existe="guardarProveedorE"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            v-if="mostrarBtnRegistroProveedor()"
            @click="nuevoProveedor()"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-title
  .v-expansion-panel-text__wrapper {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  /* padding: 2px 8px 2px; */
  min-height: auto;
}
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 20% !important;
  max-width: 20% !important;
}
.colConcepto {
  width: 35% !important;
  max-width: 35% !important;
  min-width: 35% !important;
}
.colCostos {
  width: 10% !important;
  max-width: 10% !important;
}

/* .tdMontos {
  width:  !important; 
} */

td {
  padding: 0 3px !important;
}
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-field__input {
  max-width: 5px !important;
}

table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(6) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  /* padding: 0 8px 16px !important; */
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 0px !important;
}
</style>
