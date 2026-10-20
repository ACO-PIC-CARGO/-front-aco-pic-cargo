<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { usePositionStore } from "@/stores/position";
import type { PosicionListado } from "@/types/seguridad";
import { sessionBranchId } from "@/utils/sesion";

const router = useRouter();
const appStore = useAppStore();
const positionStore = usePositionStore();

const search = ref("");
const loading = ref(false);
const loadingNuevo = ref(false);
const loadingFiltrar = ref(false);
const headers = [
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  // { text: "Descripción", value: "description" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function filtrar() {
  loadingFiltrar.value = !loadingFiltrar.value;

  loadingFiltrar.value = !loadingFiltrar.value;
  positionStore.drawer = !positionStore.drawer;
}
async function ver(item: PosicionListado) {
  router.push({
    name: "verPosicion",
    params: {
      id: item.id,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function editar(item: PosicionListado) {
  router.push({
    name: "editarPosicion",
    params: {
      id: item.id,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function nuevo() {
  loadingNuevo.value = !loadingNuevo.value;
  positionStore.tipo = "nuevo";
  positionStore.model = {
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: 1,
    id_branch: sessionBranchId(),
  };
  await appStore._getState(positionStore.model.id_state);
  await appStore._getCity(positionStore.model.id_state);
  positionStore.drawer = !positionStore.drawer;
  loadingNuevo.value = !loadingNuevo.value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function eliminar(item: PosicionListado) {
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
      positionStore.model = item;
      loading.value = true;
      await positionStore.ActualizarEstadoPosition();
      await positionStore.GetListPosition();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await positionStore.GetListPosition();
  loading.value = !loading.value;
  await appStore._getPais();
});
</script>

<template>
  <div class="">
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
          <!-- <v-btn small color="success" :loading="loadingNuevo" @click="nuevo()"
            >NUEVO</v-btn
          > -->
          <!-- <v-btn
            small
            class="mx-1"
            :loading="loadingFiltrar"
            color="#2962FF"
            @click="filtrar()"
            dark
            >FILTRAR</v-btn
          >
          <v-btn small class="mx-1" color="#004D40" dark>EXPORTAR</v-btn> -->
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="positionStore.lstPosition"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template #[`item.status`]="{ item }">
              {{ !!item.estado ? "Activo" : "Inactivo" }}
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
            <template #[`item.estado`]="{ item }">
              {{ !!item.estado ? "Activo" : "Inactivo" }}
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
                <!-- <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="warning"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="editar(item)"
                  >
                    mdi-pencil
                  </v-icon>
                </template> -->
                <span>Editar</span>
              </v-tooltip>
              <!-- <v-tooltip bottom v-if="item.estado">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="error"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="eliminar(item)"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <span>Eliminar</span>
              </v-tooltip> -->
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<style></style>
