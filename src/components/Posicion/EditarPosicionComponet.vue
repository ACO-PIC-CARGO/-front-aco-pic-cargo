<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { usePositionStore } from "@/stores/position";
import type { UsuarioNoAsignado } from "@/types/seguridad";

const route = useRoute();
const appStore = useAppStore();
const positionStore = usePositionStore();

const tab = ref("datos");
const user = ref<UsuarioNoAsignado | "">("");
const errUsuario = ref("");
const guardarFlag = ref(false);
const headersRoles = [
  { title: "#", key: "index" },
  { title: "Nombre", key: "name" },
  { title: "Si/ No", key: "uso" },
] as const;
const headersUsuarios = [
  { title: "#", key: "index" },
  { title: "Documento", key: "document" },
  { title: "Nombre", key: "nombrecompleto" },
  { title: "Usuario", key: "users" },
  { title: "Teléfono", key: "phone" },
  { title: "Departamento", key: "departamentos" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
  // { text: "Nombre", value: "Nombre completo" },
] as const;

onMounted(async () => {
  positionStore.model.id = route.params.id as string;
  appStore.spiner = true;
  await positionStore.verPosition();
  await positionStore.cargarUsuarioNoAsignadoPosicion();
  appStore.spiner = false;
});

function asignar() {
  errUsuario.value = "";
  if (!user.value) {
    errUsuario.value = "Es necesario seleccionar un usuario.";
    return false;
  }
  if (positionStore.model.user_position!.some((v) => v.users == (user.value as UsuarioNoAsignado).users)) {
    errUsuario.value = "El usuario ya se encuentra en la lista";
    return false;
  }
  positionStore.model.user_position!.push(user.value);
  guardarFlag.value = true;
}
async function actualizarUsuariosPosicion() {
  errUsuario.value = "";
  appStore.spiner = true;
  await positionStore.setPosition();
  await positionStore.verPosition();
  await positionStore.cargarUsuarioNoAsignadoPosicion();
  user.value = "";
  appStore.spiner = false;
}
</script>

<template>
  <v-card class="cardDatos">
    <v-tabs
      v-model="tab"
      bg-color="teal-darken-4"
      color="white"
      grow
      stacked
    >
      <v-tab
        base-color="rgba(255, 255, 255, 0.6)"
        value="datos"
      >
        Datos Principales
      </v-tab>

      <v-tab
        base-color="rgba(255, 255, 255, 0.6)"
        value="permisos"
      >
        Permisos y Restricciones
      </v-tab>

      <v-tab
        base-color="rgba(255, 255, 255, 0.6)"
        value="usuarios"
      >
        Usuarios
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        value="datos"
        class="px-5 items"
      >
        <v-form ref="frmDatos">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.code"
                label="Código"
                readonly
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.name"
                label="Nombre"
                readonly
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.description"
                label="Descripción"
                readonly
              />
            </v-col>

            <v-col cols="12">
              <v-switch
                readonly
                label="Estado"
                v-model="positionStore.model.estado"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="permisos"
        class="px-5 items"
      >
        <v-row class="pa-5">
          <v-col cols="6">
            <p>Módulos</p>
            <v-data-table
              :headers="headersRoles"
              :items="positionStore.model.modules_position"
              item-value="id"
            >
              <template #[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
            </v-data-table>
          </v-col>

          <v-col cols="6">
            <p>Permisos</p>
            <v-data-table
              :headers="headersRoles"
              :items="positionStore.model.button_position"
              item-value="id"
            >
              <template #[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <v-tabs-window-item
        value="usuarios"
        class="px-5 items"
      >
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="4">
                <!-- @vue-expect-error the empty string start value is kept from the old data() -->
                <v-autocomplete
                  :items="positionStore.lstUsuarioNoAsignado"
                  item-value="id"
                  item-title="users"
                  label="Usuarios del sistema no asignados"
                  return-object
                  v-model="user"
                  :error-messages="errUsuario"
                />
              </v-col>

              <v-col
                cols="8"
                class="my-auto"
              >
                <v-btn
                  class="mx-1"
                  color="info"
                  @click="asignar"
                >
                  Agregar
                </v-btn>
                <v-btn
                  class="mx-1"
                  color="success"
                  :disabled="!guardarFlag"
                  @click="actualizarUsuariosPosicion()"
                >
                  Guardar Cambios
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headersUsuarios"
              :items="positionStore.model.user_position"
              class="elevation-1"
              item-value="id"
            >
              <template #[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template #[`item.estado`]="{ item }">
                <v-switch
                  v-model="item.estado"
                  @update:model-value="guardarFlag = true"
                />
              </template>
              <template #[`item.departamentos`]="{ item }">
                {{ item.departamento == "1" ? "Pricing" : "Operativo" }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>

<style scoped>
.cardDatos {
  max-width: 50%;
}
.items {
  min-height: 700px !important;
}
.iconDepartamento {
  cursor: pointer;
}
@media (max-width: 1000px) {
  .cardDatos {
    min-width: 100% !important;
  }
  .items {
    min-height: auto !important;
  }
}
</style>
