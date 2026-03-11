<template>
  <v-container fluid>
    <v-dialog
      v-model="dialogEscogerCotizacion"
      scrollable
      persistent
      max-width="20%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Escoger la cotización para redireccionar:
        </v-card-title>
        <v-card-text>
          <v-form ref="frmQuote">
            <v-autocomplete
              :items="
                $store.state.pricing.listQuotes.filter((v) => !!v.porasignar)
              "
              v-model="id_quote"
              item-text="code"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido.']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" @click="redireccionarQuote()">
            REDIRECCIONAR
          </v-btn>
          <v-btn
            color="red"
            dark
            @click="dialogEscogerCotizacion = !dialogEscogerCotizacion"
            >CANCELAR</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card elevation="0">
      <v-card-title class="align-end">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          class="col-6"
        ></v-text-field>
        <v-spacer></v-spacer>
        <div class="">
          - Leyenda
          <span
            style="
              display: inline-block;
              background: #00ea80;
              width: 20px;
              height: 20px;
              border-radius: 250px;
              margin-left: 10px;
              margin-right: 20px;
            "
          ></span>
          Cargas Llegadas |
          <span
            style="
              display: inline-block;
              background: #fddd0c;
              width: 20px;
              height: 20px;
              border-radius: 250px;
              margin-left: 10px;
              margin-right: 20px;
            "
          ></span>
          Cargas a 5 días de llegar

          <div class="d-flex justify-end mt-3">
            <v-btn
              color="success"
              elevation="0"
              dark
              rounded
              @click="abrirModalSeleccionQuote()"
            >
              NUEVO EXPEDIENTE
            </v-btn>
            <v-btn
              color="secondary"
              elevation="0"
              dark
              rounded
              class="ml-3"
              @click="
                $store.state.master_filtrarData =
                  !$store.state.master_filtrarData
              "
            >
              FILTRAR
            </v-btn>
          </div>
        </div>
      </v-card-title>

      <!--<v-container v-if="!$store.state.dataMaster" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando informacíon
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>-->

      <v-data-table
        :headers="headers"
        :items="mastersConHouse"
        :search="search"
        :item-class="itemRowBackground"
        :single-expand="singleExpand"
        @click:row="clickRow"
        :expanded.sync="expanded"
        item-key="id"
        :loading="loadingDataTable"
        disable-sort
      >
        <template v-slot:expanded-item="{ item }">
          <!-- list_houses -->
          <td
            :colspan="headers.length + 1"
            class="px-3"
            v-if="
              (item.list_comentarios.length > 0 ||
                item.list_houses.length > 0) &&
              item.status != 0
            "
          >
            <v-simple-table v-if="item.list_comentarios.length > 0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ejecutivo</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(i, index) in item.list_comentarios"
                  :key="index"
                  class="bg-comentarios"
                >
                  <td class="bg-comentarios">{{ i.fecha }}</td>
                  <td class="bg-comentarios">{{ i.ejecutivo }}</td>
                  <td class="bg-comentarios">{{ i.comentario }}</td>
                </tr>
              </tbody>
            </v-simple-table>

            <v-simple-table v-if="item.list_houses.length > 0">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Code House</th>
                  <th>Cliente</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(i, index) in item.list_houses"
                  :key="index"
                  style="background: #e0f2f1"
                >
                  <td>
                    <v-btn
                      icon
                      color="primary"
                      @click="redirectHouseVer(i.id_house)"
                    >
                      <v-icon class="mx-1">mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      color="#FFD600"
                      @click="redirectHouse(i.id_house)"
                    >
                      <v-icon class="mx-1">mdi-pencil</v-icon>
                    </v-btn>
                  </td>
                  <td>{{ i.code_house }}</td>
                  <td>{{ i.namelong }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </td>
        </template>

        <template v-slot:[`item.canal`]="{ item }">
          <v-chip dark :color="item.codigo01" v-if="item.descripcion_canal">
            {{ item.descripcion_canal }}
          </v-chip>
        </template>
        <template v-slot:[`item.code_master`]="{ item }">
          <label
            v-if="item.status == 0"
            style="color: red; font-weight: 700 !important"
            >{{ item.code_master }}</label
          >
          <label v-if="item.status == 1" style="color: black">{{
            item.code_master
          }}</label>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-menu top :close-on-click="true" v-if="item.status == 1">
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon color="#212121" v-bind="attrs" v-on="on">
                <v-icon class="mx-1">mdi-menu</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslock && item.status == 1"
              >
                <v-list-item-title small @click="editMaster(item.id)" icon fab>
                  <v-icon class="mx-1" color="#FFD600">mdi-pencil</v-icon>
                  Editar Master
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="itemMenu" v-if="item.status == 1">
                <v-list-item-title
                  icon
                  fab
                  small
                  @click="irControlGastos(item.id)"
                >
                  <v-icon class="mx-1" color="#01579B"
                    >mdi-truck-cargo-container</v-icon
                  >
                  Ir Control Gastos
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslock && item.status == 1"
              >
                <v-list-item-title icon fab small @click="_lockMaster(item.id)">
                  <v-icon class="mx-1" color="#E65100">mdi-lock</v-icon> Cerrar
                  Expediente Operativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslockadm && item.status == 1"
              >
                <v-list-item-title
                  icon
                  fab
                  @click="_lockMasterAdm(item.id)"
                  small
                >
                  <v-icon class="mx-1" color="#E65100">mdi-lock</v-icon>Cerrar
                  Expediente Administrativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="itemMenu" v-if="item.status == 1">
                <v-list-item-title icon fab small @click="abrirCaperta(item)">
                  <v-icon class="mx-1" color="#FFD600">mdi-folder</v-icon>Abrir
                  Carpeta
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="itemMenu" v-if="item.status == 1">
                <v-list-item-title
                  icon
                  fab|
                  small
                  @click="_nullMaster(item.id)"
                >
                  <v-icon class="mx-1" color="#D50000">mdi-cancel</v-icon>
                  Anular
                </v-list-item-title>
              </v-list-item>

              <v-list-item class="itemMenu" v-if="item.status == 1">
                <v-list-item-title
                  icon
                  fab|
                  small
                  @click="deleteMaster(item.id)"
                >
                  <v-icon class="mx-1" color="#D50000">mdi-trash-can</v-icon>
                  Eliminar Master
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <label
            v-if="item.status == 0"
            style="color: red; font-weight: 700 !important"
          >
            ANULADO
          </label>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-if="item.status == 1"
                color="#212121"
                small
                icon
                class="mx-1"
                fab
                v-on="on"
                v-bind="attrs"
                @click="editFechas(item)"
              >
                <v-icon class="mx-1">mdi-calendar-edit</v-icon>
              </v-btn>
            </template>
            <span>Editar Fechas</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-if="!item.statuslock && item.status == 1"
                color="#212121"
                small
                @click="editMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
              >
                <v-icon class="mx-1">mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Master</span>
          </v-tooltip> -->
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
                @click="viewMaster(item.id)"
              >
                <v-icon class="mx-1">mdi-eye</v-icon>
              </v-btn>
            </template>
            <span>Ver Master</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
                @click="irControlGastos(item.id)"
              >
                <v-icon class="mx-1">mdi-truck-cargo-container</v-icon>
              </v-btn>
            </template>
            <span>Ir Control Gastos</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="!item.statuslock && item.status == 1"
                @click="_lockMaster(item.id)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-lock</v-icon>
              </v-btn>
            </template>
            <span>Cerrar Expediente Operativo</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="!item.statuslockadm && item.status == 1"
                @click="_lockMasterAdm(item.id)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-lock</v-icon>

               
              </v-btn>
            </template>
            <span>Cerrar Expediente Administrativo</span>
          </v-tooltip> -->
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-if="item.status == 1"
                icon
                fab
                v-on="on"
                v-bind="attrs"
                @click="abrirCaperta(item)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-folder</v-icon>
              </v-btn>
            </template>
            <span>Abrir Carpeta</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                @click="abrirModalNotaMaster(item)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-comment-alert-outline</v-icon>

              
              </v-btn>
            </template>
            <span>Añadir Estado/ Comentario</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="_nullMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-cancel</v-icon>
              </v-btn>
            </template>
            <span>Anular</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="deleteMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-trash-can</v-icon>

              </v-btn>
            </template>
            <span>Editar Master</span>
          </v-tooltip> -->
        </template>
      </v-data-table>
    </v-card>
    <v-dialog v-model="dialog" persistent width="50%">
      <v-card>
        <v-card-title>
          Registro de Estado/ Comentario - {{ master.code_master }}
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialog = !dialog">
            <v-icon class="mx-1">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmComentario">
            <v-text-field
              label="Fecha"
              v-model="fecha"
              type="date"
              readonly
            ></v-text-field>
            <v-autocomplete
              label="Ejecutivo"
              class="my-1"
              :items="$store.state.pricing.listEjecutivo"
              item-text="name"
              item-value="id_entitie"
              item-key="id_entitie"
              v-model="id_vendedor"
              :rules="[(v) => !!v || 'Dato requerido']"
            ></v-autocomplete>
            <v-textarea
              label="Estado/ Comentario"
              v-model="comentario"
              rows="4"
              auto-grow
              :rules="[(v) => !!v || 'Dato requerido']"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            small
            color="success"
            @click="guardarComentario"
            :loading="loading"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFecha" width="30%">
      <v-card>
        <v-card-title primary-title>
          {{ exp.code_master }} - Editar Fechas
        </v-card-title>
        <v-card-text>
          <v-text-field
            label="Fecha ETD"
            v-model="exp.fecha_etd"
            type="date"
          ></v-text-field>
          <v-text-field
            label="Fecha ETA"
            v-model="exp.fecha_eta"
            type="date"
          ></v-text-field>
          <v-text-field
            label="Fecha Disponibilidad"
            v-model="exp.fecha_disponibilidad"
            type="date"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn small color="success" :loading="loading" @click="guardarFechas"
            >Guardar</v-btn
          >
          <v-btn
            small
            color="error"
            :loading="loading"
            @click="dialogFecha = false"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <GuardarUrlMaster
      :dialogUrl="dialogUrl"
      :masterEditar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </v-container>
</template>
<script>
import { mapState, mapActions } from "vuex";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import GuardarUrlMaster from "../comun/GuardarUrlMaster.vue";
export default {
  components: { GuardarUrlMaster },
  name: "listMasterCom",
  data() {
    return {
      loading: false,
      dialogUrl: false,
      url_folderonedrive: "",
      masterEditar: {},
      exp: {},
      dialogFecha: false,
      dialogEscogerCotizacion: false,
      id_vendedor: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      id_quote: "",
      comentario: "",
      fecha: moment().format("YYYY-MM-DD"),
      dialog: false,
      master: "",
      search: "",
      expanded: [],
      singleExpand: false,
      options: {},
      loadingDataTable: false,
      headers: [
        { text: "Canal", value: "canal" },
        { text: "Codigo", value: "code_master", align: "start" },
        { text: "BL Master", value: "nro_mbl", align: "start" },
        { text: "Sentido", value: "namemodality" },
        { text: "Origen", value: "nameportbegin" },
        { text: "Destino", value: "nameportend" },
        { text: "Agente", value: "nameagent" },
        { text: "Consignatario del House", value: "nameconsigner" },
        { text: "Fecha ETD", value: "fecha_etd" },
        { text: "Fecha ETA", value: "fecha_eta" },
        { text: "House", value: "cantidad_houses" },
        { text: "Acciones", value: "actions", sortable: false },
      ],
    };
  },
  async mounted() {
    this.$store.state.drawer = false;
    this.$store.state.spiner = true;
    await this._getMasterList();
    this.$store.state.spiner = false;
    await Promise.all([
      this.getModulesEntities(),
      this.getQuoteNoAsignadoHouse(),
      this.cargarMasterDetalleCanal(),
      this._getModality(),
      this._getProveedor(),
      this._getShipment(),
    ]);
  },
  computed: {
    ...mapState(["itemsMasterList", "itemsModality", "totalItemsMasterList"]),
    mastersConHouse() {
      return this.itemsMasterList || [];
    },
  },
  methods: {
    ...mapActions([
      "_getMasterList",

      "getModulesEntities",
      "insertComentarioMaster",
      "getQuoteNoAsignadoHouse",
      "_getPortBegin",
      "_getPortEnd",
      "cargarMasterDetalleCanal",
      "_getModality",
      "_getShipment",
      "_getProveedor",
      "actualizarURLEnElMaster",
    ]),
    async cerrarDialog() {
      this.dialogUrl = false;
      this.$store.state.spiner = true;
      await this._getMasterList();
      this.$store.state.spiner = false;
    },
    irControlGastos(id) {
      this.$router.push({
        name: "editControlGasto",
        params: {
          id: id,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
      });
    },
    editFechas(item) {
      console.log(item);

      this.exp = {
        ...item,
        fecha_eta: item.fecha_eta
          ? moment(item.fecha_eta, "DD-MM-YYYY").format("YYYY-MM-DD")
          : null,
        fecha_etd: item.fecha_etd
          ? moment(item.fecha_etd, "DD-MM-YYYY").format("YYYY-MM-DD")
          : null,
      };
      this.dialogFecha = true;
    },
    async actualizarUrl() {
      await this.actualizarURLEnElMaster({
        id: this.masterEditar.id,
        url: this.url_folderonedrive,
      });
      this.masterEditar.url_folderonedrive = this.url_folderonedrive;
      this.dialogUrl = false;
      setTimeout(async () => {
        await this._getMasterList();
      }, 1000);
    },
    async guardarFechas() {
      this.loading = true;
      try {
        const response = await axios.put(
          process.env.VUE_APP_URL_MAIN + "updateFechasMaster",
          {
            fecha_etd: this.exp.fecha_etd,
            fecha_eta: this.exp.fecha_eta,
            id: this.exp.id,
            fecha_disponibilidad: this.exp.fecha_disponibilidad,
          },
          {
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
          },
        );

        let data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          });
        }

        // Ahora 'this' funcionará correctamente
        await this._getMasterList();
        this.dialogFecha = false;
        this.loading = false;
      } catch (error) {
        console.error("Error al guardar fechas:", error);
      } finally {
        this.dialogFecha = false;
      }
    },
    abrirModalSeleccionQuote() {
      Swal.fire({
        icon: "question",
        title: "Puede crear una expediente de dos formas.",
        html: "<p>1. Aprobando una cotización</p> <p>2. Realizando un expediente desde cero</p>",
        showConfirmButton: true,
        confirmButtonText: "Escoger una Cotización",
        showDenyButton: true,
        denyButtonText: "Crear un expediente desde cero",
        allowOutsideClick: false,
      }).then((res) => {
        if (res.isDenied) {
          this.$router.push({ name: "controlMaster" });
        }
        if (res.isConfirmed) {
          this.dialogEscogerCotizacion = true;
        }
      });
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    itemRowBackground: function (item) {
      if (
        item.statusLock === 1 &&
        item.statusLockAdm === 0 &&
        item.status === 1
      ) {
        return "rowRed";
      } else if (
        item.statusLock === 0 &&
        item.statusLockAdm === 1 &&
        item.status === 1
      ) {
        return "rowRed";
      } else if (
        item.statusLock === 1 &&
        item.statusLockAdm === 1 &&
        item.status === 1
      ) {
        return "rowRedMark";
      } else if (item.status === 0) {
        return "rowNull";
      } else if (item.background == "#ff9898") {
        return "rowLlego";
      } else if (item.background == "#f9cfcf") {
        return "rowLlegar";
      }
    },
    _lockMaster(id) {
      this.$swal({
        title: "Esta seguro de cerrar el expediente operativamente?",
        text: "Una vez cerrado, tendra que solicitar permiso para poder abrir",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Cerrar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          var vm = this;

          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "lockMaster/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
          };

          axios(config)
            .then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              if (response.data.estadoflag) {
                vm.$swal("Cerrado!", "Expediente cerrado", "success");
                await vm._getMasterList();
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
        }
      });
    },
    _nullMaster(id) {
      this.$swal({
        title: "Esta seguro de anular el expediente?",
        text: "Una vez anulado, tendra que solicitar permiso para poder aperturarlo de nuevo",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, anular",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          var vm = this;

          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "nullMaster/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: {
              status: 0,
            },
          };
          axios(config)
            .then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              if (response.data.estadoflag) {
                vm.$swal("Anulado!", "Expediente anulado", "success");
                await vm._getMasterList();
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
        }
      });
    },
    _lockMasterAdm(id) {
      this.$swal({
        title: "Esta seguro de cerrar el expediente administrativamente?",
        text: "Una vez cerrado, tendra que solicitar permiso para poder abrir",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Cerrar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          var vm = this;

          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "lockMasterAdm/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
          };
          axios(config)
            .then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              if (response.data.estadoflag) {
                vm.$swal("Cerrado!", "Expediente cerrado", "success");
                await vm._getMasterList();
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
        }
      });
    },
    editMaster(id) {
      this.$router.push("/home/folderMaster/control/editar/" + id);
    },
    viewMaster(id) {
      this.$router.push("/home/folderMaster/control/ver/" + id);
    },

    abrirCaperta(item) {
      console.log("item:", item);
      this.masterEditar = { ...item };
      this.url_folderonedrive = "";
      this.dialogUrl = true;
      // window.open(url, "_blank");
    },

    redirectHouse(id) {
      this.$router.push({
        name: "controlHouseEditar",
        params: {
          id: id,
        },
      });
    },
    redirectHouseVer(id) {
      this.$router.push({
        name: "controlHouseVer",
        params: {
          id: id,
        },
      });
    },
    abrirModalNotaMaster(item) {
      this.master = item;
      this.dialog = true;
    },
    async guardarComentario() {
      if (this.$refs.frmComentario.validate()) {
        this.loading = true;
        this.$store.state.spiner = true;
        await this.insertComentarioMaster({
          id_entitie: this.id_vendedor,
          id_master: this.master.id,
          fecha: this.fecha,
          comentario: this.comentario,
        });
        this.dialog = !this.dialog;
        await this._getMasterList();
        this.comentario = "";
        this.$store.state.spiner = false;
        this.loading = false;
      }
    },
    redireccionarQuote() {
      if (this.$refs.frmQuote.validate()) {
        this.$router.push({
          name: "verQuote",
          params: {
            id: this.id_quote,
          },
        });
      }
    },
    isImportacion(id) {
      let val = false;

      let name =
        this.itemsModality.filter((v) => v.id == id).length > 0
          ? this.itemsModality.filter((v) => v.id == id)[0].name
          : "";

      if (name == "Importación") {
        val = true;
      }

      return val;
    },
    isExportacion(id) {
      let val = false;

      let name =
        this.itemsModality.filter((v) => v.id == id).length > 0
          ? this.itemsModality.filter((v) => v.id == id)[0].name
          : "";

      if (name == "Exportación") {
        val = true;
      }

      return val;
    },
    // obtenerAgente({ id_modality = "", nameagent = "", nameconsigner = "" }) {
    //   return this.isImportacion(id_modality)
    //     ? nameagent
    //     : this.isExportacion(id_modality)
    //     ? nameconsigner
    //     : "";
    // },
    async getMasterListPaginated(options = {}) {
      const {
        page = 1,
        itemsPerPage = 10,
        sortBy = [],
        sortDesc = [],
      } = options;

      this.$store.state.master_filtro.pagina = page;
      this.$store.state.master_filtro.limite = itemsPerPage;
      this.$store.state.master_filtro.orden = sortBy
        .map((item, i) => item + " " + (!sortDesc[i] ? "ASC" : "DESC"))
        .toString();
      this.$store.state.master_filtro.busqueda = this.search;

      this.loadingDataTable = true;
      await this._getMasterList();
      this.loadingDataTable = false;
    },
    deleteMaster(id) {
      this.$swal({
        html: "Si elimina el expediente máster, también se eliminarán todos los expedientes houses asociados. <br>¿Está seguro que desea continuar?",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.isConfirmed) {
          var vm = this;

          var config = {
            method: "delete",
            url: process.env.VUE_APP_URL_MAIN + "deleteMaster/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
          };

          axios(config)
            .then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              const res = response.data;
              if (res.status == 200) {
                vm.$swal("", res.mensaje, "success");
                await vm.getMasterListPaginated();
              }
            })
            .catch(function (error) {
              console.log(error);
            });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.itemMenu {
  cursor: pointer;
}
.itemMenu:hover {
  background: #eeeeee;
}

.rowRed {
  background: #e2e8ec;
  color: #000000;
}

.rowNull {
  background: white;
  color: #ffffff;
}

.rowRedMark {
  background: #b6c8d4;
  color: #000000;
}

.rowLlego {
  background: #00ea80;
}

.rowLlegar {
  background: #fddd0c;
}

.circle__legends {
  height: 20px;
  width: 20px;
  background: #ffd6d3;
  float: left;
  border-radius: 250px;
  margin-right: 10px;
}
.bg-comentario {
  background: #bbdefb !important;
}
</style>
