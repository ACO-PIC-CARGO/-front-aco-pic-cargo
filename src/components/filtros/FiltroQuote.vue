<template>
  <v-card elevation="1">
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
        <div class="row mt-3 mx-1">
          <v-autocomplete
            :items="$store.state.pricing.listMarketing"
            label="Tipo de Marketing"
            dense
            search
            item-text="name"
            item-value="id"
            v-model="$store.state.pricing.filtro.id_marketing"
          ></v-autocomplete>

          <!-- <v-card-text class="mt-3 px-5 py-1"> -->

          <v-autocomplete
            auto-select-first
            :items="$store.state.pricing.listQuoteStatus"
            label="Estado de la Cotización"
            dense
            item-text="name"
            item-value="id"
            v-model="$store.state.pricing.filtro.id_status"
          ></v-autocomplete>
          <v-autocomplete
            :items="$store.state.pricing.listEjecutivo"
            label="Ejecutivo."
            dense
            search
            item-text="name"
            item-value="id_entitie"
            v-model="$store.state.pricing.filtro.id_entities"
          ></v-autocomplete>
          <v-autocomplete
            :items="$store.state.pricing.listModality"
            label="Sentido"
            v-model="$store.state.pricing.filtro.id_modality"
            dense
            item-text="name"
            item-value="id"
          ></v-autocomplete>
          <v-autocomplete
            :items="$store.state.pricing.listShipment"
            label="Carga*"
            dense
            item-text="embarque"
            item-value="id"
            v-model="$store.state.pricing.filtro.id_shipment"
          >
          </v-autocomplete>
          <v-autocomplete
            :items="$store.state.pricing.listIncoterms"
            label="Incoterm*"
            dense
            item-text="name"
            item-value="id"
            v-model="$store.state.pricing.filtro.id_incoterm"
          ></v-autocomplete>

          <FormatFecha
            :dense="true"
            label="Fecha Emisión"
            id="filtroDesde"
            v-model="$store.state.pricing.filtro.fechaemision"
            :clearable="true"
          />

          <FormatFecha
            :dense="true"
            label="Fecha Desde"
            id="filtroDesde"
            v-model="$store.state.pricing.filtro.fechainicio"
            :clearable="true"
          />
          <FormatFecha
            :dense="true"
            label="Fecha Hasta"
            id="filtroHasta"
            v-model="$store.state.pricing.filtro.fechafin"
            :clearable="true"
          />

          <div class="col-12 py-1">
            <v-radio-group v-model="$store.state.pricing.filtro.estado" row>
              <v-radio label="Activo" color="green" :value="true"></v-radio>
              <v-radio label="Inactivo" color="red" :value="false"></v-radio>
              <v-radio label="Todos" color="blue" value=""></v-radio
            ></v-radio-group>
          </div>
        </div>
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
      this.$store.state.pricing.pagina = 1
      this.$store.state.spiner = true;
      await this.getListQuote();
      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.spiner = false;
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.$store.state.pricing.filtro.id_marketing = "";
      this.$store.state.pricing.filtro.id_status = "";
      this.$store.state.pricing.filtro.id_entities = "";
      this.$store.state.pricing.filtro.id_modality = "";
      this.$store.state.pricing.filtro.id_shipment = "";
      this.$store.state.pricing.filtro.id_incoterm = "";
      this.$store.state.pricing.filtro.fechainicio = "";
      this.$store.state.pricing.filtro.fechafin = "";
      this.$store.state.pricing.filtro.estado = true;
      await this.getListQuote();
      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.pricing.filtro.estado = true;
      this.$store.state.spiner = false;
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

<style></style>
