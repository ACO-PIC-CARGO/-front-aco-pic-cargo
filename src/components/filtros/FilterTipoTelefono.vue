<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const masterusuariosStore = useMasterusuariosStore();

const loading = ref(false);
const model = ref<{ valorcodigo?: string; description?: string }>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => masterusuariosStore.drawer);

watch(drawer, () => {
  model.value = { ...masterusuariosStore.model };
});

function getName() {
  if (masterusuariosStore.tipo == "ver") {
    return `Tipo Teléfono: ${model.value.valorcodigo}-${model.value.description} – Modo Vista`;
  }
  if (masterusuariosStore.tipo == "nuevo") {
    return "Nuevo tipo teléfono";
  }
  if (masterusuariosStore.tipo == "editar") {
    return `Modificar Tipo: ${model.value.description}`;
  }
  if (masterusuariosStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function Filtrar() {
  loading.value = true;
  await masterusuariosStore.GetListTipoTelefono();
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
  await masterusuariosStore.GetListTipoTelefono();

  loading.value = false;
  masterusuariosStore.drawer = !masterusuariosStore.drawer;
}
async function Aceptar() {
  if (masterusuariosStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await masterusuariosStore.RegistrarMasterDetalleTipoTelefono();
      await masterusuariosStore.GetListTipoTelefono();
      loading.value = false;
    }
  }
  if (masterusuariosStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await masterusuariosStore.ActualizarMasterDetalle();
      await masterusuariosStore.GetListTipoTelefono();
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
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
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
        <!-- @vue-expect-error the filter form keeps the edit form's tipo != 'ver' check -->
        <v-text-field
          v-model="masterusuariosStore.filtros.description"
          label="Nombre"
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
            v-model="masterusuariosStore.model.description"
            :readonly="masterusuariosStore.tipo == 'ver'"
            label="Nombre (*)"
            :clearable="masterusuariosStore.tipo != 'ver'"
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
