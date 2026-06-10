<template>
  <div class="mb-10">
    <h3>Datos del Embarque</h3>

    <v-row dense>
      <v-col cols="12" md="12">
        <!--  v-if="$store.state.house_id_trasnport.id != 3" -->
        <v-autocomplete
          :items="$store.state.itemsProveedorRolShipper"
          item-text="namelong"
          item-value="id"
          label="Proveedor"
          v-model="$store.state.house_id_agente"
        >
          <v-icon
            @click.native="_callModalEntitie(1)"
            slot="append"
            class="btn__add"
            color="primary"
            :disabled="isFormActionsDisabled"
          >
            mdi-plus
          </v-icon>
        </v-autocomplete>
      </v-col>
      <v-col cols="12" md="12">
        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Cliente HBL"
          v-model="$store.state.house_id_consigner"
        >
          <v-icon
            @click.native="_callModalEntitie(11)"
            slot="append"
            class="btn__add"
            color="primary"
            :disabled="isFormActionsDisabled"
          >
            mdi-plus
          </v-icon>
          <v-icon
            @click.native="abrirEditarClinte(11)"
            slot="prepend"
            class="btn__add"
            color="primary"
            v-if="$store.state.house_id_consigner"
            :disabled="isFormActionsDisabled"
          >
            mdi-pencil
          </v-icon>
        </v-autocomplete>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.house_blmaster"
          label="N° BL House"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Consigne HBL"
          v-model="$store.state.house_id_consigner_real"
        >
          <v-icon
            @click.native="_callModalEntitie(11)"
            slot="append"
            class="btn__add"
            color="primary"
            :disabled="isFormActionsDisabled"
          >
            mdi-plus
          </v-icon>
        </v-autocomplete>
      </v-col>
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Notify HBL"
          v-model="$store.state.house_id_notify"
        >
          <v-icon
            @click.native="_callModalEntitie(11)"
            slot="append"
            class="btn__add"
            color="primary"
            :disabled="isFormActionsDisabled"
          >
            mdi-plus
          </v-icon>
        </v-autocomplete>
      </v-col>

      <v-col cols="12" md="6">
        <v-autocomplete
          :items="itemsMotonave"
          item-text="name"
          item-value="id"
          label="Motonave"
          v-model="$store.state.house_id_motonave"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.house_viaje"
          label="Viaje"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="3" lg="3" xl="3">
        <v-autocomplete
          :items="itemsFleteCon"
          item-text="name"
          item-value="id"
          label="Condición"
          v-model="$store.state.house_id_condicion"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="3" lg="3" xl="3">
        <v-text-field
          v-model="$store.state.house_monto"
          type="number"
          label="Monto"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3" lg="3" xl="3">
        <v-autocomplete
          :items="itemsCoinsList"
          item-text="symbol"
          item-value="id"
          label="Moneda"
          v-model="$store.state.house_id_coins"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" v-if="lstHouse.length > 0">
        <v-select
          :items="lstHouse"
          v-model="idHouse"
          label="Cambiar de House"
          item-text="house"
          @change="cambiarHouse"
          return-object
        ></v-select>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="3" xl="3" v-if="mostrarContenedor">
        <v-autocomplete
          :items="itemsContainers"
          item-text="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="$store.state.house_id_containers"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="3" lg="3" xl="3" v-if="mostrarContenedor">
        <v-text-field
          label="N°. Contenedor"
          v-model="$store.state.house_nro_containers"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3" lg="3" xl="3" v-if="mostrarContenedor">
        <v-text-field
          label="N°. Precinto"
          v-model="$store.state.house_nro_precinto"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3" lg="3" xl="3" v-if="mostrarContenedor">
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

      <v-col cols="12" v-if="mostrarContenedor">
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
import Swal from "sweetalert2";
export default {
  name: "dataEmbar",
  props: {
    isFormActionsDisabled: Boolean,
  },
  data() {
    return {
      itemsAgente: [],
      lstHouse: [],
      idHouse: null,
    };
  },
  async mounted() {
    if (!this.$route.params.id) {
      this.limpiarData();
    }

    await Promise.all([
      this._getProveedor(),
      this._getProveedorRolShipper(),
      this._getProveedorRolNaviera(),
      this._getMotonave(),
      this.cargarClientes(),
      this.cargarHousesAsociados(),
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
      "itemsShipment",
    ]),
    mostrarContenedor() {
      let TipoEmbarque = this.itemsShipment.find(
        (v) => v.id == this.$store.state.house_id_trasnport,
      );
      return TipoEmbarque && TipoEmbarque.code === "FCL";
    },
    mostrarAerolineaYGuia() {
      let TipoEmbarque = this.itemsShipment.find(
        (v) => v.id == this.$store.state.house_id_trasnport,
      );
      return TipoEmbarque && TipoEmbarque.code === "Aéreo";
    },
    mostrarContenedor() {
      let TipoEmbarque = this.itemsShipment.find(
        (v) => v.id == this.$store.state.house_id_trasnport,
      );
      return TipoEmbarque && TipoEmbarque.code === "FCL";
    },
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
      "_getProveedorRolNaviera",
    ]),

    cleanData() {
      this.$store.state.house_cantidad = "";
    },
    cargarHousesAsociados() {
      let vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "obtener_house_master_asociados",
        headers: {
         
          "Content-Type": "application/json",
        },
        params: { id: vm.$route.params.id },
      };
      axios(config)
        .then(function (response) {
          let res = response.data;
          if (res.estadoflag) {
            
            vm.lstHouse = res.data;
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    cambiarHouse(val) {
      console.log(val);
      Swal.fire({
        icon: "question",
        title: "¿Cambiar de House?",
        text: "Desea Ir A Editar el House: " + val.house,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        confirmButtonText: "Si Cambiar",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "red",
        showCancelButton: true,
      }).then((respuesta) => {
        if (respuesta.isConfirmed) {
          this.$router.push({
            name: "controlHouseEditar",
            params: {
              id: val.id,
            },
          });
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      });
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
            vm._getHouseContainers({ id: vm.$route.params.id });
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
            vm._getHouseContainers({ id: vm.$route.params.id });
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
        await this._getHouseContainers({ vm: this.$route.params.id });
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

    abrirEditarClinte(id_role) {
      this._callModalEntitie(id_role);
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
