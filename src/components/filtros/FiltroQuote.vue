<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";

const appStore = useAppStore();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();

const errorFiltroFecha = ref("");
const loadingReporte = ref(false);

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
  appStore.spiner = true;
  await pricingStore.getListQuote();
  pricingStore.filtrarQuoteFlag = false;
  appStore.spiner = false;
}
async function limpiar() {
  appStore.spiner = true;
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
  appStore.spiner = false;
}
function rangoFechaSuperaUnMes(inicio: string | null | undefined, fin: string | null | undefined) {
  const fechaInicio = moment(inicio);
  const fechaFin = moment(fin);
  return (
    fechaInicio.isValid() &&
    fechaFin.isValid() &&
    fechaFin.isAfter(fechaInicio.clone().add(1, "month"), "day")
  );
}
async function reporteMarketing() {
  const f = pricingStore.filtro;
  const rangoCreacionExcedido = rangoFechaSuperaUnMes(
    f.fechainicio,
    f.fechafin,
  );
  const rangoEmisionExcedido = rangoFechaSuperaUnMes(
    f.fechaemisiondesde,
    f.fechaemisionhasta,
  );

  if (rangoCreacionExcedido || rangoEmisionExcedido) {
    const rangoExcedido =
      rangoCreacionExcedido && rangoEmisionExcedido
        ? "Los rangos de creación y emisión"
        : rangoCreacionExcedido
          ? "El rango de creación"
          : "El rango de emisión";
    await Swal.fire({
      icon: "warning",
      title: "No se puede generar el reporte",
      html: `<strong>${rangoExcedido} supera el máximo permitido.</strong><br>Selecciona un periodo de hasta <strong>1 mes</strong> para continuar.`,
      confirmButtonText: "Revisar fechas",
    });
    return;
  }

  loadingReporte.value = true;
  const filtroSeleccionado: Record<string, string | undefined> = {};
  const store = pricingStore;

  if (f.fechainicio) filtroSeleccionado["Creación De:"] = f.fechainicio;
  if (f.fechafin) filtroSeleccionado["Creación Hasta:"] = f.fechafin;
  if (f.fechaemisiondesde)
    filtroSeleccionado["Fecha de Envío De:"] = f.fechaemisiondesde;
  if (f.fechaemisionhasta)
    filtroSeleccionado["Fecha de Envío Hasta:"] = f.fechaemisionhasta;

  if (f.id_marketing) {
    filtroSeleccionado.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroSeleccionado["Estado Cotización"] = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroSeleccionado["Ejecutivo Pricing"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == "2")) {
    filtroSeleccionado["Ejecutivo Venta"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroSeleccionado.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroSeleccionado["Tipo Carga"] = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroSeleccionado.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }

  const filtroCabecera: Record<string, string | undefined> = {};

  if (f.id_marketing) {
    filtroCabecera.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroCabecera.QuoteStatus = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroCabecera.Pricing = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == "2")) {
    filtroCabecera.Ejecutivo = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroCabecera.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroCabecera.Shipment = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroCabecera.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }
  if (f.id_cliente) {
    filtroCabecera.Cliente = appStore.clientes.find(
      (v: { id: number | string; namelong: string }) => v.id == f.id_cliente,
    )?.namelong;
  }

  await pricingStore.imprimiReporteListadoMarketing({
    filtroSeleccionado: filtroSeleccionado,
    filtroCabecera: filtroCabecera,
  }).catch((e) => {
    console.error(e);
  });
  loadingReporte.value = false;
}
async function reporteListado() {
  const f = pricingStore.filtro;
  const rangoCreacionExcedido = rangoFechaSuperaUnMes(
    f.fechainicio,
    f.fechafin,
  );
  const rangoEmisionExcedido = rangoFechaSuperaUnMes(
    f.fechaemisiondesde,
    f.fechaemisionhasta,
  );

  if (rangoCreacionExcedido || rangoEmisionExcedido) {
    const rangoExcedido =
      rangoCreacionExcedido && rangoEmisionExcedido
        ? "Los rangos de creación y emisión"
        : rangoCreacionExcedido
          ? "El rango de creación"
          : "El rango de emisión";
    await Swal.fire({
      icon: "warning",
      title: "No se puede generar el reporte",
      html: `<strong>${rangoExcedido} supera el máximo permitido.</strong><br>Selecciona un periodo de hasta <strong>1 mes</strong> para continuar.`,
      confirmButtonText: "Revisar fechas",
    });
    return;
  }

  loadingReporte.value = true;
  const filtroSeleccionado: Record<string, string | undefined> = {};
  const store = pricingStore;

  if (f.fechainicio) filtroSeleccionado["Creación De:"] = f.fechainicio;
  if (f.fechafin) filtroSeleccionado["Creación Hasta:"] = f.fechafin;
  if (f.fechaemisiondesde)
    filtroSeleccionado["Fecha de Envío De:"] = f.fechaemisiondesde;
  if (f.fechaemisionhasta)
    filtroSeleccionado["Fecha de Envío Hasta:"] = f.fechaemisionhasta;

  if (f.id_marketing) {
    filtroSeleccionado.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroSeleccionado["Estado Cotización"] = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroSeleccionado["Ejecutivo Pricing"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == "2")) {
    filtroSeleccionado["Ejecutivo Venta"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroSeleccionado.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroSeleccionado["Tipo Carga"] = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroSeleccionado.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }

  const filtroCabecera: Record<string, string | undefined> = {};

  if (f.id_marketing) {
    filtroCabecera.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroCabecera.QuoteStatus = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroCabecera.Pricing = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == '2')) {
    filtroCabecera.Ejecutivo = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroCabecera.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroCabecera.Shipment = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroCabecera.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }
  if (f.id_cliente) {
    filtroCabecera.Cliente = appStore.clientes.find(
      (v: { id: number | string; namelong: string }) => v.id == f.id_cliente,
    )?.namelong;
  }

  await pricingStore.imprimiReporteListado({
    filtroSeleccionado: filtroSeleccionado,
    filtroCabecera: filtroCabecera,
  }).catch((e) => {
    console.error(e);
  });
  loadingReporte.value = false;
}
function imprimir() {
  if (pricingStore.filtro.tipopdf === 3) return reporteMarketing();
  return reporteListado();
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
                :items="appStore.clientes"
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
                <v-radio
                  label="Reporte por Marketing"
                  color="green"
                  :value="3"
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
        color="red"
        :loading="loadingReporte"
        :disabled="loadingReporte"
        @click="imprimir()"
      >
        <v-icon>mdi-file-pdf-box</v-icon> REPORTE
      </v-btn>
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
