<template>
  <v-container fluid>
    <h1>Comparativa de Costos</h1>
    <v-row>
      <v-col cols="12">
        <v-simple-table dense class="elevation-1 my-7">
          <thead>
            <tr>
              <th
                class="centrado"
                v-for="(header, index) in headers"
                :key="index"
              >
                {{ header.text }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(opcion, index) in opcionesSeleccionadas" :key="index">
              <td>Opción - {{ opcion.nro_propuesta }}</td>
              <td>{{ opcion.proveedor }}</td>
              <td class="centrado" v-if="flete">
                {{ opcion.flete }}
              </td>
              <td class="centrado" v-if="origen">
                {{ opcion.origen }}
              </td>
              <td class="centrado" v-if="local">
                {{ opcion.local }}
              </td>
              <td class="centrado" v-if="aduana">
                {{ opcion.aduana }}
              </td>
              <td class="centrado" v-if="almacen">
                {{ opcion.almacen }}
              </td>
              <td class="centrado" v-if="gastostercero">
                {{ opcion.gastostercero }}
              </td>
              <td class="totalClass">{{ opcion.total }}</td>
              <td class="centrado">{{ opcion.tiempo_transito }} días</td>
              <td>
                <v-checkbox
                  label=""
                  class="mx-auto"
                  v-model="opcion.selected"
                  @click="cambiarOpcionSeleccionada(opcion)"
                >
                </v-checkbox>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
      <v-col cols="6" class="izquierda">
        <v-btn @click="regregar()" color="default">Anterior</v-btn>
      </v-col>
      <v-col cols="6" class="derecha">
        <v-btn @click="continuar()" color="#3363A2" dark
          >Cotizar Venta final del cliente</v-btn
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import mixins from "@/components/mixins/funciones.js";
import Swal from "sweetalert2";
export default {
  mixins: [mixins],
  data() {
    return {
      loadingTable: false,
      headers: [],
      opcionesSeleccionadas: [],
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      flete: false,
      origen: false,
      local: false,
      aduana: false,
      almacen: false,
      gastostercero: false,
      totalFleteVentas: 0,
    };
  },
  async mounted() {
    this.loadingTable = false;

    setTimeout(async () => {
      await this.calcularTotalesOpciones();
      await this.agregarFilasAlHeader();
    }, 2000);
  },
  methods: {
    regregar() {
      Swal.fire({
        icon: "question",
        html: `<h1>¿Desea regresar a la OPCIÓN - COSTOS ${this.$store.state.pricing.opcionCostos.length}?<h1>`,
        confirmButtonColor: "green",
        showCancelButton: true,
        cancelButtonColor: "red",
        confirmButtonText: "<h1>Si, volver</h2>",
        cancelButtonText: "<h1>Cancelar</h2>",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((action) => {
        if (action.isConfirmed) {
          this.$store.state.pricing.tab = 2;
        }
      });
    },
    agregarFilasAlHeader() {
      this.headers = [
        { text: "Tarifa de Costos", value: "tarifa" },
        { text: "Proveedor Flete", value: "proveedor" },
      ];

      if (this.opcionesSeleccionadas.some((v) => parseFloat(v.flete) > 0)) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "FL",
          )[0].name,
          value: "flete",
        });
      }

      if (
        this.opcionesSeleccionadas.some(
          (v) => v.flete != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "FL",
          )[0].name,
          value: "flete",
          cellClass: "centrado",
        });
        this.flete = true;
      }

      if (
        this.opcionesSeleccionadas.some(
          (v) => v.origen != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "OR",
          )[0].name,
          value: "origen",
        });
        this.origen = true;
      }
      if (
        this.opcionesSeleccionadas.some(
          (v) => v.local != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "LO",
          )[0].name,
          value: "local",
        });
        this.local = true;
      }
      if (
        this.opcionesSeleccionadas.some(
          (v) => v.aduana != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "AD",
          )[0].name,
          value: "aduana",
        });
        this.aduana = true;
      }
      if (
        this.opcionesSeleccionadas.some(
          (v) => v.almacen != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "AL",
          )[0].name,
          value: "almacen",
        });
        this.almacen = true;
      }

      if (
        this.opcionesSeleccionadas.some(
          (v) => v.gastostercero != this.currencyFormat(0),
        )
      ) {
        this.headers.push({
          text: this.$store.state.pricing.listTipoCostos.filter(
            (v) => v.codigo == "GT",
          )[0].name,
          value: "gastostercero",
        });
        this.gastostercero = true;
      }
      this.headers.push({ text: "TOTAL", value: "total" });
      this.headers.push({
        text: "TIEMPO EN TRÁNSITO",
        value: "tiempo_transito",
      });
      this.headers.push({ text: "Usar", value: "selected" });
    },
    continuar() {
      if (this.$store.state.pricing.opcionCostos.some((v) => v.selected)) {
        Swal.fire({
          width: 1000,
          icon: "question",
          html: `<h1>¿Desea regresar a la OPCIÓN - COSTOS ${this.$store.state.pricing.opcionCostos.length}?</h1>`,
          confirmButtonColor: "green",
          showCancelButton: true,
          cancelButtonColor: "#4A85D2",
          confirmButtonText: "<h1>Si, ir a la venta del cliente final</h1>",
          cancelButtonText: "<h1>Regresar a la comparatirva</h1>",
          showCloseButton: true,
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((action) => {
          if (action.isConfirmed) {
            this.$emit("irVentaCliente");
            this.$store.state.pricing.llenadoCostos = false;
            this.$store.state.pricing.recargarCostoSeleccionados =
              !this.$store.state.pricing.recargarCostoSeleccionados;
            this.$store.state.pricing.page = 1;
          }
        });
      } else {
        Swal.fire({
          icon: "warning",
          text: "Para poder continuar, debe seleccionar al menos una opción de costos.",
          confirmButtonText: "Entendido",
        });
      }
    },
    async calcularTotalesOpciones() {
      this.loadingTable = true;
      this.opcionesSeleccionadas = [];

      const listaCostos = this.$store.state.pricing.opcionCostos || [];

      // Mapeamos y resolvemos las promesas en orden sin necesidad de setTimeout
      this.opcionesSeleccionadas = await Promise.all(
        listaCostos.map(async (element) => {
          // 1. Obtener nombre del proveedor
          let nameProveedor = "";
          const opcionProveedor = element.listCostos.find(
            (v) => v.esopcionflag === 1 && v.code_cost === 4,
          );

          if (opcionProveedor) {
            const proveedorEncontrado =
              this.$store.state.proveedor.lstProveedores.find(
                (v) => v.id === opcionProveedor.id_proveedor,
              );
            if (proveedorEncontrado) {
              nameProveedor = proveedorEncontrado.namelong;
            }
          }

          // 2. Calcular totales asíncronos
          await this.calcTotales(element.listCostos);

          // 3. Extraer y formatear valores de resumen
          const flete = parseFloat(this.resumenOpcion.flete || 0);
          const origen = parseFloat(this.resumenOpcion.origen || 0);
          const gasto = parseFloat(this.resumenOpcion.gasto || 0);
          const aduana = parseFloat(this.resumenOpcion.aduana || 0);
          const almacen = parseFloat(this.resumenOpcion.almacen || 0);
          const gastostercero = parseFloat(
            this.resumenOpcion.gastostercero || 0,
          );

          const totalSuma =
            flete + origen + gasto + aduana + almacen + gastostercero;

          // 4. Retornamos una copia del objeto formateado
          return {
            ...element,
            proveedor: nameProveedor,
            flete: this.currencyFormat(flete),
            origen: this.currencyFormat(origen),
            local: this.currencyFormat(gasto),
            aduana: this.currencyFormat(aduana),
            almacen: this.currencyFormat(almacen),
            gastostercero: this.currencyFormat(gastostercero),
            total: this.currencyFormat(totalSuma),
          };
        }),
      );

      this.loadingTable = false;
    },
    async calcTotales(data) {
      await this.calcularTotalesFleteVentas(data);
      await this.calcularTotalesFlete(data);
      await this.calcularTotalesNoFlete(data);
    },
    calcularTotalesFleteVentas(data) {
      this.totalFleteVentas = 0;

      if (this.isFlete(data)) {
        data
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.totalFleteVentas +=
                (this.$store.state.pricing.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  this.$store.state.pricing.datosPrincipales.volumen,
                  this.$store.state.pricing.datosPrincipales.peso,
                  this.$store.state.pricing.datosPrincipales.containers,
                  this.$store.state.pricing.datosPrincipales.amount,
                );
            }
          });
      }
    },
    calcularTotalesFlete(data) {
      this.totalOption = 0;
      this.resumenOpcion = {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      if (this.isFlete(data)) {
        data
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.resumenOpcion.flete +=
                (this.$store.state.pricing.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  this.$store.state.pricing.datosPrincipales.volumen,
                  this.$store.state.pricing.datosPrincipales.peso,
                  this.$store.state.pricing.datosPrincipales.containers,
                  this.$store.state.pricing.datosPrincipales.amount,
                );
            } else {
              this.resumenOpcion.flete += this.calcularValor(
                this.$store.state.pricing.datosPrincipales.amount,
                this.totalFleteVentas,
                this.$store.state.pricing.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                this.$store.state.pricing.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? this.$store.state.pricing.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          });
      }
    },
    calcularTotalesNoFlete(data) {
      this.resumenOpcion = {
        flete: this.resumenOpcion.flete,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };
      data
        .filter((v) => v.status == 1 && v.esopcionflag == 1)
        .forEach((element) => {
          //   GASTOS
          if (this.isOrigen(data)) {
            if (element.esorigenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.origen +=
                  (this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.$store.state.pricing.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.$store.state.pricing.datosPrincipales.volumen,
                    this.$store.state.pricing.datosPrincipales.peso,
                    this.$store.state.pricing.datosPrincipales.containers,
                    this.$store.state.pricing.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.origen += this.calcularValor(
                  this.$store.state.pricing.datosPrincipales.amount,
                  this.totalFleteVentas,
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.$store.state.pricing.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? this.$store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          if (this.isLocal(data)) {
            if (element.eslocalflag) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gasto +=
                  (this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.$store.state.pricing.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.$store.state.pricing.datosPrincipales.volumen,
                    this.$store.state.pricing.datosPrincipales.peso,
                    this.$store.state.pricing.datosPrincipales.containers,
                    this.$store.state.pricing.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.gasto += this.calcularValor(
                  this.$store.state.pricing.datosPrincipales.amount,
                  this.totalFleteVentas,
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.$store.state.pricing.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? this.$store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ADUANA
          if (this.isAduana(data)) {
            if (element.esaduanaflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.aduana +=
                  (this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.$store.state.pricing.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.$store.state.pricing.datosPrincipales.volumen,
                    this.$store.state.pricing.datosPrincipales.peso,
                    this.$store.state.pricing.datosPrincipales.containers,
                    this.$store.state.pricing.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.aduana += this.calcularValor(
                  this.$store.state.pricing.datosPrincipales.amount,
                  this.totalFleteVentas,
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.$store.state.pricing.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? this.$store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ALMACEN
          if (this.isAlmacen(data)) {
            if (element.esalmacenflag) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.almacen +=
                  (this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.$store.state.pricing.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.$store.state.pricing.datosPrincipales.volumen,
                    this.$store.state.pricing.datosPrincipales.peso,
                    this.$store.state.pricing.datosPrincipales.containers,
                    this.$store.state.pricing.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.almacen += this.calcularValor(
                  this.$store.state.pricing.datosPrincipales.amount,
                  this.totalFleteVentas,
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.$store.state.pricing.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? this.$store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          }
          //   ALMACEN
          if (this.isGastosTercero(data)) {
            if (element.esgastostercerosflag) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gastostercero +=
                  (this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? this.$store.state.pricing.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    this.$store.state.pricing.datosPrincipales.volumen,
                    this.$store.state.pricing.datosPrincipales.peso,
                    this.$store.state.pricing.datosPrincipales.containers,
                    this.$store.state.pricing.datosPrincipales.amount,
                  );
              } else {
                this.resumenOpcion.gastostercero += this.calcularValor(
                  this.$store.state.pricing.datosPrincipales.amount,
                  this.totalFleteVentas,
                  this.$store.state.pricing.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? this.$store.state.pricing.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  this.$store.state.pricing.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? this.$store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
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
    isFlete(data) {
      let val = data.some((v) => v.esfleteflag == 1 && v.status == true);

      return val;
    },
    isOrigen(data) {
      let val = data.some((v) => v.esorigenflag == 1 && v.status == true);
      return val;
    },
    isLocal(data) {
      let val = data.some((v) => v.eslocalflag == 1 && v.status == true);
      return val;
    },

    isAduana(data) {
      let val = data.some((v) => v.esaduanaflag == 1 && v.status == true);
      return val;
    },
    isAlmacen(data) {
      let val = data.some((v) => v.esalmacenflag == 1 && v.status == true);
      return val;
    },
    isGastosTercero(data) {
      let val = data.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true,
      );
      return val;
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },

    montoConfeccion(item) {
      let monto = 0;
      if (item.code_cost == 33) {
        let amount = this.$store.state.pricing.datosPrincipales.amount;
        let cif =
          parseFloat(amount) +
          parseFloat(this.totalFleteVentas) +
          (parseFloat(amount) + parseFloat(this.totalFleteVentas)) * 0.01;

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
    isITBM(code) {
      return code == 38 ? true : false;
    },
    montoITBM(item) {
      let monto = 0;
      let code = [29, 36, 41, 68];
      if (item.code_cost == 38) {
        let val = data.filter((v) => code.includes(v.code_cost));
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
        let val = data.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto = element.costounitario;
        });
      }
      item.costounitario = -1 * parseFloat(monto * 0.5).toFixed(2);
      return this.currencyFormat(-1 * parseFloat(monto * 0.5).toFixed(2));
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14];

      let mul = this.$store.state.pricing.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code),
      );

      return !mul;
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.limpiar();
    },
    cambiarOpcionSeleccionada(opcion) {
      console.log(opcion);
      // this.$emit('cambiarSeleccionado',opcion)
    },
  },
  watch: {
    async actualizarComparativa() {
      setTimeout(async () => {
        await this.calcularTotalesOpciones();
        await this.agregarFilasAlHeader();
      }, 1000);
    },
  },
  computed: {
    actualizarComparativa: {
      get() {
        return this.$store.state.pricing.actualizarComparativa;
      },
      set(val) {
        return (this.$store.state.pricing.actualizarComparativa =
          actualizarComparativa);
      },
    },
  },
};
</script>
<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.izquierda {
  text-align: left !important;
  align-content: left !important;
}
.totalClass {
  background: #bbdefb !important;
  color: #0d47a1;
  /* font-weight: bold */
}

.centrado {
  align-content: center !important;
  text-align: center !important;
}
</style>
