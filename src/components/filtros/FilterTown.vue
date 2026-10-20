<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useTownStore } from "@/stores/town";
import type { Distrito } from "@/types/catalogos";

const townStore = useTownStore();
const appStore = useAppStore();

const loading = ref(false);
const loadingEstado = ref(false);
const loadingCity = ref(false);
const model = ref<Partial<Distrito>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => townStore.drawer);

watch(drawer, () => {
  model.value = { ...townStore.model };

  frmDML.value!.resetValidation();
});

function getName() {
  if (townStore.tipo == "ver") {
    return `Distrito ${model.value.name} – Modo Vista`;
  }
  if (townStore.tipo == "nuevo") {
    return "Nuevo distrito";
  }
  if (townStore.tipo == "editar") {
    return `Modificar Distrito: ${model.value.name}`;
  }
  if (townStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function ObtenerEstados(id_pais?: number | string | null) {
  loadingEstado.value = true;
  await appStore._getState(id_pais);
  townStore.model.id_state = "";
  townStore.model.id_city = "";
  loadingEstado.value = false;
}
async function ObtenerCity(id_state?: number | string | null) {
  loadingCity.value = true;
  await appStore._getCity(id_state);
  townStore.model.id_city = "";
  loadingCity.value = false;
}
async function Filtrar() {
  loading.value = true;
  await townStore.GetListTown();
  loading.value = false;
  townStore.drawer = !townStore.drawer;
}
async function Limpiar() {
  townStore.filtros = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
    id_state: "",
  };
  loading.value = true;
  await townStore.GetListTown();

  loading.value = false;
  townStore.drawer = !townStore.drawer;
}
async function Aceptar() {
  if (townStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await townStore.setTown();
      await townStore.GetListTown();
      loading.value = false;
    }
  }
  if (townStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await townStore.ActualizarTown();
      await townStore.GetListTown();
    }
    loading.value = false;
  }
  if (townStore.tipo == "ver") {
    townStore.drawer = !townStore.drawer;
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
        @click="townStore.drawer = !townStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="townStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-autocomplete
          label="Pais"
          :items="appStore.itemsPais"
          v-model="townStore.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          @update:model-value="ObtenerEstados(townStore.filtros.id_pais)"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-autocomplete
          label="Estado (Región)"
          :items="appStore.itemsState"
          v-model="townStore.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          :loading="loadingEstado"
          @update:model-value="ObtenerCity(townStore.filtros.id_state)"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-autocomplete
          label="Ciudad"
          :items="appStore.itemsCity"
          v-model="townStore.filtros.id_city"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          :loading="loadingEstado"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="townStore.filtros.code"
          label="Código"
          :clearable="townStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="townStore.filtros.name"
          label="Nombre"
          :clearable="townStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="townStore.filtros.description"
          label="Descripción"
          :clearable="townStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="townStore.filtros.status"
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
            v-model="townStore.model.id_pais"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados(townStore.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
          v-if="!!townStore.model.id_pais"
        >
          <v-autocomplete
            label="Estado (Región) (*)"
            :items="appStore.itemsState"
            v-model="townStore.model.id_state"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingEstado"
            @update:model-value="ObtenerCity(townStore.model.id_state)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
          v-if="!!townStore.model.id_state"
        >
          <v-autocomplete
            label="Ciudad (*)"
            :items="appStore.itemsCity"
            v-model="townStore.model.id_city"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingCity"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="townStore.model.code"
            :readonly="townStore.tipo != 'nuevo'"
            label="Código"
            v-if="townStore.tipo != 'nuevo'"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="townStore.model.name"
            :readonly="townStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'El nombre no puede exceder los 255 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="townStore.model.description"
            :readonly="townStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="townStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'El nombre no puede exceder los 255 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="townStore.tipo == 'ver'"
            :label="`Estado: ${
              !!townStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="townStore.model.status"
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
        v-if="townStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="townStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          townStore.tipo != 'filter' && townStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="townStore.drawer = !townStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
