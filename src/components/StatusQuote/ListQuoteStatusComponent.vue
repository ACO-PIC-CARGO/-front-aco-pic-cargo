<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import type { EstadoCotizacion } from "@/types/cotizacion";
import { sessionBranchId } from "@/utils/sesion";

const QuoteStatusStore = useQuoteStatusStore();
const masterusuariosStore = useMasterusuariosStore();

const search = ref("");
const loading = ref(false);
const headers = [
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  // { text: "Descripción", value: "description" },
  { title: "Temperatura del lead ", key: "temperatura" },
  { title: "Posición ", key: "position" },
  // temperatura
  // temperaturadescripcion
  // backgroundtemperatura
  // { text: "Posición Listado Llamadas", value: "position_calls" },
  // { text: "Posición Reportes", value: "position_report" },
  // { text: "Posición Registro", value: "position_select" },
  // { text: "Uso Llamadas", value: "statuscalls" },
  // { text: "Uso Todas Llamadas", value: "statuscalls_all" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;

onMounted(async () => {
  loading.value = true;
  await QuoteStatusStore.GetListQuoteStatus();
  loading.value = false;
  masterusuariosStore.cargarTemperaturaLeds();
});

function ver(item: EstadoCotizacion) {
  const datos = { ...item };
  QuoteStatusStore.tipo = "ver";
  QuoteStatusStore.StatusModel = datos;
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
function editar(item: EstadoCotizacion) {
  const datos = { ...item };
  QuoteStatusStore.tipo = "editar";
  QuoteStatusStore.StatusModel = datos;
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
function nuevo() {
  QuoteStatusStore.tipo = "nuevo";
  QuoteStatusStore.StatusModel = {
    id: "",
    name: "",
    code: "",
    position: QuoteStatusStore.max_position,
    position_calls: QuoteStatusStore.max_position_calls,
    position_report: QuoteStatusStore.max_position_report,
    position_select: QuoteStatusStore.max_position_select,
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: 1,
    id_branch: sessionBranchId(),
  };
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
async function eliminar(item: EstadoCotizacion) {
  Swal.fire({
    icon: "question",
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    allowOutsideClick: false,
    confirmButtonText: "Si, inactivar",
    confirmButtonColor: "red",
    cancelButtonText: "Cancelar",
    cancelButtonColor: "orange",
    showCancelButton: true,
  }).then(async (res) => {
    if (res.isConfirmed) {
      item.status = 0;
      QuoteStatusStore.StatusModel = item;
      loading.value = true;
      await QuoteStatusStore.actualizarQuoteStatus();
      await QuoteStatusStore.GetListQuoteStatus();
      loading.value = false;
    }
  });
}
</script>

<template>
  <!-- <div class="">{{ $store.state.QuoteStatus.statusQuoteList }}</div> -->
  <v-card
    fluid
    class="px-5"
  >
    <v-row>
      <v-col cols="4">
        <v-text-field
          label="Buscar"
          placeholder="Buscar"
          v-model="search"
          clearable
          append-inner-icon="mdi-magnify"
        />
      </v-col>
      <v-col
        cols="4"
        offset="4"
        class="text-right my-auto"
      >
        <v-btn
          size="small"
          color="success"
          @click="nuevo()"
        >
          NUEVO
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="
            (QuoteStatusStore.drawer =
              !QuoteStatusStore.drawer) &&
              (QuoteStatusStore.tipo = 'filter')
          "
        >
          FILTRAR
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#004D40"
        >
          EXPORTAR
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="QuoteStatusStore.statusQuoteList"
          class="elevation-1"
          item-value="id"
          :loading="loading"
          :search="search"
        >
          <template #[`item.estado`]="{ item }">
            <!-- @vue-expect-error compares a boolean with 1 -->
            {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
          </template>
          <template #[`item.statuscalls`]="{ item }">
            <v-chip
              color="green"
              v-if="item.status_calls == 1"
            >
              Si
            </v-chip>
            <v-chip
              color="red"
              v-else
            >
              No
            </v-chip>
          </template>
          <template #[`item.statuscalls_all`]="{ item }">
            <v-chip
              color="green"
              v-if="item.status_calls_all == 1"
            >
              Si
            </v-chip>
            <v-chip
              color="red"
              v-else
            >
              No
            </v-chip>
          </template>
          <template #[`item.action`]="{ item }">
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  color="primary"
                 
                  v-bind="props"
                  @click="ver(item)"
                >
                  mdi-eye
                </v-icon>
              </template>
              <span>Ver</span>
            </v-tooltip>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  color="warning"
                 
                  v-bind="props"
                  @click="editar(item)"
                >
                  mdi-pencil
                </v-icon>
              </template>
              <span>Editar</span>
            </v-tooltip>
            <v-tooltip
              location="bottom"
              v-if="item.status == 1"
            >
              <template #activator="{ props }">
                <v-icon
                  color="error"
                 
                  v-bind="props"
                  @click="eliminar(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
              <span>Eliminar</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-card>
</template>

<style></style>
