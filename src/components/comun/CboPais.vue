<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";

type PaisId = number | string | Array<number | string> | null;

const props = withDefaults(
  defineProps<{
    errorPais?: string;
    autoSelectFirst?: boolean;
    chips?: boolean;
    clearable?: boolean;
    deletableChips?: boolean;
    multiple?: boolean;
    smallChips?: boolean;
    dense?: boolean;
    filled?: boolean;
    rounded?: boolean;
    solo?: boolean;
    outlined?: boolean;
    hideDetails?: boolean;
    newId?: number | null;
  }>(),
  {
    errorPais: "",
    autoSelectFirst: false,
    chips: false,
    clearable: false,
    deletableChips: false,
    multiple: false,
    smallChips: false,
    dense: false,
    filled: false,
    rounded: false,
    solo: false,
    outlined: false,
    hideDetails: false,
    newId: null,
  },
);
const emit = defineEmits<{ paisSeleccionado: [id: PaisId] }>();

const rootStore = useStore();
const itemsPais = computed(() => rootStore.state.itemsPais);

const id = ref<PaisId>("");

watch(
  () => props.newId,
  () => {
    if (props.newId) {
      id.value = props.newId;
    }
  },
);

onMounted(async () => {
  await rootStore.dispatch("_getPais");
});
</script>

<template>
  <v-autocomplete
    :items="itemsPais"
    :auto-select-first="autoSelectFirst"
    :chips="chips || smallChips"
    :clearable="clearable"
    :closable-chips="deletableChips"
    :multiple="multiple"
    :density="dense ? 'compact' : undefined"
    :rounded="rounded"
    :variant="outlined ? 'outlined' : solo ? 'solo' : filled ? 'filled' : undefined"
    item-value="id"
    item-title="name"
    label="País"
    v-model="id"
    @update:model-value="emit('paisSeleccionado', id)"
    :hide-details="!errorPais"
    :error-messages="errorPais"
  />
</template>

<style></style>
