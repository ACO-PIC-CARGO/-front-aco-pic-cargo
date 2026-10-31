<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import type { EstadoCotizacion } from "@/types/cotizacion";
import { hasFailed, request } from "@/utils/request";

const estatusSeleccionado = ref<EstadoCotizacion["id"] | null>(null);
const estatusDisponibles = ref<EstadoCotizacion[]>([]);
const configuracionActual = ref<EstadoCotizacion | null>(null);
const loadingEstatus = ref(false);
const guardando = ref(false);

onMounted(async () => {
  loadingEstatus.value = true;
  await cargarEstatusDisponibles();
  loadingEstatus.value = false;
});

async function cargarEstatusDisponibles() {
  const response = await request<EstadoCotizacion>({
    method: "post",
    url: `${import.meta.env.VITE_URL_MAIN}getQuoteStatus`,
  });
  if (hasFailed(response)) Swal.fire({ icon: "error", text: response.mensaje });
  estatusDisponibles.value = response.estadoflag ? response.data : [];
  cargarConfiguracionActual();
}

function cargarConfiguracionActual() {
  const estatusConDefault = estatusDisponibles.value.find(estatus => estatus.defaultstatus === 1 || estatus.defaultstatus === '1' || estatus.defaultstatus === true);
  configuracionActual.value = estatusConDefault ?? null;
  estatusSeleccionado.value = estatusConDefault?.id ?? null;
}

async function guardarEstatusDefecto() {
  if (!estatusSeleccionado.value) {
    Swal.fire({
      icon: 'warning',
      text: 'Seleccione un estatus por defecto.'
    });
    return;
  }

  guardando.value = true;
  const response = await request({
    method: "put",
    url: `${import.meta.env.VITE_URL_MAIN}configurar_estatus_defecto`,
    data: { id_estatus_defecto: estatusSeleccionado.value },
  });
  Swal.fire({ icon: response.estadoflag ? "success" : "error", text: response.mensaje });
  if (response.estadoflag) await cargarEstatusDisponibles();
  guardando.value = false;
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap">
      <span class="headline text-headline-medium">Configuración de Estatus por Defecto</span>
      <v-spacer />
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          md="6"
        >
          <v-select
            v-model="estatusSeleccionado"
            :items="estatusDisponibles"
            item-title="name"
            item-value="id"
            label="Estatus por defecto para cotizaciones"
            density="compact"
            variant="outlined"
            :loading="loadingEstatus"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-btn 
            color="primary" 
            @click="guardarEstatusDefecto" 
            :disabled="!estatusSeleccionado"
            :loading="guardando"
          >
            <v-icon start>
              mdi-content-save
            </v-icon>
            Guardar Configuración
          </v-btn>
        </v-col>
      </v-row>
      
      <v-divider class="my-4" />
      
      <v-row>
        <v-col cols="12">
          <h3>Información actual:</h3>
          <v-chip 
            v-if="configuracionActual" 
            color="success" 
            variant="outlined"
            class="ma-2"
          >
            <v-icon start>
              mdi-check-circle
            </v-icon>
            Estatus actual: {{ configuracionActual.name }}
          </v-chip>
          <v-chip 
            v-else 
            color="warning" 
            variant="outlined"
            class="ma-2"
          >
            <v-icon start>
              mdi-alert-circle
            </v-icon>
            Sin configuración establecida
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.headline {
  font-weight: 500;
}
</style>
