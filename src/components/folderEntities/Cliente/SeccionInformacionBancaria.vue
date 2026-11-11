<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useCoinsStore } from "@/stores/coins";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useBankStore } from "@/stores/bank";
import type { InformacionBancaria } from "@/types/entidades";
import { removeRow } from "../removeRow";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import ClienteCard from "./ClienteCard.vue";
import "./clienteCards.css";

// Inside Ver Cliente the screen's header holds the Editar/Guardar buttons, so `embedded` hides this section's own.
const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const appStore = useAppStore();
const editAllowed = entityEditAllowed("listClientes");
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

const headersInformacionBancaria1 = [
  { title: "Nro de Cuenta", key: "nrocuenta" },
  { title: "CCI", key: "cci" },
  { title: "Banco", key: "banco" },
  { title: "Moneda", key: "moneda" },
  { title: "Acciones", key: "action" },
] as const;
const headersInformacionBancaria2 = [
  { title: "Nro de Cuenta", key: "nrocuenta" },
  { title: "CCI", key: "cci" },
  { title: "Banco", key: "banco" },
  { title: "Moneda", key: "moneda" },
  { title: "Nro. de Swift", key: "swift" },
  { title: "Banco Intermediario", key: "intermediario" },
  {
    title: "Nro Cuenta de Banco Intermediario",
    key: "cuenta_intermediario",
  },
  { title: "Acciones", key: "action" },
] as const;
const formInformacionBancaria = useTemplateRef("formInformacionBancaria");

const isFormReadonly = computed(() => {
  return entitiesStore.isReadonly;
});
const showFormActions = computed(() => {
  return !entitiesStore.isReadonly;
});
const showNavigationButtons = computed(() => {
  return !(
    entitiesStore.isEdit ||
    entitiesStore.isReadonly
  );
});
const showOwnEditButton = computed(() => !props.embedded && !showNavigationButtons.value && editAllowed);
// International clients also give the SWIFT and intermediary bank; Acciones only exists while editing.
const visibleHeaders = computed(() => {
  const headers = isInternacional() ? headersInformacionBancaria2 : headersInformacionBancaria1;
  return showFormActions.value ? headers : headers.filter((header) => header.key !== "action");
});

function bankName(id: unknown) {
  return (bankStore.list as { id: number; name: string }[]).find((bank) => bank.id == id)?.name ?? "";
}
function coinAcronym(id: unknown) {
  return (coinsStore.itemsCoinsList as { id: number; acronym: string }[]).find((coin) => coin.id == id)?.acronym ?? "";
}

watch(
  () => entitiesStore.isStep4Valid,
  async (newValue) => {
    if (!newValue) {
      await formInformacionBancaria.value!.validate();
    }
  },
  { immediate: true },
);

function isInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v) =>
      v.codigo == "02" &&
      v.id == entitiesStore.cliente.id_tipotransaccion,
  );

  return val;
}
function agregarCuentaBancaria() {
  entitiesStore.lstInformacionBancaria.push({
    nro_cuenta: "",
    cci: "",
    id_banco: "",
    id_coins: "",
    nro_swift: "",
    id_intermediario: "",
    nro_cuenta_intermediario: "",
  });
}
function eliminarInformacionBancaria(row: InformacionBancaria) {
  removeRow(entitiesStore.lstInformacionBancaria, row);
}
async function validarFormulario() {
  let ok = true;
  if (entitiesStore.lstInformacionBancaria.length > 0) {
    if (!(await formInformacionBancaria.value!.validate()).valid) {
      ok = false;
    }
  }

  if (ok) {
    entitiesStore.stepper = 5;
  }
}
async function modificarCliente() {
  if (isFormReadonly.value) {
    if (!(await entitiesStore.approveClientEdit(entitiesStore.cliente.id!))) return;
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  appStore.spiner = true;
  const saved = await entitiesStore.actualizarCliente();
  appStore.spiner = false;
  if (!saved) return;
  appStore.recargarClienteFlag =
    !appStore.recargarClienteFlag;
  appStore.modalEntitie = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}

// Inside the client card, its Continuar runs this step's checks (they move on to the next step when they pass).
defineExpose({ validarFormulario });
</script>

<template>
  <div class="cli-section">
    <div
      v-if="showOwnEditButton"
      class="d-flex justify-end mb-3"
    >
      <v-btn
        class="cli-add-btn"
        variant="outlined"
        prepend-icon="mdi-pencil-outline"
        @click="modificarCliente"
      >
        {{ isFormReadonly ? "Editar Cliente" : "Guardar Cambios" }}
      </v-btn>
    </div>

    <ClienteCard
      title="Información Bancaria"
      icon="mdi-bank-outline"
    >
      <template
        v-if="showFormActions"
        #actions
      >
        <v-btn
          color="#1a5fd0"
          variant="flat"
          prepend-icon="mdi-plus"
          class="text-none font-weight-bold"
          @click="agregarCuentaBancaria()"
        >
          Agregar Cuenta
        </v-btn>
      </template>
      <v-form
        ref="formInformacionBancaria"
        :readonly="isFormReadonly"
      >
        <v-data-table
          :headers="visibleHeaders"
          :items="entitiesStore.lstInformacionBancaria"
          class="cli-table"
          item-value="index"
          density="comfortable"
          items-per-page-text="Items por página:"
          no-data-text="Sin cuentas bancarias registradas."
          disable-sort
        >
          <template #[`item.nrocuenta`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.nro_cuenta"
              aria-label="Nro de Cuenta"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[(v) => !!v || 'Dato Requerido']"
              placeholder="Nro Cuenta"
            />
            <template v-else>
              {{ item.nro_cuenta }}
            </template>
          </template>
          <template #[`item.cci`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.cci"
              aria-label="CCI"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[(v) => !!v || 'Dato Requerido']"
              placeholder="CCI"
            />
            <template v-else>
              {{ item.cci }}
            </template>
          </template>
          <template #[`item.banco`]="{ item }">
            <v-autocomplete
              v-if="showFormActions"
              v-model="item.id_banco"
              aria-label="Banco"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :items="bankStore.list"
              item-title="name"
              item-value="id"
              placeholder="Bancos"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <span
              v-else
              class="font-weight-bold"
            >{{ bankName(item.id_banco) }}</span>
          </template>
          <template #[`item.moneda`]="{ item }">
            <v-autocomplete
              v-if="showFormActions"
              v-model="item.id_coins"
              aria-label="Moneda"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :items="coinsStore.itemsCoinsList"
              item-title="acronym"
              item-value="id"
              placeholder="Monedas"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-chip
              v-else-if="coinAcronym(item.id_coins)"
              class="cli-chip-coin"
              size="small"
              variant="flat"
            >
              {{ coinAcronym(item.id_coins) }}
            </v-chip>
          </template>
          <template #[`item.swift`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.nro_swift"
              aria-label="Nro. de Swift"
              density="compact"
              variant="outlined"
              hide-details="auto"
              placeholder="Nro swift"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ item.nro_swift }}
            </template>
          </template>
          <template #[`item.intermediario`]="{ item }">
            <v-autocomplete
              v-if="showFormActions"
              v-model="item.id_intermediario"
              aria-label="Banco Intermediario"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :items="bankStore.list"
              item-title="name"
              item-value="id"
              placeholder="Bancos"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ bankName(item.id_intermediario) }}
            </template>
          </template>
          <template #[`item.cuenta_intermediario`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.nro_cuenta_intermediario"
              aria-label="Nro Cuenta de Banco Intermediario"
              density="compact"
              variant="outlined"
              hide-details="auto"
              placeholder="Cuenta Intermediario"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ item.nro_cuenta_intermediario }}
            </template>
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              class="cli-row-delete"
              variant="flat"
              size="small"
              icon="mdi-delete-outline"
              aria-label="Eliminar cuenta"
              @click="eliminarInformacionBancaria(item)"
            />
          </template>
        </v-data-table>
      </v-form>
    </ClienteCard>

    <div
      v-if="showNavigationButtons && !embedded"
      class="d-flex mt-4"
    >
      <v-btn
        color="primary"
        @click="entitiesStore.stepper--"
      >
        Regresar
      </v-btn>
      <v-btn
        color="primary"
        class="ml-auto"
        @click="validarFormulario"
      >
        Continuar
      </v-btn>
    </div>
  </div>
</template>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
