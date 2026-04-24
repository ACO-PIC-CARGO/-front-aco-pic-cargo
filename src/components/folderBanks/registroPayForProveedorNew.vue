<template>
  <v-card>
    <v-container fluid>
      <v-row>
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
            clearable
            @change="obtenerListado()"
            hide-details
            :error-messages="errorMesage.proveedor"
            id="cboProveedor"
          >
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="3" class="pb-0">
          Monto Depositado En Banco:
          <!-- <v-icon @click="snackbar = true">mdi-information</v-icon> -->
          <v-text-field
            outlined
            dense
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            width="50px"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="2" class="pb-0">
          Total Factura Seleccionada:
          <v-text-field
            outlined
            dense
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
            width="50px"
            hide-details
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="2" class="pb-0" v-if="mostrarTipoCambio">
          Tipo Cambio:
          <v-text-field
            outlined
            dense
            v-model="tipoCambio"
            type="number"
            prefix="USD"
            width="50px"
            hide-details
            disabled
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-tabs
            v-model="pasos"
            centered
            color="#000000"
            background-color="#C8E6C9"
          >
            <v-tab key="datosPrincipales">Datos Principales</v-tab>
            <v-tab key="detallesPago" :disabled="!editable"
              >Detalles de Pago</v-tab
            >
            <v-tab key="gastoBancario" :disabled="!editableGastoBancario">
              Resumen y Comisión Bancario</v-tab
            >
          </v-tabs>

          <v-tabs-items v-model="pasos">
            <v-tab-item key="datosPrincipales">
              <v-row class="mt-1">
                <v-col cols="12" md="6" class="py-1">
                  <v-autocomplete
                    :items="$store.state.bancos.cuentas"
                    item-text="label"
                    item-value="id"
                    label="Cuenta de Salida de Banco"
                    v-model="id_cuenta"
                    return-object
                    outlined
                    dense
                    :error-messages="errorMesage.id_cuenta"
                    @change="errorMesage.id_cuenta = null"
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
                    :errorMessages="errorMesage.fechaOperacion"
                  />
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
                <v-col cols="12" md="6" class="py-1">
                  <v-text-field
                    label="Número de Operación"
                    outlined
                    dense
                    v-model="nroOperacion"
                    :error-messages="errorMesage.nroOperacion"
                    @input="
                      nroOperacion !== ''
                        ? (errorMesage.nroOperacion = null)
                        : (errorMesage.nroOperacion =
                            'Número de Operación es requerido')
                    "
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6" class="py-1">
                  <v-textarea
                    label="Comentarios"
                    rows="1"
                    outlined
                    dense
                    auto-grow
                    v-model="comentarios"
                  ></v-textarea>
                </v-col>
                <v-col cols="12" class="py-1">
                  <p class="my-1">Soporte de Pago:</p>
                  <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
                </v-col>
                <v-col cols="12" class="pt-1 pb-5">
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="continuarDetalles()">
                    Continue
                  </v-btn>
                  <v-btn text> Cancel </v-btn>
                </v-col>
              </v-row>
            </v-tab-item>

            <v-tab-item key="detallesPago">
              <v-row class="mt-1">
                <v-col cols="12">
                  <v-data-table
                    :headers="headers"
                    :items="itemsOrdenados"
                    v-model="selected"
                    show-select
                    item-key="id"
                    @input="calcularTotal"
                    :search="searchTableDetalle"
                  >
                    <template v-slot:[`item.parcialflag`]="{ item }">
                      <v-select
                        :items="cboParcial"
                        v-model="item.parcialflag"
                        dense
                        outlined
                        :disabled="!selected.includes(item)"
                        style="max-width: 200px"
                        hide-details
                      ></v-select>
                    </template>
                    <template v-slot:[`item.montopagar`]="{ item }">
                      <v-text-field
                        hide-details
                        dense
                        outlined
                        v-model="item.montoparcial"
                        :disabled="
                          !selected.includes(item) || !item.parcialflag
                        "
                        style="max-width: 120px"
                        :prefix="item.symbol"
                        :rules="[
                          (v) =>
                            !v ||
                            parseFloat(v) <=
                              parseFloat(item.saldo_pendiente_local) ||
                            'El monto no puede ser mayor al saldo',
                        ]"
                      ></v-text-field>
                    </template>
                    <template v-slot:[`item.concepto`]="{ item, index }">
                      <v-text-field
                        v-model="item.concepto"
                        :id="`txtConcepto${index}`"
                        outlined
                        dense
                        hide-details
                        style="max-width: 150px"
                        placeholder="Nuevo Concepto"
                        v-if="item.nuevoflag"
                      ></v-text-field>
                    </template>
                    <template v-slot:[`item.saldo_pendiente`]="{ item }">
                      USD {{ item.saldo_pendiente }}
                    </template>
                    <template v-slot:[`item.saldo_pendiente_local`]="{ item }">
                      {{ item.symbol }} {{ item.saldo_pendiente_local }}
                    </template>
                    <template v-slot:[`item.saldo`]="{ item }">
                      {{ item.symbol }}
                      {{
                        parseFloat(
                          item.saldo_pendiente_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.saldo_pendiente_local),
                        ).toFixed(2)
                      }}
                    </template>
                  </v-data-table>
                </v-col>
                <v-col
                  cols="12"
                  class="pt-1"
                  style="align-items: end; align-content: end; text-align: end"
                >
                  <v-btn
                    class="mx-1"
                    color="success"
                    @click="continuarGastoBancario()"
                  >
                    Continuar
                  </v-btn>
                  <v-btn class="mx-1" color="error"> Cancel </v-btn>
                </v-col>
              </v-row>
            </v-tab-item>

            <v-tab-item key="gastoBancario">
              <v-row class="mt-1">
                <v-col cols="12">
                  <v-data-table
                    :headers="headersPagosGastosBancario"
                    :items="selected"
                    v-model="selected"
                    show-select
                    item-key="id"
                  >
                    <template v-slot:[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                  </v-data-table>
                </v-col>

                <v-col cols="2" offset="7">
                  <v-text-field
                    outlined
                    dense
                    label="Comisión Bancaria"
                    id="id"
                    v-model="conceptoGastoBancario"
                  ></v-text-field>
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    outlined
                    dense
                    label="Monto Gasto Bancario"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="montoGastoBancario"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    outlined
                    dense
                    label="Monto Total a Pagar"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="montoFinal"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    class="mx-1"
                    color="success"
                    @click="finalizarOperacion()"
                  >
                    Finalizar Operación
                  </v-btn>
                </v-col>
              </v-row>
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </v-container>
    <v-snackbar v-model="snackbar">
      Monto en moneda {{ symbol }} para realizar el pago. El tipo de cambio se
      calculará automáticamente al ingresar el monto en moneda local.
      <template v-slot:action="{ attrs }">
        <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
export default {
  components: {
    //  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
    FormatFecha: () => import("../comun/FormatFecha.vue"),
    ArrastraYSolarComponent: () =>
      import("../comun/ArrastraYSolarComponent.vue"),
  },
  data() {
    return {
      comentarios: "",
      conceptoGastoBancario: "",
      montoGastoBancario: 0,
      monto_local: 0,
      snackbar: false,
      pasos: 0,
      monto: 0,
      nroOperacion: "",
      proveedor: null,
      symbol: "USD",
      id_cuenta: {},
      fechaOperacion: null,
      id_path: null,
      selected: [],
      headers: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montopagar" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },
        // { text: "Concepto", value: "concepto" },
        // { text: "Total Facturas", value: "total_facturas" },
        // { text: "Monto", value: "total_egresos" },
        // { text: "Total Pagado", value: "total_pagado" },
        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Saldo", value: "saldo" },
        { text: "Factura", value: "documentos" },
      ],
      headersPagosGastosBancario: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montoparcial" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },
        // { text: "Concepto", value: "concepto" },
        // { text: "Total Facturas", value: "total_facturas" },
        // { text: "Monto", value: "total_egresos" },
        // { text: "Total Pagado", value: "total_pagado" },
        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Saldo", value: "saldo" },
        { text: "Factura", value: "documentos" },
      ],
      items: [],
      errorMesage: {
        proveedor: "",
        id_cuenta: "",
        fechaOperacion: "",
        nroOperacion: "",
      },
      editable: false,
      editableGastoBancario: false,
      searchTableDetalle: "",
      cboParcial: [
        { text: "Abono Completo", value: false },
        { text: "Abono Parcial", value: true },
      ],
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
      "getDeudaAProveedorPorSucursal",
    ]),
    recibirId(file) {
      console.log("Archivo recibido en el componente padre:", file);
      if (Object.keys(file).length > 0) {
        this.id_path = file.id;
      } else {
        this.id_path = null;
      }
      console.log("ID del archivo recibido:", this.id_path);
      // this.payfile = file.archivo;

      // this.msgfile = "Archivo procesado y vinculado correctamente.";
      // this.errfile = "";
    },
    obtenerListado() {
      this.errorMesage.proveedor = "";
      this.pasos = 0;
      this.editable = false;
      if (this.proveedor) {
        this.getDeudaAProveedorPorSucursal(this.proveedor);
      } else {
        this.$store.state.bank.deudaAProveedor = [];
      }
    },
    anadirFila() {
      const nuevaFila = {
        id: Date.now(), // Generamos un ID temporal único
        documentos: "",
        code_master: "",
        tipo_gasto: "",
        total_facturas: 0,
        total_egresos: 0,
        total_pagado: 0,
        saldo_pendiente: 0,
        nuevoflag: true,
      };
      this.$store.state.bank.deudaAProveedor.unshift(nuevaFila);
      this.$nextTick(() => {
        const index = 0;
        const input = document.getElementById(`txtConcepto${index}`);

        if (input) {
          input.focus();
        } else {
          console.warn(
            "No se encontró el input con id:",
            `txtConcepto${index}`,
          );
        }
      });
    },
    continuarDetalles() {
      this.errorMesage = {
        proveedor: "",
        id_cuenta: "",
        fechaOperacion: "",
        nroOperacion: "",
      };
      if (
        this.proveedor &&
        Object.keys(this.id_cuenta).length > 0 &&
        this.fechaOperacion &&
        this.nroOperacion
      ) {
        console.log("Datos principales completos. ID Path:", this.id_path);
        if (this.id_path) {
          this.pasos = 1;
          this.editable = true;
        } else {
          Swal.fire({
            icon: "question",
            title: "¿Continuar sin soporte de pago?",
            showCancelButton: true,
            confirmButtonText: "Sí, continuar",
            cancelButtonText: "No, revisar",
          }).then((result) => {
            if (result.isConfirmed) {
              this.pasos = 1;
              this.editable = true;
            }
          });
        }
      } else {
        this.errorMesage.proveedor = this.proveedor
          ? ""
          : "Proveedor es requerido";
        this.errorMesage.id_cuenta =
          Object.keys(this.id_cuenta).length > 0 ? "" : "Cuenta es requerida";
        this.errorMesage.fechaOperacion = this.fechaOperacion
          ? ""
          : "Fecha de Operación es requerida";
        this.errorMesage.nroOperacion = this.nroOperacion
          ? false
          : "Número de Operación es requerido";
      }
    },

    async subirArchivo() {
      if (this.id_path) {
        let res = await this._uploadFile(this.id_path);
        if (res.success) {
          Swal.fire({
            icon: "success",
            title: "Archivo Subido",
            text: "El archivo se ha subido correctamente.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al Subir Archivo",
            text: "Hubo un problema al subir el archivo. Por favor, inténtelo nuevamente.",
          });
        }
      }
    },
    calcularTotal() {
      let total = this.selected.reduce((acc, item) => {
        let valorFila = 0;
        if (item.parcialflag) {
          let maximo =
            parseFloat(item.saldo_pendiente_local / item.tipocambio) || 0;
          let escrito = parseFloat(item.montoparcial / item.tipocambio) || 0;

          valorFila = escrito > maximo ? maximo : escrito;
        } else {
          valorFila =
            parseFloat(item.saldo_pendiente_local / item.tipocambio) || 0;
        }

        return acc + valorFila;
      }, 0);

      this.monto = total.toFixed(2);
    },
    continuarGastoBancario() {
      this.pasos = 2;
      this.editableGastoBancario = true;
    },
    finalizarOperacion() {
      let data = {
        id_cuenta: this.id_cuenta.id,
        id_coins: this.id_cuenta.id_coins,
        fechaOperacion: this.fechaOperacion,
        nroOperacion: this.nroOperacion,
        monto: this.montoFinal,
        tipoCambio: this.tipoCambio,
        comentarios: this.comentarios, // Aquí podrías agregar un campo de comentarios si lo deseas
        conceptoGastoBancario: this.conceptoGastoBancario,
        montoGastoBancario: this.montoGastoBancario,
        detalle: this.selected,
      };
      console.log("Datos a enviar para registrar el pago:", data);
      Swal.fire({
        icon: "success",
        title: "Operación Finalizada",
        text: "El pago se ha registrado correctamente.",
      });
    },
  },
  computed: {
    ...mapState([
      "itemsProveedorList",
      "listPagosXProveedorCxP",
      "provedores",
      "cuentas",
    ]),
    mostrarTipoCambio() {
      if (this.editable) {
        if (this.symbol != "USD") {
          return true;
        }

        if (this.selected.some((v) => v.symbol != "USD")) {
          return true;
        }
      }
      return false;
      // return this.selected.some((v) => v.symbol != "USD");
    },
    tipoCambio() {
      let monto_mon_local = 0;
      let monto_mon_dolar = 0;

      // 1. Sumatoria de seleccionados
      this.selected.forEach((item) => {
        const monto = item.parcialflag
          ? Number(item.montoparcial || 0)
          : Number(item.saldo_pendiente_local || 0);

        if (item.symbol === "USD") {
          monto_mon_dolar += monto;
        } else {
          monto_mon_local += monto;
        }
      });

      let tc = 1;
      const montoBase = Number(this.monto_local || 0);
      if (this.id_cuenta.symbol == "USD") {
        const divisor = montoBase - monto_mon_dolar;
        if (divisor !== 0 && monto_mon_local !== 0) {
          tc = monto_mon_local / divisor;
        }
      } else {
        const divisor = montoBase - monto_mon_local;
        if (divisor !== 0 && monto_mon_dolar !== 0) {
          tc = divisor / monto_mon_dolar;
        }
      }

      const resultado = isNaN(tc) || !isFinite(tc) || tc <= 0 ? 1 : tc;
      return Number(resultado).toFixed(4);
    },
    itemsOrdenados() {
      const items = [...this.$store.state.bank.deudaAProveedor];
      return items.sort((a, b) => {
        const aSeleccionado = this.selected.some((sel) => sel.id === a.id);
        const bSeleccionado = this.selected.some((sel) => sel.id === b.id);

        if (aSeleccionado && !bSeleccionado) return -1;
        if (!aSeleccionado && bSeleccionado) return 1;
        return 0;
      });
    },
    montoFinal() {
      let montoGastoBancario = 0;
      montoGastoBancario = Number(this.montoGastoBancario || 0);
      const total = Number(this.monto || 0) + montoGastoBancario;
      return total.toFixed(4);
    },
  },
  watch: {
    id_cuenta(newVal) {
      let id_coins = newVal.id_coins;
      let coins = this.$store.state.itemsCoinsList.find(
        (coin) => coin.id === id_coins,
      );
      this.symbol = coins ? coins.symbol : "USD";
    },
    fechaOperacion(newVal) {
      if (newVal) {
        this.errorMesage.fechaOperacion = "";
      } else {
        this.errorMesage.fechaOperacion = "Fecha de Operación es requerida";
      }
    },
    selected: {
      handler(newVal) {
        this.calcularTotal();
      },
      deep: true, // Esto detecta cambios en las propiedades internas de los items
    },
  },
};
</script>

<style></style>
