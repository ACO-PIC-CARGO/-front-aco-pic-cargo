<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRolesStore } from "@/stores/roles";
import { actionLabel } from "@/utils/permissionGrants";

const rolesStore = useRolesStore();

const headers = [
  { title: "Módulo", key: "module" },
  { title: "Grupo", key: "group_name" },
  { title: "Pantalla", key: "screen" },
  { title: "Acción", key: "action" },
  { title: "Roles que la otorgan", key: "roles", sortable: false },
] as const;

const moduleFilter = ref<string | null>(null);
const roleFilter = ref<number | null>(null);
const loading = ref(false);

const modules = computed(() => [...new Set(rolesStore.permissionList.map((row) => row.module))]);
const roles = computed(() => [
  ...new Map(rolesStore.permissionList.flatMap((row) => row.roles).map((role) => [role.id, role])).values(),
]);
const rows = computed(() =>
  rolesStore.permissionList.filter(
    (row) =>
      (!moduleFilter.value || row.module === moduleFilter.value) &&
      (!roleFilter.value || row.roles.some((role) => role.id === roleFilter.value)),
  ),
);

onMounted(async () => {
  loading.value = true;
  await rolesStore.fetchPermissionList();
  loading.value = false;
});
</script>

<template>
  <v-card class="px-5 py-4">
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          v-model="moduleFilter"
          :items="modules"
          label="Módulo"
          clearable
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          v-model="roleFilter"
          :items="roles"
          item-title="name"
          item-value="id"
          label="Rol"
          clearable
          hide-details
        />
      </v-col>
    </v-row>

    <v-data-table
      class="elevation-1 mt-4"
      :headers="headers"
      :items="rows"
      :loading="loading"
      no-data-text="No hay permisos que coincidan con los filtros. Quita un filtro para ver más."
    >
      <template #[`item.action`]="{ item }">
        {{ actionLabel(item.action) }}
      </template>
      <template #[`item.roles`]="{ item }">
        <v-chip
          v-for="role in item.roles"
          :key="role.id"
          class="ma-1"
          size="small"
        >
          {{ role.name }}
        </v-chip>
        <span
          v-if="!item.roles.length"
          class="text-medium-emphasis"
        >
          Ningún rol
        </span>
      </template>
    </v-data-table>
  </v-card>
</template>
