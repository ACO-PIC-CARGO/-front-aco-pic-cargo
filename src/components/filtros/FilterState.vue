<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useStatesStore } from "@/stores/states";
import type { EstadoRegion } from "@/types/catalogos";

const statesStore = useStatesStore();
const appStore = useAppStore();

const loading = ref(false);
const StateModel = ref<Partial<EstadoRegion>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => statesStore.drawer);

watch(drawer, () => {
  StateModel.value = { ...statesStore.StateModel };
});

function getName() {
  if (statesStore.tipo == "ver") {
    return `Estado ${StateModel.value.name} – Modo Vista`;
  }
  if (statesStore.tipo == "nuevo") {
    return "Nuevo estado";
  }
  if (statesStore.tipo == "editar") {
    return `Modificar Estado: ${StateModel.value.name}`;
  }
  if (statesStore.tipo == "filter") {
    return "Filtrar Listado estado";
  }
}
async function Filtrar() {
  loading.value = true;
  await statesStore.GetListState();
  loading.value = false;
  statesStore.drawer = !statesStore.drawer;
}
async function Limpiar() {
  statesStore.StateFilter = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  };
  loading.value = true;
  await statesStore.GetListState();
  loading.value = false;
  statesStore.drawer = !statesStore.drawer;
}
async function Aceptar() {
  if (statesStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await statesStore.setState();
      await statesStore.GetListState();
      loading.value = false;
    }
  }
  if (statesStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await statesStore.ActualizarState();
      await statesStore.GetListState();
    }
    loading.value = false;
  }
  if (statesStore.tipo == "ver") {
    statesStore.drawer = !statesStore.drawer;
  }
}
</script>

<template>
  <v-card>
    <v-card-title
      class="d-flex align-center flex-wrap"
      primary-title
    >
      {{ getName() }}
      <v-spacer />
      <v-btn
        variant="text"
        icon
        color="default"
        @click="statesStore.drawer = !statesStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="statesStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-autocomplete
          label="Pais"
          :items="appStore.itemsPais"
          v-model="statesStore.StateFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="statesStore.tipo != 'ver'"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="statesStore.StateFilter.code"
          label="Código"
          :clearable="statesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="statesStore.StateFilter.name"
          label="Nombre"
          :clearable="statesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="statesStore.StateFilter.description"
          label="Descripción"
          :clearable="statesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="statesStore.StateFilter.status"
          inline
          density="compact"
        >
          <v-radio
            label="Activo"
            color="green"
            value="1"
          />
          <v-radio
            label="Inactivo"
            color="red"
            value="0"
          />
          <v-radio
            label="Todos"
            color="blue"
            value="null"
          />
        </v-radio-group>
      </v-col>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <v-col
          cols="12"
          class="py-1"
        >
          <!-- @vue-expect-error the Pais type does not declare status -->
          <v-autocomplete
            label="Pais (*)"
            :items="appStore.itemsPais"
            v-model="statesStore.StateModel.id_pais"
            :readonly="statesStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="statesStore.StateModel.code"
            :readonly="statesStore.tipo != 'nuevo'"
            label="Código"
            v-if="statesStore.tipo != 'nuevo'"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="statesStore.StateModel.name"
            :readonly="statesStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) =>
                v.length < 50 ||
                'El nombre no puede exceder los 50 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="statesStore.StateModel.description"
            :readonly="statesStore.tipo == 'ver'"
            label="Descripción"
            :clearable="statesStore.tipo != 'ver'"
            :rules="[
              (v) =>
                v.length < 50 ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="statesStore.tipo == 'ver'"
            :label="`Estado: ${
              !!statesStore.StateModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="statesStore.StateModel.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          />
        </v-col>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="statesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="statesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="statesStore.tipo != 'filter'&& statesStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="statesStore.drawer = !statesStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
