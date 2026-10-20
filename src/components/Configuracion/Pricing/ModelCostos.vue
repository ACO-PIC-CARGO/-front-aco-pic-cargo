<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
// @ts-expect-error lodash ships no type declarations
import _ from "lodash";
import Swal from "sweetalert2";
import { useConfiguracionStore } from "@/stores/configuracion";
import { usePricingStore } from "@/stores/pricing";
import { useProveedorStore } from "@/stores/proveedor";
import type { CostoPricing, FormNuevoCostoPricing } from "@/types/configuracion";
import type { TipoCostoConfig } from "@/types/empresas";

const props = withDefaults(
  defineProps<{
    idModality?: number | string | null;
    idShipment?: number | string | null;
    idIncoterms?: number | string | null;
    modality?: string | null;
    shipment?: string | null;
    incoterms?: string | null;
  }>(),
  {
    idModality: null,
    idShipment: null,
    idIncoterms: null,
    modality: null,
    shipment: null,
    incoterms: null,
  },
);
const emit = defineEmits<{ cerrarModal: []; cerrarModalGuardar: []; recargarCostos: [] }>();

const pricingStore = usePricingStore();
const configuracionStore = useConfiguracionStore();
const proveedorStore = useProveedorStore();
const { lstCostos, lstMultiplicador, lstServicios } = storeToRefs(configuracionStore);

const dialog = ref(false);
const loading = ref(false);
const fromDataService = ref<FormNuevoCostoPricing>({ id_multiplicador: 0, minimo: 0 });
const headers = [
  { key: "servicio", title: "Servicio", width: "15%" },
  { key: "proveedor", title: "Proveedor", width: "15%" },
  { key: "multiplicador", title: "Multiplicador", width: "15%" },
  { key: "costo", title: "Costo", width: "15%" },
  { key: "precio", title: "Precio", width: "10%" },
  {
    key: "considerarvalorminimoflag",
    title: "Considerar Valor Mínimo",
    width: "10%",
  },
  { key: "minimo", title: "Valor Mínimo", width: "10%" },
  { key: "status", title: "Activo / Inactivo", width: "5%" },
  { key: "action", title: "", width: "10%" },
];
const frmNuevoCosto = useTemplateRef("frmNuevoCosto");

function copiarCosto(item: CostoPricing) {
  Swal.fire({
    icon: "question",
    title: "Copiar",
    text: `Está seguro que desea copiar el concepto ${item.costo}`,
    confirmButtonText: "Si, copiar",
    showDenyButton: true,
    denyButtonText: "No, Cancelar",
  }).then((res) => {
    if (res.isConfirmed) {
      lstCostos.value.push({
        ...item,
        id: null,
        id_costo: null,
        id_modality: props.idModality,
        id_shipment: props.idShipment,
        id_incoterms: props.idIncoterms,
      });
    }
  });
}
function mostrarMinimo(item: FormNuevoCostoPricing) {
  const codigosEspeciales = [13, 14, 15];

  const multiplicador = lstMultiplicador.value.find(
    (v) => v.id === item.id_multiplicador,
  );

  if (
    multiplicador &&
    codigosEspeciales.includes(Number(multiplicador.code))
  ) {
    return true;
  }

  return false;
}
async function guardar() {
  await configuracionStore.setGuardarCostos({
    lstCostos: lstCostos.value,
    id_incoterms: props.idIncoterms!,
  });
  emit("cerrarModalGuardar");
}
function obtenerCostosEnBaseTipoCosto(codigoTipoCosto: string | undefined) {
  //   if (this.id_modality == 1) {
  if (codigoTipoCosto == "LO")
    return lstCostos.value.filter((v) => v.eslocalflag);
  if (codigoTipoCosto == "AD")
    return lstCostos.value.filter((v) => v.esaduanaflag);
  if (codigoTipoCosto == "AL")
    return lstCostos.value.filter((v) => v.esalmacenflag);
  if (codigoTipoCosto == "FL")
    return lstCostos.value.filter((v) => v.esfleteflag);
  if (codigoTipoCosto == "GT")
    return lstCostos.value.filter((v) => v.esgastostercerosflag);

  return lstCostos.value;
}
function abrirModal(codigoTipoCosto: string | undefined) {
  fromDataService.value.idOpcion = codigoTipoCosto;
  dialog.value = true;
}
const recargarProveedores: (e: string | null) => void = _.debounce(async (e: string | null) => {
  if (!e) return;

  const IdProveedor = lstCostos.value.map((v) => v.id_proveedor);
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: e,
  });
}, 100);
function eliminarRegistro(item: CostoPricing) {
  Swal.fire({
    icon: "warning",
    title: "¿Estás completamente seguro?",
    html: `
      <p style="margin-bottom: 10px;">Esta acción <b>eliminará permanentemente</b> este registro y no se podrá recuperar.</p>
      <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-size: 14px; border: 1px solid #f5c6cb;">
        💡 <b>¿Prefieres no perder la información?</b><br>
        Te recomendamos <b>cambiar el estado a inactivo</b> en lugar de eliminarlo.
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar para siempre",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await configuracionStore.EliminarCosto(item);
      emit("recargarCostos");
    }
  });
}
function quitarRegistro(item: CostoPricing) {
  const index = lstCostos.value.indexOf(item);

  if (index !== -1) {
    lstCostos.value.splice(index, 1);
  }
}
async function guardarCosto() {
  if (!(await frmNuevoCosto.value!.validate()).valid) return;
  const nuevoCosto = { ...fromDataService.value };
  nuevoCosto.esgastostercerosflag = 0;
  nuevoCosto.esfleteflag = 0;
  nuevoCosto.eslocalflag = 0;
  nuevoCosto.esaduanaflag = 0;
  nuevoCosto.esalmacenflag = 0;
  nuevoCosto.status = 1;

  switch (nuevoCosto.idOpcion) {
    case "GT":
      nuevoCosto.esgastostercerosflag = 1;
      break;
    case "FL":
      nuevoCosto.esfleteflag = 1;
      break;
    case "LO":
      nuevoCosto.eslocalflag = 1;
      break;
    case "AD":
      nuevoCosto.esaduanaflag = 1;
      break;
    case "AL":
      nuevoCosto.esalmacenflag = 1;
      break;
  }

  lstCostos.value.push({
    ...nuevoCosto,
    id: null,
    id_costo: null,
    maximo: 0,
    id_modality: props.idModality,
    id_shipment: props.idShipment,
    id_incoterms: props.idIncoterms,
  });

  fromDataService.value = {};
  frmNuevoCosto.value!.resetValidation();
  dialog.value = false;
}

const panelesConDatos = computed(() => {
  const listaTipos = pricingStore.listTipoCostos;
  if (!listaTipos) return [];

  const panelesFiltrados = listaTipos.filter((tipo: TipoCostoConfig) => {
    const costosFiltrados = obtenerCostosEnBaseTipoCosto(tipo.codigo);
    return costosFiltrados && costosFiltrados.length > 0;
  });

  return panelesFiltrados.sort((a: TipoCostoConfig, b: TipoCostoConfig) => {
    const obtenerPeso = (item: TipoCostoConfig) => {
      if (item.name && item.name.startsWith("ORIGEN")) {
        return 1;
      }
      if (item.name && item.name.startsWith("DESTINO")) {
        return 3;
      }
      return 2;
    };

    return obtenerPeso(a) - obtenerPeso(b);
  }) as TipoCostoConfig[];
});
const panelesAbiertos = computed(() => {
  return panelesConDatos.value.map((_, index) => index);
});
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap">
      <h4 class="mx-auto">
        ACTUALIZAR COSTOS -
        {{ modality }} | {{ shipment }} |
        {{ incoterms }}
      </h4>
    </v-card-title>
    <v-expansion-panels
      multiple
      class="px-5 py-2"
      :model-value="panelesAbiertos"
    >
      <!-- Ahora iteramos sobre la propiedad computada filtrada -->
      <v-expansion-panel
        v-for="(panel, index) in panelesConDatos"
        :key="index"
      >
        <v-expansion-panel-title>
          {{ panel.name }}
          <v-btn
            color="success"
            size="small"
            style="max-width: 370px"
            @click.stop="abrirModal(panel.codigo)"
            class="ml-auto"
          >
            Añadir Costo {{ panel.name }}
          </v-btn>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="obtenerCostosEnBaseTipoCosto(panel.codigo)"
            density="compact"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #[`item.servicio`]="{ item }">
              <v-autocomplete
                :items="lstServicios"
                item-value="id"
                item-title="service"
                v-model="item.id_service"
                variant="outlined"
                density="compact"
                hide-details
              />
            </template>
            <template #[`item.multiplicador`]="{ item }">
              <v-autocomplete
                :items="lstMultiplicador"
                item-value="id"
                item-title="name"
                v-model="item.id_multiplicador"
                variant="outlined"
                density="compact"
                hide-details
              />
            </template>
            <template #[`item.costo`]="{ item }">
              <v-text-field
                density="compact"
                v-model="item.costo"
                variant="outlined"
                hide-details
              />
            </template>
            <template #[`item.minimo`]="{ item }">
              <v-text-field
                v-if="item.considerarvalorminimoflag"
                density="compact"
                v-model="item.minimo"
                variant="outlined"
                hide-details
              />
            </template>
            <template #[`item.precio`]="{ item }">
              <v-text-field
                density="compact"
                v-model="item.precio"
                type="number"
                step="0.01"
                variant="outlined"
                hide-details
              />
            </template>
            <template #[`item.status`]="{ item }">
              <v-switch
                v-model="item.status"
                :true-value="1"
                :false-value="0"
              />
            </template>
            <template #[`item.proveedor`]="{ item }">
              <v-autocomplete
                density="compact"
                item-title="namelong"
                item-value="id"
                :items="proveedorStore.lstProveedores"
                v-model="item.id_proveedor"
                @update:search="recargarProveedores"
                hide-details
                variant="outlined"
              />
            </template>
            <template #[`item.considerarvalorminimoflag`]="{ item }">
              <v-switch
                v-model="item.considerarvalorminimoflag"
                :label="`${item.considerarvalorminimoflag ? 'Si' : 'No'}`"
              />
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                color="success"
                icon
                @click="copiarCosto(item)"
                v-if="item.id"
              >
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>

              <v-btn
                variant="text"
                color="red"
                icon
                @click="eliminarRegistro(item)"
                v-if="item.id"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>

              <v-btn
                variant="text"
                color="red"
                icon
                @click="quitarRegistro(item)"
                v-if="!item.id"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>

              <v-chip
                class="ma-2"
                color="green"
                variant="flat"
                v-if="!item.id"
              >
                Nuevo
              </v-chip>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-card-actions>
      <v-btn
        :loading="loading"
        class="ml-auto"
        @click="guardar()"
        color="success"
      >
        Guardar
      </v-btn>
      <v-btn
        :loading="loading"
        color="error"
        @click="emit('cerrarModal')"
      >
        Cancelar
      </v-btn>
    </v-card-actions>
    <!-- Diálogo para agregar nuevo costo -->
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
    >
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title>
            Nuevo Costo
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-autocomplete
                  density="compact"
                  label="Servicio Asociado"
                  item-title="service"
                  item-value="id"
                  :items="lstServicios"
                  v-model="fromDataService.id_service"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-autocomplete
                  density="compact"
                  label="Proveedor"
                  item-title="namelong"
                  item-value="id"
                  :items="proveedorStore.lstProveedores"
                  v-model="fromDataService.id_proveedor"
                  @update:search="recargarProveedores"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-autocomplete
                  density="compact"
                  label="Multiplicador"
                  :items="lstMultiplicador"
                  item-value="id"
                  item-title="name"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-text-field
                  density="compact"
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costo"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-text-field
                  density="compact"
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.precio"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-1 py-1"
              >
                <v-text-field
                  density="compact"
                  label="Valor Mínimo"
                  type="number"
                  min="0"
                  v-if="mostrarMinimo(fromDataService)"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.minimo"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn
              color="success"
              @click="guardarCosto()"
            >
              Aceptar
            </v-btn>
            <v-btn
              color="red"
              @click="dialog = !dialog"
            >
              cancelar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-card>
</template>
