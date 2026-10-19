<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { MasterDetalle } from "@/types/seguridad";
import { sessionBranchId } from "@/utils/sesion";

const masterusuariosStore = useMasterusuariosStore();

const search = ref("");
const mostrarflag = ref(true);
const loading = ref(false);
const headers = [
  { title: "Código", key: "valorcodigo" },
  { title: "Nombre", key: "description" },
  //   { text: "Porcentaje", value: "codigo01" },
  //   { text: "Fórmula", value: "codigo02" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;

const drawer = computed(() => masterusuariosStore.drawer);

watch(drawer, async () => {
  const caseRecargar = ["nuevo", "editar", "filter"];
  if (!drawer.value) {
    if (caseRecargar.includes(masterusuariosStore.tipo)) {
      // setTimeout(() => {

      // }, 10);
      mostrarflag.value = !mostrarflag.value;
      setTimeout(() => {
        mostrarflag.value = !mostrarflag.value;
      }, 5);
    }
  }
});

async function filtrar() {
  masterusuariosStore.tipo = "filter";
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function ver(item: MasterDetalle) {
  const datos = { ...item };
  masterusuariosStore.tipo = "ver";
  masterusuariosStore.model = datos;
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function editar(item: MasterDetalle) {
  const datos = { ...item };
  masterusuariosStore.tipo = "editar";
  masterusuariosStore.model = datos;

  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function nuevo() {
  masterusuariosStore.tipo = "nuevo";
  masterusuariosStore.model = {
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    escomunflag: "",
    id_branch: sessionBranchId(),
  };
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function eliminar(item: MasterDetalle) {
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
      masterusuariosStore.model = item;
      loading.value = true;
      await masterusuariosStore.ActualizarMasterDetalle();
      await masterusuariosStore.GetListTipoTelefono();
      loading.value = false;
      mostrarflag.value = !mostrarflag.value;
      setTimeout(() => {
        mostrarflag.value = !mostrarflag.value;
      }, 5);
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await masterusuariosStore.GetListTipoTelefono();
  loading.value = !loading.value;
});
</script>

<template>
  <div
    class=""
    v-if="mostrarflag"
  >
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
            @click="nuevo()"
          >
            NUEVO
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
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
            :items="masterusuariosStore.lstTipoTelefono"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template #[`item.estado`]="{ item }">
              <!-- @vue-expect-error boolean == 1 kept from the old template -->
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
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
                  <!-- @vue-expect-error item.status == true is kept inside the item.status == 1 branch -->
                  <v-icon
                    color="error"
                   
                    v-bind="props"
                    v-if="item.status == true"
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
