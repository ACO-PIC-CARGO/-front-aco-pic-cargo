<script setup lang="ts">
import { EMAIL_TABLE_FIELDS } from "@/utils/providerQuoteEmailFields";
import type { EmailTableField, EmailTableRow } from "@/types/providerQuoteEmailTemplate";

const props = defineProps<{ readonly?: boolean }>();
const header = defineModel<[string, string]>("header", { required: true });
const rows = defineModel<EmailTableRow[]>("rows", { required: true });

const replaceRow = (index: number, change: Partial<EmailTableRow>) =>
  (rows.value = rows.value.map((row, at) => (at === index ? { ...row, ...change } : row)));

function move(index: number, offset: -1 | 1) {
  const next = [...rows.value];
  [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
  rows.value = next;
}

const remove = (index: number) => (rows.value = rows.value.filter((_, at) => at !== index));
const add = () => (rows.value = [...rows.value, { field: "incoterm", label: "" }]);
</script>

<template>
  <section>
    <h3 class="text-title-medium mb-2">
      Tabla de datos
    </h3>
    <div class="email-table__header">
      <v-text-field
        :model-value="header[0]"
        label="Encabezado de la columna 1"
        density="compact"
        :readonly="props.readonly"
        @update:model-value="header = [$event, header[1]]"
      />
      <v-text-field
        :model-value="header[1]"
        label="Encabezado de la columna 2"
        density="compact"
        :readonly="props.readonly"
        @update:model-value="header = [header[0], $event]"
      />
    </div>
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="email-table__row"
    >
      <v-text-field
        :model-value="row.label"
        label="Texto de la fila"
        density="compact"
        hide-details="auto"
        :readonly="props.readonly"
        @update:model-value="replaceRow(index, { label: $event })"
      />
      <v-select
        :model-value="row.field"
        :items="EMAIL_TABLE_FIELDS"
        label="Dato"
        density="compact"
        hide-details
        :readonly="props.readonly"
        @update:model-value="replaceRow(index, { field: $event as EmailTableField })"
      />
      <template v-if="!props.readonly">
        <v-btn
          icon="mdi-arrow-up"
          variant="text"
          size="small"
          aria-label="Subir fila"
          :disabled="index === 0"
          @click="move(index, -1)"
        />
        <v-btn
          icon="mdi-arrow-down"
          variant="text"
          size="small"
          aria-label="Bajar fila"
          :disabled="index === rows.length - 1"
          @click="move(index, 1)"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="error"
          aria-label="Quitar fila"
          @click="remove(index)"
        />
      </template>
    </div>
    <v-btn
      v-if="!props.readonly"
      variant="tonal"
      prepend-icon="mdi-plus"
      aria-label="Agregar fila"
      @click="add"
    >
      Agregar fila
    </v-btn>
  </section>
</template>

<style scoped>
.email-table__header {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.email-table__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
