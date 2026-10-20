<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import modalListHouse from "@/components/modal/ModalListFile.vue";
import GuardarUrlMaster from "../comun/GuardarUrlMaster.vue";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import type { RegistroConUrlCarpeta } from "@/types/archivos";
import type { MasterListadoControlGasto } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

defineProps<{ statusReport?: boolean }>();

const rootStore = useStore();
const router = useRouter();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();

const dialogUrl = ref(false);
const url_folderonedrive = ref("");
const search = ref("");
const masterEditar = ref<RegistroConUrlCarpeta>({});
const statusDialog = ref(false);

const headers = [
  { title: "Master", key: "code_master" },
  // {
  //   text: "Codigo",
  //   align: "start",
  //   value: "code_control",
  // },

  { title: "Versión", key: "posicion" },
  { title: "Nro MBL", key: "nro_mbl" },
  { title: "Sentido", key: "namemodality" },
  { title: "Embarque", key: "nameshipment" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },

  { title: "Consignatario", key: "nameconsigner" },
  { title: "Fecha Etd", key: "fecha_etd" },
  { title: "Fecha Eta", key: "fecha_eta" },

  { title: "Acciones", key: "actions" },
];

const itemsDataControlList = computed<MasterListadoControlGasto[]>(() => rootStore.state.itemsDataControlList);

onMounted(async () => {
  await Promise.all([
    rootStore.dispatch("_getControlList"),
    pricingStore.getModulesEntities(),
    pricingStore.getQuoteNoAsignadoHouse(),
    masterusuariosStore.cargarMasterDetalleCanal(),
    rootStore.dispatch("_getModality"),
    rootStore.dispatch("_getProveedor"),
    rootStore.dispatch("_getShipment"),
  ]);
});

async function cerrarDialog() {
  dialogUrl.value = false;
  rootStore.state.spiner = true;
  await rootStore.dispatch("_getControlList");
  rootStore.state.spiner = false;
}
function abrirCaperta(item: MasterListadoControlGasto) {
  console.log("item:", item);
  masterEditar.value = { ...item };
  url_folderonedrive.value = "";
  dialogUrl.value = true;
  // window.open(url, "_blank");
}
function editControlGasto(master: MasterListadoControlGasto) {
  if (
    !(
      master.id_branch ==
      sessionBranchId()
    )
  ) {
    Swal.fire({
      icon: "error",
      text: "El expediente pertenece a otra sucursal, por favor logueese con la otra sucursal.",
    });
    return;
  }
  router.push({
    name: "editControlGasto",
    params: {
      id: master.id,
      id_branch: master.id_branch,
    },
  });
}
function verControlGasto(master: MasterListadoControlGasto) {
  router.push({
    name: "verControlGasto",
    params: {
      id: master.id,
      id_branch: master.id_branch,
    },
  });
}
</script>

<template>
  <div>
    <v-card elevation="5">
      <v-card-title class="d-flex align-center flex-wrap">
        <v-btn
          color="primary"
          elevation="0"
          rounded
          class="mb-2 ml-5"
          @click="statusDialog = !statusDialog"
        >
          NUEVO CONTROL
        </v-btn>
        <v-btn
          color="success"
          class="mb-2 ml-5"
          rounded
          @click="rootStore.state.cg_filtrarData = true"
          >Filtar</v-btn
        >
        <v-spacer></v-spacer>

        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-container v-if="!rootStore.state.dataGastos" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando informacíon
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
      </v-container>
      <v-data-table
        v-if="rootStore.state.dataGastos"
        :headers="headers"
        :items="itemsDataControlList"
        :search="search"
      >
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon
            size="large"
            color="blue"
            class="mr-2"
            @click="verControlGasto(item)"
          >
            mdi-eye
          </v-icon>
          <v-icon
            size="large"
            color="#FFD600"
            class="mr-2"
            @click="abrirCaperta(item)"
          >
            mdi-folder
          </v-icon>
          <v-icon
            size="large"
            color="orange"
            class="mr-2"
            @click="editControlGasto(item)"
          >
            mdi-pencil
          </v-icon>
        </template>
      </v-data-table>
      <v-container>
        <v-row>
          <v-col>
            <v-btn v-if="statusReport" color="primary" elevation="0"
              >GENERAR REPORTE</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <modalListHouse v-model:dialog="statusDialog" />
    <GuardarUrlMaster
      :dialogUrl="dialogUrl"
      :masterEditar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </div>
</template>
