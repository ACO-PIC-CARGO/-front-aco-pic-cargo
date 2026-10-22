<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import TrackingIconOption from "./TrackingIconOption.vue";
import { filterIcons, loadIconCatalog, toIconCatalog, toRows } from "./iconCatalog";
import { TRACKING_ICONS } from "./trackingIcons";
import type { TrackingIcon } from "./trackingIcons";

const ROW_HEIGHT = 56;
const LIST_HEIGHT = 240;

const icon = defineModel<string>({ required: true });

const { xs } = useDisplay();
const query = ref<string | null>("");
const catalog = ref<TrackingIcon[]>([]);
const loading = ref(true);
const loadFailed = ref(false);
const columns = computed(() => (xs.value ? 5 : 8));
const searching = computed(() => Boolean(query.value?.trim()));
const results = computed(() => filterIcons(loadFailed.value ? TRACKING_ICONS : catalog.value, query.value ?? ""));
const rows = computed(() => toRows(results.value, columns.value));
const selectedLabel = computed(() => toIconCatalog([icon.value])[0]!.label);

onMounted(async () => {
  try {
    catalog.value = await loadIconCatalog();
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <fieldset
    class="tracking-icon-picker"
    :style="{ '--icon-columns': columns }"
  >
    <legend class="aco-title-row">
      Icono
    </legend>
    <div class="tracking-icon-picker__current">
      <AcoIconTile
        :icon="icon"
        size="sm"
        tone="solid"
      />
      <span class="aco-body">{{ selectedLabel }}</span>
    </div>
    <v-text-field
      v-model="query"
      label="Buscar icono"
      placeholder="Busca en inglés, por ejemplo truck o ship"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      density="compact"
    />

    <template v-if="!searching">
      <p class="aco-caption tracking-icon-picker__heading">
        Sugeridos
      </p>
      <div class="tracking-icon-picker__grid">
        <TrackingIconOption
          v-for="option in TRACKING_ICONS"
          :key="option.icon"
          :option="option"
          :selected="icon === option.icon"
          @select="icon = option.icon"
        />
      </div>
      <p
        v-if="!loadFailed"
        class="aco-caption tracking-icon-picker__heading"
      >
        Todos los iconos
      </p>
    </template>

    <p
      v-if="loading"
      class="aco-caption"
    >
      Cargando iconos…
    </p>
    <p
      v-else-if="loadFailed && !searching"
      class="aco-caption"
    >
      No pudimos cargar todos los iconos. Elige uno de los sugeridos o vuelve a abrir el formulario.
    </p>
    <p
      v-else-if="!results.length"
      class="aco-caption"
    >
      No encontramos iconos con ese nombre. Prueba en inglés, por ejemplo truck.
    </p>
    <v-virtual-scroll
      v-else
      :items="rows"
      :height="LIST_HEIGHT"
      :item-height="ROW_HEIGHT"
      class="tracking-icon-picker__all"
    >
      <template #default="{ item: row }">
        <div class="tracking-icon-picker__grid tracking-icon-picker__row">
          <TrackingIconOption
            v-for="option in row"
            :key="option.icon"
            :option="option"
            :selected="icon === option.icon"
            @select="icon = option.icon"
          />
        </div>
      </template>
    </v-virtual-scroll>
  </fieldset>
</template>

<style scoped>
.tracking-icon-picker {
  margin: var(--aco-space-4) 0;
  border: 0;
  padding: 0;
}

.tracking-icon-picker legend {
  margin-bottom: var(--aco-space-2);
}

.tracking-icon-picker__current {
  display: flex;
  align-items: center;
  gap: var(--aco-space-3);
  margin-bottom: var(--aco-space-3);
}

.tracking-icon-picker__heading {
  margin: var(--aco-space-4) 0 var(--aco-space-2);
}

.tracking-icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(var(--icon-columns), minmax(0, 1fr));
  gap: var(--aco-space-2);
}

.tracking-icon-picker__row {
  height: 56px;
  align-items: center;
}

.tracking-icon-picker__all {
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: var(--aco-radius-control);
}
</style>
