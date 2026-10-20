<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from '@/api/http';
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { useBankStore } from "@/stores/bank";
import type { CuentaBancariaPic } from "@/types/operaciones";
import type { DetallePagoRealizado, CuentaSalidaPago } from "@/types/banksProveedor";
import { sessionBranchId } from "@/utils/sesion";

defineProps<{ tipo?: string }>();

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const bankStore = useBankStore();
const filesStore = useFilesStore();
const provedores = computed(() => appStore.provedores);

const symbol = "";
const montoMonExt = ref<number | string>(0);
const selected = ref<DetallePagoRealizado[]>([]);
const payfile = ref<File[]>([]);
const cuentas = ref<CuentaBancariaPic[]>([]);
const id_cuenta = ref<CuentaSalidaPago>("" as unknown as CuentaSalidaPago);
const tab = ref<string | null>(null);
const loadingFile = ref(false);
const errfile = ref("");
const msgfile = ref("");
const headers = [
  {
    title: "Factura",
    key: "factura",
  },
  {
    title: "Serie",
    key: "serie",
  },

  {
    title: "Expediente",
    key: "tipo_gasto",
  },
  {
    title: "Procedencia",
    key: "tipo_pago",
  },

  {
    title: "Monto Dolar",
    key: "monto_dolar",
  },

  // {
  //   text: "Monto Deuda",
  //   value: "monto_deuda",
  // },

  {
    title: "Tipo de Cambio",
    key: "tipo_cambio",
  },
  {
    title: "Moneda Pagar",
    key: "item_moneda",
  },
  {
    title: "Monto Mon Ex",
    key: "monto_mon_ex",
    shortable: false,
  },
  {
    title: "Acción",
    key: "action",
    shortable: false,
  },
];
const msgNroOperacion = "";

async function getListBanksDetailsCargar() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
    params: {
      id_branch: sessionBranchId(),
    },
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      cuentas.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarMonto(details: { id: number; max_pagar: number; monto_deuda: number }) {
  if (details.max_pagar > details.monto_deuda) {
    document.getElementById(`pago${details.id}`)!.focus();
  } else {
    calcularTotal();
  }
}
function calcularTotal() {
  let total = 0;
  (bankStore.record.detalle as DetallePagoRealizado[]).forEach((element) => {
    total += parseFloat(String(element.monto_mon_ex));
  });
  montoMonExt.value = parseFloat(String(total)).toFixed(2);
}
async function uploadFile() {
  msgfile.value = "";
  errfile.value = "";
  if (payfile.value) {
    loadingFile.value = true;
    await filesStore._uploadFile(payfile.value as unknown as File);
    loadingFile.value = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filesStore.payPath
      ? (msgfile.value = "Archivo cargado")
      : (errfile.value = "Comuniquese con el admistrador");
  } else {
    errfile.value = "Dato Requerido";
  }
}
async function anularPago(id: number) {
  await Swal.fire({
    icon: "question",
    text: "¿Está seguro que desea anular el pago realizado. ? Recuerde que este cambio no es reversible.",
    confirmButtonText: "Si, anular",
    cancelButtonText: "Cancelar",
    showDenyButton: false,
    showCancelButton: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      await bankStore.anularPagoRealizado(id);
      router.go(-1);
    }
  });
}
async function actualizarPago() {
  const data: Record<string, unknown>[] = [];
  (bankStore.record.detalle as DetallePagoRealizado[]).forEach((element) => {
    const pago = {
      id: element.id,
      id_path: filesStore.payPath,
      id_cuenta: bankStore.record.id_banco,
      fecha: bankStore.record.fecha_pago,
      monto: element.monto_dolar,
      nro_operacion: bankStore.record.nro_operacion,
      monto_mon_ex: element.monto_mon_ex,
      tipocambio: element.tipocambio,
      id_coins: element.tipocambio,
      comentarios: bankStore.record.comentarios,
    };
    data.push(pago);
  });
  const res = await bankStore.actualizarPagoRealizado(data);

  Swal.fire({
    icon: res!.estadoflag ? "success" : "error",
    text: res!.mensaje,
  }).then((response) => {
    if (response.isConfirmed) {
      router.go(-1);
    }
  });
}
function abrirSoporte(url: unknown) {

  window.open(url as string, "_blank");
}

watch(selected, () => {
  // @ts-expect-error calcularTotales is not defined
  calcularTotales();
});

onMounted(async () => {
  await appStore.cargarProveedores();
  await getListBanksDetailsCargar();
  await appStore._getCoinsList();
  await bankStore.verPagoRealizado(route.params.nro_operacion as string);
  calcularTotal();

  appStore.drawer = false;
});
</script>

<template>
  <v-card class="px-5">
    <v-card-title primary-title>
      <v-row>
        <!-- @vue-expect-error obtenerListado is not defined -->
        <v-autocomplete
          :items="provedores"
          item-title="namelong"
          item-value="id"
          label="Proveedor"
          v-model="bankStore.record.id_proveedor"
          readonly
          @update:model-value="obtenerListado()"
        />
        <v-spacer />
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="3">
          <v-text-field
            style="font-size: 20pt; color: green"
            label="Monto en que va a salir del bancoss"
            v-model="montoMonExt"
            readonly
            :prefix="symbol"
          />
          <!-- :prefix="acronym" -->
        </v-col>
      </v-row>
      <!-- v-model="value" -->
      <v-tabs
        color="#A43542"
        slider-color="primary"
        fixed-tabs
        v-model="tab"
      >
        <v-tab value="ref1">
          STEP 1
        </v-tab>
        <v-tab value="ref2">
          STEP 2
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="ref1">
          <v-row class="mt-5">
            <v-col cols="3">
              <!-- <v-text-field label="Buscar..." v-model="search"></v-text-field> -->
            </v-col>
            <v-col cols="3">
              <!-- @vue-expect-error continuar is not defined -->
              <v-btn
                v-if="selected.length > 0"
                color="green-darken-4"
                @click="continuar()"
              >
                Continuar
              </v-btn>
            </v-col>
            <v-col
              md="12"
              cols="12"
            >
              <!-- @vue-expect-error the detail rows are unknown -->
              <v-data-table
                :headers="headers"
                :items="bankStore.record.detalle"
                v-model="selected"
                item-value="id"
                return-object
              >
                <template #[`item.item_moneda`]="{ item }">
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="item.id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda"
                  />
                </template>
                <!--  -->
                <template #[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="item.tipocambio"
                    type="number"
                    step="0.01"
                  />
                </template>
                <template #[`item.monto_dolar`]="{ item }">
                  <v-text-field
                    v-model="item.monto_dolar"
                    type="number"
                    step="0.01"
                  />
                </template>

                <template #[`item.monto_mon_ex`]="{ item }">
                  <!-- @vue-expect-error calcularTotalesInput is not defined -->
                  <v-text-field
                    v-model="item.monto_mon_ex"
                    type="number"
                    :prefix="symbol"
                    @blur="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  />
                </template>
                <template #[`item.action`]="{ item }">
                  <v-btn
                    variant="text"
                    icon
                  >
                    <v-icon
                      color="red"
                      @click="anularPago(item.id)"
                    >
                      mdi-circle-off-outline
                    </v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item value="ref2">
          <v-form ref="frmRegister">
            <v-row class="mt-5">
              <v-col
                md="3"
                cols="3"
              >
                <!-- @vue-expect-error ValidaNroOp is not defined -->
                <v-text-field
                  v-model="bankStore.record.nro_operacion"
                  label="N° de Operación"
                  @blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
              <v-col
                cols="3"
                md="3"
              >
                <v-text-field
                  type="date"
                  v-model="bankStore.record.fecha_pago"
                  label="Fecha de Pago"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
              <v-col
                md="6"
                cols="6"
              >
                <v-btn
                  variant="text"
                  @click="abrirSoporte(bankStore.record.ruta)"
                >
                  <v-icon color="red">
                    mdi-file-pdf-box
                  </v-icon>
                  {{ bankStore.record.nombre_archivo }}
                </v-btn>
                <v-file-input
                  label="Cargar Archivo"
                  v-model="payfile"
                  @update:model-value="uploadFile()"
                  :messages="msgfile"
                  :class="{ 'text-success': !!msgfile }"
                  :error-messages="errfile"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                  :loading="loadingFile"
                />
              </v-col>

              <v-col
                md="4"
                cols="4"
              >
                <v-autocomplete
                  :items="cuentas"
                  item-title="label"
                  item-value="id"
                  label="Cuenta de Salida de Banco"
                  v-model="bankStore.record.id_banco"
                />
              </v-col>
              <v-col
                md="4"
                cols="4"
                v-if="tipo == 'nuevo'"
              >
                <v-text-field
                  readonly
                  v-model="id_cuenta.banco"
                  label="Banco:"
                />
              </v-col>
              <v-col
                md="4"
                cols="4"
                v-if="tipo == 'nuevo'"
              >
                <v-text-field
                  readonly
                  v-model="id_cuenta.moneda"
                  label="Moneda:"
                />
              </v-col>
              <v-col
                md="4"
                cols="4"
                v-if="tipo == 'nuevo'"
              >
                <v-text-field
                  readonly
                  v-model="id_cuenta.cuenta"
                  label="N° Cuenta:"
                />
              </v-col>
              <v-col
                md="4"
                cols="4"
                v-if="tipo == 'nuevo'"
              >
                <v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                />
              </v-col>
              <v-col
                md="4"
                cols="4"
              >
                <v-text-field
                  v-model="bankStore.record.comentarios"
                  label="Comentarios"
                  placeholder="Comentarios......"
                />
              </v-col>
              <v-col
                md="12"
                cols="12"
              >
                <div class="text-right">
                  <v-btn
                    color="success"
                    @click="actualizarPago()"
                  >
                    Actualizar
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<style></style>
