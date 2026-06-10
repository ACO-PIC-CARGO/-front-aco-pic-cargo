<template>
  <div v-if="mostrarflag">
    <h3>Datos y Servicios a Realizar</h3>

    <v-row dense>
      <v-col cols="12" md="12">
        <v-text-field
          v-model="$store.state.master_expediente"
          label="N° de Expedientes"
          disabled
        ></v-text-field>
      </v-col>

      <v-col cols="6" v-if="mostrarGrupal">
        <v-checkbox
          label="Campañas Grupales"
          v-model="$store.state.grupalflag"
        ></v-checkbox>
      </v-col>
      <v-col cols="6" v-if="mostrarGrupal">
        <v-text-field
          v-if="$store.state.grupalflag"
          label="Nro Cuotas"
          v-model="$store.state.nro_cuotas"
          min="0"
          type="number"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="12" v-if="$store.state.grupalflag">
        <v-text-field
          v-model="$store.state.namecampaign"
          label="Nombre de Campaña"
        ></v-text-field>
      </v-col>

      <v-col cols="12" v-if="!!$store.state.grupalflag">
        <center class="my-5"><h3>Porcentaje y Fecha de pago</h3></center>
        <v-row>
          <v-col cols="6" v-for="n in Number($store.state.nro_cuotas)" :key="n">
            <v-row>
              <v-col cols="4">
                <v-text-field
                  :label="`Porcentaje Cuota-${n}`"
                  v-model="$store.state.cuota[n - 1]"
                  type="number"
                  suffix="%"
                  min="0"
                  max="100"
                  dense
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'El porcentaje tiene que ser positivo',
                    (v) =>
                      v <= 100 || 'El por centaje no puede ser mayor que 100%',
                  ]"
                ></v-text-field>
              </v-col>
              <v-col cols="8">
                <v-text-field
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :label="`Fecha de pago ${n}`"
                  v-model="$store.state.fechacuota[n - 1]"
                  type="date"
                  dense
                ></v-text-field>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" md="4">
        <v-autocomplete
          :items="itemsModality"
          item-text="name"
          item-value="id"
          label="Sentido"
          @change="handleSentido(), _getDataService()"
          v-model="$store.state.master_sentido"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="itemsShipment"
          item-text="embarque"
          item-value="id"
          label="Tipo de Embarque"
          return-object
          v-model="$store.state.master_id_trasnport"
          @change="_activePort($store.state.master_id_trasnport.id_transport)"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          :items="itemsIncoterms"
          item-text="name"
          item-value="id"
          label="Incoterms"
          v-model="$store.state.master_incoterms"
          @change="_getDataService()"
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" md="6">
        <v-autocomplete
          :items="itemsPortBegin"
          item-text="name"
          item-value="id_port"
          label="Origen"
          v-model="$store.state.master_origen"
          @update:search-input="recargarPuertoOrigen"
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" md="6">
        <v-autocomplete
          :items="itemsPortEnd"
          item-text="name"
          item-value="id_port"
          label="Destino"
          v-model="$store.state.master_destino"
          @update:search-input="recargarPuertoDestino"
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" md="6" v-if="$route.params.id">
        <v-text-field
          type="text"
          step="1"
          min="1"
          readonly
          v-model="$store.state.master_cantidad_house"
          label="Cantidad de House"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="itemsOperadorList"
          item-text="namelong"
          item-value="id"
          label="Operador"
          v-model="$store.state.master_id_operador"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="6" v-if="isAereo() || isFCL() || isLCL()">
        <v-autocomplete
          :items="$store.state.itemsProveedorRolAgente"
          item-text="namelong"
          item-value="id"
          label="Agente"
          v-model="$store.state.master_id_agente"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="6" v-if="isLCL()">
        <v-autocomplete
          :items="$store.state.itemsProveedorRolColoader"
          item-text="namelong"
          item-value="id"
          label="Coloader"
          v-model="$store.state.master_id_coloader"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" md="6" v-if="isFCL()">
        <v-autocomplete
          :items="$store.state.itemsProveedorRolNaviera"
          item-text="namelong"
          item-value="id"
          label="Naviera"
          v-model="$store.state.master_id_naviera"
        ></v-autocomplete>
      </v-col>
      <!--
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Notify Master MBL"
          v-model="$store.state.master_id_notify"
        ></v-autocomplete>
      </v-col>
      -->
      <v-col cols="12" md="6">
        <v-text-field
          :type="obtenerInputTypeBLMaster"
          v-model="$store.state.master_blmaster"
          :label="obtenerLabelBLMaster"
        ></v-text-field>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import axios from '@/api/axios-config';
export default {
  name: "dataGen",
  data() {
    return {
      mostrarflag: true,
      mostrarGrupal: false,
      id_transport: null,
    };
  },
  async mounted() {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
    this.mostrarGrupal = branch.id == 1;
    this.$store.state.spiner = true;
    this.limpiar(),
      await Promise.all([
        this._getValidad(),
        this._getModality(),
        this._getShipment(),
        this._getIncoterms(),
        this.cargarMasterDetalleCanal(),
        this._getOperador(),
        this.cargarClientes(),
        this._getProveedorRolAgente(),
        this._getProveedorRolColoader(),
        this._validaDatass(),
      ]);
    if (!this.$route.params.id) {
      await this._getnroMaster();
    }
    this.$store.state.spiner = false;
    //this.$store.state.drawer = false;
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
      "itemsOperadorList",
      "drawer",
      "itemsContainers",
    ]),
    obtenerLabelBLMaster() {
      return this.isAereo() ? "BL Máster Nro." : "BL Máster";
    },
    obtenerInputTypeBLMaster() {
      return 'text'
      // return this.isAereo() ? "number" : "text";
    },
    operadorNombre() {
      if (!this.$store.state.master_id_operador || !this.itemsOperadorList) {
        return "";
      }
      const operador = this.itemsOperadorList.find(
        op => op.id == this.$store.state.master_id_operador
      );
      return operador ? operador.namelong : "";
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
      "_getServicesList",
      "_getOperador",
      "_getHouseList",
      "cargarMasterDetalleCanal",
      "cargarClientes",
      "_getProveedorRolAgente",
      "_getProveedorRolColoader",
      "_getProveedorRolNaviera",
    ]),

    async _activePort(id_transport) {
      this.id_transport = id_transport;

      this.$store.state.spiner = true;
      await Promise.all([
        this._getPortBegin({ id_transport: id_transport }),
        this._getPortEnd({ id_transport: id_transport }),
      ]);

      if (this.$store.state.master_id_trasnport.id == 1) {
        this.$store.state.embar_title_nacn = "Aerolinea";
      } else if (this.$store.state.master_id_trasnport.id == 2) {
        this.$store.state.embar_title_nacn = "Naviera";
      } else if (this.$store.state.master_id_trasnport.id == 3) {
        this.$store.state.embar_title_nacn = "Coloader";
      } else {
        this.$store.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
      }
      this.$store.state.spiner = false;
    },

    _getDataService() {
      this._getServicesBegin();
      // this._getBitacoraList();
      // this._getServicesList();
    },

    _getValidad() {
      var dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
      this.$store.state.master_id_operador = dataUser[0].id;
    },

    _getDate() {
      if (this.$store.state.master_sentido == 1) {
        this.$store.state.master_fecha_disponibilidad =
          this.$store.state.master_fecha_eta;
      } else if (this.$store.state.master_sentido == 2) {
        this.$store.state.master_fecha_disponibilidad =
          this.$store.state.master_fecha_etd;
      }
    },

    _validaDatass() {
      var vm = this;

      if (vm.$route.params.id) {
        vm.$store.state.master_Id_get = vm.$route.params.id;

        var config = {
          method: "post",
          url:
            process.env.VUE_APP_URL_MAIN +
            "getMasterId/" +
            vm.$store.state.master_Id_get,
          headers: {
           
            "Content-Type": "application/json",
          },
        };
        axios(config)
          .then(async function (response) {
            // console.log(response)

            sessionStorage.setItem("auth-token", response.data.token);

            vm.$store.state.master_insertId = vm.$store.state.master_Id_get;
            vm.$store.state.nro_master = response.data.data[0].nro_master;
            vm.$store.state.master_cantidad_house =
              response.data.data[0].cantidad_house;
            vm.$store.state.master_nro_expediente =
              response.data.data[0].code_master;
            vm.$store.state.master_expediente =
              response.data.data[0].code_master;
            vm.$store.state.master_sentido = response.data.data[0].id_modality;
            vm.$store.state.master_id_trasnport =
              response.data.data[0].id_shipment;
            vm.$store.state.master_cotizanion = response.data.data[0].id_cot;
            vm.$store.state.master_incoterms =
              response.data.data[0].id_incoterms;
            vm.id_transport = response.data.data[0].id_transport;
            await vm._getPortBegin({
              id_transport: response.data.data[0].id_transport,
              id: response.data.data[0].id_port_begin,
            });
            await vm._getPortEnd({
              id_transport: response.data.data[0].id_transport,
              id: response.data.data[0].id_port_end,
            });

            vm.$store.state.master_origen = response.data.data[0].id_port_begin;
            vm.$store.state.master_destino = response.data.data[0].id_port_end;
            vm.$store.state.master_id_operador =
              response.data.data[0].id_operador;
            vm.$store.state.master_fecha_eta = response.data.data[0].fecha_eta;
            vm.$store.state.master_fecha_etd = response.data.data[0].fecha_etd;
            vm.$store.state.master_fecha_disponibilidad =
              response.data.data[0].fecha_disponibilidad;
            vm.$store.state.master_ganancia_pricing =
              response.data.data[0].ganancia_pricing;
            vm.$store.state.master_ganancia_operaciones =
              response.data.data[0].ganancia_operaciones;
            vm.$store.state.master_id_agente = response.data.data[0].id_agent;
            vm.$store.state.master_id_consigner =
              response.data.data[0].id_consigner;
            vm.$store.state.master_id_notify = response.data.data[0].id_notify;
            vm.$store.state.master_id_airlines =
              response.data.data[0].id_aerolinea;
            vm.$store.state.statusData = true;
            vm.$store.state.master_id_coloader =
              response.data.data[0].id_coloader;
            vm.$store.state.master_id_naviera =
              response.data.data[0].id_naviera;
            vm.$store.state.master_blmaster = response.data.data[0].nro_mbl;
            vm.$store.state.master_id_motonave =
              response.data.data[0].id_motonave;
            vm.$store.state.master_viaje = response.data.data[0].nro_viaje;
            // Nuevos campos de embarque
            vm.$store.state.master_vuelo = response.data.data[0].vuelo;
            vm.$store.state.master_nro_containers =
              response.data.data[0].nro_containers;
            vm.$store.state.master_nro_precinto =
              response.data.data[0].nro_precinto;
            vm.$store.state.master_bultos = response.data.data[0].bultos;
            vm.$store.state.master_peso = response.data.data[0].peso;
            vm.$store.state.master_volumen = response.data.data[0].volumen;
            vm.$store.state.master_id_condicion =
              response.data.data[0].id_conditions;
            vm.$store.state.master_id_coins = response.data.data[0].id_moneda;
            vm.$store.state.master_monto = response.data.data[0].monto;
            vm.$store.state.grupalflag = response.data.data[0].grupalflag;
            vm.$store.state.nro_cuotas = response.data.data[0].nro_cuotas;
            vm.$store.state.comentario = response.data.data[0].comentario;
            vm.$store.state.fecha_libre_almacenaje =
              response.data.data[0].fecha_libre_almacenaje;
            vm.$store.state.fecha_libre_sobreestadia =
              response.data.data[0].fecha_libre_sobreestadia;
            vm.$store.state.almacen_recepcion =
              response.data.data[0].almacen_recepcion;
            vm.$store.state.dias_sobreestadia =
              response.data.data[0].dias_sobreestadia;
            vm.$store.state.id_canal =
              response.data.data[0].id_masterdetallecanal;
            vm.$store.state.nro_manifiesto =
              response.data.data[0].nro_manifiesto;
            vm.$store.state.url_folderonedrive =
              response.data.data[0].url_folderonedrive;

            const cuotas = response.data.data[0].cuotas || [];
            cuotas.forEach((element) => {
              vm.$store.state.cuota.push(element.porcentaje);
              vm.$store.state.fechacuota.push(element.fecha);
            });
            vm.$store.state.namecampaign = response.data.data[0].namecampaign;
            vm.$store.state.master_itemsContainers =
              response.data.data[0].lstmastercontainers.map((item) => {
                return {
                  ...item,
                  name: vm.itemsContainers.filter(
                    (v) => v.id == item.id_container,
                  ).length
                    ? vm.itemsContainers.find((v) => v.id == item.id_container)
                        .name
                    : "",
                };
              });
            vm.mostrarflag = false;
            vm.mostrarflag = true;

            await vm._getHouseList();
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },

    limpiar() {
      let vm = this;
      vm.$store.state.master_nro_expediente = "";
      vm.$store.state.master_expediente = "";
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
      vm.$store.state.statusData = "";
      vm.$store.state.master_id_coloader = "";
      vm.$store.state.master_id_naviera = "";
      vm.$store.state.master_blmaster = "";
      vm.$store.state.master_id_motonave = "";
      vm.$store.state.master_viaje = "";
      vm.$store.state.master_bultos = "";
      vm.$store.state.master_volumen = "";
      vm.$store.state.master_id_condicion = "";
      vm.$store.state.master_id_coins = "";
      vm.$store.state.master_monto = "";
      vm.$store.state.grupalflag = false;
      vm.$store.state.nro_cuotas = 3;
      vm.$store.state.comentario = [];
      vm.$store.state.cuota = [];
      vm.$store.state.master_fecha_eta = "";
      vm.$store.state.master_fecha_etd = "";
      vm.$store.state.master_fecha_disponibilidad = "";
      vm.$store.state.fecha_libre_almacenaje = "";
      vm.$store.state.almacen_recepcion = "";
      vm.$store.state.dias_sobreestadia = "";
      vm.$store.state.id_canal = "";
      vm.$store.state.nro_manifiesto = "";
    },
    async obternerDatosCotizacion() {
      if (!!this.$store.state.master_cotizanion && !this.$route.params.id) {
        let cot = this.$store.state.pricing.listQuotes.filter(
          (v) => v.id == this.$store.state.master_cotizanion,
        )[0];
        let vm = this;
        vm.$store.state.master_sentido = cot.id_modality;
        vm.$store.state.master_id_trasnport = cot.id_shipment;
        let id_transport = this.itemsShipment.filter(
          (v) => v.id == cot.id_shipment,
        )[0].id_transport;
        await this._activePort(id_transport);
        vm.$store.state.master_incoterms = cot.id_incoterms;
        vm.$store.state.master_origen = cot.id_port_begin;
        vm.$store.state.master_destino = cot.id_port_end;
        vm.$store.state.master_fecha_disponibilidad = cot.fecha_fin;
        vm.$store.state.master_id_operador = cot.id_vendedor;
      }
    },
    validarCampaniaGrupales() {
      let val = true;
      if (this.$route.params.id) {
        let cantidadHouse = this.$store.state.itemsHouseList;
        if (cantidadHouse.length > 1) {
          val = false;
        }
      }

      return val;
    },
    isAereo() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

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
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

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
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "FCL") {
        val = true;
      }
      return val;
    },
    isImportacion() {
      let val = false;
      let id = this.$store.state.master_sentido || "";

      let name =
        this.itemsModality.filter((v) => v.id == id).length > 0
          ? this.itemsModality.filter((v) => v.id == id)[0].name
          : "";

      if (name == "Importación") {
        val = true;
      }

      return val;
    },
    isExportacion() {
      let val = false;
      let id = this.$store.state.master_sentido || "";

      let name =
        this.itemsModality.filter((v) => v.id == id).length > 0
          ? this.itemsModality.filter((v) => v.id == id)[0].name
          : "";

      if (name == "Exportación") {
        val = true;
      }

      return val;
    },
    handleSentido() {
      if (this.isImportacion()) {
        const nombreEmpresa = "PIC CARGO S.A.C";
        const empresa = this.$store.state.clientes.filter(
          (item) => item.namelong.toUpperCase() == nombreEmpresa,
        ).length
          ? this.$store.state.clientes.find(
              (item) => item.namelong.toUpperCase() == nombreEmpresa,
            ).id
          : "";

        this.$store.state.master_id_consigner = empresa;
        this.$store.state.master_id_notify = empresa;
      } else if (this.isExportacion()) {
        this.$store.state.master_id_consigner = "";
        this.$store.state.master_id_notify = "";
      }
    },
    async recargarPuertoOrigen(textoBuscar) {
      await this._getPortBegin({
        id_transport: this.id_transport,
        id: this.$store.state.master_origen,
        search: textoBuscar,
      });
    },
    async recargarPuertoDestino(textoBuscar) {
      await this._getPortEnd({
        id_transport: this.id_transport,
        id: this.$store.state.master_destino,
        search: textoBuscar,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.icon_question {
  position: absolute;
  left: 150px;
}
</style>
