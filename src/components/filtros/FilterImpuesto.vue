<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const appStore = useAppStore();
const masterusuariosStore = useMasterusuariosStore();

const loading = ref(false);
const loadingEstado = ref(false);
const model = ref<{ valorcodigo?: string; description?: string }>({});
const noPorcentaje = ["04", "01", "02", "10", "11", "12"];
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => masterusuariosStore.drawer);

watch(drawer, () => {
  model.value = { ...masterusuariosStore.model };
});

function getName() {
  if (masterusuariosStore.tipo == "ver") {
    return `Impuesto: ${model.value.valorcodigo}-${model.value.description} – Modo Vista`;
  }
  if (masterusuariosStore.tipo == "nuevo") {
    return "Nuevo impuesto";
  }
  if (masterusuariosStore.tipo == "editar") {
    return `Modificar Impuesto: ${model.value.valorcodigo}-${model.value.description}`;
  }
  if (masterusuariosStore.tipo == "filter") {
    return "Filtrar Listado impuestos";
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ObtenerEstados(id_state: number | string) {
  loadingEstado.value = true;
  await appStore._getState(id_state);
  masterusuariosStore.model.id_state = "";
  loadingEstado.value = false;
}
async function Filtrar() {
  loading.value = true;
  await masterusuariosStore.GetListImpuestos();
  loading.value = false;
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function Limpiar() {
  masterusuariosStore.filtros = {
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
  await masterusuariosStore.GetListImpuestos();

  loading.value = false;
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function Aceptar() {
  //   if (this.$store.state.masterusuarios.tipo == "nuevo") {
  //     if ((await this.$refs.frmDML.validate()).valid) {
  //       this.loading = true;
  //       await this.setCity();
  //       await this.GetListImpuestos();
  //       this.loading = false;
  //     }
  //   }
  if (masterusuariosStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await masterusuariosStore.ActualizarMasterDetalle();
      await masterusuariosStore.GetListImpuestos();
    }
    loading.value = false;
  }
  if (masterusuariosStore.tipo == "ver") {
    masterusuariosStore.drawer = !masterusuariosStore.drawer;
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
          masterusuariosStore.drawer =
            !masterusuariosStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="masterusuariosStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="masterusuariosStore.filtros.valorcodigo"
          label="Código"
          :clearable="masterusuariosStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
        <v-text-field
          v-model="masterusuariosStore.filtros.description"
          label="Descripción"
          :clearable="masterusuariosStore.tipo != 'ver'"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <span> Estado</span>
        <v-radio-group
          v-model="masterusuariosStore.filtros.status"
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
            v-model="masterusuariosStore.model.valorcodigo"
            :readonly="masterusuariosStore.tipo != 'nuevo'"
            label="Código"
            v-if="masterusuariosStore.tipo != 'nuevo'"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="masterusuariosStore.model.description"
            :readonly="masterusuariosStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="masterusuariosStore.tipo != 'ver'"
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
              masterusuariosStore.model.valorcodigo
            )
          "
        >
          <v-text-field
            v-model="masterusuariosStore.model.codigo01"
            :readonly="masterusuariosStore.tipo == 'ver'"
            label="Porcentaje (*)"
            :clearable="masterusuariosStore.tipo != 'ver'"
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
            :readonly="masterusuariosStore.tipo == 'ver'"
            :label="`Estado: ${
              !!masterusuariosStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="masterusuariosStore.model.status"
          />
        </v-col>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="masterusuariosStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="masterusuariosStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="masterusuariosStore.tipo != 'filter' && masterusuariosStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          masterusuariosStore.drawer =
            !masterusuariosStore.drawer
        "
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
