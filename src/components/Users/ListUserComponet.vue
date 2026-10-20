<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useSubscriptionsStore } from "@/stores/subscriptions";
import { useUserStore } from "@/stores/user";
import type { UsuarioListado } from "@/types/seguridad";

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();
const subscriptionsStore = useSubscriptionsStore();

const search = ref("");
const loading = ref(false);
const loadingNuevo = ref(false);
const loadingFiltrar = ref(false);
const headers = [
  { title: "Nombre Completo", key: "nombrecompleto" },
  { title: "Nombre de usuario", key: "users" },
  { title: "Perfil", key: "permiso" },
  { title: "Modulos", key: "modulo" },
  // { text: "Tip. Doc.", value: "type_document" },
  // { text: "Documento", value: "document" },
  { title: "Telefono", key: "phone" },
  // { text: "Correo", value: "email" },
  { title: "Estado", key: "status" },
  // { text: "Creación", value: "created_at" },
  { title: "Acciones", key: "action" },
] as const;

const canAddUsers = computed(() => subscriptionsStore.canAddUsers);
const userLimitNotice = computed(() => subscriptionsStore.userLimitNotice);

async function filtrar() {
  loadingFiltrar.value = !loadingFiltrar.value;
  userStore.tipo = "filter";
  userStore.drawer = !userStore.drawer;
  loadingFiltrar.value = !loadingFiltrar.value;
}
async function ver(item: UsuarioListado) {
  router.push({
    name: "verUser",
    params: {
      id: item.id,
    },
  });
}
async function editar(item: UsuarioListado) {
  router.push({
    name: "editarUser",
    params: {
      id: item.id,
    },
  });
}
async function nuevo() {
  loadingNuevo.value = true;
  await subscriptionsStore.reloadPlanAccess();
  loadingNuevo.value = false;
  if (!canAddUsers.value) {
    subscriptionsStore.promptPlanUpgrade(userLimitNotice.value);
    return;
  }
  router.push({ name: "registroUser" });
}
async function eliminar(item: UsuarioListado) {
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
      userStore.model = item;
      loading.value = true;
      await userStore.cambiarEstadoUsers();
      await userStore.GetListUsers();
      loading.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = !loading.value;
  await userStore.GetListUsers();
  loading.value = !loading.value;
  await appStore._getDocumentsPais();
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
            :items="userStore.lstUsers"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template #[`item.status`]="{ item }">
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
            <template #[`item.permiso`]="{ item }">
              <tr
                v-for="(position, index) in item.json_position"
                :key="index"
              >
                <td width="100%">
                  {{ index + 1 }}.{{ position.name }}
                </td>
              </tr>
            </template>
            <template #[`item.modulo`]="{ item }">
              <tr
                v-for="(menu, index) in item.json_menu"
                :key="index"
              >
                <td width="100%">
                  {{ index + 1 }}.-{{ menu.name }}
                </td>
              </tr>
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
