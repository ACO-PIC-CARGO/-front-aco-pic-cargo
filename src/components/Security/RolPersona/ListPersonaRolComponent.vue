<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";
import type { PersonaRol } from "@/types/seguridad";

const rootStore = useStore();
const entitiesStore = useEntitiesStore();

const search = ref("");
const dialog = ref(false);
const headers = [
  { title: "Persona", key: "nombrecompleto", width: "70%" },
  { title: "Es Proveedor", key: "proveedor", width: "10%" },
  { title: "Es Cliente", key: "cliente", width: "10%" },
  { title: "Es Personal", key: "personal", width: "10%" },
] as const;
const items = ref<PersonaRol[]>([]);
const rol = ref("");

function filterPorRol() {
  if (rol.value == "proveedor") {
    items.value = entitiesStore.lstPersona.filter((v) => v.proveedorflag == true);
  }
  if (rol.value == "cliente") {
    items.value = entitiesStore.lstPersona.filter((v) => v.clienteflag == true);
  }
  if (rol.value == "personal") {
    items.value = entitiesStore.lstPersona.filter((v) => v.personalflag == true);
  }
  dialog.value = false;
}
async function Guardar() {
  rootStore.state.spiner = true;
  await entitiesStore.guardarRolProveedor();
  await entitiesStore.ListarPersonaTipoPersona();
  rootStore.state.spiner = false;
}

onMounted(async () => {
  rootStore.state.spiner = true;
  await entitiesStore.ListarPersonaTipoPersona();
  rootStore.state.spiner = false;
  // this.dialog = true;
});

// :items="$store.state.entities.lstPersona"
</script>

<template>
  <v-row>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Seleccione ROL DE LAS PERSONAS A EDITAR
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="rol">
            <v-radio
              label="Proveedor"
              value="proveedor"
            />
            <v-radio
              label="Cliente"
              value="cliente"
            />
            <v-radio
              label="Personal"
              value="personal"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            @click="filterPorRol()"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- ---------------- -->
    <v-col cols="6">
      <v-text-field
        label="Buscar..."
        v-model="search"
        class="mx-5"
      />
    </v-col>
    <v-col cols="6">
      <v-btn
        color="success"
        class="ml-0"
        @click="Guardar()"
      >
        Actualizar
      </v-btn>
    </v-col>
    <v-col cols="12">
      <v-data-table
        :headers="headers"
        :items="entitiesStore.lstPersona"
        class="elevation-1"
        item-value="id"
        :search="search"
      >
        <template #[`item.proveedor`]="{ item }">
          <v-checkbox v-model="item.proveedorflag" />
        </template>
        <template #[`item.cliente`]="{ item }">
          <v-checkbox v-model="item.clienteflag" />
        </template>
        <template #[`item.personal`]="{ item }">
          <v-checkbox v-model="item.personalflag" />
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>

<style></style>
