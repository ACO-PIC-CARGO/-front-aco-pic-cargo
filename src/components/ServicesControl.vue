<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";

const route = useRoute();
const rootStore = useStore();

onMounted(() => {
  rootStore.dispatch("_getBegEndList");
});

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
  axios<ApiResponse>(config)
    .then(function (response) {
      rootStore.state.itemsHouseServices = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _setServices() {
  const data = {
    id_house: route.params.id,
    id_begend: rootStore.state.service_id_begend,
    nameservice: rootStore.state.services_name,
    price_services: rootStore.state.services_price,
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
        rootStore.state.modalServices = false;
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
            :items="rootStore.state.itemsBegEndList"
            item-title="name"
            item-value="id"
            v-model="rootStore.state.service_id_begend"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="rootStore.state.services_name"
            label="Nombre del servicio"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            type="number"
            v-model="rootStore.state.services_price"
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
