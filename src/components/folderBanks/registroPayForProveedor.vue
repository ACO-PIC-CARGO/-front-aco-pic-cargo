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
        <v-col cols="12" md="2" class="pb-0">
          Monto Depositado En Banco:
          <!-- <v-icon @click="snackbar = true">mdi-information</v-icon> -->
          <v-text-field
            outlined
            dense
            ref="txtMontoLocal"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            width="50px"
            hide-details
            :readonly="!Object.keys(id_cuenta).length > 0"
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
            v-model="tipocambio"
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
            <v-tab key="detallesPago">Facturas</v-tab>
            <v-tab key="datosPrincipales" :disabled="!editable">
              Detalles Bancarios
            </v-tab>
            <v-tab key="gastoBancario" :disabled="!editableGastoBancario">
              Resumen y Comisión Bancario</v-tab
            >
          </v-tabs>

          <v-tabs-items v-model="pasos">
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
                    @item-selected="onItemSelected"
                    @toggle-select-all="onSelectAll"
                  >
                    <template v-slot:body.append>
                      <tr class="grey lighten-4 font-weight-bold">
                        <td :colspan="headers.length" class="text-right">
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">USD {{ totalGeneralAbonado }}</td>
                      </tr>
                    </template>
                    <template v-slot:[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
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
                </v-col>
              </v-row>
            </v-tab-item>

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
                    v-model="fechaoperacion"
                    :errorMessages="errorMesage.fechaoperacion"
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
                    v-model="numerooperacion"
                    :error-messages="errorMesage.numerooperacion"
                    @input="
                      numerooperacion !== ''
                        ? ((errorMesage.numerooperacion = null),
                          buscarOperacionAlEscribir())
                        : ((errorMesage.numerooperacion =
                            'Número de Operación es requerido'),
                          (operacionesSimilares = []),
                          (esDuplicado = false))
                    "
                  ></v-text-field>

                  <div
                    v-if="
                      operacionesSimilares.length > 0 &&
                      operacionesSimilares[0].id !== null
                    "
                  >
                    <p
                      v-if="esDuplicado"
                      class="red--text caption font-weight-bold pl-2"
                    >
                      ⚠️ Ya existe un registro con este número exacto.
                    </p>

                    <div v-else class="pl-2">
                      <div class="d-flex flex-wrap gap-1 mt-1">
                        <v-chip
                          v-for="(item, index) in operacionesSimilares"
                          :key="index"
                          small
                          class="mr-1 mb-1"
                        >
                          {{ item.numerooperacion }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
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
                  <v-btn class="mx-1" color="error" @click="pasos = 0">
                    Cancel
                  </v-btn>
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
                    item-key="id"
                  >
                    <template v-slot:body.append>
                      <tr class="grey lighten-4 font-weight-bold">
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">USD {{ totalGeneralAbonado }}</td>
                      </tr>
                    </template>
                    <template v-slot:[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template v-slot:[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                    <template v-slot:[`item.saldo`]="{ item }">
                      {{ item.symbol }}
                      {{
                        parseFloat(
                          item.total_mon_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.total_mon_local),
                        ).toFixed(2)
                      }}
                    </template>
                  </v-data-table>
                </v-col>

                <v-col cols="12" md="2" offset="8">
                  <v-text-field
                    outlined
                    dense
                    label="Comisión Bancaria"
                    id="id"
                    v-model="conceptogastobancario"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    outlined
                    dense
                    label="Monto Gasto Bancario"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="montogastobancario"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="2" offset="10">
                  <v-text-field
                    outlined
                    dense
                    label="Monto Total a Pagar"
                    id="id"
                    type="number"
                    prefix="USD"
                    v-model="montoFinal"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    class="mx-1"
                    color="success"
                    :loading="loading"
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

    <v-dialog
      v-model="dialogLlenarMontoDepositadoBanco"
      persistent
      max-width="450"
    >
      <v-card>
        <v-card-title class="headline pb-2">
          <v-icon left color="primary">mdi-hand-coin</v-icon> Confirmar Depósito
        </v-card-title>

        <v-card-text class="pt-4">
          <div class="body-1 mb-4">
            Por favor, confirma el monto exacto pagado desde tu cuenta bancaria
            para proceder con la validación de la salida de fondos.
          </div>

          <v-text-field
            outlined
            label="Monto depositado"
            ref="txtMontoLocal"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            :readonly="!Object.keys(id_cuenta).length > 0"
            hide-details="auto"
            class="mt-2"
          ></v-text-field>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <!-- <v-btn
            text
            color="grey"
            @click="dialogLlenarMontoDepositadoBanco = false"
            >Cancelar</v-btn
          > -->
          <v-btn color="primary" elevation="2" @click="confirmarDeposito"
            >Confirmar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      dialogLlenarMontoDepositadoBanco: false,
      esDuplicado: false,
      timer: null,
      operacionesSimilares: {},
      comentarios: "",
      conceptogastobancario: "",
      montogastobancario: 0,
      monto_local: 0,
      snackbar: false,
      pasos: 0,
      monto: 0,
      numerooperacion: "",
      proveedor: null,
      symbol: "USD",
      id_cuenta: {},
      fechaoperacion: null,
      id_path: null,
      selected: [],
      loading: false,
      headers: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montopagar" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },

        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Saldo", value: "saldo" },
        { text: "Factura", value: "documentos" },
        { text: "Total Monto Abonado", value: "totalabonado" },
      ],
      headersPagosGastosBancario: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montoparcial" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },

        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Saldo", value: "saldo" },
        { text: "Factura", value: "documentos" },
        { text: "Total Monto Abonado", value: "totalabonado" },
      ],
      items: [],
      errorMesage: {
        proveedor: "",
        id_cuenta: "",
        fechaoperacion: "",
        numerooperacion: "",
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
  async mounted() {
    this.$store.state.bank.deudaAProveedor = [];
    this.$store.state.mainTitle = "BANCOS - NUEVA SALIDA";
    await Promise.all([
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
      "setRegistroEgresos",
      "validarEgresoNroOperacion",
    ]),
    confirmarDeposito() {
      if (this.monto_local) {
        this.dialogLlenarMontoDepositadoBanco = false;
      }
    },
    onItemSelected({ item, value }) {
      if (value) {
        // Si se selecciona, por defecto es Abono Completo (false) y carga el saldo
        item.parcialflag = false;
        item.montoparcial = item.saldo_pendiente_local;
      } else {
        // Si se deselecciona, vuelve a 0
        item.montoparcial = 0;
        item.parcialflag = false;
      }
      this.calcularTotal();
    },
    onSelectAll({ items, value }) {
      items.forEach((item) => {
        if (value) {
          item.parcialflag = false;
          item.montoparcial = item.saldo_pendiente_local;
        } else {
          item.montoparcial = 0;
          item.parcialflag = false;
        }
      });
      this.calcularTotal();
    },
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
    async obtenerListado() {
      this.errorMesage.proveedor = "";
      this.pasos = 0;
      this.editable = false;
      if (this.proveedor) {
        this.$store.state.spiner = true;
        await this.getDeudaAProveedorPorSucursal(this.proveedor);
        this.$store.state.spiner = false;
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
        fechaoperacion: "",
        numerooperacion: "",
      };
      if (
        Object.keys(this.id_cuenta).length > 0 &&
        this.fechaoperacion &&
        this.numerooperacion &&
        this.id_path &&
        !this.esDuplicado
      ) {
        const hoy = new Date();
        const fechaOp = new Date(this.fechaoperacion);
        const unMesEnMs = 30 * 24 * 60 * 60 * 1000;
        const diferencia = Math.abs(fechaOp.getTime() - hoy.getTime());
        if (diferencia < unMesEnMs) {
          this.pasos = 2;
          this.editableGastoBancario = true;
        } else {
          Swal.fire({
            icon: "warning",
            title: "Fecha inusual : tiempo",
            html: `La fecha seleccionada <b> (${this.fechaoperacion})</b> tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
            showCancelButton: true,
            confirmButtonText: "Sí, continuar",
            cancelButtonText: "No, revisar",
          }).then((result) => {
            if (result.isConfirmed) {
              this.pasos = 2;
              this.editableGastoBancario = true;
            }
          });
        }
      } else {
        this.errorMesage.proveedor = this.proveedor
          ? ""
          : "Proveedor es requerido";
        this.errorMesage.id_cuenta =
          Object.keys(this.id_cuenta).length > 0 ? "" : "Cuenta es requerida";
        this.errorMesage.fechaoperacion = this.fechaoperacion
          ? ""
          : "Fecha de Operación es requerida";
        this.errorMesage.numerooperacion = this.numerooperacion
          ? false
          : "Número de Operación es requerido";
        if (!this.id_path) {
          Swal.fire({
            icon: "error",
            title: "Archivo de Soporte Requerido",
            text: "Por favor, suba el archivo de soporte para continuar.",
          });
        }
        if (this.esDuplicado) {
          this.errorMesage.numerooperacion = "El número de operación ya existe";
        }
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
      if (!this.proveedor || this.selected.length == 0) {
        let text = "";
        text = !this.proveedor ? "Proveedor Requerido. <br>" : "";
        // text += !this.monto_local ? "Monto Local Requerido. <br>" : "";
        text +=
          this.selected.length == 0 ? "Seleccione Facturas a Pagar. <br>" : "";
        Swal.fire({
          icon: "error",
          title: `Aviso Importante`,
          html: text,
        });
        return;
      }
      this.pasos = 1;
      this.editable = true;
    },
    async finalizarOperacion() {
      let monto_local = Number(parseFloat(this.monto_local).toFixed(2));
      let montoFinal = Number(parseFloat(this.montoFinal).toFixed(2));
      if (this.symbol == "USD" && monto_local != montoFinal) {
        Swal.fire({
          icon: "error",
          title: "Monto Incorrecto",
          html: `El Monto Depositado(${this.symbol} ${monto_local}) En Banco es diferente al Monto Total a Pagar(${this.symbol} ${montoFinal})`,
        });
        return;
      }

      let data = {
        symbol: this.symbol,
        id_branch: "",
        id_proveedor: this.proveedor,
        comentarios: this.comentarios,
        montogastobancario: this.montogastobancario,
        detalle: this.selected,
        fechaoperacion: this.fechaoperacion,
        id_moneda: this.id_cuenta.id_coins,
        id_cuentabancaria: this.id_cuenta.id,
        totaldolar: this.monto,
        tipocambio: this.tipocambio,
        totalmonedalocal: this.monto_local,
        conceptogastobancario: this.conceptogastobancario,
        numerooperacion: this.numerooperacion,
        id_soporte: this.id_path,
      };
      this.loading = true;
      await this.setRegistroEgresos(data);
      this.loading = false;
      Swal.fire({
        icon: "success",
        title: "Operación Finalizada",
        text: "El pago se ha registrado correctamente.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          this.$router.push({
            name: "listBankCxP",
          });
        }
      });
    },
    fn_totalAbonado(item) {
      if (!this.selected.includes(item)) {
        return 0;
      }
      let monto = 0;
      monto = parseFloat(item.montoparcial) || 0;
      if (this.symbol == "USD") {
        if (item.symbol == "USD") {
          return `${item.symbol} ${monto.toFixed(2)}`;
        } else {
          return `${this.symbol} ${(monto / this.tipocambio).toFixed(2)}`;
        }
      } else {
        if (item.symbol == "USD") {
          return `${this.symbol} ${(monto * this.tipocambio).toFixed(2)}`;
        } else {
          return `${item.symbol} ${monto.toFixed(2)}`;
        }
      }
    },
    buscarOperacionAlEscribir() {
      clearTimeout(this.timer);
      if (this.numerooperacion.length < 3) {
        this.operacionesSimilares = [];
        this.esDuplicado = false;
        return;
      }
      this.timer = setTimeout(async () => {
        const res = await this.validarEgresoNroOperacion({
          numerooperacion: this.numerooperacion,
        });

        this.operacionesSimilares = res;
        if (!res[0].estadoflag) {
          this.operacionesSimilares = [];
          return;
        }
        // CAMBIO CLAVE: Evaluamos toda la lista. Si CUALQUIERA es duplicado exacto, bloqueamos.
        this.esDuplicado = this.operacionesSimilares.some(
          (op) => op.es_duplicado_exacto === true,
        );

        // Opcional: Si es duplicado, inyectamos el error directamente en el v-text-field
        if (this.esDuplicado) {
          this.errorMesage.numerooperacion = "El número de operación ya existe";
        }

        console.log(
          "Operaciones similares encontradas:",
          this.operacionesSimilares,
        );
      }, 300);
    },
  },
  computed: {
    ...mapState([
      "itemsProveedorList",
      "listPagosXProveedorCxP",
      "provedores",
      "cuentas",
    ]),
    totalGeneralAbonado() {
      const total = this.selected.reduce((acc, item) => {
        let monto = parseFloat(item.montoparcial) || 0;

        return acc + monto;
      }, 0);
      this.monto_local = total.toFixed(2);
      return total.toFixed(2);
    },
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
    tipocambio() {
      let tc =
        (parseFloat(this.monto_local) +
          parseFloat(this.montogastobancario || 0)) /
        this.monto;
      return tc.toFixed(4);
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
      let montogastobancario = 0;
      montogastobancario = Number(this.montogastobancario || 0);
      const total = Number(this.totalGeneralAbonado || 0) + montogastobancario;
      return total.toFixed(2);
    },
  },
  watch: {
    id_cuenta(newVal) {
      let id_coins = newVal.id_coins;
      let coins = this.$store.state.itemsCoinsList.find(
        (coin) => coin.id === id_coins,
      );
      this.symbol = coins ? coins.symbol : "USD";
      this.$refs.txtMontoLocal.focus();
      this.dialogLlenarMontoDepositadoBanco = true;
    },
    fechaoperacion(newVal) {
      if (newVal) {
        this.errorMesage.fechaoperacion = "";
      } else {
        this.errorMesage.fechaoperacion = "Fecha de Operación es requerida";
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
