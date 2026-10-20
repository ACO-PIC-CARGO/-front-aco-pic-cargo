<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useAirlinesStore } from "@/stores/airlines";
import type { Aerolinea } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const airlinesStore = useAirlinesStore();
const appStore = useAppStore();

const search = ref("");
const loading = ref(false);
const headers = [
  { key: "pais_name", title: "País" },
  { key: "code", title: "Código" },
  { key: "code_iata", title: "Código IATA" },
  { key: "code_icao", title: "Código ICAO" },
  { key: "name", title: "Nombre" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
  { key: "action", title: "Acciones" },
] as const;

onMounted(async () => {
  loading.value = true;
  await appStore._getPais();
  await airlinesStore.GetListAirline();
  loading.value = false;
});

function ver(item: Aerolinea) {
  const datos = { ...item };
  airlinesStore.tipo = "ver";
  airlinesStore.AirlineModel = datos;
  airlinesStore.drawer = !airlinesStore.drawer;
}
function editar(item: Aerolinea) {
  const datos = { ...item };
  airlinesStore.tipo = "editar";
  airlinesStore.AirlineModel = datos;
  airlinesStore.drawer = !airlinesStore.drawer;
}
function nuevo() {
  airlinesStore.tipo = "nuevo";
  airlinesStore.AirlineModel = {
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: true,
    id_branch: sessionBranchId(),
  };
  airlinesStore.drawer = !airlinesStore.drawer;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function filter() {
  airlinesStore.tipo = "filter";
}
async function eliminar(item: Aerolinea) {
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
      item.status = false;
      airlinesStore.AirlineModel = item;
      loading.value = true;
      await airlinesStore.actualizarAirline();
      await airlinesStore.GetListAirline();
      loading.value = false;
    }
  });
}
</script>

<template>
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
            (airlinesStore.drawer = !airlinesStore.drawer) &&
              (airlinesStore.tipo = 'filter')
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
          :items="airlinesStore.lstAirline"
          class="elevation-1"
          item-value="id"
          :loading="loading"
          :search="search"
        >
          <template #[`item.estado`]="{ item }">
            {{ !!item.status ? "Activo" : "Inactivo" }}
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
              v-if="!!item.status"
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
