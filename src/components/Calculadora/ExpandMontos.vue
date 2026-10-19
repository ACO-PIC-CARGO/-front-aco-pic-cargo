<script setup lang="ts">
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { CostoCalculadora, TipoCostoCalculadora } from "@/types/calculadora";

withDefaults(defineProps<{ lstMontos?: CostoCalculadora[]; tipo?: Partial<TipoCostoCalculadora> }>(), {
  lstMontos: () => [],
  tipo: () => ({}),
});

const calculadorasStore = useCalculadorasStore();

function actualizarCosto(costo: CostoCalculadora) {
  calculadorasStore.ActualizarCosto(costo);
}
function elimimarCosto(costo: CostoCalculadora) {
  Swal.fire({
    icon: "error",
    title: "Eliminar",
    text: "Desea Eliminar Registro.",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Si, Eliminar",
    allowEnterKey: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((res) => {
    if (res.isConfirmed) {
      calculadorasStore.EliminarCosto(costo);
    }
  });
}
</script>

<template>
  <v-container>
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>{{ tipo.nombre }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table>
            <thead>
              <tr>
                <th>Multiplicador</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Monto Mínimo</th>
                <th>Fecha Validez</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(Monto, index) in lstMontos"
                :key="index"
              >
                <td>
                  <v-autocomplete
                    density="compact"
                    :items="calculadorasStore.lstMultiplicador"
                    item-value="id"
                    item-title="name"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="Monto.id_multiplicador"
                    hide-details
                    :disabled="Monto.bloqueadoflag"
                  />
                </td>
                <td>
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="Monto.concepto"
                    :disabled="Monto.bloqueadoflag"
                  />
                </td>
                <td>
                  <v-text-field
                    density="compact"
                    hide-details
                    type="number"
                    v-model="Monto.punitario"
                    :disabled="Monto.bloqueadoflag"
                  />
                </td>
                <td>
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="Monto.costominimo"
                    :disabled="Monto.bloqueadoflag"
                    type="number"
                  />
                </td>
                <td>
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="Monto.fechavalidez"
                    type="date"
                    :disabled="Monto.bloqueadoflag"
                  />
                </td>
                <td>
                  <v-btn
                    variant="text"
                    v-if="Monto.bloqueadoflag"
                    icon
                    size="small"
                    color="info"
                    @click="Monto.bloqueadoflag = false"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    variant="text"
                    icon
                    size="small"
                    color="warning"
                    v-else
                    @click="actualizarCosto(Monto)"
                  >
                    <v-icon>mdi-content-save</v-icon>
                  </v-btn>
                  <v-btn
                    variant="text"
                    icon
                    size="small"
                    color="error"
                    @click="elimimarCosto(Monto)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<style scoped></style>
