<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ValidationRule } from "vuetify";

interface TreeNode {
  [campo: string]: unknown;
  children?: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    options: TreeNode[];
    label?: string;
    placeholder?: string;
    outlined?: boolean;
    dense?: boolean;
    disabled?: boolean;
    rules?: ValidationRule[];
    searchNested?: boolean;
    disableBranchNodes?: boolean;
    itemText?: string;
    itemValue?: string;
  }>(),
  {
    label: undefined,
    placeholder: undefined,
    rules: undefined,
    searchNested: false,
    disableBranchNodes: true,
    itemText: "label",
    itemValue: "id",
  },
);
const internalValue = defineModel<string | number | null>({ default: null });

const menu = ref(false);
const search = ref("");
const openNodes = ref<unknown[]>([]);

const activeNodes = computed(() =>
  internalValue.value !== null && internalValue.value !== undefined && internalValue.value !== ""
    ? [internalValue.value]
    : [],
);
const selectedLabel = computed(() => {
  if (
    internalValue.value === null ||
    internalValue.value === undefined ||
    internalValue.value === ""
  ) {
    return "";
  }

  const node = findNode(props.options, internalValue.value);
  return node ? node[props.itemText] : "";
});

function findNode(items: TreeNode[], id: unknown): TreeNode | null {
  if (!items || items.length === 0) return null;
  for (const item of items) {
    if (String(item[props.itemValue]) === String(id)) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findNode(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function onNodeSelect(activeArray: Array<string | number>) {
  if (!activeArray || activeArray.length === 0) {
    internalValue.value = null;
    return;
  }
  const selectedKey = activeArray[0]!;
  const node = findNode(props.options, selectedKey);

  if (props.disableBranchNodes && node && node.children && node.children.length > 0) {
    return;
  }

  internalValue.value = selectedKey;
  menu.value = false;
  search.value = "";
}

function clearSelection() {
  internalValue.value = null;
}
function findPath(items: TreeNode[], targetId: unknown): unknown[] | null {
  if (!items || items.length === 0) return null;

  for (const item of items) {
    if (String(item[props.itemValue]) === String(targetId)) {
      return [];
    }

    if (item.children && item.children.length > 0) {
      const childPath = findPath(item.children, targetId);

      if (childPath !== null) {
        return [item[props.itemValue], ...childPath];
      }
    }
  }
  return null;
}

watch(
  internalValue,
  (newVal) => {
    if (newVal !== null && newVal !== undefined && newVal !== "") {
      // Si hay un valor, calculamos la ruta para llegar a él
      const path = findPath(props.options, newVal);
      openNodes.value = path || [];
    } else {
      openNodes.value = [];
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="290"
  >
    <!-- INPUT QUE ACTÚA COMO EL SELECT -->
    <template #activator="{ props: activatorProps }">
      <v-text-field
        :model-value="selectedLabel"
        :label="label"
        :placeholder="placeholder"
        :variant="outlined ? 'outlined' : undefined"
        :density="dense ? 'compact' : undefined"
        :rules="rules"
        :disabled="disabled"
        readonly
        clearable
        hide-details
        append-inner-icon="mdi-chevron-down"
        v-bind="activatorProps"
        @click:clear="clearSelection"
      />
    </template>

    <!-- CAJA DESPLEGABLE CON EL ÁRBOL -->
    <v-card>
      <!-- Buscador -->
      <div
        class="pa-2"
        v-if="searchNested"
      >
        <v-text-field
          v-model="search"
          label=""
          density="compact"
          variant="outlined"
          hide-details
        />
      </div>
      <v-divider v-if="searchNested" />

      <!-- Árbol de Vuetify -->
      <v-card-text
        class="pa-0"
        style="max-height: 300px; overflow-y: auto"
      >
        <v-treeview
          :items="options"
          :search="search"
          :item-title="itemText"
          :item-value="itemValue"
          activatable
          :open-on-click="disableBranchNodes"
          density="compact"
          v-model:opened="openNodes"
          :activated="activeNodes"
          @update:activated="onNodeSelect"
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>
