<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from '@/api/http';
import type { ApiResponse } from "@/types/api";
import type { HouseResumenFacturacion } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

const appStore = useAppStore();
const route = useRoute();

onMounted(() => {
  appStore.drawer = true;
  _getData();
  if (route.params.code) {
    appStore.dataControl_Numero = route.params.code;
  }
  appStore.drawer = false;
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
        appStore.dataHouse_modality =
          response.data.data[0]!.id_transport;
         
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        response.data.data[0]!.namemodality;
        appStore.dataHouse_code_house =
          response.data.data[0]!.code_house;
        appStore.dataHouse_code_master =
          response.data.data[0]!.code_master;
        appStore.dataHouse_shipment =
          response.data.data[0]!.nameshipment;
        appStore.dataHouse_port_begin =
          response.data.data[0]!.nameportbegin;
        appStore.dataHouse_port_end =
          response.data.data[0]!.nameortEnd;

        appStore.dataHouse_agente = response.data.data[0]!.nameagent;
        appStore.dataHouse_operador = response.data.data[0]!.operador;
        appStore.dataHouse_ruc = response.data.data[0]!.documentlong;
        appStore.dataHouse_exp = response.data.data[0]!.nro_master;
        appStore.dataHouse_consigners =
          response.data.data[0]!.nameconsigner;
        appStore.dataHouse_notify = response.data.data[0]!.namenotify;

        appStore.dataHouse_bultos = response.data.data[0]!.bultos;
        appStore.dataHouse_peso = response.data.data[0]!.peso;
        appStore.dataHouse_volumen = response.data.data[0]!.volumen;
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
            <h3>N° CONTROL: {{ appStore.dataControl_Numero }}</h3>
            <h3 class="mt-4">
              Master: {{ appStore.dataHouse_code_master }}
            </h3>
            <h3 class="mt-1">
              House: {{ appStore.dataHouse_code_house }}
            </h3>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de Generales</h3>

          <div>
            <p>Sentido: {{ appStore.dataHouse_modality }}</p>
            <p>Tipo de Embarque: {{ appStore.dataHouse_shipment }}</p>
            <p>Puerto de Origen: {{ appStore.dataHouse_port_begin }}</p>
            <p>Puerto de Destino: {{ appStore.dataHouse_port_end }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos del Embarque</h3>

          <div>
            <p>Agente: {{ appStore.dataHouse_agente }}</p>
            <p>Consignatario: {{ appStore.dataHouse_consigners }}</p>
            <p>Notify: {{ appStore.dataHouse_notify }}</p>
          </div>
        </v-col>
        <v-col cols="3">
          <h3>Datos de la carga</h3>

          <div>
            <p>Bultos: {{ appStore.dataHouse_bultos }}</p>
            <p>Peso: {{ appStore.dataHouse_peso }} Kg</p>
            <p>Volumen: {{ appStore.dataHouse_volumen }} m<sup>3</sup></p>
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
