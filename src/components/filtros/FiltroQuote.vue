<template>
  <v-card elevation="1" class="clsCardFiltro">
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      Filtrar Cotización <v-spacer></v-spacer>
      <v-btn
        variant="text"
        icon
        color="default"
        @click="
          $store.state.pricing.filtrarQuoteFlag =
            !$store.state.pricing.filtrarQuoteFlag
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-form ref="frmFiltro">
        <v-container>
          <v-row>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                label="Cliente"
                density="compact"
                :items="$store.state.clientes"
                item-title="namelong"
                item-value="id"
                placeholder="Clientes"
                v-model="$store.state.pricing.filtro.id_cliente"
                clearable
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listMarketing"
                label="Tipo de Marketing"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_marketing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                auto-select-first
                :items="$store.state.pricing.listQuoteStatus"
                label="Estado de la Cotización"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_status"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listEjecutivo"
                label="Pricing."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="$store.state.pricing.filtro.id_pricing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listEjecutivo"
                label="Ejecutivo."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="$store.state.pricing.filtro.id_entities"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listModality"
                label="Sentido"
                v-model="$store.state.pricing.filtro.id_modality"
                density="compact"
                item-title="name"
                item-value="id"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listShipment"
                label="Carga*"
                density="compact"
                item-title="embarque"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_shipment"
                clearable
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listIncoterms"
                label="Incoterm*"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_incoterm"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.masterusuarios.lstTemperatura"
                v-model="
                  $store.state.pricing.filtro.id_masterdetalletemperaturaventa
                "
                item-value="id"
                item-title="descripcion"
                density="compact"
                clearable
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
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-divider></v-divider>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <b>Filtro Fechas:</b>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Envío Cliente Desde"
                v-model="$store.state.pricing.filtro.fechaemisiondesde"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Envío Cliente Hasta"
                v-model="$store.state.pricing.filtro.fechaemisionhasta"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Creación Desde"
                id="filtroDesde"
                v-model="$store.state.pricing.filtro.fechainicio"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Creación Hasta"
                id="filtroHasta"
                v-model="$store.state.pricing.filtro.fechafin"
                clearable
              />
            </v-col>
            <v-col cols="12" v-if="errorFiltroFecha">
              <v-alert
                density="compact"
                style="background: #ffcdd2; color: #b71c1c"
              >
                <b>{{ errorFiltroFecha }}</b>
              </v-alert>
              <span> </span>
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
              <v-divider></v-divider>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="12">
              <p>Seleccione Tipo de reporte a Imprimir</p>
              <v-radio-group v-model="$store.state.pricing.filtro.tipopdf">
                <v-radio
                  label="Reporte por Estatus"
                  color="green"
                  :value="1"
                ></v-radio>
                <v-radio
                  label="Reporte por Vendedor"
                  color="green"
                  :value="2"
                ></v-radio>
                <v-radio
                  label="Reporte por Marketing"
                  color="green"
                  :value="3"
                ></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn class="mx-1" color="red" @click="imprimir()">
        <v-icon>mdi-file-pdf-box</v-icon> REPORTE
      </v-btn>
      <v-btn class="mx-1" color="success" @click="filtrar()">Filtrar</v-btn>
      <v-btn class="mx-1" color="default" @click="limpiar()">Limpiar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions, mapState } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      errorFiltroFecha: "",
    };
  },
  ...mapState(["clientes"]),
  methods: {
    ...mapActions([
      "getMarketingList",
      "getModulesEntities",
      "getQuoteStatus",
      "getModality",
      "getShipment",
      "getIncoterms",
      "getListQuote",
      "imprimiReporteListadoMarketing",
      "exportarExcelListadoQuote","imprimiReporteListado"
    ]),
    async reporteMarketing() {
      const f = this.$store.state.pricing.filtro;
      const rangoCreacionExcedido = this.rangoFechaSuperaUnMes(
        f.fechainicio,
        f.fechafin,
      );
      const rangoEmisionExcedido = this.rangoFechaSuperaUnMes(
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

      this.loading2 = true;
      let filtroSeleccionado = {};
      const store = this.$store.state.pricing;

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
      if (f.id_entities && !(f.tipopdf === 2 || f.tipopdf == "2")) {
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

      let filtroCabecera = {};

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
      if (f.id_entities && !(f.tipopdf === 2 || f.tipopdf == "2")) {
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
        filtroCabecera.Cliente = this.$store.state.clientes.find(
          (v) => v.id == f.id_cliente,
        )?.namelong;
      }

      await this.imprimiReporteListadoMarketing({
        filtroSeleccionado: filtroSeleccionado,
        filtroCabecera: filtroCabecera,
      }).catch((e) => {
        console.error(e);
      });
      this.loading2 = false;
    },
    async reporteListado() {
      const f = this.$store.state.pricing.filtro;
      const rangoCreacionExcedido = this.rangoFechaSuperaUnMes(
        f.fechainicio,
        f.fechafin,
      );
      const rangoEmisionExcedido = this.rangoFechaSuperaUnMes(
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

      this.loading2 = true;
      let filtroSeleccionado = {};
      const store = this.$store.state.pricing;

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
      if (f.id_entities && !(f.tipopdf === 2 || f.tipopdf == "2")) {
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

      let filtroCabecera = {};

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
      if (f.id_entities && !(f.tipopdf === 2 || f.tipopdf == "2")) {
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
        filtroCabecera.Cliente = this.$store.state.clientes.find(
          (v) => v.id == f.id_cliente,
        )?.namelong;
      }

      await this.imprimiReporteListado({
        filtroSeleccionado: filtroSeleccionado,
        filtroCabecera: filtroCabecera,
      }).catch((e) => {
        console.error(e);
      });
      this.loading2 = false;
    },
    async excelListadoQuote() {
      this.loading3 = true;
      await this.exportarExcelListadoQuote(this.filtro).catch((e) => {
        console.error(e);
      });
      this.loading3 = false;
    },
    rangoFechaSuperaUnMes(inicio, fin) {
      const fechaInicio = moment(inicio);
      const fechaFin = moment(fin);
      return (
        fechaInicio.isValid() &&
        fechaFin.isValid() &&
        fechaFin.isAfter(fechaInicio.clone().add(1, "month"), "day")
      );
    },
    validarFiltroFechas() {
      this.errorFiltroFecha = "";

      const filtro = this.$store.state.pricing.filtro;

      // Normalizar fechas: detectar valores vacíos o inválidos
      const tieneFecha = (fecha) => {
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
        this.errorFiltroFecha = "Solo 1 tipo de fecha: Creación o envío.";

        return false;
      }

      // 2. Obligatoriamente debe existir un rango completo
      if (!creacionDesde && !creacionHasta && !envioDesde && !envioHasta) {
        this.errorFiltroFecha =
          "Debes seleccionar un rango de fechas: Creación o de envío.";

        return false;
      }

      // 3. Validar rango de creación
      if (creacionDesde && !creacionHasta) {
        this.errorFiltroFecha = "Debes seleccionar la Fecha Creación Hasta.";

        return false;
      }

      if (!creacionDesde && creacionHasta) {
        this.errorFiltroFecha = "Debes seleccionar la Fecha Creación Desde.";

        return false;
      }

      // 4. Validar rango de envío
      if (envioDesde && !envioHasta) {
        this.errorFiltroFecha =
          "Debes seleccionar la Fecha Envío Cliente Hasta.";

        return false;
      }

      if (!envioDesde && envioHasta) {
        this.errorFiltroFecha =
          "Debes seleccionar la Fecha Envío Cliente Desde.";

        return false;
      }

      // 5. Todas las validaciones pasaron
      return true;
    },
    async filtrar() {
      if (!this.validarFiltroFechas()) return;
      this.$store.state.spiner = true;
      await this.getListQuote();
      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.spiner = false;
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.$store.state.pricing.filtro.id_marketing = null;
      this.$store.state.pricing.filtro.id_status = null;
      this.$store.state.pricing.filtro.id_entities = null;
      this.$store.state.pricing.filtro.id_modality = null;
      this.$store.state.pricing.filtro.id_shipment = null;
      this.$store.state.pricing.filtro.id_incoterm = null;
      this.$store.state.pricing.filtro.fechaemisiondesde = null;
      this.$store.state.pricing.filtro.fechaemisionhasta = null;
      this.$store.state.pricing.filtro.fechafin = moment().format("YYYY-01-01");
      this.$store.state.pricing.filtro.fechafin = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.$store.state.pricing.filtro.estado = true;
      await this.getListQuote();

      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.pricing.filtro.estado = true;
      this.$store.state.spiner = false;
    },
    getTextoPorId(list, id, valueKey = "id", textKey = "name") {
      if (!id) return "";
      const encontrado = list.find((item) => item[valueKey] === id);
      return encontrado ? encontrado[textKey] : "";
    },
    imprimir() {
      switch (this.$store.state.pricing.filtro.tipopdf) {
        case 1:
          this.reporteListado();
          break;
        case 2:
          this.reporteListado();
          break;
        case 3:
          this.reporteMarketing();
          break;
        default:
          console.log("Estado desconocido");
      }
    },
  },
  async mounted() {
    await this.getMarketingList();
    await this.getModulesEntities();
    await this.getQuoteStatus();
    await this.getModality();
    await this.getShipment();
    await this.getIncoterms();
  },
};
</script>
