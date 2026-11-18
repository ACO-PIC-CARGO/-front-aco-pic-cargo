<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { usePricingStore } from "@/stores/pricing";
import { getQuotePriorityDetail, listActiveQuotePriorities } from "@/views/Configuracion/Pricing/quotePriorityApi";
import QuotePriorityChip from "./QuotePriorityChip.vue";
import { currentPriorityOf, dangerousGoodsOf, priorityOptions, type PriorityOption } from "./quotePriorityField";

withDefaults(defineProps<{ readonly?: boolean }>(), { readonly: false });

const pricingStore = usePricingStore();
const active = ref<PriorityOption[]>([]);
const current = ref<PriorityOption | null>(null);

onMounted(async () => {
  const response = await listActiveQuotePriorities();
  if (response.estadoflag) active.value = response.data as PriorityOption[];
});

watch(
  () => pricingStore.id,
  async (quoteId) => {
    if (!quoteId) return;
    const detail = await getQuotePriorityDetail(quoteId);
    current.value = currentPriorityOf(detail);
    pricingStore.datosPrincipales.dangerous_goods = dangerousGoodsOf(detail);
    if (current.value) pricingStore.datosPrincipales.id_quote_priority = current.value.id;
  },
  { immediate: true },
);
</script>

<template>
  <v-select
    v-model="pricingStore.datosPrincipales.id_quote_priority"
    label="Prioridad"
    variant="outlined"
    density="compact"
    class="my-1"
    :items="priorityOptions(active, current)"
    item-title="name"
    item-value="id"
    :readonly="readonly"
    :clearable="!readonly"
  >
    <template #item="{ item, props }">
      <v-list-item v-bind="props">
        <template #title>
          <QuotePriorityChip
            :name="item.name"
            :color="item.color_all"
          />
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <QuotePriorityChip
        :name="item.name"
        :color="item.color_all"
      />
    </template>
  </v-select>
</template>
