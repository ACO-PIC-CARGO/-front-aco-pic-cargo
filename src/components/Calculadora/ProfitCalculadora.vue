<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from "vue";
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { FormProfitCalculadora, OpcionCalculadora, ProfitCalculadoraFila } from "@/types/calculadora";
import type { Numerico } from "@/types/cotizacion";

const props = withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "type",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();

const dialogNuevoProfit = ref(false);
const headers = [
  { key: "profit", title: "PROFIT" },
  { key: "pesomin", title: "PESO MÍNIMO" },
  { key: "pesomax", title: "PESO MÁXIMO" },
  { key: "volumenmin", title: "VOLUMEN MÍNIMO" },
  { key: "volumenmax", title: "VOLUMEN MÁXIMO" },
  { key: "valormin", title: "VALOR DE CARGA MÍNIMO" },
  { key: "valormax", title: "VALOR DE CARGA MÁXIMO" },
  { key: "estado", title: "Estado" },
  { key: "metromcad", title: "M³ Adicional" },
  { key: "action", title: "" },
];
const id = ref<string | null | undefined>(null);
const profit = ref<Numerico>(null);
const pesomin = ref<Numerico>(0);
const pesominflag = ref(true);
const pesomax = ref<Numerico>(0);
const pesomaxflag = ref(true);
const volumenmin = ref<Numerico>(0);
const volumenminflag = ref(true);
const volumenmax = ref<Numerico>(0);
const volumenmaxflag = ref(true);
const valormin = ref<Numerico>(0);
const valorminflag = ref(true);
const valormax = ref<Numerico>(0);
const valormaxflag = ref(true);
const metromcad = ref<Numerico>(0);
const metromcadflag = ref(true);
const nuevoflag = ref(true);
const editarflag = ref(false);
// Plain, non-reactive fields.
let peso: unknown;
let volumen: unknown;
let valor: unknown;
let metromc: unknown;
const frmNuevo = useTemplateRef("frmNuevo");

const opcionCalculadora = computed({
  get() {
    return calculadorasStore.opcionCalculadora;
  },
  set(value) {
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});
const obtenerValoresProfitPorOpcion = computed(() => {
  return calculadorasStore.lstProfit.filter(
    (v) => v.opcion == opcionCalculadora.value
  );
});
const opciones = computed({
  get() {
    return calculadorasStore.opciones;
  },
  set(value: OpcionCalculadora[]) {
    // @ts-expect-error the setter passes the option list as the selected option
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});

async function guardarProfit() {
  if ((await frmNuevo.value!.validate()).valid) {
    const data: FormProfitCalculadora = {
      id_modality: props.idModality,
      shimpent: props.type,
      opcion: calculadorasStore.opcionCalculadora,
      profit: profit.value,
      pesomin: pesomin.value,
      pesomax: pesomax.value,
      volumenmin: volumenmin.value,
      volumenmax: volumenmax.value,
      valormin: valormin.value,
      valormax: valormax.value,
      metromcad: metromcad.value,
    };
    await calculadorasStore.postGuardarProfit(data);
    dialogNuevoProfit.value = false;
    await calculadorasStore.getProfitList(data);
  }
}
function activarPesoMax() {
  if (profit.value) {
    // this.pesomin = 0.5;
    pesominflag.value = false;
    pesomaxflag.value = false;
  } else {
    frmNuevo.value!.reset();
    pesominflag.value = true;
    pesomaxflag.value = true;
  }
}
function activarVolumenMax() {
  if (pesomin.value && pesomax.value) {
    volumenminflag.value = false;
    volumenmaxflag.value = false;
  }
}
function activarValorMercanciaMax() {
  if (volumenmin.value && volumenmax.value) {
    valorminflag.value = false;
    valormaxflag.value = false;
  }
}
function activarMetroCCAdiconal() {
  metromcadflag.value = false;
}
function borrarProfit(item: ProfitCalculadoraFila) {
  const data: FormProfitCalculadora = {
    id_modality: props.idModality,
    shimpent: props.type,
    profit: profit.value,
    peso: peso,
    volumen: volumen,
    valor: valor,
    opcion: calculadorasStore.opcionCalculadora,
    metromc: metromc,
    metromcad: metromcad.value,
  };
  Swal.fire({
    icon: "question",
    title: "Anular Profit?",
    text: "Desea anular el profit",
    confirmButtonText: "Si, eliminar",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then(async (res) => {
    if (res.isConfirmed) {
      await calculadorasStore.eliminarGuardarProfit(item);
      await calculadorasStore.getProfitList(data);
    }
  });
}
async function actualizarProfit() {
  if ((await frmNuevo.value!.validate()).valid) {
    const data: FormProfitCalculadora = {
      id: id.value,
      id_modality: props.idModality,
      shimpent: props.type,
      profit: profit.value,
      peso: peso,
      volumen: volumen,
      valor: valor,
      opcion: calculadorasStore.opcionCalculadora,
      metromc: metromc,
      metromcad: metromcad.value,
    };
    await calculadorasStore.actualizarGuardarProfit(data);
    dialogNuevoProfit.value = false;
    await calculadorasStore.getProfitList(data);
  }
}
function abrirModal() {
  dialogNuevoProfit.value = true;
  nuevoflag.value = true;
  editarflag.value = false;
  nextTick(() => {
    frmNuevo.value!.reset();
  });
}
function abrirModalEditar(profitRow: ProfitCalculadoraFila) {
  dialogNuevoProfit.value = true;
  nuevoflag.value = false;
  editarflag.value = true;
  nextTick(() => {
    // this.$refs.frmNuevo.reset();
    id.value = profitRow.id;
    profit.value = profitRow.profit;
    peso = profitRow.peso;
    volumen = profitRow.volumen;
    valor = profitRow.valor;
    metromc = profitRow.metromc;
    metromcad.value = profitRow.metromcad;
  });
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <center>
          <v-btn
            :class="opcionCalculadora == opcion.id ? 'Active' : 'Inactive'"
            v-for="(opcion, index) in opciones"
            :key="index"
            class="mx-1"
            size="small"
            @click="opcionCalculadora = opcion.id"
          >
            {{ opcion.nombre }}
          </v-btn>
        </center>
      </v-col>
      <v-col cols="12">
        <v-btn
          color="success"
          size="small"
          @click="abrirModal"
        >
          Nuevo
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="obtenerValoresProfitPorOpcion"
        >
          <template #[`item.estado`]="{ item }">
            {{ item.estado ? "Activo" : "Anulado" }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              variant="text"
              color="warning"
              v-if="item.estado"
              icon
              @click="abrirModalEditar(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              variant="text"
              color="error"
              v-if="item.estado"
              icon
              @click="borrarProfit(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogNuevoProfit"
      scrollable
      persistent
      max-width="30%"
    >
      <v-card>
        <v-card-title v-if="nuevoflag">
          Nuevo Profit
        </v-card-title>
        <v-card-title v-if="editarflag">
          Actualizar Profit
        </v-card-title>
        <v-card-text>
          <v-form ref="frmNuevo">
            <v-row>
              <v-col
                cols="12"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="Profit"
                  label="Profit"
                  v-model="profit"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  @update:model-value="activarPesoMax"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="Peso Min"
                  label="Peso Min"
                  v-model="pesomin"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="pesominflag"
                  @update:model-value="activarVolumenMax"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="Peso Máximo"
                  label="Peso Máximo"
                  v-model="pesomax"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="pesomaxflag"
                  @update:model-value="activarVolumenMax"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="volumen Mínimo"
                  label="Volumen Mínimo"
                  v-model="volumenmin"
                  :disabled="volumenminflag"
                  @update:model-value="activarValorMercanciaMax"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="volumen Máximo"
                  label="Volumen Máximo"
                  v-model="volumenmax"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="volumenmaxflag"
                  @update:model-value="activarValorMercanciaMax"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="valor Mercancia Mínimo"
                  label="Valor Mercancia Mínimo"
                  v-model="valormin"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="valorminflag"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="valor Mercancía Máxima"
                  label="Valor Mercancía Máxima"
                  v-model="valormax"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="valormaxflag"
                  @update:model-value="activarMetroCCAdiconal"
                />
              </v-col>
              <v-col
                cols="6"
                class="py-0 my-0"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  type="number"
                  name="M³ Adicional"
                  label="M³ Adicional"
                  v-model="metromcad"
                  :rules="[(v) => (!!v && v >= 0) || 'Dato Requerido']"
                  :disabled="metromcadflag"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="nuevoflag"
            color="success"
            size="small"
            class="mx-1"
            @click="guardarProfit"
          >
            Guardar
          </v-btn>
          <v-btn
            v-if="editarflag"
            color="success"
            size="small"
            class="mx-1"
            @click="actualizarProfit"
          >
            Actualizar
          </v-btn>
          <v-btn
            color="error"
            size="small"
            class="mx-1"
            @click="dialogNuevoProfit = !dialogNuevoProfit"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
