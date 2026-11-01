<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PermissionMatrix from "@/components/Roles/PermissionMatrix.vue";
import RoleNotFound from "@/components/Roles/RoleNotFound.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useAppStore } from "@/stores/app";
import { useRolesStore } from "@/stores/roles";
import { grantsFromCatalog } from "@/utils/permissionGrants";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const rolesStore = useRolesStore();
const { can } = usePermissions();

const roleId = Number(route.params.id);
const loaded = ref(false);
const userHeaders = [
  { title: "Usuario", key: "users" },
  { title: "Nombre", key: "nombrecompleto" },
] as const;

const role = computed(() => rolesStore.role);
const grants = computed(() => grantsFromCatalog(rolesStore.catalog));
const assignedUsers = computed(() => (role.value?.users ?? []).filter((user) => user.assigned));

onMounted(async () => {
  appStore.spiner = true;
  await Promise.all([rolesStore.fetchRole(roleId), rolesStore.fetchCatalog(roleId)]);
  loaded.value = true;
  appStore.spiner = false;
});
</script>

<template>
  <RoleNotFound v-if="loaded && !role" />
  <v-card
    v-else-if="loaded && role"
    class="pa-4"
  >
    <v-row>
      <v-col
        cols="12"
        md="2"
      >
        <v-text-field
          label="Código"
          :model-value="role.code"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Nombre"
          :model-value="role.name"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Descripción"
          :model-value="role.description"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-text-field
          label="Tipo y estado"
          :model-value="`${role.system ? 'Sistema' : 'Empresa'} · ${role.estado ? 'Activo' : 'Inactivo'}`"
          readonly
        />
      </v-col>
    </v-row>

    <h2 class="text-title-medium mb-2">
      Permisos
    </h2>
    <PermissionMatrix
      :model-value="grants"
      :catalog="rolesStore.catalog"
      readonly
    />

    <h2 class="text-title-medium mt-6 mb-2">
      Usuarios con este rol
    </h2>
    <v-data-table
      :headers="userHeaders"
      :items="assignedUsers"
      item-value="id"
      no-data-text="Ningún usuario de tu empresa tiene este rol. Para asignarlo, abre el rol con Editar y ve a la pestaña Usuarios."
    />

    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn
        color="warning"
        @click="router.push({ name: 'lstPosition' })"
      >
        Volver
      </v-btn>
      <v-btn
        v-if="role.editable && can('lstPosition', 'MODIFICAR')"
        color="primary"
        @click="router.push({ name: 'editarPosicion', params: { id: role.id } })"
      >
        Editar
      </v-btn>
    </div>
  </v-card>
</template>
