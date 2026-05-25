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
          clearable
          v-model="$store.state.controlgastosfiltro.id_canal"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsModality"
          item-text="name"
          item-value="id"
          label="Sentido"
          clearable
          v-model="$store.state.controlgastosfiltro.id_sentido"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsShipment"
          item-text="embarque"
          item-value="id"
          label="Tipo Embarque"
          clearable
          v-model="$store.state.controlgastosfiltro.id_tipo_embarque"
          return-object
          @change="
            activarPort(
              $store.state.controlgastosfiltro.id_tipo_embarque.id_transport,
            )
          "
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortBegin"
          item-text="name"
          item-value="id_port"
          label="Origen"
          clearable
          v-model="$store.state.controlgastosfiltro.id_origen"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsPortEnd"
          item-text="name"
          item-value="id_port"
          label="Destino"
          clearable
          v-model="$store.state.controlgastosfiltro.id_destino"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsProveedorList"
          item-text="namelong"
          item-value="id"
          label="Agente"
          clearable
          v-model="$store.state.controlgastosfiltro.id_agente"
        ></v-autocomplete>

        <v-text-field
          type="date"
          label="Fecha ETD"
          clearable
          v-model="$store.state.controlgastosfiltro.fecha_etd"
        ></v-text-field>

        <v-text-field
          type="date"
          label="Fecha ETA"
          clearable
          v-model="$store.state.controlgastosfiltro.fecha_eta"
        ></v-text-field>

        <v-row>
          <v-col col="6">
            <p>Estado Operativo</p>
            <v-radio-group
              v-model="$store.state.controlgastosfiltro.status_operativo"
            >
              <v-radio color="green" label="Abierto" value="0"></v-radio>
              <v-radio color="error" label="Cerrado" value="1"></v-radio>
              <v-radio color="default" label="Todos" value="2"></v-radio>
            </v-radio-group>
          </v-col>

          <v-col col="6">
            <p class="text-truncate">Estado Administrativo</p>
            <v-radio-group
              v-model="$store.state.controlgastosfiltro.status_administrativo"
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
        @click="$store.state.cg_filtrarData = !$store.state.cg_filtrarData"
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
    ...mapActions(["_getPortBegin", "_getPortEnd", "_getControlList"]),
    async filtrar() {
      this.$store.state.spiner = true;

      if (
        this.$store.state.controlgastosfiltro.id_tipo_embarqu &&
        Object.keys(this.$store.state.controlgastosfiltro.id_tipo_embarque)
          .length > 0
      ) {
        this.$store.state.controlgastosfiltro.id_transport =
          this.$store.state.controlgastosfiltro.id_tipo_embarque.id_transport;
      } else {
        this.$store.state.controlgastosfiltro.id_transport = null;
      }
      await this._getControlList();

      this.$store.state.cg_filtrarData = !this.$store.state.cg_filtrarData;

      this.$store.state.spiner = false;
    },
    async activarPort(id_transport) {
      await this._getPortBegin({ id_transport: id_transport });
      await this._getPortEnd({ id_transport: id_transport });
    },
    async limpiar() {
      this.$store.state.spiner = true;

      this.$refs.frmFiltro.reset();

      this.$store.state.controlgastosfiltro.status_operativo = "";
      this.$store.state.controlgastosfiltro.status_administrativo = "";
      this.$store.state.controlgastosfiltro.pagina = 1;
      this.$store.state.controlgastosfiltro.limite = 10;

      await this._getControlList();

      this.$store.state.cg_filtrarData = !this.$store.state.cg_filtrarData;

      this.$store.state.spiner = false;
    },
  },
};
</script>

<style></style>
