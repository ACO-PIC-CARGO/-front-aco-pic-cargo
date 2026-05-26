<template>
  <v-card elevation="0">
    <v-card-title class="black white--text rounded-0"
      >EXPEDIENTES HOUSE's</v-card-title
    >
    <v-card-title>FILTRAR REGISTROS</v-card-title>

    <v-card-text>
      <v-form ref="frmFiltro">
        <v-autocomplete
          :items="$store.state.itemsMasterList"
          item-text="code_master"
          item-value="id"
          label="Exp. Máster"
          dense
          v-model="$store.state.house_filtro.id_master"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsModality"
          item-text="name"
          item-value="id"
          label="Sentido"
          dense
          v-model="$store.state.house_filtro.id_sentido"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsShipment"
          item-text="embarque"
          item-value="id"
          label="Tipo Embarque"
          dense
          v-model="$store.state.house_filtro.id_tipo_embarque"
          return-object
          @change="
            activarPort($store.state.house_filtro.id_tipo_embarque.id_transport)
          "
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortBegin"
          item-text="name"
          item-value="id_port"
          label="Origen"
          dense
          v-model="$store.state.house_filtro.id_origen"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortEnd"
          item-text="name"
          item-value="id_port"
          label="Destino"
          dense
          v-model="$store.state.house_filtro.id_destino"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Cliente del House"
          dense
          v-model="$store.state.house_filtro.id_cliente"
        ></v-autocomplete>

        <v-text-field
          type="date"
          label="Fecha ETD"
          dense
          v-model="$store.state.house_filtro.fecha_etd"
        ></v-text-field>

        <v-text-field
          type="date"
          label="Fecha ETA"
          dense
          v-model="$store.state.house_filtro.fecha_eta"
        ></v-text-field>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn small class="mx-1" color="success" @click="filtrar()">
        Aceptar
      </v-btn>
      <v-btn
        small
        class="mx-1"
        color="error"
        @click="
          $store.state.house_filtrarData = !$store.state.house_filtrarData
        "
      >
        Cancelar
      </v-btn>
      <v-btn small class="mx-1" color="default" @click="limpiar()">
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import miMixin from "../mixins/funciones";
export default {
  mixins: [miMixin],
  data() {
    return {};
  },
  methods: {
    ...mapActions([
      "_getPortBegin",
      "_getPortEnd",
      "_getHouseListAll",
      "_getTotalHouseListAll",
      "listarHouse",
    ]),
    async filtrar() {
      this.$store.state.spiner = true;

      await this.listarHouse(this.$store.state.house_filtro);
      this.$store.state.spiner = false;
      this.$store.state.house_filtrarData = false;
    },
    async activarPort(id_transport) {
      await this._getPortBegin({ id_transport: id_transport });
      await this._getPortEnd({ id_transport: id_transport });
    },
    async limpiar() {
      this.$store.state.spiner = true;

      this.$refs.frmFiltro.reset();
      this.$store.state.house_filtro.pagina = 1;
      this.$store.state.house_filtro.limite = 10;

      await this._getTotalHouseListAll();
      await this._getHouseListAll();

      this.$store.state.house_filtrarData =
        !this.$store.state.house_filtrarData;

      this.$store.state.spiner = false;
    },
  },
};
</script>

<style></style>
