<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { EntidadListado } from "@/types/entidades";
import {
  ITEMS_PER_PAGE_OPTIONS,
  filterEntities,
  formatCreatedAt,
  formatPhone,
  isActive,
  providerTypeTone,
  whatsappLink,
} from "./entityList";

const props = defineProps<{
  items: EntidadListado[];
  /** Plural shown in the footer, e.g. "clientes". */
  plural: string;
  newLabel: string;
  searchPlaceholder: string;
  canCreate: boolean;
  canExport: boolean;
  /** Whether the user may edit/delete; inactive records never show those actions. */
  canEdit: boolean;
  canDelete: boolean;
  /** Proveedores show their type instead of the address. */
  providers?: boolean;
}>();

const emit = defineEmits<{
  create: [];
  filter: [];
  export: [];
  phones: [item: EntidadListado];
  edit: [item: EntidadListado];
  view: [item: EntidadListado];
  remove: [item: EntidadListado];
}>();

const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

interface Column {
  key: string;
  title: string;
  icon: string;
  minWidth?: string;
  align?: "start" | "center" | "end";
}

const headers = computed<Column[]>(() => [
  { key: "correlativo", title: "Correlativo", icon: "mdi-pound", minWidth: "96px" },
  { key: "created_at", title: "Fecha de Creación", icon: "mdi-calendar-month-outline", minWidth: "116px" },
  { key: "nombrecompleto", title: "Nombre Completo", icon: "mdi-account-outline", minWidth: "220px" },
  ...(props.providers
    ? [{ key: "tipo_proveedor", title: "Tipo de Proveedor", icon: "mdi-tag-outline", minWidth: "160px", align: "center" as const }]
    : []),
  { key: "telefono", title: "Teléfono", icon: "mdi-phone-outline", minWidth: "160px" },
  { key: "email", title: "Email", icon: "mdi-email-outline", minWidth: "190px" },
  { key: "pais", title: "País", icon: "mdi-earth", minWidth: "96px" },
  ...(props.providers ? [] : [{ key: "address", title: "Dirección", icon: "mdi-map-marker-outline", minWidth: "200px" }]),
  { key: "estado", title: "Estado", icon: "mdi-database-outline", minWidth: "104px", align: "center" as const },
  { key: "action", title: "Acciones", icon: "mdi-cog-outline", minWidth: "160px", align: "center" as const },
]);

const filtered = computed(() => filterEntities(props.items ?? [], search.value));
const total = computed(() => filtered.value.length);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / itemsPerPage.value)));
const rangeText = computed(() => {
  if (!total.value) return `Mostrando 0 ${props.plural}`;
  const from = (page.value - 1) * itemsPerPage.value + 1;
  const to = Math.min(page.value * itemsPerPage.value, total.value);
  return `Mostrando ${from} – ${to} de ${total.value} ${props.plural}`;
});

watch([search, itemsPerPage], () => (page.value = 1));
watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});
</script>

<template>
  <div class="entity-list">
    <div class="entity-list__toolbar">
      <div class="entity-list__buttons">
        <v-btn
          v-if="canCreate"
          class="entity-list__btn entity-list__btn--new"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="emit('create')"
        >
          {{ newLabel }}
        </v-btn>
        <v-btn
          class="entity-list__btn entity-list__btn--filter"
          prepend-icon="mdi-filter-outline"
          variant="flat"
          @click="emit('filter')"
        >
          Filtrar
        </v-btn>
        <v-btn
          v-if="canExport"
          class="entity-list__btn entity-list__btn--export"
          prepend-icon="mdi-tray-arrow-down"
          variant="flat"
          @click="emit('export')"
        >
          Exportar
        </v-btn>
      </div>
      <v-text-field
        v-model="search"
        class="entity-list__search"
        :placeholder="searchPlaceholder"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        name="Buscar"
        aria-label="Buscar"
      />
    </div>

    <div class="entity-list__card">
      <v-data-table
        class="entity-list__table"
        :headers="headers"
        :items="filtered"
        item-value="id"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        hide-default-footer
        :sort-by="[]"
        :no-data-text="`No se encontraron ${plural}`"
      >
        <template
          v-for="column in headers"
          :key="column.key"
          #[`header.${column.key}`]
        >
          <span
            class="entity-list__head"
            :class="{ 'entity-list__head--center': column.align === 'center' }"
          >
            <v-icon
              :icon="column.icon"
              size="18"
              class="entity-list__head-icon"
            />
            <span>{{ column.title }}</span>
          </span>
        </template>

        <template #[`item.correlativo`]="{ item }">
          <span class="entity-list__mono">{{ item.correlativo }}</span>
        </template>
        <template #[`item.created_at`]="{ item }">
          {{ formatCreatedAt(item.created_at) }}
        </template>
        <template #[`item.nombrecompleto`]="{ item }">
          <div class="entity-list__name">
            {{ item.nombrecompleto }}
          </div>
          <div
            v-if="item.document"
            class="entity-list__sub"
          >
            {{ [item.acronym_document, item.document].filter(Boolean).join("-") }}
          </div>
        </template>
        <template #[`item.tipo_proveedor`]="{ item }">
          <span
            v-if="item.tipo_proveedor"
            class="entity-list__type"
            :class="`entity-list__type--${providerTypeTone(item.tipo_proveedor)}`"
          >
            {{ item.tipo_proveedor }}
          </span>
        </template>
        <template #[`item.telefono`]="{ item }">
          <a
            v-if="item.telefono"
            class="entity-list__contact"
            :href="whatsappLink(item.telefono)"
            target="_blank"
            rel="noopener"
            :title="`Escribir por WhatsApp a ${formatPhone(item.telefono)}`"
          >
            <v-icon
              icon="mdi-whatsapp"
              size="18"
              color="#25d366"
            />
            {{ formatPhone(item.telefono) }}
          </a>
        </template>
        <template #[`item.email`]="{ item }">
          <a
            v-if="item.email"
            class="entity-list__contact"
            :href="`mailto:${item.email}`"
          >
            <v-icon
              icon="mdi-email-outline"
              size="18"
              color="#1a73e8"
            />
            <span class="entity-list__email">{{ item.email }}</span>
          </a>
        </template>
        <template #[`item.pais`]="{ item }">
          {{ item.pais || item.city }}
        </template>
        <template #[`item.address`]="{ item }">
          <span class="entity-list__address">{{ item.address }}</span>
        </template>
        <template #[`item.estado`]="{ item }">
          <div class="entity-list__center">
            <span
              class="entity-list__status"
              :class="{ 'entity-list__status--off': !isActive(item) }"
            >
              <span class="entity-list__dot" />
              {{ item.estado || (isActive(item) ? "Activo" : "Inactivo") }}
            </span>
          </div>
        </template>
        <template #[`item.action`]="{ item }">
          <div class="entity-list__actions">
            <button
              type="button"
              class="entity-list__action"
              title="Teléfonos y contactos"
              aria-label="Teléfonos y contactos"
              @click="emit('phones', item)"
            >
              <v-icon
                icon="mdi-phone"
                size="17"
              />
            </button>
            <button
              v-if="isActive(item) && canEdit"
              type="button"
              class="entity-list__action"
              title="Editar"
              aria-label="Editar"
              @click="emit('edit', item)"
            >
              <v-icon
                icon="mdi-pencil"
                size="17"
              />
            </button>
            <button
              type="button"
              class="entity-list__action"
              title="Ver"
              aria-label="Ver"
              @click="emit('view', item)"
            >
              <v-icon
                icon="mdi-eye"
                size="17"
              />
            </button>
            <button
              v-if="isActive(item) && canDelete"
              type="button"
              class="entity-list__action entity-list__action--danger"
              title="Eliminar"
              aria-label="Eliminar"
              @click="emit('remove', item)"
            >
              <v-icon
                icon="mdi-delete"
                size="17"
              />
            </button>
          </div>
        </template>
      </v-data-table>
    </div>

    <div class="entity-list__footer">
      <span class="entity-list__range">{{ rangeText }}</span>
      <div class="entity-list__paging">
        <span class="entity-list__per-page-label">Items por página:</span>
        <v-select
          v-model="itemsPerPage"
          class="entity-list__per-page"
          :items="ITEMS_PER_PAGE_OPTIONS"
          variant="outlined"
          density="compact"
          hide-details
          aria-label="Items por página"
        />
        <v-pagination
          v-model="page"
          class="entity-list__pagination"
          :length="pageCount"
          :total-visible="5"
          show-first-last-page
          density="comfortable"
          rounded="lg"
          active-color="#1a73e8"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.entity-list {
  --el-ink: #14264e;
  --el-muted: #5b6b86;
  --el-line: #e3e9f2;
  --el-head: #eaf1fb;
  --el-blue: #1a73e8;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: #f4f7fb;
}

.entity-list__toolbar,
.entity-list__card,
.entity-list__footer {
  background: #fff;
  border: 1px solid var(--el-line);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(20, 38, 78, 0.05);
}

.entity-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.entity-list__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.entity-list__btn {
  height: 38px !important;
  padding: 0 16px !important;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}

.entity-list__btn--new {
  background: #0f7b5f !important;
  color: #fff !important;
}

.entity-list__btn--filter {
  background: var(--el-blue) !important;
  color: #fff !important;
}

.entity-list__btn--export {
  background: #ffc928 !important;
  color: #1f2a44 !important;
}

.entity-list__search {
  flex: 0 1 460px;
  min-width: 220px;
}

.entity-list__search :deep(.v-field) {
  border-radius: 8px;
}

.entity-list__search :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--el-blue);
}

.entity-list__card {
  overflow: hidden;
  padding: 6px;
}

.entity-list__table {
  background: transparent;
  color: var(--el-ink);
}

.entity-list__table :deep(thead th) {
  background: var(--el-head) !important;
  border-bottom: 0 !important;
  border-right: 3px solid #fff;
  height: 50px !important;
  white-space: nowrap;
}

.entity-list__table :deep(thead th:first-child) {
  border-radius: 8px 0 0 8px;
}

.entity-list__table :deep(thead th:last-child) {
  border-radius: 0 8px 8px 0;
  border-right: 0;
}

.entity-list__table :deep(tbody td) {
  height: 46px !important;
  border-bottom: 1px solid #eef2f7 !important;
  font-size: 0.86rem;
}

.entity-list__table :deep(tbody tr:hover td) {
  background: #f7faff;
}

.entity-list__head {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--el-ink);
  font-weight: 700;
  font-size: 0.86rem;
}

.entity-list__head--center {
  justify-content: center;
  width: 100%;
}

.entity-list__head-icon {
  color: var(--el-blue);
}

.entity-list__mono {
  font-variant-numeric: tabular-nums;
}

.entity-list__name {
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.25;
}

.entity-list__sub {
  color: var(--el-muted);
  font-size: 0.74rem;
}

.entity-list__type {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.entity-list__type--blue { background: #e3efff; color: #1a56b8; }
.entity-list__type--purple { background: #efe6ff; color: #6a35c2; }
.entity-list__type--green { background: #e3f8e6; color: #1f7a35; }
.entity-list__type--indigo { background: #e1e8ff; color: #2f47b5; }
.entity-list__type--amber { background: #fff1c9; color: #8a5a00; }
.entity-list__type--violet { background: #f3e5ff; color: #8a33c9; }
.entity-list__type--teal { background: #dff6f3; color: #0f6f66; }
.entity-list__type--pink { background: #ffe5f0; color: #b02a64; }
.entity-list__type--grey { background: #eef1f5; color: #4b5563; }

.entity-list__contact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.entity-list__contact:hover {
  color: var(--el-blue);
}

.entity-list__email {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-list__address {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.82rem;
}

.entity-list__center {
  display: flex;
  justify-content: center;
}

.entity-list__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 999px;
  background: #e3f8e6;
  color: #1f7a35;
  font-weight: 600;
  font-size: 0.8rem;
}

.entity-list__status--off {
  background: #fde8e8;
  color: #b42318;
}

.entity-list__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.entity-list__actions {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.entity-list__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  border: 1px solid #d9e2ef;
  border-radius: 7px;
  background: #fff;
  color: var(--el-blue);
  transition: background-color 0.15s, border-color 0.15s;
}

.entity-list__action:hover {
  background: #eef4ff;
  border-color: #b9cdf0;
}

.entity-list__action:focus-visible {
  outline: 2px solid var(--el-blue);
  outline-offset: 1px;
}

.entity-list__action--danger {
  color: #e53935;
}

.entity-list__action--danger:hover {
  background: #fdecec;
  border-color: #f3b4b4;
}

.entity-list__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 20px;
}

.entity-list__range {
  color: var(--el-ink);
  font-size: 0.88rem;
}

.entity-list__paging {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.entity-list__per-page-label {
  color: var(--el-ink);
  font-size: 0.88rem;
}

.entity-list__per-page {
  width: 90px;
  flex: none;
}

.entity-list__pagination :deep(.v-pagination__list) {
  margin: 0;
}
</style>
