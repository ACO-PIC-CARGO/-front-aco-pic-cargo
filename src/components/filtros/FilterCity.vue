<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useCityStore } from "@/stores/city";
import type { Ciudad } from "@/types/catalogos";

const cityStore = useCityStore();
const appStore = useAppStore();

const loading = ref(false);
const loadingEstado = ref(false);
const model = ref<Partial<Ciudad>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => cityStore.drawer);

watch(drawer, () => {
  model.value = { ...cityStore.model };

  frmDML.value!.resetValidation();
});

function getName() {
  if (cityStore.tipo == "ver") {
    return `Ciudad ${model.value.name} – Modo Vista`;
  }
  if (cityStore.tipo == "nuevo") {
    return "Nuevo ciudades";
  }
  if (cityStore.tipo == "editar") {
    return `Modificar Ciudad: ${model.value.name}`;
  }
  if (cityStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function ObtenerEstados(id_state?: number | string | null) {
  loadingEstado.value = true;
  await appStore._getState(id_state);
  cityStore.model.id_state = "";
  loadingEstado.value = false;
}
async function Filtrar() {
  loading.value = true;
  await cityStore.GetListCity();
  loading.value = false;
  cityStore.drawer = !cityStore.drawer;
}
async function Limpiar() {
  cityStore.filtros = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
    id_state: "",
  };
  loading.value = true;
  await cityStore.GetListCity();

  loading.value = false;
  cityStore.drawer = !cityStore.drawer;
}
async function Aceptar() {
  if (cityStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await cityStore.setCity();
      await cityStore.GetListCity();
      loading.value = false;
    }
  }
  if (cityStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await cityStore.ActualizarCity();
      await cityStore.GetListCity();
    }
    loading.value = false;
  }
  if (cityStore.tipo == "ver") {
    cityStore.drawer = !cityStore.drawer;
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
        @click="cityStore.drawer = !cityStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="cityStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-autocomplete
          label="Pais"
          :items="appStore.itemsPais"
          v-model="cityStore.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="cityStore.tipo != 'ver'"
          @update:model-value="ObtenerEstados(cityStore.filtros.id_pais)"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-autocomplete
          label="Estado"
          :items="appStore.itemsState"
          v-model="cityStore.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="cityStore.tipo != 'ver'"
          :loading="loadingEstado"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="cityStore.filtros.code"
          label="Código"
          :clearable="cityStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="cityStore.filtros.name"
          label="Nombre"
          :clearable="cityStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="cityStore.filtros.description"
          label="Descripción"
          :clearable="cityStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="cityStore.filtros.status"
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
          <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
          <v-autocomplete
            label="Pais (*)"
            :items="appStore.itemsPais"
            v-model="cityStore.model.id_pais"
            :readonly="cityStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados(cityStore.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>
        <div
          class="col-12 py-1"
          v-if="!!cityStore.model.id_pais"
        >
          <v-autocomplete
            label="Estado (*)"
            :items="appStore.itemsState"
            v-model="cityStore.model.id_state"
            :readonly="cityStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingEstado"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </div>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="cityStore.model.code"
            :readonly="cityStore.tipo != 'nuevo'"
            label="Código"
            v-if="cityStore.tipo != 'nuevo'"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="cityStore.model.name"
            :readonly="cityStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) =>
                v.length < 255 ||
                'El nombre no puede exceder los 255 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="cityStore.model.description"
            :readonly="cityStore.tipo == 'ver'"
            label="Descripción"
            :clearable="cityStore.tipo != 'ver'"
            :rules="[
              (v) =>
                v.length < 255 ||
                'La descripción no puede exceder los 255 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="cityStore.tipo == 'ver'"
            :label="`Estado: ${
              !!cityStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="cityStore.model.status"
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
        v-if="cityStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="cityStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="cityStore.tipo != 'filter'&& cityStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="cityStore.drawer = !cityStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
