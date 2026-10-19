<template>
  <div>
    <v-stepper v-model="entitiesStore.stepper" non-linear>
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
import SeccionCliente from "./SeccionCliente.vue";
import SeccionTelefonos from "./SeccionTelefonos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
import SeccionShippers from "./SeccionShippers.vue";
import SeccionInformacionEntrega from "./SeccionInformacionEntrega.vue";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCoinsStore } from "@/stores/coins";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEntitiesStore } from "@/stores/entities";
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
  computed: {
    ...mapStores(useEntitiesStore),
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
    ...mapPiniaActions(useEntitiesStore, ["getListProveedor", "getValidaRazonSocial", "guardarCliente", "getValidaDocumentCliente", "verCliente"]),
    ...mapPiniaActions(useMasterusuariosStore, ["cargarMasterDetalleTipoProveedor", "cargarMasterDetalleTipoTransaccion", "cargarTipoTelefono", "cargarTipoPersona"]),
    ...mapPiniaActions(useCoinsStore, ["getCoinsListCargar"]),
  },
  created() {
    this.entitiesStore.lstProveedores_x_nombre = [];
    this.entitiesStore.lstProveedores_x_documento = [];
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
    await this._getState(this.entitiesStore.cliente.id_pais);
    await this._getCity(
      this.entitiesStore.informacionEntrega.id_departamento
    );
    await this._getTown(
      this.entitiesStore.informacionEntrega.id_provincia
    );
    this.$store.state.spiner = false;

    this.entitiesStore.stepper = 1;
    this.entitiesStore.isEdit = false;
    this.entitiesStore.isReadonly = true;

    this.$store.state.mainTitle = `VER CLIENTE: CLI - ${this.entitiesStore.cliente.correlativo}`;
  },
  afterMount() {},
};
</script>

<style>
.row + .row {
  margin-top: 0;
}
</style>
