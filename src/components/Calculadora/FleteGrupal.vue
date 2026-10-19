<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import Swal from "sweetalert2";

import FormatFechaVue from "../comun/FormatFecha.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { FleteGrupal } from "@/types/calculadora";

const props = defineProps<{ type?: string }>();

const calculadorasStore = useCalculadorasStore();

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
// ...mapState(["getFleteGrupal"]),

function eliminar(element: FleteGrupal) {
  Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "¿Desea eliminar el registro?",
    confirmButtonText: "Si,Eliminar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  }).then((res) => {
    if (res.isConfirmed) {
      calculadorasStore.updateFleteGrupal({ ...element, estado: false });
      calculadorasStore.getFleteGrupal({ tipo: props.type });
    }
  });
}
async function actualizar() {
  if (editarflag.value) {
    if (tipoCosto.value == "costo") {
      await calculadorasStore.updateFleteGrupal({ ...form.value, estado: true });
      calculadorasStore.getFleteGrupal({ tipo: props.type });
    }
    if (tipoCosto.value == "venta") {
      await calculadorasStore.updateFleteGrupalVenta({ ...form.value, estado: true });

      calculadorasStore.getFleteGrupalVenta({ tipo: props.type });
    }
    calculadorasStore.getFleteGrupalResumen({ tipo: props.type });
    dialog.value = false;
    return;
  }
  Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "¿Desea eliminar el registro?",
    confirmButtonText: "Si,Eliminar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      if ((tipoCosto.value = "costo")) {
        await calculadorasStore.updateFleteGrupal({ ...form.value, estado: false });
        calculadorasStore.getFleteGrupal({ tipo: props.type });
      }
      if ((tipoCosto.value = "venta")) {
        await calculadorasStore.updateFleteGrupalVenta({ ...form.value, estado: false });
        calculadorasStore.getFleteGrupalVenta({ tipo: props.type });
      }
      // @ts-expect-error Kept: called without a filter, so it throws before any request
      calculadorasStore.getFleteGrupalResumen();
      dialog.value = false;
    }
  });
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
  errorFechaVigencia.value = "";
  if ((await frmNuevo.value!.validate()).valid && form.value.vigencia) {
    if (
      (calculadorasStore.lstFleteGrupal.some(
        (v) => Number(v.volumen) === Number(form.value.volumen),
      ) &&
        tab.value == "costo") ||
      (calculadorasStore.lstFleteGrupalVenta.some(
        (v) => Number(v.volumen) === Number(form.value.volumen),
      ) &&
        tab.value == "venta")
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ya existe un valor asociado, al volumen",
      });
      return;
    }
    if (tab.value == "costo") {
      await calculadorasStore.setFleteGrupal(form.value);
      calculadorasStore.getFleteGrupal({ tipo: props.type });
    }
    if (tab.value == "venta") {
      await calculadorasStore.setFleteGrupalVenta(form.value);
      calculadorasStore.getFleteGrupalVenta({ tipo: props.type });
      dialog.value = false;
    }
  } else {
    if (!form.value.vigencia) {
      errorFechaVigencia.value = "Dato Requerido";
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
                  variant="text"
                  color="error"
                  icon
                  @click="eliminar(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
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
                  variant="text"
                  color="error"
                  icon
                  @click="eliminar(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
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
            :rules="[(v) => !!v || 'Dato Requerido']"
            step="0.01"
            suffix="m³"
          />
          <v-text-field
            label="Peso"
            type="number"
            v-model="form.peso"
            :rules="[(v) => !!v || 'Dato Requerido']"
            step="0.01"
            suffix="kg"
          />
          <v-text-field
            label="Valor"
            type="number"
            v-model="form.valor"
            :rules="[(v) => !!v || 'Dato Requerido']"
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
              @click="guardarFleteGrupal"
            >
              Guardar
            </v-btn>
            <v-btn
              color="success"
              v-if="editarflag"
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
