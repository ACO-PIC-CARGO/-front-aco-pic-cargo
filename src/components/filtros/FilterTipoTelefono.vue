<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";

const rootStore = useStore();

const loading = ref(false);
const model = ref<{ valorcodigo?: string; description?: string }>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => rootStore.state.masterusuarios.drawer);

watch(drawer, () => {
  model.value = { ...rootStore.state.masterusuarios.model };
});

function getName() {
  if (rootStore.state.masterusuarios.tipo == "ver") {
    return `Tipo Teléfono: ${model.value.valorcodigo}-${model.value.description} – Modo Vista`;
  }
  if (rootStore.state.masterusuarios.tipo == "nuevo") {
    return "Nuevo tipo teléfono";
  }
  if (rootStore.state.masterusuarios.tipo == "editar") {
    return `Modificar Tipo: ${model.value.description}`;
  }
  if (rootStore.state.masterusuarios.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function Filtrar() {
  loading.value = true;
  await rootStore.dispatch("GetListTipoTelefono");
  loading.value = false;
  rootStore.state.masterusuarios.drawer = !rootStore.state.masterusuarios.drawer;
}
async function Limpiar() {
  rootStore.state.masterusuarios.filtros = {
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    escomunflag: false,
  };
  loading.value = true;
  await rootStore.dispatch("GetListTipoTelefono");

  loading.value = false;
  rootStore.state.masterusuarios.drawer = !rootStore.state.masterusuarios.drawer;
}
async function Aceptar() {
  if (rootStore.state.masterusuarios.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await rootStore.dispatch("RegistrarMasterDetalleTipoTelefono");
      await rootStore.dispatch("GetListTipoTelefono");
      loading.value = false;
    }
  }
  if (rootStore.state.masterusuarios.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await rootStore.dispatch("ActualizarMasterDetalle");
      await rootStore.dispatch("GetListTipoTelefono");
    }
    loading.value = false;
  }
  if (rootStore.state.masterusuarios.tipo == "ver") {
    rootStore.state.masterusuarios.drawer = !rootStore.state.masterusuarios.drawer;
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
          rootStore.state.masterusuarios.drawer =
            !rootStore.state.masterusuarios.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="rootStore.state.masterusuarios.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="rootStore.state.masterusuarios.filtros.valorcodigo"
          label="Código"
          :clearable="rootStore.state.masterusuarios.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="rootStore.state.masterusuarios.filtros.description"
          label="Nombre"
          :clearable="rootStore.state.masterusuarios.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="rootStore.state.masterusuarios.filtros.status"
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
            v-model="rootStore.state.masterusuarios.model.valorcodigo"
            :readonly="rootStore.state.masterusuarios.tipo != 'nuevo'"
            label="Código (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 3) ||
                'El código no puede tener más de 3 carácteres',
            ]"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="rootStore.state.masterusuarios.model.description"
            :readonly="rootStore.state.masterusuarios.tipo == 'ver'"
            label="Nombre (*)"
            :clearable="rootStore.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 50) ||
                'El nombre no puede tener más de  50 carácteres',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-switch
            :readonly="rootStore.state.masterusuarios.tipo == 'ver'"
            :label="`Estado: ${
              !!rootStore.state.masterusuarios.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="rootStore.state.masterusuarios.model.status"
          />
        </v-col>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="rootStore.state.masterusuarios.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="rootStore.state.masterusuarios.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="rootStore.state.masterusuarios.tipo != 'filter' && rootStore.state.masterusuarios.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          rootStore.state.masterusuarios.drawer =
            !rootStore.state.masterusuarios.drawer
        "
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
