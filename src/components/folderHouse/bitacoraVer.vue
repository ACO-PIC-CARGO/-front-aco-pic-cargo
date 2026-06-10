<template>
  <div style="min-height: 620px">
    <h3>Estatus del embarque</h3>

    <v-container style="padding: 0">
      <v-row dense>
        <v-col cols="12" md="12">
          <v-autocomplete
            append-outer-icon="mdi-plus"
            :items="$store.state.itemsBitacoraLineal"
            item-text="name"
            item-value="id"
            label="Estatus del embarque"
            v-model="$store.state.bitacora_id_bitacora"
            :disabled="true"
          >
            <template v-slot:item="{ item }">
              <v-list-item-avatar
                color="indigo"
                class="text-h5 font-weight-light white--text"
              >
                {{ $store.state.itemsBitacoraLineal.indexOf(item) + 1 }}
              </v-list-item-avatar>
              <v-list-item-content class="ml-3">
                <v-list-item-title v-text="item.name"></v-list-item-title>
              </v-list-item-content>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="12" style="width: 120px">
          <v-autocomplete
            :items="ObtenerComentariosPredifinidos()"
            item-text="descripcion"
            item-value="id"
            label="Seleccione un comentario predefinido"
            v-model="$store.state.bitacora_comentario_predefinido"
            content-class="custom-autocomplete-menu"
            v-if="$store.state.bitacora_id_bitacora"
            return-object
            :disabled="true"
          >
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item v-bind="attrs" v-on="on">
                <v-list-item-content style="width: 120px">
                  <v-list-item-title class="wrap-text">
                    {{ item.descripcion }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col cols="12" md="12" v-if="$store.state.bitacora_comentario_flag">
          <v-text-field
            v-model="$store.state.bitacora_comentario"
            label="Comentario"
            id="txtBitacoraComentario"
            readonly
            disabled
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-dialog
            ref="dialog"
            v-model="modal"
            :return-value.sync="date"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="$store.state.bitacora_fecha"
                label="Fecha"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"
                :disabled="true"
              ></v-text-field>
            </template>
            <v-date-picker v-model="$store.state.bitacora_fecha" scrollable>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="modal = false">
                Cancel
              </v-btn>
              <v-btn
                text
                color="primary"
                @click="$refs.dialog.save($store.state.bitacora_fecha)"
              >
                OK
              </v-btn>
            </v-date-picker>
          </v-dialog>
        </v-col>
        <v-col cols="12" md="4">
          <p class="mb-1">Visible para cliente</p>
          <v-switch
            class="mt-0"
            v-model="$store.state.bitacora_visible_cliente"
            :disabled="true"
          ></v-switch>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            color="primary"
            block
            :loading="false"
            disabled
            small
            >Agregar</v-btn
          >
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-simple-table dense fixed-header>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Grupo</th>
                  <th class="text-left">Nombre</th>
                  <th class="text-left">Comentario</th>
                  <th class="text-left">Fecha</th>
                  <th class="text-left">Visible/No Visible</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in bitacoraLimitada" :key="item.id">
                  <td>{{ item.namemodule }}</td>
                  <td>{{ item.namebitacora }}</td>
                  <td>{{ item.comentario }}</td>
                  <td>{{ item.date }}</td>
                  <td>
                    <v-switch
                      dense
                      readonly
                      color="primary"
                      v-model="item.visible_cliente"
                      @click="_changeStatusVisibleBitacora(item)"
                      :disabled="isFormActionsDisabled"
                    ></v-switch>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-col>
        <v-col cols="12" class="text-center" v-if="mostrarBotonVerMas">
          <v-btn small color="primary" outlined @click="dialogVerTodos = true">
            Ver más ({{ totalRegistros }} registros)
          </v-btn>
        </v-col>
      </v-row>

      <!-- Modal para ver todos los registros -->
      <v-dialog v-model="dialogVerTodos" max-width="900px" scrollable>
        <v-card>
          <v-card-title>
            Todos los registros de bitácora
            <v-spacer></v-spacer>
            <v-btn icon @click="dialogVerTodos = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text style="max-height: 500px;">
            <v-simple-table dense fixed-header>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Grupo</th>
                    <th class="text-left">Nombre</th>
                    <th class="text-left">Comentario</th>
                    <th class="text-left">Fecha</th>
                    <th class="text-left">Visible/No Visible</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in bitacoraOrdenada" :key="item.id">
                    <td>{{ item.namemodule }}</td>
                    <td>{{ item.namebitacora }}</td>
                    <td>{{ item.comentario }}</td>
                    <td>{{ item.date }}</td>
                    <td>
                      <v-switch
                        dense
                        readonly
                        color="primary"
                        v-model="item.visible_cliente"
                        :disabled="isFormActionsDisabled"
                      ></v-switch>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="dialogVerTodos = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
    </v-container>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import axios from '@/api/axios-config';;
import { v4 as uuidv4 } from "uuid";
export default {
  name: "bitacora",
  props: {
    isFormActionsDisabled: Boolean,
  },
  data: () => ({
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    loadingBotonBitacora: false,
    loadingBotonTracking: false,
    disabledBotonBitacora: false,
    dialogVerTodos: false,
  }),
  computed: {
    isBotonTrackingDisabled: function () {
      return this.$store.state.house_enlace_tracking !== "" &&
        this.$store.state.house_enlace_tracking !== null
        ? true
        : this.isFormActionsDisabled;
    },
    isBotonBitacoraDisabled: function () {
      return this.isFormActionsDisabled || this.disabledBotonBitacora;
    },
    bitacoraOrdenada: function () {
      var items = this.$store.state.itemsBitacora || [];
      return items.slice().sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateB - dateA;
      });
    },
    bitacoraLimitada: function () {
      return this.bitacoraOrdenada.slice(0, 3);
    },
    totalRegistros: function () {
      return (this.$store.state.itemsBitacora || []).length;
    },
    mostrarBotonVerMas: function () {
      return this.totalRegistros > 3;
    },
  },
  async mounted() {
    // await this._getBitacoraLineal();
    await this._getComentariosPredefinidos();
    await this._getHouseBitacora().then(() => {
      this._setDefaultBitacora();
    });
  },
  methods: {
    ...mapActions([
      "_getBitacoraLineal",
      "_getHouseBitacora",
      "_getComentariosPredefinidos",
    ]),
    ObtenerComentariosPredifinidos() {
      let comentarios = [];
      // console.log("itemsBitacora", this.$store.state.itemsBitacora);
      // console.log(
      //   "itemsC omentariosPredefinidos",
      //   this.$store.state.itemsComentariosPredefinidos
      // );
      this.$store.state.itemsComentariosPredefinidos.forEach((element) => {
        element.comentariousuado = this.$store.state.itemsBitacora.some(
          (v) => v.comentario === element.comentario
        );
        comentarios.push(element);
      });
      return comentarios;
    },
    cleanData() {
      this.$store.state.bitacora_id_bitacora = "";
      this.$store.state.bitacora_comentario_predefinido = "";
      this.$store.state.bitacora_comentario_flag = false;
      this.$store.state.bitacora_comentario = "";
      this.$store.state.bitacora_visible_cliente = true;
    },
    _validaData() {
      var vm = this;
      if (vm.$route.params.id) {
        // vm._getBitacoraLineal();
      }
    },
    async _deleteBitacora(id) {
      var vm = this;
      var data = {
        id: id,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "deleteBitacora",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.status == 200) {
            await vm._getHouseBitacora().then(() => {
              vm._setDefaultBitacora();
            });
          }

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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _changeStatusBitacora({ id, status }) {
      var vm = this;
      var data = {
        id: id,
        status: status,
      };

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "changeStatusBitacora",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.status == 200) {
            await vm._getHouseBitacora();
          }

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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _changeStatusVisibleBitacora({ id, visible_cliente }) {
      var vm = this;
      var data = {
        id: id,
        visible: visible_cliente,
      };

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "changeStatusVisibleBitacora",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.status == 200) {
            await vm._getHouseBitacora();
          }

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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _setDefaultBitacora() {
      var vm = this;
      vm.disabledBotonBitacora = false;
      if (!vm.$store.state.itemsBitacora.length) {
        vm.$store.state.bitacora_id_bitacora = 1;
      } else {
        if (
          vm.$store.state.itemsBitacora.length <
          vm.$store.state.itemsBitacoraLineal.length
        ) {
          const dataUltimaBitacora =
            vm.$store.state.itemsBitacora[
              vm.$store.state.itemsBitacora.length - 1
            ];
          if (Object.keys(dataUltimaBitacora).length) {
            vm.$store.state.bitacora_id_bitacora =
              dataUltimaBitacora.id_bitacora + 1;
          }
        } else {
          vm.disabledBotonBitacora = true;
        }
      }
    },
    _handleFlagComentarioManual() {
      if (this.$store.state.bitacora_comentario_flag) {
        this.$store.state.bitacora_comentario_predefinido = null;
      }
    },
    async _setBitacora() {
      var vm = this;

      if (!vm.$store.state.bitacora_id_bitacora) {
        vm.$swal("", "¡La bitacora es requerida!", "error");
      } else {
        var ok = true;
        if (vm.$store.state.itemsBitacora.length) {
          const dataUltimaBitacora =
            vm.$store.state.itemsBitacora[
              vm.$store.state.itemsBitacora.length - 1
            ];
          if (
            vm.$store.state.bitacora_id_bitacora !=
            dataUltimaBitacora.id_bitacora + 1
          ) {
            ok = false;
          }
        } else {
          if (vm.$store.state.bitacora_id_bitacora != 1) {
            ok = false;
          }
        }

        if (!ok) {
          vm.$swal(
            "",
            "¡Debe registrar las bitácoras en el orden que aparecen en la lista!",
            "error"
          );
        } else if (
          vm.$store.state.bitacora_comentario_flag &&
          !vm.$store.state.bitacora_comentario
        ) {
          vm.$swal("", "¡El comentario es requerido!", "error");
        } else {
          vm.loadingBotonBitacora = !vm.loadingBotonBitacora;

          var data = {
            id_house: vm.$route.params.id,
            id_bitacora: vm.$store.state.bitacora_id_bitacora,
            id_comentario: !vm.$store.state.bitacora_comentario_flag
              ? vm.$store.state.bitacora_comentario_predefinido
              : "",
            comentario: vm.$store.state.bitacora_comentario_flag
              ? vm.$store.state.bitacora_comentario
              : "",
            fecha: vm.$store.state.bitacora_fecha,
            visible_cliente: vm.$store.state.bitacora_visible_cliente,
          };

          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "setBitacora",
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: data,
          };

          await axios(config)
            .then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);
              if (response.data.status == 200) {
                await vm._getHouseBitacora().then(() => {
                  vm.cleanData();
                  vm._setDefaultBitacora();
                });
              }

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
            })
            .catch(function (error) {
              console.log(error);
            })
            .finally(function () {
              vm.loadingBotonBitacora = !vm.loadingBotonBitacora;
            });
        }
      }
    },
    async _generateTrackingToken() {
      const token = uuidv4();

      this.loadingBotonTracking = !this.loadingBotonTracking;
      await this._setTrackingToken(token);
      this.loadingBotonTracking = !this.loadingBotonTracking;
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
          "auth-token": sessionStorage.getItem("auth-token"),
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
          } else {
            Swal.fire({
              icon: response.data.status == "401" ? "error" : "info",
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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _copyEnlaceTracking(texto) {
      await navigator.clipboard.writeText(texto);
    },
  },
};
</script>

<style lang="scss" scoped>
.dataBitacora {
  max-height: 430px;
  overflow-y: scroll;
}

.btn_add {
  cursor: pointer;
}
.comentarioUtilizado {
  background: #e8eaf6;
}
</style>
