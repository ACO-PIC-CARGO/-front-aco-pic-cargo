<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { FormMasterDetalle } from "@/types/seguridad";

const masterusuariosStore = useMasterusuariosStore();

const loading = ref(false);
const model = ref<FormMasterDetalle | string>("");
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => masterusuariosStore.drawer);

watch(drawer, () => {
  model.value = { ...masterusuariosStore.model };
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mostrarIndividualGrupalPorEmpresa() {
  const valEmpresaPic = [1, 2];
  const empresa = (JSON.parse(localStorage.getItem("dataBranch") as string) as { id: number }[])[0]!;
  if (valEmpresaPic.includes(empresa.id)) {
    return true;
  }
  return false;
}
function getName() {
  if (masterusuariosStore.tipo == "ver") {
    return `Nota  – Modo Vista`;
  }
  if (masterusuariosStore.tipo == "nuevo") {
    return "Nueva Nota Cotización";
  }
  if (masterusuariosStore.tipo == "editar") {
    return `Modificar Nota`;
  }
  if (masterusuariosStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}

async function Filtrar() {
  loading.value = true;
  await masterusuariosStore.GetListNotasCotizacion();
  loading.value = false;
  masterusuariosStore.drawer =
    !masterusuariosStore.drawer;
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
  await masterusuariosStore.GetListNotasCotizacion();

  loading.value = false;
  masterusuariosStore.drawer =
    !masterusuariosStore.drawer;
}
async function Aceptar() {
  if (masterusuariosStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await masterusuariosStore.RegistrarMasterDetalleNotasCotizacion();
      await masterusuariosStore.GetListNotasCotizacion();
      loading.value = false;
    }
  }
  if (masterusuariosStore.tipo == "editar") {
    loading.value = true;
    if ((await frmDML.value!.validate()).valid) {
      await masterusuariosStore.ActualizarMasterDetalle();
      await masterusuariosStore.GetListNotasCotizacion();
    }
    loading.value = false;
  }
  if (masterusuariosStore.tipo == "ver") {
    masterusuariosStore.drawer =
      !masterusuariosStore.drawer;
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
      <!-- <div class="col-12 py-1">
        <v-switch
          label="Individual"
          v-model="$store.state.masterusuarios.filtros.individualflag"
        />
      </div>
      <div class="col-12 py-1">
        <v-switch
          label="Grupal"
          v-model="$store.state.masterusuarios.filtros.grupalflag"
        />
      </div> -->
      <v-col
        cols="12"
        class="py-1"
      >
        <!-- @vue-expect-error tipo is typed as "filter", which never equals 'ver' -->
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
        <v-row>
          <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.masterusuarios.model.valorcodigo"
            :readonly="$store.state.masterusuarios.tipo != 'nuevo'"
            label="Código"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length <= 3 || 'El código no puede tener más de  carácteres',
            ]"
          ></v-text-field>
        </div> -->

          <v-col
            cols="12"
            class="py-1"
          >
            <v-textarea
              v-model="masterusuariosStore.model.description"
              :readonly="masterusuariosStore.tipo == 'ver'"
              label="Nombre (*)"
              :clearable="masterusuariosStore.tipo != 'ver'"
              :rules="[
                (v) => !!v || 'Dato Requerido',
                (v) =>
                  (!!v && v.length <= 500) ||
                  'El nombre no puede tener más 500 de  carácteres',
              ]"
              variant="outlined"
              density="compact"
              auto-grow
              rows="1"
            />
          </v-col>
          <v-col
            cols="12"
            class="py-1"
          >
            <v-text-field
              name="name"
              label="Orden"
              id="id"
              variant="outlined"
              density="compact"
              v-model="masterusuariosStore.model.orden"
              :readonly="masterusuariosStore.tipo == 'ver'"
              :clearable="masterusuariosStore.tipo != 'ver'"
              type="number"
              style="max-width: 240px;"
            />
          </v-col>
          <v-col
            cols="12"
            class="py-1"
          >
            Tipo de Cotización
          </v-col>
          <v-col
            cols="6"
            class="py-1"
          >
            <v-switch
              label="Individual"
              v-model="masterusuariosStore.model.individualflag"
            />
          </v-col>
          <v-col
            cols="6"
            class="py-1"
          >
            <v-switch
              label="Grupal"
              v-model="masterusuariosStore.model.grupalflag"
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
                !!masterusuariosStore.model.status
                  ? 'Activo'
                  : 'Inactivo'
              }`"
              color="success"
              v-model="masterusuariosStore.model.status"
            />
          </v-col>
        </v-row>
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
        v-if="
          masterusuariosStore.tipo != 'filter' &&
            masterusuariosStore.tipo != 'ver'
        "
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
