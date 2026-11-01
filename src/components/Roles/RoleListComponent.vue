<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { useRolesStore } from "@/stores/roles";
import type { RoleFilters, RoleRow } from "@/types/roles";

const router = useRouter();
const rolesStore = useRolesStore();
const { can } = usePermissions();

const headers = [
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Tipo", key: "system" },
  { title: "Usuarios", key: "users" },
  { title: "Estado", key: "estado" },
  { title: "Acciones", key: "action", sortable: false },
] as const;

const emptyFilters = (): RoleFilters => ({ search: "", estado: true });
const filters = ref(emptyFilters());
const search = ref("");
const loading = ref(false);
const showFilters = ref(false);

const canEdit = (role: RoleRow) => role.editable && can("lstPosition", "MODIFICAR");

async function load() {
  loading.value = true;
  await rolesStore.fetchRoles(filters.value);
  loading.value = false;
}

async function applyFilters() {
  showFilters.value = false;
  await load();
}

async function clearFilters() {
  filters.value = emptyFilters();
  await applyFilters();
}

async function toggleStatus(role: RoleRow) {
  const answer = await Swal.fire({
    icon: "question",
    title: role.estado ? "¿Desactivar el rol?" : "¿Activar el rol?",
    text: role.estado
      ? `Los usuarios con el rol «${role.name}» dejarán de ver sus pantallas hasta que lo actives de nuevo.`
      : `Los usuarios con el rol «${role.name}» volverán a ver sus pantallas.`,
    showCancelButton: true,
    confirmButtonText: role.estado ? "Sí, desactivar" : "Sí, activar",
    cancelButtonText: "Cancelar",
  });
  if (answer.isConfirmed && (await rolesStore.setRoleStatus(role, !role.estado))) await load();
}

onMounted(load);
</script>

<template>
  <v-card class="px-5">
    <v-card-title class="d-flex align-center flex-wrap ga-2">
      <v-text-field
        v-model="search"
        label="Buscar"
        append-inner-icon="mdi-magnify"
        single-line
        hide-details
      />
      <v-spacer />
      <v-btn
        v-if="can('lstPosition', 'NUEVO')"
        size="small"
        color="success"
        @click="router.push({ name: 'nuevoPosicion' })"
      >
        Nuevo
      </v-btn>
      <v-btn
        size="small"
        color="#2962FF"
        @click="showFilters = true"
      >
        Filtrar
      </v-btn>
    </v-card-title>

    <v-data-table
      class="elevation-1"
      :headers="headers"
      :items="rolesStore.roles"
      :loading="loading"
      :search="search"
      item-value="id"
      no-data-text="No hay roles que coincidan con los filtros. Cambia los filtros o pulsa Limpiar para verlos todos."
    >
      <template #[`item.system`]="{ item }">
        {{ item.system ? "Sistema" : "Empresa" }}
      </template>
      <template #[`item.estado`]="{ item }">
        {{ item.estado ? "Activo" : "Inactivo" }}
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          variant="text"
          icon="mdi-eye"
          color="primary"
          :aria-label="`Ver ${item.name}`"
          @click="router.push({ name: 'verPosicion', params: { id: item.id } })"
        />
        <v-btn
          v-if="canEdit(item)"
          variant="text"
          icon="mdi-pencil"
          color="warning"
          :aria-label="`Editar ${item.name}`"
          @click="router.push({ name: 'editarPosicion', params: { id: item.id } })"
        />
        <v-btn
          v-if="canEdit(item)"
          variant="text"
          :icon="item.estado ? 'mdi-cancel' : 'mdi-check-circle-outline'"
          :color="item.estado ? 'error' : 'success'"
          :aria-label="`${item.estado ? 'Desactivar' : 'Activar'} ${item.name}`"
          @click="toggleStatus(item)"
        />
      </template>
    </v-data-table>

    <v-navigation-drawer
      v-model="showFilters"
      location="right"
      temporary
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar Registros
        </v-list-item-title>
      </v-list-item>
      <v-container>
        <v-text-field
          v-model="filters.search"
          label="Nombre o descripción"
        />
        <v-radio-group
          v-model="filters.estado"
          inline
          density="compact"
        >
          <v-radio
            label="Activo"
            color="green"
            :value="true"
          />
          <v-radio
            label="Inactivo"
            color="red"
            :value="false"
          />
          <v-radio
            label="Todos"
            color="blue"
            value=""
          />
        </v-radio-group>
        <v-card-actions class="justify-end">
          <v-btn
            color="success"
            @click="applyFilters()"
          >
            Aceptar
          </v-btn>
          <v-btn @click="clearFilters()">
            Limpiar
          </v-btn>
          <v-btn
            color="warning"
            @click="showFilters = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>
  </v-card>
</template>
