<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.states.drawer = !$store.state.states.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.states.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="$store.state.states.StateFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="$store.state.states.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.states.StateFilter.code"
          label="Código"
          :clearable="$store.state.states.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.states.StateFilter.name"
          label="Nombre"
          :clearable="$store.state.states.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.states.StateFilter.description"
          label="Descripción"
          :clearable="$store.state.states.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.states.StateFilter.status"
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
            v-model="$store.state.states.StateModel.id_pais"
            :readonly="$store.state.states.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.states.StateModel.code"
            :readonly="$store.state.states.tipo != 'nuevo'"
            label="Código"
            v-if="$store.state.states.tipo != 'nuevo'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.states.StateModel.name"
            :readonly="$store.state.states.tipo == 'ver'"
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
            v-model="$store.state.states.StateModel.description"
            :readonly="$store.state.states.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.states.tipo != 'ver'"
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
            :readonly="$store.state.states.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.states.StateModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.states.StateModel.status"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.states.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.states.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.states.tipo != 'filter'&& $store.state.states.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.states.drawer = !$store.state.states.drawer"
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
    return { errIATA: "", errICAO: "", loading: false, states: "" };
  },
  methods: {
    ...mapActions(["GetListState", "_getPais", "setState", "ActualizarState"]),
    getName() {
      if (this.$store.state.states.tipo == "ver") {
        return `Estado ${this.StateModel.name} – Modo Vista`;
      }
      if (this.$store.state.states.tipo == "nuevo") {
        return "Nuevo estado";
      }
      if (this.$store.state.states.tipo == "editar") {
        return `Modificar Estado: ${this.StateModel.name}`;
      }
      if (this.$store.state.states.tipo == "filter") {
        return "Filtrar Listado estado";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListState();
      this.loading = false;
      this.$store.state.states.drawer = !this.$store.state.states.drawer;
    },
    async Limpiar() {
      this.$store.state.states.StateFilter = {
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
      this.$store.state.states.drawer = !this.$store.state.states.drawer;
    },
    async Aceptar() {
      if (this.$store.state.states.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setState();
          await this.GetListState();
          this.loading = false;
        }
      }
      if (this.$store.state.states.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarState();
          await this.GetListState();
        }
        this.loading = false;
      }
      if (this.$store.state.states.tipo == "ver") {
        this.$store.state.states.drawer = !this.$store.state.states.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.states.drawer;
      },
      set(val) {
        return (this.$store.state.states.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.StateModel = { ...this.$store.state.states.StateModel };
    },
  },
};
</script>

<style></style>
