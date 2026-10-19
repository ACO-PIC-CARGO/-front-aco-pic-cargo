<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";

const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  rootStore.state.spiner = true;
  await entitiesStore.getListClientes();
  entitiesStore.filtrarProveedor =
    !entitiesStore.filtrarProveedor;
  rootStore.state.spiner = false;
}
async function limpiar() {
  rootStore.state.spiner = true;
  frmFiltro.value!.reset();
  entitiesStore.filtro.status = "1";
  await entitiesStore.getListClientes();
  entitiesStore.filtrarProveedor =
    !entitiesStore.filtrarProveedor;
  rootStore.state.spiner = false;
}
</script>

<template>
  <v-card elevation="0">
    <v-card-title> FILTRAR REGISTROS </v-card-title>
    <v-card-text>
      <v-form ref="frmFiltro">
        <v-text-field
          label="Correlativo"
          placeholder="Correlativo..."
          :rules="[
            (v) =>
              /^(?!0\d+|\d*e)\d*(?:\.\d+)?$/.test(v) ||
              'Debe ser un número real entero positivo',
          ]"
          prefix="CLI-"
          clearable
          v-model="entitiesStore.filtro.correlativo"
        />

        <v-text-field
          label="Nombre Completo"
          placeholder="Nombre Completo"
          clearable
          v-model="entitiesStore.filtro.nombrecompleto"
        />

        <v-select
          :items="rootStore.state.itemsDocumentsPais"
          item-title="description"
          item-value="id"
          label="Tipo de Documento Fiscal"
          clearable
          v-model="entitiesStore.filtro.id_document"
        />

        <v-text-field
          label="Nro. Documento"
          placeholder="Nro. Documento"
          clearable
          v-model="entitiesStore.filtro.nro_documento"
        />

        <v-autocomplete
          item-title="name"
          item-value="id"
          :items="rootStore.state.itemsPais"
          label="País"
          clearable
          v-model="entitiesStore.filtro.id_pais"
          @update:model-value="rootStore.dispatch('_getState', entitiesStore.filtro.id_pais)"
        />

        <v-autocomplete
          :items="rootStore.state.itemsState"
          item-title="name"
          item-value="id"
          label="Departamento"
          clearable
          v-model="entitiesStore.filtro.id_state"
        />

        <v-radio-group
          v-model="entitiesStore.filtro.status"
          inline
        >
          <v-radio
            color="green"
            label="Activo"
            value="1"
          />
          <v-radio
            color="error"
            label="Inactivo"
            value="0"
          />
          <v-radio
            color="default"
            label="Todos"
            value=""
          />
        </v-radio-group>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        size="small"
        class="mx-1"
        color="success"
        @click="filtrar()"
      >
        Filtrar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="error"
        @click="
          entitiesStore.filtrarProveedor =
            !entitiesStore.filtrarProveedor
        "
      >
        Cerrar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="default"
        @click="limpiar()"
      >
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
