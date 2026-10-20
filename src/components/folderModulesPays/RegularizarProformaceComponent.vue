<script setup lang="ts">
import { onMounted, ref } from "vue";
import axios from "@/api/http";
import controlAccountPaysCom from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";
import type { ProformaPorRegularizar } from "@/types/modulesPays";

const itemsPro = ref<ProformaPorRegularizar[]>([]);
const dialogReplace = ref(false);
const headersPro = [
  {
    title: "Expediente",
    key: "nro_master",
  },
  {
    title: "Proveedor",
    key: "nameconsigner",
  },
  {
    title: "Fecha",
    key: "date_letra",
  },
  /* {
    text: "Nro. Serie",
    value: "number",
  }, */
  {
    title: "Moneda",
    key: "namecoins",
  },

  {
    title: "Monto",
    key: "total",
  },
  {
    title: "Fecha de Pago",
    key: "fecha_pago",
  },
  {
    title: "Soporte de Pago",
    key: "soporte_pago",
  },
  {
    title: "Ver Proformace",
    key: "vpro",
  },
  {
    title: "Acción",
    key: "action",
  },
];
const exp = ref<string | number>("");
const pro = ref<string | number>("");
const id_pro = ref<string | number>("");

function _seePro(path: string) {
  window.open(path, "_blank");
}
function _setReplace(proId: number, expId: number, prov: number) {
  pro.value = proId;
  exp.value = expId;
  id_pro.value = prov;
  dialogReplace.value = true;
}
async function _getRegularizar() {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getRegularizar",

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      //vm.dialogListInvoince = true;
      
      itemsPro.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

onMounted(() => {
  _getRegularizar();
});
</script>

<template>
  <div>
    <v-dialog
      max-width="800"
      v-model="dialogReplace"
    >
      <v-card elevation="0">
        <v-card-title> Regularizar Proformace </v-card-title>
        <v-card-text>
          <controlAccountPaysCom
            operativa="1"
            :exp="exp"
            :pro="pro"
            :id_pro="id_pro"
            tipo="nuevo"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-data-table
      :headers="headersPro"
      :items="itemsPro"
    >
      <template #[`item.action`]="{ item }">
        <v-icon
          class="btn_add mr-2"
          size="large"
          color="blue"
          @click="_setReplace(item.id, item.id_house, item.id_pro)"
        >
          mdi-file-replace
        </v-icon>
      </template>

      <template #[`item.vpro`]="{ item }">
        <v-icon
          class="btn_add mr-2"
          size="large"
          color="grey"
          @click="_seePro(item.path)"
        >
          mdi-eye
        </v-icon>
      </template>
    </v-data-table>
  </div>
</template>


