<template>
  <div>
    <h3>Datos y Servicios a Realizar</h3>
    <v-row dense>
      <v-col cols="12" md="4">
        <v-text-field
          readonly
          v-model="$store.state.house_master_expediente"
          label="N° de Expedientes Master"
        ></v-text-field>
      </v-col>
      <!-- <v-col cols="12" md="6">
        <v-text-field
          readonly
          v-model="$store.state.house_expediente"
          label="N° de Expedientes House"
        ></v-text-field>
      </v-col> -->
      <v-col cols="12" md="4">
        <v-autocomplete
          label="Quote Asociado al House"
          :items="$store.state.pricing.listQuotes"
          item-text="code"
          item-value="id"
          :search-input.sync="searchHouseCotizacion"
          @change="asignarDatos()"
          v-model="$store.state.house_cotizacion"
          clearable
          :disabled="bloquearQuote"
        >
        </v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          label="Aduana Asociado al House"
          :items="$store.state.aduana.listQuotes2"
          item-text="quote"
          item-value="id"
          :search-input.sync="searchHouseCotizacionAduana"
          @change="asignarDatosAduana()"
          v-model="$store.state.house_cotizacionaduana"
          clearable
          :item-disabled="aduanaaprobada"
          :disabled="bloquearQuote"
        >
        </v-autocomplete>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsModality"
          item-text="name"
          item-value="id"
          label="Sentido"
          @change="_getDataService()"
          v-model="$store.state.house_sentido"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsShipment"
          item-text="embarque"
          item-value="id"
          label="Tipo de Embarque"
          return-object
          v-model="$store.state.house_id_trasnport"
          @change="_activePort($store.state.house_id_trasnport.id_transport)"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsIncoterms"
          item-text="name"
          item-value="id"
          label="Incoterms"
          v-model="$store.state.house_incoterms"
          @change="_getDataService()"
        ></v-autocomplete>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsPortBegin"
          item-text="name"
          item-value="id_port"
          label="Origen"
          readonly
          v-model="$store.state.house_origen"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsPortEnd"
          item-text="name"
          item-value="id_port"
          label="Destino"
          readonly
          v-model="$store.state.house_destino"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="$store.state.itemsColoaders"
          item-text="namelong"
          item-value="id"
          label="Coloader"
          v-model="$store.state.house_id_coloader"
        ></v-autocomplete>
      </v-col>
    </v-row>

    <v-row dense class="mt-0">
      <v-col cols="12" md="4">
        <v-text-field
          type="number"
          v-model="$store.state.house_bultos"
          label="Bultos"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          type="number"
          suffix="kg"
          v-model="$store.state.house_peso"
          label="Peso"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          type="number"
          suffix="m3"
          v-model="$store.state.house_volumen"
          label="Volumen"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-dialog v-model="$store.state.modalServices_manualMode" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Agregar Servicio Manual <v-spacer></v-spacer>
          <v-btn
            icon
            color="red"
            @click="
              $store.state.modalServices_manualMode =
                !$store.state.modalServices_manualMode
            "
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formNewService">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="$store.state.itemsBegEndList"
                    item-text="name"
                    item-value="id"
                    label="Ubicación/Tramo"
                    v-model="house_service_id_begend"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="house_service_name"
                    label="Nombre Servicio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" rounded dark @click="cancelNewService"
            >CANCELAR
          </v-btn>
          <v-btn
            color="success"
            class="ml-2"
            rounded
            dark
            @click="setNewService"
            >ACEPTAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCostos"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title primary-title>
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogCostos = !dialogCostos">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @change="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="red--text mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            small
            color="success"
            @click="asociarCotizacionP"
            :disabled="activarBtnContinuar"
          >
            ASOCIAR COTIZACIÓN
          </v-btn>
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCostosAduana"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title primary-title>
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogCostos = !dialogCostos">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @change="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="red--text mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            small
            color="success"
            @click="asociarCotizacionA"
            :disabled="activarBtnContinuar"
          >
            ASOCIAR COTIZACIÓN
          </v-btn>
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogCliente" max-width="30%" persistent>
      <v-card>
        <v-card-title>
          Es Necesario que registre un cliente para continuar:
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="$store.state.clientes"
            item-text="namelong"
            item-value="id"
            label="Cliente HBL"
            v-model="$store.state.house_id_consigner"
            :error-messages="error"
          >
            <v-icon
              @click.native="_callModalEntitie(11)"
              slot="append"
              class="btn__add"
              color="primary"
            >
              mdi-plus
            </v-icon>
          </v-autocomplete>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" @click="guardar" :loading="$store.state.spiner"
            >Guardar</v-btn
          >
          <span style="color: red" class="mx-2">
            {{
              $store.state.spiner
                ? "Se está terminando de cargar los datos. Un momento Por favor "
                : ""
            }}
          </span>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import axios from "axios";
import Swal from "sweetalert2";
export default {
  name: "dataGen",
  data() {
    return {
      error: "",
      dialogCliente: false,
      searchHouseCotizacion: "",
      searchHouseCotizacionAduana: "",
      house_service_id_begend: "",
      house_service_name: "",
      bloquearQuote: false,
      dataAprobar: {},
      id_opcion: "",
      activarBtnContinuar: false,
      dialogCostos: false,
      dialogCostosAduana: false,
      textValidacionPago: "",
      optionCostos: [
        { id: "0", text: "No hacer ninguna acción" },
        { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
        {
          id: "2",
          text: "Sumar los nuevos costos, a los costos ya existentes de proveedores",
        },
      ],
    };
  },
  async mounted() {
    this.$store.state.spiner = false;
    this.$store.state.spiner = true;
    this.reset();
    // console.log(this.$route.params)
    this.$nextTick(() => {
      if (this.$route.params.activar == "1") {
        this.dialogCliente = true;
      }
    });
    await Promise.all([
      this._validaData(),
      this._getModality(),
      this._getShipment(),
      this._getIncoterms(),
      this._getnroMaster(),
      this._getAgents(),
      this._getConsigners(),
      this._getNotify(),
      this._getColoaders(),
      this._getAirlines(),
      this._getNavieras(),
      this._getProveedorRolNaviera(),
      this._getMotonave(),
      this._getContainers(),
      this._getFleteCon(),
      this._getCoinsList(),

      this._getProveedor(),
      this._getBegEndList(),
      this._getHouseContainers({ id: this.$route.params.id }),
    ]);
    if (
      this.$store.state.house_cotizacion ||
      this.$store.state.house_cotizacionaduana
    ) {
      await this.getQuoteNoAsignadoHouse();
    } else {
      await this.ListarMontosFinalesQuoteMONGODB();
      await this.ListarMontosFinalesAduanaMONGODB();
    }

    this.$store.state.house_id_coins = this.$store.state.itemsCoinsList.filter(
      (v) => v.symbol === "USD",
    )[0].id;

    this.$store.state.spiner = false;

    this.$forceUpdate();
  },
  computed: {
    ...mapState([
      "itemsModality",
      "itemsShipment",
      "itemsPortBegin",
      "itemsPortEnd",
      "itemsIncoterms",
      "itemsServicesBegin",
      "itemsBitacoraList",
      "drawer",
      "dataHouse_transporte",
      "recargarClienteFlag",
    ]),
    esAereo() {
      const v = this.$store.state.house_id_trasnport;
      const id = v && typeof v === "object" ? v.id : v;
      const shipment = this.$store.state.itemsShipment.find((s) => s.id == id);
      return shipment && shipment.code === "Aéreo";
    },
    esFCL() {
      const v = this.$store.state.house_id_trasnport;
      const id = v && typeof v === "object" ? v.id : v;
      const shipment = this.$store.state.itemsShipment.find((s) => s.id == id);
      return shipment && shipment.code === "FCL";
    },
    esLCL() {
      const v = this.$store.state.house_id_trasnport;
      const id = v && typeof v === "object" ? v.id : v;
      const shipment = this.$store.state.itemsShipment.find((s) => s.id == id);
      return shipment && shipment.code === "LCL";
    },
  },
  methods: {
    ...mapActions([
      "_getModality",
      "_getShipment",
      "_getPortBegin",
      "_getPortEnd",
      "_getIncoterms",
      "_getServicesBegin",
      "_getBitacoraList",
      "_getnroMaster",
      "getQuoteDataNoAsignadaHouse",
      "_getnroMaster",
      "_getAgents",
      "_getConsigners",
      "_getNotify",
      "_getColoaders",
      "_getAirlines",
      "_getNavieras",
      "_getProveedorRolNaviera",
      "_getMotonave",
      "_getContainers",
      "_getFleteCon",
      "_getCoinsList",
      "_getHouseContainers",
      "_getProveedor",
      "_getHouseContainers",
      "getQuoteNoAsignadoHouse",
      "_getBegEndList",
      "_getBitacoraLineal",
      "ListarMontosFinalesQuoteMONGODB",
      "ListarMontosFinalesAduanaMONGODB",
      "aprobarCotizacion",
      "aprobarCotizacionAduana",
      "setHouseEdit",
      "guardarCarpetaHouse",
      "verHouse",
    ]),
    isDisabled(item) {
      return !item.porasignar; // Deshabilita si el estado no es "activo"
    },
    reset() {
      let vm = this;
      vm.$store.state.copy_house = null;
      vm.$store.state.dataHouse_transporte = null;
      vm.$store.state.house_origen = null;
      vm.$store.state.house_destino = null;
      vm.$store.state.house_sentido = null;
      vm.$store.state.house_id_trasnport = null;
      vm.$store.state.house_incoterms = null;
      vm.$store.state.house_cotizacion = null;
      vm.$store.state.house_cotizacionaduana = null;
      vm.$store.state.house_origen = null;
      vm.$store.state.house_destino = null;
      vm.$store.state.house_expediente = null;
      vm.$store.state.house_master = null;
      vm.$store.state.house_master_expediente = null;
      vm.$store.state.house_id_agente = null;
      vm.$store.state.house_id_consigner = null;
      vm.$store.state.house_id_notify = null;
      vm.$store.state.house_id_airlines = null;
      vm.$store.state.house_id_coloader = null;
      vm.$store.state.house_id_naviera = null;
      vm.$store.state.house_blmaster = null;
      vm.$store.state.house_id_motonave = null;
      vm.$store.state.house_viaje = null;
      vm.$store.state.house_bultos = null;
      vm.$store.state.house_peso = null;
      vm.$store.state.house_volumen = null;
      vm.$store.state.house_id_condicion = null;
      vm.$store.state.house_id_coins = null;
      vm.$store.state.house_monto = null;
      vm.$store.state.house_id = null;
      vm.$store.state.url_onedrive = null;
      vm.$store.state.house_id_consigner_real = null;
      vm.$store.state.itemsHouseContainers = null;
      vm.$store.state.house_nro_declaracion_aduana = null;
      vm.$store.state.house_canal_aduana = null;
      vm.$store.state.house_enlace_tracking = null;
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
    aduanaaprobada(item) {
      return item.aprobadoflag; // Deshabilita si el estado no es "activo"
    },
    guardar() {
      this._setHouseEdit();
      this.router.push({
        name: "controlHouseVer",
        params: {
          id: this.$route.params.id,
        },
      });
      this.dialogCliente = false;
    },
    async _setHouseEdit() {
      var vm = this;
      this.error = "";
      if (!vm.$store.state.house_id_consigner) {
        this.error = "Dato Requerido";
        return;
      }

      vm.loadingBotonGuardarHouse = true;

      const lstservices = (this.$store.state.itemsHouseServices || []).map(
        (item) => ({
          id: item.id || null,
          id_begend: item.id_begend || null,
          nameservice: item.nameservice || null,
          status: item.status ? 1 : 0,
          date_service: item.date_service || null,
        }),
      );

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
        lstservices,
        id: vm.$store.state.house_id,
        nro_declaracion_aduana:
          vm.$store.state.house_nro_declaracion_aduana || "",
        canal_aduana: vm.$store.state.house_canal_aduana || "",
      });

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "setHouseEdit",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      try {
        const response = await axios(config);
        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.status == "401") {
          vm.loadingBotonGuardarHouse = false;
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
          return;
        }

        vm.statusData = true;

        if (!vm.$store.state.url_onedrive) {
          let proveedor = vm.$store.state.clientes.find(
            (v) => v.id == vm.$store.state.house_id_consigner,
          );
          let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch;
          let id_branchs = ["1", "2", 1, 2];
          if (id_branchs.includes(id_branch)) {
            await vm.guardarCarpetaHouse({
              id: vm.$store.state.house_master,
              nroMaster: `${vm.$store.state.house_master_expediente}_${proveedor.namelong}`,
            });
          }
        }

        vm.loadingBotonGuardarHouse = false;
        await vm
          .$swal({
            icon: "success",
            title: "Excelente",
            text: "House actualizado éxitosamente",
            allowEnterKey: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
          })
          .then(() => {
            vm.$router.go(0); // Recarga la página para reflejar los cambios
          });
        // Refresh data in background (non-blocking)
      } catch (error) {
        console.log(error);
        vm.loadingBotonGuardarHouse = false;
        vm.$swal({
          icon: "error",
          title: "Lo sentimos",
          text: error,
        });
      } finally {
        vm.loadingBotonGuardarHouse = false;
      }
    },
    async validarExistePagosMaster() {
      this.activarBtnContinuar = true;
      this.textValidacionPago = "";
      if (this.id_opcion == "1") {
        var config = {
          method: "get",
          url: process.env.VUE_APP_URL_MAIN + "validar_existe_pago_master",
          headers: {
            "Content-Type": "application/json",
            "auth-token": sessionStorage.getItem("auth-token"),
          },
          params: {
            id: this.$store.state.house_cotizacion,
          },
        };
        let res = await axios(config).then((res) => {
          return res.data;
        });
        this.activarBtnContinuar = res.estadoflag;
        this.textValidacionPago = res.mensaje;
        return;
      }
      this.activarBtnContinuar = false;
    },
    async asignarDatos() {
      this.dataAprobar = this.$store.state.pricing.listQuotes.filter(
        (v) => v.id == this.$store.state.house_cotizacion,
      )[0];
      this.dialogCostos = true;
    },
    async asignarDatosAduana() {
      this.dataAprobar = this.$store.state.aduana.listQuotes2.filter(
        (v) => v.id == this.$store.state.house_cotizacionaduana,
      )[0];
      console.log(this.dataAprobar);
      this.dialogCostosAduana = true;
    },
    async asociarCotizacionP() {
      let valor = this.dataAprobar.listIngresosInstructivo.filter(
        (v) => v.descripcion === "TOTAL",
      )[0].valor;
      let igv = this.dataAprobar.listIngresosInstructivo.filter(
        (v) => v.descripcion === "TOTAL",
      )[0].igv;
      await this.aprobarCotizacion({
        id_quote: this.$store.state.house_cotizacion, //
        nuevoexpediente: false, //
        id_exp: this.$store.state.house_master, //
        fecha_validez: "", //
        totalIngreso: valor, //
        igvIngreso: igv, //
        valorIngreso: valor, //
        listCostosInstructivo: this.dataAprobar.listCostosInstructivo, //
        listVentasInstructivo: this.dataAprobar.listIngresosInstructivo, //
        id_house: this.$route.params.id, //
        id_opcion: this.id_opcion, //
      });
    },

    async asociarCotizacionA() {
      let valor = this.dataAprobar.listIngresosInstructivo.filter(
        (v) => v.descripcion === "TOTAL",
      )[0].valor;
      let igv = this.dataAprobar.listIngresosInstructivo.filter(
        (v) => v.descripcion === "TOTAL",
      )[0].igv;
      await this.aprobarCotizacionAduana({
        id_quote: this.$store.state.house_cotizacionaduana, //
        nuevoexpediente: false, //
        id_exp: this.$store.state.house_master, //
        fecha_validez: "", //
        totalIngreso: valor, //
        igvIngreso: igv, //
        valorIngreso: valor, //
        listCostosInstructivo: this.dataAprobar.listCostosInstructivo, //
        listVentasInstructivo: this.dataAprobar.listIngresosInstructivo, //
        id_house: this.$route.params.id, //
        id_opcion: this.id_opcion, //
      });
    },

    async _validaData() {
      if (this.$route.params.id) {
        await this.verHouse(this.$route.params);
        let house = this.$store.state.houses.house;

        this.$store.state.copy_house = house;
        this.$store.state.dataHouse_transporte = house.id_transport;
        this.$store.state.house_origen = house.id_port_begin;
        this.$store.state.house_destino = house.id_port_end;
        this.$store.state.house_sentido = house.id_modality;
        this.$store.state.house_id_trasnport = house.id_shipment;
        this.$store.state.house_incoterms = house.id_incoterms;
        this.$store.state.house_cotizacion = house.id_cot;
        this.$store.state.house_cotizacionaduana = house.id_quoteaduana;

        this.id_transport = house.id_transport;

        this.$store.state.house_origen = house.id_port_begin;
        this.$store.state.house_destino = house.id_port_end;
        this.$store.state.house_expediente = house.code_house;
        this.$store.state.house_master = house.id_master;
        this.$store.state.house_master_expediente = house.code_master;
        this.$store.state.house_id_agente = house.id_proveedor;
        this.$store.state.house_id_consigner = house.id_consigner;
        this.$store.state.house_id_notify = house.id_notify;
        this.$store.state.house_id_airlines = house.id_aerolinea;
        this.$store.state.house_id_coloader = house.id_coloader;
        //this.$store.state.house_id_agente = house.id_agent;
        this.$store.state.house_id_naviera = house.id_naviera;
        this.$store.state.house_blmaster = house.nro_hbl;
        this.$store.state.house_id_motonave = house.id_motonave;
        this.$store.state.house_viaje = house.nro_viaje;
        this.$store.state.house_bultos = house.bultos;
        this.$store.state.house_peso = house.peso;
        this.$store.state.house_volumen = house.volumen;
        this.$store.state.house_id_condicion = house.id_conditions;
        this.$store.state.house_id_coins = house.id_moneda;
        this.$store.state.house_monto = house.monto;
        this.$store.state.house_id = house.id;
        this.$store.state.url_onedrive = house.url_onedrive;
        this.$store.state.house_id_consigner_real = house.id_consigner_real;
        this.$store.state.itemsHouseContainers = house.itemshousecontainers;
        this.$store.state.house_nro_declaracion_aduana =
          house.nro_declaracion_aduana || "";
        this.$store.state.house_canal_aduana = house.canal_aduana || "";
        const id_cot = house.id_cot;
        const id_quote = house.id_quoteaduana;
        this.bloquearQuote = !!(id_cot || id_quote);
        Promise.all([
          this._getPortBegin({
            id_transport: house.id_transport,
            id: house.id_port_begin,
          }),
          this._getPortEnd({
            id_transport: house.id_transport,
            id: house.id_port_end,
          }),
          this._getServicesBegin(),
          this._getBitacoraLineal({
            id_modalidad: this.$store.state.house_sentido,
            id_shipment: this.$store.state.house_id_trasnport,
            id_incoterms: this.$store.state.house_incoterms,
          }),
          // this._getComentariosPredefinidos(),
        ]);
        this.$store.state.house_enlace_tracking = house.token_rastreo
          ? "https://aco.agentedecargaonline.com/tracking/" +
            house.token_rastreo
          : "";
        if (
          !this.$store.state.house_id_consigner &&
          !!this.$route.params.activar
        ) {
          vm.dialogCliente = true;
        } else {
          this.dialogCliente = false;
        }
      }
      // if (vm.$route.params.id) {
      //   var data = {
      //     id: vm.$route.params.id,
      //     id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
      //       .id_branch,
      //   };
      //   var config = {
      //     method: "post",
      //     url: process.env.VUE_APP_URL_MAIN + "getHouseListId/",
      //     headers: {
      //       "auth-token": sessionStorage.getItem("auth-token"),
      //       "Content-Type": "application/json",
      //     },
      //     data: data,
      //   };
      //   await axios(config)
      //     .then(async function (response) {
      //       sessionStorage.setItem("auth-token", response.data.token);

      //       vm.$store.state.copy_house = response.data.data[0];
      //       vm.$store.state.dataHouse_transporte =
      //         response.data.data[0].id_transport;
      //       vm.$store.state.house_origen = response.data.data[0].id_port_begin;
      //       vm.$store.state.house_destino = response.data.data[0].id_port_end;
      //       vm.$store.state.house_sentido = response.data.data[0].id_modality;
      //       vm.$store.state.house_id_trasnport =
      //         response.data.data[0].id_shipment;
      //       vm.$store.state.house_incoterms =
      //         response.data.data[0].id_incoterms;
      //       vm.$store.state.house_cotizacion = response.data.data[0].id_cot;
      //       vm.$store.state.house_cotizacionaduana =
      //         response.data.data[0].id_quoteaduana;

      //       vm.id_transport = response.data.data[0].id_transport;
      //       await vm._getPortBegin({
      //         id_transport: response.data.data[0].id_transport,
      //         id: response.data.data[0].id_port_begin,
      //       });
      //       await vm._getPortEnd({
      //         id_transport: response.data.data[0].id_transport,
      //         id: response.data.data[0].id_port_end,
      //       });
      //       vm.$store.state.house_origen = response.data.data[0].id_port_begin;
      //       vm.$store.state.house_destino = response.data.data[0].id_port_end;
      //       vm.$store.state.house_expediente = response.data.data[0].code_house;
      //       vm.$store.state.house_master = response.data.data[0].id_master;
      //       vm.$store.state.house_master_expediente =
      //         response.data.data[0].code_master;
      //       vm.$store.state.house_id_agente =
      //         response.data.data[0].id_proveedor;
      //       vm.$store.state.house_id_consigner =
      //         response.data.data[0].id_consigner;
      //       vm.$store.state.house_id_notify = response.data.data[0].id_notify;
      //       vm.$store.state.house_id_airlines =
      //         response.data.data[0].id_aerolinea;
      //       vm.$store.state.house_id_coloader =
      //         response.data.data[0].id_coloader;
      //       //vm.$store.state.house_id_agente = response.data.data[0].id_agent;
      //       vm.$store.state.house_id_naviera = response.data.data[0].id_naviera;
      //       vm.$store.state.house_blmaster = response.data.data[0].nro_hbl;
      //       vm.$store.state.house_id_motonave =
      //         response.data.data[0].id_motonave;
      //       vm.$store.state.house_viaje = response.data.data[0].nro_viaje;
      //       vm.$store.state.house_bultos = response.data.data[0].bultos;
      //       vm.$store.state.house_peso = response.data.data[0].peso;
      //       vm.$store.state.house_volumen = response.data.data[0].volumen;
      //       vm.$store.state.house_id_condicion =
      //         response.data.data[0].id_conditions;
      //       vm.$store.state.house_id_coins = response.data.data[0].id_moneda;
      //       vm.$store.state.house_monto = response.data.data[0].monto;
      //       vm.$store.state.house_id = response.data.data[0].id;
      //       vm.$store.state.url_onedrive = response.data.data[0].url_onedrive;
      //       vm.$store.state.house_id_consigner_real =
      //         response.data.data[0].id_consigner_real;
      //       vm.$store.state.itemsHouseContainers =
      //         response.data.data[0].itemshousecontainers;
      //       vm.$store.state.house_nro_declaracion_aduana =
      //         response.data.data[0].nro_declaracion_aduana || "";
      //       vm.$store.state.house_canal_aduana =
      //         response.data.data[0].canal_aduana || "";
      //       const id_cot = response.data.data[0].id_cot;
      //       const id_quote = response.data.data[0].id_quoteaduana;
      //       vm.bloquearQuote = !!(id_cot || id_quote);

      //       await vm._getServicesBegin();
      //       // await vm._getBitacoraLineal();
      //       vm.$store.state.house_enlace_tracking = response.data.data[0]
      //         .token_rastreo
      //         ? "https://aco.agentedecargaonline.com/tracking/" +
      //           response.data.data[0].token_rastreo
      //         : "";

      //       if (
      //         !vm.$store.state.house_id_consigner &&
      //         !!vm.$route.params.activar
      //       ) {
      //         vm.dialogCliente = true;
      //       }
      //     })
      //     .catch(function (error) {
      //       console.log(error);
      //     });
      //   vm.$store.state.spiner = false;
      //   await vm._getBitacoraLineal({
      //     id_modalidad: vm.$store.state.house_sentido,
      //     id_shipment: vm.$store.state.house_id_trasnport,
      //     id_incoterms: vm.$store.state.house_incoterms,
      //   });
      //   // await this._getComentariosPredefinidos();
      // }
    },
    async _activePort(id_transport) {
      await this._getPortBegin({ id_transport: id_transport });
      await this._getPortEnd({ id_transport: id_transport });
      if (this.$store.state.master_id_trasnport.id == 1) {
        this.$store.state.embar_title_nacn = "Aerolinea";
      } else if (this.$store.state.master_id_trasnport.id == 2) {
        this.$store.state.embar_title_nacn = "Naviera";
      } else if (this.$store.state.master_id_trasnport.id == 3) {
        this.$store.state.embar_title_nacn = "Coloader";
      } else {
        this.$store.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
      }
    },
    _getDataService() {
      this._getServicesBegin();
      // this._getBitacoraList();
      // this._getBitacoraLineal();
    },
    setNewService() {
      var vm = this;
      if (vm.$refs.formNewService.validate()) {
        const dataBegend =
          vm.$store.state.itemsBegEndList.find(
            (v) => v.id === vm.house_service_id_begend,
          ) || {};
        const dataService = {
          id_begend: vm.house_service_id_begend,
          namebegend: dataBegend.name,
          position_begend: dataBegend.position_begend,
          nameservice: vm.house_service_name,
          status: 0,
        };

        let value_itemImpuestos = null;
        let index_itemImpuestos = vm.$store.state.itemsHouseServices.findIndex(
          (item) => item.nameservice.toUpperCase() == "IMPUESTOS",
        );
        if (index_itemImpuestos !== -1) {
          value_itemImpuestos =
            vm.$store.state.itemsHouseServices[index_itemImpuestos];
          vm.$store.state.itemsHouseServices.splice(index_itemImpuestos, 1);
        }

        vm.$store.state.itemsHouseServices.push(dataService);

        if (value_itemImpuestos !== null) {
          vm.$store.state.itemsHouseServices.push(value_itemImpuestos);
        }

        vm.$store.state.modalServices_manualMode = false;
      }

      vm.$refs.formNewService.reset();
    },
    cancelNewService() {
      this.$refs.formNewService.reset();
      this.$store.state.modalServices_manualMode =
        !this.$store.state.modalServices_manualMode;
    },
  },
  watch: {
    async recargarClienteFlag() {
      var vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `ver_proveedor?id=${vm.$store.state.house_id_consigner}`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(function (response) {
          let res = response.data;
          if (res.estadoflag) {
            let proveedor = res.data[0];
            vm.$store.state.copy_house.emailaddress_clientefinal =
              proveedor.emailaddress;
            console.log(vm.$store.state.copy_house.emailaddress_clientefinal);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
