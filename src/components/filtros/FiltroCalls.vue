<template>
  <v-card elevation="1" class="clsCardFiltro">
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      Filtrar Cotización <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          pricingStore.filtrarCallsFlag =
            !pricingStore.filtrarCallsFlag
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
                v-model="pricingStore.filtroCalls.id_cliente"
                clearable
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listMarketing"
                label="Tipo de Marketing"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtroCalls.id_marketing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listQuoteStatus"
                label="Estado de la Cotización"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtroCalls.id_status"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listEjecutivo"
                label="Pricing."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="pricingStore.filtroCalls.id_pricing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listEjecutivo"
                label="Ejecutivo."
                density="compact"
                item-title="name"
                item-value="id_entitie"
                v-model="pricingStore.filtroCalls.id_entities"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listModality"
                label="Sentido"
                v-model="pricingStore.filtroCalls.id_modality"
                density="compact"
                item-title="name"
                item-value="id"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listShipment"
                label="Carga*"
                density="compact"
                item-title="embarque"
                item-value="id"
                v-model="pricingStore.filtroCalls.id_shipment"
                clearable
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="pricingStore.listIncoterms"
                label="Incoterm*"
                density="compact"
                item-title="name"
                item-value="id"
                v-model="pricingStore.filtroCalls.id_incoterm"
                clearable
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="masterusuariosStore.lstTemperatura"
                v-model="
                  pricingStore.filtroCalls
                    .id_masterdetalletemperaturaventa
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
                v-model="pricingStore.filtroCalls.fechaemisiondesde"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Envío Cliente Hasta"
                v-model="pricingStore.filtroCalls.fechaemisionhasta"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Creación Desde"
                id="filtroDesde"
                v-model="pricingStore.filtroCalls.fechainicio"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Creación Hasta"
                id="filtroHasta"
                v-model="pricingStore.filtroCalls.fechafin"
                clearable
              />
            </v-col>
            <v-col cols="12" v-if="errorFiltroFecha">
              <v-alert density="compact" style="background: #ffcdd2; color: #b71c1c">
                <b>{{ errorFiltroFecha }}</b>
              </v-alert>
              <span> </span>
            </v-col>

            <!-- <v-col cols="12">
              <v-radio-group v-model="$store.state.pricing.filtroCalls.estado" row>
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
              <v-radio-group v-model="pricingStore.filtroCalls.tipopdf">
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
              </v-radio-group>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn class="mx-1" color="success" @click="filtrar()">Filtrar</v-btn>
      <v-btn class="mx-1" color="default" @click="limpiar()">Limpiar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      errorFiltroFecha: "",
    };
  },
  computed: {
    ...mapStores(usePricingStore, useMasterusuariosStore),
  },
  methods: {
    ...mapPiniaActions(usePricingStore, ["getMarketingList", "getModulesEntities", "getQuoteStatus", "getModality", "getShipment", "getIncoterms", "getListQuote", "getQuoteCall"]),

    validarFiltroFechas() {
      this.errorFiltroFecha = "";

      const filtro = this.pricingStore.filtroCalls;

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
      await this.getQuoteCall(this.pricingStore.filtroCalls);
      this.pricingStore.filtrarCallsFlag = false;
      this.$store.state.spiner = false;
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.pricingStore.filtroCalls.id_marketing = null;
      this.pricingStore.filtroCalls.id_status = null;
      this.pricingStore.filtroCalls.id_entities = null;
      this.pricingStore.filtroCalls.id_modality = null;
      this.pricingStore.filtroCalls.id_shipment = null;
      this.pricingStore.filtroCalls.id_incoterm = null;
      this.pricingStore.filtroCalls.fechaemisiondesde = null;
      this.pricingStore.filtroCalls.fechaemisionhasta = null;
      this.pricingStore.filtroCalls.fechafin =
        moment().format("YYYY-01-01");
      this.pricingStore.filtroCalls.fechafin = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.pricingStore.filtroCalls.estado = true;
      await this.getQuoteCall(this.pricingStore.filtroCalls);
      this.pricingStore.filtrarCallsFlag = false;
      this.$store.state.spiner = false;
    },
  },
  async mounted() {
    // await this.getMarketingList();
    // await this.getModulesEntities();
    // await this.getQuoteStatus();
    // await this.getModality();
    // await this.getShipment();
    // await this.getIncoterms();
  },
};
</script>

<style></style>
