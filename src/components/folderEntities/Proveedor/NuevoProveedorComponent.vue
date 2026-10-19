<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import SeccionProveedor from "./SeccionProveedor.vue";
import SeccionTelefonos from "./SeccionTelefonos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
import SeccionEmailTarifa from "./SeccionEmailTarifaComponent.vue";
import { useCoinsStore } from "@/stores/coins";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { DocumentoPais } from "@/types/catalogos";
import type { TipoTransaccion } from "@/types/entidades";

withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });
const emit = defineEmits<{ GuardarProveedorExiste: [val: number] }>();

const route = useRoute();
const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

watch(
  () => entitiesStore.stepper,
  (newStep) => {
    if (route.name == "nuevoProveedor" && newStep === 5) {
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
      (v) => (v as TipoTransaccion).descripcion!.toUpperCase() == criterio.toUpperCase(),
    );
  if (tipoTelefonoData) {
    id = tipoTelefonoData.id;
  }

  return id;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getIDTipoPersona(criterio = "") {
  let id = null;

  const tipoPersonaData =
    masterusuariosStore.lstTipoPersona.find(
      (v) => v.descripcion!.toUpperCase() == criterio.toUpperCase(),
    );
  if (tipoPersonaData) {
    id = tipoPersonaData.id;
  }

  return id;
}
function getIDTipoDocumento(criterio = "") {
  let id = null;

  const tipoDocumentoData = (rootStore.state.itemsDocumentsPais as DocumentoPais[]).find(
    (v) => v.name.toUpperCase() == criterio.toUpperCase(),
  );
  if (tipoDocumentoData) {
    id = tipoDocumentoData.id;
  }

  return id;
}
function guardarProveedor(val: number) {
  emit("GuardarProveedorExiste", val);
}

onMounted(async () => {
  // console.log("isPricing", this.isPricing);
  rootStore.state.spiner = true;
  //this.$refs.formProveedor.reset();
  await Promise.all([
    rootStore.dispatch("_getDocumentsPais"),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    rootStore.dispatch("_getPais"),
    masterusuariosStore.cargarMasterDetalleTipoTransaccion(),
    masterusuariosStore.cargarTipoTelefono(),
    rootStore.dispatch("_getRole"),
    coinsStore.getCoinsListCargar(),
    rootStore.dispatch("getBanksListCargar"),
    rootStore.dispatch("_getSex"),
    masterusuariosStore.cargarTipoPersona(),
    rootStore.dispatch("_getProveedorRolShipper"),
  ]);

  entitiesStore.stepper = 1;
  entitiesStore.isEdit = false;
  entitiesStore.isReadonly = false;
  entitiesStore.showBtnSaveFlag = false;

  entitiesStore.proveedor.nombrecompleto = "";
  entitiesStore.proveedor.id_tipoproveedor = "";
  entitiesStore.proveedor.id_tipotransaccion = "56";
  entitiesStore.proveedor.nro_documento = "";
  entitiesStore.proveedor.id_pais = null;
  entitiesStore.proveedor.id_ciudad = 0;
  entitiesStore.proveedor.direccion = "";
  entitiesStore.proveedor.emailaddress = "";
  entitiesStore.proveedor.producto = "";
  entitiesStore.proveedor.dias_sobreestadia = 0;
  entitiesStore.proveedor.dias_almacenaje = 0;
  entitiesStore.proveedor.notas = "";
  entitiesStore.proveedor.convenioActual = {
    dias_credito: 0,
    fecha: "",
    email_soporte: "",
    id_path: "",
  };
  entitiesStore.proveedor.telefonoActual = {
    id_tipotelefono: "",
    telefono: "",
  };
  entitiesStore.proveedor.contactoActual = {
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

  const tipoDocumento = getIDTipoDocumento("RUC");
  entitiesStore.proveedor.id_tipodocumento = tipoDocumento;

  const tipoTelefono = getIDTipoTelefono("WHATSAPP");
  entitiesStore.proveedor.telefonoActual.id_tipotelefono =
    tipoTelefono;
  entitiesStore.proveedor.contactoActual.id_tipotelefono =
    tipoTelefono;
  rootStore.state.spiner = false;
});
</script>

<template>
  <div>
    <v-overlay
      :model-value="rootStore.state.spiner"
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
          title="Datos del Proveedor"
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
          title="Correo para Pedir Tarifa"
        />
      </v-stepper-header>

      <v-stepper-window>
        <!--DATOS DEL PROVEEDOR-->
        <v-stepper-window-item
          :value="1"
          eager
        >
          <SeccionProveedor
            :is-pricing="isPricing"
            @obtener-proveedor="guardarProveedor"
          />
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

        <!--Sección Tarifas-->
        <v-stepper-window-item
          :value="5"
          eager
        >
          <SeccionEmailTarifa :guardar-flag="false" />
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
