<template>
  <v-container>
    <v-stepper-vertical v-model="e6" hide-actions eager>
      <v-stepper-vertical-item :complete="e6 > 1" :value="1" title="Fechas:">
        <v-form ref="frmFecha">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="
                  pricingStore.opcionCostos[pricingStore.index]
                    .date_end
                "
                type="date"
                label="`Fecha Validez de la cotización`"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="
                  pricingStore.opcionCostos[pricingStore.index]
                    .tiempo_transito
                "
                type="number"
                label="`Tiempo en tránsito de la Opción`"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser positivo.',
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-btn size="small" class="mx-1" color="primary" @click="continuar(2)">
                Continue
              </v-btn>
              <v-btn size="small" class="mx-1" color="error" @click="cancelar">
                Cancel
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-stepper-vertical-item>

      <v-stepper-vertical-item
        :complete="e6 > 2"
        :value="2"
        title="Costos Requerido:"
      >
        <v-table density="compact">
          <thead>
            <tr>
              <th></th>
              <th style="">Proveedor</th>
              <th style="">Conceptos</th>
              <th style="">Multipicador</th>
              <th class="derecha" style="">Costo Unitario</th>
              <th style="">Sub Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(valor, i) in valores.filter((v) => v.status == 1)"
              :key="i"
            >
              <td class="btnAccion">
                <v-btn variant="text"
                  icon
                  color="red"
                  size="x-small"
                  @click="eliminarCostos({ costo: valor })"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
              <td class="colProveedorMultiplicador">
                <v-autocomplete
                  density="compact"
                  item-title="namelong"
                  item-value="id"
                  :items="proveedorStore.lstProveedores"
                  v-model="valor.id_proveedor"
                  @update:search="recargarProveedores"
                  hide-details
                  menu-icon=""
                >
                  <template #append-inner>
                    <v-icon
                      icon="mdi-plus"
                      @mousedown.stop
                      @click.stop="abrirModalRegistroProveedor(valor)"
                    />
                  </template>
                </v-autocomplete>
              </td>
              <td class="colConcepto">
                <v-text-field
                  density="compact"
                  hide-details
                  v-model="valor.nameservice"
                ></v-text-field>
              </td>
              <td class="colProveedorMultiplicador">
                <v-select item-title="text"
                  class="widthTD"
                  :items="pricingStore.listMultiplicador"
                  v-model="valor.id_multiplicador"
                  placeholder="Multiplicador"
                  hide-details
                  density="compact"
                  @update:model-value="calcTotales"
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
                  density="compact"
                  v-model="valor.costounitario"
                  :error-messages="valor.error"
                  :rules="[
                    (v) => {
                      if (v > 0) {
                        valor.error = ''; // Borra el mensaje de error si el valor es válido
                        return true; // La regla se cumple
                      }
                      valor.error = 'El costo que tiene un valor 0.00.';
                      return false; // La regla no se cumple
                    },
                  ]"
                  prefix="$"
                  type="number"
                  step="0.01"
                  :min="valor.minimo"
                  v-on:blur="calcTotales"
                ></v-text-field>
                <v-text-field
                  class="derecha tdMontos"
                  v-if="
                    pricingStore.listMultiplicador.some(
                      (v) =>
                        v.id == valor.id_multiplicador &&
                        (v.code == 13 || v.code == 14 || v.code == 15),
                    ) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                  hide-details
                  suffix="%"
                  density="compact"
                  max="100"
                  v-model="valor.cif"
                  type="number"
                  :min="valor.minimo"
                  step="0.01"
                  v-on:blur="calcTotales"
                ></v-text-field>
                <v-text-field
                  suffix="%"
                  class="derecha tdMontos"
                  v-if="
                    pricingStore.listMultiplicador.some(
                      (v) => v.id == valor.id_multiplicador && v.code == 5,
                    ) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                  hide-details
                  density="compact"
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
                  density="compact"
                  v-model="valor.costounitario"
                  :error-messages="valor.error"
                  prefix="$"
                ></v-text-field>

                <v-text-field
                  v-if="isConfeccion(valor.code_cost)"
                  readonly
                  density="compact"
                  v-model="valor.costounitario"
                  :error-messages="valor.error"
                  prefix="$"
                ></v-text-field>
                <v-text-field
                  v-if="isNotaCredito(valor.code_cost)"
                  readonly
                  density="compact"
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
                {{
                  currencyFormat(
                    (pricingStore.listMultiplicador.filter(
                      (v) => v.id == valor.id_multiplicador,
                    ).length > 0
                      ? pricingStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador,
                        )[0].valor
                      : 0) *
                      valor.costounitario *
                      calcularFac(
                        pricingStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador,
                        ).length > 0
                          ? pricingStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador,
                            )[0].code
                          : "N",
                        pricingStore.datosPrincipales.volumen,
                        pricingStore.datosPrincipales.peso,
                        pricingStore.datosPrincipales.containers,
                        pricingStore.datosPrincipales.amount,
                      ),
                  )
                }}
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
                {{
                  currencyFormat(
                    calcularValor(
                      pricingStore.datosPrincipales.amount,
                      pricingStore.totalFlete,
                      pricingStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador,
                      ).length > 0
                        ? pricingStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador,
                          )[0].code
                        : "",
                      pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                        ? pricingStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15),
                          )
                          ? valor.cif
                          : valor.seguro
                        : 0,
                    ),
                  )
                }}
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
        </v-table>
        <br />
        <v-btn size="small" class="mx-1" color="primary" @click="continuar(3)">
          Continue
        </v-btn>
        <v-btn size="small" class="mx-1" color="error" @click="cancelar">
          Cancel
        </v-btn>
      </v-stepper-vertical-item>

      <v-stepper-vertical-item
        :complete="e6 > 3"
        :value="3"
        title="Copiar costos a la sección de ventas:"
      >
        <v-spacer></v-spacer>
        <v-btn class="mx-2" color="success" @click="copiarCostostoVentas(4)"
          >Si, Copiar</v-btn
        >
        <v-btn class="mx-2" color="warning" @click="continuar(4)"
          >No Copiar</v-btn
        >
      </v-stepper-vertical-item>

      <v-stepper-vertical-item :value="4" title="Profit Estimado">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="profit"
              type="numer"
              step="0.01"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-btn size="small" color="primary" @click="continuar(5)">
              Continue
            </v-btn>
            <v-btn size="small" class="mx-1" color="error" @click="cancelar">
              Cancel
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :value="5" title="Finalizar">
        <v-btn color="success" @click="editarCotizacion">Finalizar</v-btn>
      </v-stepper-vertical-item>
    </v-stepper-vertical>
  </v-container>
</template>

<script>
import moment from "moment";
import mixins from "@/components/mixins/funciones.js";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useProveedorStore } from "@/stores/proveedor";
import { usePricingStore } from "@/stores/pricing";
export default {
  emits: ["close"],
  mixins: [mixins],
  mounted() {
    this.$nextTick(() => {
      this.e6 = 1;
      this.recargarHayOpciones();

      console.log(this.mostrarLocalFlag);
      console.log(this.mostrarAduanaFlag);
      console.log(this.mostrarAlmacenFlag);
      console.log(this.mostrarGastosTercerosFlag);
    });
  },
  data() {
    return {
      e6: 1,
      profit: 0,
      mostrarOrigenFlag: false,
      mostrarLocalFlag: false,
      mostrarAduanaFlag: false,
      mostrarFleteExportFlag: false,
      mostrarAlmacenFlag: false,
      mostrarGastosTercerosFlag: false,
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      resumenOpcionVentas: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      valores: usePricingStore().opcionCostos[0].listCostos.filter(
        (v) => v.esopcionflag == 1 && v.costounitario == 0,
      ),
      valoresVentas:
        usePricingStore().opcionCostos[0].listCostos.filter(
          (v) => v.esventaflag == 1,
        ),
    };
  },
  methods: {
    ...mapPiniaActions(usePricingStore, ["updateQuote"]),
    ...mapPiniaActions(useProveedorStore, ["obtenerProveedorPricing"]),
    recargarHayOpciones() {
      if (this.isOrigen) {
        this.mostrarOrigenFlag = true;
      }
      if (this.isLocal) {
        this.mostrarLocalFlag = true;
      }

      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
      }
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
      }
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
      }
    },
    async recargarProveedores(e) {
      let opciones = [...this.pricingStore.opcionCostos];
      let IdProveedor = [];
      opciones.forEach((opcion) => {
        opcion.listCostos.forEach((costo) => {
          if (!IdProveedor.some((v) => v == costo.id_proveedor))
            IdProveedor.push(costo.id_proveedor);
        });
      });
      await this.obtenerProveedorPricing({
        id: IdProveedor.join(","),
        search: e,
      });
    },
    isDateValid(date) {
      if (!date) {
        return true; // Pasa la validación si el campo está vacío
      }

      const selectedDate = moment(date, "YYYY-MM-DD", true);
      const today = moment();

      return selectedDate.isAfter(today);
    },
    async continuar(step) {
      this.pricingStore.tiporeporte = "AGRUPADO";
      if (step == 2 && !(await this.$refs.frmFecha.validate()).valid) {
        return;
      }
      if (step === 5) {
        console.log(this.pricingStore.listMultiplicador);
        let idEmbarque = this.pricingStore.listMultiplicador.filter(
          (v) => Number(v.code) == 1,
        )[0].id;
        let flags = { origin: 0, local: 0, aduana: 0, almacen: 0, terceros: 0 };
        if (this.mostrarOrigen) {
          flags.origin = 1;
        } else if (this.mostrarLocal) {
          flags.local = 1;
        } else if (this.mostrarAduana) {
          flags.aduana = 1;
        } else if (this.mostrarAlmacen) {
          flags.almacen = 1;
        } else if (this.mostrarGastosTerceros) {
          flags.terceros = 1;
        }
        let fromDataService = {
          id: "",
          code_cost: "0",
          ventaFlag: 0,
          esopcionflag: 0,
          id_begend: 0,
          costounitario: Number(this.profit),
          esorigenflag: 0,
          eslocalflag: 1,
          esaduanaflag: 0,
          esalmacenflag: 0,
          seguro: 0,
          cif: 0,
          esventaflag: 1,
          status: 1,
          id_groupservices: 0,
          id_multiplicador: idEmbarque,
          id_proveedor: 0,
          nameservice: "PROFIT",
        };
        this.pricingStore.opcionCostos[0].listCostos.push(
          fromDataService,
        );
        setTimeout(() => {
          console.log(this.valoresVentas);
        }, 500);
        this.$forceUpdate();
      }
      this.e6 = step;
    },
    cancelar() {
      this.e6--;
    },

    copiarCostostoVentas() {
      let costos = this.pricingStore.opcionCostos[0].listCostos.filter(
        (v) => v.esopcionflag == 1,
      );
      this.valoresVentas
        .filter((v) => v.status == 1)
        .forEach((venta) => {
          let costo = costos.find((c) => c.nameservice == venta.nameservice);
          if (costo) {
            venta.costounitario = costo.costounitario;
            venta.id_multiplicador = costo.id_multiplicador;
            venta.cif = costo.cif;
            venta.seguro = costo.seguro;
          }
        });
      this.continuar(4);
    },
    async calcTotales() {
      Promise.all([
        this.calcularTotalesFlete(),
        this.calcularTotalesNoFlete(),
      ]).then(() => {
        this.calcTotal();
      });
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

      if (this.isFlete) {
        this.valores
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.resumenOpcion.flete +=
                (this.pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  this.pricingStore.datosPrincipales.volumen,
                  this.pricingStore.datosPrincipales.peso,
                  this.pricingStore.datosPrincipales.containers,
                  this.pricingStore.datosPrincipales.amount,
                );
            } else {
              this.resumenOpcion.flete += this.calcularValor(
                this.pricingStore.datosPrincipales.amount,
                this.pricingStore.totalFlete,
                this.pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                this.pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5),
                )
                  ? this.pricingStore.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 ||
                          v.code == 13 ||
                          v.code == 15 ||
                          v.code == 5),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          });
      }
    },
    calcularTotalesNoFlete() {
      this.resumenOpcion = {
        flete: this.resumenOpcion.flete,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };
      this.valores
        .filter((v) => v.status == 1)
        .forEach((element) => {
          //   GASTOS
          if (this.isOrigen) {
            if (element.esorigenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.origen +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.origen += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          if (this.isLocal) {
            if (element.eslocalflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gasto +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.gasto += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ADUANA
          if (this.isAduana) {
            if (element.esaduanaflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.aduana +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.aduana += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ALMACEN
          if (this.isAlmacen) {
            if (element.esalmacenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.almacen +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.almacen += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   GASTOS DE TERCEROS
          if (this.isGastosTercero) {
            if (element.esgastostercerosflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gastostercero +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.gastostercero += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
        });
    },
    calcTotal() {
      this.totalOption = 0;
      this.totalOption =
        this.resumenOpcion.flete +
        this.resumenOpcion.gasto +
        this.resumenOpcion.aduana +
        this.resumenOpcion.origen +
        this.resumenOpcion.almacen +
        this.resumenOpcion.gastostercero;

      this.pricingStore.totalCosto = this.totalOption;
      // this.setTotalOpcion(valores);
    },

    async calcTotalesVentas() {
      Promise.all([
        this.calcularTotalesFleteVentas(),
        this.calcularTotalesNoFleteVentas(),
      ]).then(() => {
        this.calcTotalVentas();
      });
    },

    calcularTotalesFleteVentas() {
      this.totalOption = 0;
      this.resumenOpcionVentas = {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      if (this.isFlete) {
        this.valores
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.resumenOpcionVentas.flete +=
                (this.pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  this.pricingStore.datosPrincipales.volumen,
                  this.pricingStore.datosPrincipales.peso,
                  this.pricingStore.datosPrincipales.containers,
                  this.pricingStore.datosPrincipales.amount,
                );
            } else {
              this.resumenOpcionVentas.flete += this.calcularValor(
                this.pricingStore.datosPrincipales.amount,
                this.pricingStore.totalFlete,
                this.pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                this.pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5),
                )
                  ? this.pricingStore.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 ||
                          v.code == 13 ||
                          v.code == 15 ||
                          v.code == 5),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          });
      }
    },
    calcularTotalesNoFleteVentas() {
      this.resumenOpcionVentas = {
        flete: this.resumenOpcionVentas.flete,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };
      this.valores
        .filter((v) => v.status == 1)
        .forEach((element) => {
          //   GASTOS
          if (this.isOrigen) {
            if (element.esorigenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcionVentas.origen +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcionVentas.origen += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          if (this.isLocal) {
            if (element.eslocalflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcionVentas.gasto +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcionVentas.gasto += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ADUANA
          if (this.isAduana) {
            if (element.esaduanaflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcionVentas.aduana +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcionVentas.aduana += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ALMACEN
          if (this.isAlmacen) {
            if (element.esalmacenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcionVentas.almacen +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcionVentas.almacen += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   GASTOS DE TERCEROS
          if (this.isGastosTercero) {
            if (element.esgastostercerosflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcionVentas.gastostercero +=
                  (this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.pricingStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.pricingStore.datosPrincipales.volumen,
                    this.pricingStore.datosPrincipales.peso,
                    this.pricingStore.datosPrincipales.containers,
                    this.pricingStore.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcionVentas.gastostercero += this.calcularValor(
                  this.pricingStore.datosPrincipales.amount,
                  this.pricingStore.totalFlete,
                  this.pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.pricingStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                    ? this.pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
        });
    },
    calcTotalVentas() {
      this.totalOption = 0;
      this.totalOption =
        this.resumenOpcionVentas.flete +
        this.resumenOpcionVentas.gasto +
        this.resumenOpcionVentas.aduana +
        this.resumenOpcionVentas.origen +
        this.resumenOpcionVentas.almacen +
        this.resumenOpcionVentas.gastostercero;

      this.pricingStore.totalVenta = this.totalOption;
      // this.setTotalOpcion(valores);
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14, 15];

      let mul = this.pricingStore.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code),
      );

      return !mul;
    },
    isITBM(code) {
      return code == 38 ? true : false;
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
    },
    async editarCotizacion() {
      let val = true;

      this.$store.state.spiner = false;
      await this.updateQuote();

      this.$router.push({
        name: "verQuote",
        params: {
          id: this.pricingStore.id,
          step: this.pricingStore.step
            ? this.pricingStore.step
            : 1,
        },
      });
      this.$store.state.spiner = false;
      this.$emit("close");
    },
  },
  computed: {
    ...mapStores(usePricingStore, useProveedorStore),
    mostrarOrigen() {
      return this.mostrarOrigenFlag;
    },
    mostrarLocal() {
      return this.mostrarLocalFlag;
    },
    mostrarAduana() {
      return this.mostrarAduanaFlag;
    },

    mostrarAlmacen() {
      return this.mostrarAlmacenFlag;
    },
    mostrarGastosTerceros() {
      return this.mostrarGastosTercerosFlag;
    },
    isFlete() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.esfleteflag == 1 && v.status == 1);
    },
    isOrigen() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.esorigenflag == 1 && v.status == 1);
    },
    isLocal() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.eslocalflag == 1 && v.status == 1);
    },
    isAduana() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.esaduanaflag == 1 && v.status == 1);
    },
    isAlmacen() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.esalmacenflag == 1 && v.status == 1);
    },
    isGastosTercero() {
      return this.pricingStore.opcionCostos[
        this.pricingStore.index
      ].listCostos.some((v) => v.esgastostercerosflag == 1 && v.status == 1);
    },
    mostrarOrigen() {
      return this.mostrarOrigenFlag;
    },
    mostrarLocal() {
      return this.mostrarLocalFlag;
    },
    mostrarAduana() {
      return this.mostrarAduanaFlag;
    },
    mostrarFleteExport() {
      return !this.isImport && this.mostrarFleteExportFlag;
    },
    mostrarAlmacen() {
      return this.mostrarAlmacenFlag;
    },
    mostrarGastosTerceros() {
      return this.mostrarGastosTercerosFlag;
    },
  },
};
</script>

<style scoped>
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 20% !important;
  max-width: 20% !important;
}
.colConcepto {
  width: 35% !important;
  max-width: 35% !important;
  min-width: 35% !important;
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
</style>
