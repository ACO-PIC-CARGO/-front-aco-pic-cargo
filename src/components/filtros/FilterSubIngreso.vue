<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubingresoStore } from "@/stores/subingreso";
import type { SubIngreso } from "@/types/catalogos";

const ingresosStore = useIngresosStore();
const subingresoStore = useSubingresoStore();

const loading = ref(false);
const model = ref<Partial<SubIngreso>>({});
const err = ref("");
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => subingresoStore.drawer);

watch(drawer, () => {
  model.value = { ...subingresoStore.model };
  frmDML.value!.resetValidation();
});

function getName() {
  if (subingresoStore.tipo == "ver") {
    return `Tipo de Subingreso ${model.value.description} – Modo Vista`;
  }
  if (subingresoStore.tipo == "nuevo") {
    return "Nuevo Tipo de Subingreso";
  }
  if (subingresoStore.tipo == "editar") {
    return `Modificar Tipo de Subingreso: ${model.value.description}`;
  }
  if (subingresoStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await subingresoStore.GetListSubIngreso();
  loading.value = false;
  subingresoStore.drawer = !subingresoStore.drawer;
}
async function Limpiar() {
  subingresoStore.filtros = {
    id: "",
    id_ingreso: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: "null",
    mostrarflag: "null",
  };
  loading.value = true;
  await subingresoStore.GetListSubIngreso();

  loading.value = false;
  subingresoStore.drawer = !subingresoStore.drawer;
}
async function validateCodigo() {
  err.value = "";
  if (subingresoStore.tipo == "nuevo") {
    const val = await subingresoStore.getValidateCodeSubIngreso();
    err.value = val!.mensaje;
    if (val!.estadoflag) {
      subingresoStore.model.code = "";
    }
  }
}
async function Aceptar() {
  if (subingresoStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await subingresoStore.setSubIngreso();
      await subingresoStore.GetListSubIngreso();
      loading.value = false;
    }
  }
  if (subingresoStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await subingresoStore.ActualizarSubIngreso();
      await subingresoStore.GetListSubIngreso();
    }
    loading.value = false;
  }
  if (subingresoStore.tipo == "ver") {
    subingresoStore.drawer = !subingresoStore.drawer;
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
        @click="
          subingresoStore.drawer = !subingresoStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="subingresoStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <v-autocomplete
          label="Tipo de Ingreso"
          :items="ingresosStore.list"
          v-model="subingresoStore.filtros.id_ingreso"
          item-title="descripcion"
          item-value="id"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="subingresoStore.filtros.code"
          label="Código"
          :clearable="subingresoStore.tipo != 'ver'"
        />
      </v-col>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subingreso.filtros.name"
          label="Nombre"
          :clearable="$store.state.subingreso.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="subingresoStore.filtros.description"
          label="Descripción"
          :clearable="subingresoStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Se calcula en reportes</span>
        <v-radio-group
          v-model="subingresoStore.filtros.calculoflag"
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
        <span> Se muestra en reportes</span>
        <v-radio-group
          v-model="subingresoStore.filtros.mostrarflag"
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
          v-model="subingresoStore.filtros.status"
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
            label="Tipo de Ingreso (*)"
            :items="ingresosStore.list"
            v-model="subingresoStore.model.id_ingreso"
            item-title="descripcion"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="subingresoStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="subingresoStore.model.code"
            :readonly="subingresoStore.tipo != 'nuevo'"
            label="Código (*)"
            @blur="validateCodigo()"
            :error-messages="err"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length) < 5 ||
                'El codigo no puede exceder los 5 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="subingresoStore.model.description"
            :readonly="subingresoStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="subingresoStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'La descripción no puede exceder los 255 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-checkbox
            label="Se calcula en Reportes"
            v-model="subingresoStore.model.calculoflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="subingresoStore.model.mostrarflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="subingresoStore.tipo == 'ver'"
            :label="`Estado: ${
              !!subingresoStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="subingresoStore.model.status"
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
        v-if="subingresoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="subingresoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="subingresoStore.tipo != 'filter' && subingresoStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          subingresoStore.drawer = !subingresoStore.drawer
        "
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>

</style>
