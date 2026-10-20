<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useGroupservicesStore } from "@/stores/groupservices";
import { useItemServicesStore } from "@/stores/itemServices";
import type { ItemServicio } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const groupservicesStore = useGroupservicesStore();
const itemServicesStore = useItemServicesStore();

const search = ref("");
const loading = ref(false);
const loadingNuevo = ref(false);
const loadingFiltrar = false;
const headers = [
  { title: "Servicio", key: "name_groupservices" },
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
];

async function filtrar() {
  itemServicesStore.tipo = "filter";
  itemServicesStore.drawer = !itemServicesStore.drawer;
}
async function ver(item: ItemServicio) {
  loading.value = !loading.value;
  const datos = { ...item };
  itemServicesStore.tipo = "ver";
  itemServicesStore.model = datos;

  loading.value = !loading.value;
  itemServicesStore.drawer = !itemServicesStore.drawer;
}
async function editar(item: ItemServicio) {
  loading.value = !loading.value;
  const datos = { ...item };
  itemServicesStore.tipo = "editar";
  itemServicesStore.model = datos;

  loading.value = !loading.value;
  itemServicesStore.drawer = !itemServicesStore.drawer;
}
async function nuevo() {
  loadingNuevo.value = !loadingNuevo.value;
  itemServicesStore.tipo = "nuevo";
  itemServicesStore.model = {
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    status: "1",
    id_branch: sessionBranchId(),
  };

  itemServicesStore.drawer = !itemServicesStore.drawer;
  loadingNuevo.value = !loadingNuevo.value;
}
async function eliminar(item: ItemServicio) {
  Swal.fire({
    icon: "question",
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    allowOutsideClick: false,
    confirmButtonText: "Si, inactivar",
    cancelButtonColor: "orange",
    confirmButtonColor: "red",
    cancelButtonText: "Cancelar",
    showCancelButton: true,
  }).then(async (res) => {
    if (res.isConfirmed) {
      item.status = 0;
      itemServicesStore.model = item;
      loading.value = true;
      await itemServicesStore.ActualizarItemServices();
      await itemServicesStore.GetListItemServices();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await itemServicesStore.GetListItemServices();

  loading.value = !loading.value;
  await groupservicesStore.CargarGroupServices();
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
          <v-btn
            size="small"
            color="success"
            :loading="loadingNuevo"
            @click="nuevo()"
          >
            NUEVO
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            :loading="loadingFiltrar"
            color="#2962FF"
            @click="filtrar()"
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
            :items="itemServicesStore.lstItemServices"
            class="elevation-1"
            item-value="port_beginend_id"
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
  </div>
</template>

<style></style>
