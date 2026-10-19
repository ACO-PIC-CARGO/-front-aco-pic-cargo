<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="cityStore.drawer = !cityStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="cityStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="cityStore.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="cityStore.tipo != 'ver'"
          @update:model-value="ObtenerEstados(cityStore.filtros.id_pais)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Estado"
          :items="$store.state.itemsState"
          v-model="cityStore.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="cityStore.tipo != 'ver'"
          :loading="loadingEstado"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="cityStore.filtros.code"
          label="Código"
          :clearable="cityStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="cityStore.filtros.name"
          label="Nombre"
          :clearable="cityStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="cityStore.filtros.description"
          label="Descripción"
          :clearable="cityStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="cityStore.filtros.status" inline density="compact">
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
            v-model="cityStore.model.id_pais"
            :readonly="cityStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados(cityStore.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!cityStore.model.id_pais">
          <v-autocomplete
            label="Estado (*)"
            :items="$store.state.itemsState"
            v-model="cityStore.model.id_state"
            :readonly="cityStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingEstado"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="cityStore.model.code"
            :readonly="cityStore.tipo != 'nuevo'"
            label="Código"
            v-if="cityStore.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="cityStore.model.name"
            :readonly="cityStore.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) =>
                v.length < 255 ||
                'El nombre no puede exceder los 255 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="cityStore.model.description"
            :readonly="cityStore.tipo == 'ver'"
            label="Descripción"
            :clearable="cityStore.tipo != 'ver'"
            :rules="[
              (v) =>
                v.length < 255 ||
                'La descripción no puede exceder los 255 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="cityStore.tipo == 'ver'"
            :label="`Estado: ${
              !!cityStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="cityStore.model.status"
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
        v-if="cityStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="cityStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="cityStore.tipo != 'filter'&& cityStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="cityStore.drawer = !cityStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCityStore } from "@/stores/city";
export default {
  data() {
    return {
      loading: false,
      loadingEstado: false,
      model: "",
    };
  },
  methods: {
    ...mapActions([
      "_getPais",
      "_getState",
    ]),
    ...mapPiniaActions(useCityStore, ["GetListCity", "setCity", "ActualizarCity"]),
    getName() {
      if (this.cityStore.tipo == "ver") {
        return `Ciudad ${this.model.name} – Modo Vista`;
      }
      if (this.cityStore.tipo == "nuevo") {
        return "Nuevo ciudades";
      }
      if (this.cityStore.tipo == "editar") {
        return `Modificar Ciudad: ${this.model.name}`;
      }
      if (this.cityStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ObtenerEstados(id_state) {
      this.loadingEstado = true;
      await this._getState(id_state);
      this.cityStore.model.id_state = "";
      this.loadingEstado = false;
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListCity();
      this.loading = false;
      this.cityStore.drawer = !this.cityStore.drawer;
    },
    async Limpiar() {
      this.cityStore.filtros = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        status: "1",
        id_state: "",
      };
      this.loading = true;
      await this.GetListCity();

      this.loading = false;
      this.cityStore.drawer = !this.cityStore.drawer;
    },
    async Aceptar() {
      if (this.cityStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setCity();
          await this.GetListCity();
          this.loading = false;
        }
      }
      if (this.cityStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarCity();
          await this.GetListCity();
        }
        this.loading = false;
      }
      if (this.cityStore.tipo == "ver") {
        this.cityStore.drawer = !this.cityStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useCityStore),
    drawer: {
      get() {
        return this.cityStore.drawer;
      },
      set(val) {
        return (this.cityStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.cityStore.model };

      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
