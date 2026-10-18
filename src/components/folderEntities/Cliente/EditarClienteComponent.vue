<template>
  <div>
    <v-stepper v-model="$store.state.entities.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-item
          editable
          :value="1"
          title="Datos del Cliente"
          :rules="[() => $store.state.entities.isStep1Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="2"
          title="Teléfonos y Contactos"
          :rules="[() => $store.state.entities.isStep2Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="3"
          title="Convenios y Tarifas"
          :rules="[() => $store.state.entities.isStep3Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="4"
          title="Información Bancaria"
          :rules="[() => $store.state.entities.isStep4Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item editable :value="5" title="Shipper"></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="6"
          title="Destinatario"
        ></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!--DATOS DEL CLIENTE-->
        <v-stepper-window-item :value="1" eager>
          <SeccionCliente />
        </v-stepper-window-item>

        <!--TELÉFONOS-->
        <v-stepper-window-item :value="2" eager>
          <SeccionTelefonos />
        </v-stepper-window-item>

        <!--CONVENIOS Y TARIFAS-->
        <v-stepper-window-item :value="3" eager>
          <SeccionConvenios />
        </v-stepper-window-item>

        <!--INFORMACIÓN BANCARIA-->
        <v-stepper-window-item :value="4" eager>
          <SeccionInformacionBancaria />
        </v-stepper-window-item>

        <!--SHIPPER-->
        <v-stepper-window-item :value="5" eager>
          <SeccionShippers />
        </v-stepper-window-item>

        <!--INFORMACIÓN DE ENTREGA-->
        <v-stepper-window-item :value="6" eager>
          <SeccionInformacionEntrega />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import SeccionCliente from "./seccionCliente.vue";
import SeccionTelefonos from "./seccionTelefonos.vue";
import SeccionConvenios from "./seccionConvenios.vue";
import SeccionInformacionBancaria from "./seccionInformacionBancaria.vue";
import SeccionShippers from "./seccionShippers.vue";
import SeccionInformacionEntrega from "./seccionInformacionEntrega.vue";
export default {
  props: {
    house_id_consigner: {
      type: Number,
      default: null,
    },
  },
  components: {
    SeccionCliente,
    SeccionTelefonos,
    SeccionConvenios,
    SeccionInformacionBancaria,
    SeccionShippers,
    SeccionInformacionEntrega,
  },
  data() {
    return {
      loading: false,
      titleVal: "",
      defaultTipoTransaccion: 56,
    };
  },
  computed: {},
  methods: {
    ...mapActions([
      "getListProveedor",
      "_getDocumentsPais",
      "cargarMasterDetalleTipoProveedor",
      "cargarMasterDetalleTipoTransaccion",
      "_getRole",
      "getValidaRazonSocial",
      "cargarTipoTelefono",
      "getCoinsListCargar",
      "getBanksListCargar",
      "guardarCliente",
      "getValidaDocumentCliente",
      "_getSex",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "cargarTipoPersona",
      "_getProveedorRolShipper",
      "_getProveedor",
      "verCliente",
    ]),
  },
  created() {
    this.$store.state.entities.lstProveedores_x_nombre = [];
    this.$store.state.entities.lstProveedores_x_documento = [];
  },
  async mounted() {
    this.$store.state.spiner = true;
    //this.$refs.formProveedor.reset();
    await Promise.all([
      this._getDocumentsPais(),
      this.cargarMasterDetalleTipoProveedor(),
      this._getPais(),
      this.cargarMasterDetalleTipoTransaccion(),
      this.cargarTipoTelefono(),
      this._getRole(),
      this.getCoinsListCargar(),
      this.getBanksListCargar(),
      this._getSex(),
      this.cargarTipoPersona(),
      this._getProveedorRolShipper(),
      this.house_id_consigner
        ? this.verCliente(this.house_id_consigner)
        : this.verCliente(),
    ]);
    await this._getState(this.$store.state.entities.cliente.id_pais);
    await this._getCity(
      this.$store.state.entities.informacionEntrega.id_departamento,
    );
    await this._getTown(
      this.$store.state.entities.informacionEntrega.id_provincia,
    );
    this.$store.state.spiner = false;

    this.$store.state.entities.stepper = 1;
    this.$store.state.entities.isEdit = true;
    this.$store.state.entities.isReadonly = false;
    this.$store.state.entities.showBtnSaveFlag = true;

    this.$store.state.mainTitle = `MODIFICAR CLIENTE: CLI`;
  },
  afterMount() {},
};
</script>

<style>
.row + .row {
  margin-top: 0;
}
</style>
