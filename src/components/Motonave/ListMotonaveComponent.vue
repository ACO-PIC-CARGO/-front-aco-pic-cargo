<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useMotonaveStore } from "@/stores/motonave";
import type { Motonave } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const motonaveStore = useMotonaveStore();

const search = ref("");
const loading = ref(false);
const headers = [
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;

function ver(item: Motonave) {
  const datos = { ...item };
  motonaveStore.tipo = "ver";
  motonaveStore.MotonaveModel = datos;
  motonaveStore.drawer = !motonaveStore.drawer;
}
function editar(item: Motonave) {
  const datos = { ...item };
  motonaveStore.tipo = "editar";
  motonaveStore.MotonaveModel = datos;
  motonaveStore.drawer = !motonaveStore.drawer;
}
function nuevo() {
  motonaveStore.tipo = "nuevo";
  motonaveStore.MotonaveModel = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: 1,
    id_branch: sessionBranchId(),
  };
  motonaveStore.drawer = !motonaveStore.drawer;
}
async function eliminar(item: Motonave) {
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
      motonaveStore.MotonaveModel = item;
      loading.value = true;
      await motonaveStore.ActualizarMotonave();
      await motonaveStore.GetListMotonave();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await motonaveStore.GetListMotonave();
  loading.value = !loading.value;
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
            @click="nuevo()"
          >
            NUEVO
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="#2962FF"
            @click="
              (motonaveStore.drawer = !motonaveStore.drawer) &&
                (motonaveStore.tipo = 'filter')
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
            :items="motonaveStore.lstMotonave"
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
