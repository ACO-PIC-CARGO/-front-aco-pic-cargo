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
                :items="$store.state.pricing.listMarketing"
                label="Tipo de Marketing"
                dense
                search
                item-text="name"
                item-value="id"
                v-model="$store.state.pricing.filtro.id_marketing"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <!-- <v-card-text class="mt-3 px-5 py-1"> -->

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
                label="Fecha Emisión Desde"
                v-model="$store.state.pricing.filtro.fechaemisiondesde"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Emisión Hasta"
                v-model="$store.state.pricing.filtro.fechaemisionhasta"
                clearable
              />
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Desde"
                id="filtroDesde"
                v-model="$store.state.pricing.filtro.fechainicio"
                clearble
              />
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <FormatFecha
                :dense="true"
                label="Fecha Hasta"
                id="filtroHasta"
                v-model="$store.state.pricing.filtro.fechafin"
                clearble
              />
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
import { mapActions } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
export default {
  components: {
    FormatFecha,
  },
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
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getListQuote();
      this.emitirFiltro();
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
      moment().format("YYYY-01-01");
      this.$store.state.pricing.filtro.fechafin = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.$store.state.pricing.filtro.estado = true;
      await this.getListQuote();
      this.emitirFiltro();
      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.pricing.filtro.estado = true;
      this.$store.state.spiner = false;
    },
    getTextoPorId(list, id, valueKey = "id", textKey = "name") {
      if (!id) return "";
      const encontrado = list.find((item) => item[valueKey] === id);
      return encontrado ? encontrado[textKey] : "";
    },
    emitirFiltro() {
      const state = this.$store.state.pricing;

      let filtroBruto = {
        Marketing: this.getTextoPorId(
          state.listMarketing,
          state.filtro.id_marketing,
          "id",
          "name",
        ),
        "Estado de la Cotización": this.getTextoPorId(
          state.listQuoteStatus,
          state.filtro.id_status,
          "id",
          "name",
        ),
        Pricing: this.getTextoPorId(
          state.listEjecutivo,
          state.filtro.id_pricing,
          "id_entitie",
          "name",
        ),
        Ejecutivo: this.getTextoPorId(
          state.listEjecutivo,
          state.filtro.id_entities,
          "id_entitie",
          "name",
        ),
        Sentido: this.getTextoPorId(
          state.listModality,
          state.filtro.id_modality,
          "id",
          "name",
        ),
        "Tipo Carga": this.getTextoPorId(
          state.listShipment,
          state.filtro.id_shipment,
          "id",
          "embarque",
        ),
        Incoterm: this.getTextoPorId(
          state.listIncoterms,
          state.filtro.id_incoterm,
          "id",
          "name",
        ),
        "Fecha Emisión Desde": state.filtro.fechaemisiondesde,
        "Fecha Emisión Hasta": state.filtro.fechaemisionhasta,
        "Fecha Desde": state.filtro.fechainicio,
        "Fecha Hasta": state.filtro.fechafin,
      };

      // Filtra solo los que tienen valor y aplica Capitalize a las llaves si es necesario
      let filtroLimpio = {};
      for (const [key, value] of Object.entries(filtroBruto)) {
        if (value !== "" && value !== null && value !== undefined) {
          const llaveCapitalizada = key
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
          filtroLimpio[llaveCapitalizada] = value;
        }
      }

      this.$store.state.pricing.filtroSeleccionado = filtroLimpio;
      this.$emit("filtroCotizacion", filtroLimpio);
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


