<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useDialogSave } from "@/composables/useDialogSave";
import { usePermissions } from "@/composables/usePermissions";
import { useBancosStore } from "@/stores/bancos";
import type { CuentaBancariaForm, CuentaBancariaListado, FiltroCuentasBancarias } from "@/types/operaciones";
import { hasFailed, notifySuccess } from "@/utils/request";

const SCREEN = "cuentasBancariasListado";
const headers = [
  { title: "Acciones", key: "actions", sortable: false },
  { title: "Banco", key: "bank_name" },
  { title: "Nro Cuenta", key: "nrocuenta" },
  { title: "CCI", key: "nrocci" },
  { title: "Moneda", key: "coin_acronym" },
  { title: "Aviso de Llegada", key: "esavisollegada", align: "center", sortable: false },
  { title: "Facturación a Clientes", key: "esprincipalflag", align: "center", sortable: false },
  { title: "Estado", key: "status", align: "center", sortable: false },
] as const;

const FLAG_KEYS = ["esavisollegada", "esprincipalflag"] as const;
const HINTS: Record<(typeof FLAG_KEYS)[number], string> = {
  esavisollegada: "La cuenta se muestra en el aviso de llegada que se envía al cliente.",
  esprincipalflag: "La cuenta se muestra en la facturación a clientes.",
};
const FLAG_NAMES: Record<(typeof FLAG_KEYS)[number], { article: string; name: string }> = {
  esprincipalflag: { article: "la", name: "Facturación" },
  esavisollegada: { article: "el", name: "Aviso de Llegada" },
};
const MESSAGE_ORDER = ["esprincipalflag", "esavisollegada"] as const;
const FLAG_OPTIONS = [
  { label: "Sí", value: true, color: "green" },
  { label: "No", value: false, color: "red" },
  { label: "Todos", value: null, color: "blue" },
];
const STATUS_OPTIONS = [
  { label: "Activo", value: 1, color: "green" },
  { label: "Inactivo", value: 0, color: "red" },
  { label: "Todos", value: null, color: "blue" },
];
const required = [(value: unknown) => (value !== null && value !== undefined && value !== "") || "Dato requerido"];

const store = useBancosStore();
const { cuentasListado, bancosOpciones, monedasOpciones } = storeToRefs(store);
const { can } = usePermissions();
const canCreate = can(SCREEN, "NUEVO");
const canEdit = can(SCREEN, "MODIFICAR");
const canDelete = can(SCREEN, "ELIMINAR");

const emptyFilters = (): FiltroCuentasBancarias => ({
  id_bank: null,
  nrocuenta: "",
  nrocci: "",
  esprincipalflag: null,
  esavisollegada: null,
  status: 1,
  id_coin: null,
});
const emptyDraft = (): CuentaBancariaForm => ({
  id: null,
  id_bank: null,
  id_coin: null,
  nrocuenta: "",
  nrocci: "",
  status: 1,
  esprincipalflag: false,
  esavisollegada: false,
});

const loading = shallowRef(false);
const search = shallowRef("");
const filterDrawer = shallowRef(false);
const filters = ref<FiltroCuentasBancarias>(emptyFilters());

const dialog = shallowRef(false);
const mode = shallowRef<"ver" | "editar" | "nuevo">("nuevo");
const draft = ref<CuentaBancariaForm>(emptyDraft());
const savedFlags = ref({ esprincipalflag: false, esavisollegada: false });
const form = useTemplateRef("form");
const { saving, serverError, save } = useDialogSave(dialog, form, persist);
const viewing = computed(() => mode.value === "ver");
const dialogTitle = computed(() =>
  mode.value === "nuevo"
    ? "Nueva Cuenta"
    : `${viewing.value ? "Ver" : "Editar"} Cuenta: ${draft.value.nrocuenta}`,
);

async function load() {
  loading.value = true;
  const answer = await store.loadCuentasListado(filters.value);
  loading.value = false;
  if (hasFailed(answer)) Swal.fire({ icon: "error", text: answer.mensaje });
}

async function applyFilters() {
  filterDrawer.value = false;
  await load();
}

async function clearFilters() {
  filters.value = emptyFilters();
  await applyFilters();
}

async function openDialog(nextMode: "ver" | "editar" | "nuevo", cuenta?: CuentaBancariaListado) {
  mode.value = nextMode;
  draft.value = cuenta
    ? {
        id: cuenta.id,
        id_bank: cuenta.id_bank,
        id_coin: cuenta.id_coin,
        nrocuenta: cuenta.nrocuenta,
        nrocci: cuenta.nrocci ?? "",
        status: Number(cuenta.status),
        esprincipalflag: Boolean(cuenta.esprincipalflag),
        esavisollegada: Boolean(cuenta.esavisollegada),
      }
    : emptyDraft();
  savedFlags.value = { esprincipalflag: draft.value.esprincipalflag, esavisollegada: draft.value.esavisollegada };
  serverError.value = "";
  dialog.value = true;
  await nextTick();
  form.value?.resetValidation();
}

async function persist() {
  const answer = await store.saveCuenta(draft.value);
  if (!answer.estadoflag) return answer.mensaje;
  notifySuccess(answer.mensaje);
  await load();
  return null;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const flagHtml = (key: (typeof FLAG_KEYS)[number]) => `<strong class="cuenta-swal-flag">${FLAG_NAMES[key].name}</strong>`;

const CUENTA_SWAL = {
  showCancelButton: true,
  reverseButtons: true,
  buttonsStyling: false,
  cancelButtonText: "Cancelar",
  customClass: {
    popup: "cuenta-swal",
    title: "cuenta-swal-title",
    htmlContainer: "cuenta-swal-body",
    actions: "cuenta-swal-actions",
    confirmButton: "cuenta-swal-confirm",
    cancelButton: "cuenta-swal-cancel",
    icon: "cuenta-swal-icon",
  },
} as const;

function emptiedAssignment(cuenta: CuentaBancariaListado) {
  const flags = MESSAGE_ORDER.filter((key) => cuenta[key]);
  if (!flags.length) return `<p>La cuenta <strong>${cuenta.nrocuenta}</strong> dejará de estar disponible.</p>`;
  const named = flags.map((key, index) => `${index ? FLAG_NAMES[key].article : capitalize(FLAG_NAMES[key].article)} ${flagHtml(key)}`);
  return `<p>${named.join(" y ")} ${flags.length > 1 ? "quedarán" : "quedará"} sin cuenta asignada.</p>
    <p class="cuenta-swal-note">Podrás configurarla después.</p>`;
}

async function remove(cuenta: CuentaBancariaListado) {
  const { isConfirmed } = await Swal.fire({
    ...CUENTA_SWAL,
    titleText: "¿Eliminar cuenta bancaria?",
    html: emptiedAssignment(cuenta),
    confirmButtonText: '<i class="mdi mdi-delete"></i> Eliminar',
  });
  if (!isConfirmed) return;
  const answer = await store.deleteCuenta(cuenta);
  if (answer.estadoflag) notifySuccess(answer.mensaje);
  else Swal.fire({ icon: "warning", text: answer.mensaje });
  await load();
}

function takenFlags() {
  if (draft.value.status != 1) return [];
  return MESSAGE_ORDER.filter(
    (key) =>
      draft.value[key] &&
      !savedFlags.value[key] &&
      cuentasListado.value.some((cuenta) => cuenta.id !== draft.value.id && cuenta.status == 1 && cuenta[key]),
  );
}

async function allowsExtraAccount() {
  const taken = takenFlags();
  if (!taken.length) return true;
  const { isConfirmed } = await Swal.fire({
    ...CUENTA_SWAL,
    customClass: { ...CUENTA_SWAL.customClass, popup: "cuenta-swal cuenta-swal-centered" },
    icon: "question",
    iconHtml: '<i class="mdi mdi-bank-plus"></i>',
    titleText: "¿Agregar otra cuenta bancaria?",
    html: `<div class="cuenta-swal-info"><i class="mdi mdi-information-outline"></i>
      <span>Ya existe una cuenta asignada para ${taken.map(flagHtml).join(" y ")}.</span></div>
      <p class="cuenta-swal-note">¿Deseas permitir una cuenta adicional?</p>`,
    confirmButtonText: mode.value === "nuevo" ? "Agregar cuenta" : "Guardar cambios",
  });
  return isConfirmed;
}

async function submit() {
  if (saving.value || !(await form.value!.validate()).valid) return;
  if (await allowsExtraAccount()) await save();
}

onMounted(async () => {
  await load();
  await store.loadCatalogosCuenta();
});
</script>

<template>
  <v-card
    class="cuentas-card px-5"
    elevation="2"
  >
    <div class="cuentas-toolbar">
      <v-text-field
        v-model="search"
        class="cuentas-search"
        prepend-inner-icon="mdi-magnify"
        label="Buscar cuenta"
        variant="outlined"
        density="compact"
        single-line
        hide-details
        clearable
      />
      <v-spacer />
      <v-btn
        class="cuentas-filter-button"
        variant="flat"
        prepend-icon="mdi-filter-outline"
        @click="filterDrawer = true"
      >
        Filtrar
      </v-btn>
      <v-btn
        v-if="canCreate"
        class="cuentas-new-button"
        color="#075ae0"
        prepend-icon="mdi-plus"
        @click="openDialog('nuevo')"
      >
        Nueva Cuenta
      </v-btn>
    </div>

    <v-data-table
      class="cuentas-table mb-4"
      :headers="headers"
      :items="cuentasListado"
      item-value="id"
      :search="search"
      :loading="loading"
      loading-text="Cargando cuentas bancarias…"
      no-data-text="Aún no hay cuentas bancarias registradas."
      hover
    >
      <template
        v-for="key in FLAG_KEYS"
        :key="key"
        #[`header.${key}`]="{ column }"
      >
        <span class="d-inline-flex align-center ga-1">
          {{ column.title }}
          <v-tooltip
            :text="HINTS[key]"
            location="top"
          >
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                icon="mdi-information-outline"
                size="18"
                color="primary"
              />
            </template>
          </v-tooltip>
        </span>
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-btn
            class="cuenta-action cuenta-action-view"
            variant="flat"
            size="small"
            icon="mdi-eye"
            :aria-label="`Ver ${item.nrocuenta}`"
            @click="openDialog('ver', item)"
          />
          <v-btn
            v-if="canEdit"
            class="cuenta-action cuenta-action-edit"
            variant="flat"
            size="small"
            icon="mdi-pencil"
            :aria-label="`Editar ${item.nrocuenta}`"
            @click="openDialog('editar', item)"
          />
          <v-btn
            v-if="canDelete && item.status == 1"
            class="cuenta-action cuenta-action-delete"
            variant="flat"
            size="small"
            icon="mdi-delete"
            :aria-label="`Eliminar ${item.nrocuenta}`"
            @click="remove(item)"
          />
        </div>
      </template>

      <template #[`item.nrocci`]="{ item }">
        {{ item.nrocci || "" }}
      </template>

      <template #[`item.coin_acronym`]="{ item }">
        <span class="moneda">{{ item.coin_acronym }}</span>
      </template>

      <template
        v-for="key in FLAG_KEYS"
        :key="key"
        #[`item.${key}`]="{ item }"
      >
        <v-chip
          size="small"
          variant="flat"
          class="flag-chip font-weight-bold"
          :color="item[key] ? 'green-darken-1' : 'grey'"
          :prepend-icon="item[key] ? 'mdi-check-circle' : undefined"
        >
          {{ item[key] ? "Sí" : "No" }}
        </v-chip>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          size="small"
          :color="item.status == 1 ? 'success' : 'grey'"
          :prepend-icon="item.status == 1 ? 'mdi-check-circle' : 'mdi-close-circle'"
        >
          {{ item.status == 1 ? "Activo" : "Inactivo" }}
        </v-chip>
      </template>
    </v-data-table>

    <v-navigation-drawer
      v-model="filterDrawer"
      location="right"
      temporary
      width="380"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar cuentas
        </v-list-item-title>
      </v-list-item>
      <v-container class="d-flex flex-column ga-2">
        <v-autocomplete
          id="filtro-banco"
          v-model="filters.id_bank"
          :items="bancosOpciones"
          item-title="name"
          item-value="id"
          label="Banco"
          clearable
        />
        <v-text-field
          v-model="filters.nrocuenta"
          label="Nro Cuenta"
          clearable
        />
        <v-text-field
          v-model="filters.nrocci"
          label="CCI"
          clearable
        />
        <v-autocomplete
          v-model="filters.id_coin"
          :items="monedasOpciones"
          item-title="acronym"
          item-value="id"
          label="Moneda"
          clearable
        />
        <div class="text-label-large">
          Facturación a Clientes
        </div>
        <v-radio-group
          v-model="filters.esprincipalflag"
          inline
          density="compact"
          hide-details
        >
          <v-radio
            v-for="option in FLAG_OPTIONS"
            :key="option.label"
            :label="option.label"
            :color="option.color"
            :value="option.value"
          />
        </v-radio-group>
        <div class="text-label-large">
          Aviso de Llegada
        </div>
        <v-radio-group
          v-model="filters.esavisollegada"
          inline
          density="compact"
          hide-details
        >
          <v-radio
            v-for="option in FLAG_OPTIONS"
            :key="option.label"
            :label="option.label"
            :color="option.color"
            :value="option.value"
          />
        </v-radio-group>
        <div class="text-label-large">
          Estado
        </div>
        <v-radio-group
          v-model="filters.status"
          inline
          density="compact"
          hide-details
        >
          <v-radio
            v-for="option in STATUS_OPTIONS"
            :key="option.label"
            :label="option.label"
            :color="option.color"
            :value="option.value"
          />
        </v-radio-group>
      </v-container>
      <v-card-actions class="justify-end px-4">
        <v-btn
          color="success"
          variant="flat"
          @click="applyFilters"
        >
          Aceptar
        </v-btn>
        <v-btn @click="clearFilters">
          Limpiar
        </v-btn>
        <v-btn
          color="warning"
          @click="filterDrawer = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="dialog"
      class="cuenta-drawer"
      location="right"
      temporary
      width="420"
    >
      <v-form
        ref="form"
        :readonly="viewing"
        @submit.prevent="submit"
      >
        <v-card flat>
          <v-card-title class="text-headline-small pt-5 px-6">
            {{ dialogTitle }}
          </v-card-title>
          <v-card-text class="px-6">
            <v-autocomplete
              id="cuenta-banco"
              v-model="draft.id_bank"
              :items="bancosOpciones"
              item-title="name"
              item-value="id"
              label="Banco"
              :rules="required"
            />
            <v-text-field
              id="cuenta-nrocuenta"
              v-model="draft.nrocuenta"
              label="Nro Cuenta"
              :rules="required"
            />
            <v-text-field
              id="cuenta-nrocci"
              v-model="draft.nrocci"
              label="CCI"
            />
            <v-autocomplete
              id="cuenta-moneda"
              v-model="draft.id_coin"
              :items="monedasOpciones"
              item-title="acronym"
              item-value="id"
              label="Moneda"
              :rules="required"
            />
            <v-switch
              v-model="draft.esavisollegada"
              color="success"
              density="compact"
              hide-details
              label="Aviso de Llegada"
            />
            <v-switch
              v-model="draft.esprincipalflag"
              color="success"
              density="compact"
              hide-details
              label="Facturación a Clientes"
            />
            <v-switch
              v-if="mode !== 'nuevo'"
              v-model="draft.status"
              color="success"
              density="compact"
              hide-details
              :true-value="1"
              :false-value="0"
              :label="draft.status == 1 ? 'Activo' : 'Inactivo'"
            />
            <v-alert
              v-if="serverError"
              type="warning"
              variant="tonal"
              class="mt-4"
              :text="serverError"
            />
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn
              variant="text"
              @click="dialog = false"
            >
              {{ viewing ? "Cerrar" : "Cancelar" }}
            </v-btn>
            <v-btn
              v-if="!viewing"
              type="submit"
              color="success"
              variant="flat"
              :loading="saving"
            >
              {{ mode === "nuevo" ? "Crear cuenta" : "Guardar cambios" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-navigation-drawer>
  </v-card>
</template>

<style scoped>
.cuentas-card {
  border-radius: 18px;
}

.cuentas-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 4px 16px;
}

.cuentas-search {
  flex: 0 1 400px;
  min-width: 220px;
}

.cuentas-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.cuentas-filter-button {
  color: #17448e;
  background-color: #e8f0fe;
}

.cuentas-new-button {
  font-weight: 600;
}

.cuentas-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}

.cuentas-table :deep(thead th) {
  color: #14264e;
  background-color: #e8effb !important;
  font-weight: 700 !important;
  font-size: 0.95rem;
}

.cuentas-table :deep(tbody tr:nth-of-type(even)) {
  background-color: #f5f7fb;
}

.cuentas-table :deep(tbody td) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  font-size: 0.95rem;
}

.cuenta-action {
  border-radius: 9px;
}

.cuenta-action-view {
  color: #0758b8 !important;
  background-color: #e8efff !important;
}

.cuenta-action-edit {
  color: #ad5700 !important;
  background-color: #fff3da !important;
}

.cuenta-action-delete {
  color: #bd2424 !important;
  background-color: #ffebeb !important;
}

.moneda {
  display: inline-block;
  min-width: 96px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);
}

.flag-chip {
  min-width: 68px;
  justify-content: center;
  border-radius: 999px;
}
</style>

<style>
.cuenta-swal {
  border-radius: 18px;
  padding: 28px 28px 24px;
}

.cuenta-swal .cuenta-swal-title {
  padding: 0;
  color: #0f1b33;
  font-size: 1.7rem;
  font-weight: 800;
  text-align: left;
}

.cuenta-swal .cuenta-swal-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto 16px;
  border: 0;
  color: #0b6fa4;
  background-color: #e3f0fb;
}

.cuenta-swal .cuenta-swal-icon .swal2-icon-content {
  font-size: 2.6rem;
}

.cuenta-swal.cuenta-swal-centered .cuenta-swal-title {
  font-size: 1.55rem;
  text-align: center;
}

.cuenta-swal .cuenta-swal-body {
  margin: 14px 0 0;
  padding: 0;
  color: #1d2b44;
  font-size: 1.1rem;
  text-align: left;
}

.cuenta-swal-flag {
  color: #0b6fa4;
}

.cuenta-swal-note {
  margin-top: 14px;
  color: #6b7a90;
  font-size: 0.98rem;
}

.cuenta-swal-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background-color: #e6f2fc;
}

.cuenta-swal-info .mdi {
  color: #0b6fa4;
  font-size: 1.6rem;
}

.cuenta-swal-info + .cuenta-swal-note {
  text-align: center;
}

.cuenta-swal .cuenta-swal-actions {
  flex-wrap: nowrap;
  justify-content: stretch;
  gap: 16px;
  width: 100%;
  margin: 24px 0 0;
  padding: 20px 0 0;
  border-top: 1px solid #e3e8ef;
}

.cuenta-swal .cuenta-swal-cancel,
.cuenta-swal .cuenta-swal-confirm {
  display: inline-flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  margin: 0;
  padding: 0 24px;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: normal;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.cuenta-swal .cuenta-swal-cancel {
  border: 1px solid #b7c0cc;
  color: #1d2b44;
  background-color: #fff;
}

.cuenta-swal .cuenta-swal-cancel:hover {
  border-color: #8a96a8;
  background-color: #f5f7fa;
}

.cuenta-swal .cuenta-swal-confirm {
  border: 1px solid #0b6fa4;
  color: #fff;
  background-color: #0b6fa4;
}

.cuenta-swal .cuenta-swal-confirm:hover {
  background-color: #095c88;
}

.cuenta-swal .cuenta-swal-cancel:focus-visible,
.cuenta-swal .cuenta-swal-confirm:focus-visible {
  outline: 3px solid rgba(11, 111, 164, 0.35);
  outline-offset: 2px;
}

.cuenta-swal-confirm .mdi {
  font-size: 1.3rem;
  line-height: 1;
}
</style>
