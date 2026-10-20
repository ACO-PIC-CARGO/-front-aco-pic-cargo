<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import SeccionCliente from "./SeccionCliente.vue";
import SeccionTelefonos from "./SeccionTelefonos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
import SeccionShippers from "./SeccionShippers.vue";
import SeccionInformacionEntrega from "./SeccionInformacionEntrega.vue";
import { useCoinsStore } from "@/stores/coins";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { DocumentoPais } from "@/types/catalogos";
import type { TipoTransaccion } from "@/types/entidades";
import { useBankStore } from "@/stores/bank";

withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });
const emit = defineEmits<{ btnGuardar: [value: boolean] }>();

const route = useRoute();
const appStore = useAppStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

watch(
  () => entitiesStore.stepper,
  (newStep) => {
    if (newStep == 6) {
      emit("btnGuardar", true);
    }
    if (route.name == "nuevoClientes" && newStep === 6) {
      entitiesStore.showBtnSaveFlag = true;
    } else {
      entitiesStore.showBtnSaveFlag = false;
    }
  },
  { immediate: true },
);

entitiesStore.lstProveedores_x_nombre = [];
entitiesStore.lstProveedores_x_documento = [];

/* CÓDIGO NUEVO */
function getIDTipoTelefono(criterio = "") {
  let id = null;

  const tipoTelefonoData =
    masterusuariosStore.lstTipoTelefono.find(
      (v) => (v as TipoTransaccion).descripcion!.toUpperCase() == criterio.toUpperCase()
    );
  if (tipoTelefonoData) {
    id = tipoTelefonoData.id;
  }

  return id;
}
function getIDTipoPersona(criterio = "") {
  let id = null;

  const tipoPersonaData =
    masterusuariosStore.lstTipoPersona.find(
      (v) => v.descripcion!.toUpperCase() == criterio.toUpperCase()
    );
  if (tipoPersonaData) {
    id = tipoPersonaData.id;
  }

  return id;
}
function getIDTipoDocumento(criterio = "") {
  let id = null;

  const tipoDocumentoData = (appStore.itemsDocumentsPais as DocumentoPais[]).find(
    (v) => v.name.toUpperCase() == criterio.toUpperCase()
  );
  if (tipoDocumentoData) {
    id = tipoDocumentoData.id;
  }

  return id;
}

onMounted(async () => {
  appStore.spiner = true;
  //this.$refs.formProveedor.reset();
  await Promise.all([
    appStore._getDocumentsPais(),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    appStore._getPais(),
    masterusuariosStore.cargarMasterDetalleTipoTransaccion(),
    masterusuariosStore.cargarTipoTelefono(),
    appStore._getRole(),
    coinsStore.getCoinsListCargar(),
    bankStore.getBanksListCargar(),
    appStore._getSex(),
    masterusuariosStore.cargarTipoPersona(),
    appStore._getProveedorRolShipper(),
  ]);
  entitiesStore.stepper = 1;
  entitiesStore.isEdit = false;
  entitiesStore.isReadonly = false;
  entitiesStore.showBtnSaveFlag = false;

  entitiesStore.cliente.nombrecompleto = "";
  entitiesStore.cliente.id_tipotransaccion = "56";
  entitiesStore.cliente.nro_documento = "";
  entitiesStore.cliente.id_pais = null;
  entitiesStore.cliente.id_ciudad = 0;
  entitiesStore.cliente.direccion = "";
  entitiesStore.cliente.emailaddress = "";
  entitiesStore.cliente.notas = "";
  entitiesStore.cliente.convenioActual = {
    dias_credito: 0,
    fecha: "",
    email_soporte: "",
    id_path: "",
  };
  entitiesStore.cliente.telefonoActual = {
    id_tipotelefono: "",
    telefono: "",
  };
  entitiesStore.cliente.contactoActual = {
    nombre: "",
    id_tipotelefono: "",
    telefono: "",
  };

  entitiesStore.lstTelefonos = [];
  entitiesStore.lstContactos = [];
  entitiesStore.lstConvenios = [];
  entitiesStore.lstTarifas = [];
  entitiesStore.lstInformacionBancaria = [];
  entitiesStore.lstShippers = [];
  entitiesStore.informacionEntrega = { status: true };

  const tipoPersona = getIDTipoPersona("PERSONA NATURAL");
  entitiesStore.cliente.id_tipopersona = tipoPersona;

  const tipoDocumento = getIDTipoDocumento("DNI");
  entitiesStore.cliente.id_tipodocumento = tipoDocumento;

  const tipoTelefono = getIDTipoTelefono("WHATSAPP");
  entitiesStore.cliente.telefonoActual.id_tipotelefono =
    tipoTelefono;
  entitiesStore.cliente.contactoActual.id_tipotelefono =
    tipoTelefono;
  appStore.spiner = false;
});
</script>

<template>
  <div>
    <v-overlay
      :model-value="appStore.spiner"
      class="align-center justify-center"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col
          class="text-body-large text-center"
          cols="12"
        >
          Cargando Datos, espere un momento por favor...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          />
        </v-col>
      </v-row>
    </v-overlay>
    <v-stepper
      v-model="entitiesStore.stepper"
      non-linear
    >
      <v-stepper-header>
        <v-stepper-item
          :complete="entitiesStore.stepper > 1"
          editable
          :value="1"
          title="Datos del Cliente"
        />

        <v-divider />

        <v-stepper-item
          :complete="entitiesStore.stepper > 2"
          :editable="entitiesStore.stepper > 2"
          :value="2"
          title="Teléfonos y Contactos"
        />

        <v-divider />

        <v-stepper-item
          :complete="entitiesStore.stepper > 3"
          :editable="entitiesStore.stepper > 3"
          :value="3"
          title="Convenios y Tarifas"
        />

        <v-divider />

        <v-stepper-item
          :complete="entitiesStore.stepper > 4"
          :editable="entitiesStore.stepper > 4"
          :value="4"
          title="Información Bancaria"
        />

        <v-divider />

        <v-stepper-item
          :complete="entitiesStore.stepper > 5"
          :editable="entitiesStore.stepper > 5"
          :value="5"
          title="Shipper"
        />

        <v-divider />

        <v-stepper-item
          :value="6"
          title="Destinatario"
        />
      </v-stepper-header>

      <v-stepper-window>
        <!--DATOS DEL CLIENTE-->
        <v-stepper-window-item
          :value="1"
          eager
        >
          <SeccionCliente :is-pricing="isPricing" />
        </v-stepper-window-item>

        <!--TELÉFONOS-->
        <v-stepper-window-item
          :value="2"
          eager
        >
          <SeccionTelefonos />
        </v-stepper-window-item>

        <!--CONVENIOS Y TARIFAS-->
        <v-stepper-window-item
          :value="3"
          eager
        >
          <SeccionConvenios />
        </v-stepper-window-item>

        <!--INFORMACIÓN BANCARIA-->
        <v-stepper-window-item
          :value="4"
          eager
        >
          <SeccionInformacionBancaria />
        </v-stepper-window-item>

        <!--SHIPPER-->
        <v-stepper-window-item
          :value="5"
          eager
        >
          <SeccionShippers />
        </v-stepper-window-item>

        <!--INFORMACIÓN DE ENTREGA-->
        <v-stepper-window-item
          :value="6"
          eager
        >
          <SeccionInformacionEntrega />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </div>
</template>

<style>
.row + .row {
  margin-top: 0;
}
</style>
