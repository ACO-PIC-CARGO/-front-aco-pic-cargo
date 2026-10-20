<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useTownStore } from "@/stores/town";
import type { Distrito } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const townStore = useTownStore();
const appStore = useAppStore();

const search = ref("");
const loading = ref(false);
const loadingNuevo = ref(false);
const loadingFiltrar = ref(false);
const headers = [
  { title: "Páis", key: "name_pais" },
  { title: "Estado (Región)", key: "name_state" },
  { title: "Ciudad", key: "name_city" },
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;

async function filtrar() {
  loadingFiltrar.value = !loadingFiltrar.value;
  townStore.tipo = "filter";
  // await this._getState(this.$store.state.town.filtros.id_pais);
  // await this._getCity(this.$store.state.town.filtros.id_state);
  loadingFiltrar.value = !loadingFiltrar.value;
  townStore.drawer = !townStore.drawer;
}
async function ver(item: Distrito) {
  loading.value = !loading.value;
  const datos = { ...item };
  townStore.tipo = "ver";
  townStore.model = datos;
  await appStore._getState(datos.id_pais);
  await appStore._getCity(datos.id_state);
  loading.value = !loading.value;
  townStore.drawer = !townStore.drawer;
}
async function editar(item: Distrito) {
  loading.value = !loading.value;
  const datos = { ...item };
  townStore.tipo = "editar";
  townStore.model = datos;
  await appStore._getState(datos.id_pais);
  await appStore._getCity(datos.id_state);
  loading.value = !loading.value;
  townStore.drawer = !townStore.drawer;
}
async function nuevo() {
  loadingNuevo.value = !loadingNuevo.value;
  townStore.tipo = "nuevo";
  townStore.model = {
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: 1,
    id_branch: sessionBranchId(),
  };
  // await this._getState(this.$store.state.town.model.id_state);
  // await this._getCity(this.$store.state.town.model.id_state);
  townStore.drawer = !townStore.drawer;
  loadingNuevo.value = !loadingNuevo.value;
}
async function eliminar(item: Distrito) {
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
      townStore.model = item;
      loading.value = true;
      await townStore.ActualizarTown();
      await townStore.GetListTown();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await townStore.GetListTown();
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
            :items="townStore.lstTown"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template #[`item.estado`]="{ item }">
              <!-- @vue-expect-error boolean == 1 kept from the old template -->
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
<!--  -->
