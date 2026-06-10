<template>
  <div>
    <h3>Datos del Embarque</h3>

    <v-row dense>
      <v-col cols="12" md="12">
        <!--  v-if="$store.state.house_id_trasnport.id != 3" -->
        <v-text-field
          label="Proveedor"
          v-model="$store.state.houses.house.proveedor"
          readonly
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          label="Consigne HBL"
          v-model="$store.state.houses.house.consigner_real"
          readonly
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          label="Notify HBL"
          v-model="$store.state.houses.house.notify"
          readonly
        />
      </v-col>

      <!-- Fila 3: Motonave + Viaje (sin N° BL House en vista) -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.houses.house.motonave"
          label="Motonave"
          readonly
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.houses.house.nro_viaje"
          label="Viaje"
          readonly
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="4" lg="4" xl="4">
        <v-text-field
          label="Condición"
          v-model="$store.state.houses.house.conditions"
          readonly
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4" lg="4" xl="4">
        <v-text-field
          label="Monto"
          suffix="USD"
          v-model="$store.state.houses.house.monto"
          readonly
        />
      </v-col>
      <v-col cols="12" md="4" lg="4" xl="4">
        <v-text-field
          label="Moneda"
          v-model="$store.state.houses.house.moneda"
          readonly
        />
      </v-col>

      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="$store.state.master_id_trasnport.id == 2"
      >
        <v-autocomplete
          :items="itemsContainers"
          item-text="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="$store.state.house_id_containers"
        ></v-autocomplete>
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="$store.state.master_id_trasnport.id == 2"
      >
        <v-text-field
          label="N°. Contenedor"
          v-model="$store.state.house_nro_containers"
        ></v-text-field>
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="$store.state.master_id_trasnport.id == 2"
      >
        <v-text-field
          label="N°. Precinto"
          v-model="$store.state.house_nro_precinto"
        ></v-text-field>
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="$store.state.master_id_trasnport.id == 2"
      >
        <v-text-field v-model="$store.state.house_cantidad" label="Cant.">
          <v-icon
            class="btn__add"
            @click.native="
              _setHouseContainers(
                $store.state.house_id_containers.id,
                $store.state.house_id_containers.name,
                $store.state.house_nro_containers,
                $store.state.house_nro_precinto,
                $store.state.house_cantidad,
              )
            "
            slot="append"
            color="green"
          >
            mdi-plus
          </v-icon>
        </v-text-field>
      </v-col>

      <v-col cols="12" v-if="$store.state.master_id_trasnport.id == 2">
        <v-simple-table fixed-header height="180px">
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Nombre</th>
                <th class="text-left">N°. Contenedor</th>
                <th class="text-left">N°. Precinto</th>
                <th class="text-left">Cantidad</th>
                <th class="text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in $store.state.itemsHouseContainers"
                :key="item.id"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.nro_containers }}</td>
                <td>{{ item.nro_precinto }}</td>
                <td>{{ item.quantity }}</td>

                <td>
                  <v-icon
                    class="btn__add"
                    dense
                    color="red"
                    @click.native="_deleteContainers(item.id)"
                    >mdi-delete</v-icon
                  >
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import axios from '@/api/axios-config';;
export default {
  name: "dataEmbar",
  props: {
    isFormActionsDisabled: Boolean,
  },
  data() {
    return {
      itemsAgente: [],
    };
  },
  async mounted() {
    this.limpiarData();
    await Promise.all([
      this._getProveedor(),
      this.cargarClientes(),
      this._getProveedorRolShipper(),
      // this.getListQuote(),
    ]);

    // this.$store.state.spiner = true;

    // this.$store.state.spiner = false;
  },
  computed: {
    ...mapState([
      "itemsCoinsList",
      "itemsAgents",
      "itemsConsigners",
      "itemsNotify",
      "itemsColoaders",
      "itemsAirlines",
      "itemsNavieras",
      "itemsMotonave",
      "itemsContainers",
      "itemsFleteCon",
      "datanroMaster",
      "itemsProveedorList",
    ]),
  },
  methods: {
    ...mapActions([
      "_getnroMaster",
      "_getAgents",
      "_getConsigners",
      "_getNotify",
      "_getColoaders",
      "_getAirlines",
      "_getNavieras",
      "_getMotonave",
      "_getContainers",
      "_getFleteCon",
      "_getCoinsList",
      "_getHouseContainers",
      "_getProveedor",
      "cargarClientes",
      "_getProveedorRolShipper",
      "getListQuote",
    ]),

    cleanData() {
      this.$store.state.house_cantidad = "";
    },

    _deleteContainers(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "deleteContainers",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm._getHouseContainers();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _setHouseContainers(id, name, nro_containers, nro_precinto, quantity) {
      var vm = this;
      var data = {
        id_house: vm.$route.params.id,
        id_containers: id,
        nro_containers: nro_containers,
        nro_precinto: nro_precinto,
        quantity: quantity,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setHouseContainers",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            //vm.$store.state.modalServices = false;
            vm._getHouseContainers();
            vm.cleanData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _validaData() {
      var vm = this;
      if (vm.$route.params.id) {
        // vm.$store.state.house_Id_get = vm.$route.params.id;
        // var data = {
        //   id: vm.$route.params.id,
        //   id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        // };
        // var config = {
        //   method: "post",
        //   url: process.env.VUE_APP_URL_MAIN + "getHouseListId/",
        //   headers: {
        //    
        //     "Content-Type": "application/json",
        //   },
        //   data: data,
        // };
        // axios(config)
        //   .then(function (response) {
        //     vm.$store.state.copy_house = response.data.data[0];
        //     vm.$store.state.house_id_agente = response.data.data[0].id_agent;
        //     vm.$store.state.house_id_consigner =
        //       response.data.data[0].id_consigner;
        //     vm.$store.state.house_id_notify = response.data.data[0].id_notify;
        //     vm.$store.state.house_id_airlines =
        //       response.data.data[0].id_aerolinea;
        //     vm.$store.state.house_id_coloader =
        //       response.data.data[0].id_coloader;
        //     vm.$store.state.house_id_agente = response.data.data[0].id_agent;
        //     vm.$store.state.house_id_naviera = response.data.data[0].id_naviera;
        //     vm.$store.state.house_blmaster = response.data.data[0].nro_hbl;
        //     vm.$store.state.house_id_motonave =
        //       response.data.data[0].id_motonave;
        //     vm.$store.state.house_viaje = response.data.data[0].nro_viaje;
        //     vm.$store.state.house_bultos = response.data.data[0].bultos;
        //     vm.$store.state.house_peso = response.data.data[0].peso;
        //     vm.$store.state.house_volumen = response.data.data[0].volumen;
        //     vm.$store.state.house_id_condicion =
        //       response.data.data[0].id_conditions;
        //     vm.$store.state.house_id_coins = response.data.data[0].id_moneda;
        //     vm.$store.state.house_monto = response.data.data[0].monto;
        //     vm.$store.state.house_id = response.data.data[0].id;

        //     vm.$store.state.drawer = false;
        //   })
        //   .catch(function (error) {
        //     console.log(error);
        //   });
        await vm._getHouseContainers();
      }
    },

    _callModalEntitie(id_role) {
      this.$store.state.id_role_actual = id_role;
      if (id_role == 1) {
        this.$store.state.modalAgente = !this.$store.state.modalAgente;
      } else if (id_role == 11) {
        this.$store.state.modalEntitie = !this.$store.state.modalEntitie;
      } else if (id_role == 17) {
        this.$store.state.modalColoader = !this.$store.state.modalColoader;
      } else if (id_role == 2) {
        this.$store.state.modalNaviera = !this.$store.state.modalNaviera;
      }
    },

    _setDataContainers(id, name, cantidad) {
      this.$store.state.master_itemsContainers.push({
        id: id,
        name: name,
        nro_container: nrocontainer,
        nro_precinto: nroprecinto,
        cantidad: cantidad,
      });
    },

    _delContainers(index) {
      this.$store.state.master_itemsContainers.splice(index, 1);
    },
    limpiarData() {
      let vm = this;
      vm.$store.state.house_id_agente = "";
      vm.$store.state.house_id_consigner = "";
      vm.$store.state.house_id_notify = "";
      vm.$store.state.house_id_airlines = "";
      vm.$store.state.house_id_coloader = "";
      vm.$store.state.house_id_agente = "";
      vm.$store.state.house_id_naviera = "";
      vm.$store.state.house_blmaster = "";
      vm.$store.state.house_id_motonave = "";
      vm.$store.state.house_viaje = "";
      vm.$store.state.house_bultos = "";
      vm.$store.state.house_peso = "";
      vm.$store.state.house_volumen = "";
      vm.$store.state.house_id_condicion = "";
      vm.$store.state.house_id_coins = "";
      vm.$store.state.house_monto = "";
      vm.$store.state.house_id = "";
    },
  },
};
</script>

<style lang="scss" scoped>
.btn__add {
  cursor: pointer;
}
</style>
