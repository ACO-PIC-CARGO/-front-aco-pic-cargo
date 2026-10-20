<template>
  <v-card elevation="0">
    <v-dialog v-model="dialog" v-if="dialog" max-width="30%">
      <v-card>
        <v-card-title primary-title> Nuevo Servicio </v-card-title>
        <v-card-text>
          <v-select
            :items="aduanaStore.begEndList"
            v-model="servicio.id_begend"
            item-title="name"
            item-value="id"
            label="Categoria..."
          ></v-select>
          <v-text-field
            label="Descripción"
            v-model="servicio.service"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarServicio()">Guardar</v-btn>
          <v-btn color="red" @click="dialog = !dialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-card-title primary-title>
      SERVICIOS A REALIZAR:
      <v-btn variant="text" icon color="primary" @click="dialog = !dialog">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card-title>
    <v-list-subheader class="mt-0">
      <h4>Desmarque los servicios que NO desea utilizar.</h4>
    </v-list-subheader>

    <v-card-text>
      <v-row>
        <v-col cols="3">
          <h4 class="mb-2">ORIGEN</h4>
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
            <template v-slot:label>
              {{ service.service }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">FLETE</h4>
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
            <template v-slot:label>
              {{ service.service }}
            </template>
          </v-checkbox></v-col
        >
        <v-col cols="3">
          <h4 class="mb-2">DESTINO</h4>
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
            <template v-slot:label>
              {{ service.service }}
            </template>
          </v-checkbox></v-col
        >
        <v-col cols="3">
          <h4 class="mb-2">OPCIONAL</h4>
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
            <template v-slot:label>
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
          >
          </v-text-field>
          <v-text-field
            v-model="aduanaStore.datosPrincipales.descripcioncarga"
            label="Descripción de carga"
            placeholder="Descripción de carga"
            autocomplete="off"
            density="compact"
          >
          </v-text-field>
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
            >Continuar Llenado Costos</v-btn
          >
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
export default {
  emits: ["activarLlenadoCostos", "recargarCostos"],
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      dialog: false,
      mostrarContinuarFlag: true,
      servicio: {
        codebegend: "OP",
        id_begend: "0",
        service: "",
        status: true,
      },
    };
  },
  computed: {
    ...mapStores(useAduanaStore),
  },
  methods: {
    ...mapPiniaActions(usePricingStore, ["getItemsServices", "getImpuestos", "getItemsServicesDetails", "getBegEndList"]),
    guardarServicio() {
      let codebegend = this.aduanaStore.begEndList.filter(
        (v) => v.id == this.servicio.id_begend
      )[0].code;
      this.servicio.codebegend = codebegend;
      this.aduanaStore.listServices.push(this.servicio);
      this.dialog = false;
      this.servicio = {
        codebegend: "OP",
        id_begend: "0",
        service: "",
        status: true,
      };
    },
    recargarCostos() {
      this.aduanaStore.errorValorMercancia = "";
      this.aduanaStore.actualizarCostosFlag =
        !this.aduanaStore.actualizarCostosFlag;
    },
    esImportacion() {
      return this.aduanaStore.listModality.some(
        (v) =>
          v.id == this.aduanaStore.datosPrincipales.idsentido &&
          v.code == "I"
      );
    },

    continuarLlenadoCostos() {
      if (
        !this.aduanaStore.datosPrincipales.amount ||
        this.aduanaStore.datosPrincipales.amount <= 0
      ) {
        this.aduanaStore.errorValorMercancia =
          "Datos Requeridos y mayor que 0";
        return false;
      }
      this.$emit("activarLlenadoCostos");
      this.mostrarContinuarFlag = false;
    },
    showConfirmationDialog(service) {
      this.$emit("recargarCostos");
    },
  },
};
</script>

<style></style>
