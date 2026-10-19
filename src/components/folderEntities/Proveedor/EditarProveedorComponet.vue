<template>
  <v-container fluid>
    <v-stepper v-model="entitiesStore.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-item
          editable
          :value="1"
          title="Datos del Proveedor"
          :rules="[() => entitiesStore.isStep1Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="2"
          title="Teléfonos y Contactos"
          :rules="[() => entitiesStore.isStep2Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="3"
          title="Convenios y Tarifas"
          :rules="[() => entitiesStore.isStep3Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          editable
          :value="4"
          title="Información Bancaria"
          :rules="[() => entitiesStore.isStep4Valid]"
        ></v-stepper-item>

        <v-divider></v-divider>
        <v-stepper-item
          editable
          :value="5"
          title="Correo para Pedir Tarifa"
        ></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!--DATOS DEL PROVEEDOR-->
        <v-stepper-window-item :value="1" eager>
          <SeccionProveedor />
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
        <v-stepper-window-item :value="5" eager>
          <SeccionEmailTarifa />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import SeccionProveedor from "./SeccionProveedor.vue";
import SeccionTelefonos from "./SeccionTelefonos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
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
    ...mapPiniaActions(useEntitiesStore, ["getListProveedor", "getValidaRazonSocial", "guardarCliente", "getValidaDocumentCliente", "getVerProveedor"]),
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
  },
  created() {
    this.entitiesStore.lstProveedores_x_nombre = [];
    this.entitiesStore.lstProveedores_x_documento = [];
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
      this.getVerProveedor(),
    ]);
    this._getState(this.entitiesStore.proveedor.id_pais);
    this.$store.state.spiner = false;

    this.entitiesStore.stepper = 1;
    this.entitiesStore.isEdit = true;
    this.entitiesStore.isReadonly = false;
    this.entitiesStore.showBtnSaveFlag = true;

    this.$store.state.mainTitle = `MODIFICAR PROVEEDOR: PROV - ${this.entitiesStore.proveedor.correlativo}`;
  },
};
</script>

<style>
.row + .row {
  margin-top: 0;
}
</style>
