<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useTypepaymentStore } from "@/stores/typepayment";
import type { TipoPago } from "@/types/catalogos";

const typepaymentStore = useTypepaymentStore();

const loading = ref(false);
const model = ref<Partial<TipoPago>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => typepaymentStore.drawer);

watch(drawer, () => {
  model.value = { ...typepaymentStore.model };
  frmDML.value!.resetValidation();
});

function getName() {
  if (typepaymentStore.tipo == "ver") {
    return `Tipos de Pago ${model.value.name} – Modo Vista`;
  }
  if (typepaymentStore.tipo == "nuevo") {
    return "Nuevo Tipos de Pago";
  }
  if (typepaymentStore.tipo == "editar") {
    return `Modificar Tipo de Pago: ${model.value.name}`;
  }
  if (typepaymentStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await typepaymentStore.GetListTypePayment();
  loading.value = false;
  typepaymentStore.drawer = !typepaymentStore.drawer;
}
async function Limpiar() {
  typepaymentStore.filtros = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: true,
    id_state: "",
  };
  loading.value = true;
  await typepaymentStore.GetListTypePayment();

  loading.value = false;
  typepaymentStore.drawer = !typepaymentStore.drawer;
}
async function Aceptar() {
  if (typepaymentStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await typepaymentStore.setTypePayment();
      await typepaymentStore.GetListTypePayment();
      loading.value = false;
    }
  }
  if (typepaymentStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await typepaymentStore.ActualizarTypePayment();
      await typepaymentStore.GetListTypePayment();
    }
    loading.value = false;
  }
  if (typepaymentStore.tipo == "ver") {
    typepaymentStore.drawer = !typepaymentStore.drawer;
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
          typepaymentStore.drawer = !typepaymentStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="typepaymentStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="typepaymentStore.filtros.code"
          label="Código"
          :clearable="typepaymentStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="typepaymentStore.filtros.name"
          label="Nombre"
          :clearable="typepaymentStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="typepaymentStore.filtros.description"
          label="Descripción"
          :clearable="typepaymentStore.tipo != 'ver'"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="typepaymentStore.filtros.status"
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
          <v-text-field
            v-model="typepaymentStore.model.code"
            readonly
            v-if="typepaymentStore.tipo != 'nuevo'"
            label="Código"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="typepaymentStore.model.name"
            :readonly="typepaymentStore.tipo == 'ver'"
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
            v-model="typepaymentStore.model.description"
            :readonly="typepaymentStore.tipo == 'ver'"
            label="Descripción"
            :clearable="typepaymentStore.tipo != 'ver'"
            :rules="[
              (v) =>
                (!!v ? v.length < 50 : true) ||
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
            :readonly="typepaymentStore.tipo == 'ver'"
            :label="`Estado: ${
              !!typepaymentStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="typepaymentStore.model.status"
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
        v-if="typepaymentStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="typepaymentStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="typepaymentStore.tipo != 'filter' && typepaymentStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          typepaymentStore.drawer = !typepaymentStore.drawer
        "
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
