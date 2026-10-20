<script setup lang="ts">
import { onMounted, ref } from "vue";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import type { ApiResponse } from "@/types/api";
import type { EncabezadoTabla, FacturaListado } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

const enterprisesStore = useEnterprisesStore();

const search = ref("");
const lstFac = ref<FacturaListado[]>([]);
const headers = ref<EncabezadoTabla[]>([
  {
    title: "Correlativo",
    key: "correlativo",
    align: "start",
    sortable: false,
  },

  {
    title: "Expediente",
    key: "nro_master",
    align: "start",
    sortable: true,
  },
  { title: "Cliente", key: "cliente", align: "start", sortable: true },
  {
    title: "Origen",
    key: "pais_origen",
    align: "start",
    sortable: true,
  },
  {
    title: "Destino",
    key: "pais_destino",
    align: "start",
    sortable: true,
  },

  {
    title: "Shipment",
    key: "shipment",
    align: "start",
    sortable: true,
  },
  {
    title: "Moneda",
    key: "symbol",
    align: "start",
    sortable: true,
  },
  {
    title: "Monto",
    key: "total_monto",
    align: "start",
    sortable: false,
  },
  {
    title: "IGV",
    key: "total_igv",
    align: "start",
    sortable: false,
  },
  { title: "Total", key: "total", align: "start", sortable: false },
  { title: "Estado", key: "estado", align: "start", sortable: false },
  {
    title: "Tiene Fac. Fiscal",
    key: "existe_fiscal",
    align: "center",
    sortable: false,
  },
  { title: "Acciones", key: "url", align: "start", sortable: false },
]);

onMounted(async () => {
  await listadoFacturacion();
  await enterprisesStore.obtenerImpuestoXEmpresa();
  headers.value[8]!.title =
    enterprisesStore.impuesto.nombre_impuesto!;
});

async function listadoFacturacion() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      "listar_Factura/" +
      sessionBranchId(),

    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios<ApiResponse<FacturaListado[]>>(config).then((response) => {
    lstFac.value = response.data.data;
  });
}

function verFactura(url: string) {
  window.open(url);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function filterOnlyCapsText(value: unknown, search: string | null) {
  const text = search ? search.toLocaleUpperCase() : null;
  return (
    value != null &&
    search != null &&
    typeof value === "string" &&
    value.toString().toLocaleUpperCase().indexOf(text!) !== -1
  );
}

async function eliminar(data: FacturaListado) {
  Swal.fire({
    icon: "question",
    title: "ADVERTENCIA",
    html: `Deseas <b>ANULAR</b> el correlativo con número <b>${data.correlativo}</b> perteneciente al cliente <b> ${data.cliente} </b>`,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: "Eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      const datos = {
        id: data.id,
      };
      const config = {
        method: "put",
        url: import.meta.env.VITE_URL_MAIN + "anular_factura",

        headers: {
          "Content-Type": "application/json",
        },
        data: datos,
      };
      axios(config).then(() => {
        Swal.fire("Deleted!", "Factura Anulada.", "success");
        listadoFacturacion();
      });
    }
  });
}
</script>

<template>
  <div class="">
    <v-data-table
      :headers="headers"
      :items="lstFac"
      item-value="id"
      :search="search"
    >
      <template #top>
        <v-text-field
          v-model="search"
          label="Buscar...."
          class="mx-4"
        />
      </template>
      <template #[`item.existe_fiscal`]="{ item }">
        <v-chip
          v-if="item.existe_fiscal"
          class="ma-2 text-white"
          color="green"
          variant="flat"
        >
          Si
        </v-chip>

        <v-chip
          v-else
          class="ma-2 text-white"
          color="red"
          variant="flat"
        >
          No
        </v-chip>
      </template>
      <template #[`item.url`]="{ item }">
        <v-btn
          variant="text"
          color="red"
          @click="verFactura(item.url)"
          icon
        >
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-btn>
        <v-btn
          variant="text"
          color="red"
          @click="eliminar(item)"
          icon
          v-if="item.estatus == 1"
        >
          <v-icon>mdi-cancel</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<style></style>
