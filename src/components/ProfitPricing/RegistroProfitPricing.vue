<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useProfitPricingStore } from "@/stores/profitPricing";
import { useProveedorStore } from "@/stores/proveedor";
import { usePricingStore } from "@/stores/pricing";
import type { Incoterm, ProfitPricingCosto } from "@/types/cotizacion";
import type { TipoCostoConfig } from "@/types/empresas";

const pricingStore = usePricingStore();
const proveedorStore = useProveedorStore();
const configEmpresaStore = useConfigEmpresaStore();
const profitPricingStore = useProfitPricingStore();
const rootStore = useStore();

const frmDatos = useTemplateRef("frmDatos");
const frmAsignarCosto = ref<{ validate: () => Promise<{ valid: boolean }> }>();

const tab = ref(0);
const loadingGuardar = ref(false);
const headersIncoterms = [
  { key: "text", title: "Icoterms" },
  { key: "action", title: "" },
] as const;
const headers = [
  { key: "proveedor", title: "Proveedor", width: "20%" },
  { key: "multiplicador", title: "Multiplicador", width: "20%" },
  { key: "concepto", title: "Concepto", width: "20%" },
  {
    key: "profitprimeraimportacion",
    title: "Ganancia Primera Importación",
    sortable: false,
    width: "10%",
  },
  {
    key: "profitsegundaimportacion",
    title: "Ganancia Segunda Importación",
    sortable: false,
    width: "10%",
  },
  {
    key: "estado",
    title: "Activo/ Inactivo",
    sortable: false,
    width: "10%",
  },
] as const;
const bloquearBotonAnadirConcepto = ref(true);
const loadingObtenerDatos = ref(false);
const formData = ref<ProfitPricingCosto>({
  id: null,
  profitprimeraimportacion: null,
  profitsegundaimportacion: null,
});
const dialogNuevoProfit = ref(false);
const mostrarIncoterms = ref(false);

const incoterms = computed(() => {
  const Icoterms: Incoterm[] = [];
  [...pricingStore.listIncoterms].forEach((element) => {
    element.text = element.name + " - " + element.description;
    Icoterms.push(element);
  });

  return Icoterms;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarBotonActualizar = computed(() => {
  if (tab.value == 0) {
    return profitPricingStore.lstProfigIndividual!.length > 0;
  }
  if (tab.value == 1) {
    return profitPricingStore.lstProfigGrupal!.length > 0;
  }
  return false;
});
const panelesConDatos = computed(() => {
  const listaTipos = configEmpresaStore.listTipoCostos;
  if (!listaTipos) return [];

  // 1. Primero filtramos para quedarnos solo con los que sí tienen costos
  const panelesFiltrados = listaTipos.filter((tipo) => {
    const costosFiltrados = obtenerCostosEnBaseTipoCosto(tipo.codigo);
    return costosFiltrados && costosFiltrados.length > 0;
  });

  // 2. Ordenamos la lista filtrada basándonos en el prefijo de su "name"
  return panelesFiltrados.sort((a, b) => {
    // Asignamos un "peso" o prioridad a cada item según su nombre
    const obtenerPeso = (item: TipoCostoConfig) => {
      if (item.name && item.name.startsWith("ORIGEN")) {
        return 1; // Prioridad más alta (va al principio)
      }
      if (item.name && item.name.startsWith("DESTINO")) {
        return 3; // Prioridad más baja (va al final)
      }
      return 2; // Cualquiera que no sea ni Origen ni Destino se queda en medio
    };

    return obtenerPeso(a) - obtenerPeso(b);
  });
});

function obtenerCostosEnBaseTipoCosto(codigoTipoCosto?: string) {
  console.log("tab", tab.value);
  let lstCostos: ProfitPricingCosto[] = [];
  if (tab.value == 0) {
    lstCostos = profitPricingStore.lstProfigIndividual!;
  }
  if (tab.value == 1) {
    lstCostos = profitPricingStore.lstProfigGrupal!;
  }
  //   if (this.id_modality == 1) {
  if (codigoTipoCosto == "LO")
    return lstCostos.filter((v) => v.eslocalflag);
  if (codigoTipoCosto == "AD")
    return lstCostos.filter((v) => v.esaduanaflag);
  if (codigoTipoCosto == "AL")
    return lstCostos.filter((v) => v.esalmacenflag);
  if (codigoTipoCosto == "FL")
    return lstCostos.filter((v) => v.esfleteflag);
  if (codigoTipoCosto == "GT")
    return lstCostos.filter((v) => v.esgastostercerosflag);

  return lstCostos;
}
async function abrirModalActualizacionConceptos(id_incoterms: number | string) {
  profitPricingStore.id_incoterms = id_incoterms;
  rootStore.state.spiner = true;
  await cargarDatos().catch((e) => {
    console.error(e);
  });
  rootStore.state.spiner = false;
  dialogNuevoProfit.value = true;
}
async function cargarDatos() {
  if ((await frmDatos.value!.validate()).valid) {
    loadingObtenerDatos.value = true;
    await Promise.all([
      profitPricingStore.getProfitPricing(),
      configEmpresaStore.getTipoCostosConfig({
        id_modality: profitPricingStore.id_modality,
        id_shipment: profitPricingStore.id_shipment,
      }),
      configEmpresaStore.getMultiplicadorConfig({
        id_shipment: profitPricingStore.id_shipment,
      }),
    ]);
    const id = [
      ...profitPricingStore.lstProfigIndividual!.map((v) => {
        return v.id_proveedor;
      }),
    ];
    await proveedorStore.obtenerProveedorPricing({ id: id.join(",") });
    loadingObtenerDatos.value = false;
    bloquearBotonAnadirConcepto.value = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function anadirConcepto() {
  if ((await frmAsignarCosto.value!.validate()).valid) {
    if (tab.value == 0) {
      profitPricingStore.lstProfigIndividual!.unshift({
        ...formData.value,
        concepto:
          profitPricingStore.lstCostosAsignarProfit.find(
            () => formData.value.id,
          )!.concepto as string,
        estado: true,
      });
    }
    if (tab.value == 1) {
      profitPricingStore.lstProfigGrupal!.unshift({
        ...formData.value,
        concepto:
          profitPricingStore.lstCostosAsignarProfit.find(
            () => formData.value.id,
          )!.concepto as string,
        estado: true,
      });
    }
  }
}
async function guardarDatos() {
  loadingGuardar.value = true;
  await profitPricingStore.setProfitPricingCostos().catch((e) => {
    console.error(e);
  });
  dialogNuevoProfit.value = false;
  loadingGuardar.value = false;
}

watch(tab, () => {
  console.log(tab.value);
});
watch(() => profitPricingStore.id_modality, () => {
  mostrarIncoterms.value = false;
  if (
    profitPricingStore.id_shipment &&
    profitPricingStore.id_modality
  ) {
    rootStore.state.spiner = true;
    setTimeout(() => {}, 500);
  }
});
watch(() => profitPricingStore.id_shipment, () => {
  mostrarIncoterms.value = false;
  if (
    profitPricingStore.id_shipment &&
    profitPricingStore.id_modality
  ) {
    rootStore.state.spiner = true;
    setTimeout(() => {
      rootStore.state.spiner = false;
      mostrarIncoterms.value = true;
    }, 500);
  }
});
</script>

<template>
  <v-container fluid>
    <v-form ref="frmDatos">
      <v-row>
        <v-col
          cols="12"
          md="2"
        >
          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="pricingStore.listModality"
            item-title="name"
            item-value="id"
            v-model="profitPricingStore.id_modality"
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
        >
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="pricingStore.listShipment"
            item-title="embarque"
            item-value="id"
            v-model="profitPricingStore.id_shipment"
          />
        </v-col>

        <v-col
          cols="12"
          class="px-10 icons-and-text"
          v-if="mostrarIncoterms"
        >
          <v-data-table
            :headers="headersIncoterms"
            :items="incoterms"
          >
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                color="info"
                icon
                @click="abrirModalActualizacionConceptos(item.id!)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
        <v-col
          class="icons-and-text"
          cols="12"
        />
      </v-row>
    </v-form>
    <v-dialog
      v-model="dialogNuevoProfit"
      scrollable
      persistent
      :overlay="false"
      fullscreen
    >
      <v-card>
        <v-card-title>
          <center>
            {{
              profitPricingStore.id_modality
                ? pricingStore.listModality.find(
                  (v) => v.id == profitPricingStore.id_modality,
                )!.name
                : ""
            }}
            |
            {{
              profitPricingStore.id_shipment
                ? pricingStore.listShipment.find(
                  (v) => v.id == profitPricingStore.id_shipment,
                )!.embarque
                : ""
            }}
            |
            {{
              profitPricingStore.id_incoterms
                ? incoterms.find(
                  (v) => v.id == profitPricingStore.id_incoterms,
                )!.name
                : ""
            }}
          </center>
        </v-card-title>
        <v-card-text>
          <v-row class="ma-0 py-0">
            <v-col cols="12">
              <v-tabs
                align-tabs="center"
                v-model="tab"
              >
                <v-tab>
                  Individual
                  <v-icon class="mx-1">
                    mdi-account
                  </v-icon>
                </v-tab>
                <v-tab>
                  Grupal
                  <v-icon class="mx-1">
                    mdi-account-group
                  </v-icon>
                </v-tab>
              </v-tabs>
              <v-tabs-window v-model="tab">
                <v-tabs-window-item>
                  <v-expansion-panels
                    multiple
                    class="px-5 py-2"
                  >
                    <v-expansion-panel
                      v-for="(panel, index) in panelesConDatos"
                      :key="index"
                    >
                      <v-expansion-panel-title>
                        {{ panel.name }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="headers"
                          :items="obtenerCostosEnBaseTipoCosto(panel.codigo)"
                          item-value="id"
                          density="compact"
                        >
                          <template #[`item.proveedor`]="{ item }">
                            <v-select
                              :items="proveedorStore.lstProveedores"
                              v-model="item.id_proveedor"
                              variant="outlined"
                              density="compact"
                              hide-details
                              item-title="namelong"
                              item-value="id"
                              disabled
                            />
                          </template>
                          <template #[`item.multiplicador`]="{ item }">
                            <v-select
                              item-title="text"
                              :items="
                                configEmpresaStore.lstMultiplicador
                              "
                              v-model="item.id_multiplicador"
                              variant="outlined"
                              density="compact"
                              hide-details
                              disabled
                            />
                            <!-- {{ listTipoCostos }} -->
                          </template>
                          <template
                            #[`item.profitprimeraimportacion`]="{ item }"
                          >
                            <v-text-field
                              density="compact"
                              variant="outlined"
                              type="number"
                              hide-details
                              v-model="item.profitprimeraimportacion"
                            />
                          </template>
                          <template
                            #[`item.profitsegundaimportacion`]="{ item }"
                          >
                            <v-text-field
                              density="compact"
                              variant="outlined"
                              v-model="item.profitsegundaimportacion"
                              type="number"
                              hide-details
                            />
                          </template>
                          <template #[`item.estado`]="{ item }">
                            <v-switch
                              label=""
                              density="compact"
                              v-model="item.estado"
                            />
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-tabs-window-item>
                <v-tabs-window-item>
                  <v-expansion-panels
                    multiple
                    class="px-5 py-2"
                  >
                    <v-expansion-panel
                      v-for="(panel, index) in panelesConDatos"
                      :key="index"
                    >
                      <v-expansion-panel-title>
                        {{ panel.name }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="headers"
                          :items="obtenerCostosEnBaseTipoCosto(panel.codigo)"
                          item-value="id"
                          density="compact"
                        >
                          <template #[`item.proveedor`]="{ item }">
                            <v-select
                              :items="proveedorStore.lstProveedores"
                              v-model="item.id_proveedor"
                              variant="outlined"
                              density="compact"
                              hide-details
                              item-title="namelong"
                              item-value="id"
                              disabled
                            />
                          </template>
                          <template #[`item.multiplicador`]="{ item }">
                            <v-select
                              item-title="text"
                              :items="
                                configEmpresaStore.lstMultiplicador
                              "
                              v-model="item.id_multiplicador"
                              variant="outlined"
                              density="compact"
                              hide-details
                              disabled
                            />
                            <!-- {{ listTipoCostos }} -->
                          </template>
                          <template
                            #[`item.profitprimeraimportacion`]="{ item }"
                          >
                            <v-text-field
                              density="compact"
                              variant="outlined"
                              type="number"
                              hide-details
                              v-model="item.profitprimeraimportacion"
                            />
                          </template>
                          <template
                            #[`item.profitsegundaimportacion`]="{ item }"
                          >
                            <v-text-field
                              density="compact"
                              variant="outlined"
                              v-model="item.profitsegundaimportacion"
                              type="number"
                              hide-details
                            />
                          </template>
                          <template #[`item.estado`]="{ item }">
                            <v-switch
                              label=""
                              density="compact"
                              v-model="item.estado"
                            />
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            :loading="loadingGuardar"
            @click="guardarDatos"
          >
            Guardar
          </v-btn>
          <v-btn
            color="error"
            @click="dialogNuevoProfit = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
