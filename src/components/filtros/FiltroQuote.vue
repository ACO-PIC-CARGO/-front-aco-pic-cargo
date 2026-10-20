<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useStore } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";

const rootStore = useStore();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();

const errorFiltroFecha = ref("");

function validarFiltroFechas() {
  errorFiltroFecha.value = "";

  const filtro = pricingStore.filtro;

  // Normalizar fechas: detectar valores vacíos o inválidos
  const tieneFecha = (fecha: unknown) => {
    if (fecha === null || fecha === undefined) {
      return false;
    }

    const valor = String(fecha).trim().toLowerCase();

    return (
      valor !== "" &&
      valor !== "null" &&
      valor !== "undefined" &&
      valor !== "invalid date"
    );
  };

  const creacionDesde = tieneFecha(filtro.fechainicio);
  const creacionHasta = tieneFecha(filtro.fechafin);

  const envioDesde = tieneFecha(filtro.fechaemisiondesde);
  const envioHasta = tieneFecha(filtro.fechaemisionhasta);

  // 1. No permitir mezclar creación y envío
  if ((creacionDesde || creacionHasta) && (envioDesde || envioHasta)) {
    errorFiltroFecha.value = "Solo 1 tipo de fecha: Creación o envío.";

    return false;
  }

  // 2. Obligatoriamente debe existir un rango completo
  if (!creacionDesde && !creacionHasta && !envioDesde && !envioHasta) {
    errorFiltroFecha.value =
      "Debes seleccionar un rango de fechas: Creación o de envío.";

    return false;
  }

  // 3. Validar rango de creación
  if (creacionDesde && !creacionHasta) {
    errorFiltroFecha.value = "Debes seleccionar la Fecha Creación Hasta.";

    return false;
  }

  if (!creacionDesde && creacionHasta) {
    errorFiltroFecha.value = "Debes seleccionar la Fecha Creación Desde.";

    return false;
  }

  // 4. Validar rango de envío
  if (envioDesde && !envioHasta) {
    errorFiltroFecha.value =
      "Debes seleccionar la Fecha Envío Cliente Hasta.";

    return false;
  }

  if (!envioDesde && envioHasta) {
    errorFiltroFecha.value =
      "Debes seleccionar la Fecha Envío Cliente Desde.";

    return false;
  }

  // 5. Todas las validaciones pasaron
  return true;
}
async function filtrar() {
  if (!validarFiltroFechas()) return;
  rootStore.state.spiner = true;
  await pricingStore.getListQuote();
  pricingStore.filtrarQuoteFlag = false;
  rootStore.state.spiner = false;
}
async function limpiar() {
  rootStore.state.spiner = true;
  pricingStore.filtro.id_marketing = null;
  pricingStore.filtro.id_status = null;
  pricingStore.filtro.id_entities = null;
  pricingStore.filtro.id_modality = null;
  pricingStore.filtro.id_shipment = null;
  pricingStore.filtro.id_incoterm = null;
  pricingStore.filtro.fechaemisiondesde = null;
  pricingStore.filtro.fechaemisionhasta = null;
  pricingStore.filtro.fechafin = moment().format("YYYY-01-01");
  pricingStore.filtro.fechafin = moment()
    .endOf("month")
    .format("YYYY-MM-DD");
  pricingStore.filtro.estado = true;
  await pricingStore.getListQuote();

  pricingStore.filtrarQuoteFlag = false;
  pricingStore.filtro.estado = true;
  rootStore.state.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTextoPorId(
  list: Record<string, unknown>[],
  id: unknown,
  valueKey = "id",
  textKey = "name",
) {
  if (!id) return "";
  const encontrado = list.find((item) => item[valueKey] === id);
  return encontrado ? encontrado[textKey] : "";
}

onMounted(async () => {
  await pricingStore.getMarketingList();
  await pricingStore.getModulesEntities();
  await pricingStore.getQuoteStatus();
  await pricingStore.getModality();
  await pricingStore.getShipment();
  await pricingStore.getIncoterms();
});
</script>

<template>
  <v-card
    elevation="1"
    class="clsCardFiltro"
  >
    <v-card-title
      class="d-flex align-center flex-wrap"
      primary-title
    >
      Filtrar Cotización <v-spacer />
      <v-btn
        variant="text"
        icon
        color="default"
        @click="
          pricingStore.filtrarQuoteFlag =
            !pricingStore.filtrarQuoteFlag
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-form ref="frmFiltro">
        <v-container>
          <v-row>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                label="Cliente"
                density="compact"
                :items="rootStore.state.clientes"
                item-title="namelong"
                item-value="id"
                placeholder="Clientes"
                v-model="pricingStore.filtro.id_cliente"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listMarketing"
                label="Tipo de Marketing"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtro.id_marketing"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                auto-select-first
                :items="pricingStore.listQuoteStatus"
                label="Estado de la Cotización"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtro.id_status"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listEjecutivo"
                label="Pricing."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="pricingStore.filtro.id_pricing"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listEjecutivo"
                label="Ejecutivo."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="pricingStore.filtro.id_entities"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listModality"
                label="Sentido"
                v-model="pricingStore.filtro.id_modality"
                density="compact"
                item-title="name"
                item-value="id"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listShipment"
                label="Carga*"
                density="compact"
                item-title="embarque"
                item-value="id"
                v-model="pricingStore.filtro.id_shipment"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="pricingStore.listIncoterms"
                label="Incoterm*"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtro.id_incoterm"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <v-autocomplete
                :items="masterusuariosStore.lstTemperatura"
                v-model="
                  pricingStore.filtro.id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-title="descripcion"
                density="compact"
                clearable
                label="Temperatura de Lead"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
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
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-divider />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <b>Filtro Fechas:</b>
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <FormatFecha
                :dense="true"
                label="Fecha Envío Cliente Desde"
                v-model="pricingStore.filtro.fechaemisiondesde"
                clearable
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <FormatFecha
                :dense="true"
                label="Fecha Envío Cliente Hasta"
                v-model="pricingStore.filtro.fechaemisionhasta"
                clearable
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <FormatFecha
                :dense="true"
                label="Fecha Creación Desde"
                id="filtroDesde"
                v-model="pricingStore.filtro.fechainicio"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
              class="py-1"
            >
              <FormatFecha
                :dense="true"
                label="Fecha Creación Hasta"
                id="filtroHasta"
                v-model="pricingStore.filtro.fechafin"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              v-if="errorFiltroFecha"
            >
              <v-alert
                density="compact"
                style="background: #ffcdd2; color: #b71c1c"
              >
                <b>{{ errorFiltroFecha }}</b>
              </v-alert>
              <span />
            </v-col>
            <!-- <v-col cols="12">
              <v-radio-group v-model="$store.state.pricing.filtro.estado" row>
                <v-radio label="Activo" color="green" :value="true"></v-radio>
                <v-radio label="Inactivo" color="red" :value="false"></v-radio>
                <v-radio label="Todos" color="blue" value=""></v-radio
              ></v-radio-group>
            </v-col> -->
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-divider />
            </v-col>
          </v-row>
          <v-row>
            <v-col class="12">
              <p>Seleccione Tipo de reporte a Imprimir</p>
              <v-radio-group v-model="pricingStore.filtro.tipopdf">
                <v-radio
                  label="Reporte por Estatus"
                  color="green"
                  :value="1"
                />
                <v-radio
                  label="Reporte por Vendedor"
                  color="green"
                  :value="2"
                />
              </v-radio-group>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        @click="filtrar()"
      >
        Filtrar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        @click="limpiar()"
      >
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
