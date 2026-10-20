<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { usePositionStore } from "@/stores/position";
import type { FormPosicion } from "@/types/seguridad";

const positionStore = usePositionStore();

const loading = ref(false);
const model = ref<FormPosicion>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => positionStore.drawer);

// Not defined anywhere, so calling these throws.
const setTown = undefined as unknown as () => Promise<void>;
const ActualizarTown = undefined as unknown as () => Promise<void>;

watch(drawer, () => {
  model.value = { ...positionStore.model };
});

function getName() {
  if (positionStore.tipo == "ver") {
    return `Distrito ${model.value.name} – Modo Vista`;
  }
  if (positionStore.tipo == "nuevo") {
    return "Nuevo distrito";
  }
  if (positionStore.tipo == "editar") {
    return `Modificar Distrito: ${model.value.name}`;
  }
  if (positionStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await positionStore.GetListPosition();
  loading.value = false;
  positionStore.drawer = !positionStore.drawer;
}
async function Limpiar() {
  positionStore.filtros = {
    code: "",
    name: "",
    description: "",
    estado: true,
    id_state: "",
  };
  loading.value = true;
  await positionStore.GetListPosition();

  loading.value = false;
  positionStore.drawer = !positionStore.drawer;
}
async function Aceptar() {
  if (positionStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await setTown();
      await positionStore.GetListPosition();
      loading.value = false;
    }
  }
  if (positionStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await ActualizarTown();
      await positionStore.GetListPosition();
    }
    loading.value = false;
  }
  if (positionStore.tipo == "ver") {
    positionStore.drawer = !positionStore.drawer;
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
        @click="positionStore.drawer = !positionStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="positionStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="positionStore.filtros.code"
          label="Código"
          :clearable="positionStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="positionStore.filtros.name"
          label="Nombre"
          :clearable="positionStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="positionStore.filtros.description"
          label="Descripción"
          :clearable="positionStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="positionStore.filtros.estado"
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
            value="null"
          />
        </v-radio-group>
      </v-col>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="positionStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="positionStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="positionStore.tipo != 'filter' && positionStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="positionStore.drawer = !positionStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
