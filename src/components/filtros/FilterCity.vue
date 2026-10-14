<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.city.drawer = !$store.state.city.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.city.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="$store.state.city.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="$store.state.city.tipo != 'ver'"
          @update:model-value="ObtenerEstados($store.state.city.filtros.id_pais)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Estado"
          :items="$store.state.itemsState"
          v-model="$store.state.city.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="$store.state.city.tipo != 'ver'"
          :loading="loadingEstado"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.city.filtros.code"
          label="Código"
          :clearable="$store.state.city.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.city.filtros.name"
          label="Nombre"
          :clearable="$store.state.city.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.city.filtros.description"
          label="Descripción"
          :clearable="$store.state.city.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="$store.state.city.filtros.status" inline density="compact">
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
            v-model="$store.state.city.model.id_pais"
            :readonly="$store.state.city.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados($store.state.city.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!$store.state.city.model.id_pais">
          <v-autocomplete
            label="Estado (*)"
            :items="$store.state.itemsState"
            v-model="$store.state.city.model.id_state"
            :readonly="$store.state.city.tipo == 'ver'"
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
            v-model="$store.state.city.model.code"
            :readonly="$store.state.city.tipo != 'nuevo'"
            label="Código"
            v-if="$store.state.city.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.city.model.name"
            :readonly="$store.state.city.tipo == 'ver'"
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
            v-model="$store.state.city.model.description"
            :readonly="$store.state.city.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.city.tipo != 'ver'"
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
            :readonly="$store.state.city.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.city.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.city.model.status"
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
        v-if="$store.state.city.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.city.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.city.tipo != 'filter'&& $store.state.city.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.city.drawer = !$store.state.city.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
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
      "GetListCity",
      "_getPais",
      "_getState",
      "setCity",
      "ActualizarCity",
    ]),
    getName() {
      if (this.$store.state.city.tipo == "ver") {
        return `Ciudad ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.city.tipo == "nuevo") {
        return "Nuevo ciudades";
      }
      if (this.$store.state.city.tipo == "editar") {
        return `Modificar Ciudad: ${this.model.name}`;
      }
      if (this.$store.state.city.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ObtenerEstados(id_state) {
      this.loadingEstado = true;
      await this._getState(id_state);
      this.$store.state.city.model.id_state = "";
      this.loadingEstado = false;
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListCity();
      this.loading = false;
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
    },
    async Limpiar() {
      this.$store.state.city.filtros = {
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
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
    },
    async Aceptar() {
      if (this.$store.state.city.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setCity();
          await this.GetListCity();
          this.loading = false;
        }
      }
      if (this.$store.state.city.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarCity();
          await this.GetListCity();
        }
        this.loading = false;
      }
      if (this.$store.state.city.tipo == "ver") {
        this.$store.state.city.drawer = !this.$store.state.city.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.city.drawer;
      },
      set(val) {
        return (this.$store.state.city.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.city.model };

      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
