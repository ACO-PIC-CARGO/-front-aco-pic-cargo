<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import PermissionMatrix from "@/components/Roles/PermissionMatrix.vue";
import RoleNotFound from "@/components/Roles/RoleNotFound.vue";
import { useAppStore } from "@/stores/app";
import { useRolesStore } from "@/stores/roles";
import { grantsFromCatalog, permissionsPayload } from "@/utils/permissionGrants";
import type { Grants } from "@/utils/permissionGrants";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const rolesStore = useRolesStore();

const roleId = route.params.id ? Number(route.params.id) : null;
const tab = ref("permisos");
const form = ref({ name: "", description: "", estado: true });
const grants = ref<Grants>({});
const assignedUsers = ref<number[]>([]);
const userSearch = ref("");
const loaded = ref(false);
const saving = ref(false);
const roleForm = useTemplateRef("roleForm");

const userHeaders = [
  { title: "Usuario", key: "users" },
  { title: "Nombre", key: "nombrecompleto" },
] as const;
const nameRules = [
  (value: string | null) => {
    const length = (value ?? "").trim().length;
    return (length >= 3 && length <= 100) || "El nombre debe tener entre 3 y 100 caracteres.";
  },
];

const role = computed(() => (roleId ? rolesStore.role : null));
const missing = computed(() => roleId !== null && !role.value);
const locked = computed(() => !!role.value && !role.value.editable);

onMounted(async () => {
  appStore.spiner = true;
  await Promise.all([roleId && rolesStore.fetchRole(roleId), rolesStore.fetchCatalog(roleId)]);
  if (role.value) {
    form.value = { name: role.value.name, description: role.value.description ?? "", estado: role.value.estado };
    assignedUsers.value = role.value.users.filter((user) => user.assigned).map((user) => user.id);
  }
  grants.value = grantsFromCatalog(rolesStore.catalog);
  loaded.value = true;
  appStore.spiner = false;
});

async function save() {
  if (saving.value) return;
  saving.value = true;
  if ((await roleForm.value!.validate()).valid) {
    const saved = await rolesStore.saveRole(roleId, {
      ...form.value,
      name: form.value.name.trim(),
      permissions: permissionsPayload(grants.value),
    });
    if (saved) router.push({ name: "lstPosition" });
  }
  saving.value = false;
}

async function saveUsers() {
  saving.value = true;
  await rolesStore.saveRoleUsers(roleId!, assignedUsers.value);
  saving.value = false;
}
</script>

<template>
  <RoleNotFound v-if="loaded && missing" />
  <v-card
    v-else-if="loaded"
    class="pa-4"
  >
    <v-alert
      v-if="locked"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Este es un rol del sistema y solo un administrador de ACO puede cambiarlo. Para revisar sus permisos, ábrelo
      con Ver desde el listado.
    </v-alert>
    <v-form ref="roleForm">
      <v-row>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            v-model="form.name"
            label="Nombre (*)"
            counter="100"
            :rules="nameRules"
            :readonly="locked"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-text-field
            v-model="form.description"
            label="Descripción"
            :readonly="locked"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
        >
          <v-switch
            v-model="form.estado"
            color="success"
            hide-details
            :label="form.estado ? 'Activo' : 'Inactivo'"
            :readonly="locked"
          />
        </v-col>
      </v-row>
    </v-form>

    <v-tabs
      v-model="tab"
      bg-color="teal-darken-4"
      color="white"
      grow
    >
      <v-tab
        base-color="rgba(255, 255, 255, 0.6)"
        value="permisos"
      >
        Permisos
      </v-tab>
      <v-tab
        v-if="roleId"
        base-color="rgba(255, 255, 255, 0.6)"
        value="usuarios"
      >
        Usuarios
      </v-tab>
    </v-tabs>
    <p
      v-if="!roleId"
      class="text-body-small text-medium-emphasis mt-2"
    >
      Guarda el rol para poder asignarle usuarios.
    </p>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="permisos">
        <PermissionMatrix
          v-model="grants"
          :catalog="rolesStore.catalog"
          :readonly="locked"
        />
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn
            color="warning"
            @click="router.push({ name: 'lstPosition' })"
          >
            Cancelar
          </v-btn>
          <v-btn
            v-if="!locked"
            color="success"
            :loading="saving"
            @click="save()"
          >
            Guardar
          </v-btn>
        </div>
      </v-tabs-window-item>
      <v-tabs-window-item
        v-if="role"
        value="usuarios"
      >
        <v-text-field
          v-model="userSearch"
          class="my-4"
          label="Buscar usuario"
          append-inner-icon="mdi-magnify"
          clearable
          hide-details
        />
        <v-data-table
          v-model="assignedUsers"
          :headers="userHeaders"
          :items="role.users"
          :search="userSearch"
          item-value="id"
          :show-select="!locked"
          no-data-text="Tu empresa todavía no tiene usuarios activos. Créalos desde Usuarios y vuelve aquí para asignarles este rol."
        />
        <div class="d-flex justify-end mt-4">
          <v-btn
            v-if="!locked"
            color="success"
            :loading="saving"
            @click="saveUsers()"
          >
            Guardar usuarios
          </v-btn>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
