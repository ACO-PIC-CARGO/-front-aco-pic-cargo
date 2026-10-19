<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useBegendStore } from "@/stores/begend";
import type { FormBegend } from "@/types/catalogos";

const begendStore = useBegendStore();

const loading = ref(false);
const model = ref<FormBegend>({});
const errPosition = ref("");
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => begendStore.drawer);

watch(drawer, () => {
  model.value = { ...begendStore.model };
  frmDML.value!.resetValidation();
  errPosition.value = "";
});

function getName() {
  if (begendStore.tipo == "ver") {
    return `Categoria ${model.value.name} – Modo Vista`;
  }
  if (begendStore.tipo == "nuevo") {
    return "Nueva Categoría";
  }
  if (begendStore.tipo == "editar") {
    return `Modificar Categoría: ${model.value.name}`;
  }
  if (begendStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await begendStore.GetListBegend();
  loading.value = false;
  begendStore.drawer = !begendStore.drawer;
}
async function Limpiar() {
  begendStore.filtros = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
    id_state: "",
  };
  loading.value = true;
  await begendStore.GetListBegend();

  loading.value = false;
  begendStore.drawer = !begendStore.drawer;
}
async function Aceptar() {
  if (begendStore.tipo == "nuevo") {
    loading.value = true;
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid) {
        loading.value = true;
        await begendStore.setBegend();
        await begendStore.GetListBegend();
        loading.value = false;
      } else {
        loading.value = false;
      }
    }, 1000);
  }
  if (begendStore.tipo == "editar") {
    loading.value = true;
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid && !errPosition.value) {
        await begendStore.ActualizarBegend();
        await begendStore.GetListBegend();
        loading.value = false;
      } else {
        loading.value = false;
      }
    }, 1000);
  }
  if (begendStore.tipo == "ver") {
    begendStore.drawer = !begendStore.drawer;
  }
}
async function validate() {
  // getValidatePosition
  // this.loading = true;
  errPosition.value = "";
  if (begendStore.tipo == "nuevo") {
    const val = await begendStore.getValidatePositionBegend();
    errPosition.value = val!.mensaje;
    if (val!.estadoflag) {
      begendStore.model.position = "";
    }
  }
  if (begendStore.tipo == "editar") {
    const val = await begendStore.getValidatePositionActualizarBegend();
    errPosition.value = val!.mensaje;
    if (val!.estadoflag) {
      begendStore.model.position = "";
    }
  }
  // this.loading = false;
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
        @click="begendStore.drawer = !begendStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="begendStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="begendStore.filtros.code"
          label="Código"
          :clearable="begendStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="begendStore.filtros.name"
          label="Nombre"
          :clearable="begendStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="begendStore.filtros.description"
          label="Descripción"
          :clearable="begendStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="begendStore.filtros.position"
          label="Posición (Orden)"
          type="number"
          step="1"
          :clearable="begendStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="begendStore.filtros.color"
          label="Color"
          :clearable="begendStore.tipo != 'ver'"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="begendStore.filtros.status"
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
            v-model="begendStore.model.code"
            :readonly="begendStore.tipo != 'nuevo'"
            label="Código (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (v && v.length < 4) ||
                'El código no puede exceder los 3 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="begendStore.model.name"
            :readonly="begendStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (v && v.length < 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="begendStore.model.description"
            :readonly="begendStore.tipo == 'ver'"
            label="Descripción"
            :clearable="begendStore.tipo != 'ver'"
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
          <v-text-field
            v-model="begendStore.model.position"
            type="number"
            step="1"
            :readonly="begendStore.tipo == 'ver'"
            label="Posición (Orden)  (*)"
            :clearable="begendStore.tipo != 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @blur="validate()"
            :error-messages="errPosition"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="begendStore.model.color"
            :readonly="begendStore.tipo == 'ver'"
            label="Color"
            :clearable="begendStore.tipo != 'ver'"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="begendStore.tipo == 'ver'"
            :label="`Estado: ${
              !!begendStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="begendStore.model.status"
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
        v-if="begendStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="begendStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          begendStore.tipo != 'filter' &&
            begendStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="begendStore.drawer = !begendStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
