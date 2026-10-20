<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import moment from "moment";
import "moment/dist/locale/es";
import type { ApiResponse } from "@/types/api";
import type { TrackingCarga } from "@/types/operaciones";

const route = useRoute();

const tracking = ref<TrackingCarga>({
  total_pasos_bitacora: 0,
  pasos_bitacora: [],
});

const getIconTipoEmbarque = computed(() => {
  return tracking.value.nameshipment == "Aéreo"
    ? "mdi-airplane mdi-rotate-90"
    : tracking.value.nameshipment == "LCL" ||
        tracking.value.nameshipment == "FCL"
      ? "mdi-ferry"
      : "";
});
const getFlagPaisPortBegin = computed(() => {
  return tracking.value.flagpais_portbegin
    ? tracking.value.flagpais_portbegin
    : "";
});
const getFlagPaisPortEnd = computed(() => {
  return tracking.value.flagpais_portend
    ? tracking.value.flagpais_portend
    : "";
});
const getEstadoBarraProgreso = computed(() => {
  return Math.floor(
    (tracking.value.pasos_bitacora.length / tracking.value.total_pasos_bitacora) * 100,
  );
});
const getFechaParseada = computed(() => {
  return (fecha: moment.MomentInput) => moment(fecha).format("DD [de] MMMM [de] YYYY");
});
const getTipoEmbarque = computed(() => {
  return tracking.value.nameshipment == "Aéreo"
    ? tracking.value.nameshipment
    : tracking.value.namelongshipment;
});

async function _getEstadoCarga() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getTrackingData/" + route.params.token,
    headers: {
      "Content-Type": "application/json",
    },
    data: {},
  };

  await axios<ApiResponse<TrackingCarga[]>>(config)
    .then(function (response) {
      if (response.data.estadoflag) {
        tracking.value = response.data.data[0]!;
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

onMounted(async () => {
  await _getEstadoCarga();
  moment.locale("es");
});
</script>

<template>
  <div>
    <v-toolbar 
      theme="dark" 
      class="toolbar"
    >
      <v-toolbar-title>TRACKING</v-toolbar-title>
    </v-toolbar>
     
    <v-main class="main">
      <v-container class="py-5">
        <v-card 
          elevation="2" 
          border
          class="mx-auto"
          max-width="920px"
        >
          <v-card-title>Estado de la Carga</v-card-title>           

          <v-card-text>
            <p class="text-body-medium text-black">
              Tipo de Carga: {{ getTipoEmbarque || "" }}
            </p>

            <v-row no-gutters>
              <v-col
                cols="4"
                class="text-left"
              >
                <v-icon
                  color="black"
                  size="large"
                >
                  mdi-factory
                </v-icon>
              </v-col>
              <v-col
                cols="4"
                class="text-center"
              >
                <v-icon
                  color="black"
                  size="large"
                >
                  {{ getIconTipoEmbarque }}
                </v-icon>
              </v-col>
              <v-col
                cols="4"
                class="text-right"
              >
                <v-icon
                  color="black"
                  size="large"
                >
                  mdi-factory
                </v-icon>
              </v-col>
            </v-row>

            <v-row
              no-gutters
              class="my-2"
            >
              <v-col>
                <v-progress-linear
                  :model-value="getEstadoBarraProgreso"
                  color="success"
                  bg-color="grey-lighten-3"
                  height="20"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="6">
                <p class="text-body-medium text-black text-left mb-1">
                  Origen: {{ tracking.namelong_portbegin || "" }}
                </p>
              </v-col>
              <v-col cols="6">
                <p class="text-body-medium text-black text-right mb-1">
                  Destino: {{ tracking.namelong_portend || "" }}
                </p>
              </v-col>
            </v-row>
            
            <v-row no-gutters>
              <v-col cols="6">
                <p class="text-left mb-0">
                  <img :src="getFlagPaisPortBegin">
                </p>
              </v-col>
              <v-col cols="6">
                <p class="text-right mb-0">
                  <img :src="getFlagPaisPortEnd"> 
                </p>
              </v-col>
            </v-row>
            
            <v-container
              class="pasosBitacora"
              v-if="tracking.pasos_bitacora.filter(v => v.visible_cliente).length"
            >
              <template
                v-for="item in tracking.pasos_bitacora"
                :key="item.id"
              >
                <v-row 
                  class="align-center" 
                  v-if="item.visible_cliente"
                >
                  <v-col cols="4">
                    <p class="text-body-medium text-black font-weight-medium">
                      {{ getFechaParseada(item.fecha) }}
                    </p>
                  </v-col>

                  <v-divider vertical />

                  <v-col cols="8">
                    <v-list>
                      <v-list-item>
                        <v-list-item-title class="font-weight-medium mb-2">
                          {{ item.namebitacora }}
                        </v-list-item-title>
                        <v-list-item-subtitle>{{ item.comentario }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </template>
            </v-container>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<style>
.toolbar {
  background-color: #252C32 !important;
  border-color: #252C32 !important;
}
.main {
  background-color: #f4f7fa;
}
.pasosBitacora {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  margin-left: 0;
  margin-right: 0;
  margin-top: 1.5rem;
  margin-bottom: .5rem;
}
</style>