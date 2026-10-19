<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubingresoStore } from "@/stores/subingreso";
import type { SubIngreso } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const ingresosStore = useIngresosStore();
const subingresoStore = useSubingresoStore();

const search = ref("");
const loading = ref(false);
const loadingNuevo = false;
const loadingFiltrar = false;
const headers = [
  { title: "Tipo de Ingreso", key: "description_ingreso" },
  { title: "Código", key: "code" },
  { title: "Descripción", key: "description" },
  { title: "Calculado en Reportes", key: "calculo" },
  { title: "Se Muestra en Reportes", key: "monstra" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
];

async function filtrar() {
  subingresoStore.tipo = "filter";
  subingresoStore.drawer = !subingresoStore.drawer;
}
async function ver(item: SubIngreso) {
  const datos = { ...item };
  subingresoStore.tipo = "ver";
  subingresoStore.model = datos;

  subingresoStore.drawer = !subingresoStore.drawer;
}
async function editar(item: SubIngreso) {
  const datos = { ...item };
  subingresoStore.tipo = "editar";
  subingresoStore.model = datos;

  subingresoStore.drawer = !subingresoStore.drawer;
}
async function nuevo() {
  subingresoStore.tipo = "nuevo";
  subingresoStore.model = {
    id_ingreso: "",
    code: "",
    description: "",
    status: true,
    id_branch: sessionBranchId(),
    calculoflag: true,
    mostrarflag: true,
  };

  subingresoStore.drawer = !subingresoStore.drawer;
}
async function eliminar(item: SubIngreso) {
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
      subingresoStore.model = item;
      loading.value = true;
      await subingresoStore.ActualizarSubIngreso();
      await subingresoStore.GetListSubIngreso();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await ingresosStore.cargarIngreso();
  await subingresoStore.GetListSubIngreso();
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
            append-inner-icon="mdi-magnify"
            clearable
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
            :items="subingresoStore.lstSubIngreso"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template #[`item.estado`]="{ item }">
              <!-- @vue-expect-error boolean == 1 kept from the old template -->
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template #[`item.colors`]="{ item }">
              <v-chip
                :color="item.color"
                variant="flat"
                v-if="item.color"
              >
                {{ item.color }}
              </v-chip>
            </template>
            <template #[`item.calculo`]="{ item }">
              <v-chip
                color="green"
                v-if="item.calculoflag"
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
            <template #[`item.monstra`]="{ item }">
              <v-chip
                color="green"
                v-if="item.mostrarflag"
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
