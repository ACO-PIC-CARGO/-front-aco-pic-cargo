<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from '@/api/http';
import type { ApiResponse } from "@/types/api";
import type { HouseResumenFacturacion } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();

onMounted(() => {
  rootStore.state.drawer = true;
  _getData();
  if (route.params.code) {
    rootStore.state.dataControl_Numero = route.params.code;
  }
  rootStore.state.drawer = false;
});

function _getData() {
  if (route.params.id_house) {
    const data = {
      id: route.params.id_house,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseListId/",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios<ApiResponse<HouseResumenFacturacion[]>>(config)
      .then(function (response) {
        rootStore.state.dataHouse_modality =
          response.data.data[0]!.id_transport;
         
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        response.data.data[0]!.namemodality;
        rootStore.state.dataHouse_code_house =
          response.data.data[0]!.code_house;
        rootStore.state.dataHouse_code_master =
          response.data.data[0]!.code_master;
        rootStore.state.dataHouse_shipment =
          response.data.data[0]!.nameshipment;
        rootStore.state.dataHouse_port_begin =
          response.data.data[0]!.nameportbegin;
        rootStore.state.dataHouse_port_end =
          response.data.data[0]!.nameortEnd;

        rootStore.state.dataHouse_agente = response.data.data[0]!.nameagent;
        rootStore.state.dataHouse_operador = response.data.data[0]!.operador;
        rootStore.state.dataHouse_ruc = response.data.data[0]!.documentlong;
        rootStore.state.dataHouse_exp = response.data.data[0]!.nro_master;
        rootStore.state.dataHouse_consigners =
          response.data.data[0]!.nameconsigner;
        rootStore.state.dataHouse_notify = response.data.data[0]!.namenotify;

        rootStore.state.dataHouse_bultos = response.data.data[0]!.bultos;
        rootStore.state.dataHouse_peso = response.data.data[0]!.peso;
        rootStore.state.dataHouse_volumen = response.data.data[0]!.volumen;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="3">
          <div class="divExped">
            <h3>N° CONTROL: {{ rootStore.state.dataControl_Numero }}</h3>
            <h3 class="mt-4">
              Master: {{ rootStore.state.dataHouse_code_master }}
            </h3>
            <h3 class="mt-1">
              House: {{ rootStore.state.dataHouse_code_house }}
            </h3>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de Generales</h3>

          <div>
            <p>Sentido: {{ rootStore.state.dataHouse_modality }}</p>
            <p>Tipo de Embarque: {{ rootStore.state.dataHouse_shipment }}</p>
            <p>Puerto de Origen: {{ rootStore.state.dataHouse_port_begin }}</p>
            <p>Puerto de Destino: {{ rootStore.state.dataHouse_port_end }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos del Embarque</h3>

          <div>
            <p>Agente: {{ rootStore.state.dataHouse_agente }}</p>
            <p>Consignatario: {{ rootStore.state.dataHouse_consigners }}</p>
            <p>Notify: {{ rootStore.state.dataHouse_notify }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de la carga</h3>

          <div>
            <p>Bultos: {{ rootStore.state.dataHouse_bultos }}</p>
            <p>Peso: {{ rootStore.state.dataHouse_peso }} Kg</p>
            <p>Volumen: {{ rootStore.state.dataHouse_volumen }} m<sup>3</sup></p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

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
