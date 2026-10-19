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
        <v-btn color="success" size="small" @click="abrirModal">Nuevo</v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table :headers="headers" :items="obtenerValoresProfitPorOpcion">
          <template v-slot:[`item.estado`]="{ item }">
            {{ item.estado ? "Activo" : "Anulado" }}
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-btn variant="text"
              color="warning"
              v-if="item.estado"
              icon
              @click="abrirModalEditar(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn variant="text"
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
    <v-dialog v-model="dialogNuevoProfit" scrollable persistent max-width="30%">
      <v-card>
        <v-card-title v-if="nuevoflag"> Nuevo Profit </v-card-title>
        <v-card-title v-if="editarflag"> Actualizar Profit </v-card-title>
        <v-card-text>
          <v-form ref="frmNuevo">
            <v-row>
              <v-col cols="12" class="py-0 my-0">
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
              <v-col cols="6" class="py-0 my-0">
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
              /></v-col>
              <v-col cols="6" class="py-0 my-0">
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
              /></v-col>
              <v-col cols="6" class="py-0 my-0">
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
              /></v-col>
              <v-col cols="6" class="py-0 my-0">
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
              /></v-col>
              <v-col cols="6" class="py-0 my-0">
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
              <v-col cols="6" class="py-0 my-0">
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
              <v-col cols="6" class="py-0 my-0">
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
          <v-spacer></v-spacer>
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

<script>
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";
export default {
  props: {
    type: {
      default: "type",
      type: String,
    },
    id_modality: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {
      dialogNuevoProfit: false,
      headers: [
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
      ],
      items: [],
      id: null,
      profit: null,
      pesomin: 0,
      pesominflag: true,
      pesomax: 0,
      pesomaxflag: true,
      volumenmin: 0,
      volumenminflag: true,
      volumenmax: 0,
      volumenmaxflag: true,
      valormin: 0,
      valorminflag: true,
      valormax: 0,
      valormaxflag: true,
      metromcad: 0,
      metromcadflag: true,
      nuevoflag: true,
      editarflag: false,
    };
  },
  methods: {
    ...mapPiniaActions(useCalculadorasStore, ["postGuardarProfit", "getProfitList", "actualizarGuardarProfit", "eliminarGuardarProfit"]),
    async guardarProfit() {
      if ((await this.$refs.frmNuevo.validate()).valid) {
        let data = {
          id_modality: this.id_modality,
          shimpent: this.type,
          opcion: this.calculadorasStore.opcionCalculadora,
          profit: this.profit,
          pesomin: this.pesomin,
          pesomax: this.pesomax,
          volumenmin: this.volumenmin,
          volumenmax: this.volumenmax,
          valormin: this.valormin,
          valormax: this.valormax,
          metromcad: this.metromcad,
        };
        await this.postGuardarProfit(data);
        this.dialogNuevoProfit = false;
        await this.getProfitList(data);
      }
    },
    activarPesoMax() {
      if (!!this.profit) {
        // this.pesomin = 0.5;
        this.pesominflag = false;
        this.pesomaxflag = false;
      } else {
        this.$refs.frmNuevo.reset();
        this.pesominflag = true;
        this.pesomaxflag = true;
      }
    },
    activarVolumenMax() {
      if (this.pesomin && this.pesomax) {
        this.volumenminflag = false;
        this.volumenmaxflag = false;
      }
    },
    activarValorMercanciaMax() {
      if (this.volumenmin && this.volumenmax) {
        this.valorminflag = false;
        this.valormaxflag = false;
      }
    },
    activarMetroCCAdiconal() {
      this.metromcadflag = false;
    },
    borrarProfit(item) {
      let data = {
        id_modality: this.id_modality,
        shimpent: this.type,
        profit: this.profit,
        peso: this.peso,
        volumen: this.volumen,
        valor: this.valor,
        opcion: this.calculadorasStore.opcionCalculadora,
        metromc: this.metromc,
        metromcad: this.metromcad,
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
          await this.eliminarGuardarProfit(item);
          await this.getProfitList(data);
        }
      });
    },
    async actualizarProfit() {
      if ((await this.$refs.frmNuevo.validate()).valid) {
        let data = {
          id: this.id,
          id_modality: this.id_modality,
          shimpent: this.type,
          profit: this.profit,
          peso: this.peso,
          volumen: this.volumen,
          valor: this.valor,
          opcion: this.calculadorasStore.opcionCalculadora,
          metromc: this.metromc,
          metromcad: this.metromcad,
        };
        await this.actualizarGuardarProfit(data);
        this.dialogNuevoProfit = false;
        await this.getProfitList(data);
      }
    },
    abrirModal() {
      this.dialogNuevoProfit = true;
      this.nuevoflag = true;
      this.editarflag = false;
      this.$nextTick(() => {
        this.$refs.frmNuevo.reset();
      });
    },
    abrirModalEditar(profit) {
      this.dialogNuevoProfit = true;
      this.nuevoflag = false;
      this.editarflag = true;
      this.$nextTick(() => {
        // this.$refs.frmNuevo.reset();
        this.id = profit.id;
        this.profit = profit.profit;
        this.peso = profit.peso;
        this.volumen = profit.volumen;
        this.valor = profit.valor;
        this.metromc = profit.metromc;
        this.metromcad = profit.metromcad;
      });
    },
  },
  computed: {
    ...mapStores(useCalculadorasStore),
    opcionCalculadora: {
      get() {
        return this.calculadorasStore.opcionCalculadora;
      },
      set(value) {
        this.calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
      },
    },
    obtenerValoresProfitPorOpcion() {
      return this.calculadorasStore.lstProfit.filter(
        (v) => v.opcion == this.opcionCalculadora
      );
    },
    opciones: {
      get() {
        return this.calculadorasStore.opciones;
      },
      set(value) {
        this.calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
      },
    },
  },
};
</script>

