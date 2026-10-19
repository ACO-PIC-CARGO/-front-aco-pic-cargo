<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useStore } from "vuex";
import BotonChateaConNosotros from "../../components/comun/BotonChateaConNosotros.vue";
import ConfiguracionCargaClienteComponent from "../../components/FolderEnterprise/ConfiguracionCargaClienteComponent.vue";
import ConfiguracionCargaProveedorComponent from "../../components/FolderEnterprise/ConfiguracionCargaProveedorComponent.vue";
import ConfiguracionCostosComponent from "../../components/FolderEnterprise/ConfiguracionCostosComponent.vue";
import ConfiguraciónDatosEmpresaComponent from "../../components/FolderEnterprise/ConfiguracionDatosEmpresaComponent.vue";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useSecuritysStore } from "@/stores/securitys";

const rootStore = useStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const e1 = ref(1);
const editarEmpresa = true;
const editarProveedor = ref(false);
const editarCliente = ref(false);
const editarConfig = ref(false);
const dialog = ref(true);

onMounted(async () => {
  rootStore.state.drawer = false;
  rootStore.state.spinner = true;
  await rootStore.dispatch("getModality");
  await rootStore.dispatch("getShipment");
  await rootStore.dispatch("getIncoterms");
  await rootStore.dispatch("_getDocumentsPais");
  await rootStore.dispatch("_getProveedor");
  rootStore.state.spinner = false;
  await securitysStore.ObtenerDatosConfig();
});

async function guardarDatosEmpresa() {
  rootStore.state.dialogProcessing = true;
  await configEmpresaStore.actualizarDatoEmpresa();
  rootStore.state.dialogProcessing = false;
  editarProveedor.value = true;
  e1.value = 2;
}
function continuarStepClientes() {
  editarCliente.value = true;
  e1.value = 3;
}
function continuarStepConfigurarTarifario() {
  editarConfig.value = true;
  e1.value = 4;
}
function omitirStep() {
  switch (e1.value) {
    case 1:
      editarProveedor.value = true;
      break;
    case 2:
      editarCliente.value = true;
      break;
    case 3:
      editarConfig.value = true;
      break;
    case 4:
      editarConfig.value = true;
      break;

    default:
      editarConfig.value = true;
      break;
  }
  e1.value++;
}
function regresarStep() {
  e1.value--;
}
</script>

<template>
  <div class="">
    <v-container
      fluid
      class="pt-0 mt-0 pb-0 altContainer"
      style="height: 120vh"
      v-if="!dialog"
    >
      <v-stepper
        alt-labels
        v-model="e1"
      >
        <v-stepper-header>
          <v-stepper-item
            :value="1"
            :complete="e1 > 1"
            :editable="editarEmpresa"
            title="CONFIGURA TU EMPRESA"
          />

          <v-divider />

          <v-stepper-item
            :value="2"
            :complete="e1 > 2"
            :editable="editarProveedor"
            title="CONFIGURACIÓN PROVEEDORES"
          />

          <v-divider />

          <v-stepper-item
            :value="3"
            :complete="e1 > 3"
            :editable="editarCliente"
            title="CONFIGURACIÓN CLIENTES"
          />
          <v-divider />

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
              @guardar-datos-empresa="guardarDatosEmpresa()"
              @omitir="omitirStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="2">
            <ConfiguracionCargaProveedorComponent
              v-if="e1 == 2"
              @continuar-clientes="continuarStepClientes()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="3">
            <ConfiguracionCargaClienteComponent
              v-if="e1 == 3"
              @continuar-configurar-tarifario="continuarStepConfigurarTarifario()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
          <v-stepper-window-item :value="4">
            <!-- @vue-expect-error Kept: the view has never defined finalizar, and the component never emits it -->
            <ConfiguracionCostosComponent
              v-if="e1 == 4"
              @finalizar="finalizar()"
              @omitir="omitirStep()"
              @regresar="regresarStep()"
            />
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
      <v-row
        class="btn-actions py-5"
        v-if="!dialog"
      >
        <v-col
          cols="1"
          class="mt-info mt-5"
        >
          <BotonChateaConNosotros />
        </v-col>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialog"
      scrollable
      fullscreen
      persistent
    >
      <v-card>
        <v-row class="fill-height align-center justify-center">
          <v-col
            cols="12"
            md="8"
          >
            <div style="text-align: center; padding: auto">
              <h1
                class="my-3"
                style="font-weight: normal"
              >
                Hola, queremos conocer tu negocio.
              </h1>
              <p class="my-3">
                Te llevará menos de 2 minutos
              </p>
              <v-btn
                color="info"
                class="my-3"
                @click="dialog = !dialog"
              >
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
