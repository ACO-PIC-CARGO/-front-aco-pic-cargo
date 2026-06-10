<template>
  <div>
    <v-container>
      <v-row dense>
        <v-col cols="12">
          <v-autocomplete
            :items="$store.state.itemsBegEndList"
            item-text="name"
            item-value="id"
            v-model="$store.state.service_id_begend"
          ></v-autocomplete>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="$store.state.services_name"
            label="Nombre del servicio"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field
            type="number"
            v-model="$store.state.services_price"
            label="Precio"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-btn color="primary" @click.native="_setServices()" block>
            Agregar Servicio
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import { mapActions } from "vuex";
import axios from '@/api/axios-config';
export default {
  name: "servicesControl",

  mounted() {
    this._getBegEndList();
  },

  methods: {
    ...mapActions(["_getBegEndList"]),
    cleanData() {
      (this.$store.state.services_name = ""),
        (this.$store.state.services_price = "");
    },
    _getHouseServices() {
      var vm = this;
      var data = {
        id: vm.$route.params.id,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getHouseServices",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          vm.$store.state.itemsHouseServices = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _setServices() {
      var vm = this;
      var data = {
        id_house: vm.$route.params.id,
        id_begend: vm.$store.state.service_id_begend,
        nameservice: vm.$store.state.services_name,
        price_services: vm.$store.state.services_price,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setServices",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm.$store.state.modalServices = false;
            vm._getHouseServices();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
<style>
.v-dialog .container {
  padding: 0;
}
</style>