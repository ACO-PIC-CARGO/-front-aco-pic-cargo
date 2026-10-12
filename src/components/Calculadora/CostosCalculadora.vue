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
      <v-col cols="12" md="12">
        <p
          style="
            padding: 0 0 0 10%;
            text-transform: uppercase;
            font-weight: bold;
            
          "
        >
          Costos:
          <v-btn @click="abrirModalNuevoCosto({ tipo: 1 })" color="info" icon
            ><v-icon>mdi-plus</v-icon></v-btn
          >
        </p>
        <ExpandMontos
          v-for="(tipo, index) in $store.state.calculadoras.lstTipoCosto"
          :key="index"
          :tipo="tipo"
          :id="`TipoCostoCostos${index}`"
          class="py-1"
          :lstMontos="getCosto({ tipo: tipo.id })"
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
    <v-dialog v-model="dialogNuevoCosto" persistent max-width="40%" eager>
      <v-card>
        <v-card-title>
          Nuevo Concepto - Opción {{ opcionCalculadora }}</v-card-title
        >
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
                  :items="$store.state.calculadoras.lstServicio"
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
                  :items="$store.state.calculadoras.lstTipoCosto"
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
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  label="Multiplcador"
                  placeholder="Multiplicador"
                  :items="$store.state.calculadoras.lstMultiplicador"
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
                ></v-text-field>
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
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  type="date"
                  density="compact"
                  label="Fecha Validez"
                  placeholder="Fecha Validez"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="fechavalidez"
                ></v-text-field>
              </v-col>

              <!-- <v-col cols="12">
                <v-checkbox v-model="EsCostoFlag" label="Es Costo"></v-checkbox>
                <v-checkbox v-model="EsVentaFlag" label="Es Venta"></v-checkbox>
              </v-col> -->
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            size="small"
            color="success"
            @click="guardarConcepto"
            :loading="loading"
            >Agregar Nuevo Costo</v-btn
          >
          <v-btn size="small" color="error" @click="dialogNuevoCosto = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import ExpandMontos from "./ExpandMontos.vue";

export default {
  components: {
    ExpandMontos,
  },
  props: {
    type: {
      default: "FCL",
      type: String,
    },
    id_modality: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {
      dialogNuevoCosto: false,
      id_service: null,
      id_tipocosto: null,
      concepto: null,
      id_multiplicador: null,
      punitario: null,
      pcostoMinimo: null,
      fechavalidez: null,
      EsCostoFlag: true,
      EsVentaFlag: true,
      loading: false,
    };
  },
  methods: {
    ...mapActions(["PostCalcCosto"]),
    abrirModalNuevoCosto({ tipo = 1 }) {
      this.dialogNuevoCosto = true;
      this.$refs.frmConcepto.reset();
      this.EsCostoFlag = true;
    },
    getCosto({ tipo = null }) {
      let cost = [...this.$store.state.calculadoras.lstCostos];
      return cost.filter(
        (v) =>
          v.id_tipocosto == tipo &&
          v.opcion == this.$store.state.calculadoras.opcionCalculadora &&
          v.escostoflag
      );
    },
    getVenta({ tipo = null }) {
      let cost = [...this.$store.state.calculadoras.lstCostos];
      return cost.filter(
        (v) =>
          v.id_tipocosto == tipo &&
          v.opcion == this.$store.state.calculadoras.opcionCalculadora &&
          v.esventaflag
      );
    },
    async guardarConcepto() {
      if ((await this.$refs.frmConcepto.validate()).valid) {
        let data = {
          id_service: this.id_service,
          id_tipocosto: this.id_tipocosto,
          concepto: this.concepto,
          id_multiplicador: this.id_multiplicador,
          unitario: this.punitario,
          costominimo: this.pcostoMinimo,
          fechavalidez: this.fechavalidez,
          opcion: this.$store.state.calculadoras.opcionCalculadora,
          EsCostoFlag: this.EsCostoFlag,
          EsVentaFlag: this.EsVentaFlag,
        };
        this.loading = true;
        await this.PostCalcCosto(data);
        this.loading = false;
        this.dialogNuevoCosto = false;
      }
    },
  },
  computed: {
    opcionCalculadora: {
      get() {
        return this.$store.state.calculadoras.opcionCalculadora;
      },
      set(value) {
        this.$store.commit("setOpcion", value); // o una mutation/action de Vuex
      },
    },
    opciones: {
      get() {
        return this.$store.state.calculadoras.opciones;
      },
      set(value) {
        this.$store.commit("setOpcion", value); // o una mutation/action de Vuex
      },
    },
  },
};
</script>

