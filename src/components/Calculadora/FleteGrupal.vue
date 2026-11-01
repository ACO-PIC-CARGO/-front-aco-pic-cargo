<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import Swal from "sweetalert2";

import FormatFechaVue from "../comun/FormatFecha.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePermissions } from "@/composables/usePermissions";
import type { FleteGrupal, GroupTariffKind } from "@/types/calculadora";

const props = defineProps<{ type?: string }>();

const calculadorasStore = useCalculadorasStore();
const { can } = usePermissions();

const tab = ref("resumen");
const searchCosto = ref("");
const searchVenta = ref("");
const headers = [
  { width: "18%", title: "#", key: "index", sortable: false },
  { width: "18%", key: "volumen", title: "Volumen" },
  { width: "18%", key: "peso", title: "Peso" },
  { width: "18%", key: "valor", title: "Valor" },
  { width: "18%", key: "vigencia_text", title: "Fec. Vigencia" },
  { width: "10%", title: "", key: "action" },
];
const searchResumen = ref("");
const headersResumen = [
  { width: "15%", key: "volumen", title: "Volumen" },
  { width: "15%", key: "peso", title: "Peso" },
  {
    width: "16%",
    key: "monto",
    title: "Valor",
    headerProps: { class: "col-fondo-monto" },
    cellProps: { class: "col-fondo-monto" },
  },
  {
    width: "14%",
    key: "vigencia",
    title: "Fec. Vigencia",
    headerProps: { class: "col-fondo-monto" },
    cellProps: { class: "col-fondo-monto" },
  },
  {
    width: "16%",
    key: "montoventa",
    title: "Valor Venta",
    headerProps: { class: "col-fondo-venta" },
    cellProps: { class: "col-fondo-venta" },
  },

  {
    width: "14%",
    key: "vigenciaventa",
    title: "Fec. Vigencia Venta",
    headerProps: { class: "col-fondo-venta" },
    cellProps: { class: "col-fondo-venta" },
  },
];
const dialog = ref(false);
const form = ref<FleteGrupal>({
  volumen: 0,
  peso: 0,
  valor: 0,
  vigencia: null,
});
const nuevoflag = ref(false);
const editarflag = ref(false);
const errorFechaVigencia = ref("");
const tipoCosto = ref("");
const frmNuevo = useTemplateRef("frmNuevo");
const saving = ref(false);
const positiveRule = (v: unknown) => Number(v) > 0 || "Ingresa un valor mayor que 0";

function reloadTariffs(kind: GroupTariffKind) {
  const filter = { tipo: props.type };
  return Promise.all([
    kind === "venta" ? calculadorasStore.getFleteGrupalVenta(filter) : calculadorasStore.getFleteGrupal(filter),
    calculadorasStore.getFleteGrupalResumen({ tipo: props.type }),
  ]);
}

async function eliminar(element: FleteGrupal, kind: GroupTariffKind) {
  const res = await Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "¿Deseas eliminar esta tarifa?",
    confirmButtonText: "Sí, eliminar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  });
  if (res.isConfirmed && (await calculadorasStore.removeGroupTariff({ tariff: element, kind }))) {
    await reloadTariffs(kind);
  }
}
async function actualizar() {
  if (saving.value || !(await frmNuevo.value!.validate()).valid) return;
  const kind = tipoCosto.value as GroupTariffKind;
  saving.value = true;
  const saved =
    kind === "venta"
      ? await calculadorasStore.updateFleteGrupalVenta({ ...form.value, estado: true })
      : await calculadorasStore.updateFleteGrupal({ ...form.value, estado: true });
  saving.value = false;
  if (!saved) return;
  dialog.value = false;
  await reloadTariffs(kind);
}
function abrirModal({ tipo = "nuevo", item = {}, tipoCosto: tipoCostoElegido = "costo" }: { tipo?: string; item?: FleteGrupal; tipoCosto?: string }) {
  tipoCosto.value = tipoCostoElegido;
  form.value.volumen = 1;
  form.value.peso = 1;
  form.value.valor = 1;
  nuevoflag.value = false;
  editarflag.value = false;
  dialog.value = true;
  nextTick(() => {
    if (tipo == "nuevo") {
      nuevoflag.value = true;
    }
    if (tipo == "editar") {
      form.value = { ...item };
      editarflag.value = true;
    }
  });
}
async function guardarFleteGrupal() {
  if (saving.value) return;
  errorFechaVigencia.value = "";
  if ((await frmNuevo.value!.validate()).valid && form.value.vigencia) {
    if (
      (calculadorasStore.lstFleteGrupal.some(
        (v) => Number(v.volumen) === Number(form.value.volumen),
      ) &&
        tipoCosto.value == "costo") ||
      (calculadorasStore.lstFleteGrupalVenta.some(
        (v) => Number(v.volumen) === Number(form.value.volumen),
      ) &&
        tipoCosto.value == "venta")
    ) {
      Swal.fire({
        icon: "error",
        title: "Volumen repetido",
        text: "Ya hay una tarifa para ese volumen. Edítala en lugar de crear otra.",
      });
      return;
    }
    const kind = tipoCosto.value as GroupTariffKind;
    saving.value = true;
    const saved =
      kind === "venta" ? await calculadorasStore.setFleteGrupalVenta(form.value) : await calculadorasStore.setFleteGrupal(form.value);
    saving.value = false;
    if (!saved) return;
    dialog.value = false;
    await reloadTariffs(kind);
  } else {
    if (!form.value.vigencia) {
      errorFechaVigencia.value = "Elige la fecha de vigencia";
    }
  }
}
onMounted(async () => {
  await Promise.all([
    calculadorasStore.getFleteGrupal({ tipo: props.type }),
    calculadorasStore.getFleteGrupalVenta({ tipo: props.type }),
    calculadorasStore.getFleteGrupalResumen({ tipo: props.type }),
  ]);
});
</script>

<template>
  <v-container>
    <v-tabs
      v-model="tab"
      align-tabs="center"
      stacked
    >
      <v-tab value="resumen">
        Resumen
      </v-tab>
      <v-tab value="costo">
        Costo
      </v-tab>
      <v-tab value="venta">
        Venta
      </v-tab>
    </v-tabs>
    <v-tabs-window
      v-model="tab"
      class="mt-5"
    >
      <v-tabs-window-item value="resumen">
        <v-text-field
          v-model="searchResumen"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          variant="outlined"
          style="max-width: 30%"
          density="compact"
        />
        <br>

        <v-data-table
          :headers="headersResumen"
          :items="calculadorasStore.lstFleteGrupalResumen"
          density="compact"
          :search="searchResumen"
        >
          <template #[`item.monto`]="{ item }">
            <span :style="!item.monto ? 'color:red' : ''">
              {{ item.monto || "Sin Config" }}
            </span>
          </template>
          <template #[`item.montoventa`]="{ item }">
            <span :style="!item.montoventa ? 'color:red' : ''">
              {{ item.montoventa || "Sin Config" }}
            </span>
          </template>
          <template #[`item.vigencia`]="{ item }">
            <span :style="!item.vigencia ? 'color:red' : ''">
              {{ item.vigencia || "Sin Config" }}
            </span>
          </template>
          <template #[`item.vigenciaventa`]="{ item }">
            <span :style="!item.vigenciaventa ? 'color:red' : ''">
              {{ item.vigenciaventa || "Sin Config" }}
            </span>
          </template>
        </v-data-table>
      </v-tabs-window-item>
      <v-tabs-window-item value="costo">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="searchCosto"
                  append-inner-icon="mdi-magnify"
                  label="Buscar"
                  single-line
                  hide-details
                  variant="outlined"
                  style="max-width: 40%"
                  density="compact"
                />
              </v-col>

              <v-col
                cols="6"
                style="text-align: end"
              >
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'NUEVO')"
                  color="success"
                  @click="
                    abrirModal({ tipo: 'nuevo', item: {}, tipoCosto: 'costo' })
                  "
                >
                  Nuevo Flete Grupal
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="calculadorasStore.lstFleteGrupal"
              density="compact"
              :search="searchCosto"
            >
              <template #[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template #[`item.action`]="{ item }">
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'ELIMINAR')"
                  variant="text"
                  color="error"
                  icon
                  aria-label="Eliminar tarifa de compra"
                  @click="eliminar(item, 'costo')"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'MODIFICAR')"
                  variant="text"
                  color="warning"
                  icon
                  @click="
                    abrirModal({
                      tipo: 'editar',
                      item: item,
                      tipoCosto: 'costo',
                    })
                  "
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      <v-tabs-window-item value="venta">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="searchVenta"
                  append-inner-icon="mdi-magnify"
                  label="Buscar"
                  single-line
                  hide-details
                  variant="outlined"
                  style="max-width: 40%"
                  density="compact"
                />
              </v-col>

              <v-col
                cols="6"
                style="text-align: end"
              >
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'NUEVO')"
                  color="success"
                  @click="
                    abrirModal({ tipo: 'nuevo', item: {}, tipoCosto: 'venta' })
                  "
                >
                  Nuevo Flete Grupal
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="calculadorasStore.lstFleteGrupalVenta"
              :search="searchVenta"
              density="compact"
            >
              <template #[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template #[`item.action`]="{ item }">
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'ELIMINAR')"
                  variant="text"
                  color="error"
                  icon
                  aria-label="Eliminar tarifa de venta"
                  @click="eliminar(item, 'venta')"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
                  v-if="can('ServiciosCostosFijosLCL', 'MODIFICAR')"
                  variant="text"
                  color="warning"
                  icon
                  @click="
                    abrirModal({
                      tipo: 'editar',
                      item: item,
                      tipoCosto: 'venta',
                    })
                  "
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

    <v-dialog
      v-model="dialog"
      persistent
      max-width="20%"
      transition="dialog-transition"
    >
      <v-card class="pa-5">
        <v-card-title class="py-0 my-0">
          {{
            nuevoflag ? "Nuevo Registro" : editarflag ? "Editar Registro" : ""
          }}
        </v-card-title>
        <v-form ref="frmNuevo">
          <v-text-field
            label="Volumen"
            type="number"
            v-model="form.volumen"
            :rules="[positiveRule]"
            step="0.01"
            suffix="m³"
          />
          <v-text-field
            label="Peso"
            type="number"
            v-model="form.peso"
            :rules="[positiveRule]"
            step="0.01"
            suffix="kg"
          />
          <v-text-field
            label="Valor"
            type="number"
            v-model="form.valor"
            :rules="[positiveRule]"
            step="0.01"
            prefix="$."
          />
          <!--  -->
          <FormatFechaVue
            v-model="form.vigencia"
            label="Fecha Vigencia"
            :error-messages="errorFechaVigencia"
          />
          <!--  -->
          <v-card-actions>
            <v-btn
              color="success"
              v-if="nuevoflag"
              size="small"
              :loading="saving"
              @click="guardarFleteGrupal"
            >
              Guardar
            </v-btn>
            <v-btn
              color="success"
              v-if="editarflag"
              :loading="saving"
              @click="actualizar"
              size="small"
            >
              Guardar
            </v-btn>
            <v-btn
              color="error"
              size="small"
              @click="dialog = false"
            >
              Cancelar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style>
/* Color de fondo para toda la columna MONTO (ejemplo: amarillo claro) */
.col-fondo-monto {
  background-color: #fff9c4 !important;
}

/* Color de fondo para toda la columna MONTO VENTA (ejemplo: verde claro) */
.col-fondo-venta {
  background-color: #c8e6c9 !important;
}
</style>
