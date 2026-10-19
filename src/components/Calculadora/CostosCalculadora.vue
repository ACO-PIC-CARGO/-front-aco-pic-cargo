<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import ExpandMontos from "./ExpandMontos.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { OpcionCalculadora } from "@/types/calculadora";

withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "FCL",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();

const dialogNuevoCosto = ref(false);
const id_service = ref<number | null>(null);
const id_tipocosto = ref<number | null>(null);
const concepto = ref<string | null>(null);
const id_multiplicador = ref<number | null>(null);
const punitario = ref<string | null>(null);
const pcostoMinimo = ref<string | null>(null);
const fechavalidez = ref<string | null>(null);
const EsCostoFlag = ref(true);
const EsVentaFlag = true;
const loading = ref(false);
const frmConcepto = useTemplateRef("frmConcepto");

const opcionCalculadora = computed({
  get() {
    return calculadorasStore.opcionCalculadora;
  },
  set(value) {
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});
 
const opciones = computed({
  get() {
    return calculadorasStore.opciones;
  },
  set(value: OpcionCalculadora[]) {
    // @ts-expect-error Kept: the old setter passed the option list as the selected option
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalNuevoCosto({ tipo = 1 }: { tipo?: number }) {
  dialogNuevoCosto.value = true;
  frmConcepto.value!.reset();
  EsCostoFlag.value = true;
}
function getCosto({ tipo = null }: { tipo?: string | null }) {
  const cost = [...calculadorasStore.lstCostos];
  return cost.filter(
    (v) =>
      v.id_tipocosto == tipo &&
      v.opcion == calculadorasStore.opcionCalculadora &&
      v.escostoflag
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getVenta({ tipo = null }: { tipo?: string | null }) {
  const cost = [...calculadorasStore.lstCostos];
  return cost.filter(
    (v) =>
      v.id_tipocosto == tipo &&
      v.opcion == calculadorasStore.opcionCalculadora &&
      v.esventaflag
  );
}
async function guardarConcepto() {
  if ((await frmConcepto.value!.validate()).valid) {
    const data = {
      id_service: id_service.value,
      id_tipocosto: id_tipocosto.value,
      concepto: concepto.value,
      id_multiplicador: id_multiplicador.value,
      unitario: punitario.value,
      costominimo: pcostoMinimo.value,
      fechavalidez: fechavalidez.value,
      opcion: calculadorasStore.opcionCalculadora,
      EsCostoFlag: EsCostoFlag.value,
      EsVentaFlag: EsVentaFlag,
    };
    loading.value = true;
    await calculadorasStore.PostCalcCosto(data);
    loading.value = false;
    dialogNuevoCosto.value = false;
  }
}
</script>

<template>
  <v-container fluid>
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
      <v-col
        cols="12"
        md="12"
      >
        <p
          style="
            padding: 0 0 0 10%;
            text-transform: uppercase;
            font-weight: bold;
            
          "
        >
          Costos:
          <v-btn
            variant="text"
            @click="abrirModalNuevoCosto({ tipo: 1 })"
            color="info"
            icon
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </p>
        <ExpandMontos
          v-for="(tipo, index) in calculadorasStore.lstTipoCosto"
          :key="index"
          :tipo="tipo"
          :id="`TipoCostoCostos${index}`"
          class="py-1"
          :lst-montos="getCosto({ tipo: tipo.id })"
        />
      </v-col>
      <!-- <v-col cols="12" md="6">
        <p>
          Ventas:
          <v-btn @click="abrirModalNuevoCosto({ tipo: 2 })" color="info" icon
            ><v-icon>mdi-plus</v-icon></v-btn
          >
        </p>
        <ExpandMontos
          v-for="(tipo, index) in $store.state.calculadoras.lstTipoCosto"
          :key="index"
          :tipo="tipo"
          :id="`TipoCostoVentas${index}`"
          class="py-1"
          :lstMontos="getVenta({ tipo: tipo.id })"
        />
      </v-col> -->
    </v-row>
    <v-dialog
      v-model="dialogNuevoCosto"
      persistent
      max-width="40%"
      eager
    >
      <v-card>
        <v-card-title>
          Nuevo Concepto - Opción {{ opcionCalculadora }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmConcepto">
            <v-row>
              <!-- <v-col cols="12">
                <v-autocomplete item-title="text"
                  dense
                  label="Proveedor"
                  placeholder="Proveedor"
                />
              </v-col> -->
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  label="Servicio"
                  placeholder="Servicio"
                  :items="calculadorasStore.lstServicio"
                  item-value="id"
                  item-title="descripcion"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="id_service"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  label="Sección"
                  placeholder="Sección"
                  :items="calculadorasStore.lstTipoCosto"
                  item-value="id"
                  item-title="nombre"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="id_tipocosto"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Concepto"
                  placeholder="Concepto"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="concepto"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  label="Multiplcador"
                  placeholder="Multiplicador"
                  :items="calculadorasStore.lstMultiplicador"
                  item-value="id"
                  item-title="name"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="id_multiplicador"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Costo Unitado"
                  placeholder="Costo Unitario"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="punitario"
                  type="number"
                  step="0.01"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Costo Mínimo "
                  placeholder="Costo Mínimo"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="pcostoMinimo"
                  type="number"
                  step="0.01"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  type="date"
                  density="compact"
                  label="Fecha Validez"
                  placeholder="Fecha Validez"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="fechavalidez"
                />
              </v-col>

              <!-- <v-col cols="12">
                <v-checkbox v-model="EsCostoFlag" label="Es Costo"></v-checkbox>
                <v-checkbox v-model="EsVentaFlag" label="Es Venta"></v-checkbox>
              </v-col> -->
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="guardarConcepto"
            :loading="loading"
          >
            Agregar Nuevo Costo
          </v-btn>
          <v-btn
            size="small"
            color="error"
            @click="dialogNuevoCosto = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
