<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="3">
          <div class="divExped">
            <h3>N° CONTROL: {{ $store.state.dataControl_Numero }}</h3>
            <h3 class="mt-4">
              Master: {{ $store.state.dataHouse_code_master }}
            </h3>
            <h3 class="mt-1">House: {{ $store.state.dataHouse_code_house }}</h3>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de Generales</h3>

          <div>
            <p>Sentido: {{ $store.state.dataHouse_modality }}</p>
            <p>Tipo de Embarque: {{ $store.state.dataHouse_shipment }}</p>
            <p>Puerto de Origen: {{ $store.state.dataHouse_port_begin }}</p>
            <p>Puerto de Destino: {{ $store.state.dataHouse_port_end }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos del Embarque</h3>

          <div>
            <p>Agente: {{ $store.state.dataHouse_agente }}</p>
            <p>Consignatario: {{ $store.state.dataHouse_consigners }}</p>
            <p>Notify: {{ $store.state.dataHouse_notify }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de la carga</h3>

          <div>
            <p>Bultos: {{ $store.state.dataHouse_bultos }}</p>
            <p>Peso: {{ $store.state.dataHouse_peso }} Kg</p>
            <p>Volumen: {{ $store.state.dataHouse_volumen }} m<sup>3</sup></p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import axios from '@/api/axios-config';
import { mapState } from "vuex";
export default {
  name: "dataHouse",
  mounted() {
    let vm = this;
    vm.$store.state.drawer = true;
    this._getData();
    if (this.$route.params.code) {
      this.$store.state.dataControl_Numero = this.$route.params.code;
    }
    vm.$store.state.drawer = false;
  },
  methods: {
    _getData() {
      var vm = this;
      if (vm.$route.params.id_house) {
        var data = {
          id: vm.$route.params.id_house,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getHouseListId/",
          headers: {
           
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then(function (response) {
            vm.$store.state.dataHouse_modality =
              response.data.data[0].id_transport;
            response.data.data[0].namemodality;
            vm.$store.state.dataHouse_code_house =
              response.data.data[0].code_house;
            vm.$store.state.dataHouse_code_master =
              response.data.data[0].code_master;
            vm.$store.state.dataHouse_shipment =
              response.data.data[0].nameshipment;
            vm.$store.state.dataHouse_port_begin =
              response.data.data[0].nameportbegin;
            vm.$store.state.dataHouse_port_end =
              response.data.data[0].nameortEnd;

            vm.$store.state.dataHouse_agente = response.data.data[0].nameagent;
            vm.$store.state.dataHouse_operador = response.data.data[0].operador;
            vm.$store.state.dataHouse_ruc = response.data.data[0].documentlong;
            vm.$store.state.dataHouse_exp = response.data.data[0].nro_master;
            vm.$store.state.dataHouse_consigners =
              response.data.data[0].nameconsigner;
            vm.$store.state.dataHouse_notify = response.data.data[0].namenotify;

            vm.$store.state.dataHouse_bultos = response.data.data[0].bultos;
            vm.$store.state.dataHouse_peso = response.data.data[0].peso;
            vm.$store.state.dataHouse_volumen = response.data.data[0].volumen;
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.divExped {
  background: #eaeaea;
  border-radius: 5px;
  padding: 10px;
}

p {
  margin: 0px;
}
</style>
