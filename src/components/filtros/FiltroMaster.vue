<template>
  <v-card elevation="0">
    <v-card-title class="black white--text rounded-0"
      >EXPEDIENTES MÁSTER</v-card-title
    >
    <v-card-title>FILTRAR REGISTROS</v-card-title>

    <v-card-text>
      <v-form ref="frmFiltro">
        <v-autocomplete
          :items="$store.state.masterusuarios.lstCanales"
          item-text="descripcion"
          item-value="id"
          label="Canal"
          dense
          v-model="$store.state.master_filtro.id_canal"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsModality"
          item-text="name"
          item-value="id"
          label="Sentido"
          dense
          v-model="$store.state.master_filtro.id_sentido"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsShipment"
          item-text="embarque"
          item-value="id"
          label="Tipo Embarque"
          dense
          v-model="$store.state.master_filtro.id_tipo_embarque"
          return-object
          @change="
            activarPort(
              $store.state.master_filtro.id_tipo_embarque.id_transport,
            )
          "
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortBegin"
          item-text="name"
          item-value="id_port"
          label="Origen"
          dense
          v-model="$store.state.master_filtro.id_origen"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortEnd"
          item-text="name"
          item-value="id_port"
          label="Destino"
          dense
          v-model="$store.state.master_filtro.id_destino"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsProveedorList"
          item-text="namelong"
          item-value="id"
          label="Agente"
          dense
          v-model="$store.state.master_filtro.id_agente"
        ></v-autocomplete>
        <v-row>
          <v-col cols="12" md="6">
            <FormatFecha
              v-model="$store.state.master_filtro.fecha_etd_desde"
              label="Fecha ETD Desde "
              :dense="true"
            />
          </v-col>
          <v-col cols="12" md="6">
            <FormatFecha
              v-model="$store.state.master_filtro.fecha_etd_hasta"
              label="Fecha ETD Hasta"
              :dense="true"
            />
          </v-col>
          <v-col cols="12" md="6">
            <FormatFecha
              v-model="$store.state.master_filtro.fecha_eta_desde"
              label="Fecha ETA Desde"
              :dense="true"
            />
          </v-col>
          <v-col cols="12" md="6">
            <FormatFecha
              v-model="$store.state.master_filtro.fecha_eta_hasta"
              label="Fecha ETA Hasta"
              :dense="true"
            />
          </v-col>
          <v-col col="6">
            <p>Estado Operativo</p>
            <v-radio-group
              v-model="$store.state.master_filtro.status_operativo"
            >
              <v-radio color="green" label="Abierto" value="0"></v-radio>
              <v-radio color="error" label="Cerrado" value="1"></v-radio>
              <v-radio color="default" label="Todos" value="2"></v-radio>
            </v-radio-group>
          </v-col>

          <v-col col="6">
            <p class="text-truncate">Estado Administrativo</p>
            <v-radio-group
              v-model="$store.state.master_filtro.status_administrativo"
            >
              <v-radio color="green" label="Abierto" value="0"></v-radio>
              <v-radio color="error" label="Cerrado" value="1"></v-radio>
              <v-radio color="default" label="Todos" value="2"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
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
          $store.state.master_filtrarData = !$store.state.master_filtrarData
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
import FormatFecha from "../comun/FormatFecha.vue";
import moment from "moment";
export default {
  components: {
    FormatFecha,
  },
  mixins: [miMixin],
  data() {
    return {};
  },
  mounted() {
    this.$store.state.master_filtro.fecha_etd_desde =
      moment().format("YYYY-01-01");
    this.$store.state.master_filtro.fecha_eta_desde =
      moment().format("YYYY-01-01");
    this.$store.state.master_filtro.fecha_etd_hasta = moment()
      .endOf("month")
      .format("YYYY-MM-DD");
    this.$store.state.master_filtro.fecha_eta_hasta = moment()
      .endOf("month")
      .format("YYYY-MM-DD");
  },
  methods: {
    ...mapActions([
      "_getPortBegin",
      "_getPortEnd",
      "_getMasterList",
      "_getTotalMasterList",
    ]),
    async filtrar() {
      this.$store.state.spiner = true;

      this.$store.state.master_filtro.pagina = 1;
      this.$store.state.master_filtro.limite = 10;

      await this._getTotalMasterList();
      await this._getMasterList();

      this.$store.state.master_filtrarData =
        !this.$store.state.master_filtrarData;

      this.$store.state.spiner = false;
    },
    async activarPort(id_transport) {
      await this._getPortBegin({ id_transport: id_transport });
      await this._getPortEnd({ id_transport: id_transport });
    },
    async limpiar() {
      this.$store.state.spiner = true;

      this.$refs.frmFiltro.reset();

      this.$store.state.master_filtro.status_operativo = "";
      this.$store.state.master_filtro.status_administrativo = "";
      this.$store.state.master_filtro.pagina = 1;
      this.$store.state.master_filtro.limite = 10;

      await this._getTotalMasterList();
      await this._getMasterList();

      this.$store.state.master_filtrarData =
        !this.$store.state.master_filtrarData;

      this.$store.state.spiner = false;
    },
  },
};
</script>

<style></style>
