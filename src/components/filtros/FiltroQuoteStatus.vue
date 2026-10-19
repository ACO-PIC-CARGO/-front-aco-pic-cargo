<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          QuoteStatusStore.drawer = !QuoteStatusStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="QuoteStatusStore.tipo == 'filter'">
      <v-form ref="frmFilter">
        <div class="container">
          <div class="row">
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.code"
                density="compact"
                label="Código"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.name"
                density="compact"
                label="Nombre"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.description"
                density="compact"
                label="Descripción"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.position"
                type="number"
                density="compact"
                label="Posición Cotizaciones"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-1">
              <v-autocomplete
                :items="$store.state.masterusuarios.lstTemperatura"
                v-model="
                  QuoteStatusStore.StatusFilter
                    .id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-title="descripcion"
                density="compact"
                variant="outlined"
                label="Temperatura de Lead"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <span
                        class="d-inline-block"
                        :style="{
                          backgroundColor: item.codigo,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                    }"
                      ></span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>
            <!--<div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.position_select"
                dense
                type="number"
                label="Posición Registro"
              ></v-text-field>
            </div> -->
            <!-- <div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.position_report"
                dense
                type="number"
                label="Posición Reportes"
              ></v-text-field>
            </div> 
            <div class="col-6 py-1">
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.position_calls"
                dense
                type="number"
                label="Posición Llamadas"
              ></v-text-field>
            </div> 
            <div class="col-6 py-1">
              Uso Llamadas
              <v-radio-group
                v-model="QuoteStatusStore.StatusFilter.status_calls"
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
                v-model="QuoteStatusStore.StatusFilter.status_calls_all"
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
                v-model="QuoteStatusStore.StatusFilter.status"
                inline
                density="compact"
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
                v-if="QuoteStatusStore.tipo != 'nuevo'"
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.code"
                density="compact"
                label="Código"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.name"
                density="compact"
                label="Nombre (*)"
                :rules="[(v) => !!v || 'Dato requerido']"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.description"
                density="compact"
                label="Descripción"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.position"
                v-on:blur="validatePosition"
                :error-messages="errPosition"
                :rules="[(v) => !!v || 'Dato requerido']"
                type="number"
                density="compact"
                label="Posición Cotizaciones"
                variant="outlined"
              ></v-text-field>
            </div>
            <div class="col-12 py-0">
              <v-autocomplete
                :items="$store.state.masterusuarios.lstTemperatura"
                v-model="
                  QuoteStatusStore.StatusModel
                    .id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-title="descripcion"
                density="compact"
                variant="outlined"
                label="Temperatura de Lead"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <span
                        class="d-inline-block"
                        :style="{
                          backgroundColor: item.codigo,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                    }"
                      ></span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>
            <!--<div class="col-6 py-1">
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.position_select"
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
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.position_report"
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
                  QuoteStatusStore.StatusModel.status_calls_all == 1
                "
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.position_calls"
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
                v-model="QuoteStatusStore.StatusModel.status_calls"
                row
                dense
                :readonly="QuoteStatusStore.tipo == 'ver'"
                :rules="[(v) => use.includes(v) || 'Dato requerido']"
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="col-6 py-1">
              Uso Todas Llamadas (*)
              <v-radio-group
                v-model="QuoteStatusStore.StatusModel.status_calls_all"
                row
                dense
                :readonly="QuoteStatusStore.tipo == 'ver'"
                :rules="[(v) => use.includes(v) || 'Dato requerido']"
              >
                <v-radio label="Si" color="green" :value="1"></v-radio>
                <v-radio label="No" color="red" :value="0"></v-radio>
              </v-radio-group>
            </div> -->

            <div class="col-12 py-1">
              <span> Estado</span>

              <v-switch
                :readonly="QuoteStatusStore.tipo == 'ver'"
                :label="`Estado: ${
                  !!QuoteStatusStore.StatusModel.status
                    ? 'Activo'
                    : 'Inactivo'
                }`"
                color="success"
                v-model="QuoteStatusStore.StatusModel.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
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
        v-if="QuoteStatusStore.tipo == 'filter'"
        :loading="loading"
        @click="Filtrar()"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="QuoteStatusStore.tipo == 'filter'"
        :loading="loading"
        @click="Limpiar()"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="QuoteStatusStore.tipo != 'filter'"
        :loading="loading"
        @click="Aceptar()"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          QuoteStatusStore.drawer = !QuoteStatusStore.drawer
        "
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
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
    ...mapPiniaActions(useQuoteStatusStore, ["GetListQuoteStatus", "getValidatePositionQuoteStatus", "getValidatePositionSelectQuoteStatus", "getValidatePositionReportQuoteStatus", "getValidatePositionCallsQuoteStatus", "getValidatePositionActualizarQuoteStatus", "getValidatePositionSelectActualizarQuoteStatus", "getValidatePositionReportActualizarQuoteStatus", "getValidatePositionCallsActualizarQuoteStatus", "setQuoteStatus", "actualizarQuoteStatus"]),
    getName() {
      if (this.QuoteStatusStore.tipo == "ver") {
        return `Estado : ${this.StatusQuote.name} – Modo Vista`;
      }
      if (this.QuoteStatusStore.tipo == "nuevo") {
        return "Nueva Estado";
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        return `Modificar Estado: ${this.StatusQuote.name}`;
      }
      if (this.QuoteStatusStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListQuoteStatus();
      this.loading = false;
      this.QuoteStatusStore.drawer =
        !this.QuoteStatusStore.drawer;
    },
    async Limpiar() {
      this.$refs.frmFilter.reset();
      setTimeout(async () => {
        this.QuoteStatusStore.StatusFilter.status = "1";
        this.QuoteStatusStore.StatusFilter.status_calls = "";
        this.QuoteStatusStore.StatusFilter.status_calls_all = "";
        this.loading = true;
        await this.GetListQuoteStatus();
        this.loading = false;
        this.QuoteStatusStore.drawer =
          !this.QuoteStatusStore.drawer;
      }, 1);
    },
    async validatePosition() {
      this.errPosition = "";
      if (this.QuoteStatusStore.tipo == "nuevo") {
        let val = await this.getValidatePositionQuoteStatus();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position = "";
        }
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        let val = await this.getValidatePositionActualizarQuoteStatus();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position = "";
        }
      }
    },
    async validatePositionSelect() {
      this.errPositionSelect = "";
      if (this.QuoteStatusStore.tipo == "nuevo") {
        let val = await this.getValidatePositionSelectQuoteStatus();
        this.errPositionSelect = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position_select = "";
        }
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        let val = await this.getValidatePositionSelectActualizarQuoteStatus();
        this.errPositionSelect = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position_select = "";
        }
      }
    },
    async validatePositionReport() {
      this.errPositionReport = "";
      if (this.QuoteStatusStore.tipo == "nuevo") {
        let val = await this.getValidatePositionReportQuoteStatus();
        this.errPositionReport = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position_report = "";
        }
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        let val = await this.getValidatePositionReportActualizarQuoteStatus();
        this.errPositionReport = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.position_report = "";
        }
      }
    },
    async validatePositionCalls() {
      this.errPositionCalls = "";
      if (this.QuoteStatusStore.tipo == "nuevo") {
        let val = await this.getValidatePositionCallsQuoteStatus();
        this.errPositionCalls = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.status_calls = "";
        }
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        let val = await this.getValidatePositionCallsActualizarQuoteStatus();
        this.errPositionCalls = val.mensaje;
        if (val.estadoflag) {
          this.QuoteStatusStore.StatusModel.status_calls = "";
        }
      }
    },
    async Aceptar() {
      if (this.QuoteStatusStore.tipo == "nuevo") {
        this.loading = true;
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid) {
            this.loading = true;
            await this.setQuoteStatus();
            await this.GetListQuoteStatus();
            this.loading = false;
          }
        }, 500);
        this.loading = false;
      }
      if (this.QuoteStatusStore.tipo == "editar") {
        this.loading = true;
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid) {
            await this.actualizarQuoteStatus();
            await this.GetListQuoteStatus();
          }
        }, 500);
        this.loading = false;
      }
      if (this.QuoteStatusStore.tipo == "ver") {
        this.QuoteStatusStore.drawer =
          !this.QuoteStatusStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useQuoteStatusStore),
    drawer: {
      get() {
        return this.QuoteStatusStore.drawer;
      },
      set(val) {
        return (this.QuoteStatusStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.StatusQuote = { ...this.QuoteStatusStore.StatusModel };
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
