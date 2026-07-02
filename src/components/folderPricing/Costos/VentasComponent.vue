<template>
  <v-container fluid>
    <div class="">
      <v-row>
        <v-col cols="12" lg="4" xl="4" class="my-1 py-2">
          <span class="title">
            Ventas {{ currencyFormat($store.state.pricing.totalVenta) }}
            <v-btn icon color="primary" @click="abrirModal">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
    <v-expansion-panels multiple>
      <v-expansion-panel
        v-for="(item, index) in panelesConDatos"
        :key="index"
        dense
        class="my-1"
      >
        <v-expansion-panel-header>
          {{ item.name }} : {{ obtenerTotalEnBaseTipoCosto(item.codigo) }}
        </v-expansion-panel-header>

        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in obtenerCostosEnBaseTipoCosto(item.codigo)"
                :key="i"
                :class="{ 'bg-warning': valor.tieneprofitflag }"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    x-small
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    dense
                    max-width="50%"
                    v-model="valor.costounitario"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                    hide-details
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14 || v.code == 15),
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    dense
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    dense
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearCostoTotal(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="dialog" persistent max-width="30%">
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title> Nuevo Costo </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  autocomplete="none"
                  :items="tipoOpcion"
                  label="Tipo"
                  item-value="codigo"
                  item-text="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Multiplicador"
                  :items="$store.state.pricing.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costounitario"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-alert
                  outlined
                  type="warning"
                  prominent
                  border="left"
                  class="px-5 mx-5"
                  dense
                >
                  El concepto se verá reflejado al abrir la sección
                  correspondiente.
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" @click="guardarCosto()">Aceptar</v-btn>
            <v-btn color="red" @click="dialog = !dialog" dark>cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-container>
</template>
<script>
import mixins from "@/components/mixins/funciones";
export default {
  mixins: [mixins],
  props: ["valores", "actualizarCostosFlag", "amount"],
  data() {
    return {
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      dialog: false,

      fromDataService: {
        ventaFlag: 0,
        esopcionflag: 0,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 1,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      },
    };
  },
  mounted() {
    this.calcTotales();
  },
  methods: {
    obtenerCostosEnBaseTipoCosto(codigoTipoCosto) {
      //   if (this.id_modality == 1) {
      if (codigoTipoCosto == "LO")
        return this.valores.filter((v) => v.eslocalflag);
      if (codigoTipoCosto == "AD")
        return this.valores.filter((v) => v.esaduanaflag);
      if (codigoTipoCosto == "AL")
        return this.valores.filter((v) => v.esalmacenflag);
      if (codigoTipoCosto == "FL")
        return this.valores.filter((v) => v.esfleteflag);
      if (codigoTipoCosto == "GT")
        return this.valores.filter((v) => v.esgastostercerosflag);

      return this.valores;
    },

    obtenerTotalEnBaseTipoCosto(codigoTipoCosto) {
      if (codigoTipoCosto == "LO")
        return this.currencyFormat(this.resumenOpcion.origen);
      if (codigoTipoCosto == "AD")
        return this.currencyFormat(this.resumenOpcion.aduana);
      if (codigoTipoCosto == "AL")
        return this.currencyFormat(this.resumenOpcion.almacen);
      if (codigoTipoCosto == "FL")
        return this.currencyFormat(this.resumenOpcion.flete);
      if (codigoTipoCosto == "GT")
        return this.currencyFormat(this.resumenOpcion.gastostercero);

      return currencyFormat(0);
    },
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.$store.state.pricing.listCostos =
        this.$store.state.pricing.listCostos.filter((v) => v.status == 1);
      setTimeout(() => {
        this.recalcularCostos();
      }, 10);
    },
    async calcTotales() {
      setTimeout(async () => {
        await this.calcularTotalesFlete();
        await this.calcularTotalesNoFlete();
        await this.calcTotal();
      }, 100);
    },
    calcularTotalesFlete() {
      this.totalOption = 0;
      this.resumenOpcion = {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      if (!this.isFlete) return;

      this.valores
        .filter((v) => v.esfleteflag == 1 && v.status == 1)
        .forEach((element) => {
          this.resumenOpcion.flete += this.obtenerCostoElemento(element);
        });
      this.$store.state.pricing.totalFlete = this.resumenOpcion.flete;
    },

    calcularTotalesNoFlete() {
      // Mantener el flete acumulado previamente
      this.resumenOpcion = {
        ...this.resumenOpcion,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };
      this.valores
        .filter((v) => v.status == 1)
        .forEach((element) => {
          // Usamos el helper para obtener el costo procesado una sola vez
          const costo = this.obtenerCostoElemento(element);

          if (this.isOrigen && element.esorigenflag == 1) {
            this.resumenOpcion.origen += Number(costo);
          }
          if (this.isLocal && element.eslocalflag == 1) {
            this.resumenOpcion.gasto += Number(costo); // Mantenido como 'gasto' según tu lógica
          }
          if (this.isAduana && element.esaduanaflag == 1) {
            this.resumenOpcion.aduana += Number(costo);
          }
          if (this.isAlmacen && element.esalmacenflag == 1) {
            this.resumenOpcion.almacen += Number(costo);
          }
          if (this.isGastosTercero && element.esgastostercerosflag == 1) {
            this.resumenOpcion.gastostercero += Number(costo);
          }
        });
    },
    calcTotal() {
      this.totalOption = 0;
      this.totalOption =
        (Number(this.resumenOpcion.flete) || 0) +
        (Number(this.resumenOpcion.gasto) || 0) +
        (Number(this.resumenOpcion.aduana) || 0) +
        (Number(this.resumenOpcion.origen) || 0) +
        (Number(this.resumenOpcion.almacen) || 0) +
        (Number(this.resumenOpcion.gastostercero) || 0);

      this.$store.state.pricing.totalVenta = this.totalOption;
      // this.setTotalOpcion(valores);
    },
    obtenerCostoElemento(element) {
      const { listMultiplicador, datosPrincipales, totalFlete } =
        this.$store.state.pricing;
      const multiplicadores = listMultiplicador || [];

      // Buscamos el multiplicador una sola vez por elemento
      const multEncontrado = multiplicadores.find(
        (v) => v.id === element.id_multiplicador,
      );

      const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
      const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

      // CASO A: No es porcentaje (Cálculo basado en factor)
      if (this.isNotPorcentaje(element, element.id_multiplicador)) {
        const factorCalculado = this.calcularFac(
          codigoMultiplicador,
          datosPrincipales.volumen,
          datosPrincipales.peso,
          datosPrincipales.containers,
          datosPrincipales.amount,
        );
        return valorMultiplicador * element.costounitario * factorCalculado;
      }

      // CASO B: Sí es porcentaje (Cálculo basado en CIF / Seguro)
      const codigosEspeciales = [13, 14, 15, 5];
      const parametroEspecial = codigosEspeciales.includes(codigoMultiplicador)
        ? element.cif
        : element.seguro;

      return this.calcularValor(
        datosPrincipales.amount,
        totalFlete,
        multEncontrado ? codigoMultiplicador : "",
        parametroEspecial,
        element.minimo,
      );
    },
    cerrarModalNuevoCosto() {
      this.$refs.frmNuevoCosto.reset();
      this.dialog = !this.dialog;
    },
    guardarCosto() {
      if (this.$refs.frmNuevoCosto.validate()) {
        if (this.fromDataService.idOpcion == "OR") {
          this.fromDataService.esorigenflag = 1;
        }
        if (this.fromDataService.idOpcion == "LO") {
          this.fromDataService.eslocalflag = 1;
        }
        if (this.fromDataService.idOpcion == "AD") {
          this.fromDataService.esaduanaflag = 1;
        }
        if (this.fromDataService.idOpcion == "AL") {
          this.fromDataService.esalmacenflag = 1;
        }
        if (this.fromDataService.idOpcion == "FL") {
          this.fromDataService.esfleteflag = 1;
        }
        if (this.fromDataService.idOpcion == "GT") {
          this.fromDataService.esgastostercerosflag = 1;
        }
        this.$store.state.pricing.opcionCostos
          .filter((v) => v.nro_propuesta == this.valores[0].nro_propuesta)[0]
          .listCostos.push(this.fromDataService);

        this.dialog = !this.dialog;
        this.calcTotales();
        this.$store.state.pricing.actualizarCostosFlag =
          !this.$store.state.pricing.actualizarCostosFlag;
        //
      }
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.limpiar();
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14, 15];

      let mul = this.$store.state.pricing.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code),
      );

      return !mul;
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isFlete() {
      let val = this.valores.some(
        (v) => v.esfleteflag == 1 && v.status == true,
      );

      return val;
    },
    isOrigen() {
      let val = this.valores.some(
        (v) => v.esorigenflag == 1 && v.status == true,
      );

      return val;
    },
    isLocal() {
      let val = this.valores.some(
        (v) => v.eslocalflag == 1 && v.status == true,
      );
      return val;
    },

    isAduana() {
      let val = this.valores.some(
        (v) => v.esaduanaflag == 1 && v.status == true,
      );
      return val;
    },
    isAlmacen() {
      let val = this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true,
      );
      return val;
    },
    isGastosTercero() {
      let val = this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true,
      );
      return val;
    },
    montoConfeccion(item) {
      let monto = 0;
      if (item.code_cost == 33) {
        let amount = this.$store.state.pricing.datosPrincipales.amount;
        let cif =
          parseFloat(amount) +
          parseFloat(this.$store.state.pricing.totalFlete) +
          (parseFloat(amount) +
            parseFloat(this.$store.state.pricing.totalFlete)) *
            0.01;

        if (cif < 5000) {
          monto = 50;
        }
        if (cif >= 5000 && cif < 10000) {
          monto = 80;
        }
        if (cif >= 10000) {
          monto = 80 + parseFloat(cif * 0.0025);
        }
      }

      item.costounitario = parseFloat(monto).toFixed(2);
      return this.currencyFormat(monto);
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isITBM(code) {
      return code == 38 ? true : false;
    },
    montoITBM(item) {
      let monto = 0;
      let code = [29, 36, 41, 68];
      if (item.code_cost == 38) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto += parseFloat(
            (this.$store.state.pricing.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador,
            )
              ? this.$store.state.pricing.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].valor
              : 0) *
              element.costounitario *
              this.calcularFac(
                this.$store.state.pricing.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "N",
                this.$store.state.pricing.datosPrincipales.volumen,
                this.$store.state.pricing.datosPrincipales.peso,
                this.$store.state.pricing.datosPrincipales.containers,
                this.$store.state.pricing.datosPrincipales.amount,
              ),
          );
        });
      }
      item.costounitario = parseFloat(monto * 0.07).toFixed(2);
      return this.currencyFormat(parseFloat(monto * 0.07).toFixed(2));
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
    },
    montoNotaCredito(item) {
      let monto = 0;
      let code = [33];
      if (item.code_cost == 69) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto = element.costounitario;
        });
      }
      item.costounitario = -1 * parseFloat(monto * 0.5).toFixed(2);
      return this.currencyFormat(-1 * parseFloat(monto * 0.5).toFixed(2));
    },
    limpiar() {
      this.fromDataService = {
        ventaFlag: 0,
        esopcionflag: 0,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 1,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      };
    },
    isImport() {
      return this.$store.state.pricing.listModality.some(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idsentido &&
          v.code == "I",
      );
    },
    recalcularCostos() {
      this.$store.state.pricing.actualizarCostosFlag =
        !this.$store.state.pricing.actualizarCostosFlag;
      this.calcTotales();
    },
    reponerCero(valor) {
      if (
        valor.costounitario == "" ||
        valor.costounitario == null ||
        valor.costounitario == undefined
      ) {
        valor.costounitario = 0;
      }
      this.$forceUpdate();
    },
    formatearValorCalculado(valor) {
      const pricingState = this.$store.state.pricing;
      const multiplicadores = pricingState.listMultiplicador || [];

      const multiplicadorEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      const codigoMultiplicador = multiplicadorEncontrado
        ? multiplicadorEncontrado.code
        : "";

      let tercerParametro = 0;
      if (multiplicadorEncontrado) {
        const codigosEspeciales = [13, 14, 15, 5];
        tercerParametro = codigosEspeciales.includes(
          multiplicadorEncontrado.code,
        )
          ? valor.cif
          : valor.seguro;
      }

      const resultadoCalculado = this.calcularValor(
        pricingState.datosPrincipales.amount,
        pricingState.totalFlete,
        codigoMultiplicador,
        tercerParametro,
        valor.minimo,
      );

      return this.currencyFormat(resultadoCalculado);
    },
    formatearCostoTotal(valor) {
      // 1. Desestructuración de los estados del Vuex para escribir menos y más limpio
      const { listMultiplicador, datosPrincipales } = this.$store.state.pricing;
      const multiplicadores = listMultiplicador || [];

      // 2. Buscamos el multiplicador correspondiente UNA SOLA VEZ
      const multEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      // 3. Extraemos las variables con valores por defecto si no existe el multiplicador
      const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
      const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

      // 4. Ejecutamos la función calcularFac pasándole los datos de pricing
      const factorCalculado = this.calcularFac(
        codigoMultiplicador,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      );

      // 5. Realizamos la operación matemática final
      const operacionFinal =
        valorMultiplicador * valor.costounitario * factorCalculado;

      // 6. Retornamos el valor con su respectivo formato de moneda
      return this.currencyFormat(operacionFinal);
    },
    formatearValorCalculado(valor) {
      const pricingState = this.$store.state.pricing;
      const multiplicadores = pricingState.listMultiplicador || [];

      const multiplicadorEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      const codigoMultiplicador = multiplicadorEncontrado
        ? multiplicadorEncontrado.code
        : "";

      let tercerParametro = 0;
      if (multiplicadorEncontrado) {
        const codigosEspeciales = [13, 14, 15, 5];
        tercerParametro = codigosEspeciales.includes(
          multiplicadorEncontrado.code,
        )
          ? valor.cif
          : valor.seguro;
      }

      const resultadoCalculado = this.calcularValor(
        pricingState.datosPrincipales.amount,
        pricingState.totalFlete,
        codigoMultiplicador,
        tercerParametro,
        valor.minimo,
      );

      return this.currencyFormat(resultadoCalculado);
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    amount() {
      this.calcTotales();
    },
  },
  computed: {
    panelesConDatos() {
      const listaTipos = this.$store.state.pricing.listTipoCostos;
      if (!listaTipos) return [];
      const panelesFiltrados = listaTipos.filter((tipo) => {
        const costosFiltrados = this.obtenerCostosEnBaseTipoCosto(tipo.codigo);
        return costosFiltrados && costosFiltrados.length > 0;
      });

      return panelesFiltrados.sort((a, b) => {
        const obtenerPeso = (item) => {
          if (item.name && item.name.startsWith("ORIGEN")) {
            return 1;
          }
          if (item.name && item.name.startsWith("DESTINO")) {
            return 3;
          }
          return 2;
        };

        return obtenerPeso(a) - obtenerPeso(b);
      });
    },
    panelesAbiertos() {
      return this.panelesConDatos.map((_, index) => index);
    },
  },
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-header
  .v-expansion-panel-content__wrap {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  padding: 2px 8px 2px;
  min-height: auto;
}
.widthTD {
  max-width: 250px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 30% !important;
  max-width: 30% !important;
}
.colConcepto {
  width: 45% !important;
  max-width: 45% !important;
  min-width: 45% !important;
}
.colCostos {
  width: 10% !important;
  max-width: 10% !important;
}
/* .tdMontos {
  width:  !important; 
} */

td {
  padding: 0 3px !important;
}
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-text-field__slot {
  max-width: 5px !important;
}

table td:nth-child(4) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  padding: 0 8px 16px !important;
}

.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 2px 0 2px !important;
}

.bg-warning {
  background-color: #c8e6c9 !important;
}
</style>
