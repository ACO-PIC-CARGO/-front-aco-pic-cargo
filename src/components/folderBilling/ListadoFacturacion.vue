<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import type { EncabezadoTabla, FacturaListado } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";
import { hasFailed, request } from "@/utils/request";
import { usePermissions } from "@/composables/usePermissions";

const enterprisesStore = useEnterprisesStore();
const { can } = usePermissions();

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
  { title: "Acciones", key: "url", align: "start", sortable: false, nowrap: true },
]);

onMounted(async () => {
  await listadoFacturacion();
  await enterprisesStore.obtenerImpuestoXEmpresa();
  headers.value[8]!.title =
    enterprisesStore.impuesto.nombre_impuesto!;
});

async function listadoFacturacion() {
  const response = await request<FacturaListado>({ method: "get", url: import.meta.env.VITE_URL_MAIN + "listar_Factura/" + sessionBranchId() });
  if (hasFailed(response)) Swal.fire({ icon: "error", text: response.mensaje });
  lstFac.value = response.estadoflag ? response.data : [];
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

async function anular(data: FacturaListado) {
  const { value: motivo } = await Swal.fire({
    icon: "question",
    title: "Anular factura",
    html: `Vas a anular la factura <b>${data.correlativo}</b> del cliente <b>${data.cliente}</b>. Escribe el motivo.`,
    input: "textarea",
    inputPlaceholder: "Por ejemplo: datos del cliente errados",
    showCancelButton: true,
    confirmButtonText: "Anular factura",
    cancelButtonText: "Cancelar",
    inputValidator: (text) => (text.trim() ? null : "Escribe el motivo de la anulación."),
  });
  if (!motivo) return;

  const response = await request({ method: "put", url: import.meta.env.VITE_URL_MAIN + "anular_factura", data: { id: data.id, motivo } });
  if (!response.estadoflag) {
    Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje });
    return;
  }
  Swal.fire({ icon: "success", title: "Factura anulada", text: response.mensaje });
  await listadoFacturacion();
}

function verMotivoAnulacion(data: FacturaListado) {
  Swal.fire({ icon: "info", title: `Motivo de anulación de la factura ${data.correlativo}`, text: data.motivo_anulacion! });
}
</script>

<template>
  <div class="">
    <v-data-table
      :headers="headers"
      :items="lstFac"
      item-value="id"
      :search="search"
      no-data-text="Aún no hay facturas emitidas. Emítelas desde el control de gastos de un master."
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

          density="comfortable"
        >
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-btn>
        <v-btn
          variant="text"
          color="red"
          @click="anular(item)"
          icon

          density="comfortable"
          aria-label="Anular factura"
          title="Anular factura"
          v-if="item.estatus == 1 && can('lstFacturacion', 'ELIMINAR')"
        >
          <v-icon>mdi-cancel</v-icon>
        </v-btn>
        <v-btn
          v-if="item.motivo_anulacion"
          variant="text"
          color="grey-darken-1"
          icon
          density="comfortable"
          aria-label="Ver motivo de anulación"
          title="Ver motivo de anulación"
          @click="verMotivoAnulacion(item)"
        >
          <v-icon>mdi-comment-text-outline</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<style></style>
