<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "vuex";
// @ts-expect-error lodash ships no type declarations
import _ from "lodash";
import ModelCostos from "./ModelCostos.vue";
import { useConfiguracionStore } from "@/stores/configuracion";
import { useIncotermStore } from "@/stores/incoterm";
import { usePricingStore } from "@/stores/pricing";
import { useProveedorStore } from "@/stores/proveedor";
import type { Modalidad } from "@/types/catalogos";
import type { TipoCarga } from "@/types/cotizacion";

const rootStore = useStore();

const pricingStore = usePricingStore();
const incotermStore = useIncotermStore();
const proveedorStore = useProveedorStore();
const configuracionStore = useConfiguracionStore();
const { lstCostos, lstIncoterms } = storeToRefs(configuracionStore);

const loading = ref(false);
const cargandoTabla = ref(false);
const incoterms = ref("");
const modality = ref<Partial<Modalidad> | undefined>({});
const shipment = ref<Partial<TipoCarga> | undefined>({});
const dialog = ref(false);
const editarflag = ref(false);
const headersIcoterms = [
  { key: "name", title: "Incoterms", width: "40%" },
  { key: "updated_config", title: "Ult. Fecha Modif", width: "40%" },
  { key: "action", title: "", width: "20%" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const headers = [
  // { value: "incoterms", text: "Inc.", width: "5%" },
  // { key: "id_proveedor", text: "id_proveedor" },
  { key: "proveedor", title: "Proveedor", width: "25%" },
  // { key: "id_costo", text: "id_costo" },
  // { value: "id_multiplicador", text: "id_multiplicador" },
  { key: "multiplicador", title: "Multiplicador", width: "25%" },
  { key: "costo", title: "Costo", width: "30%" },
  { key: "precio", title: "Precio", width: "10%" },
  { key: "status", title: "Status", width: "5%" },
];
const id_modality = ref<number | "">("");
const id_shipment = ref<number | "">("");
const id_incoterms = ref<number | string>("");
const mostrarListadoIncoterms = ref(false);
const frmBuscar = useTemplateRef("frmBuscar");

onMounted(async () => {
  await Promise.all([
    pricingStore.getModality(),
    pricingStore.getShipment(),
    incotermStore.CargarIncotermsConfig(),
  ]);
});

async function cargarDatos() {
  configuracionStore.lstCostos = [];
  pricingStore.datosPrincipales.idsentido = id_modality.value;
  pricingStore.datosPrincipales.idtipocarga = id_shipment.value;
  const data = {
    id_modality: id_modality.value,
    id_shipment: id_shipment.value,
    id_incoterms: id_incoterms.value,
  };
  await Promise.all([
    configuracionStore.getCargarCostos(data),
    configuracionStore.getMultiplicadorConfigCosto(id_shipment.value),
    pricingStore.getTipoCostos(),
    configuracionStore.obtenerServicioPricingConfig({
      id_modality: id_modality.value,
      id_shipment: id_shipment.value,
      id_incoterms: id_incoterms.value,
    }),
  ]);

  const IdProveedor = lstCostos.value.map((v) => {
    return v.id_proveedor;
  });

  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: null,
  });
}
async function abrirModal(id: number | string, incotermsName: string) {
  if (!(await frmBuscar.value!.validate()).valid) {
    return;
  }
  loading.value = true;
  id_incoterms.value = id;
  modality.value = pricingStore.listModality.find(
    (v: Modalidad) => v.id == id_modality.value,
  );
  shipment.value = pricingStore.listShipment.find(
    (v: TipoCarga) => v.id == id_shipment.value,
  );
  incoterms.value = incotermsName;

  await cargarDatos();
  dialog.value = true;
  loading.value = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recargarProveedores: (e: string | null) => void = _.debounce(async (e: string | null) => {
  if (!e) return; // No buscar si el input está vacío

  const IdProveedor = lstCostos.value.map((v) => v.id_proveedor);
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: e,
  });
}, 100);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function limpiar() {
  frmBuscar.value!.reset();
  configuracionStore.lstCostos = [];
  editarflag.value = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function guardar() {
  await configuracionStore.setGuardarCostos({
    lstCostos: lstCostos.value,
    id_incoterms: id_incoterms.value,
  });
  incotermStore.CargarIncotermsConfig();
  dialog.value = false;
}
async function obtenerDatos() {
  cargandoTabla.value = true;
  rootStore.state.spiner = true;
  mostrarListadoIncoterms.value = false;
  await configuracionStore.ObtenerIncotermsConfigCostos({
    id_modality: id_modality.value,
    id_shipment: id_shipment.value,
  });
  rootStore.state.spiner = false;
}

// mostrarListadoIncoterms() {
//   return !!this.id_modality && !!this.id_shipment;
// },

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listadoIncoterms = computed(() => {
  let name: string[] = [];
  if (id_modality.value == 1) {
    name = ["CIF", "FOB", "FCA", "EXW", "CFR"];
  }
  if (id_modality.value == 2) {
    name = ["DDP", "FOB", "FCA", "CIF", "CFR"];
  }

  return incotermStore.list.filter((v) => {
    return name.includes(v.name!);
  });
});

watch(id_modality, () => {
  configuracionStore.lstIncoterms = [];
});
watch(id_shipment, () => {
  configuracionStore.lstIncoterms = [];
});
</script>

<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-form ref="frmBuscar">
            <v-row>
              <v-col
                cols="12"
                md="2"
              >
                <v-autocomplete
                  :items="pricingStore.listModality"
                  label="Modalidad"
                  variant="outlined"
                  density="compact"
                  item-title="name"
                  item-value="id"
                  v-model="id_modality"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="2"
              >
                <v-autocomplete
                  :items="pricingStore.listShipment"
                  label="Tipo Mercancía"
                  variant="outlined"
                  density="compact"
                  item-title="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="2"
              >
                <v-btn
                  color="success"
                  @click="obtenerDatos()"
                  :disabled="!id_modality || !id_shipment"
                >
                  Obtener Datos
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-col>

        <v-col cols="12">
          <v-data-table
            :headers="headersIcoterms"
            :items="lstIncoterms"
          >
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                color="#E65100"
                @click="abrirModal(item.id!, item.name!)"
                icon
                :loading="loading"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-data-table>
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
        <ModelCostos
          v-if="dialog"
          :modality="
            id_modality
              ? pricingStore.listModality.find(
                (v: Modalidad) => v.id == id_modality,
              )!.name
              : ''
          "
          :shipment="
            id_shipment
              ? pricingStore.listShipment.find(
                (v: TipoCarga) => v.id == id_shipment,
              )!.embarque
              : ''
          "
          :incoterms="incoterms"
          :id-modality="id_modality"
          :id-shipment="id_shipment"
          :id-incoterms="id_incoterms"
          @cerrar-modal="dialog = false"
          @cerrar-modal-guardar="obtenerDatos(), (dialog = false)"
          @recargar-costos="cargarDatos()"
        />
      </v-card>
      <!-- <v-card>
        <v-card-title style="background: #b3e5fc">
          {{ modality.name }} | {{ shipment.embarque }} | {{ incoterms }}
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headers"
            :items="lstCostos"
           :loading="cargandoTabla"
            dense
            disable-pagination
            ref="tblIncoterms"
            loading-text="Cargando datos... por favor espere"
            
          >
            <template v-slot:[`item.multiplicador`]="{ item }">
              <v-autocomplete
                :items="lstMultiplicador"
                item-value="id"
                item-text="name"
                v-model="item.id_multiplicador"
                outlined
                dense
                hide-details
              ></v-autocomplete>
            </template>
            <template v-slot:[`item.costo`]="{ item }">
              <v-text-field
                dense
                v-model="item.costo"
                outlined
                hide-details
              ></v-text-field>
            </template>
            <template v-slot:[`item.precio`]="{ item }">
              <v-text-field
                dense
                v-model="item.precio"
                type="number"
                step="0.01"
                outlined
                hide-details
              ></v-text-field>
            </template>
            <template v-slot:[`item.status`]="{ item }">
              <v-switch
                v-model="item.status"
                :true-value="1"
                :false-value="0"
              ></v-switch>
            </template>
            <template v-slot:[`item.proveedor`]="{ item }">
              <v-autocomplete
                dense
                item-text="namelong"
                item-value="id"
                :items="$store.state.proveedor.lstProveedores"
                @update:search="recargarProveedores"
                v-model="item.id_proveedor"
                hide-details
                outlined
              ></v-autocomplete>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions class="align-self-end">
          <v-btn color="success" @click="guardar">Actualizar</v-btn>
          <v-btn color="error" @click="dialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card> -->
    </v-dialog>
  </v-card>
</template>

<style></style>
