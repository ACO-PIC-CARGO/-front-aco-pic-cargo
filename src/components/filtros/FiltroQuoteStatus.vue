<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="
          $store.state.QuoteStatus.drawer = !$store.state.QuoteStatus.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.QuoteStatus.tipo == 'filter'">
      <v-form ref="frmFilter">
        <div class="container">
          <div class="row">
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.code"
                dense
                label="Código"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.name"
                dense
                label="Nombre"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.description"
                dense
                label="Descripción"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.position"
                type="number"
                dense
                label="Posición Cotizaciones"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-autocomplete
                :items="$store.state.masterusuarios.lstTemperatura"
                v-model="
                  $store.state.QuoteStatus.StatusFilter
                    .id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-text="descripcion"
                dense
                outlined
                label="Temperatura de Lead"
              >
                <template v-slot:item="{ item }">
                  <span
                    class="mr-3 d-inline-block"
                    :style="{
                      backgroundColor: item.codigo,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                    }"
                  ></span>
                  {{ item.descripcion }}
                </template>
              </v-autocomplete>
            </div>
            <!--<div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.position_select"
                dense
                type="number"
                label="Posición Registro"
              ></v-text-field>
            </div> -->
            <!-- <div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.position_report"
                dense
                type="number"
                label="Posición Reportes"
              ></v-text-field>
            </div> 
            <div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="$store.state.QuoteStatus.StatusFilter.position_calls"
                dense
                type="number"
                label="Posición Llamadas"
              ></v-text-field>
            </div> 
            <div class="col-6 py-1">
              Uso Llamadas
              <v-radio-group
                v-model="$store.state.QuoteStatus.StatusFilter.status_calls"
                row
                dense
                clearable
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="col-6 py-1">
              Uso Todas Llamadas
              <v-radio-group
                v-model="$store.state.QuoteStatus.StatusFilter.status_calls_all"
                row
                dense
                clearable
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div> -->

            <div class="col-12 py-1">
              <span> Estado</span>
              <v-radio-group
                v-model="$store.state.QuoteStatus.StatusFilter.status"
                row
                dense
              >
                <v-radio label="Activo" color="green" value="1"></v-radio>
                <v-radio label="Inactivo" color="red" value="0"></v-radio>
                <v-radio label="Todos" color="blue" value="null"></v-radio>
              </v-radio-group>
            </div>
          </div>
        </div>
      </v-form>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="container">
          <div class="row">
            <div class="col-12 py-0">
              <v-text-field
                v-if="$store.state.QuoteStatus.tipo != 'nuevo'"
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.code"
                dense
                label="Código"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.name"
                dense
                label="Nombre (*)"
                :rules="[(v) => !!v || 'Dato requerido']"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.description"
                dense
                label="Descripción"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.position"
                v-on:blur="validatePosition"
                :error-messages="errPosition"
                :rules="[(v) => !!v || 'Dato requerido']"
                type="number"
                dense
                label="Posición Cotizaciones"
                outlined
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-autocomplete
                :items="$store.state.masterusuarios.lstTemperatura"
                v-model="
                  $store.state.QuoteStatus.StatusModel
                    .id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-text="descripcion"
                dense
                outlined
                label="Temperatura de Lead"
              >
                <template v-slot:item="{ item }">
                  <span
                    class="mr-3 d-inline-block"
                    :style="{
                      backgroundColor: item.codigo,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                    }"
                  ></span>
                  {{ item.descripcion }}
                </template>
              </v-autocomplete>
            </div>
            <!--<div class="col-6 py-1">
              <v-text-field
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.position_select"
                v-on:blur="validatePositionSelect"
                :error-messages="errPositionSelect"
                :rules="[(v) => !!v || 'Dato requerido']"
                dense
                type="number"
                label="Posición Registro (*)"
              ></v-text-field>
            </div>
            <div class="col-6 py-1">
              <v-text-field
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.position_report"
                v-on:blur="validatePositionReport"
                :error-messages="errPositionReport"
                :rules="[(v) => !!v || 'Dato requerido']"
                dense
                type="number"
                label="Posición Reportes (*)"
              ></v-text-field>
            </div> -->
            <!-- <div class="col-6 py-1">
              <v-text-field
                v-if="
                  $store.state.QuoteStatus.StatusModel.status_calls_all == 1
                "
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                v-model="$store.state.QuoteStatus.StatusModel.position_calls"
                v-on:blur="validatePositionCalls"
                :error-messages="errPositionCalls"
                :rules="[(v) => !!v || 'Dato requerido']"
                dense
                type="number"
                label="Posición Llamadas (*)"
              ></v-text-field>
            </div> -->
            <!-- <div class="col-6 py-1">
              Uso Llamadas (*)
              <v-radio-group
                v-model="$store.state.QuoteStatus.StatusModel.status_calls"
                row
                dense
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                :rules="[(v) => use.includes(v) || 'Dato requerido']"
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="col-6 py-1">
              Uso Todas Llamadas (*)
              <v-radio-group
                v-model="$store.state.QuoteStatus.StatusModel.status_calls_all"
                row
                dense
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                :rules="[(v) => use.includes(v) || 'Dato requerido']"
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div> -->

            <div class="col-12 py-1">
              <span> Estado</span>

              <v-switch
                :readonly="$store.state.QuoteStatus.tipo == 'ver'"
                :label="`Estado: ${
                  !!$store.state.QuoteStatus.StatusModel.status
                    ? 'Activo'
                    : 'Inactivo'
                }`"
                color="success"
                v-model="$store.state.QuoteStatus.StatusModel.status"
              ></v-switch>
            </div>
          </div></div
      ></v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.QuoteStatus.tipo == 'filter'"
        :loading="loading"
        @click="Filtrar()"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.QuoteStatus.tipo == 'filter'"
        :loading="loading"
        @click="Limpiar()"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.QuoteStatus.tipo != 'filter'"
        :loading="loading"
        @click="Aceptar()"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          $store.state.QuoteStatus.drawer = !$store.state.QuoteStatus.drawer
        "
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
      errPosition: "",
      errPositionSelect: "",
      errPositionReport: "",
      errPositionCalls: "",
      loading: false,
      StatusQuote: "",
      use: [0, 1],
    };
  },
  methods: {
    ...mapActions([
      "GetListQuoteStatus",
      "getValidatePositionQuoteStatus",
      "getValidatePositionSelectQuoteStatus",
      "getValidatePositionReportQuoteStatus",
      "getValidatePositionCallsQuoteStatus",
      "getValidatePositionActualizarQuoteStatus",
      "getValidatePositionSelectActualizarQuoteStatus",
      "getValidatePositionReportActualizarQuoteStatus",
      "getValidatePositionCallsActualizarQuoteStatus",
      "setQuoteStatus",
      "actualizarQuoteStatus",
    ]),
    getName() {
      if (this.$store.state.QuoteStatus.tipo == "ver") {
        return `Estado : ${this.StatusQuote.name} – Modo Vista`;
      }
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        return "Nueva Estado";
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        return `Modificar Estado: ${this.StatusQuote.name}`;
      }
      if (this.$store.state.QuoteStatus.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListQuoteStatus();
      this.loading = false;
      this.$store.state.QuoteStatus.drawer =
        !this.$store.state.QuoteStatus.drawer;
    },
    async Limpiar() {
      this.$refs.frmFilter.reset();
      setTimeout(async () => {
        this.$store.state.QuoteStatus.StatusFilter.status = "1";
        this.$store.state.QuoteStatus.StatusFilter.status_calls = "";
        this.$store.state.QuoteStatus.StatusFilter.status_calls_all = "";
        this.loading = true;
        await this.GetListQuoteStatus();
        this.loading = false;
        this.$store.state.QuoteStatus.drawer =
          !this.$store.state.QuoteStatus.drawer;
      }, 1);
    },
    async validatePosition() {
      this.errPosition = "";
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        let val = await this.getValidatePositionQuoteStatus();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position = "";
        }
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        let val = await this.getValidatePositionActualizarQuoteStatus();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position = "";
        }
      }
    },
    async validatePositionSelect() {
      this.errPositionSelect = "";
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        let val = await this.getValidatePositionSelectQuoteStatus();
        this.errPositionSelect = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position_select = "";
        }
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        let val = await this.getValidatePositionSelectActualizarQuoteStatus();
        this.errPositionSelect = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position_select = "";
        }
      }
    },
    async validatePositionReport() {
      this.errPositionReport = "";
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        let val = await this.getValidatePositionReportQuoteStatus();
        this.errPositionReport = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position_report = "";
        }
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        let val = await this.getValidatePositionReportActualizarQuoteStatus();
        this.errPositionReport = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.position_report = "";
        }
      }
    },
    async validatePositionCalls() {
      this.errPositionCalls = "";
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        let val = await this.getValidatePositionCallsQuoteStatus();
        this.errPositionCalls = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.status_calls = "";
        }
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        let val = await this.getValidatePositionCallsActualizarQuoteStatus();
        this.errPositionCalls = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.QuoteStatus.StatusModel.status_calls = "";
        }
      }
    },
    async Aceptar() {
      if (this.$store.state.QuoteStatus.tipo == "nuevo") {
        this.loading = true;
        setTimeout(async () => {
          if (this.$refs.frmDML.validate()) {
            this.loading = true;
            await this.setQuoteStatus();
            await this.GetListQuoteStatus();
            this.loading = false;
          }
        }, 500);
        this.loading = false;
      }
      if (this.$store.state.QuoteStatus.tipo == "editar") {
        this.loading = true;
        setTimeout(async () => {
          if (this.$refs.frmDML.validate()) {
            await this.actualizarQuoteStatus();
            await this.GetListQuoteStatus();
          }
        }, 500);
        this.loading = false;
      }
      if (this.$store.state.QuoteStatus.tipo == "ver") {
        this.$store.state.QuoteStatus.drawer =
          !this.$store.state.QuoteStatus.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.QuoteStatus.drawer;
      },
      set(val) {
        return (this.$store.state.QuoteStatus.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.StatusQuote = { ...this.$store.state.QuoteStatus.StatusModel };
      this.$refs.frmDML.resetValidation();
      this.errPosition = "";
      this.errPositionSelect = "";
      this.errPositionReport = "";
      this.errPositionCalls = "";
    },
  },
};
</script>

<style scoped></style>
