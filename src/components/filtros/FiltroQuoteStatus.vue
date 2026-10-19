<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import type { EstadoCotizacion } from "@/types/cotizacion";

const QuoteStatusStore = useQuoteStatusStore();
const rootStore = useStore();

const errPosition = ref("");
const errPositionSelect = ref("");
const errPositionReport = ref("");
const errPositionCalls = ref("");
const loading = ref(false);
const StatusQuote = ref<EstadoCotizacion>({});
const frmFilter = useTemplateRef("frmFilter");
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => QuoteStatusStore.drawer);

watch(drawer, () => {
  StatusQuote.value = { ...QuoteStatusStore.StatusModel };
  frmDML.value!.resetValidation();
  errPosition.value = "";
  errPositionSelect.value = "";
  errPositionReport.value = "";
  errPositionCalls.value = "";
});

function getName() {
  if (QuoteStatusStore.tipo == "ver") {
    return `Estado : ${StatusQuote.value.name} – Modo Vista`;
  }
  if (QuoteStatusStore.tipo == "nuevo") {
    return "Nueva Estado";
  }
  if (QuoteStatusStore.tipo == "editar") {
    return `Modificar Estado: ${StatusQuote.value.name}`;
  }
  if (QuoteStatusStore.tipo == "filter") {
    return "Filtrar Registros";
  }
}
async function Filtrar() {
  loading.value = true;
  await QuoteStatusStore.GetListQuoteStatus();
  loading.value = false;
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
async function Limpiar() {
  frmFilter.value!.reset();
  setTimeout(async () => {
    QuoteStatusStore.StatusFilter.status = "1";
    QuoteStatusStore.StatusFilter.status_calls = "";
    QuoteStatusStore.StatusFilter.status_calls_all = "";
    loading.value = true;
    await QuoteStatusStore.GetListQuoteStatus();
    loading.value = false;
    QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
  }, 1);
}
async function validatePosition() {
  errPosition.value = "";
  if (QuoteStatusStore.tipo == "nuevo") {
    const val = await QuoteStatusStore.getValidatePositionQuoteStatus();
    errPosition.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position = "";
    }
  }
  if (QuoteStatusStore.tipo == "editar") {
    const val = await QuoteStatusStore.getValidatePositionActualizarQuoteStatus();
    errPosition.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position = "";
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validatePositionSelect() {
  errPositionSelect.value = "";
  if (QuoteStatusStore.tipo == "nuevo") {
    const val = await QuoteStatusStore.getValidatePositionSelectQuoteStatus();
    errPositionSelect.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position_select = "";
    }
  }
  if (QuoteStatusStore.tipo == "editar") {
    const val = await QuoteStatusStore.getValidatePositionSelectActualizarQuoteStatus();
    errPositionSelect.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position_select = "";
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validatePositionReport() {
  errPositionReport.value = "";
  if (QuoteStatusStore.tipo == "nuevo") {
    const val = await QuoteStatusStore.getValidatePositionReportQuoteStatus();
    errPositionReport.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position_report = "";
    }
  }
  if (QuoteStatusStore.tipo == "editar") {
    const val = await QuoteStatusStore.getValidatePositionReportActualizarQuoteStatus();
    errPositionReport.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.position_report = "";
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validatePositionCalls() {
  errPositionCalls.value = "";
  if (QuoteStatusStore.tipo == "nuevo") {
    const val = await QuoteStatusStore.getValidatePositionCallsQuoteStatus();
    errPositionCalls.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.status_calls = "";
    }
  }
  if (QuoteStatusStore.tipo == "editar") {
    const val = await QuoteStatusStore.getValidatePositionCallsActualizarQuoteStatus();
    errPositionCalls.value = val!.mensaje;
    if (val!.estadoflag) {
      QuoteStatusStore.StatusModel.status_calls = "";
    }
  }
}
async function Aceptar() {
  if (QuoteStatusStore.tipo == "nuevo") {
    loading.value = true;
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid) {
        loading.value = true;
        await QuoteStatusStore.setQuoteStatus();
        await QuoteStatusStore.GetListQuoteStatus();
        loading.value = false;
      }
    }, 500);
    loading.value = false;
  }
  if (QuoteStatusStore.tipo == "editar") {
    loading.value = true;
    setTimeout(async () => {
      if ((await frmDML.value!.validate()).valid) {
        await QuoteStatusStore.actualizarQuoteStatus();
        await QuoteStatusStore.GetListQuoteStatus();
      }
    }, 500);
    loading.value = false;
  }
  if (QuoteStatusStore.tipo == "ver") {
    QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
  }
}
</script>

<template>
  <v-card>
    <v-card-title
      class="d-flex align-center flex-wrap"
      primary-title
    >
      {{ getName() }}
      <v-spacer />
      <v-btn
        variant="text"
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
          <v-row>
            <v-col
              cols="12"
              class="py-1"
            >
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.code"
                density="compact"
                label="Código"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-1"
            >
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.name"
                density="compact"
                label="Nombre"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-1"
            >
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.description"
                density="compact"
                label="Descripción"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-1"
            >
              <v-text-field
                clearable
                v-model="QuoteStatusStore.StatusFilter.position"
                type="number"
                density="compact"
                label="Posición Cotizaciones"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-1"
            >
              <v-autocomplete
                :items="rootStore.state.masterusuarios.lstTemperatura"
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
                <template #item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
                      <span
                        class="d-inline-block"
                        :style="{
                          backgroundColor: item.codigo,
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                        }"
                      />
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
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

            <v-col
              cols="12"
              class="py-1"
            >
              <span> Estado</span>
              <v-radio-group
                v-model="QuoteStatusStore.StatusFilter.status"
                inline
                density="compact"
              >
                <v-radio
                  label="Activo"
                  color="green"
                  value="1"
                />
                <v-radio
                  label="Inactivo"
                  color="red"
                  value="0"
                />
                <v-radio
                  label="Todos"
                  color="blue"
                  value="null"
                />
              </v-radio-group>
            </v-col>
          </v-row>
        </div>
      </v-form>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="container">
          <v-row>
            <v-col
              cols="12"
              class="py-0"
            >
              <v-text-field
                v-if="QuoteStatusStore.tipo != 'nuevo'"
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.code"
                density="compact"
                label="Código"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0"
            >
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.name"
                density="compact"
                label="Nombre (*)"
                :rules="[(v) => !!v || 'Dato requerido']"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0"
            >
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.description"
                density="compact"
                label="Descripción"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0"
            >
              <v-text-field
                :readonly="QuoteStatusStore.tipo == 'ver'"
                v-model="QuoteStatusStore.StatusModel.position"
                @blur="validatePosition"
                :error-messages="errPosition"
                :rules="[(v) => !!v || 'Dato requerido']"
                type="number"
                density="compact"
                label="Posición Cotizaciones"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0"
            >
              <v-autocomplete
                :items="rootStore.state.masterusuarios.lstTemperatura"
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
                <template #item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
                      <span
                        class="d-inline-block"
                        :style="{
                          backgroundColor: item.codigo,
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                        }"
                      />
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
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

            <v-col
              cols="12"
              class="py-1"
            >
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
              />
            </v-col>
          </v-row>
        </div>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="QuoteStatusStore.tipo == 'filter'"
        :loading="loading"
        @click="Filtrar()"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="QuoteStatusStore.tipo == 'filter'"
        :loading="loading"
        @click="Limpiar()"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="QuoteStatusStore.tipo != 'filter'"
        :loading="loading"
        @click="Aceptar()"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          QuoteStatusStore.drawer = !QuoteStatusStore.drawer
        "
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped></style>
