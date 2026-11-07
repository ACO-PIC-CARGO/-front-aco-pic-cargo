<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useBankStore } from "@/stores/bank";
import type { BancoFila, FiltroBancos } from "@/types/finanzas";
import type {
  BancoFilaConCuentas,
  CuentaBancoDetalle,
  RegistroBancoEditable,
} from "@/types/banksProveedor";
import { usePermissions } from "@/composables/usePermissions";

const appStore = useAppStore();
const { can } = usePermissions();
const bankStore = useBankStore();
const frmCuenta = useTemplateRef("frmCuenta");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

const datosBanco = ref<BancoFilaConCuentas | null>(null);
const expandedBanks = ref<string[]>([]);
type OrdenCuenta = { key: string; order?: "asc" | "desc" | false };
const ordenPrincipal: OrdenCuenta = { key: "esprincipalflag", order: "desc" };
const ordenesCuenta = ref<Record<string, OrdenCuenta[]>>({});
const cuentaFlag = ref(false);
const cuenta = ref<CuentaBancoDetalle>("" as unknown as CuentaBancoDetalle);
const headersCuenta = [
  { title: "Nro Cuenta", key: "nrocuenta", width: "28%" },
  { title: "CCI", key: "nrocci", width: "29%" },
  { title: "Moneda", key: "coins", width: "14%" },
  { title: "Cuenta Principal", key: "esprincipalflag", width: "16%", align: "center" as const, sortable: false },
  { title: "Acciones", key: "action", width: "13%", align: "end" as const, sortable: false },
];
const headers = [
  { title: "Acciones", key: "action", align: "start" as const, sortable: false },
  { title: "Código", align: "start" as const, key: "code" },
  { title: "Acrónimo", key: "acronym" },
  { title: "Nombre", key: "name" },
  // { title: "Descripción", key: "description" },
  { title: "Cuenta Principal", key: "primary_account" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "", key: "vercuentas", sortable: false },
  { title: "", key: "nuevacuentas", sortable: false },
];
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroBancos>({
  code: "",
  name: "",
  acronym: "",
  description: "",
  status: 1,
});
const emptyRecord = (): RegistroBancoEditable => ({
  acronym: "",
  name: "",
  description: "",
  status: 1,
});
const record = ref<RegistroBancoEditable>(emptyRecord());
const saving = ref(false);
const originalRecords = ref<FiltroBancos>({} as FiltroBancos);
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | string>("");

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
function bancoActivo(item: BancoFila): boolean {
  return item.status === 1 || item.status === true || item.status === "1";
}
function abrirCuentas(item: BancoFila) {
  datosBanco.value = { ...item } as BancoFilaConCuentas;
  const key = String(item.id);
  const index = expandedBanks.value.indexOf(key);
  if (index >= 0) {
    expandedBanks.value.splice(index, 1);
  } else {
    expandedBanks.value.push(key);
  }
}
function bankRowProps({ item }: { item: BancoFila }) {
  return { class: { "bank-row-expanded": item.id != null && expandedBanks.value.includes(String(item.id)) } };
}
function cuentasBanco(item: BancoFila): CuentaBancoDetalle[] {
  return (item.banks_details ?? []).filter(
    (detail): detail is CuentaBancoDetalle => typeof detail === "object" && detail !== null,
  );
}
function esCuentaPrincipal(flag: unknown): boolean {
  return flag === true || flag === 1 || flag === "1";
}
function ordenarIndicadorPrincipal(a: unknown, b: unknown): number {
  return Number(esCuentaPrincipal(a)) - Number(esCuentaPrincipal(b));
}
function ordenCuenta(id: BancoFila["id"]): OrdenCuenta[] {
  return ordenesCuenta.value[String(id)] ?? [ordenPrincipal];
}
function actualizarOrdenCuenta(id: BancoFila["id"], sortBy: OrdenCuenta[]) {
  const secundarios = sortBy.filter((sort) => sort.key !== "esprincipalflag");
  ordenesCuenta.value[String(id)] = [ordenPrincipal, ...secundarios.slice(-1)];
}
function tieneCuentaPrincipal(item: BancoFila): boolean {
  if (!Array.isArray(item.banks_details)) return false;
  return item.banks_details.some((detail) => {
    if (
      typeof detail !== "object" ||
      detail === null ||
      !("esprincipalflag" in detail)
    )
      return false;
    return esCuentaPrincipal(detail.esprincipalflag);
  });
}
function abrirCuenta(item: CuentaBancoDetalle) {
  cuentaFlag.value = true;
  cuenta.value = { ...item };
}
function abrirNuevaCuenta(item: BancoFila) {
  datosBanco.value = { ...item } as BancoFilaConCuentas;
  cuentaFlag.value = true;
  cuenta.value = {
    id: "",
    id_bank: datosBanco.value!.id,
    id_coin: "",
    nrocci: "",
    nrocuenta: "",
    status: "",
    trial438: "",
    uptated_at: "",
  };
}
async function guardarCuenta() {
  let val = false;
  let namePrincipal = "";
  if (cuenta.value.esprincipalflag) {
    bankStore.list.forEach((element) => {
      (element.banks_details as CuentaBancoDetalle[]).forEach((element2) => {
        if (element2.esprincipalflag && element2.id != cuenta.value.id) {
          val = true;
          namePrincipal = element.name + " - " + element2.nrocuenta;
        }
      });
    });
    if (val) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Ya existe una cuenta principal. ${namePrincipal}. Actualice`,
      });
      return;
    }
  }
  if ((await frmCuenta.value!.validate()).valid) {
    cuenta.value.status =
      cuenta.value.status == 0 || cuenta.value.status == false ? 0 : 1;
    await bankStore.guardarCuentaDetalle(cuenta.value);
    cuentaFlag.value = false;
  }
}
async function insert() {
  if (saving.value) return;
  saving.value = true;
  try {
    if ((await formNew.value!.validate()).valid) {
      resetRecord("filter");
      if (await bankStore.insertBank(record.value))
        showFilterDrawerNew.value = false;
    }
  } finally {
    saving.value = false;
  }
}
async function EliminarCuenta(item: CuentaBancoDetalle) {
  const active = item.status == 1;
  Swal.fire({
    icon: "question",
    title: ``,
    text: `¿Quieres ${active ? "eliminar" : "activar"} la cuenta ${
      item.nrocuenta
    }?`,
    showDenyButton: true,
    denyButtonText: "Cancelar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      await bankStore.eliminarCuentaDetalle({
        ...item,
        status: active ? 0 : 1,
      });
    }
  });
  //
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function reset_records() {
  resetRecord("filter");
  filter();
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = emptyRecord();
  }
  // await this.fetchDataBank(this.records);
  showFilterDrawer.value = false;
}
async function switch_status(item: BancoFila) {
  const active = bancoActivo(item);
  Swal.fire({
    title: "¿Estás seguro?",
    text: active
      ? "Si inactiva el registro, este no aparecerá disponible en otros formularios. ¿Está seguro de que desea inactivarlo?"
      : "¿Está seguro de que desea activar este banco?",
    confirmButtonColor: active ? "red" : "green",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: active ? "Sí, inactivar" : "Sí, activar",
    cancelButtonColor: "orange",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      resetRecord("filter");
      await bankStore.updateBank({ ...item, status: active ? 0 : 1 });
    }
  });
}
function open_read(id: BancoFila["id"]) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  bankStore.readBank(id!);
}
async function open_update(idBanco: BancoFila["id"]) {
  loading_as.value = true;
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await bankStore.readBank(idBanco!);
  id.value = idBanco!;
}
async function submit_update() {
  if (saving.value) return;
  saving.value = true;
  try {
    if ((await form.value!.validate()).valid) {
      const data = {
        id: id.value,
        acronym: record.value.acronym,
        name: record.value.name,
        description: record.value.description,
        status: record.value.status,
      };
      resetRecord("filter");
      if (await bankStore.updateBank(data))
        showFilterDrawerUpdate.value = false;
    }
  } finally {
    saving.value = false;
  }
}
function open_new() {
  loading_as.value = true;
  resetForms();
  resetRecord();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;

  if (data.code === null) data.code = "";
  if (data.acronym === null) data.acronym = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";

  await bankStore.fetchDataBank(data);
  showFilterDrawer.value = false;
}
function validateAcronym(v?: string | null) {
  const maxLength = 255;
  if (!v) {
    return "El acŕonimo es requerido";
  }
  if (v.length > maxLength) {
    return `El acrónimo permite hasta ${maxLength} caracteres `;
  }
  return true;
}
function validateName(v?: string | null) {
  const maxLength = 255;
  if (!v) {
    return "El nombre es requerido";
  }
  if (v.length > maxLength) {
    return `El nombre permite hasta ${maxLength} caracteres `;
  }
  return true;
}
function validateDescription(v?: string | null) {
  const maxLength = 255;
  return v && v.length > maxLength
    ? `La descripción permite hasta ${maxLength} caracteres`
    : true;
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}

watch(
  () => bankStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, acronym, name, description, status } = newRecord;
      record.value = {
        code,
        acronym,
        name,
        description,
        status,
      } as RegistroBancoEditable;
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => bankStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

originalRecords.value = { ...records.value };
onMounted(async () => {
  appStore.mainTitle = `Banco`;
  await Promise.all([
    bankStore.fetchDataBank(records.value),
    (appStore._getCoinsList as (records: unknown) => Promise<void>)(
      records.value,
    ),
  ]);
});
</script>

<template>
  <v-card class="bank-list-card px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-card-title
        v-if="!loading"
        class="bank-list-toolbar d-flex align-center flex-wrap"
      >
        <v-text-field
          class="bank-list-search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar banco"
          variant="outlined"
          density="compact"
          single-line
          hide-details
          clearable
          v-model="search"
        />
        <v-spacer />
        <v-btn
          class="bank-filter-button"
          variant="flat"
          prepend-icon="mdi-filter-outline"
          @click="open_filter()"
        >
          Filtrar
        </v-btn>
        <v-btn
          v-if="can('bankList', 'NUEVO')"
          class="bank-new-button"
          color="#075ae0"
          prepend-icon="mdi-plus"
          @click="open_new()"
        >
          Nuevo Banco
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="bank-list-table"
        :headers="headers"
        :items="bankStore.list"
        :item-value="(item: BancoFila) => String(item.id)"
        :search="search"
        :items-per-page="10"
        :row-props="bankRowProps"
        v-model:expanded="expandedBanks"
      >
        <template #[`item.status`]="{ item }">
          <v-chip
            size="small"
            :color="bancoActivo(item) ? 'success' : 'grey'"
            :prepend-icon="bancoActivo(item) ? 'mdi-check-circle' : 'mdi-close-circle'"
          >
            {{ bancoActivo(item) ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>
        <template #[`item.primary_account`]="{ item }">
          {{
            tieneCuentaPrincipal(item)
              ? "Cuenta principal para Control de Gastos"
              : ""
          }}
        </template>
        <template #[`item.action`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              class="bank-action bank-action-view"
              variant="flat"
              size="small"
              icon="mdi-eye"
              color="primary"
              aria-label="Ver banco"
              @click="open_read(item.id)"
            />
            <v-btn
              v-if="can('bankList', 'MODIFICAR')"
              class="bank-action bank-action-edit"
              variant="flat"
              size="small"
              icon="mdi-pencil"
              color="warning"
              aria-label="Modificar banco"
              @click="open_update(item.id)"
            />
            <v-btn
              class="bank-action bank-action-delete"
              variant="flat"
              color="error"
              size="small"
              :icon="bancoActivo(item) ? 'mdi-delete' : 'mdi-check'"
              :aria-label="bancoActivo(item) ? 'Inactivar banco' : 'Activar banco'"
              @click="switch_status(item)"
              v-if="can('bankList', 'ELIMINAR')"
            />
          </div>
        </template>
        <template #[`item.vercuentas`]="{ item }">
          <v-btn
            v-if="item.banks_details?.length"
            class="bank-accounts-button"
            variant="outlined"
            size="small"
            :append-icon="
              expandedBanks.includes(String(item.id))
                ? 'mdi-chevron-up'
                : 'mdi-chevron-down'
            "
            :aria-label="
              expandedBanks.includes(String(item.id))
                ? 'Ocultar cuentas'
                : 'Ver cuentas'
            "
            @click="abrirCuentas(item)"
          >
            {{
              expandedBanks.includes(String(item.id))
                ? "Ocultar Cuentas"
                : "Ver Cuentas"
            }}
          </v-btn>
          <v-chip
            v-else
            size="small"
            color="grey"
          >
            Sin cuentas
          </v-chip>
        </template>
        <template #[`item.nuevacuentas`]="{ item }">
          <v-btn
            v-if="can('bankList', 'NUEVO')"
            color="success"
            size="small"
            prepend-icon="mdi-plus"
            aria-label="Nueva cuenta"
            @click="abrirNuevaCuenta(item)"
          >
            Nueva Cuenta
          </v-btn>
        </template>
        <template #expanded="{ item }">
          <div class="bank-account-detail">
            <v-data-table
              :headers="headersCuenta"
              :items="cuentasBanco(item)"
              item-value="id"
              density="compact"
              :items-per-page="-1"
              :sort-by="ordenCuenta(item.id)"
              :custom-key-sort="{ esprincipalflag: ordenarIndicadorPrincipal }"
              @update:sort-by="actualizarOrdenCuenta(item.id, $event)"
              hide-default-footer
            >
              <template #[`item.coins`]="{ item: account }">
                <v-autocomplete
                  :items="appStore.itemsCoinsList"
                  v-model="account.id_coin"
                  item-title="acronym"
                  item-value="id"
                  readonly
                  density="compact"
                />
              </template>
              <template #[`item.action`]="{ item: account }">
                <div class="d-flex ga-1 justify-end">
                  <v-btn
                    v-if="can('bankList', 'MODIFICAR')"
                    class="bank-action bank-action-edit"
                    variant="flat"
                    size="small"
                    icon="mdi-pencil"
                    color="warning"
                    aria-label="Editar cuenta"
                    @click="abrirCuenta(account)"
                  />
                  <v-btn
                    v-if="can('bankList', 'ELIMINAR')"
                    class="bank-action bank-action-delete"
                    variant="flat"
                    size="small"
                    color="error"
                    :icon="account.status == 1 ? 'mdi-delete' : 'mdi-check'"
                    :aria-label="
                      account.status == 1
                        ? 'Eliminar cuenta'
                        : 'Activar cuenta'
                    "
                    @click="EliminarCuenta(account)"
                  />
                </div>
              </template>
              <template #[`item.esprincipalflag`]="{ item: account }">
                <v-chip
                  size="small"
                  :color="esCuentaPrincipal(account.esprincipalflag) ? 'primary' : 'grey'"
                >
                  {{ esCuentaPrincipal(account.esprincipalflag) ? "Sí" : "No" }}
                </v-chip>
              </template>
            </v-data-table>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Banco
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                lazy-validation
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            :loading="saving"
            @click="insert()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerNew = !showFilterDrawerNew"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Ver: {{ bankStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="bankStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="bankStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              readonly
              :model-value="bankStore.record.acronym"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="bankStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!bankStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="bankStore.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      location="right"
      temporary
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Modificar: {{ bankStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="record.code"
              readonly
            />
          </v-row>

          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                lazy-validation
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              />
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              label="Activo / Inactivo"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            :loading="saving"
            @click="submit_update"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      location="right"
      temporary
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar Registros
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field label="Código" v-model="records.code" clearable />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              v-model="records.acronym"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field label="Nombre" v-model="records.name" clearable />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group v-model="records.status" inline density="compact">
              <v-radio label="Activo" color="green" :value="1" />
              <v-radio label="Inactivo" color="red" :value="0" />
              <v-radio label="Todos" color="blue" value="null" />
            </v-radio-group>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()">
            Aceptar
          </v-btn>
          <v-btn class="mx-1" color="ligth" @click="resetRecord('filter')">
            Limpiar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-dialog v-model="cuentaFlag" scrollable persistent width="500">
      <v-card v-if="cuenta">
        <v-card-title>
          {{
            cuenta.id ? `Editar Cuenta: ${cuenta.nrocuenta}` : "Nueva Cuenta"
          }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCuenta">
            <v-autocomplete
              :items="appStore.itemsCoinsList"
              v-model="cuenta.id_coin"
              item-title="acronym"
              item-value="id"
              label="Moneda"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field
              label="Nro Cuenta"
              v-model="cuenta.nrocuenta"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field label="CCI" v-model="cuenta.nrocci" />

            <v-checkbox
              v-if="cuenta.id"
              :label="cuenta.status == 1 ? 'Activo' : 'Inactivo'"
              v-model="cuenta.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
            <!-- v-if="cuenta.id" -->
            <v-switch
              color="success"
              density="compact"
              hide-details
              label="Usar en FACTURACIÓN DE CONTROL DE GASTOS"
              v-model="cuenta.esprincipalflag"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn sm color="success" @click="guardarCuenta()"> Guardar </v-btn>
          <v-btn sm color="danger" @click="cuentaFlag = !cuentaFlag">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.bank-list-card {
  border-radius: 18px;
}

.bank-list-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 4px 16px;
}

.bank-list-search {
  flex: 0 1 400px;
  min-width: 220px;
}

.bank-list-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.bank-filter-button {
  color: #17448e;
  background-color: #e8f0fe;
}

.bank-new-button {
  font-weight: 600;
}

.bank-list-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}

.bank-list-table :deep(> .v-table__wrapper > table > thead) {
  color: #14264e;
  background-color: #e8effb;
}

.bank-list-table :deep(> .v-table__wrapper > table > tbody > tr:not(.v-data-table__tr--expanded):not(.bank-row-expanded):nth-of-type(4n + 3)) {
  background-color: #f5f7fb;
}

.bank-list-table :deep(> .v-table__wrapper > table > tbody > tr.bank-row-expanded) {
  background-color: #e8f0fe;
}

.bank-list-table :deep(> .v-table__wrapper > table > tbody > tr.v-data-table__tr--expanded:not(:has(.bank-account-detail))) {
  display: none;
}

.bank-list-table :deep(> .v-table__wrapper > table > tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.bank-list-table :deep(> .v-table__wrapper > table > tbody > tr.v-data-table__tr--expanded > td) {
  padding: 0;
}

.bank-action {
  border-radius: 9px;
}

.bank-action-view {
  color: #0758b8 !important;
  background-color: #e8efff !important;
}

.bank-action-edit {
  color: #ad5700 !important;
  background-color: #fff3da !important;
}

.bank-action-delete {
  color: #bd2424 !important;
  background-color: #ffebeb !important;
}

.bank-accounts-button {
  min-width: 145px;
  border-color: #cad9f3;
  color: #173a76;
  text-transform: none;
  letter-spacing: normal;
}

.bank-account-detail {
  margin: 12px 16px 16px;
  overflow: hidden;
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(20, 38, 78, 0.1);
}

.bank-account-detail :deep(.v-table) {
  background-color: transparent;
}

.bank-account-detail :deep(thead) {
  color: #14264e;
  background-color: #e8effb;
}

.bank-account-detail :deep(tbody) {
  background-color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .bank-list-table :deep(.v-data-table__tr--expanded *) {
    transition-duration: 0s !important;
  }
}
</style>
