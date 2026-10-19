<script setup lang="ts">
import { computed, ref } from "vue";
import type { EntidadCoincidencia } from "@/types/entidades";

const props = defineProps<{
  items?: EntidadCoincidencia[];
  loading?: boolean;
  label?: string;
  value?: string;
  rules?: ((v: string) => boolean | string)[];
  disabled?: boolean;
}>();
const emit = defineEmits<{ search: [value: string]; id: [id: number] }>();

const showOptionsList = ref(true);
const search = computed({
  get() {
    return props.value;
  },
  set(newValue: string) {
    emit("search", newValue);
  },
});

function showList() {
  showOptionsList.value = true;
}
function hideList() {
  showOptionsList.value = false;
}
function clickOutsideList() {
  hideList();
}
function selectItem(id: number) {
  emit("id", id);
}
</script>

<template>
  <div
    class="customAutocomplete-container"
    v-click-outside="clickOutsideList"
  >
    <v-text-field 
      density="compact" 
      v-model="search" 
      :label="label" 
      :loading="loading" 
      :rules="rules" 
      :disabled="disabled"
      @focus="showList"
    />

    <v-list
      density="compact"
      class="customAutocomplete elevation-1"
      v-show="showOptionsList"
    >
      <template v-if="items!.length > 0 && !loading">
        <template
          v-for="(item, index) in items"
          :key="index"
        >
          <v-list-item @click="selectItem(item.id)">
            <v-list-item-title>
              {{ item.telefono ? item.nombrecompleto.concat(" - ", item.telefono) : item.nombrecompleto }}
            </v-list-item-title>
          </v-list-item>

          <!--<v-divider v-if="index < items.length - 1"></v-divider>-->
        </template>
      </template>
    </v-list>
  </div>
</template>

<style>
.customAutocomplete-container {
  position: relative;
}

.customAutocomplete {
  position: absolute;
  z-index: 99;
  right: 0;
  left: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: -17px;
  max-height: 350px;
  overflow-y: auto;
}
</style>
