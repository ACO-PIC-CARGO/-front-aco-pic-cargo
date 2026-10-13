<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.town.drawer = !$store.state.town.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.town.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="$store.state.town.filtros.id_pais"
          item-title="name"
          item-value="id"
          :clearable="$store.state.town.tipo != 'ver'"
          @update:model-value="ObtenerEstados($store.state.town.filtros.id_pais)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Estado (Región)"
          :items="$store.state.itemsState"
          v-model="$store.state.town.filtros.id_state"
          item-title="name"
          item-value="id"
          :clearable="$store.state.town.tipo != 'ver'"
          :loading="loadingEstado"
          @update:model-value="ObtenerCity($store.state.town.filtros.id_state)"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Ciudad"
          :items="$store.state.itemsCity"
          v-model="$store.state.town.filtros.id_city"
          item-title="name"
          item-value="id"
          :clearable="$store.state.town.tipo != 'ver'"
          :loading="loadingEstado"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.town.filtros.code"
          label="Código"
          :clearable="$store.state.town.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.town.filtros.name"
          label="Nombre"
          :clearable="$store.state.town.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.town.filtros.description"
          label="Descripción"
          :clearable="$store.state.town.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="$store.state.town.filtros.status" inline density="compact">
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
            v-model="$store.state.town.model.id_pais"
            :readonly="$store.state.town.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            @update:model-value="ObtenerEstados($store.state.town.model.id_pais)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!$store.state.town.model.id_pais">
          <v-autocomplete
            label="Estado (Región) (*)"
            :items="$store.state.itemsState"
            v-model="$store.state.town.model.id_state"
            :readonly="$store.state.town.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :loading="loadingEstado"
            @update:model-value="ObtenerCity($store.state.town.model.id_state)"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1" v-if="!!$store.state.town.model.id_state">
          <v-autocomplete
            label="Ciudad (*)"
            :items="$store.state.itemsCity"
            v-model="$store.state.town.model.id_city"
            :readonly="$store.state.town.tipo == 'ver'"
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
            v-model="$store.state.town.model.code"
            :readonly="$store.state.town.tipo != 'nuevo'"
            label="Código"
            v-if="$store.state.town.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.town.model.name"
            :readonly="$store.state.town.tipo == 'ver'"
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
            v-model="$store.state.town.model.description"
            :readonly="$store.state.town.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="$store.state.town.tipo != 'ver'"
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
            :readonly="$store.state.town.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.town.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.town.model.status"
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
        v-if="$store.state.town.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.town.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          $store.state.town.tipo != 'filter' && $store.state.town.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.town.drawer = !$store.state.town.drawer"
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
      loadingCity: false,
      model: "",
    };
  },
  methods: {
    ...mapActions([
      "GetListTown",
      "_getPais",
      "_getState",
      "_getCity",
      "setTown",
      "ActualizarTown",
    ]),
    getName() {
      if (this.$store.state.town.tipo == "ver") {
        return `Distrito ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.town.tipo == "nuevo") {
        return "Nuevo distrito";
      }
      if (this.$store.state.town.tipo == "editar") {
        return `Modificar Distrito: ${this.model.name}`;
      }
      if (this.$store.state.town.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ObtenerEstados(id_pais) {
      this.loadingEstado = true;
      await this._getState(id_pais);
      this.$store.state.town.model.id_state = "";
      this.$store.state.town.model.id_city = "";
      this.loadingEstado = false;
    },
    async ObtenerCity(id_state) {
      this.loadingCity = true;
      await this._getCity(id_state);
      this.$store.state.town.model.id_city = "";
      this.loadingCity = false;
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListTown();
      this.loading = false;
      this.$store.state.town.drawer = !this.$store.state.town.drawer;
    },
    async Limpiar() {
      this.$store.state.town.filtros = {
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
      this.$store.state.town.drawer = !this.$store.state.town.drawer;
    },
    async Aceptar() {
      if (this.$store.state.town.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTown();
          await this.GetListTown();
          this.loading = false;
        }
      }
      if (this.$store.state.town.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarTown();
          await this.GetListTown();
        }
        this.loading = false;
      }
      if (this.$store.state.town.tipo == "ver") {
        this.$store.state.town.drawer = !this.$store.state.town.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.town.drawer;
      },
      set(val) {
        return (this.$store.state.town.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.town.model };

      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
