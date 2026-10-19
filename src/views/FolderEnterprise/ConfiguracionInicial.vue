<template>
  <div class="">
    <v-container
      fluid
      class="pt-0 mt-0 pb-0 altContainer"
      style="height: 120vh"
      v-if="!dialog"
    >
      <v-stepper alt-labels v-model="e1">
        <v-stepper-header>
          <v-stepper-item
            :value="1"
            :complete="e1 > 1"
            :editable="editarEmpresa"
            title="CONFIGURA TU EMPRESA"
          />

          <v-divider></v-divider>

          <v-stepper-item
            :value="2"
            :complete="e1 > 2"
            :editable="editarProveedor"
            title="CONFIGURACIÓN PROVEEDORES"
          />

          <v-divider></v-divider>

          <v-stepper-item
            :value="3"
            :complete="e1 > 3"
            :editable="editarCliente"
            title="CONFIGURACIÓN CLIENTES"
          />
          <v-divider></v-divider>

          <v-stepper-item
            :value="4"
            :complete="e1 > 4"
            :editable="editarConfig"
            title="CONFIGURACIÓN DE SERVICIO"
          />
        </v-stepper-header>

        <v-stepper-window>
          <v-stepper-window-item :value="1">
            <ConfiguraciónDatosEmpresaComponent
              v-if="e1 == 1"
              @GuardarDatosEmpresa="guardarDatosEmpresa()"
              @omitir="omitirStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="2">
            <ConfiguracionCargaProveedorComponent
              v-if="e1 == 2"
              @continuarClientes="continuarStepClientes()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="3">
            <ConfiguracionCargaClienteComponent
              v-if="e1 == 3"
              @continuarConfigurarTarifario="continuarStepConfigurarTarifario()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="4">
            <ConfiguracionCostosComponent
              v-if="e1 == 4"
              @finalizar="finalizar()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
      <v-row class="btn-actions py-5" v-if="!dialog">
        <v-col cols="1" class="mt-info mt-5">
          <BotonChateaConNosotros />
        </v-col>
      </v-row>
    </v-container>
    <v-dialog v-model="dialog" scrollable fullscreen persistent>
      <v-card>
        <v-row class="fill-height align-center justify-center">
          <v-col cols="12" md="8">
            <div style="text-align: center; padding: auto">
              <h1 class="my-3" style="font-weight: normal">
                Hola, queremos conocer tu negocio.
              </h1>
              <p class="my-3">Te llevará menos de 2 minutos</p>
              <v-btn color="info" class="my-3" @click="dialog = !dialog">
                Comenzar
              </v-btn>
              <p><v-icon>mdi-clock</v-icon> Dura 1 minuto 30 segundos</p>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import BotonChateaConNosotros from "../../components/comun/BotonChateaConNosotros.vue";
import ConfiguracionCargaClienteComponent from "../../components/FolderEnterprise/ConfiguracionCargaClienteComponent.vue";
import ConfiguracionCargaProveedorComponent from "../../components/FolderEnterprise/ConfiguracionCargaProveedorComponent.vue";
import ConfiguracionCostosComponent from "../../components/FolderEnterprise/ConfiguracionCostosComponent.vue";
import ConfiguraciónDatosEmpresaComponent from "../../components/FolderEnterprise/ConfiguracionDatosEmpresaComponent.vue";
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions } from "pinia";
import { useSecuritysStore } from "@/stores/securitys";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
export default {
  components: {
    ConfiguraciónDatosEmpresaComponent,
    ConfiguracionCargaProveedorComponent,
    ConfiguracionCargaClienteComponent,
    ConfiguracionCostosComponent,
    BotonChateaConNosotros,
  },
  data() {
    return {
      e1: 1,
      steps: 2,
      editarEmpresa: true,
      editarProveedor: false,
      editarCliente: false,
      editarConfig: false,
      dialog: true,
    };
  },
  async mounted() {
    this.$store.state.drawer = false;
    this.$store.state.spinner = true;
    await this.getModality();
    await this.getShipment();
    await this.getIncoterms();
    await this._getDocumentsPais();
    await this._getProveedor();
    this.$store.state.spinner = false;
    await this.ObtenerDatosConfig();
  },
  methods: {
    ...mapActions([
      "getModality",
      "getShipment",
      "getIncoterms",
      "_getDocumentsPais",
      "_getPais",
      "_getProveedor",
    ]),
    ...mapPiniaActions(useConfigEmpresaStore, ["finalizarConfiguracion", "actualizarDatoEmpresa"]),
    ...mapPiniaActions(useSecuritysStore, ["ObtenerDatosConfig"]),
    async guardarDatosEmpresa() {
      this.$store.state.dialogProcessing = true;
      await this.actualizarDatoEmpresa();
      this.$store.state.dialogProcessing = false;
      this.editarProveedor = true;
      this.e1 = 2;
    },
    continuarStepClientes() {
      this.editarCliente = true;
      this.e1 = 3;
    },
    continuarStepConfigurarTarifario() {
      this.editarConfig = true;
      this.e1 = 4;
    },
    omitirStep() {
      
      switch (this.e1) {
        case 1:
          this.editarProveedor = true;
          break;
        case 2:
          this.editarCliente = true;
          break;
        case 3:
          this.editarConfig = true;
          break;
        case 4:
          this.editarConfig = true;
          break;

        default:
          this.editarConfig = true;
          break;
      }
      this.e1++;
    },
    regresarStep() {
      this.e1--;
    },
  },
};
</script>

<style scoped>
.frmEmpresa {
  padding: 0 50% !important;
}
.btn-actions {
  /* background: red; */
  position: fixed;
  bottom: 10px;
  right: 20px;
  z-index: 999;
}
.altContainer {
  height: 100vh;
}
@media (max-width: 918px) {
  .btn-actions {
    position: fixed;
    bottom: calc(20px + env(safe-area-inset-bottom));
    right: 20px;
    z-index: 999;
  }
  .v-container {
    padding-bottom: 120px !important;
  }

  .altContainer {
    height: 180vh; /* si necesitas más espacio de scroll */
    padding-bottom: 100px;
  }
}
</style>
