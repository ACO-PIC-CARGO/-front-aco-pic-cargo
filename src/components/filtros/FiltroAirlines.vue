<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="airlinesStore.drawer = !airlinesStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="airlinesStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="airlinesStore.AirlineFilter.id_pais"
          item-title="name"
          item-value="id"
          clearable
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code"
          label="Código"
          clearable
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code_iata"
          clearable
          label="Código IATA"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="airlinesStore.AirlineFilter.code_icao"
          label="Código ICAO"
          clearable
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="airlinesStore.AirlineFilter.name"
          clearable
          label="Nombre"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-radio-group v-model="airlinesStore.AirlineFilter.status" inline>
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
            v-model="airlinesStore.AirlineModel.id_pais"
            item-title="name"
            item-value="id"
            :readonly="airlinesStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: item.status != 1 })"
            clearable
            :rules="[(v) => !!v || 'Dato Requerido']"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="airlinesStore.AirlineModel.code"
            label="Código (*)"
            v-if="airlinesStore.tipo != 'nuevo'"
            readonly
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
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
            v-on:blur="ValitateIATA()"
            :loading="loading"
            :error-messages="errIATA"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
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
            v-on:blur="ValitateICAO()"
            :error-messages="errICAO"
          ></v-text-field>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="airlinesStore.AirlineModel.name"
            label="Nombre"
            :readonly="airlinesStore.tipo == 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
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
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="airlinesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="airlinesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          airlinesStore.tipo != 'filter' &&
          airlinesStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="airlinesStore.drawer = !airlinesStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useAirlinesStore } from "@/stores/airlines";
export default {
  data() {
    return { errIATA: "", errICAO: "", loading: false, airline: "" };
  },
  methods: {
    ...mapPiniaActions(useAirlinesStore, ["GetListAirline", "setAirline", "ValidateCodigoIATANuevo", "ValidateCodigoICAONuevo", "ValidateCodigoIATAEditar", "ValidateCodigoICAOEditar", "actualizarAirline"]),
    getName() {
      if (this.airlinesStore.tipo == "ver") {
        return `Aerolínea ${this.airline.name} – Modo Vista`;
      }
      if (this.airlinesStore.tipo == "nuevo") {
        return "Nueva Aerolínea";
      }
      if (this.airlinesStore.tipo == "editar") {
        return `Modificar Areolínea: ${this.airline.name}`;
      }
      if (this.airlinesStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async ValitateIATA() {
      //this.loading = true;
      this.errIATA = "";
      if (this.airlinesStore.tipo == "nuevo") {
        let val = await this.ValidateCodigoIATANuevo();
        if (!val.estadoflag) {
          this.errIATA = val.mensaje;
          this.airlinesStore.AirlineModel.code_iata = "";
        }
      }
      if (this.airlinesStore.tipo == "editar") {
        let val = await this.ValidateCodigoIATAEditar();
        if (!val.estadoflag) {
          this.errIATA = val.mensaje;
          this.airlinesStore.AirlineModel.code_iata = "";
        }
      }
      //this.loading = false;
    },
    async ValitateICAO() {
      //this.loading = true;
      this.errICAO = "";
      if (this.airlinesStore.tipo == "nuevo") {
        let val = await this.ValidateCodigoICAONuevo();
        if (!val.estadoflag) {
          this.errICAO = val.mensaje;
          this.airlinesStore.AirlineModel.code_icao = "";
        }
      }
      if (this.airlinesStore.tipo == "editar") {
        let val = await this.ValidateCodigoICAOEditar();
        if (!val.estadoflag) {
          this.errICAO = val.mensaje;
          this.airlinesStore.AirlineModel.code_icao = "";
        }
      }
      //this.loading = false;
    },

    async Aceptar() {
      this.loading = true;
      if (this.airlinesStore.tipo == "nuevo") {
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
      if (this.airlinesStore.tipo == "editar") {
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
      this.airlinesStore.drawer = !this.airlinesStore.drawer;
    },
    async Limpiar() {
      this.airlinesStore.AirlineFilter = {
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
      this.airlinesStore.drawer = !this.airlinesStore.drawer;
    },
  },
  computed: {
    ...mapStores(useAirlinesStore),
    drawer: {
      get() {
        return this.airlinesStore.drawer;
      },
      set(val) {
        return (this.airlinesStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.airline = { ...this.airlinesStore.AirlineModel };
      this.errIATA = "";
      this.errICAO = "";
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
