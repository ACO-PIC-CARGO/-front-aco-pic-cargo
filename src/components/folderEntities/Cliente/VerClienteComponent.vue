<template>
  <div>
    <v-stepper v-model="$store.state.entities.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-item
          editable
          :value="1"
          title="Datos del Cliente"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="2"
          title="Teléfonos y Contactos"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="3"
          title="Convenios y Tarifas"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="4"
          title="Información Bancaria"
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
import { mapActions as mapPiniaActions } from "pinia";
import { useCoinsStore } from "@/stores/coins";
export default {
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
    ...mapPiniaActions(useCoinsStore, ["getCoinsListCargar"]),
  },
  created() {
    this.$store.state.entities.lstProveedores_x_nombre = [];
    this.$store.state.entities.lstProveedores_x_documento = [];
  },
  async mounted() {
    this.$store.state.spiner = true;
    //this.$refs.formProveedor.reset();
    await this._getDocumentsPais();
    await this.cargarMasterDetalleTipoProveedor();
    await this._getPais();
    await this.cargarMasterDetalleTipoTransaccion();
    await this.cargarTipoTelefono();
    await this._getRole();
    await this.getCoinsListCargar();
    await this.getBanksListCargar();
    await this._getSex();
    await this.cargarTipoPersona();
    await this._getProveedorRolShipper();
    await this.verCliente();
    await this._getState(this.$store.state.entities.cliente.id_pais);
    await this._getCity(
      this.$store.state.entities.informacionEntrega.id_departamento
    );
    await this._getTown(
      this.$store.state.entities.informacionEntrega.id_provincia
    );
    this.$store.state.spiner = false;

    this.$store.state.entities.stepper = 1;
    this.$store.state.entities.isEdit = false;
    this.$store.state.entities.isReadonly = true;

    this.$store.state.mainTitle = `VER CLIENTE: CLI - ${this.$store.state.entities.cliente.correlativo}`;
  },
  afterMount() {},
};
</script>

<style>
.row + .row {
  margin-top: 0;
}
</style>
