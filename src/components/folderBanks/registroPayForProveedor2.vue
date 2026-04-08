<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="2" class="pb-0">
          Monto a Pagar:
          <v-text-field
            outlined
            dense
            v-model="monto"
            type="number"
            :suffix="symbol"
            width="50px"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="pb-0">
          Proveedor:
          <v-autocomplete
            outlined
            dense
            :items="provedores"
            item-text="namelong"
            item-value="id"
            placeholder="Proveedor"
            v-model="proveedor"
            return-object
            clearable
            @change="obtenerListado()"
            hide-details
          >
          </v-autocomplete>
        </v-col>
        <v-col cols="12">
          <v-stepper v-model="pasos">
            <v-stepper-header>
              <v-stepper-step :complete="pasos > 1" step="1">
                Datos Principal
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step :complete="pasos > 2" step="2">
                Name of step 2
              </v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
              <v-stepper-content step="1">
                <v-row class="mt-1">
                  <v-col cols="12" md="6" class="py-1">
                    <v-autocomplete
                      :items="$store.state.bancos.cuentas"
                      item-text="label"
                      item-value="id"
                      label="Cuenta de Salida de Banco"
                      v-model="id_cuenta"
                      return-object
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      outlined
                      dense
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-text-field
                      readonly
                      v-model="id_cuenta.banco"
                      label="Banco:"
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-text-field
                      readonly
                      v-model="id_cuenta.moneda"
                      label="Moneda:"
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1"
                    ><v-text-field
                      readonly
                      v-model="id_cuenta.cuenta"
                      label="N° Cuenta:"
                      outlined
                      dense
                    ></v-text-field
                  ></v-col>
                  <v-col cols="12" md="6" class="py-1"
                    ><v-text-field
                      readonly
                      v-model="id_cuenta.cci"
                      label="CCI:"
                      outlined
                      dense
                    ></v-text-field
                  ></v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <FormatFecha
                      :outlined="true"
                      :dense="true"
                      label="Fecha Operación"
                      v-model="fechaOperacion"
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-text-field
                      label="Número de Operación"
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-textarea
                      label="Comentarios"
                      rows="1"
                      outlined
                      dense
                      auto-grow
                    ></v-textarea>
                  </v-col>
                  <v-col cols="12" class="py-1">
                    <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
                  </v-col>
                  <v-col cols="12" class="pt-1 pb-5">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="pasos = 2"> Continue </v-btn>
                    <v-btn text> Cancel </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-content step="2">
                <v-card
                  class="mb-12"
                  color="grey lighten-1"
                  height="200px"
                ></v-card>

                <v-btn text> Cancel </v-btn>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  components: {
    //  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
    FormatFecha: () => import("../comun/FormatFecha.vue"),
    ArrastraYSolarComponent: () =>
      import("../comun/ArrastraYSolarComponent.vue"),
  },
  data() {
    return {
      pasos: 1,
      monto: 0,
      proveedor: null,
      symbol: "USD",
      id_cuenta: {},
      fechaOperacion: null,
      id_path: null,
    };
  },
  mounted() {
    this.$store.state.mainTitle = "BANCOS - NUEVA SALIDA";
    Promise.all([
      this.cargarProveedores(),
      this._getCoinsList(),
      this.getListBanksDetailsCargar(),
    ]);
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxP",
      "_uploadFile",
      "getValidaNroOp",
      "cargarProveedores",
      "_getCoinsList",
      "getListBanksDetailsCargar",
    ]),
    recibirId(file) {
      this.id_path = file.inserid;
      // this.payfile = file.archivo;

      // this.msgfile = "Archivo procesado y vinculado correctamente.";
      // this.errfile = "";
    },
    obtenerListado() {},
  },
  computed: {
    ...mapState([
      "itemsProveedorList",
      "listPagosXProveedorCxP",
      "provedores",
      "cuentas",
    ]),
  },
  watch: {
    id_cuenta(newVal) {
      let id_coins = newVal.id_coins;
      let coins = this.$store.state.itemsCoinsList.find(
        (coin) => coin.id === id_coins,
      );
      this.symbol = coins ? coins.symbol : "USD";
    },
  },
};
</script>

<style></style>
