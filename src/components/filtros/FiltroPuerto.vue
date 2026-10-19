<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import { usePuertoStore } from "@/stores/puerto";
import { useTransportStore } from "@/stores/transport";
import type { Puerto } from "@/types/cotizacion";

const puertoStore = usePuertoStore();
const transportStore = useTransportStore();
const rootStore = useStore();

const loading = ref(false);
const PortModel = ref<Puerto>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => puertoStore.drawer);

watch(drawer, () => {
  PortModel.value = { ...puertoStore.PortModel };
  frmDML.value!.resetValidation();
});

function getName() {
  if (puertoStore.tipo == "ver") {
    return `Puerto ${PortModel.value.name} – Modo Vista`;
  }
  if (puertoStore.tipo == "nuevo") {
    return "Nuevo Puerto";
  }
  if (puertoStore.tipo == "editar") {
    return `Modificar Puerto: ${PortModel.value.name}`;
  }
  if (puertoStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function Filtrar() {
  loading.value = true;
  await puertoStore.GetListPort();
  loading.value = false;
  puertoStore.drawer = !puertoStore.drawer;
}
async function Limpiar() {
  puertoStore.PortFilter = {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  };
  loading.value = true;
  await puertoStore.GetListPort();
  loading.value = false;
  puertoStore.drawer = !puertoStore.drawer;
}
async function Aceptar() {
  if (puertoStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await puertoStore.setPuerto();
      await puertoStore.GetListPort();
      loading.value = false;
    }
  }
  if (puertoStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await puertoStore.ActualizarPuerto();
      await puertoStore.GetListPort();
    }
    loading.value = false;
  }
  if (puertoStore.tipo == "ver") {
    puertoStore.drawer = !puertoStore.drawer;
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
        @click="puertoStore.drawer = !puertoStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="puertoStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-autocomplete
          label="Tipo Transporte"
          :items="transportStore.list"
          v-model="puertoStore.PortFilter.id_transporte"
          item-title="name"
          item-value="id"
          :clearable="puertoStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-autocomplete
          label="Pais"
          :items="rootStore.state.itemsPais"
          v-model="puertoStore.PortFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="puertoStore.tipo != 'ver'"
        />
      </v-col>

      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.puerto.PortFilter.code"
          label="Código"
          :clearable="$store.state.puerto.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="puertoStore.PortFilter.name"
          label="Nombre"
          :clearable="puertoStore.tipo != 'ver'"
        />
      </v-col>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.puerto.PortFilter.description"
          label="Descripción"
          :clearable="$store.state.puerto.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="puertoStore.PortFilter.status"
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
          <v-autocomplete
            label="Tipo Transporte (*)"
            :items="transportStore.list"
            v-model="puertoStore.PortModel.id_transporte"
            :readonly="puertoStore.tipo != 'nuevo'"
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
          <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
          <v-autocomplete
            label="Pais (*)"
            :items="rootStore.state.itemsPais"
            v-model="puertoStore.PortModel.id_pais"
            :readonly="puertoStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          />
        </v-col>

        <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.puerto.PortModel.code"
            :readonly="$store.state.puerto.tipo != 'nuevo'"
            label="Código (*)"
            :rules="[
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          ></v-text-field>
        </div> -->
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="puertoStore.PortModel.name"
            :readonly="puertoStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.puerto.PortModel.description"
            :readonly="$store.state.puerto.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.puerto.tipo != 'ver'"
            :rules="[
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div> -->
        <!-- <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.puerto.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.puerto.PortModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.puerto.PortModel.status"
          ></v-switch>
        </div> -->
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="puertoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="puertoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          puertoStore.tipo != 'filter' &&
            puertoStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="puertoStore.drawer = !puertoStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
