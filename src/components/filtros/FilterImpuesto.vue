<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="
          $store.state.masterusuarios.drawer =
            !$store.state.masterusuarios.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.masterusuarios.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.masterusuarios.filtros.valorcodigo"
          label="Código"
          :clearable="$store.state.masterusuarios.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.masterusuarios.filtros.description"
          label="Descripción"
          :clearable="$store.state.masterusuarios.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.masterusuarios.filtros.status"
          inline
          density="compact"
        >
          <v-radio label="Activo" color="green" :value="true"></v-radio>
          <v-radio label="Inactivo" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.masterusuarios.model.valorcodigo"
            :readonly="$store.state.masterusuarios.tipo != 'nuevo'"
            label="Código"
            v-if="$store.state.masterusuarios.tipo != 'nuevo'"
          ></v-text-field>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.masterusuarios.model.description"
            :readonly="$store.state.masterusuarios.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="$store.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div
          class="col-12 py-1"
          v-if="
            !noPorcentaje.includes(
              $store.state.masterusuarios.model.valorcodigo
            )
          "
        >
          <v-text-field
            v-model="$store.state.masterusuarios.model.codigo01"
            :readonly="$store.state.masterusuarios.tipo == 'ver'"
            label="Porcentaje (*)"
            :clearable="$store.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
            type="number"
            step="0.1"
            suffix="%"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.masterusuarios.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.masterusuarios.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.masterusuarios.model.status"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.masterusuarios.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.masterusuarios.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.masterusuarios.tipo != 'filter' && $store.state.masterusuarios.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          $store.state.masterusuarios.drawer =
            !$store.state.masterusuarios.drawer
        "
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
      noPorcentaje: ["04", "01", "02", "10", "11", "12"],
    };
  },
  methods: {
    ...mapActions(["GetListImpuestos", "ActualizarMasterDetalle"]),
    getName() {
      if (this.$store.state.masterusuarios.tipo == "ver") {
        return `Impuesto: ${this.model.valorcodigo}-${this.model.description} – Modo Vista`;
      }
      if (this.$store.state.masterusuarios.tipo == "nuevo") {
        return "Nuevo impuesto";
      }
      if (this.$store.state.masterusuarios.tipo == "editar") {
        return `Modificar Impuesto: ${this.model.valorcodigo}-${this.model.description}`;
      }
      if (this.$store.state.masterusuarios.tipo == "filter") {
        return "Filtrar Listado impuestos";
      }
    },
    async ObtenerEstados(id_state) {
      this.loadingEstado = true;
      await this._getState(id_state);
      this.$store.state.masterusuarios.model.id_state = "";
      this.loadingEstado = false;
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListImpuestos();
      this.loading = false;
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async Limpiar() {
      this.$store.state.masterusuarios.filtros = {
        id: "",
        id_master: "",
        valorcodigo: "",
        codigo01: "",
        codigo02: "",
        description: "",
        status: true,
        escomunflag: false,
      };
      this.loading = true;
      await this.GetListImpuestos();

      this.loading = false;
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async Aceptar() {
      //   if (this.$store.state.masterusuarios.tipo == "nuevo") {
      //     if ((await this.$refs.frmDML.validate()).valid) {
      //       this.loading = true;
      //       await this.setCity();
      //       await this.GetListImpuestos();
      //       this.loading = false;
      //     }
      //   }
      if (this.$store.state.masterusuarios.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarMasterDetalle();
          await this.GetListImpuestos();
        }
        this.loading = false;
      }
      if (this.$store.state.masterusuarios.tipo == "ver") {
        this.$store.state.masterusuarios.drawer =
          !this.$store.state.masterusuarios.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.masterusuarios.drawer;
      },
      set(val) {
        return (this.$store.state.masterusuarios.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.masterusuarios.model };
    },
  },
};
</script>

<style></style>
