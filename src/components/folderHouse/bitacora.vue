<template>
  <div style="min-height: 620px">
    <h3>Estatus del embarque</h3>
    <v-container style="padding: 0">
      <v-row dense>
        <v-col cols="12" md="12">
          <v-autocomplete
            append-outer-icon="mdi-plus"
            @click:append-outer="abrirRegistroBitacora"
            :items="$store.state.itemsBitacoraLineal"
            item-text="name"
            item-value="id"
            label="Estatus del embarque"
            v-model="$store.state.bitacora_id_bitacora"
          >
            <template v-slot:item="{ item }">
              <v-list-item-avatar
                :color="existeEnBitacora(item) ? 'bg-selected' : 'indigo'"
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
          <!-- @click:append-outer="abrirRegistroBitacora" -->
          <!-- @click:append-outer="iraComentarioManual" -->
          <v-autocomplete
            :items="ObtenerComentariosPredifinidos()"
            item-text="descripcion"
            item-value="id"
            label="Seleccione un comentario predefinido"
            v-model="$store.state.bitacora_comentario_predefinido"
            content-class="custom-autocomplete-menu"
            v-if="$store.state.bitacora_id_bitacora"
            return-object
            @change="activarComentarioFlag"
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
                :disabled="isFormActionsDisabled"
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
            :disabled="isFormActionsDisabled"
          ></v-switch>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            color="primary"
            block
            :loading="loadingBotonBitacora"
            @click="_setBitacora"
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
                  <th class="text-left">Nombre</th>
                  <th class="text-left">Comentario</th>
                  <th class="text-left">Fecha</th>
                  <th class="text-left">Visible/No Visible</th>
                  <th class="text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in bitacoraLimitada" :key="item.id">
                  <td>{{ item.namebitacora }}</td>
                  <td>{{ item.comentario }}</td>
                  <td>{{ item.date }}</td>
                  <td>
                    <v-switch
                      dense
                      color="primary"
                      v-model="item.visible_cliente"
                      @click="_changeStatusVisibleBitacora(item)"
                      :disabled="isFormActionsDisabled"
                    ></v-switch>
                  </td>
                  <td class="text-center">
                    <v-icon
                      class="btn_add"
                      dense
                      color="red"
                      @click.native="_deleteBitacora(item.id)"
                      :disabled="isFormActionsDisabled"
                      >mdi-delete</v-icon
                    >
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
                    <th class="text-left">Nombre</th>
                    <th class="text-left">Comentario</th>
                    <th class="text-left">Fecha</th>
                    <th class="text-left">Visible/No Visible</th>
                    <th class="text-left">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in bitacoraOrdenada" :key="item.id">
                    <td>{{ item.namebitacora }}</td>
                    <td>{{ item.comentario }}</td>
                    <td>{{ item.date }}</td>
                    <td>
                      <v-switch
                        dense
                        color="primary"
                        v-model="item.visible_cliente"
                        @click="_changeStatusVisibleBitacora(item)"
                        :disabled="isFormActionsDisabled"
                      ></v-switch>
                    </td>
                    <td class="text-center">
                      <v-icon
                        class="btn_add"
                        dense
                        color="red"
                        @click.native="_deleteBitacora(item.id)"
                        :disabled="isFormActionsDisabled"
                        >mdi-delete</v-icon
                      >
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
      <!-- Botones de Tracking movidos a sección de Acciones en controlHouse.vue -->
    </v-container>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title v-if="!id"> Agregar Status </v-card-title>
        <v-card-title primary-title v-else> Editar Status </v-card-title>
        <v-card-text>
          <v-form ref="frmStatus">
            <v-row>
              <v-col cols="6">
                <v-autocomplete
                  :items="$store.state.pricing.listModality"
                  label="Sentido*"
                  item-text="name"
                  item-value="id"
                  @change="obtenerOrden()"
                  v-model="id_modality"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  :items="$store.state.pricing.listShipment"
                  label="Tipo de Embarque*"
                  item-text="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  @change="obtenerOrden"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Estatus"
                  v-model="name"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-if="nroorden"
                  label="Orden"
                  type="number"
                  v-model="nroorden"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'No puede ser 0 o menor',
                  ]"
                  min="1"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <h4>Incoterms</h4>
              </v-col>
              <v-col cols="12" v-if="errorInconterms">
                <span class="red--text">
                  {{ errorInconterms }}
                </span>
              </v-col>
            </v-row>
            <v-row>
              <v-checkbox
                row
                label="EXW"
                class="mx-2"
                v-model="exw"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="FOB"
                class="mx-2"
                v-model="fob"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="FCA"
                class="mx-2"
                v-model="fca"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="CFR"
                class="mx-2"
                v-model="cfr"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="CIF"
                class="mx-2"
                v-model="cif"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="DDP"
                class="mx-2"
                v-model="ddp"
                :value="true"
              ></v-checkbox>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn
                  color="success"
                  :disabled="anadirComentarioFlag"
                  small
                  @click="anadirComentario()"
                >
                  Añadir Comentario
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-simple-table>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Comentario</th>
                      <th>Mover</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>
                        <v-textarea
                          auto-grow
                          v-model="item.descripcion"
                          dense
                          hide-details
                          solo
                          rows="1"
                          :id="`description${index}`"
                        ></v-textarea>
                      </td>
                      <td>
                        <v-btn
                          color="error"
                          icon
                          @click="moveUp(index)"
                          :disabled="index === 0"
                        >
                          <v-icon>mdi-arrow-up-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          color="success"
                          icon
                          @click="moveDown(index)"
                          :disabled="index === items.length - 1"
                        >
                          <v-icon>mdi-arrow-down-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          color="error"
                          @click="eliminarComentario(item, index)"
                          ><v-icon>mdi-delete</v-icon></v-btn
                        >
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions v-if="!id">
          <v-spacer></v-spacer>
          <v-btn small class="mx-1" color="success" @click="guardarStatus()">
            Guardar
          </v-btn>
          <v-btn small class="mx-1" color="error" @click="dialog = false">
            Cancelar
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <v-spacer></v-spacer>
          <v-btn small class="mx-1" color="success" @click="guardarStatus()">
            Actualizar
          </v-btn>
          <v-btn small class="mx-1" color="error" @click="dialog = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card class="pa-5">
        <v-row no-gutters>
          <v-col cols="12"> <p>Estado House</p> </v-col>
          <v-col cols="6">
            <v-row>
              <v-col cols="12" class="py-1">
                <v-text-field
                  outlined
                  dense
                  label="Descripción Estado"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0"> Tipo de embarque* </v-col>
            </v-row>
          </v-col>
          <v-col cols="6" class="px-5">
            <v-row>
              <v-col cols="12" class="py-0 my-0"> Incoterms </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="EXW"
                  class="mx-2 py-0"
                  v-model="exw"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="FOB"
                  class="mx-2 py-0"
                  v-model="fob"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="FCA"
                  class="mx-2 py-0"
                  v-model="fca"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="CFR"
                  class="mx-2 py-0"
                  v-model="cfr"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="CIF"
                  class="mx-2 py-0"
                  v-model="cif"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="DDP"
                  class="mx-2 py-0"
                  v-model="ddp"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="4">sss</v-col>
        </v-row>
      </v-card>
    </v-dialog> -->
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import axios from '@/api/axios-config';;
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
export default {
  name: "bitacora",
  props: {
    isFormActionsDisabled: Boolean,
  },
  components: {
    EstadoHouseForm: () => import("./../StatusHouse/EstadoHouseForm.vue"),
  },
  data: () => ({
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    loadingBotonBitacora: false,
    disabledBotonBitacora: false,
    id: "",
    exw: false,
    fob: false,
    fca: false,
    cfr: false,
    cif: false,
    ddp: false,
    nroorden: "",
    items: [],
    id_modality: "",
    id_shipment: "",
    dialog: false,
    dialogVerTodos: false,
    errorInconterms: "",
    name: "",
  }),
  computed: {
    ...mapState("statushouse", ["listStatusHouse", "orden"]),
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
    iraComentarioManual() {
      this.$store.state.bitacora_comentario_flag = true;
    },
    anadirComentarioFlag() {
      return !(
        this.exw ||
        this.fob ||
        this.fca ||
        this.cfr ||
        this.cif ||
        this.ddp
      );
    },
  },
  async mounted() {
    await this._getHouseBitacora().then(() => {
      this._setDefaultBitacora();
    });
    this.getModality();
    this.getShipment();
  },
  methods: {
    ...mapActions([
      "_getBitacoraLineal",
      "_getHouseBitacora",
      "_getComentariosPredefinidos",
      "getModality",
      "getShipment",
      "getObtenerOrdenStatusHouse",
    ]),
    ...mapActions("statushouse", [
      "getListStatusHouse",
      "getObtenerOrdenStatusHouse",
      "GuardarStatusHouse",
      "GuardarStatus",
      "EliminarStatus",
      "EliminarComentario",
    ]),
    // abrirRegistroBitacora() {
    //   this.$refs.EstadoHouseForm.dialog = true;
    // },
    abrirRegistroBitacora() {
      this.dialog = true;
      // this.$refs.frmStatus.reset();
      this.items = [];
    },
    async obtenerOrden() {
      if (this.id_modality && this.id_shipment) {
        await this.getObtenerOrdenStatusHouse({
          id_modalidad: this.id_modality,
          id_shipment: this.id_shipment,
        });
        let orden = { ...this.orden };
        this.nroorden = orden.orden;
      }
    },
    anadirComentario() {
      this.items.push({ descripcion: "" });
      this.$nextTick(() => {
        let index = this.items.length;
        console.log(index);
        let input = document.getElementById(`description${index - 1}`);
        input.focus();
      });
    },
    async guardarStatus() {
      this.errorInconterms = "";
      if (this.$refs.frmStatus.validate()) {
        if (!this.exw && !this.fca && !this.cfr && !this.cif && !this.ddp) {
          this.errorInconterms =
            "Es necesario seleccionar al menos un Incoterms";
          return false;
        }
        this.items.map((item, index) => {
          item.orden = index + 1;
        });
        let data = {
          id: this.id,
          id_modality: this.id_modality,
          id_shipment: this.id_shipment,
          name: this.name,
          nroorden: this.nroorden,
          exw: this.exw,
          fob: this.fob,
          fca: this.fca,
          cfr: this.cfr,
          cif: this.cif,
          ddp: this.ddp,
          lstComentatios: this.items,
        };
        await this.GuardarStatusHouse(data);
        await this._getBitacoraLineal({
          id_modalidad: this.$store.state.house_sentido,
          id_shipment: this.$store.state.house_id_trasnport,
          id_incoterms: this.$store.state.house_incoterms,
        });
        this.dialog = false;
      }
    },
    eliminarComentario(comentario, index) {
      if (!comentario.id) {
        this.items.splice(index, 1);
        return;
      }
      Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esto!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.$store.state.spiner = true;
          await this.EliminarComentario(comentario);
          this.$store.state.spiner = false;
          this.dialog = false;
        }
      });
    },
    existeEnBitacora(item) {
      let val = this.$store.state.itemsBitacora.some(
        (v) => v.id_bitacora == item.id
      );

      // console.log(val);
      return val;
    },
    ObtenerComentariosPredifinidos() {
      let bitacora = this.$store.state.itemsBitacoraLineal.filter(
        (v) => v.id == this.$store.state.bitacora_id_bitacora
      )[0];
      if (!bitacora.comentarios.some((v) => v.id == -1)) {
        bitacora.comentarios.push({
          id: -1,
          descripcion: "Comentario Manual",
        });
      }
      return bitacora ? bitacora.comentarios : [];
    },
    activarComentarioFlag() {
      let data = { ...this.$store.state.bitacora_comentario_predefinido };
      if (data.id == -1) {
        this.$store.state.bitacora_comentario_flag = true;
        this.$nextTick(() => {
          let txtBitacoraComentario = document.getElementById(
            "txtBitacoraComentario"
          );
          txtBitacoraComentario.focus();
        });
      } else {
        this.$store.state.bitacora_comentario = "";
        this.$store.state.bitacora_comentario_flag = false;
      }
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
        vm._getBitacoraLineal({
          id_modalidad: vm.$store.state.house_sentido,
          id_shipment: vm.$store.state.house_id_trasnport,
          id_incoterms: vm.$store.state.house_incoterms,
        });
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
      // if (!vm.$store.state.itemsBitacora.length) {
      //   vm.$store.state.bitacora_id_bitacora = 1;
      // } else {
      //   if (
      //     vm.$store.state.itemsBitacora.length <
      //     vm.$store.state.itemsBitacoraLineal.length
      //   ) {
      //     const dataUltimaBitacora =
      //       vm.$store.state.itemsBitacora[
      //         vm.$store.state.itemsBitacora.length - 1
      //       ];
      //     if (Object.keys(dataUltimaBitacora).length) {
      //       vm.$store.state.bitacora_id_bitacora =
      //         dataUltimaBitacora.id_bitacora + 1;
      //     }
      //   } else {
      //     vm.disabledBotonBitacora = true;
      //   }
      // }
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
        if (vm.$store.state.itemsBitacora.length == 0) {
          ok =
            vm.$store.state.itemsBitacoraLineal[0].id ==
            vm.$store.state.bitacora_id_bitacora;
        }

        if (vm.$store.state.itemsBitacora.length > 0) {
          let index = this.$store.state.itemsBitacoraLineal.findIndex(
            (v) => v.id == vm.$store.state.bitacora_id_bitacora
          );
          let preBitacora = this.$store.state.itemsBitacoraLineal[index - 1];
          ok = preBitacora
            ? this.$store.state.itemsBitacora.some(
                (v) => v.orden == preBitacora.orden
              )
            : true;
        }
        // return;
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
              ? vm.$store.state.bitacora_comentario_predefinido.id
              : "",
            comentario: vm.$store.state.bitacora_comentario_flag
              ? vm.$store.state.bitacora_comentario
              : "",
            fecha: vm.$store.state.bitacora_fecha,
            visible_cliente: vm.$store.state.bitacora_visible_cliente,
          };
          // console.log(data);
          // return;
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
  },
};
</script>

<style scoped>
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
.wrap-text {
  white-space: normal !important;
}
.custom-autocomplete-menu {
  width: auto;
  max-width: 500px; /* Ancho máximo */
  white-space: normal;
}
.bg-selected {
  background: #1b5e20 !important;
  color: white !important;
  width: 100%;
}
</style>
