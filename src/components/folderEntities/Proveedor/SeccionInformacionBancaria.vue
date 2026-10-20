<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useCoinsStore } from "@/stores/coins";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useBankStore } from "@/stores/bank";

const rootStore = useStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();

const headersInformacionBancaria1 = [
  { title: "Beneficiario", key: "beneficiario" },
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
const formProv_informacionBancaria = useTemplateRef("formProv_informacionBancaria");

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

watch(
  () => entitiesStore.isStep4Valid,
  async (newValue) => {
    if (!newValue) {
      await formProv_informacionBancaria.value!.validate();
    }
  },
  { immediate: true },
);

function validarFormulario() {
  entitiesStore.stepper = 5;
}
function isInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v) =>
      v.codigo == "02" &&
      v.id == entitiesStore.proveedor.id_tipotransaccion,
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
function eliminarInformacionBancaria(index: number) {
  entitiesStore.lstInformacionBancaria.splice(index, 1);
}
async function modificarProveedor() {
  if (isFormReadonly.value) {
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  rootStore.state.spiner = true;
  await entitiesStore.actualizarProveedor();
  rootStore.state.spiner = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}
</script>

<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      <v-spacer />
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarProveedor"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? "EDITAR PROVEEDOR" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text class="px-2">
      <div class="container-narrow">
        <v-list-subheader class="px-0">
          <b>Información Bancaria</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarCuentaBancaria()"
            >
              Agregar Cuenta
            </v-btn>
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form
              ref="formProv_informacionBancaria"
              :readonly="isFormReadonly"
            >
              <v-data-table
                :headers="
                  isInternacional()
                    ? headersInformacionBancaria2
                    : headersInformacionBancaria1
                "
                :items="entitiesStore.lstInformacionBancaria"
                class="elevation-5"
                item-value="index"
              >
                <template #[`item.beneficiario`]="{ item }">
                  <v-text-field
                    v-model="item.beneficiario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    placeholder="Beneficiario"
                  />
                </template>
                <template #[`item.nrocuenta`]="{ item }">
                  <v-text-field
                    v-model="item.nro_cuenta"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    placeholder="Nro Cuenta"
                  />
                </template>
                <template #[`item.cci`]="{ item }">
                  <v-text-field
                    v-model="item.cci"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    placeholder="CCI"
                  />
                </template>
                <template #[`item.banco`]="{ item }">
                  <v-autocomplete
                    :items="bankStore.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_banco"
                  />
                </template>
                <template #[`item.moneda`]="{ item }">
                  <v-autocomplete
                    :items="coinsStore.itemsCoinsList"
                    item-title="acronym"
                    item-value="id"
                    placeholder="Monedas"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_coins"
                  />
                </template>
                <template #[`item.swift`]="{ item }">
                  <v-text-field
                    placeholder="Nro swift"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.nro_swift"
                  />
                </template>
                <template #[`item.intermediario`]="{ item }">
                  <v-autocomplete
                    :items="bankStore.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_intermediario"
                  />
                </template>
                <template #[`item.cuenta_intermediario`]="{ item }">
                  <v-text-field
                    placeholder="Cuenta Intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.nro_cuenta_intermediario"
                  />
                </template>
                <template
                  #[`item.action`]="{ index }"
                  v-if="showFormActions"
                >
                  <v-btn
                    variant="text"
                    color="red"
                    icon
                    @click="eliminarInformacionBancaria(index)"
                  >
                    <v-icon> mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
    <v-card-actions v-if="showNavigationButtons">
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
    </v-card-actions>
  </v-card>
</template>
