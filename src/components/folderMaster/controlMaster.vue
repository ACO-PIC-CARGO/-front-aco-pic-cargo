<template>
  <v-form ref="formControlMaster" :readonly="formControlMasterReadonly">
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-text>
              <dataGen />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card>
            <v-card-text>
              <dataEmbar :isFormActionsDisabled="formControlMasterReadonly" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card>
            <v-card-text>
              <h3>Fechas</h3>
              <dataFechas />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12">
          <houselist v-if="$store.state.statusData" />
        </v-col>
        <div style="position: fixed; bottom: 16px; right: 16px; z-index: 3000">
          <v-fab-transition v-if="formControlMasterReadonly">
            <v-btn
              fab
              large
              dark
              bottom
              left
              color="info"
              @click="irAVerMaster()"
            >
              <v-icon> mdi-pencil </v-icon>
            </v-btn>
          </v-fab-transition>
          <v-speed-dial
            v-else
            v-model="fab"
            :top="top"
            :bottom="bottom"
            :right="right"
            :left="left"
            :direction="'top'"
            :open-on-hover="hover"
            :transition="transition"
            class="acciones-dial"
          >
            <template v-slot:activator>
              <v-btn v-model="fab" color="info" dark fab>
                <v-icon v-if="fab"> mdi-close </v-icon>
                <v-icon v-else> mdi-tools </v-icon>
              </v-btn>
            </template>
            <!-- Invertimos el orden en el DOM para que el último quede ARRIBA al abrir hacia arriba -->
            <v-btn
              v-if="$store.state.url_folderonedrive"
              @click="openURL({ url: $store.state.url_folderonedrive })"
              color="yellow"
            >
              <v-icon left>mdi-folder</v-icon>
              Carpeta
            </v-btn>
            <v-btn
              v-if="$store.state.statusData"
              @click="addNewHouse()"
              color="primary"
              :loading="loadingBotonNuevoHouse"
            >
              <v-icon left>mdi-home-plus</v-icon>
              Agregar House
            </v-btn>
            <v-btn
              color="light-green lighten-1"
              @click="_putMaster()"
              dark
              v-if="this.$route.params.id"
            >
              <v-icon left>mdi-content-save</v-icon>
              Guardar Cambios
            </v-btn>
            <v-btn
              color="light-green lighten-1"
              @click="_setMaster()"
              dark
              v-if="!this.$route.params.id"
            >
              <v-icon left>mdi-content-save</v-icon>
              Guardar
            </v-btn>
          </v-speed-dial>
        </div>
      </v-row>
    </v-container>
  </v-form>
</template>
<script>
import dataGen from "./dataGen.vue";
import houselist from "./houselist.vue";
import dataEmbar from "./dataEmbar.vue";
import dataFechas from "./fechas.vue";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';
export default {
  name: "controlMasterCom",
  components: {
    dataGen,
    houselist,
    dataEmbar,
    dataFechas,
  },

  data() {
    return {
      formControlMasterReadonly: false,
      loadingBotonNuevoHouse: false,
      direction: "left",
      fab: false,
      fling: false,
      hover: false,
      tabs: null,
      top: false,
      right: true,
      bottom: true,
      left: false,
      transition: "slide-y-reverse-transition",
    };
  },

  computed: {
    ...mapState(["itemsOperadorList"]),
    operadorNombre() {
      if (!this.$store.state.master_id_operador || !this.itemsOperadorList) {
        return "";
      }
      const operador = this.itemsOperadorList.find(
        (op) => op.id == this.$store.state.master_id_operador,
      );
      return operador ? operador.namelong : "";
    },
  },

  async mounted() {
    // this.$store.state.spiner = true;

    if (this.$route.name == "controlMaster") {
      this.$store.state.mainTitle = "CONTROL DE EXPEDIENTE MÁSTER";
    } else if (this.$route.name == "controlMasterEditar") {
      this.$nextTick(() => {
        setTimeout(() => {
          this.$store.state.mainTitle =
            "CONTROL DE EXPEDIENTE MÁSTER [EDITAR] - N° Exp:" +
            this.$store.state.nro_master;
        }, 2000);
      });
    } else if (this.$route.name == "controlMasterVer") {
      this.$store.state.mainTitle = "CONTROL DE EXPEDIENTE MÁSTER [MODO VISTA]";
      this.formControlMasterReadonly = true;
    }
    await Promise.all([this.cleanData(), this._getnroHouse()]);

    // this.$store.state.spiner = false;

    //this._validaData();
  },

  methods: {
    ...mapActions([
      "_getnroMaster",
      "_getnroHouse",
      "_getHouseList",
      "_getHouseServices",
      "openURL",
      "atras",
    ]),
    irAVerMaster() {
      this.$router.push({
        name: "controlMasterEditar",
        id: this.$route.params.id,
      });
      window.location.reload();
    },
    async createCarpetaOneDrive({ name = "" }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `crear-carpeta-master?nromaster=${name}`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      let res = await axios(config)
        .then(async function (response) {
          return response.data.data;
        })
        .catch((e) => {
          console.log(e);
          return false;
        });
      return res;
    },
    async actualizarMaster({ id = 0, url = "" }) {
      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + `update_folder_onedrive`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: {
          id: id,
          url: url,
        },
      };
      await axios(config).then(async function (response) {
        return response.data.data;
      });
    },
    _setMasterContainer(
      id_master,
      id_containers,
      nrocontainer,
      nroprecinto,
      quantity,
    ) {
      var vm = this;
      //vm._getnroMaster();
      var data = JSON.stringify({
        id_master: id_master,
        id_containers: id_containers,
        nro_containers: nrocontainer,
        nro_precinto: nroprecinto,
        quantity: quantity,
        status: 1,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setMasterContainers",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          console.log(response);
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
    _setHouseContainer(
      id_house,
      id_containers,
      nrocontainer,
      nroprecinto,
      quantity,
    ) {
      var vm = this;
      //vm._getnroMaster();
      var data = JSON.stringify({
        id_house: id_house,
        id_containers: id_containers,
        nro_containers: nrocontainer,
        nro_precinto: nroprecinto,
        quantity: quantity,
        status: 1,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setHouseContainers",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
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
    _setMasterServices(id_master, id_house, i) {
      var vm = this;
      vm.$store.state.itemsServicesList.map(function (item) {
        var data = {
          id_house: id_house,
          id_begend: item.id_begend,
          nameservice: item.nameservice,
          price_services: item.price,
          status: 0,
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
          .then(function () {})
          .catch(function (error) {
            console.log(error);
          });
      });

      vm.$store.state.statusData = true;
      vm.$store.state.master_itemsContainers.map(function (item) {
        /*vm._setMasterContainer(
          id_master,
          item.id,
          item.nro_container,
          item.nro_precinto,
          item.cantidad
        );*/

        vm._setHouseContainer(
          id_house,
          item.id,
          item.nro_container,
          item.nro_precinto,
          item.cantidad,
        );
      });

      vm._getHouseList();

      if (i == vm.$store.state.master_cantidad_house) {
        vm.$swal({
          icon: "success",
          title: "Excelente",
          text:
            "Master registrado éxitosamente con el número " +
            vm.$store.state.master_expediente,
        });
      }
    },
    async addNewHouse() {
      var vm = this;

      vm.loadingBotonNuevoHouse = !vm.loadingBotonNuevoHouse;

      await vm._setHouse(vm.$store.state.master_insertId);
      await vm._getHouseList();

      vm.loadingBotonNuevoHouse = !vm.loadingBotonNuevoHouse;

      // if (vm.$store.state.itemsHouseList.length > 1) {
      //   vm.$swal({
      //     icon: "question",
      //     html: "<b>¿Desea actualizar los costos en el Control de Gastos ahora?</b>",
      //     showConfirmButton: true,
      //     confirmButtonText: "Sí",
      //     confirmButtonColor: "#4CAF50",
      //     showDenyButton: true,
      //     denyButtonText: "No, en otro momento",
      //     allowOutsideClick: false,
      //   }).then(({ isConfirmed }) => {
      //     if (isConfirmed) {
      //       vm.$router.push({
      //         name: "editControlGasto",
      //         params: {
      //           code_master: vm.$store.state.master_nro_expediente,
      //           id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
      //             .id_branch,
      //         },
      //       });
      //     }
      //   });
      // }
    },
    async _setHouse({ id_master = "", pintaSuccess = true }) {
      console.log("ssssssssssss");
      var vm = this;
      var finalIdMaster = id_master || vm.$store.state.master_insertId;
      if (!finalIdMaster) {
        vm.$swal({
          icon: "error",
          title: "Error",
          text: "No se puede crear el House porque no existe un Master asociado.",
        });
        return null; // Retorna algo para indicar que falló la validación
      }

      var i = vm.$store.state.itemsHouseList.length + 1;
      var data = JSON.stringify({
        id_master: finalIdMaster,
        // ... rest of your data object
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_consigner_real: null,
        id_consigner: null,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setHouse",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      try {
        // 1. IMPORTANTE: Ponemos el 'return' antes del await
        const response = await axios(config);

        let res = response.data.data;
        sessionStorage.setItem("auth-token", response.data.token);

        // Manejo de sesión expirada
        if (
          response.data.status == "401" ||
          response.data.mensaje === "Sesión Expirada"
        ) {
          await Swal.fire({
            /* ... tus opciones de Swal ... */
          });
          router.push({ name: "Login" });
          return null;
        }
        if (pintaSuccess) {
          vm.$swal({
            icon: "success",
            title: res[0].mensaje,
          });
        }

        // 2. Este return ahora sí devolverá el valor a quien llamó a _setHouse
        return res;
      } catch (error) {
        console.error("_setHouse: Error al crear House:", error);
        return null; // O el error, según prefieras
      }
    },
    _setMasterHouse(id_master) {
      var vm = this;
      for (let i = 1; i <= vm.$store.state.master_cantidad_house; i++) {
        var data = JSON.stringify({
          code_house: vm.$store.state.house_expediente + "-" + i,
          id_master: !id_master || id_master == "" ? null : id_master,
          nro_house:
            !vm.$store.state.house_nro_expediente ||
            vm.$store.state.house_nro_expediente == ""
              ? null
              : vm.$store.state.house_nro_expediente,
          id_agent:
            !vm.$store.state.master_id_agente ||
            vm.$store.state.master_id_agente == ""
              ? null
              : vm.$store.state.master_id_agente,
          id_consigner: null,
          id_notify:
            !vm.$store.state.master_id_notify ||
            vm.$store.state.master_id_notify == ""
              ? null
              : vm.$store.state.master_id_notify,
          id_aerolinea:
            !vm.$store.state.master_id_airlines ||
            vm.$store.state.master_id_airlines == ""
              ? null
              : vm.$store.state.master_id_airlines,
          id_coloader:
            !vm.$store.state.master_id_coloader ||
            vm.$store.state.master_id_coloader == ""
              ? null
              : vm.$store.state.master_id_coloader,
          id_naviera:
            !vm.$store.state.master_id_naviera ||
            vm.$store.state.master_id_naviera == ""
              ? null
              : vm.$store.state.master_id_naviera,
          id_incoterms:
            !vm.$store.state.master_incoterms ||
            vm.$store.state.master_incoterms == ""
              ? null
              : vm.$store.state.master_incoterms,
          nro_hbl:
            !vm.$store.state.master_blmaster ||
            vm.$store.state.master_blmaster == ""
              ? null
              : vm.$store.state.master_blmaster,
          id_motonave:
            !vm.$store.state.master_id_motonave ||
            vm.$store.state.master_id_motonave == ""
              ? null
              : vm.$store.state.master_id_motonave,
          nro_viaje:
            !vm.$store.state.master_viaje || vm.$store.state.master_viaje == ""
              ? null
              : vm.$store.state.master_viaje,
          bultos:
            !vm.$store.state.master_bultos ||
            vm.$store.state.master_bultos == ""
              ? null
              : vm.$store.state.master_bultos,
          peso:
            !vm.$store.state.master_peso || vm.$store.state.master_peso == ""
              ? null
              : vm.$store.state.master_peso,
          volumen:
            !vm.$store.state.master_volumen ||
            vm.$store.state.master_volumen == ""
              ? null
              : vm.$store.state.master_volumen,
          id_conditions:
            !vm.$store.state.master_id_condicion ||
            vm.$store.state.master_id_condicion == ""
              ? null
              : vm.$store.state.master_id_condicion,
          id_moneda:
            !vm.$store.state.master_id_coins ||
            vm.$store.state.master_id_coins == ""
              ? null
              : vm.$store.state.master_id_coins,
          monto:
            !vm.$store.state.master_monto || vm.$store.state.master_monto == ""
              ? null
              : vm.$store.state.master_monto,
          status: 1,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        });

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setHouse",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };

        axios(config)
          .then(function (response) {
            if (response.data.status == 200) {
              // vm._setMasterServices(id_master, response.data.data.insertid, i);
            }

            vm.cleanData();
          })
          .catch(function (error) {
            console.log(error);
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: error,
            });
          });
      }
    },
    async _putMaster() {
      if (this.validate()) {
        var vm = this;
        vm.$store.state.spiner = true;

        let cuotas = [];
        for (let i = 0; i < this.$store.state.nro_cuotas; i++) {
          cuotas.push({
            porcentaje: this.$store.state.cuota[i],
            fecha: this.$store.state.fechacuota[i],
          });
        }

        var data = JSON.stringify({
          nro_master: vm.$store.state.nro_master,
          code_master: vm.$store.state.master_expediente,
          id_cot: vm.$store.state.master_cotizanion,
          id_modality: vm.$store.state.master_sentido,
          id_shipment:
            vm.$store.state.master_id_trasnport &&
            vm.$store.state.master_id_trasnport.id
              ? vm.$store.state.master_id_trasnport.id
              : vm.$store.state.master_id_trasnport,
          id_incoterms: vm.$store.state.master_incoterms,
          id_port_begin: vm.$store.state.master_origen,
          id_port_begin:
            !vm.$store.state.master_origen ||
            vm.$store.state.master_origen == ""
              ? null
              : vm.$store.state.master_origen,
          id_port_end:
            !vm.$store.state.master_destino ||
            vm.$store.state.master_destino == ""
              ? null
              : vm.$store.state.master_destino,
          id_operador:
            !vm.$store.state.master_id_operador ||
            vm.$store.state.master_id_operador == ""
              ? null
              : vm.$store.state.master_id_operador,
          fecha_eta:
            !vm.$store.state.master_fecha_eta ||
            vm.$store.state.master_fecha_eta == ""
              ? null
              : vm.$store.state.master_fecha_eta,
          fecha_etd:
            !vm.$store.state.master_fecha_etd ||
            vm.$store.state.master_fecha_etd == ""
              ? null
              : vm.$store.state.master_fecha_etd,
          fecha_disponibilidad:
            !vm.$store.state.master_fecha_disponibilidad ||
            vm.$store.state.master_fecha_disponibilidad == ""
              ? null
              : vm.$store.state.master_fecha_disponibilidad,
          ganancia_pricing:
            !vm.$store.state.master_ganancia_pricing ||
            vm.$store.state.master_ganancia_pricing == ""
              ? null
              : vm.$store.state.master_ganancia_pricing,
          ganancia_operaciones:
            !vm.$store.state.master_ganancia_operaciones ||
            vm.$store.state.master_ganancia_operaciones == ""
              ? null
              : vm.$store.state.master_ganancia_operaciones,
          id_agent:
            !vm.$store.state.master_id_agente ||
            vm.$store.state.master_id_agente == ""
              ? null
              : vm.$store.state.master_id_agente,
          id_consigner:
            !vm.$store.state.master_id_consigner ||
            vm.$store.state.master_id_consigner == ""
              ? null
              : vm.$store.state.master_id_consigner,
          id_notify:
            !vm.$store.state.master_id_notify ||
            vm.$store.state.master_id_notify == ""
              ? null
              : vm.$store.state.master_id_notify,
          id_aerolinea:
            !vm.$store.state.master_id_airlines ||
            vm.$store.state.master_id_airlines == ""
              ? null
              : vm.$store.state.master_id_airlines,
          id_coloader:
            !vm.$store.state.master_id_coloader ||
            vm.$store.state.master_id_coloader == ""
              ? null
              : vm.$store.state.master_id_coloader,
          id_naviera:
            !vm.$store.state.master_id_naviera ||
            vm.$store.state.master_id_naviera == ""
              ? null
              : vm.$store.state.master_id_naviera,
          nro_mbl:
            !vm.$store.state.master_blmaster ||
            vm.$store.state.master_blmaster == ""
              ? null
              : vm.$store.state.master_blmaster,
          id_motonave:
            !vm.$store.state.master_id_motonave ||
            vm.$store.state.master_id_motonave == ""
              ? null
              : vm.$store.state.master_id_motonave,
          nro_viaje:
            !vm.$store.state.master_viaje || vm.$store.state.master_viaje == ""
              ? null
              : vm.$store.state.master_viaje,
          bultos:
            !vm.$store.state.master_bultos ||
            vm.$store.state.master_bultos == ""
              ? null
              : vm.$store.state.master_bultos,
          peso:
            !vm.$store.state.master_peso || vm.$store.state.master_peso == ""
              ? null
              : vm.$store.state.master_peso,
          volumen:
            !vm.$store.state.master_volumen ||
            vm.$store.state.master_volumen == ""
              ? null
              : vm.$store.state.master_volumen,
          id_conditions:
            !vm.$store.state.master_id_condicion ||
            vm.$store.state.master_id_condicion == ""
              ? null
              : vm.$store.state.master_id_condicion,
          id_moneda:
            !vm.$store.state.master_id_coins ||
            vm.$store.state.master_id_coins == ""
              ? null
              : vm.$store.state.master_id_coins,
          monto:
            !vm.$store.state.master_monto || vm.$store.state.master_monto == ""
              ? null
              : vm.$store.state.master_monto,
          status: 1,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          cuotas: cuotas,
          nro_cuotas: vm.$store.state.nro_cuotas,
          grupalflag: vm.$store.state.grupalflag,
          fecha_libre_almacenaje: vm.$store.state.fecha_libre_almacenaje,
          fecha_libre_sobreestadia:
            vm.$store.state.fecha_libre_sobreestadia || null,
          almacen_recepcion: vm.$store.state.almacen_recepcion,
          dias_sobreestadia: vm.$store.state.dias_sobreestadia,
          id_canal: vm.$store.state.id_canal,
          nro_manifiesto: vm.$store.state.nro_manifiesto,
          namecampaign: vm.$store.state.namecampaign,
          master_itemsContainers: vm.$store.state.master_itemsContainers,
          vuelo: vm.$store.state.master_vuelo || null,
          nro_containers: vm.$store.state.master_nro_containers || null,
          nro_precinto: vm.$store.state.master_nro_precinto || null,
        });

        var config = {
          method: "post",
          url:
            process.env.VUE_APP_URL_MAIN +
            "editMaster/" +
            vm.$store.state.master_Id_get,
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };

        await axios(config)
          .then(function (response) {
            sessionStorage.setItem("auth-token", response.data.token);

            if (response.data.status == 200) {
              vm.$swal({
                icon: "success",
                title: "Excelente",
                text: "Expediente actualizado con éxito",
              });
            } else {
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

            // vm.cleanData();
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
        vm.$store.state.spiner = false;
      }
    },
    cleanData() {
      var vm = this;
      vm.$store.state.master_nro_expediente = "";
      // vm.$store.state.master_expediente = "";
      //id_cot: vm.$store.state.master_cotizanion
      vm.$store.state.master_sentido = "";
      vm.$store.state.master_id_trasnport = "";
      vm.$store.state.master_incoterms = "";
      vm.$store.state.master_origen = "";
      vm.$store.state.master_destino = "";
      vm.$store.state.master_id_operador = "";
      vm.$store.state.master_ganancia_pricing = "";
      vm.$store.state.master_ganancia_operaciones = "";
      vm.$store.state.master_id_agente = "";
      vm.$store.state.master_id_consigner = "";
      vm.$store.state.master_id_notify = "";
      vm.$store.state.master_id_airlines = "";
      vm.$store.state.master_id_coloader = "";
      vm.$store.state.master_id_naviera = "";
      vm.$store.state.master_blmaster = "";
      vm.$store.state.master_id_motonave = "";
      vm.$store.state.master_viaje = "";
      vm.$store.state.master_bultos = "";
      vm.$store.state.master_peso = "";
      vm.$store.state.master_volumen = "";
      vm.$store.state.master_id_condicion = "";
      vm.$store.state.master_id_coins = "";
      vm.$store.state.master_monto = "";
      vm.$store.state.cuotas = 3;
      vm.$store.state.grupalflag = false;
      vm.$store.state.cuota = [];
      vm.$store.state.fechacuota = [];
      vm.$store.state.url_folderonedrive = "";
      vm.$store.state.master_itemsContainers = [];
    },
    validate() {
      let val = true;
      let sum = 0;
      let html = "<ul>";
      if (this.$store.state.grupalflag) {
        let fechaAnterior = "";
        for (let i = 0; i < this.$store.state.nro_cuotas; i++) {
          if (this.$store.state.cuota[i] < 0) {
            val = false;
            html += `<li> El porcentaje ${i + 1} no puede ser negativo</li>`;
          }

          if (this.$store.state.cuota[i] > 100) {
            val = false;
            html += `<li> El porcentaje ${
              i + 1
            }  no puede ser mayor que el 100% </li>`;
          }

          sum += parseFloat(this.$store.state.cuota[i]);

          if (!this.$store.state.fechacuota[i]) {
            html += `<li> La fecha de pago ${i + 1} es requerida</li>`;
          } else if (this.$store.state.fechacuota[i] < fechaAnterior) {
            html += `<li> La fecha de pago ${
              i + 1
            } debe ser mayor o igual a la anterior</li>`;
          }

          fechaAnterior = this.$store.state.fechacuota[i];
        }

        if (sum != 100) {
          val = false;
          html += "<li>El porcentaje final debe ser igual al 100%</li>";
        }
      }

      if (this.$store.state.dias_sobreestadia) {
        if (this.$store.state.dias_sobreestadia < 0) {
          val = false;
          html +=
            "<li>Días Libres de Sobreestadía no pueden ser negativos</li>";
        }
      }
      if (!this.$store.state.master_sentido) {
        val = false;
        html += "<li>El sentido es requerido</li>";
      }
      if (!this.$store.state.master_id_trasnport) {
        val = false;
        html += "<li>El tipo de embarque es requerido</li>";
      }
      if (!this.$store.state.master_incoterms) {
        val = false;
        html += "<li>El incoterms es requerido</li>";
      }
      if (!this.$store.state.master_origen) {
        val = false;
        html += "<li>El origen es requerido</li>";
      }
      if (!this.$store.state.master_destino) {
        val = false;
        html += "<li>El destino es requerido</li>";
      }
      if (!this.$store.state.master_fecha_eta) {
        val = false;
        html += "<li>La fecha eta es requerida</li>";
      }
      if (!this.$store.state.master_fecha_etd) {
        val = false;
        html += "<li>La fecha etd es requerida</li>";
      }
      if (
        this.$store.state.statusData &&
        !this.$store.state.itemsHouseList.length
      ) {
        val = false;
        html +=
          "<li>Debe asignar un Expediente House como mínimo para guardar el expediente máster</li>";
      }

      html += "</ul>";
      if (!val) {
        Swal.fire({
          icon: "error",
          html: html,
        });
      }
      return val;
    },
    async _setMaster() {
      if (this.validate()) {
        var vm = this;
        vm.$store.state.spiner = true;

        let cuotas = [];
        for (let i = 0; i < this.$store.state.nro_cuotas; i++) {
          cuotas.push({
            porcentaje: this.$store.state.cuota[i],
            fecha: this.$store.state.fechacuota[i],
          });
        }
        //vm._getnroMaster();
        var data = JSON.stringify({
          nro_master: vm.$store.state.master_nro_expediente,
          code_master: vm.$store.state.master_expediente,
          id_cot: vm.$store.state.master_cotizanion
            ? vm.$store.state.master_cotizanion
            : null,
          id_modality: vm.$store.state.master_sentido,
          id_shipment: vm.$store.state.master_id_trasnport.id,
          id_incoterms: vm.$store.state.master_incoterms,
          id_port_begin:
            !vm.$store.state.master_origen ||
            vm.$store.state.master_origen == ""
              ? null
              : vm.$store.state.master_origen,
          id_port_end:
            !vm.$store.state.master_destino ||
            vm.$store.state.master_destino == ""
              ? null
              : vm.$store.state.master_destino,
          id_operador:
            !vm.$store.state.master_id_operador ||
            vm.$store.state.master_id_operador == ""
              ? null
              : vm.$store.state.master_id_operador,
          fecha_eta: vm.$store.state.master_fecha_eta,
          fecha_etd: vm.$store.state.master_fecha_etd,
          fecha_disponibilidad: vm.$store.state.master_fecha_disponibilidad,
          ganancia_pricing: vm.$store.state.master_ganancia_pricing
            ? vm.$store.state.master_ganancia_pricing
            : null,
          ganancia_operaciones: vm.$store.state.master_ganancia_operaciones
            ? vm.$store.state.master_ganancia_operaciones
            : null,
          id_agent: vm.$store.state.master_id_agente
            ? vm.$store.state.master_id_agente
            : null,
          id_consigner: vm.$store.state.master_id_consigner,
          id_notify:
            !vm.$store.state.master_id_notify ||
            vm.$store.state.master_id_notify == ""
              ? null
              : vm.$store.state.master_id_notify,
          id_aerolinea: vm.$store.state.master_id_airlines
            ? vm.$store.state.master_id_airlines
            : null,
          id_coloader:
            !vm.$store.state.master_id_coloader ||
            vm.$store.state.master_id_coloader == ""
              ? null
              : vm.$store.state.master_id_coloader,
          id_naviera:
            !vm.$store.state.master_id_naviera ||
            vm.$store.state.master_id_naviera == ""
              ? null
              : vm.$store.state.master_id_naviera,
          nro_mbl:
            !vm.$store.state.master_blmaster ||
            vm.$store.state.master_blmaster == ""
              ? null
              : vm.$store.state.master_blmaster,
          id_motonave:
            !vm.$store.state.master_id_motonave ||
            vm.$store.state.master_id_motonave == ""
              ? null
              : vm.$store.state.master_id_motonave,
          nro_viaje:
            !vm.$store.state.master_viaje || vm.$store.state.master_viaje == ""
              ? null
              : vm.$store.state.master_viaje,
          bultos:
            !vm.$store.state.master_bultos ||
            vm.$store.state.master_bultos == ""
              ? null
              : vm.$store.state.master_bultos,
          peso:
            !vm.$store.state.master_peso || vm.$store.state.master_peso == ""
              ? null
              : vm.$store.state.master_peso,
          volumen:
            !vm.$store.state.master_volumen ||
            vm.$store.state.master_volumen == ""
              ? null
              : vm.$store.state.master_volumen,
          id_conditions:
            !vm.$store.state.master_id_condicion ||
            vm.$store.state.master_id_condicion == ""
              ? null
              : vm.$store.state.master_id_condicion,
          id_moneda:
            !vm.$store.state.master_id_coins ||
            vm.$store.state.master_id_coins == ""
              ? null
              : vm.$store.state.master_id_coins,
          monto:
            !vm.$store.state.master_monto || vm.$store.state.master_monto == ""
              ? null
              : vm.$store.state.master_monto,
          status: 1,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          cuotas: cuotas,
          nro_cuotas: vm.$store.state.nro_cuotas,
          grupalflag: vm.$store.state.grupalflag,
          fecha_libre_almacenaje: vm.$store.state.fecha_libre_almacenaje,
          fecha_libre_sobreestadia:
            vm.$store.state.fecha_libre_sobreestadia || null,
          almacen_recepcion: vm.$store.state.almacen_recepcion,
          dias_sobreestadia: vm.$store.state.dias_sobreestadia,
          id_canal: vm.$store.state.id_canal,
          nro_manifiesto: vm.$store.state.nro_manifiesto,
          namecampaign: vm.$store.state.namecampaign,
          master_itemsContainers: vm.$store.state.master_itemsContainers,
          // Nuevos campos para embarque
          vuelo: vm.$store.state.master_vuelo || null,
          nro_containers: vm.$store.state.master_nro_containers || null,
          nro_precinto: vm.$store.state.master_nro_precinto || null,
        });

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setMaster",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };

        await axios(config)
          .then(async function (response) {
            sessionStorage.setItem("auth-token", response.data.token);

            // Solo redirigir a login cuando es 401 o sesión expirada
            if (
              response.data.status == "401" ||
              response.data.mensaje === "Sesión Expirada"
            ) {
              Swal.fire({
                icon: "error",
                text: response.data.mensaje,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
              }).then(function (resSwal) {
                if (resSwal.isConfirmed) {
                  router.push({ name: "Login" });
                  setTimeout(function () {
                    window.location.reload();
                  }, 10);
                }
              });
              vm.$store.state.spiner = false;
              return;
            }

            var masterRow =
              response.data.data && response.data.data[0]
                ? response.data.data[0]
                : null;

            var id_master = masterRow
              ? masterRow.id || masterRow.insertid
              : null;

            if (!id_master) {
              vm.$swal({
                icon: "error",
                title: "Error",
                text: "No se pudo obtener el ID del expediente creado. Revise la consola para más detalles.",
              });
              vm.$store.state.spiner = false;
              return;
            }

            vm.$swal({
              icon: "info",
              title: "Espera",
              timerProgressBar: true,
              text: "Generando expediente...",
            });

            var id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch;
            var branchCreacion = [1, 2];
            if (branchCreacion.includes(id_branch)) {
              // var url = await vm.createCarpetaOneDrive({
              //   name: vm.$store.state.master_nro_expediente,
              // });
              // await vm.actualizarMaster({
              //   id: id_master,
              //   url: url,
              // });
            }

            let res = await vm._setHouse({
              id_master: id_master,
              pintaSuccess: false,
            });
            vm.$swal.close();
            console.log("_setMaster: Respuesta de _setHouse:", res);
            if (res[0].estadoflag) {
              vm.$router.push({
                name: "controlHouseEditar",
                params: {
                  id: res[0].insertid,
                  activar: 1,
                },
              });
            }
            vm.$store.state.itemsHouseList = [];
            vm.$store.state.master_insertId = id_master;

            // vm.$router.push({
            //   name: "controlMasterEditar",
            //   params: {
            //     id: id_master,
            //   },
            // });
            // window.location.reload();
          })
          .catch(function (error) {
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: "Error al crear el expediente: " + (error.message || error),
            });
          });
        vm.$store.state.spiner = false;
      }
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
