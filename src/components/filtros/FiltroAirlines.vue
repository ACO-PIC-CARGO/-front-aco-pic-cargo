<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useAirlinesStore } from "@/stores/airlines";
import type { Aerolinea } from "@/types/catalogos";

const airlinesStore = useAirlinesStore();
const appStore = useAppStore();

const errIATA = ref("");
const errICAO = ref("");
const loading = ref(false);
const airline = ref<Partial<Aerolinea>>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => airlinesStore.drawer);

watch(drawer, () => {
  airline.value = { ...airlinesStore.AirlineModel };
  errIATA.value = "";
  errICAO.value = "";
  frmDML.value!.resetValidation();
});

function getName() {
  if (airlinesStore.tipo == "ver") {
    return `Aerolínea ${airline.value.name} – Modo Vista`;
  }
  if (airlinesStore.tipo == "nuevo") {
    return "Nueva Aerolínea";
  }
  if (airlinesStore.tipo == "editar") {
    return `Modificar Areolínea: ${airline.value.name}`;
  }
  if (airlinesStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function ValitateIATA() {
  //this.loading = true;
  errIATA.value = "";
  if (airlinesStore.tipo == "nuevo") {
    const val = await airlinesStore.ValidateCodigoIATANuevo();
    if (!val.estadoflag) {
      errIATA.value = val.mensaje;
      airlinesStore.AirlineModel.code_iata = "";
    }
  }
  if (airlinesStore.tipo == "editar") {
    const val = await airlinesStore.ValidateCodigoIATAEditar();
    if (!val.estadoflag) {
      errIATA.value = val.mensaje;
      airlinesStore.AirlineModel.code_iata = "";
    }
  }
  //this.loading = false;
}
async function ValitateICAO() {
  //this.loading = true;
  errICAO.value = "";
  if (airlinesStore.tipo == "nuevo") {
    const val = await airlinesStore.ValidateCodigoICAONuevo();
    if (!val.estadoflag) {
      errICAO.value = val.mensaje;
      airlinesStore.AirlineModel.code_icao = "";
    }
  }
  if (airlinesStore.tipo == "editar") {
    const val = await airlinesStore.ValidateCodigoICAOEditar();
    if (!val.estadoflag) {
      errICAO.value = val.mensaje;
      airlinesStore.AirlineModel.code_icao = "";
    }
  }
  //this.loading = false;
}

async function Aceptar() {
  loading.value = true;
  if (airlinesStore.tipo == "nuevo") {
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid && !errIATA.value && !errICAO.value) {
        loading.value = true;
        await airlinesStore.setAirline();
        await airlinesStore.GetListAirline();
        loading.value = false;
      } else {
        loading.value = false;
      }
    }, 1000);
  }
  if (airlinesStore.tipo == "editar") {
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid && !errIATA.value && !errICAO.value) {
        await airlinesStore.actualizarAirline();
        await airlinesStore.GetListAirline();
        loading.value = false;
      } else {
        loading.value = false;
      }
    }, 1000);
  }
}
async function Filtrar() {
  loading.value = true;
  await airlinesStore.GetListAirline();
  loading.value = false;
  airlinesStore.drawer = !airlinesStore.drawer;
}
async function Limpiar() {
  airlinesStore.AirlineFilter = {
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: true,
  };
  loading.value = true;
  await airlinesStore.GetListAirline();
  loading.value = false;
  airlinesStore.drawer = !airlinesStore.drawer;
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
        @click="airlinesStore.drawer = !airlinesStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="airlinesStore.tipo == 'filter'">
      <v-col
        cols="12"
        class="py-1"
      >
        <v-autocomplete
          label="Pais"
          :items="appStore.itemsPais"
          v-model="airlinesStore.AirlineFilter.id_pais"
          item-title="name"
          item-value="id"
          clearable
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code"
          label="Código"
          clearable
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code_iata"
          clearable
          label="Código IATA"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code_icao"
          label="Código ICAO"
          clearable
        />
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <v-text-field
          v-model="airlinesStore.AirlineFilter.name"
          clearable
          label="Nombre"
        />
      </v-col>
      <v-col
        cols="12"
        class="py-1"
      >
        <v-radio-group
          v-model="airlinesStore.AirlineFilter.status"
          inline
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
          <!-- @vue-expect-error the Pais type does not declare status -->
          <v-autocomplete
            label="Pais (*)"
            :items="appStore.itemsPais"
            v-model="airlinesStore.AirlineModel.id_pais"
            item-title="name"
            item-value="id"
            :readonly="airlinesStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: item.status != 1 })"
            clearable
            :rules="[(v) => !!v || 'Dato Requerido']"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="airlinesStore.AirlineModel.code"
            label="Código (*)"
            v-if="airlinesStore.tipo != 'nuevo'"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="airlinesStore.AirlineModel.code_iata"
            label="Código IATA (*)"
            :readonly="airlinesStore.tipo == 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
            ]"
            @blur="ValitateIATA()"
            :loading="loading"
            :error-messages="errIATA"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="airlinesStore.AirlineModel.code_icao"
            label="Código ICAO (*)"
            :readonly="airlinesStore.tipo == 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
            ]"
            :loading="loading"
            @blur="ValitateICAO()"
            :error-messages="errICAO"
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="airlinesStore.AirlineModel.name"
            label="Nombre"
            :readonly="airlinesStore.tipo == 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-switch
            :label="`Estado: ${
              !!airlinesStore.AirlineModel.status
                ? 'Activo'
                : 'Inactivo'
            }`"
            color="success"
            v-model="airlinesStore.AirlineModel.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            :readonly="airlinesStore.tipo == 'ver'"
          />
        </v-col>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="airlinesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="airlinesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          airlinesStore.tipo != 'filter' &&
            airlinesStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="airlinesStore.drawer = !airlinesStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
