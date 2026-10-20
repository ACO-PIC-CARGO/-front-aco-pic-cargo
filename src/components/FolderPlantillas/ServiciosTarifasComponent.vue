<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type { Modalidad } from "@/types/catalogos";
import type { CostoBase } from "@/types/configuracion";
import type { TipoCarga } from "@/types/cotizacion";

withDefaults(defineProps<{ initialShipmentCode?: string | null }>(), { initialShipmentCode: null });

const router = useRouter();
const pricingStore = usePricingStore();

const search = ref("");
const modalidadSeleccionada = ref<number | null>(null);
const shipmentSeleccionado = ref<string | null>(null);
const costosBase = ref<CostoBase[]>([]);
const loading = ref(false);
const modalidadesDisponibles = ref<Array<Pick<Modalidad, "id" | "name">>>([]);
const tiposEnvioDisponibles = ref<Array<Pick<TipoCarga, "id" | "embarque" | "code">>>([]);

onMounted(async () => {
  await cargarDatosIniciales();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fecha(fecha: string | null | undefined) {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-ES');
}
async function cargarDatosIniciales() {
  loading.value = true;
  try {
    // Cargar modalidades y tipos de envío usando las acciones estándar del proyecto
    await pricingStore.getModality();
    await pricingStore.getShipment();

    // Tomar los datos directamente del store
    modalidadesDisponibles.value = pricingStore.listModality || [];
    tiposEnvioDisponibles.value = pricingStore.listShipment || [];

    console.log('Datos iniciales cargados:', {
      modalidades: modalidadesDisponibles.value.length,
      tiposEnvio: tiposEnvioDisponibles.value.length
    });
    console.log('Modalidades:', modalidadesDisponibles.value);
    console.log('Tipos de envío:', tiposEnvioDisponibles.value);

    // Si por alguna razón vienen vacíos, usar un pequeño fallback para no dejar los combos en blanco
    if (!modalidadesDisponibles.value.length) {
      modalidadesDisponibles.value = [
        { id: 1, name: 'Importación' },
        { id: 2, name: 'Exportación' }
      ];
    }
    if (!tiposEnvioDisponibles.value.length) {
      tiposEnvioDisponibles.value = [
        { id: 1, embarque: 'FCL', code: 'FCL' },
        { id: 2, embarque: 'LCL', code: 'LCL' },
        { id: 3, embarque: 'Aéreo', code: 'Aéreo' },
        { id: 4, embarque: 'LTL TERRESTRE INTERNACIONAL', code: 'LTL TERRESTRE INTERNACIONAL' }
      ];
    }

  } catch (error) {
    console.error('Error cargando datos iniciales:', error);

    // Fallback con datos estáticos para evitar combos vacíos
    modalidadesDisponibles.value = [
      { id: 1, name: 'Importación' },
      { id: 2, name: 'Exportación' }
    ];
    tiposEnvioDisponibles.value = [
      { id: 1, embarque: 'FCL', code: 'FCL' },
      { id: 2, embarque: 'LCL', code: 'LCL' },
      { id: 3, embarque: 'Aéreo', code: 'Aéreo' },
      { id: 4, embarque: 'LTL TERRESTRE INTERNACIONAL', code: 'LTL TERRESTRE INTERNACIONAL' }
    ];

    console.log('Usando datos fallback');
  } finally {
    loading.value = false;
  }
}
async function guardarCambiosPlantilla() {
  if (!modalidadSeleccionada.value || !shipmentSeleccionado.value) {
    Swal.fire({ icon: 'warning', text: 'Seleccione modalidad y tipo de envío.' });
    return;
  }
  const payload = {
    id_modality: modalidadSeleccionada.value,
    shipment: shipmentSeleccionado.value,
    lstCostos: (costosBase.value || []).map((c) => ({
      id: c.id,
      code: c.code,
      tramo: c.tramo,
      seccion: c.seccion,
      servicio: c.servicio,
      concepto: c.concepto,
      multiplicador: c.multiplicador,
      monto: c.monto,
      proveedor: c.proveedor,
      exwflag: !!c.exwflag,
      fcaflag: !!c.fcaflag,
      fobflag: !!c.fobflag,
      cfrflag: !!c.cfrflag,
      cifflag: !!c.cifflag,
      ddpflag: !!c.ddpflag,
    })),
  };

  try {
    const config = {
      method: 'put',
      url: `${import.meta.env.VITE_URL_MAIN}editar_costos_base`,
      headers: {
        'auth-token': sessionStorage.getItem('auth-token'),
        'Content-Type': 'application/json',
      },
      data: payload,
    };

    const response = await axios<ApiResponse>(config);
    const ok = response?.data?.estadoflag;
    Swal.fire({
      icon: ok ? 'success' : 'error',
      title: ok ? 'Guardado' : 'Error',
      text: ok ? 'Costos base actualizados correctamente.' : (response?.data?.mensaje || 'No se pudo guardar.'),
    });
    if (ok) {
      await cargarCostosBase();
    }
  } catch (error) {
    console.error('Error guardando costos base:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: (error as Error).message || 'No se pudo guardar.' });
  }
}
async function cargarCostosBase() {
  if (!modalidadSeleccionada.value || !shipmentSeleccionado.value) {
    costosBase.value = [];
    return;
  }

  loading.value = true;
  try {
    console.log('Cargando costos base con parámetros:', {
      id_modality: modalidadSeleccionada.value,
      shipment: shipmentSeleccionado.value
    });

    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtener_costos_base?id_modality=${modalidadSeleccionada.value}&shipment=${shipmentSeleccionado.value}`,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        "Content-Type": "application/json",
      },
    };

    const response = await axios<ApiResponse<CostoBase[]>>(config);

    console.log('Respuesta del servidor:', response.data);

    if (response.data.estadoflag && response.data.data) {
      costosBase.value = response.data.data;
      console.log('Costos base cargados:', costosBase.value.length, costosBase.value);
    } else {
      costosBase.value = [];
      console.log('No se encontraron costos base o estadoflag es false');
    }

  } catch (error) {
    console.error('Error cargando costos base:', error);
    costosBase.value = [];
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al cargar los costos base: ' + (error as Error).message
    });
  } finally {
    loading.value = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function crearNuevaPlantilla() {
  router.push({
    name: 'ServiciosTarifasPlantillas',
    query: {
      modo: 'plantilla'
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function editarPlantilla() {
  router.push({
    name: 'ServiciosTarifasPlantillas',
    query: {
      modo: 'editar',
      modalidad: modalidadSeleccionada.value,
      shipment: shipmentSeleccionado.value
    }
  });
}
function getTramoColor(tramo: string | undefined) {
  switch (tramo) {
    case 'ORIGEN':
      return 'blue';
    case 'FLETE':
      return 'green';
    case 'DESTINO':
      return 'orange';
    default:
      return 'grey';
  }
}
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        <span class="text-headline-medium">Plantillas de Costos Base</span>
        <v-spacer />
      </v-card-title>
      <v-card-text>
        <!-- Buscador -->
        <v-row>
          <v-col
            cols="12"
            lg="4"
            xl="4"
          >
            <v-text-field
              placeholder="Buscar..."
              label="Buscar"
              v-model="search"
              append-inner-icon="mdi-magnify"
            />
          </v-col>
        </v-row>
        
        <!-- Configuración de Plantilla -->
        <v-row class="mb-4">
          <v-col
            cols="12"
            md="4"
          >
            <v-select
              :items="modalidadesDisponibles"
              v-model="modalidadSeleccionada"
              label="Modalidad"
              item-title="name"
              item-value="id"
              density="compact"
              variant="outlined"
              @update:model-value="cargarCostosBase"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-select
              :items="tiposEnvioDisponibles"
              v-model="shipmentSeleccionado"
              label="Tipo de Envío"
              item-title="embarque"
              item-value="code"
              density="compact"
              variant="outlined"
              @update:model-value="cargarCostosBase"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-btn 
              color="primary" 
              @click="guardarCambiosPlantilla" 
              :disabled="!modalidadSeleccionada || !shipmentSeleccionado || !costosBase.length"
              block
            >
              <v-icon start>
                mdi-content-save
              </v-icon>
              Guardar cambios
            </v-btn>
          </v-col>
        </v-row>
        
        <!-- Resumen de Costos Base -->
        <v-card
          v-if="costosBase.length > 0"
          class="mb-4"
        >
          <v-card-title>
            <v-icon start>
              mdi-format-list-bulleted
            </v-icon>
            Costos Base Configurados
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Tramo</th>
                  <th>Sección</th>
                  <th>Servicio</th>
                  <th>Concepto</th>
                  <th>Multiplicador</th>
                  <th>Monto</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(costo, index) in costosBase"
                  :key="index"
                >
                  <td>
                    <v-chip
                      :color="getTramoColor(costo.tramo)"
                      class="text-white"
                      variant="flat"
                      size="small"
                    >
                      {{ costo.tramo }}
                    </v-chip>
                  </td>
                  <td style="min-width:220px">
                    <v-text-field
                      density="compact"
                      hide-details
                      v-model="costo.seccion"
                    />
                  </td>
                  <td style="min-width:200px">
                    <v-text-field
                      density="compact"
                      hide-details
                      v-model="costo.servicio"
                    />
                  </td>
                  <td style="min-width:220px">
                    <v-text-field
                      density="compact"
                      hide-details
                      v-model="costo.concepto"
                    />
                  </td>
                  <td>{{ costo.multiplicador }}</td>
                  <td style="min-width:140px">
                    <v-text-field
                      class="tdMontos"
                      density="compact"
                      hide-details
                      type="number"
                      step="0.01"
                      prefix="$"
                      v-model.number="costo.monto"
                    />
                  </td>
                  <td>{{ costo.proveedor }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
        
        <v-alert
          v-else
          type="info"
          class="mb-4"
        >
          Seleccione modalidad y tipo de envío para ver los costos base configurados.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
</style>
