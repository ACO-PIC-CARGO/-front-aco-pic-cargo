<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="statesStore.drawer = !statesStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="statesStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="statesStore.StateFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="statesStore.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="statesStore.StateFilter.code"
          label="Código"
          :clearable="statesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="statesStore.StateFilter.name"
          label="Nombre"
          :clearable="statesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="statesStore.StateFilter.description"
          label="Descripción"
          :clearable="statesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="statesStore.StateFilter.status"
          inline
          density="compact"
        >
          <v-radio label="Activo" color="green" value="1"></v-radio>
          <v-radio label="Inactivo" color="red" value="0"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="col-12 py-1">
          <v-autocomplete
            label="Pais (*)"
            :items="$store.state.itemsPais"
            v-model="statesStore.StateModel.id_pais"
            :readonly="statesStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="statesStore.StateModel.code"
            :readonly="statesStore.tipo != 'nuevo'"
            label="Código"
            v-if="statesStore.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="statesStore.StateModel.name"
            :readonly="statesStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) =>
                v.length < 50 ||
                'El nombre no puede exceder los 50 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="statesStore.StateModel.description"
            :readonly="statesStore.tipo == 'ver'"
            label="Descripción"
            :clearable="statesStore.tipo != 'ver'"
            :rules="[
              (v) =>
                v.length < 50 ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="statesStore.tipo == 'ver'"
            :label="`Estado: ${
              !!statesStore.StateModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="statesStore.StateModel.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="statesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="statesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="statesStore.tipo != 'filter'&& statesStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="statesStore.drawer = !statesStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useStatesStore } from "@/stores/states";
export default {
  data() {
    return { errIATA: "", errICAO: "", loading: false, states: "" };
  },
  methods: {
    ...mapActions(["_getPais"]),
    ...mapPiniaActions(useStatesStore, ["GetListState", "setState", "ActualizarState"]),
    getName() {
      if (this.statesStore.tipo == "ver") {
        return `Estado ${this.StateModel.name} – Modo Vista`;
      }
      if (this.statesStore.tipo == "nuevo") {
        return "Nuevo estado";
      }
      if (this.statesStore.tipo == "editar") {
        return `Modificar Estado: ${this.StateModel.name}`;
      }
      if (this.statesStore.tipo == "filter") {
        return "Filtrar Listado estado";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListState();
      this.loading = false;
      this.statesStore.drawer = !this.statesStore.drawer;
    },
    async Limpiar() {
      this.statesStore.StateFilter = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        status: "1",
      };
      this.loading = true;
      await this.GetListState();
      this.loading = false;
      this.statesStore.drawer = !this.statesStore.drawer;
    },
    async Aceptar() {
      if (this.statesStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setState();
          await this.GetListState();
          this.loading = false;
        }
      }
      if (this.statesStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarState();
          await this.GetListState();
        }
        this.loading = false;
      }
      if (this.statesStore.tipo == "ver") {
        this.statesStore.drawer = !this.statesStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useStatesStore),
    drawer: {
      get() {
        return this.statesStore.drawer;
      },
      set(val) {
        return (this.statesStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.StateModel = { ...this.statesStore.StateModel };
    },
  },
};
</script>

<style></style>
