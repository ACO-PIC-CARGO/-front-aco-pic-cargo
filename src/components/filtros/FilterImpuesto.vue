<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";

const rootStore = useStore();

const loading = ref(false);
const loadingEstado = ref(false);
const model = ref<{ valorcodigo?: string; description?: string }>({});
const noPorcentaje = ["04", "01", "02", "10", "11", "12"];
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => rootStore.state.masterusuarios.drawer);

watch(drawer, () => {
  model.value = { ...rootStore.state.masterusuarios.model };
});

function getName() {
  if (rootStore.state.masterusuarios.tipo == "ver") {
    return `Impuesto: ${model.value.valorcodigo}-${model.value.description} – Modo Vista`;
  }
  if (rootStore.state.masterusuarios.tipo == "nuevo") {
    return "Nuevo impuesto";
  }
  if (rootStore.state.masterusuarios.tipo == "editar") {
    return `Modificar Impuesto: ${model.value.valorcodigo}-${model.value.description}`;
  }
  if (rootStore.state.masterusuarios.tipo == "filter") {
    return "Filtrar Listado impuestos";
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ObtenerEstados(id_state: number | string) {
  loadingEstado.value = true;
  await rootStore.dispatch("_getState", id_state);
  rootStore.state.masterusuarios.model.id_state = "";
  loadingEstado.value = false;
}
async function Filtrar() {
  loading.value = true;
  await rootStore.dispatch("GetListImpuestos");
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
  await rootStore.dispatch("GetListImpuestos");

  loading.value = false;
  rootStore.state.masterusuarios.drawer = !rootStore.state.masterusuarios.drawer;
}
async function Aceptar() {
  //   if (this.rootStore.state.masterusuarios.tipo == "nuevo") {
  //     if ((await this.$refs.frmDML.validate()).valid) {
  //       this.loading = true;
  //       await this.setCity();
  //       await this.GetListImpuestos();
  //       this.loading = false;
  //     }
  //   }
  if (rootStore.state.masterusuarios.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await rootStore.dispatch("ActualizarMasterDetalle");
      await rootStore.dispatch("GetListImpuestos");
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
          label="Descripción"
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
            label="Código"
            v-if="rootStore.state.masterusuarios.tipo != 'nuevo'"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="rootStore.state.masterusuarios.model.description"
            :readonly="rootStore.state.masterusuarios.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="rootStore.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
          v-if="
            !noPorcentaje.includes(
              rootStore.state.masterusuarios.model.valorcodigo
            )
          "
        >
          <v-text-field
            v-model="rootStore.state.masterusuarios.model.codigo01"
            :readonly="rootStore.state.masterusuarios.tipo == 'ver'"
            label="Porcentaje (*)"
            :clearable="rootStore.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
            type="number"
            step="0.1"
            suffix="%"
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
