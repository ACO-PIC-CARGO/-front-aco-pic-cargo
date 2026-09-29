<template>
  <v-card elevation="1" class="clsCardFiltro">
    <v-card-title primary-title>
      Filtrar Cotización <v-spacer></v-spacer>
      <v-btn
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
                dense
                :items="$store.state.clientes"
                item-text="namelong"
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
                dense
                item-text="name"
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
                dense
                item-text="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_status"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listEjecutivo"
                label="Pricing."
                dense
                search
                item-text="name"
                item-value="id_entitie"
                v-model="$store.state.pricing.filtro.id_pricing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listEjecutivo"
                label="Ejecutivo."
                dense
                search
                item-text="name"
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
                dense
                item-text="name"
                item-value="id"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-autocomplete
                :items="$store.state.pricing.listShipment"
                label="Carga*"
                dense
                item-text="embarque"
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
                dense
                item-text="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_incoterm"
                clearable
              ></v-autocomplete>
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
              <v-alert dense style="background: #ffcdd2; color: #b71c1c">
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
    ]),
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
