<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ServicioHouse } from "@/types/operaciones";

const route = useRoute();
const appStore = useAppStore();

onMounted(() => {
  appStore._getBegEndList();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleanData() {
  appStore.services_name = "";
  appStore.services_price = "";
}
function _getHouseServices() {
  const data = {
    id: route.params.id,
    id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getHouseServices",
    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  axios<ApiResponse<ServicioHouse[]>>(config)
    .then(function (response) {
      appStore.itemsHouseServices = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _setServices() {
  const data = {
    id_house: route.params.id,
    id_begend: appStore.service_id_begend,
    nameservice: appStore.services_name,
    price_services: appStore.services_price,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setServices",
    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  axios<{ status: number }>(config)
    .then(function (response) {
      if (response.data.status == 200) {
        appStore.modalServices = false;
        _getHouseServices();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
</script>

<template>
  <div>
    <v-container>
      <v-row density="compact">
        <v-col cols="12">
          <v-autocomplete
            :items="appStore.itemsBegEndList"
            item-title="name"
            item-value="id"
            v-model="appStore.service_id_begend"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="appStore.services_name"
            label="Nombre del servicio"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            type="number"
            v-model="appStore.services_price"
            label="Precio"
          />
        </v-col>
        <v-col cols="12">
          <v-btn
            color="primary"
            @click="_setServices()"
            block
          >
            Agregar Servicio
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style>
.v-dialog .container {
  padding: 0;
}
</style>
