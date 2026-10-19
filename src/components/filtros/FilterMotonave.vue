<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useMotonaveStore } from "@/stores/motonave";
import type { Motonave } from "@/types/catalogos";

const motonaveStore = useMotonaveStore();

const loading = ref(false);
const MotonaveModel = ref<Partial<Motonave>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => motonaveStore.drawer);

watch(drawer, () => {
  MotonaveModel.value = { ...motonaveStore.MotonaveModel };
});

function getName() {
  if (motonaveStore.tipo == "ver") {
    return `Motonave ${MotonaveModel.value.name} – Modo Vista`;
  }
  if (motonaveStore.tipo == "nuevo") {
    return "Nuevo Motonave";
  }
  if (motonaveStore.tipo == "editar") {
    return `Modificar Motonave: ${MotonaveModel.value.name}`;
  }
  if (motonaveStore.tipo == "filter") {
    return "Filtrar Regitros";
  }
}
async function Filtrar() {
  loading.value = true;
  await motonaveStore.GetListMotonave();
  loading.value = false;
  motonaveStore.drawer = !motonaveStore.drawer;
}
async function Limpiar() {
  motonaveStore.MotonaveFilter = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  };
  loading.value = true;
  await motonaveStore.GetListMotonave();
  loading.value = false;
  motonaveStore.drawer = !motonaveStore.drawer;
}
async function Aceptar() {
  if (motonaveStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await motonaveStore.setMotonave();
      await motonaveStore.GetListMotonave();
      loading.value = false;
    }
  }
  if (motonaveStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await motonaveStore.ActualizarMotonave();
      await motonaveStore.GetListMotonave();
    }
    loading.value = false;
  }
  if (motonaveStore.tipo == "ver") {
    motonaveStore.drawer = !motonaveStore.drawer;
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
        @click="motonaveStore.drawer = !motonaveStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="motonaveStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="motonaveStore.MotonaveFilter.name"
          label="Nombre"
          :clearable="motonaveStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="motonaveStore.MotonaveFilter.description"
          label="Descripción"
          :clearable="motonaveStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="motonaveStore.MotonaveFilter.status"
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
          <v-text-field
            v-model="motonaveStore.MotonaveModel.name"
            :readonly="motonaveStore.tipo == 'ver'"
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
            v-model="motonaveStore.MotonaveModel.description"
            :readonly="motonaveStore.tipo == 'ver'"
            label="Descripción"
            :clearable="motonaveStore.tipo != 'ver'"
            :rules="[
              (v) =>
                !v ||
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
            :readonly="motonaveStore.tipo == 'ver'"
            :label="`Estado: ${
              !!motonaveStore.MotonaveModel.status
                ? 'Activo'
                : 'Inactivo'
            }`"
            color="success"
            v-model="motonaveStore.MotonaveModel.status"
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
        v-if="motonaveStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="motonaveStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="motonaveStore.tipo != 'filter' && motonaveStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="motonaveStore.drawer = !motonaveStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
