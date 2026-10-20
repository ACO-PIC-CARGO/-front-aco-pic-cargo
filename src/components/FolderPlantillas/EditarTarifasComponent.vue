<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type { Modalidad } from "@/types/catalogos";
import type { CostoBase, TarifaCosto } from "@/types/configuracion";
import type { CotizacionDetalle, OpcionCosto, TipoCarga } from "@/types/cotizacion";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();

const cotizacionId = ref<string | null>(null);
const cotizacionData = ref<{ quote?: string; nombre?: string; modalidad?: string; shipment?: string }>({});
const modoEditor = ref("cotizacion");
const plantillaConfig = ref<{ modalidad: number | null; tipoEnvio: number | string | null; nombre: string }>({
  modalidad: null,
  tipoEnvio: null,
  nombre: ''
});
const loadingCargar = ref(false);
// Expansion panel states
const valueFlete = ref(0);
const valueOrigen = ref(0);
const valueDestino = ref(0);
const valueLocal = ref(0);
const valueAduana = ref(0);
const valueAlmacen = ref(0);
const tarifasCotizacion = ref<TarifaCosto[]>([]);
const tarifasFlete = ref<TarifaCosto[]>([]);
const tarifasOrigen = ref<TarifaCosto[]>([]);
const tarifasDestino = ref<TarifaCosto[]>([]);
const tarifasLocal = ref<TarifaCosto[]>([]);
const tarifasAduana = ref<TarifaCosto[]>([]);
const tarifasAlmacen = ref<TarifaCosto[]>([]);
const tarifasGastosTerceros = ref<TarifaCosto[]>([]);
const modalidadesDisponibles = ref<Array<Pick<Modalidad, "id" | "name">>>([]);
const tiposEnvioDisponibles = ref<Array<Pick<TipoCarga, "id" | "code">>>([]);
const lstTramo = [
  { id: "ORIGEN", text: "ORIGEN" },
  { id: "FLETE", text: "FLETE" },
  { id: "DESTINO", text: "DESTINO" },
  { id: "OPCIONAL", text: "OPCIONAL" },
];
const dialog = ref(false);
const frmNuevoCosto = ref({
  exwflag: false,
  fcaflag: false,
  fobflag: false,
  cfrflag: false,
  cifflag: false,
  ddpflag: false,
  tramo: "",
  servicio: "",
  concepto: "",
  id_multiplicador: "",
  monto: 0,
  id_proveedor: "",
  id_tipocosto: "",
});
const loadingTable = ref(false);
const loadingGuardar = ref(false);

const modoPlantilla = computed(() => {
  return modoEditor.value === 'plantilla';
});
const mostrarFlete = computed(() => {
  return tarifasFlete.value.length > 0;
});
const mostrarOrigen = computed(() => {
  return tarifasOrigen.value.length > 0;
});
const mostrarDestino = computed(() => {
  return tarifasDestino.value.length > 0;
});
const mostrarLocal = computed(() => {
  return tarifasLocal.value.length > 0;
});
const mostrarAduana = computed(() => {
  return tarifasAduana.value.length > 0;
});
const mostrarAlmacen = computed(() => {
  return tarifasAlmacen.value.length > 0;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarGastosTerceros = computed(() => {
  return tarifasGastosTerceros.value.length > 0;
});
const totalFlete = computed(() => {
  const total = tarifasFlete.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
const totalOrigen = computed(() => {
  const total = tarifasOrigen.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
const totalDestino = computed(() => {
  const total = tarifasDestino.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
const totalLocal = computed(() => {
  const total = tarifasLocal.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
const totalAduana = computed(() => {
  const total = tarifasAduana.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
const totalAlmacen = computed(() => {
  const total = tarifasAlmacen.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const totalGastosTerceros = computed(() => {
  const total = tarifasGastosTerceros.value.reduce((sum, item) => sum + (parseFloat(item.monto as string) || 0), 0);
  return formatCurrency(total);
});

onMounted(async () => {
  cotizacionId.value = (route.query.cotizacion as string | null) || null;

  // Si venimos desde la pantalla de plantillas, tomar modalidad y shipment del router
  if (route.query.modalidad) {
    plantillaConfig.value.modalidad = parseInt(route.query.modalidad as string);
  }
  if (route.query.shipment) {
    plantillaConfig.value.tipoEnvio = route.query.shipment as string;
  }

  // Siempre cargar costos base (plantillas)
  await cargarCostosBase();
});
watch(modoEditor, (newMode) => {
  if (newMode === 'plantilla') {
    limpiarTarifas();
    cargarDatosParaPlantilla();
  } else if (newMode === 'cotizacion' && cotizacionId.value) {
    cargarTarifasCotizacion();
  }
});

function volverALista() {
  router.push({ name: 'ServiciosTarifasPlantillas' });
}
async function cargarCostosBase() {
  loadingTable.value = true;
  try {
    const idModality = plantillaConfig.value.modalidad;
    const shipment = plantillaConfig.value.tipoEnvio;

    // El backend espera siempre ambos parámetros: ?id_modality=1&shipment=FCL
    if (!idModality || !shipment) {
      console.warn('No se pudo cargar costos base: falta modalidad o shipment en plantillaConfig');
      return;
    }

    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtener_costos_base?id_modality=${idModality}&shipment=${shipment}`,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        "Content-Type": "application/json",
      },
    };

    const response = await axios<ApiResponse<TarifaCosto[]>>(config);

    if (response.data.estadoflag && response.data.data) {
      const costosBase = response.data.data;
      organizarCostosPorTramo(costosBase);

      console.log('Costos base cargados:', {
        total: costosBase.length,
        flete: tarifasFlete.value.length,
        origen: tarifasOrigen.value.length,
        destino: tarifasDestino.value.length
      });
    }

  } catch (error) {
    console.error('Error cargando costos base:', error);
    Swal.fire({
      icon: 'error',
      text: 'Error al cargar los costos base.',
      confirmButtonText: 'Ok'
    });
  } finally {
    loadingTable.value = false;
  }
}
function organizarCostosPorTramo(costos: TarifaCosto[]) {
  tarifasFlete.value = [];
  tarifasOrigen.value = [];
  tarifasDestino.value = [];

  costos.forEach(costo => {
    switch (costo.tramo) {
      case 'FLETE':
        tarifasFlete.value.push(costo);
        break;
      case 'ORIGEN':
        tarifasOrigen.value.push(costo);
        break;
      case 'DESTINO':
        tarifasDestino.value.push(costo);
        break;
    }
  });
}
async function cargarTarifasCotizacion() {
  if (!cotizacionId.value) return;

  loadingTable.value = true;
  try {
    // Llamar directamente al endpoint getQuoteId
    await pricingStore.getQuote({ id: cotizacionId.value });

    // Obtener datos básicos de la cotización
    const quoteData: Partial<CotizacionDetalle> = pricingStore.copy_quote || {};
    cotizacionData.value = {
      quote: quoteData.quote || 'N/A',
      nombre: quoteData.nombre || 'N/A',
      modalidad: 'N/A',
      shipment: 'N/A'
    };

    // Extraer tarifas básicas (solo costos, no ventas) y organizarlas por categorías
    const opcionCostos = pricingStore.opcionCostos || [];
    tarifasCotizacion.value = [];
    tarifasFlete.value = [];
    tarifasOrigen.value = [];
    tarifasDestino.value = [];
    tarifasLocal.value = [];
    tarifasAduana.value = [];
    tarifasAlmacen.value = [];
    tarifasGastosTerceros.value = [];

    opcionCostos.forEach((opcion: OpcionCosto) => {
      if (opcion.listCostos && Array.isArray(opcion.listCostos)) {
        const costos = opcion.listCostos.filter(costo => costo.esopcionflag == 1);
        tarifasCotizacion.value.push(...costos);

        // Organizar por categorías como en CostosComponent
        costos.forEach(costo => {
          if (costo.status == 1) {
            if (costo.esfleteflag == 1) {
              tarifasFlete.value.push(costo);
            } else if (costo.esorigenflag == 1) {
              tarifasOrigen.value.push(costo);
            } else if (costo.esdestinoflag == 1) {
              tarifasDestino.value.push(costo);
            } else if (costo.eslocalflag == 1) {
              tarifasLocal.value.push(costo);
            } else if (costo.esaduanaflag == 1) {
              tarifasAduana.value.push(costo);
            } else if (costo.esalmacenflag == 1) {
              tarifasAlmacen.value.push(costo);
            } else if (costo.esgastostercerosflag == 1) {
              tarifasGastosTerceros.value.push(costo);
            }
          }
        });
      }
    });

    console.log('Tarifas cargadas:', {
      total: tarifasCotizacion.value.length,
      flete: tarifasFlete.value.length,
      origen: tarifasOrigen.value.length,
      destino: tarifasDestino.value.length,
      local: tarifasLocal.value.length,
      aduana: tarifasAduana.value.length,
      almacen: tarifasAlmacen.value.length,
      gastosTerceros: tarifasGastosTerceros.value.length
    });

  } catch (error) {
    console.error('Error cargando tarifas de cotización:', error);
    Swal.fire({
      icon: 'error',
      text: 'Error al cargar las tarifas de la cotización.',
      confirmButtonText: 'Ok'
    });
  } finally {
    loadingTable.value = false;
  }
}
function abrirNuevoCosto() {
  Swal.fire({
    icon: 'info',
    text: 'Funcionalidad en desarrollo.',
    confirmButtonText: 'Ok'
  });
}
function marcarComoModificado(item: TarifaCosto) {
  console.log('Item modificado:', item);
  // Aquí se puede implementar el tracking de cambios
}
function eliminarTarifa(tarifa: TarifaCosto) {
  console.log('Eliminar tarifa:', tarifa);
  Swal.fire({
    icon: 'info',
    text: 'Funcionalidad de eliminación en desarrollo.',
    confirmButtonText: 'Ok'
  });
}
function formatCurrency(value: number | string | null | undefined) {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value as number);
}
async function guardarTarifas() {
  Swal.fire({
    icon: 'info',
    text: 'Funcionalidad de guardado en desarrollo.',
    confirmButtonText: 'Ok'
  });
}
async function guardarPlantilla() {
  if (!plantillaConfig.value.modalidad || !plantillaConfig.value.tipoEnvio) {
    Swal.fire({
      icon: 'warning',
      text: 'Por favor seleccione modalidad y tipo de envío.',
      confirmButtonText: 'Ok'
    });
    return;
  }

  loadingGuardar.value = true;
  try {
    // Preparar datos según estructura del endpoint editar_costos_base
    const lstCostos: CostoBase[] = [];

    // Agregar todos los costos de todas las categorías
    [...tarifasFlete.value, ...tarifasOrigen.value, ...tarifasDestino.value].forEach(costo => {
      lstCostos.push({
        code: costo.code || 0,
        tramo: costo.tramo,
        seccion: costo.seccion,
        servicio: costo.servicio,
        concepto: costo.concepto,
        multiplicador: costo.multiplicador,
        monto: parseFloat(costo.monto as string) || 0,
        proveedor: costo.proveedor,
        exwflag: costo.exwflag || false,
        fcaflag: costo.fcaflag || false,
        fobflag: costo.fobflag || false,
        cfrflag: costo.cfrflag || false,
        cifflag: costo.cifflag || false,
        ddpflag: costo.ddpflag || false
      });
    });

    const payload = {
      id_modality: plantillaConfig.value.modalidad,
      shipment: plantillaConfig.value.tipoEnvio,
      lstCostos: lstCostos
    };

    console.log('Enviando datos:', payload);

    const config = {
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}editar_costos_base`,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        "Content-Type": "application/json",
      },
      data: payload
    };

    const response = await axios<ApiResponse>(config);

    if (response.data.estadoflag) {
      Swal.fire({
        icon: 'success',
        text: 'Costos base guardados correctamente.',
        confirmButtonText: 'Ok'
      });

      // Recargar datos
      await cargarCostosBase();
    } else {
      throw new Error(response.data.mensaje || 'Error al guardar');
    }

  } catch (error) {
    console.error('Error guardando costos base:', error);
    Swal.fire({
      icon: 'error',
      text: 'Error al guardar los costos base.',
      confirmButtonText: 'Ok'
    });
  } finally {
    loadingGuardar.value = false;
  }
}
async function cargarPlantillaExistente() {
  loadingCargar.value = true;
  try {
    // Aquí iría la lógica para cargar plantillas existentes
    const plantillas = [
      { id: 1, nombre: 'FCL Importación Estándar', modalidad: 'Importación', tipoEnvio: 'FCL' },
      { id: 2, nombre: 'LCL Exportación Básica', modalidad: 'Exportación', tipoEnvio: 'LCL' },
      { id: 3, nombre: 'Aéreo Express', modalidad: 'Importación', tipoEnvio: 'AEREO' }
    ];

    const { value: plantillaSeleccionada } = await Swal.fire({
      title: 'Seleccionar Plantilla',
      input: 'select',
      inputOptions: plantillas.reduce((options, plantilla) => {
        options[plantilla.id] = `${plantilla.nombre} (${plantilla.modalidad} - ${plantilla.tipoEnvio})`;
        return options;
      }, {} as Record<number, string>),
      inputPlaceholder: 'Seleccione una plantilla',
      showCancelButton: true,
      confirmButtonText: 'Cargar',
      cancelButtonText: 'Cancelar'
    });

    if (plantillaSeleccionada) {
      const plantilla = plantillas.find(p => p.id == plantillaSeleccionada)!;
      console.log('Cargando plantilla:', plantilla);

      // Aquí cargarías los datos de la plantilla seleccionada
      Swal.fire({
        icon: 'success',
        text: `Plantilla "${plantilla.nombre}" cargada correctamente.`,
        confirmButtonText: 'Ok'
      });
    }

  } catch (error) {
    console.error('Error cargando plantilla:', error);
    Swal.fire({
      icon: 'error',
      text: 'Error al cargar la plantilla.',
      confirmButtonText: 'Ok'
    });
  } finally {
    loadingCargar.value = false;
  }
}
async function cargarDatosParaPlantilla() {
  // Cargar modalidades y tipos de envío disponibles
  try {
    // Estos datos deberían venir del store o endpoints
    modalidadesDisponibles.value = pricingStore.listModality || [];
    tiposEnvioDisponibles.value = pricingStore.listShipment || [];
  } catch (error) {
    console.error('Error cargando datos para plantilla:', error);
  }
}
function limpiarTarifas() {
  tarifasCotizacion.value = [];
  tarifasFlete.value = [];
  tarifasOrigen.value = [];
  tarifasDestino.value = [];
  tarifasLocal.value = [];
  tarifasAduana.value = [];
  tarifasAlmacen.value = [];
  tarifasGastosTerceros.value = [];
}
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        <v-btn
          variant="text"
          icon
          @click="volverALista"
          class="mr-3"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ modoPlantilla ? 'Editor de Plantillas de Tarifas' : `Editar Tarifas - ${cotizacionData.quote}` }}
        <v-spacer />
        <v-btn-toggle
          v-model="modoEditor"
          class="mr-3"
        >
          <v-btn
            size="small"
            value="cotizacion"
            :disabled="!cotizacionId"
          >
            <v-icon start>
              mdi-file-document
            </v-icon>
            Cotización
          </v-btn>
          <v-btn
            size="small"
            value="plantilla"
          >
            <v-icon start>
              mdi-content-save-settings
            </v-icon>
            Plantilla
          </v-btn>
        </v-btn-toggle> 
      </v-card-title>
      <v-card-text>
        <!-- Información de la Cotización o Plantilla -->
        <v-row>
          <v-col cols="12">
            <v-alert
              :type="modoPlantilla ? 'success' : 'info'"
              density="compact"
              class="mb-4"
            >
              <div v-if="modoPlantilla">
                <strong>Modo Plantilla:</strong> Editando tarifas por defecto para reutilizar en nuevas cotizaciones
                <v-row class="mt-2">
                  <v-col cols="4">
                    <v-select
                      :items="modalidadesDisponibles"
                      v-model="plantillaConfig.modalidad"
                      label="Modalidad"
                      item-title="name"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="4">
                    <v-select
                      :items="tiposEnvioDisponibles"
                      v-model="plantillaConfig.tipoEnvio"
                      label="Tipo de Envío"
                      item-title="code"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model="plantillaConfig.nombre"
                      label="Nombre de Plantilla"
                      density="compact"
                      variant="outlined"
                      hide-details
                      placeholder="Ej: Plantilla FCL Importación"
                    />
                  </v-col>
                </v-row>
              </div>
              <div v-else>
                <strong>Cotización:</strong> {{ cotizacionData.quote }} | 
                <strong>Cliente:</strong> {{ cotizacionData.nombre }} | 
                <strong>Modalidad:</strong> {{ cotizacionData.modalidad }} | 
                <strong>Tipo:</strong> {{ cotizacionData.shipment }}
              </div>
            </v-alert>
          </v-col>
        </v-row>
        
        <!-- Tarifas organizadas por categorías como en CostosComponent -->
        <div class="">
          <v-row>
            <v-col
              cols="12"
              lg="4"
              xl="4"
              class="my-1 py-2"
            >
              <span class="text-headline-small">
                Costos de la Cotización
                <v-btn
                  variant="text"
                  icon
                  color="primary"
                  @click="abrirNuevoCosto"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </v-col>
          </v-row>
        </div>
        
        <!-- Flete -->
        <div
          v-if="mostrarFlete"
          class="my-0 py-0"
        >
          <v-row>
            <v-col
              cols="12"
              class="my-1 py-1"
            >
              <v-expansion-panels
                class="condensed"
                v-model="valueFlete"
              >
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    FLETE: <span>{{ totalFlete }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Sección</th>
                          <th>Servicio</th>
                          <th>Concepto</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasFlete"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colSeccion">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.seccion"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colServicio">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.servicio"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Origen -->
        <div
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
                    ORIGEN: <span>{{ totalOrigen }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasOrigen"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.proveedor"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Destino -->
        <div
          v-if="mostrarDestino"
          class="my-0 py-0"
        >
          <v-row>
            <v-col
              cols="12"
              class="my-1 py-1"
            >
              <v-expansion-panels
                class="condensed"
                v-model="valueDestino"
              >
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    DESTINO: <span>{{ totalDestino }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasDestino"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.proveedor"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Local -->
        <div
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
                    LOCAL: <span>{{ totalLocal }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasLocal"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.proveedor"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Aduana -->
        <div
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
                    ADUANA: <span>{{ totalAduana }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasAduana"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.proveedor"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Almacén -->
        <div
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
                    ALMACÉN: <span>{{ totalAlmacen }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th />
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">
                            Costo Unitario
                          </th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(valor, i) in tarifasAlmacen"
                          :key="i"
                        >
                          <td class="btnAccion">
                            <v-btn
                              variant="text"
                              icon
                              color="red"
                              size="x-small"
                              @click="eliminarTarifa(valor)"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.proveedor"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.concepto"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              density="compact"
                              hide-details
                              v-model="valor.multiplicador"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              density="compact"
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @update:model-value="marcarComoModificado(valor)"
                            />
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="modoPlantilla"
          color="success"
          @click="cargarPlantillaExistente"
          :loading="loadingCargar"
          class="mr-2"
        >
          <v-icon start>
            mdi-download
          </v-icon>
          Cargar Plantilla
        </v-btn>
        <v-btn
          :color="modoPlantilla ? 'success' : 'primary'"
          @click="modoPlantilla ? guardarPlantilla() : guardarTarifas()"
          :loading="loadingGuardar"
          :disabled="!modoPlantilla && !cotizacionId"
        >
          <v-icon start>
            {{ modoPlantilla ? 'mdi-content-save-settings' : 'mdi-content-save' }}
          </v-icon>
          {{ modoPlantilla ? 'Guardar como Plantilla' : 'Guardar Tarifas' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="dialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Nuevo servicio
          <v-spacer />
          <v-icon @click="dialog = false">
            mdi-close
          </v-icon>
        </v-card-title>
        <v-form ref="frmNuevosCostos">
          <v-card-text>
            <v-select
              item-title="text"
              :items="lstTramo"
              v-model="frmNuevoCosto.tramo"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Tramo*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Servicio*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.servicio"
            />

            <v-autocomplete
              :items="configEmpresaStore.listTipoCostos"
              v-model="frmNuevoCosto.id_tipocosto"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="name"
              label="Sección*"
              item-title="name"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Concepto*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.concepto"
            />

            <v-autocomplete
              item-title="text"
              :items="configEmpresaStore.lstMultiplicador"
              v-model="frmNuevoCosto.id_multiplicador"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="id"
              label="Multiplicador*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />

            <v-text-field
              label="Monto"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.monto"
            />

            <v-autocomplete
              :items="appStore.itemsProveedorList"
              v-model="frmNuevoCosto.id_proveedor"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Proveedor*"
              item-title="namelong"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              item-value="id"
            />

            <p>Incoterms</p>
            <v-row>
              <v-checkbox
                class="mx-5"
                label="EXW"
                v-model="frmNuevoCosto.exwflag"
              />
              <v-checkbox
                class="mx-5"
                label="FCA"
                v-model="frmNuevoCosto.fcaflag"
              />
              <v-checkbox
                class="mx-5"
                label="FOB"
                v-model="frmNuevoCosto.fobflag"
              />
              <v-checkbox
                class="mx-5"
                label="CFR"
                v-model="frmNuevoCosto.cfrflag"
              />
              <v-checkbox
                class="mx-5"
                label="CIF"
                v-model="frmNuevoCosto.cifflag"
              />
              <v-checkbox
                class="mx-5"
                label="DDP"
                v-model="frmNuevoCosto.ddpflag"
              />
            </v-row>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            color="red"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
          <!-- @vue-expect-error Kept: agregarNuevoCosto is not defined, so Agregar never does anything. -->
          <v-btn
            color="green"
            @click="agregarNuevoCosto"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
</style>
