<template>
  <v-card>
    <v-card-title primary-title>
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
          label="Nombre"
          :clearable="$store.state.masterusuarios.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.masterusuarios.filtros.status"
          row
          dense
        >
          <v-radio label="Activo" color="green" :value="true"></v-radio>
          <v-radio label="Inactivo" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
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

        <div class="col-12 py-1">
          <v-textarea
            v-model="$store.state.masterusuarios.model.description"
            :readonly="$store.state.masterusuarios.tipo == 'ver'"
            label="Nombre (*)"
            :clearable="$store.state.masterusuarios.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 500) ||
                'El nombre no puede tener más 500 de  carácteres',
            ]"
            outlined
            auto-grow
            rows="1"
          ></v-textarea>
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
        v-if="
          $store.state.masterusuarios.tipo != 'filter' &&
          $store.state.masterusuarios.tipo != 'ver'
        "
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
    };
  },
  methods: {
    ...mapActions([
      "GetListNotasCotizacion",
      "ActualizarMasterDetalle",
      "RegistrarMasterDetalleNotasCotizacion",
    ]),
    getName() {
      if (this.$store.state.masterusuarios.tipo == "ver") {
        return `Nota  – Modo Vista`;
      }
      if (this.$store.state.masterusuarios.tipo == "nuevo") {
        return "Nueva Nota Cotización";
      }
      if (this.$store.state.masterusuarios.tipo == "editar") {
        return `Modificar Nota`;
      }
      if (this.$store.state.masterusuarios.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListNotasCotizacion();
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
      await this.GetListNotasCotizacion();

      this.loading = false;
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async Aceptar() {
      if (this.$store.state.masterusuarios.tipo == "nuevo") {
        if (this.$refs.frmDML.validate()) {
          this.loading = true;
          await this.RegistrarMasterDetalleNotasCotizacion();
          await this.GetListNotasCotizacion();
          this.loading = false;
        }
      }
      if (this.$store.state.masterusuarios.tipo == "editar") {
        this.loading = true;
        if (this.$refs.frmDML.validate()) {
          await this.ActualizarMasterDetalle();
          await this.GetListNotasCotizacion();
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

