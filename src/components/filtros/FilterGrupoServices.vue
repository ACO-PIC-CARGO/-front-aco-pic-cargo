<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useGroupservicesStore } from "@/stores/groupservices";
import { useItemServicesStore } from "@/stores/itemServices";
import type { ItemServicio } from "@/types/catalogos";

const groupservicesStore = useGroupservicesStore();
const itemServicesStore = useItemServicesStore();

const loading = ref(false);
const model = ref<Partial<ItemServicio>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => itemServicesStore.drawer);

watch(drawer, () => {
  model.value = { ...itemServicesStore.model };

  setTimeout(() => {
    frmDML.value!.resetValidation();
  }, 10);
});

function getName() {
  if (itemServicesStore.tipo == "ver") {
    return `Detalle de Servicio ${model.value.name} – Modo Vista`;
  }
  if (itemServicesStore.tipo == "nuevo") {
    return "Nuevo Detalle de Servicio";
  }
  if (itemServicesStore.tipo == "editar") {
    return `Modificar Detalle de Servicio: ${model.value.name}`;
  }
  if (itemServicesStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await itemServicesStore.GetListItemServices();
  loading.value = false;
  itemServicesStore.drawer = !itemServicesStore.drawer;
}
async function Limpiar() {
  itemServicesStore.filtros = {
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    id_branch: "",
    status: 1,
  };
  loading.value = true;
  await itemServicesStore.GetListItemServices();

  loading.value = false;
  itemServicesStore.drawer = !itemServicesStore.drawer;
}
async function Aceptar() {
  if (itemServicesStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await itemServicesStore.setItemServices();
      await itemServicesStore.GetListItemServices();
      loading.value = false;
    }
  }
  if (itemServicesStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await itemServicesStore.ActualizarItemServices();
      await itemServicesStore.GetListItemServices();
    }
    loading.value = false;
  }
  if (itemServicesStore.tipo == "ver") {
    itemServicesStore.drawer = !itemServicesStore.drawer;
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
          itemServicesStore.drawer = !itemServicesStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="itemServicesStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-autocomplete
          label="Servicio"
          :items="groupservicesStore.list"
          v-model="itemServicesStore.filtros.id_groupservices"
          item-title="name"
          item-value="id"
          :clearable="itemServicesStore.tipo != 'ver'"
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="itemServicesStore.filtros.code"
          label="Código"
          :clearable="itemServicesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="itemServicesStore.filtros.name"
          label="Nombre"
          :clearable="itemServicesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="itemServicesStore.filtros.description"
          label="Descripción"
          :clearable="itemServicesStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="itemServicesStore.filtros.status"
          inline
          density="compact"
        >
          <v-radio
            label="Activo"
            color="green"
            :value="1"
          />
          <v-radio
            label="Inactivo"
            color="red"
            :value="0"
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
            label="Servicios (*)"
            :items="groupservicesStore.list"
            v-model="itemServicesStore.model.id_groupservices"
            :readonly="itemServicesStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="itemServicesStore.model.code"
            :readonly="itemServicesStore.tipo == 'ver'"
            label="Código (*)"
            :rules="[
              (v) => !!v || 'Dato requerido',
              (v) => /^[0-9]+$/.test(v) || 'El dato debe contener solo números',
              (v) =>
                (!!v && v.length <= 3) ||
                'El dato debe contener una longitud máxima de 3',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="itemServicesStore.model.name"
            :readonly="itemServicesStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="itemServicesStore.model.description"
            :readonly="itemServicesStore.tipo == 'ver'"
            label="Descripción"
            :clearable="itemServicesStore.tipo != 'ver'"
            :rules="[
              (v) =>
                !v ||
                v.length <= 50 ||
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
            :readonly="itemServicesStore.tipo == 'ver'"
            :label="`Estado: ${
              !!itemServicesStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="itemServicesStore.model.status"
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
        v-if="itemServicesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="itemServicesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="itemServicesStore.tipo != 'filter' && itemServicesStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          itemServicesStore.drawer = !itemServicesStore.drawer
        "
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
