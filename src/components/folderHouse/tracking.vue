<template>
  <div>
    <v-toolbar 
      dark 
      class="toolbar"
    >
      <v-toolbar-title>TRACKING</v-toolbar-title>
    </v-toolbar>
     
    <v-main class="main">
      <v-container class="py-5">
        <v-card 
          elevation="2" 
          outlined
          class="mx-auto"
          max-width="920px"
        >
          <v-card-title>Estado de la Carga</v-card-title>           

          <v-card-text>
            <p class="text-subtitle-2 black--text">Tipo de Carga: {{ getTipoEmbarque || "" }}</p>

            <v-row no-gutters>
              <v-col cols="4" class="text-left">
                <v-icon color="black" large>mdi-factory</v-icon>
              </v-col>
              <v-col cols="4" class="text-center">
                <v-icon color="black" large>{{ getIconTipoEmbarque }}</v-icon>
              </v-col>
              <v-col cols="4" class="text-right">
                <v-icon color="black" large>mdi-factory</v-icon>
              </v-col>
            </v-row>

            <v-row no-gutters class="my-2">
              <v-col>
                <v-progress-linear
                  :value="getEstadoBarraProgreso"
                  color="success"
                  background-color="grey lighten-3"
                  height="20"
                ></v-progress-linear>
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="6">
                <p class="text-subtitle-2 black--text text-left mb-1">Origen: {{ tracking.namelong_portbegin || "" }}</p>
              </v-col>
              <v-col cols="6">
                <p class="text-subtitle-2 black--text text-right mb-1">Destino: {{ tracking.namelong_portend || "" }}</p>
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
            
            <v-container class="pasosBitacora" v-if="tracking.pasos_bitacora.filter(v => v.visible_cliente).length">
              <v-row 
                class="align-center" 
                v-for="item in tracking.pasos_bitacora"
                :key="item.id"
                v-if="item.visible_cliente"
              >
                <v-col cols="4">
                  <p class="text-subtitle-2 black--text font-weight-medium">{{ getFechaParseada(item.fecha) }}</p>
                </v-col>

                <v-divider vertical></v-divider>

                <v-col cols="8">
                  <v-list>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium mb-2">{{ item.namebitacora }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.comentario }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

export default {
  name: "TrackingComponent",
  data() {
    return {
      progreso: 50,
      tracking: {
        total_pasos_bitacora: 0,
        pasos_bitacora: [],
      }
    }
  },
  async mounted() {
    await this._getEstadoCarga();
    moment.locale('es');
  },
  computed: {
    getIconTipoEmbarque() {
      return (this.tracking.nameshipment == "Aéreo") 
        ? "mdi-airplane mdi-rotate-90" 
        : (this.tracking.nameshipment == "LCL" || this.tracking.nameshipment == "FCL") 
        ? "mdi-ferry" 
        : "";
    },
    getFlagPaisPortBegin() {
      return this.tracking.flagpais_portbegin 
        ? this.tracking.flagpais_portbegin 
        : "";
    },
    getFlagPaisPortEnd() {
      return this.tracking.flagpais_portend 
        ? this.tracking.flagpais_portend 
        : "";
    },
    getEstadoBarraProgreso() {
      return Math.floor(this.tracking.pasos_bitacora.length / this.tracking.total_pasos_bitacora * 100);
    },
    getFechaParseada() {  
      return fecha => moment(fecha).format("DD [de] MMMM [de] YYYY");
    },
    getTipoEmbarque() {
      return (this.tracking.nameshipment == "Aéreo") 
        ? this.tracking.nameshipment 
        : this.tracking.namelongshipment;
    }
  },
  methods: {
    async _getEstadoCarga() {
      var vm = this;
      
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getTrackingData/" + vm.$route.params.token,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: {},
      };

      await axios(config)
        .then(function (response) {
          if (response.data.estadoflag) 
          {
            vm.tracking = response.data.data[0];
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
}
</script>

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