<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useBancosStore } from "@/stores/bancos";
import { useHousesStore } from "@/stores/houses";
import { notifySuccess } from "@/utils/request";
import type { CuentaBancariaPic, HouseNotice } from "@/types/operaciones";

const props = defineProps<{ houseId: number; modality?: string; notice?: HouseNotice | null; fecha?: string | null }>();
const emit = defineEmits<{ sent: [] }>();
const open = defineModel<boolean>({ required: true });

const IMPORT_NOTICES = ["Aviso de Salida", "Actualización de Salida", "Pre-Aviso de Llegada", "Aviso de Llegada", "Actualización de Llegada"];
const EXPORT_NOTICES = ["Aviso de Salida", "Actualización de Salida", "Aviso de Llegada"];
const MISSING_CHOICE = "Elige el aviso y al menos una cuenta bancaria.";

const housesStore = useHousesStore();
const bancosStore = useBancosStore();
const { cuentas } = storeToRefs(bancosStore);
const noticeType = ref<string | null>(null);
const accountIds = ref<number[]>([]);
const search = ref("");
const sending = ref(false);
const errorMessage = ref("");
const notices = computed(() => (props.modality === "Exportación" ? EXPORT_NOTICES : IMPORT_NOTICES));

// Only the company accounts flagged for arrival notices reach the client.
const noticeAccounts = computed(() => cuentas.value.filter((account) => account.esavisollegada === true));
const visibleAccounts = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return noticeAccounts.value;
  return noticeAccounts.value.filter((account) =>
    [account.label, account.banco, account.moneda, account.symbol, account.cuenta, account.cci]
      .some((text) => text?.toLowerCase().includes(term)),
  );
});
const allVisibleSelected = computed(
  () => visibleAccounts.value.length > 0 && visibleAccounts.value.every((account) => accountIds.value.includes(account.id)),
);
const someVisibleSelected = computed(
  () => !allVisibleSelected.value && visibleAccounts.value.some((account) => accountIds.value.includes(account.id)),
);

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    noticeType.value = props.notice?.title ?? null;
    accountIds.value = [];
    search.value = "";
    errorMessage.value = "";
    bancosStore.getListBanksDetailsCargar();
  },
  { immediate: true },
);

function accountTitle(account: CuentaBancariaPic) {
  return account.banco && account.moneda ? `${account.symbol} - ${account.banco} CUENTA EN ${account.moneda}` : account.label;
}
function hasCci(account: CuentaBancariaPic) {
  return Boolean(account.cci) && account.cci !== "null";
}
function toggleAccount(id: number) {
  accountIds.value = accountIds.value.includes(id) ? accountIds.value.filter((accountId) => accountId !== id) : [...accountIds.value, id];
}
function toggleAllVisible() {
  const visibleIds = visibleAccounts.value.map((account) => account.id);
  accountIds.value = allVisibleSelected.value
    ? accountIds.value.filter((id) => !visibleIds.includes(id))
    : [...new Set([...accountIds.value, ...visibleIds])];
}

async function send() {
  if (!noticeType.value || !accountIds.value.length) {
    errorMessage.value = MISSING_CHOICE;
    return;
  }
  sending.value = true;
  const notice = { id: props.notice?.id ?? null, title: noticeType.value };
  const response = await housesStore.sendArrivalNotice(props.houseId, notice, accountIds.value, props.fecha ?? null);
  sending.value = false;
  if (!response.estadoflag) {
    errorMessage.value = response.mensaje;
    return;
  }
  notifySuccess(response.mensaje);
  emit("sent");
  open.value = false;
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="900"
    persistent
    scrollable
    content-class="aco-ui"
  >
    <v-card class="notice-dialog">
      <header class="notice-dialog__header">
        <v-icon
          icon="mdi-send"
          size="28"
          class="notice-dialog__header-icon"
        />
        <h2 class="notice-dialog__title">
          Enviar {{ notice ? notice.title : "aviso" }} al cliente
        </h2>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          aria-label="Cerrar"
          :disabled="sending"
          @click="open = false"
        />
      </header>

      <v-card-text class="notice-dialog__body">
        <div class="notice-dialog__info">
          <v-icon
            icon="mdi-information"
            color="#1a5fd0"
            size="26"
          />
          Seleccione las cuentas bancarias que desea enviar en el {{ notice ? notice.title.toLowerCase() : "aviso" }}.
        </div>

        <v-select
          v-if="!notice"
          v-model="noticeType"
          :items="notices"
          label="Aviso"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-4"
          :readonly="false"
        />

        <v-text-field
          v-model="search"
          placeholder="Buscar cuenta, banco o moneda..."
          aria-label="Buscar cuenta, banco o moneda"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          :readonly="false"
          class="mb-4"
        />

        <div
          v-if="noticeAccounts.length"
          class="notice-list"
        >
          <div class="notice-list__head">
            <span class="notice-check">
              <v-checkbox-btn
                :model-value="allVisibleSelected"
                :indeterminate="someVisibleSelected"
                :disabled="!visibleAccounts.length"
                aria-label="Seleccionar todas"
                color="#1a5fd0"
                :readonly="false"
                @update:model-value="toggleAllVisible"
              />
            </span>
            <span class="notice-list__head-label">Seleccionar todas</span>
            <v-spacer />
            <span class="notice-list__count">
              {{ visibleAccounts.length }} {{ visibleAccounts.length === 1 ? "cuenta encontrada" : "cuentas encontradas" }}
            </span>
          </div>

          <div class="notice-list__rows">
            <label
              v-for="account in visibleAccounts"
              :key="account.id"
              class="notice-row"
              :class="{ 'notice-row--selected': accountIds.includes(account.id) }"
            >
              <span class="notice-check">
                <v-checkbox-btn
                  :model-value="accountIds.includes(account.id)"
                  :aria-label="accountTitle(account)"
                  color="#1a5fd0"
                  :readonly="false"
                  @update:model-value="toggleAccount(account.id)"
                />
              </span>
              <span class="notice-row__main">
                <span class="notice-row__title">{{ accountTitle(account) }}</span>
                <span class="notice-row__number">N° Cuenta: {{ account.cuenta }}</span>
              </span>
              <span class="notice-row__cci">CCI: {{ hasCci(account) ? account.cci : "—" }}</span>
              <span class="notice-row__coin">{{ account.symbol }}</span>
            </label>
            <p
              v-if="!visibleAccounts.length"
              class="notice-list__empty"
            >
              Ninguna cuenta coincide con la búsqueda.
            </p>
          </div>
        </div>
        <p
          v-else
          class="notice-list__empty"
        >
          Tu empresa no tiene cuentas bancarias marcadas para avisos. Márcalas en Bancos para poder enviar el aviso.
        </p>

        <v-alert
          v-if="errorMessage"
          type="warning"
          variant="tonal"
          class="mt-3"
          :text="errorMessage"
        />
      </v-card-text>

      <footer class="notice-dialog__footer">
        <div class="notice-dialog__selected">
          <v-icon
            icon="mdi-check-circle"
            color="#1a5fd0"
            size="26"
          />
          {{ accountIds.length }} {{ accountIds.length === 1 ? "cuenta seleccionada" : "cuentas seleccionadas" }}
        </div>
        <v-btn
          class="notice-dialog__action"
          variant="outlined"
          size="large"
          prepend-icon="mdi-close"
          :disabled="sending"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="notice-dialog__action"
          color="#103f7f"
          variant="flat"
          size="large"
          prepend-icon="mdi-send"
          :loading="sending"
          @click="send"
        >
          Enviar Aviso
        </v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.notice-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.notice-dialog__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px 14px 24px;
  background: #103f7f;
  color: #fff;
}

.notice-dialog__header-icon {
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.35);
  box-sizing: content-box;
}

.notice-dialog__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.notice-dialog__body {
  padding: 20px 24px 8px !important;
}

.notice-dialog__info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #e3eefc;
  color: #14264e;
}

.notice-list {
  border: 1px solid #dbe7f7;
  border-radius: 12px;
  background: #f6faff;
  overflow: hidden;
}

.notice-list__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 8px;
  border-bottom: 1px solid #dbe7f7;
}

/* Vuetify's selection control stretches by default; keep the box its own size, first in the row. */
.notice-check {
  display: inline-flex;
  flex: 0 0 auto;
  grid-column: 1;
  grid-row: 1;
}

.notice-check :deep(.v-selection-control) {
  flex: 0 0 auto;
  width: auto;
  min-height: 0;
}

.notice-list__head-label {
  font-weight: 700;
  color: #14264e;
}

.notice-list__count {
  padding: 4px 12px;
  border-radius: 999px;
  background: #e3eefc;
  color: #1a5fd0;
  font-size: 0.8rem;
  font-weight: 600;
}

.notice-list__rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 360px;
  padding: 6px;
  overflow-y: auto;
}

.notice-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1.3fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 8px 4px;
  border: 1px solid #e8edf3;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.notice-row:hover {
  border-color: #cfe0f6;
}

.notice-row--selected {
  border-color: #9fc0ee;
  background: #e8f1fd;
}

.notice-row__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.notice-row__title {
  font-weight: 700;
  color: #14264e;
}

.notice-row__number {
  color: #3d4a63;
  font-size: 0.9rem;
}

.notice-row__cci {
  padding-left: 16px;
  border-left: 1px solid #dbe2ec;
  color: #1f2a40;
  word-break: break-all;
}

.notice-row__coin {
  padding: 4px 12px;
  border-radius: 999px;
  background: #e3eefc;
  color: #1a5fd0;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.notice-list__empty {
  margin: 0;
  padding: 16px;
  text-align: center;
  color: #6b7a93;
}

.notice-dialog__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 24px 20px;
}

.notice-dialog__selected {
  display: flex;
  flex: 1 1 260px;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-radius: 10px;
  background: #e3eefc;
  color: #1a5fd0;
  font-weight: 600;
}

.notice-dialog__action {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
}

@media (max-width: 700px) {
  .notice-row {
    grid-template-columns: 40px minmax(0, 1fr) auto;
  }

  .notice-row__cci {
    grid-column: 2 / -1;
    padding-left: 0;
    border-left: 0;
  }
}
</style>
