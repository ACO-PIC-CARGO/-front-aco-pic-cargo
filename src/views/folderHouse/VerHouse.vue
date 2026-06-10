<template>
  <v-form ref="formControlHouse" :readonly="formControlHouseReadonly">
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-text>
              <dataGen />
            </v-card-text>
          </v-card>
          <v-card class="mt-5">
            <v-card-text>
              <dataEmbar :isFormActionsDisabled="formControlHouseReadonly" />
            </v-card-text>
          </v-card>

          <v-row class="mt-2">
            <template v-if="$route.name != 'controlHouseVer'">
              <v-col cols="4" md="4">
                <v-btn
                  color="success"
                  @click="_setHouseEdit()"
                  block
                  dark
                  small
                  :loading="loadingBotonGuardarHouse"
                  >GUARDAR CAMBIOS
                </v-btn>
              </v-col>
              <v-col cols="4" md="4">
                <v-btn
                  color="red"
                  @click="eliminarHouse()"
                  block
                  dark
                  small
                  :loading="loadingBotonEliminarHouse"
                >
                  ELIMINAR
                </v-btn>
              </v-col>
            </template>
            <template
              v-if="
                $route.name == 'controlHouseEditar' ||
                $route.name == 'controlHouseVer'
              "
            >
              <v-col cols="4" md="4">
                <!-- <v-btn color="orange" @click="atras()" block dark small>
                  REGRESAR
                </v-btn> -->
              </v-col>
            </template>
            <!-- <v-col cols="6" md="6">
                <v-btn color="orange" block class="mr-2" dark>Limpiar </v-btn>
              </v-col> -->
          </v-row>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-text>
              <services
                :isFormActionsDisabled="formControlHouseReadonly"
                :itemsNotificaciones="getItemsNotificaciones()"
                @send-notificacion="sendNotificacion"
                @ir-editar="irAVerMaster"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-text>
              <Bitacora :isFormActionsDisabled="formControlHouseReadonly" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div style="position: fixed; bottom: 16px; right: 16px; z-index: 3000">
        <v-speed-dial
          v-model="fab"
          :direction="'top'"
          :transition="'slide-y-reverse-transition'"
          class="acciones-dial"
        >
          <template v-slot:activator>
            <v-btn v-model="fab" color="info" dark fab>
              <v-icon v-if="fab"> mdi-close </v-icon>
              <v-icon v-else> mdi-tools </v-icon>
            </v-btn>
          </template>

          <v-btn
            color="red"
            dark
            :loading="loadingBotonEliminarHouse"
            @click="eliminarHouse()"
          >
            <v-icon left>mdi-delete</v-icon>
            Eliminar
          </v-btn>
          <v-btn
            color="orange darken-2"
            dark
            :loading="loadingBotonTracking"
            @click="_generateTrackingToken"
          >
            <v-icon left>mdi-link-variant</v-icon>
            Tracking
          </v-btn>
          <v-btn
            :style="{ backgroundColor: 'rgb(92, 116, 137)', color: 'white' }"
            @click="abrirModalFormato()"
          >
            <v-icon left style="color: white">mdi-printer</v-icon>
            Imprimir
          </v-btn>

          <v-btn color="deep-purple" dark @click="openNotificaciones">
            <v-icon left style="transform: rotate(-45deg)">mdi-send</v-icon>
            Notificaciones
          </v-btn>
          <v-btn color="light-green lighten-1" dark @click="irAVerMaster()">
            <v-icon left>mdi-pencil</v-icon>
            Editar
          </v-btn>
        </v-speed-dial>
      </div>
      <div
        v-if="$store.state.house_enlace_tracking"
        style="
          position: fixed;
          right: 88px;
          bottom: 16px;
          z-index: 3500;
          max-width: 420px;
          width: calc(100vw - 120px);
        "
      >
        <v-text-field
          v-model="$store.state.house_enlace_tracking"
          label="Enlace de Tracking"
          readonly
          outlined
          dense
          hide-details
        >
          <template v-slot:append>
            <v-btn
              icon
              small
              color="primary"
              @click="_copyEnlaceTracking($store.state.house_enlace_tracking)"
            >
              <v-icon small>mdi-content-copy</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
      <!-- Menú de notificaciones -->
      <v-menu
        v-model="openMenuNotificaciones"
        top
        offset-y
        content-class="elevation-0"
      >
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on"></span>
        </template>
        <v-list color="transparent" v-show="displayMenuNotificaciones">
          <v-list-item
            v-for="(item, index) in getItemsNotificaciones()"
            :key="index"
            class="px-0"
          >
            <v-list-item-title>
              <v-btn
                depressed
                block
                small
                color="primary"
                @click="sendNotificacion(item)"
              >
                {{ item.title }}
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <!-- Modal para seleccionar formato de impresión -->
      <v-dialog v-model="dialogFormato" max-width="400px">
        <v-card>
          <v-card-title primary-title class="light-blue darken-2 white--text">
            Imprimir Formato {{ isAereo() ? "GUÍA AÉREA" : "BL" }}
          </v-card-title>
          <v-card-text class="pt-4">
            <p class="subtitle-1 mb-2">¿Imprimir con fondo?</p>
            <v-radio-group v-model="formatoflag">
              <v-radio label="Sí" :value="true"></v-radio>
              <v-radio label="No" :value="false"></v-radio>
            </v-radio-group>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="success" v-if="isAereo()" @click="exportarFormatoAWB()">
              <v-icon left>mdi-printer</v-icon>
              Imprimir Guía Aérea
            </v-btn>
            <v-btn color="success" v-else @click="exportarFormatoHBL()">
              <v-icon left>mdi-printer</v-icon>
              Imprimir BL
            </v-btn>
            <v-btn color="grey" text @click="dialogFormato = false">
              Cancelar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
    
    <!-- <v-footer app color="white" elevation="5" height="72" inset>
        <router-link class="div__button_bottom" to="">
          <img width="30" :src="$store.state.imgFolder" alt="" />
          <p class="title_button_bottom">Abrir carpeta</p>
        </router-link>
        <router-link class="div__button_bottom" to="">
          <img width="30" :src="$store.state.imgMailbox" alt="" />
          <p class="title_button_bottom">Linea de correos</p>
        </router-link>
      </v-footer> -->
    <v-dialog v-model="abrirModalCuentasNotificacion" persistent width="70%">
      <v-card>
        <v-card-title primary-title>
          Seleccione las cuentas a utilizar
        </v-card-title>
        <v-card-text>
          <p class="red--text">{{ errorCuentas }}</p>
          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="$store.state.cuentas_pic"
            item-key="id"
            show-select
            class="elevation-1"
          >
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            :loading="loadingBotonNotificaciones"
            @click="enviarNotificacion(notificacion)"
            >Enviar Notificación</v-btn
          >
          <v-btn
            color="danger"
            @click="
              abrirModalCuentasNotificacion = !abrirModalCuentasNotificacion
            "
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>
<script>
import dataGen from "@/components/folderHouse/dataGenVer.vue";
//import houselist from "./houselist.vue";
import dataEmbar from "@/components/folderHouse/dataEmbarVer.vue";
import Bitacora from "@/components/folderHouse/bitacoraVer.vue";
import services from "@/components/folderHouse/servicesVer.vue";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';
export default {
  name: "controlMasterCom",
  components: {
    dataGen,
    //houselist,
    dataEmbar,
    Bitacora,
    services,
  },
  data: () => ({
    selected: [],
    errorCuentas: "",
    headers: [
      { value: "label", text: "Nombre" },
      { value: "cuenta", text: "Cuenta" },
      { value: "cci", text: "CCI" },
      { value: "symbol", text: "Moneda" },
    ],
    notificacion: null,
    abrirModalCuentasNotificacion: false,
    statusData: false,
    formControlHouseReadonly: false,
    itemsNotificacionesImport: [
      { title: "Aviso de Salida", value: 1 },
      { title: "Actualización de Salida", value: 2 },
      { title: "Pre-Aviso de Llegada", value: 3 },
      { title: "Aviso de Llegada", value: 4 },
      { title: "Actualización de Llegada", value: 5 },
    ],
    itemsNotificacionesExport: [
      { title: "Aviso de Salida", value: 1 },
      { title: "Actualización de Salida", value: 2 },
      { title: "Aviso de Llegada", value: 3 },
    ],
    houseData: {},
    displayMenuNotificaciones: false,
    loadingBotonNotificaciones: false,
    loadingBotonGuardarHouse: false,
    loadingBotonEliminarHouse: false,
    fab: false,
    loadingBotonTracking: false,
    openMenuNotificaciones: false,
    dialogFormato: false,
    formatoflag: true,
  }),
  async mounted() {
    this.$store.state.spiner = true;
    await this.verHouse(this.$route.params);
    if (this.$route.name == "controlHouseVer") {
      this.formControlHouseReadonly = true;
    }
    const actionLabel = this.$route.name == "controlHouseEditar" ? "EDITAR" : "VER";
    this.$store.state.mainTitle = `N° BL House ${
      (this.$store.state.houses.house && this.$store.state.houses.house.nro_hbl) || ""
    } - ${
      (this.$store.state.houses.house && this.$store.state.houses.house.consigner) || ""
    } [${actionLabel}]`;
    this.$store.state.spiner = false;
    await this.fetchDataBank({
      code: "",
      name: "",
      acronym: "",
      description: "",
      status: 1,
    });
  },
  computed: {
    ...mapState(["itemsModality", "itemsShipment"]),
  },
  methods: {
    ...mapActions([
      "_getnroMaster",
      "_getnroHouse",
      "_getHouseList",
      "atras",
      "_getModality",
      "_getShipment",
      "getListBanksDetailsCargarPorSucursal",
      "verHouse",
      "fetchDataBank",
      "getQuoteNoAsignadoHouse",
    ]),
    irAVerMaster() {
      this.$router.push({
        name: "controlHouseEditar",
        id: this.$route.params.id,
      });
      window.location.reload();
    },
    abrirModalFormato() {
      this.dialogFormato = true;
    },
    async exportarFormatoAWB() {
      try {
        const response = await axios({
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}generar_formato_awb`,
          params: {
            id_house: this.$route.params.id,
            formatoflag: this.formatoflag,
          },
          headers: {
           
          },
          responseType: "blob",
        });

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, -5);
        const filename = `formato_awb_${timestamp}.xlsx`;
        link.download = filename;
        link.click();

        window.URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("Error exportando archivo:", err);
        this.$swal({
          icon: "error",
          title: "Error",
          text: "No se pudo generar el formato",
        });
      }
      this.dialogFormato = false;
    },
    async exportarFormatoHBL() {
      try {
        const response = await axios({
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}generar_formato_bl`,
          params: {
            id_house: this.$route.params.id,
            formatoflag: this.formatoflag,
          },
          headers: {
           
          },
          responseType: "blob",
        });

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, -5);
        const filename = `formato_bl_${timestamp}.xlsx`;
        link.download = filename;
        link.click();

        window.URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("Error exportando archivo:", err);
        this.$swal({
          icon: "error",
          title: "Error",
          text: "No se pudo generar el formato",
        });
      }
      this.dialogFormato = false;
    },
    async _generateTrackingToken() {
      const { v4: uuidv4 } = require("uuid");
      const token = uuidv4();

      this.loadingBotonTracking = true;
      await this._setTrackingToken(token);
      this.loadingBotonTracking = false;
    },
    async _setTrackingToken(token) {
      var vm = this;

      var data = {
        id_house: vm.$route.params.id,
        token: token,
        fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .substr(0, 10),
      };

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + `setTrackingToken`,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            vm.$store.state.house_enlace_tracking =
              "https://aco.agentedecargaonline.com/tracking/" +
              response.data.data[0].token;

            vm.$swal({
              icon: "success",
              title: "Éxito",
              text: "Enlace de tracking generado correctamente",
            });
          } else {
            Swal.fire({
              icon: response.data.status == "401" ? "error" : "info",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            });
          }
        })
        .catch(function (error) {
          console.log(error);
          vm.$swal({
            icon: "error",
            title: "Error",
            text: "No se pudo generar el enlace de tracking",
          });
        });
    },
    async _copyEnlaceTracking(texto) {
      await navigator.clipboard.writeText(texto);
      this.$swal({
        icon: "success",
        title: "Copiado",
        text: "Enlace copiado al portapapeles",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    openNotificaciones() {
      this.validarMenuNotificaciones();
    },
    _setMasterContainer(id_master, id_containers, quantity) {
      var vm = this;
      //vm._getnroMaster();
      var data = JSON.stringify({
        id_master: id_master,
        id_containers: id_containers,
        quantity: quantity,
        status: 1,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setMasterContainers",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {})
        .catch(function (error) {
          console.log(error);
          vm.$swal({
            icon: "error",
            title: "Lo sentimos",
            text: error,
          });
        });
    },
    async _setHouseEdit() {
      var vm = this;

      vm.loadingBotonGuardarHouse = !vm.loadingBotonGuardarHouse;

      //vm._getnroMaster();
      var data = JSON.stringify({
        id_modality: this.$store.state.house_sentido
          ? this.$store.state.house_sentido
          : "",
        id_shipment: this.$store.state.house_id_trasnport
          ? this.$store.state.house_id_trasnport
          : "",
        id_consigner_real: vm.$store.state.house_id_consigner_real
          ? vm.$store.state.house_id_consigner_real
          : "",
        id_port_begin: this.$store.state.house_origen
          ? this.$store.state.house_origen
          : "",
        id_port_end: this.$store.state.house_destino
          ? this.$store.state.house_destino
          : "",
        id_proveedor: vm.$store.state.house_id_agente
          ? vm.$store.state.house_id_agente
          : "",
        id_consigner: vm.$store.state.house_id_consigner
          ? vm.$store.state.house_id_consigner
          : "",
        id_notify: vm.$store.state.house_id_notify
          ? vm.$store.state.house_id_notify
          : "",
        id_aerolinea: vm.$store.state.house_id_airlines
          ? vm.$store.state.house_id_airlines
          : "",
        id_coloader: vm.$store.state.house_id_coloader
          ? vm.$store.state.house_id_coloader
          : "",
        id_naviera: vm.$store.state.house_id_naviera
          ? vm.$store.state.house_id_naviera
          : "",
        id_incoterms: vm.$store.state.house_incoterms
          ? vm.$store.state.house_incoterms
          : "",
        nro_hbl: vm.$store.state.house_blmaster
          ? vm.$store.state.house_blmaster
          : "",
        id_motonave: vm.$store.state.house_id_motonave
          ? vm.$store.state.house_id_motonave
          : "",
        nro_viaje: vm.$store.state.house_viaje
          ? vm.$store.state.house_viaje
          : "",
        bultos: vm.$store.state.house_bultos
          ? vm.$store.state.house_bultos
          : "",
        peso: vm.$store.state.house_peso ? vm.$store.state.house_peso : "",
        volumen: vm.$store.state.house_volumen
          ? vm.$store.state.house_volumen
          : "",
        id_conditions: vm.$store.state.house_id_condicion
          ? vm.$store.state.house_id_condicion
          : "",
        id_moneda: vm.$store.state.house_id_coins
          ? vm.$store.state.house_id_coins
          : "",
        monto: vm.$store.state.house_monto ? vm.$store.state.house_monto : "",
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_cot: vm.$store.state.house_cotizacion
          ? vm.$store.state.house_cotizacion
          : "",
        lstservices: this.$store.state.itemsHouseServices || [],
        id: vm.$store.state.house_id,
      });

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "setHouseEdit",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.status == "401") {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }

          vm.statusData = true;
          await vm._getHouseList();
          await vm._getHouseById();
          await vm._getHouseServices();

          vm.$swal({
            icon: "success",
            title: "Excelente",
            text: "House actualizado éxitosamente",
          }).then((result) => {
            if (vm.$store.state.houses.house.cantidad_houses_x_master > 1) {
              vm.$swal({
                icon: "question",
                html: "<b>¿Desea actualizar los costos en el Control de Gastos ahora?</b>",
                showConfirmButton: true,
                confirmButtonText: "Sí",
                confirmButtonColor: "#4CAF50",
                showDenyButton: true,
                denyButtonText: "No, en otro momento",
                allowOutsideClick: false,
              }).then(({ isConfirmed }) => {
                if (isConfirmed) {
                  // vm.$router.push("/home/folderBilling/editControlGastos/view/" + vm.$store.state.houses.house.id_master);
                  vm.$router.push({
                    name: "editControlGasto",
                    params: {
                      code_master: vm.$store.state.houses.house.code_master,
                      id_branch: JSON.parse(
                        sessionStorage.getItem("dataUser")
                      )[0].id_branch,
                    },
                  });
                }
              });
            }
          });

          vm.loadingBotonGuardarHouse = !vm.loadingBotonGuardarHouse;
          // vm.$router.go(-1);
        })
        .catch(function (error) {
          console.log(error);
          vm.$swal({
            icon: "error",
            title: "Lo sentimos",
            text: error,
          });
        });
    },
    eliminarHouse() {
      let vm = this;

      if (vm.$store.state.houses.house.cantidad_houses_x_master > 1) {
        Swal.fire({
          icon: "question",
          title: "ADVERTENCIA",
          text: "¿Está seguro que desea eliminar el house?",
          showDenyButton: true,
          confirmButtonText: "Si",
          denyButtonText: "No",
        }).then(async (result) => {
          if (result.isConfirmed) {
            vm.loadingBotonEliminarHouse = !vm.loadingBotonEliminarHouse;

            var config = {
              method: "put",
              url:
                process.env.VUE_APP_URL_MAIN +
                "setHouseDelete/" +
                vm.$route.params.id,
              headers: {
               
                "Content-Type": "application/json",
              },
            };

            await axios(config).then(function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              if (response.data.status == "401") {
                Swal.fire({
                  icon: "error",
                  text: response.data.mensaje,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  allowEnterKey: false,
                }).then((resSwal) => {
                  if (resSwal.isConfirmed && response.data.status == "401") {
                    router.push({ name: "Login" });
                    setTimeout(() => {
                      window.location.reload();
                    }, 10);
                  }
                });
              }

              if (response.data.statusBol) {
                Swal.fire({
                  icon: "success",
                  title: "REGISTRO ELIMINADO.",
                });

                vm.loadingBotonEliminarHouse = !vm.loadingBotonEliminarHouse;
                vm.$router.go(-1);
              }
            });
          }
        });
      } else {
        Swal.fire({
          icon: "info",
          text: "Un expediente máster debe tener al menos un house asignado",
        });
      }
    },
    isImportacion() {
      let val = false;
      let name = this.$store.state.houses.house.modality;
      if (name == "Importación") {
        val = true;
      }

      return val;
    },
    isExportacion() {
      let val = false;
      let name = this.$store.state.houses.house.modality;
      if (name == "Exportación") {
        val = true;
      }

      return val;
    },
    isAereo() {
      let val = false;
      let id = this.$store.state.house_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "Aéreo") {
        val = true;
      }

      return val;
    },
    isLCL() {
      let val = false;
      let id = this.$store.state.house_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "LCL") {
        val = true;
      }

      return val;
    },
    isFCL() {
      let val = false;
      let id = this.$store.state.house_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "FCL") {
        val = true;
      }
      return val;
    },
    getItemsNotificaciones() {
      return this.isImportacion()
        ? this.itemsNotificacionesImport
        : this.isExportacion()
        ? this.itemsNotificacionesExport
        : [];
    },
    getSentidoHouse() {
      return this.isImportacion()
        ? "Import"
        : this.isExportacion()
        ? "Export"
        : "";
    },
    getTipoEmbarqueHouse() {
      return this.isAereo()
        ? "Aéreo"
        : this.isLCL()
        ? "LCL"
        : this.isFCL()
        ? "FCL"
        : "";
    },
    async validarMenuNotificaciones() {
      var vm = this;
      console.log(this.$store.state.bank);

      if (this.$store.state.bank.list.length == 0) {
        Swal.fire({
          icon: "warning",
          title: "Cuentas Bancarias",
          text: "Para poder enviar la notificación. Es necesario al menos una cuenta bancaría",
        });
        return false;
      } else {
        if (
          !this.$store.state.bank.list.some((v) => v.banks_details.length > 0)
        ) {
          Swal.fire({
            icon: "warning",
            title: "Cuentas Bancarias",
            text: "Para poder enviar la notificación. Es necesario al menos una cuenta bancaría.",
          });
          return false;
        }
      }
      vm.displayMenuNotificaciones = false;

      var errores = [];
      if (!vm.$store.state.houses.house.id_modality) {
        errores.push("Sentido");
      }
      if (!vm.$store.state.houses.house.id_shipment) {
        errores.push("Tipo de Embarque");
      }
      if (!vm.$store.state.houses.house.id_port_begin) {
        errores.push("Puerto de Origen");
      }
      if (!vm.$store.state.houses.house.id_port_end) {
        errores.push("Puerto de Destino");
      }
      if (!vm.$store.state.houses.house.id_proveedor) {
        errores.push("Proveedor");
      }
      if (!vm.$store.state.houses.house.id_consigner) {
        errores.push("Cliente");
      }
      if (!vm.$store.state.houses.house.emailaddress_clientefinal) {
        errores.push("El cliente debe tener asignado un correo electrónico");
      }
      if (!vm.$store.state.houses.house.id_operador) {
        errores.push("Operador");
      }
      if (!vm.$store.state.houses.house.fecha_etd) {
        errores.push("Fecha ETD");
      }
      if (!vm.$store.state.houses.house.fecha_eta) {
        errores.push("Fecha ETA");
      }
      if (
        !vm.itemsShipment.filter(
          (v) =>
            v.id == vm.$store.state.houses.house.id_shipment && v.code == "FCL"
        ).length
      ) {
        if (!vm.$store.state.houses.house.bultos) {
          errores.push("Nº de bultos");
        }
        if (!vm.$store.state.houses.house.peso) {
          errores.push("Peso");
        }
        if (!vm.$store.state.houses.house.volumen) {
          errores.push("Volumen");
        }
      }
      if (!vm.$store.state.houses.house.monto) {
        errores.push("Monto");
      }

      if (!errores.length) {
        vm.displayMenuNotificaciones = true;
      } else {
        vm.$swal({
          icon: "error",
          html: `
            <b>¡El Expediente House requiere los siguientes datos para mostrar el menú de notificaciones!</b>
            <br><br>
            ${errores.map((error) => `<p>${error}</p>`).join("")}
          `,
        });
      }
    },
    async _getHouseById() {
      var vm = this;

      var data = {
        id: vm.$route.params.id,
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

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          

          vm.$store.state.houses.house =
            response.data.data && response.data.data[0];
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getHouseServices() {
      var vm = this;

      if (vm.$route.params.id) {
        var data = {
          id: vm.$route.params.id,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        };

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getHouseServices",
          headers: {
           
            "Content-Type": "application/json",
          },
          data: data,
        };

        await axios(config)
          .then(function (response) {
            sessionStorage.setItem("auth-token", response.data.token);

            if (response.data.estadoflag) {
              let lstServices = [];
              let itemImpuestos = null;
              response.data.data.map((item, i) => {
                if (item.nameservice.toUpperCase() == "IMPUESTOS") {
                  itemImpuestos = item;
                } else {
                  lstServices.push(item);
                }
              });

              if (itemImpuestos !== null) {
                lstServices.push(itemImpuestos);
              }

              vm.$store.state.itemsHouseServices = lstServices;
            } else {
              vm.$store.state.itemsHouseServices = [];
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },

    sendNotificacion(notificacion) {
      this.selected = [];
      this.notificacion = notificacion;
      this.abrirModalCuentasNotificacion = true;
    },

    async enviarNotificacion(notificacion) {
      this.errorCuentas = "";
      if (this.selected.length == 0) {
        this.errorCuentas = "Es necesario al menos una cuenta";
        return false;
      }

      var vm = this;

      vm.loadingBotonNotificaciones = !vm.loadingBotonNotificaciones;

      await vm._getHouseById();
      var data = {
        id: vm.$store.state.house_id,
        notificacion: notificacion,
        house: vm.$store.state.houses.house,
        user: JSON.parse(sessionStorage.getItem("dataUser"))[0],
        sentido: vm.getSentidoHouse(),
        tipoEmbarque: vm.getTipoEmbarqueHouse(),
        cuentasBancarias: vm.selected,
        razonSocial:
          JSON.parse(sessionStorage.getItem("dataBranch"))[0].trade_name || "",
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "sendNotificacionHouse",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(function (response) {
          // console.log(response)
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.status == "401") {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          } else {
            vm.abrirModalCuentasNotificacion = false;
            vm.$swal({
              icon: "success",
              title: "Excelente",
              text: "Notificación enviada éxitosamente",
            });
          }
        })
        .catch(function (error) {
          console.log(error);
          vm.$swal({
            icon: "error",
            title: "Lo sentimos",
            text: error,
          });
        })
        .finally(function () {
          vm.loadingBotonNotificaciones = !vm.loadingBotonNotificaciones;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
._content__bitacora {
  height: 90vh;
  overflow-y: scroll;
  --scrollbar-width: none !important;
}

.div__button_bottom {
  text-decoration: none;
  text-align: center;
  margin-right: 20px;
  display: block;
}

.title_button_bottom {
  text-decoration: none;
  color: #252c32;
}

.acciones-dial ::v-deep .v-speed-dial__list {
  align-items: flex-end !important;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn {
  align-self: flex-end;
  min-width: 220px;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn .v-btn__content {
  justify-content: flex-start;
  width: 100%;
  font-size: 1.2rem;
  line-height: 1.4;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn .v-icon {
  font-size: 22px !important;
  margin-right: 8px;
}
.acciones-dial {
  position: relative;
  z-index: 4000 !important;
}
</style>
