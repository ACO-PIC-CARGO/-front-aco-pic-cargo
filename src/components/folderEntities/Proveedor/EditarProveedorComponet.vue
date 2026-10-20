<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
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
import { useBankStore } from "@/stores/bank";

const appStore = useAppStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

entitiesStore.lstProveedores_x_nombre = [];
entitiesStore.lstProveedores_x_documento = [];

/* CÓDIGO NUEVO */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getIDTipoDocumento(criterio = "") {
  let id = null;

  const tipoDocumentoData = (appStore.itemsDocumentsPais as DocumentoPais[]).find(
    (v) => v.name.toUpperCase() == criterio.toUpperCase(),
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
    entitiesStore.getVerProveedor(),
  ]);
  appStore._getState(entitiesStore.proveedor.id_pais);
  appStore.spiner = false;

  entitiesStore.stepper = 1;
  entitiesStore.isEdit = true;
  entitiesStore.isReadonly = false;
  entitiesStore.showBtnSaveFlag = true;

  appStore.mainTitle = `MODIFICAR PROVEEDOR: PROV - ${entitiesStore.proveedor.correlativo}`;
});
</script>

<template>
  <v-container fluid>
    <v-stepper
      v-model="entitiesStore.stepper"
      non-linear
    >
      <v-stepper-header>
        <v-stepper-item
          editable
          :value="1"
          title="Datos del Proveedor"
          :rules="[() => entitiesStore.isStep1Valid]"
        />

        <v-divider />

        <v-stepper-item
          editable
          :value="2"
          title="Teléfonos y Contactos"
          :rules="[() => entitiesStore.isStep2Valid]"
        />

        <v-divider />

        <v-stepper-item
          editable
          :value="3"
          title="Convenios y Tarifas"
          :rules="[() => entitiesStore.isStep3Valid]"
        />

        <v-divider />

        <v-stepper-item
          editable
          :value="4"
          title="Información Bancaria"
          :rules="[() => entitiesStore.isStep4Valid]"
        />

        <v-divider />
        <v-stepper-item
          editable
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
          <SeccionProveedor />
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
        <v-stepper-window-item
          :value="5"
          eager
        >
          <SeccionEmailTarifa />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-container>
</template>

<style>
.row + .row {
  margin-top: 0;
}
</style>
