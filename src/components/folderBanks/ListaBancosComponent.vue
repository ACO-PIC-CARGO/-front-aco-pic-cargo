<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useBankStore } from "@/stores/bank";
import type { BancoFila, FiltroBancos } from "@/types/finanzas";
import type {
  BancoFilaConCuentas,
  CuentaBancoDetalle,
  RegistroBancoEditable,
} from "@/types/banksProveedor";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const bankStore = useBankStore();
const frmCuenta = useTemplateRef("frmCuenta");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

const datosBanco = ref<BancoFilaConCuentas | null>(null);
const cuentasFlag = ref(false);
const cuentaFlag = ref(false);
const cuenta = ref<CuentaBancoDetalle>("" as unknown as CuentaBancoDetalle);
const headersCuenta = [
  { width: "35%", title: "Nro Cuenta", key: "nrocuenta" },
  { width: "35%", title: "CCI", key: "nrocci" },
  { width: "10%", title: "Moneda", key: "coins" },
  { width: "10%", title: "Usar Facturación", key: "esprincipalflag" },
  { width: "15%", title: "Acción", key: "action", align: "center" as const },
];
const headers = [
  { title: "Código", align: "start" as const, key: "code" },
  { title: "Acrónimo", key: "acronym" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
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
const record = ref<RegistroBancoEditable>({
  id_branch: sessionBranchId(),
  acronym: "",
  name: "",
  code: "",
  description: "",
  status: 1,
});
const originalRecord = ref<RegistroBancoEditable>({});
const originalRecords = ref<FiltroBancos>({} as FiltroBancos);
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | string>("");

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
function abrirCuentas(item: BancoFila) {
  cuentasFlag.value = true;
  datosBanco.value = { ...item } as BancoFilaConCuentas;
}
function abrirCuenta(item: CuentaBancoDetalle) {
  cuentaFlag.value = true;
  cuenta.value = { ...item };
}
function abrirNuevaCuenta() {
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
  console.log('dd')
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
  console.log('dd2')
  if ((await frmCuenta.value!.validate()).valid) {
    cuenta.value.status =
      cuenta.value.status == 0 || cuenta.value.status == false ? 0 : 1;
    await bankStore.guardarCuentaDetalle(cuenta.value);
    cuentasFlag.value = false;
    cuentaFlag.value = false;
  }
}
async function insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await bankStore.insertBank(record.value);
  }
}
async function EliminarCuenta(item: CuentaBancoDetalle) {
  Swal.fire({
    icon: "question",
    title: ``,
    text: `Desea ${item.status == 1 ? "Activar " : "Eliminar"} la cuenta ${
      item.nrocuenta
    } `,
    showDenyButton: true,
    denyButtonText: "Cancelar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      item.status = item.status == 1 ? 1 : 0;
      await bankStore.eliminarCuentaDetalle(item);
    }
    if (res.isDenied) {
      await bankStore.fetchDataBank(records.value);
    }
  });
  cuentasFlag.value = false;
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
    record.value = { ...originalRecord.value };
  }
  // await this.fetchDataBank(this.records);
  showFilterDrawer.value = false;
}
async function switch_status(item: BancoFila) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    confirmButtonColor: "red",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, inactivar",
    cancelButtonColor: "orange",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    item.status = 0;
    if (result.isConfirmed) {
      resetRecord("filter");
      await bankStore.updateBank(item);
    } else {
      item.status = !status;
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
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value,
      acronym: record.value.acronym,
      name: record.value.name,
      description: record.value.description,
      status: record.value.status,
    };
    resetRecord("filter");
    await bankStore.updateBank(data);
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

watch(() => bankStore.record, (newRecord) => {
  if (newRecord && Object.keys(newRecord).length > 0) {
    const { code, acronym, name, description, status } = newRecord;
    record.value = { code, acronym, name, description, status } as RegistroBancoEditable;
    loading_as.value = false;
  }
}, { immediate: true });
watch(() => bankStore.loading, (newList) => {
  loading.value = newList == true ? false : true;
}, { immediate: true });

originalRecord.value = { ...record.value };
originalRecords.value = { ...records.value };
onMounted(async () => {
  await bankStore.fetchDataBank(records.value);
  rootStore.state.mainTitle = `Banco`;
  await rootStore.dispatch("_getCoinsList", records.value);
});
</script>

<template>
  <v-card class="px-5">
    <v-card elevation="0">
      <v-container
        v-if="loading"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
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
        class="elevation-0 d-flex align-center flex-wrap"
      >
        <v-text-field
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        />
        <v-spacer />
        <v-btn
          size="small"
          color="success"
          @click="open_new()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="open_filter()"
        >
          Fitrar
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#004D40"
        >
          Exportar
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="bankStore.list"
        item-value="id"
        :search="search"
      >
        <template #[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            variant="text"
            class="mx-1"
            size="small"
            icon
          >
            <v-icon
              color="primary"
              @click="open_read(item.id)"
            >
              mdi-eye
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            class="mx-1"
            size="small"
            icon
          >
            <v-icon
              color="#0D47A1"
              @click="abrirCuentas(item)"
            >
              mdi-bank
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            class="mx-1"
            size="small"
            icon
          >
            <v-icon
              color="warning"
              @click="open_update(item.id)"
            >
              mdi-pencil
            </v-icon>
          </v-btn>

          <v-btn
            variant="text"
            class="mx-1"
            size="small"
            icon
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon color="red">
              mdi-delete
            </v-icon>
          </v-btn>
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

      <v-container
        v-if="loading_as"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
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

      <v-container
        v-if="loading_as"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
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
            <v-text-field
              label="Código"
              v-model="records.code"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              v-model="records.acronym"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              v-model="records.name"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="records.status"
              inline
              density="compact"
            >
              <v-radio
                label="Activo"
                color="green"
                :value="1"
              />
              <v-radio
                label="Inactivo"
                color="red"
                :value="0"
              />
              <v-radio
                label="Todos"
                color="blue"
                value="null"
              />
            </v-radio-group>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="filter()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="ligth"
            @click="resetRecord('filter')"
          >
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

    <v-dialog
      v-model="cuentasFlag"
      scrollable
      persistent
      width="80%"
    >
      <v-card v-if="datosBanco">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          {{ datosBanco.name }} {{ datosBanco.acronym }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            @click="cuentasFlag = !cuentasFlag"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersCuenta"
            :items="datosBanco.banks_details"
            class="elevation-1"
            item-value="index"
            density="compact"
            :items-per-page="5"
          >
            <template #[`item.coins`]="{ item }">
              <v-autocomplete
                :items="rootStore.state.itemsCoinsList"
                v-model="item.id_coin"
                item-title="acronym"
                item-value="id"
                readonly
                density="compact"
              />
            </template>
            <template #[`item.action`]="{ item }">
              <v-row>
                <v-col>
                  <v-btn
                    variant="text"
                    icon
                  >
                    <v-icon
                      color="warning"
                      @click="abrirCuenta(item)"
                    >
                      mdi-pencil
                    </v-icon>
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    variant="text"
                    color="error"
                    icon
                    @click="EliminarCuenta(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </template>
            <template #[`item.esprincipalflag`]="{ item }">
              {{ item.esprincipalflag == 1 ? "Si" : "No" }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="abrirNuevaCuenta()"
          >
            Nueva Cuenta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="cuentaFlag"
      scrollable
      persistent
      width="50%"
    >
      <v-card v-if="cuenta">
        <v-card-title primary-title />
        <v-card-text>
          <v-form ref="frmCuenta">
            <v-autocomplete
              :items="rootStore.state.itemsCoinsList"
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
            <v-text-field
              label="CCI"
              v-model="cuenta.nrocci"
            />

            <v-checkbox
              v-if="cuenta.id"
              :label="cuenta.status == 1 ? 'Activo' : 'Inactivo'"
              v-model="cuenta.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
            <!-- v-if="cuenta.id" -->
            <v-checkbox
              label="Usar En FACTURACIÓN DE CONTROL DE GASTOS"
              v-model="cuenta.esprincipalflag"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            sm
            color="success"
            @click="guardarCuenta()"
          >
            Guardar
          </v-btn>
          <v-btn
            sm
            color="danger"
            @click="cuentaFlag = !cuentaFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>


