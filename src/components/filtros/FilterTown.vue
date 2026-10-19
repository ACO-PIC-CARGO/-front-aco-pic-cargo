<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="townStore.drawer = !townStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="townStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="townStore.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          @update:model-value="ObtenerEstados(townStore.filtros.id_pais)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Estado (Región)"
          :items="$store.state.itemsState"
          v-model="townStore.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          :loading="loadingEstado"
          @update:model-value="ObtenerCity(townStore.filtros.id_state)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Ciudad"
          :items="$store.state.itemsCity"
          v-model="townStore.filtros.id_city"
          item-title="name"
          item-value="id"
          :clearable="townStore.tipo != 'ver'"
          :loading="loadingEstado"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="townStore.filtros.code"
          label="Código"
          :clearable="townStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="townStore.filtros.name"
          label="Nombre"
          :clearable="townStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="townStore.filtros.description"
          label="Descripción"
          :clearable="townStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="townStore.filtros.status" inline density="compact">
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
            v-model="townStore.model.id_pais"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados(townStore.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!townStore.model.id_pais">
          <v-autocomplete
            label="Estado (Región) (*)"
            :items="$store.state.itemsState"
            v-model="townStore.model.id_state"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingEstado"
            @update:model-value="ObtenerCity(townStore.model.id_state)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!townStore.model.id_state">
          <v-autocomplete
            label="Ciudad (*)"
            :items="$store.state.itemsCity"
            v-model="townStore.model.id_city"
            :readonly="townStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingCity"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="townStore.model.code"
            :readonly="townStore.tipo != 'nuevo'"
            label="Código"
            v-if="townStore.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="townStore.model.name"
            :readonly="townStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'El nombre no puede exceder los 255 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="townStore.model.description"
            :readonly="townStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="townStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'El nombre no puede exceder los 255 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="townStore.tipo == 'ver'"
            :label="`Estado: ${
              !!townStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="townStore.model.status"
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
        v-if="townStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="townStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          townStore.tipo != 'filter' && townStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="townStore.drawer = !townStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTownStore } from "@/stores/town";
export default {
  data() {
    return {
      loading: false,
      loadingEstado: false,
      loadingCity: false,
      model: "",
    };
  },
  methods: {
    ...mapActions([
      "_getPais",
      "_getState",
      "_getCity",
    ]),
    ...mapPiniaActions(useTownStore, ["GetListTown", "setTown", "ActualizarTown"]),
    getName() {
      if (this.townStore.tipo == "ver") {
        return `Distrito ${this.model.name} – Modo Vista`;
      }
      if (this.townStore.tipo == "nuevo") {
        return "Nuevo distrito";
      }
      if (this.townStore.tipo == "editar") {
        return `Modificar Distrito: ${this.model.name}`;
      }
      if (this.townStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ObtenerEstados(id_pais) {
      this.loadingEstado = true;
      await this._getState(id_pais);
      this.townStore.model.id_state = "";
      this.townStore.model.id_city = "";
      this.loadingEstado = false;
    },
    async ObtenerCity(id_state) {
      this.loadingCity = true;
      await this._getCity(id_state);
      this.townStore.model.id_city = "";
      this.loadingCity = false;
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListTown();
      this.loading = false;
      this.townStore.drawer = !this.townStore.drawer;
    },
    async Limpiar() {
      this.townStore.filtros = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        status: "1",
        id_state: "",
      };
      this.loading = true;
      await this.GetListTown();

      this.loading = false;
      this.townStore.drawer = !this.townStore.drawer;
    },
    async Aceptar() {
      if (this.townStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTown();
          await this.GetListTown();
          this.loading = false;
        }
      }
      if (this.townStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarTown();
          await this.GetListTown();
        }
        this.loading = false;
      }
      if (this.townStore.tipo == "ver") {
        this.townStore.drawer = !this.townStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useTownStore),
    drawer: {
      get() {
        return this.townStore.drawer;
      },
      set(val) {
        return (this.townStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.townStore.model };

      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
