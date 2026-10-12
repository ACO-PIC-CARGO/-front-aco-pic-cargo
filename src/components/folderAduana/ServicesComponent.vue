<template>
  <v-card elevation="0">
    <v-dialog v-model="dialog" v-if="dialog" max-width="30%">
      <v-card>
        <v-card-title primary-title> Nuevo Servicio </v-card-title>
        <v-card-text>
          <v-select
            :items="$store.state.aduana.begEndList"
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
      <v-btn icon color="primary" @click="dialog = !dialog">
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
            v-for="service in $store.state.aduana.listServices.filter(
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
            v-for="service in $store.state.aduana.listServices.filter(
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
            v-for="service in $store.state.aduana.listServices.filter(
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
            v-for="service in $store.state.aduana.listServices.filter(
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
            :error-messages="$store.state.aduana.errorValorMercancia"
            v-model="$store.state.aduana.datosPrincipales.amount"
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
            v-model="$store.state.aduana.datosPrincipales.descripcioncarga"
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
import { mapActions } from "vuex";
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
  methods: {
    ...mapActions([
      "getItemsServices",
      "getImpuestos",
      "getItemsServicesDetails",
      "getBegEndList",
    ]),
    guardarServicio() {
      let codebegend = this.$store.state.aduana.begEndList.filter(
        (v) => v.id == this.servicio.id_begend
      )[0].code;
      this.servicio.codebegend = codebegend;
      this.$store.state.aduana.listServices.push(this.servicio);
      this.dialog = false;
      this.servicio = {
        codebegend: "OP",
        id_begend: "0",
        service: "",
        status: true,
      };
    },
    recargarCostos() {
      this.$store.state.aduana.errorValorMercancia = "";
      this.$store.state.aduana.actualizarCostosFlag =
        !this.$store.state.aduana.actualizarCostosFlag;
    },
    esImportacion() {
      return this.$store.state.aduana.listModality.some(
        (v) =>
          v.id == this.$store.state.aduana.datosPrincipales.idsentido &&
          v.code == "I"
      );
    },

    continuarLlenadoCostos() {
      if (
        !this.$store.state.aduana.datosPrincipales.amount ||
        this.$store.state.aduana.datosPrincipales.amount <= 0
      ) {
        this.$store.state.aduana.errorValorMercancia =
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
