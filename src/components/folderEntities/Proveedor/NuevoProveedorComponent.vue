<template>
  <div>
    <v-overlay
      :model-value="$store.state.spiner"
      class="align-center justify-center"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-body-large text-center" cols="12">
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
    <v-stepper v-model="entitiesStore.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-item
          :complete="entitiesStore.stepper > 1"
          editable
          :value="1"
          title="Datos del Proveedor"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="entitiesStore.stepper > 2"
          :editable="entitiesStore.stepper > 2"
          :value="2"
          title="Teléfonos y Contactos"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="entitiesStore.stepper > 3"
          :editable="entitiesStore.stepper > 3"
          :value="3"
          title="Convenios y Tarifas"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="entitiesStore.stepper > 4"
          :editable="entitiesStore.stepper > 4"
          :value="4"
          title="Información Bancaria"
        ></v-stepper-item>

        <v-divider></v-divider>
        <v-stepper-item
          :complete="entitiesStore.stepper > 5"
          :editable="entitiesStore.stepper > 5"
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCoinsStore } from "@/stores/coins";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEntitiesStore } from "@/stores/entities";
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
  computed: {
    ...mapStores(useEntitiesStore, useMasterusuariosStore),
  },
  methods: {
    ...mapActions([
      "_getDocumentsPais",
      "_getRole",
      "getBanksListCargar",
      "_getSex",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "_getProveedorRolShipper",
      "_getProveedor",
    ]),
    ...mapPiniaActions(useEntitiesStore, ["getListProveedor", "getValidaRazonSocial", "guardarCliente", "getValidaDocumentCliente"]),
    ...mapPiniaActions(useMasterusuariosStore, ["cargarMasterDetalleTipoProveedor", "cargarMasterDetalleTipoTransaccion", "cargarTipoTelefono", "cargarTipoPersona"]),
    ...mapPiniaActions(useCoinsStore, ["getCoinsListCargar"]),
    /* CÓDIGO NUEVO */
    getIDTipoTelefono(criterio = "") {
      var vm = this;
      var id = null;

      const tipoTelefonoData =
        vm.masterusuariosStore.lstTipoTelefono.find(
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
        vm.masterusuariosStore.lstTipoPersona.find(
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
    this.entitiesStore.lstProveedores_x_nombre = [];
    this.entitiesStore.lstProveedores_x_documento = [];
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

    this.entitiesStore.stepper = 1;
    this.entitiesStore.isEdit = false;
    this.entitiesStore.isReadonly = false;
    this.entitiesStore.showBtnSaveFlag = false;

    this.entitiesStore.proveedor.nombrecompleto = "";
    this.entitiesStore.proveedor.id_tipoproveedor = "";
    this.entitiesStore.proveedor.id_tipotransaccion = "56";
    this.entitiesStore.proveedor.nro_documento = "";
    this.entitiesStore.proveedor.id_pais = null;
    this.entitiesStore.proveedor.id_ciudad = 0;
    this.entitiesStore.proveedor.direccion = "";
    this.entitiesStore.proveedor.emailaddress = "";
    this.entitiesStore.proveedor.producto = "";
    this.entitiesStore.proveedor.dias_sobreestadia = 0;
    this.entitiesStore.proveedor.dias_almacenaje = 0;
    this.entitiesStore.proveedor.notas = "";
    this.entitiesStore.proveedor.convenioActual = {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
      id_path: "",
    };
    this.entitiesStore.proveedor.telefonoActual = {
      id_tipotelefono: "",
      telefono: "",
    };
    this.entitiesStore.proveedor.contactoActual = {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    };

    this.entitiesStore.lstTelefonos = [];
    this.entitiesStore.lstContactos = [];
    this.entitiesStore.lstConvenios = [];
    this.entitiesStore.lstTarifas = [];
    this.entitiesStore.lstInformacionBancaria = [];
    this.entitiesStore.lstShippers = [];
    this.entitiesStore.informacionEntrega = { status: true };

    const tipoDocumento = this.getIDTipoDocumento("RUC");
    this.entitiesStore.proveedor.id_tipodocumento = tipoDocumento;

    const tipoTelefono = this.getIDTipoTelefono("WHATSAPP");
    this.entitiesStore.proveedor.telefonoActual.id_tipotelefono =
      tipoTelefono;
    this.entitiesStore.proveedor.contactoActual.id_tipotelefono =
      tipoTelefono;
    this.$store.state.spiner = false;
  },
  watch: {
    "entitiesStore.stepper": {
      handler(newStep, oldStep) {
        if (this.$route.name == "nuevoProveedor" && newStep === 5) {
          this.entitiesStore.showBtnSaveFlag = true;
        } else {
          this.entitiesStore.showBtnSaveFlag = false;
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
