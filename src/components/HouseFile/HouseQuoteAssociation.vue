<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import axios from "@/api/http";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";
import type { AprobacionCotizacion, CotizacionListado } from "@/types/cotizacion";
import type { CotizacionAsociableHouse } from "@/types/operaciones";

type QuoteKind = "pricing" | "aduana";

const COST_OPTIONS = [
  { id: "0", text: "No hacer ninguna acción" },
  { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
  { id: "2", text: "Sumar los nuevos costos, a los costos ya existentes de proveedores" },
];

const pricingStore = usePricingStore();
const aduanaStore = useAduanaStore();
const housesStore = useHousesStore();
const { form } = storeToRefs(useHouseEditStore());
const dialog = ref(false);
const kind = ref<QuoteKind>("pricing");
const option = ref("");
const paymentWarning = ref("");
const blocked = ref(false);
const associating = ref(false);

onMounted(() => Promise.all([pricingStore.ListarMontosFinalesQuoteMONGODB(), aduanaStore.ListarMontosFinalesAduanaMONGODB()]));

function openCosts(selected: QuoteKind, value: unknown) {
  if (!value) return;
  kind.value = selected;
  option.value = "";
  paymentWarning.value = "";
  blocked.value = false;
  dialog.value = true;
}

async function checkPayments() {
  paymentWarning.value = "";
  blocked.value = false;
  if (kind.value !== "pricing" || option.value !== "1") return;
  blocked.value = true;
  const { data } = await axios({ method: "get", url: "validar_existe_pago_master", params: { id: form.value.id_cot } });
  blocked.value = Boolean(data.estadoflag);
  paymentWarning.value = data.estadoflag ? data.mensaje : "";
}

function approvalData(selected: CotizacionAsociableHouse, quoteId: number | null): AprobacionCotizacion {
  const total = selected.listIngresosInstructivo.find((item) => item.descripcion === "TOTAL")!;
  return {
    id_quote: quoteId,
    nuevoexpediente: false,
    id_exp: housesStore.house.id_master,
    fecha_validez: "",
    totalIngreso: total.valor,
    igvIngreso: total.igv,
    valorIngreso: total.valor,
    listCostosInstructivo: selected.listCostosInstructivo,
    listVentasInstructivo: selected.listIngresosInstructivo,
    id_house: housesStore.house.id,
    id_opcion: option.value,
  };
}

async function associate() {
  associating.value = true;
  try {
    if (kind.value === "pricing") {
      const selected = pricingStore.listQuotes.find((item) => item.id == form.value.id_cot) as CotizacionAsociableHouse;
      await pricingStore.aprobarCotizacion(approvalData(selected, form.value.id_cot));
    } else {
      const selected = aduanaStore.listQuotes2.find((item) => item.id == form.value.id_quoteaduana) as CotizacionAsociableHouse;
      await aduanaStore.aprobarCotizacionAduana(approvalData(selected, form.value.id_quoteaduana));
    }
    dialog.value = false;
    await housesStore.verHouse({ id: housesStore.house.id });
  } finally {
    associating.value = false;
  }
}
</script>

<template>
  <div class="d-flex flex-wrap ga-3">
    <v-autocomplete
      v-model="form.id_cot"
      :items="pricingStore.listQuotes"
      item-title="code"
      item-value="id"
      label="Cot Nro"
      clearable
      :readonly="false"
      @update:model-value="(value) => openCosts('pricing', value)"
    />
    <v-autocomplete
      v-model="form.id_quoteaduana"
      :items="aduanaStore.listQuotes2"
      item-title="quote"
      item-value="id"
      label="Aduana asociado al house"
      clearable
      :readonly="false"
      :item-props="(item: CotizacionListado) => ({ disabled: Boolean(item.aprobadoflag) })"
      @update:model-value="(value) => openCosts('aduana', value)"
    />
    <v-dialog
      v-model="dialog"
      max-width="520"
      persistent
      content-class="aco-ui"
    >
      <v-card class="aco-card">
        <v-card-title class="aco-title-card pt-5 px-6">
          Opción sobre los costos
        </v-card-title>
        <v-card-text class="px-6">
          <v-autocomplete
            v-model="option"
            :items="COST_OPTIONS"
            item-title="text"
            item-value="id"
            label="Qué hacer con los costos"
            :readonly="false"
            @update:model-value="checkPayments"
          />
          <v-alert
            v-if="paymentWarning"
            type="warning"
            variant="tonal"
            :text="paymentWarning"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="associating"
            :disabled="blocked || !option"
            @click="associate"
          >
            Asociar cotización
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
