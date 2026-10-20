<script setup lang="ts">
import { onMounted } from "vue";
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
import { useBankStore } from "@/stores/bank";

const props = withDefaults(defineProps<{ houseIdConsigner?: number | null }>(), { houseIdConsigner: null });

const appStore = useAppStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

entitiesStore.lstProveedores_x_nombre = [];
entitiesStore.lstProveedores_x_documento = [];

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
    props.houseIdConsigner
      ? entitiesStore.verCliente(props.houseIdConsigner)
      : entitiesStore.verCliente(),
  ]);
  await appStore._getState(entitiesStore.cliente.id_pais);
  await appStore._getCity(entitiesStore.informacionEntrega.id_departamento);
  await appStore._getTown(entitiesStore.informacionEntrega.id_provincia);
  appStore.spiner = false;

  entitiesStore.stepper = 1;
  entitiesStore.isEdit = true;
  entitiesStore.isReadonly = false;
  entitiesStore.showBtnSaveFlag = true;

  appStore.mainTitle = `MODIFICAR CLIENTE: CLI`;
});
</script>

<template>
  <div>
    <v-stepper
      v-model="entitiesStore.stepper"
      non-linear
    >
      <v-stepper-header>
        <v-stepper-item
          editable
          :value="1"
          title="Datos del Cliente"
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
          title="Shipper"
        />

        <v-divider />

        <v-stepper-item
          editable
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
          <SeccionCliente />
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
