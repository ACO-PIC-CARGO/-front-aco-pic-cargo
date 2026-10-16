<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="$store.state.airlines.drawer = !$store.state.airlines.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.airlines.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="$store.state.airlines.AirlineFilter.id_pais"
          item-title="name"
          item-value="id"
          clearable
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.airlines.AirlineFilter.code"
          label="Código"
          clearable
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.airlines.AirlineFilter.code_iata"
          clearable
          label="Código IATA"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.airlines.AirlineFilter.code_icao"
          label="Código ICAO"
          clearable
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.airlines.AirlineFilter.name"
          clearable
          label="Nombre"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-radio-group v-model="$store.state.airlines.AirlineFilter.status" inline>
          <v-radio label="Activo" color="green" :value="true"></v-radio>
          <v-radio label="Inactivo" color="red" :value="false"></v-radio>
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
            v-model="$store.state.airlines.AirlineModel.id_pais"
            item-title="name"
            item-value="id"
            :readonly="$store.state.airlines.tipo == 'ver'"
            :item-props="(item) => ({ disabled: item.status != 1 })"
            clearable
            :rules="[(v) => !!v || 'Dato Requerido']"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.airlines.AirlineModel.code"
            label="Código (*)"
            v-if="$store.state.airlines.tipo != 'nuevo'"
            readonly
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.airlines.AirlineModel.code_iata"
            label="Código IATA (*)"
            :readonly="$store.state.airlines.tipo == 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
            ]"
            v-on:blur="ValitateIATA()"
            :loading="loading"
            :error-messages="errIATA"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.airlines.AirlineModel.code_icao"
            label="Código ICAO (*)"
            :readonly="$store.state.airlines.tipo == 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
            ]"
            :loading="loading"
            v-on:blur="ValitateICAO()"
            :error-messages="errICAO"
          ></v-text-field>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.airlines.AirlineModel.name"
            label="Nombre"
            :readonly="$store.state.airlines.tipo == 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-switch
            :label="`Estado: ${
              !!$store.state.airlines.AirlineModel.status
                ? 'Activo'
                : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.airlines.AirlineModel.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            :readonly="$store.state.airlines.tipo == 'ver'"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.airlines.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.airlines.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          $store.state.airlines.tipo != 'filter' &&
          $store.state.airlines.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.airlines.drawer = !$store.state.airlines.drawer"
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
    return { errIATA: "", errICAO: "", loading: false, airline: "" };
  },
  methods: {
    ...mapActions([
      "GetListAirline",
      "setAirline",
      "ValidateCodigoIATANuevo",
      "ValidateCodigoICAONuevo",
      "ValidateCodigoIATAEditar",
      "ValidateCodigoICAOEditar",
      "actualizarAirline",
    ]),
    getName() {
      if (this.$store.state.airlines.tipo == "ver") {
        return `Aerolínea ${this.airline.name} – Modo Vista`;
      }
      if (this.$store.state.airlines.tipo == "nuevo") {
        return "Nueva Aerolínea";
      }
      if (this.$store.state.airlines.tipo == "editar") {
        return `Modificar Areolínea: ${this.airline.name}`;
      }
      if (this.$store.state.airlines.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ValitateIATA() {
      //this.loading = true;
      this.errIATA = "";
      if (this.$store.state.airlines.tipo == "nuevo") {
        let val = await this.ValidateCodigoIATANuevo();
        if (!val.estadoflag) {
          this.errIATA = val.mensaje;
          this.$store.state.airlines.AirlineModel.code_iata = "";
        }
      }
      if (this.$store.state.airlines.tipo == "editar") {
        let val = await this.ValidateCodigoIATAEditar();
        if (!val.estadoflag) {
          this.errIATA = val.mensaje;
          this.$store.state.airlines.AirlineModel.code_iata = "";
        }
      }
      //this.loading = false;
    },
    async ValitateICAO() {
      //this.loading = true;
      this.errICAO = "";
      if (this.$store.state.airlines.tipo == "nuevo") {
        let val = await this.ValidateCodigoICAONuevo();
        if (!val.estadoflag) {
          this.errICAO = val.mensaje;
          this.$store.state.airlines.AirlineModel.code_icao = "";
        }
      }
      if (this.$store.state.airlines.tipo == "editar") {
        let val = await this.ValidateCodigoICAOEditar();
        if (!val.estadoflag) {
          this.errICAO = val.mensaje;
          this.$store.state.airlines.AirlineModel.code_icao = "";
        }
      }
      //this.loading = false;
    },

    async Aceptar() {
      this.loading = true;
      if (this.$store.state.airlines.tipo == "nuevo") {
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid && !this.errIATA && !this.errICAO) {
            this.loading = true;
            await this.setAirline();
            await this.GetListAirline();
            this.loading = false;
          } else {
            this.loading = false;
          }
        }, 1000);
      }
      if (this.$store.state.airlines.tipo == "editar") {
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid && !this.errIATA && !this.errICAO) {
            await this.actualizarAirline();
            await this.GetListAirline();
            this.loading = false;
          } else {
            this.loading = false;
          }
        }, 1000);
      }
    },
    Cerrar() {},
    async Filtrar() {
      this.loading = true;
      await this.GetListAirline();
      this.loading = false;
      this.$store.state.airlines.drawer = !this.$store.state.airlines.drawer;
    },
    async Limpiar() {
      this.$store.state.airlines.AirlineFilter = {
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
      this.loading = true;
      await this.GetListAirline();
      this.loading = false;
      this.$store.state.airlines.drawer = !this.$store.state.airlines.drawer;
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.airlines.drawer;
      },
      set(val) {
        return (this.$store.state.airlines.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.airline = { ...this.$store.state.airlines.AirlineModel };
      this.errIATA = "";
      this.errICAO = "";
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
