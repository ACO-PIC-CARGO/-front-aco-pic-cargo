<template>
  <div>
    <v-overlay
      :model-value="$store.state.spiner"
      class="align-center justify-center"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-subtitle-1 text-center" cols="12">
          Cargando Datos, espere un momento por favor...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-overlay>
    <v-stepper v-model="$store.state.entities.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-item
          :complete="$store.state.entities.stepper > 1"
          editable
          :value="1"
          title="Datos del Proveedor"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="$store.state.entities.stepper > 2"
          :editable="$store.state.entities.stepper > 2"
          :value="2"
          title="Teléfonos y Contactos"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="$store.state.entities.stepper > 3"
          :editable="$store.state.entities.stepper > 3"
          :value="3"
          title="Convenios y Tarifas"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="$store.state.entities.stepper > 4"
          :editable="$store.state.entities.stepper > 4"
          :value="4"
          title="Información Bancaria"
        ></v-stepper-item>

        <v-divider></v-divider>
        <v-stepper-item
          :complete="$store.state.entities.stepper > 5"
          :editable="$store.state.entities.stepper > 5"
          :value="5"
          title="Correo para Pedir Tarifa"
        ></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!--DATOS DEL PROVEEDOR-->
        <v-stepper-window-item :value="1" eager>
          <SeccionProveedor
            :isPricing="isPricing"
            @ObtenerProveedor="guardarProveedor"
          />
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

        <!--Sección Tarifas-->
        <v-stepper-window-item :value="5" eager>
          <SeccionEmailTarifa :guardarFlag="false"/>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import SeccionProveedor from "./seccionProveedor.vue";
import SeccionTelefonos from "./seccionTelefonos.vue";
import SeccionConvenios from "./seccionConvenios.vue";
import SeccionInformacionBancaria from "./seccionInformacionBancaria.vue";
import SeccionEmailTarifa from "./SeccionEmailTarifaComponent.vue";
export default {
  components: {
    SeccionProveedor,
    SeccionTelefonos,
    SeccionConvenios,
    SeccionInformacionBancaria,
    SeccionEmailTarifa,
  },
  props: {
    isPricing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["GuardarProveedorExiste"],
  data() {
    return {
      loading: false,
      titleVal: "",
      defaultTipoTransaccion: 56,
    };
  },
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
    ]),
    /* CÓDIGO NUEVO */
    getIDTipoTelefono(criterio = "") {
      var vm = this;
      var id = null;

      const tipoTelefonoData =
        vm.$store.state.masterusuarios.lstTipoTelefono.find(
          (v) => v.descripcion.toUpperCase() == criterio.toUpperCase(),
        );
      if (tipoTelefonoData) {
        id = tipoTelefonoData.id;
      }

      return id;
    },
    getIDTipoPersona(criterio = "") {
      var vm = this;
      var id = null;

      const tipoPersonaData =
        vm.$store.state.masterusuarios.lstTipoPersona.find(
          (v) => v.descripcion.toUpperCase() == criterio.toUpperCase(),
        );
      if (tipoPersonaData) {
        id = tipoPersonaData.id;
      }

      return id;
    },
    getIDTipoDocumento(criterio = "") {
      var vm = this;
      var id = null;

      const tipoDocumentoData = vm.$store.state.itemsDocumentsPais.find(
        (v) => v.name.toUpperCase() == criterio.toUpperCase(),
      );
      if (tipoDocumentoData) {
        id = tipoDocumentoData.id;
      }

      return id;
    },
    guardarProveedor(val) {
      this.$emit("GuardarProveedorExiste", val);
    },
  },
  created() {
    this.$store.state.entities.lstProveedores_x_nombre = [];
    this.$store.state.entities.lstProveedores_x_documento = [];
  },
  async mounted() {
    // console.log("isPricing", this.isPricing);
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
    ]);

    this.$store.state.entities.stepper = 1;
    this.$store.state.entities.isEdit = false;
    this.$store.state.entities.isReadonly = false;
    this.$store.state.entities.showBtnSaveFlag = false;

    this.$store.state.entities.proveedor.nombrecompleto = "";
    this.$store.state.entities.proveedor.id_tipoproveedor = "";
    this.$store.state.entities.proveedor.id_tipotransaccion = "56";
    this.$store.state.entities.proveedor.nro_documento = "";
    this.$store.state.entities.proveedor.id_pais = null;
    this.$store.state.entities.proveedor.id_ciudad = 0;
    this.$store.state.entities.proveedor.direccion = "";
    this.$store.state.entities.proveedor.emailaddress = "";
    this.$store.state.entities.proveedor.producto = "";
    this.$store.state.entities.proveedor.dias_sobreestadia = 0;
    this.$store.state.entities.proveedor.dias_almacenaje = 0;
    this.$store.state.entities.proveedor.notas = "";
    this.$store.state.entities.proveedor.convenioActual = {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
      id_path: "",
    };
    this.$store.state.entities.proveedor.telefonoActual = {
      id_tipotelefono: "",
      telefono: "",
    };
    this.$store.state.entities.proveedor.contactoActual = {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    };

    this.$store.state.entities.lstTelefonos = [];
    this.$store.state.entities.lstContactos = [];
    this.$store.state.entities.lstConvenios = [];
    this.$store.state.entities.lstTarifas = [];
    this.$store.state.entities.lstInformacionBancaria = [];
    this.$store.state.entities.lstShippers = [];
    this.$store.state.entities.informacionEntrega = { status: true };

    const tipoDocumento = this.getIDTipoDocumento("RUC");
    this.$store.state.entities.proveedor.id_tipodocumento = tipoDocumento;

    const tipoTelefono = this.getIDTipoTelefono("WHATSAPP");
    this.$store.state.entities.proveedor.telefonoActual.id_tipotelefono =
      tipoTelefono;
    this.$store.state.entities.proveedor.contactoActual.id_tipotelefono =
      tipoTelefono;
    this.$store.state.spiner = false;
  },
  watch: {
    "$store.state.entities.stepper": {
      handler(newStep, oldStep) {
        if (this.$route.name == "nuevoProveedor" && newStep === 5) {
          this.$store.state.entities.showBtnSaveFlag = true;
        } else {
          this.$store.state.entities.showBtnSaveFlag = false;
        }
      },
      immediate: true,
    },
  },
};
</script>

<style>
.row + .row {
  margin-top: 0;
}
</style>
