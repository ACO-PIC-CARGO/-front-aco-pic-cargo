<script setup lang="ts">
import { ref } from "vue";
import { useAduanaStore } from "@/stores/aduana";

withDefaults(defineProps<{ mostrarBtn?: boolean }>(), { mostrarBtn: true });
const emit = defineEmits<{
  activarLlenadoCostos: [];
  recargarCostos: [];
}>();

const aduanaStore = useAduanaStore();

const dialog = ref(false);
const mostrarContinuarFlag = ref(true);
const servicio = ref({
  codebegend: "OP",
  id_begend: "0",
  service: "",
  status: true,
});

function guardarServicio() {
  const codebegend = aduanaStore.begEndList!.filter(
    (v) => v.id == servicio.value.id_begend
  )[0]!.code;
  servicio.value.codebegend = codebegend;
  aduanaStore.listServices.push(servicio.value);
  dialog.value = false;
  servicio.value = {
    codebegend: "OP",
    id_begend: "0",
    service: "",
    status: true,
  };
}
function recargarCostos() {
  aduanaStore.errorValorMercancia = "";
  aduanaStore.actualizarCostosFlag =
    !aduanaStore.actualizarCostosFlag;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function esImportacion() {
  return aduanaStore.listModality.some(
    (v) =>
      v.id == aduanaStore.datosPrincipales.idsentido &&
      v.code == "I"
  );
}

function continuarLlenadoCostos() {
  if (
    !aduanaStore.datosPrincipales.amount ||
    (aduanaStore.datosPrincipales.amount as number) <= 0
  ) {
    aduanaStore.errorValorMercancia =
      "Datos Requeridos y mayor que 0";
    return false;
  }
  emit("activarLlenadoCostos");
  mostrarContinuarFlag.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showConfirmationDialog(service: unknown) {
  emit("recargarCostos");
}
</script>

<template>
  <v-card elevation="0">
    <v-dialog
      v-model="dialog"
      v-if="dialog"
      max-width="30%"
    >
      <v-card>
        <v-card-title primary-title>
          Nuevo Servicio
        </v-card-title>
        <v-card-text>
          <v-select
            :items="aduanaStore.begEndList"
            v-model="servicio.id_begend"
            item-title="name"
            item-value="id"
            label="Categoria..."
          />
          <v-text-field
            label="Descripción"
            v-model="servicio.service"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="guardarServicio()"
          >
            Guardar
          </v-btn>
          <v-btn
            color="red"
            @click="dialog = !dialog"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-card-title primary-title>
      SERVICIOS A REALIZAR:
      <v-btn
        variant="text"
        icon
        color="primary"
        @click="dialog = !dialog"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card-title>
    <v-list-subheader class="mt-0">
      <h4>Desmarque los servicios que NO desea utilizar.</h4>
    </v-list-subheader>

    <v-card-text>
      <v-row>
        <v-col cols="3">
          <h4 class="mb-2">
            ORIGEN
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'OR'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            @update:model-value="showConfirmationDialog(service)"
          >
            <template #label>
              {{ service.service }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            FLETE
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'FL'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            @update:model-value="showConfirmationDialog(service)"
          >
            <template #label>
              {{ service.service }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            DESTINO
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'DE'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            @update:model-value="showConfirmationDialog(service)"
          >
            <template #label>
              {{ service.service }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            OPCIONAL
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'OP'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            @update:model-value="showConfirmationDialog(service)"
          >
            <template #label>
              {{ service.service }}
            </template>
          </v-checkbox>
          <v-text-field
            prefix="$"
            :error-messages="aduanaStore.errorValorMercancia"
            v-model="aduanaStore.datosPrincipales.amount"
            label="Valor de la mercancia"
            type="number"
            step="0.10"
            min="0"
            placeholder="Valor de la mercancia..."
            autocomplete="off"
            density="compact"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                /^(?!0\d+|\d*e)\d*(?:\.\d+)?$/.test(v) ||
                'Debe ser un número real entero positivo',
            ]"
            @update:model-value="recargarCostos()"
            @blur="recargarCostos()"
          />
          <v-text-field
            v-model="aduanaStore.datosPrincipales.descripcioncarga"
            label="Descripción de carga"
            placeholder="Descripción de carga"
            autocomplete="off"
            density="compact"
          />
        </v-col>
        <v-col
          cols="12"
          class="my-0 py-0 align-right"
          v-if="mostrarContinuarFlag && mostrarBtn"
          style="text-align: right !important;"
        >
          <v-btn
            color="#3F51B5"
            @click="continuarLlenadoCostos()"
            size="small"
          >
            Continuar Llenado Costos
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style></style>
