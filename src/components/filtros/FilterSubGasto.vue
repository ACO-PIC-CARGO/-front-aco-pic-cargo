<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useGastosStore } from "@/stores/gastos";
import { useSubgastoStore } from "@/stores/subgasto";
import type { SubGasto } from "@/types/catalogos";

const gastosStore = useGastosStore();
const subgastoStore = useSubgastoStore();

const loading = ref(false);
const model = ref<Partial<SubGasto>>({});
const err = ref("");
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => subgastoStore.drawer);

watch(drawer, () => {
  model.value = { ...subgastoStore.model };
  frmDML.value!.resetValidation();
});

function getName() {
  if (subgastoStore.tipo == "ver") {
    return `Tipo de Subgasto ${model.value.description} – Modo Vista`;
  }
  if (subgastoStore.tipo == "nuevo") {
    return "Nuevo Tipo de Subgasto";
  }
  if (subgastoStore.tipo == "editar") {
    return `Modificar Tipo Subgasto: ${model.value.description}`;
  }
  if (subgastoStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await subgastoStore.GetListSubGasto();
  loading.value = false;
  subgastoStore.drawer = !subgastoStore.drawer;
}
async function Limpiar() {
  subgastoStore.filtros = {
    id: "",
    id_gasto: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: "null",
    mostrarflag: "null",
  };
  loading.value = true;
  await subgastoStore.GetListSubGasto();

  loading.value = false;
  subgastoStore.drawer = !subgastoStore.drawer;
}
async function validateCodigo() {
  err.value = "";
  if (subgastoStore.tipo == "nuevo") {
    const val = await subgastoStore.getValidateCodeSubGasto();
    err.value = val!.mensaje;
    if (val!.estadoflag) {
      subgastoStore.model.code = "";
    }
  }
}
async function Aceptar() {
  if (subgastoStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await subgastoStore.setSubGasto();
      await subgastoStore.GetListSubGasto();
      loading.value = false;
    }
  }
  if (subgastoStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await subgastoStore.ActualizarSubGasto();
      await subgastoStore.GetListSubGasto();
    }
    loading.value = false;
  }
  if (subgastoStore.tipo == "ver") {
    subgastoStore.drawer = !subgastoStore.drawer;
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
        @click="subgastoStore.drawer = !subgastoStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="subgastoStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <v-autocomplete
          label="Tipo de Gasto"
          :items="gastosStore.list"
          v-model="subgastoStore.filtros.id_gasto"
          item-title="description"
          item-value="id"
          clearable
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="subgastoStore.filtros.code"
          label="Código"
          :clearable="subgastoStore.tipo != 'ver'"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="subgastoStore.filtros.description"
          label="Descripción"
          :clearable="subgastoStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Se calcula en Reportes</span>
        <v-radio-group
          v-model="subgastoStore.filtros.calculoflag"
          inline
          density="compact"
        >
          <v-radio
            label="Si"
            color="green"
            :value="true"
          />
          <v-radio
            label="No"
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
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Se muestra en Reportes</span>
        <v-radio-group
          v-model="subgastoStore.filtros.mostrarflag"
          inline
          density="compact"
        >
          <v-radio
            label="Si"
            color="green"
            :value="true"
          />
          <v-radio
            label="No"
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
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="subgastoStore.filtros.status"
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
    <v-card-text v-else>
      <v-form ref="frmDML">
        <v-col
          cols="12"
          class="py-1"
        >
          <v-autocomplete
            label="Tipo de Gasto (*)"
            :items="gastosStore.list"
            v-model="subgastoStore.model.id_gasto"
            item-title="description"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="subgastoStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: !item.status })"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="subgastoStore.model.code"
            :readonly="subgastoStore.tipo != 'nuevo'"
            label="Código (*)"
            @blur="validateCodigo()"
            :error-messages="err"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 5) ||
                'El codigo no puede exceder los 5 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="subgastoStore.model.description"
            :readonly="subgastoStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="subgastoStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 50) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-checkbox
            label="Se calcula en Reportes"
            v-model="subgastoStore.model.calculoflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="subgastoStore.model.mostrarflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="subgastoStore.tipo == 'ver'"
            :label="`Estado: ${
              !!subgastoStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="subgastoStore.model.status"
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
        v-if="subgastoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="subgastoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="subgastoStore.tipo != 'filter'&& subgastoStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="subgastoStore.drawer = !subgastoStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
