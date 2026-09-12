<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4" class="pb-0">
          <v-autocomplete
            outlined
            label="Proveedor"
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
          >
          </v-autocomplete>
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <v-text-field
            label="Monto Debitado En Banco"
            outlined
            dense
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            width="50px"
            :error-messages="errorMesage.monto_local"
            @input="
              monto_local
                ? (errorMesage.monto_local = '')
                : (errorMesage.monto_local =
                    'Monto de Depósito en banco es requerido')
            "
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="2" class="pb-0" v-if="mostrarTipoCambio">
          <v-text-field
            outlined
            dense
            disabled
            v-model="totalGeneralAbonadoMonLocal"
            type="number"
            :prefix="symbol"
            :label="`Total Factura Seleccionada (${symbol})`"
          ></v-text-field>
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <v-text-field
            label="Total Factura Seleccionada"
            outlined
            dense
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
            width="50px"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="2" class="pb-0" v-if="mostrarTipoCambio">
          <v-text-field
            label="Tipo Cambio"
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

        <v-col cols="12" v-if="proveedor" class="pt-0">
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
              <v-row class="mt-2">
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
                    label="Buscar Expediente"
                    v-model="searchTableDetalle"
                    style="max-width: 400px"
                    outlined
                    :disabled="itemsOrdenados.length == 0"
                    dense
                    v-if="
                      id_cuenta &&
                      Object.keys(id_cuenta).length > 0 &&
                      !!id_cuenta.id
                    "
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row class="mt-1">
                <v-col cols="12" class="pt-0" v-if="mostrarDetalle">
                  <div class="d-flex justify-center">
                    <v-alert
                      class="mt-0"
                      border="top"
                      type="info"
                      elevation="2"
                      dense
                      width="450px"
                      color="purple"
                    >
                      <b>SELECCIONE UNA(S) FACTURA PARA CONTINUAR</b>
                    </v-alert>
                  </div>
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
                      <tr
                        class="grey lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td :colspan="headers.length" class="text-right">
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
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
                    <template v-slot:[`item.action`]="{ item }">
                      <v-btn
                        icon
                        color="primary"
                        v-if="item.tipo_gasto == 'A'"
                        @click="abrirFactura(item)"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
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
                    :disabled="
                      !(
                        id_cuenta &&
                        Object.keys(id_cuenta).length > 0 &&
                        !!id_cuenta.id
                      )
                    "
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
                    readonly
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
                      <tr
                        class="grey lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
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
                          item.saldo_pendiente_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.saldo_pendiente_local),
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
                    :prefix="symbol"
                    v-model="totalGeneralAbonadoMonLocal"
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
    <v-dialog
      v-model="dialogLlenarMontoDepositadoBanco"
      persistent
      max-width="35%"
    >
      <v-card class="pa-2">
        <v-card-title class="headline pb-2">
          <v-icon left color="primary">mdi-hand-coin</v-icon> Confirmar Pago
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Banner de advertencia adaptado para salida -->
          <v-alert
            type="warning"
            border="left"
            colored-border
            elevation="0"
            class="amber lighten-5 text--darken-3 mb-4 rounded-lg"
          >
            <template v-slot:prepend>
              <v-icon size="36" color="amber darken-2" class="mr-3">
                mdi-alert
              </v-icon>
            </template>
            <div>
              <div
                class="subtitle-2 font-weight-bold amber--text text--darken-4 text-uppercase"
              >
                OBLIGATORIO PARA CONTINUAR
              </div>
              <div class="caption font-weight-bold grey--text text--darken-3">
                Ingresa el monto que salió del banco, según tu estado de cuenta.
              </div>
            </div>
          </v-alert>

          <v-text-field
            outlined
            label="Monto debitado en el banco"
            ref="txtMontoLocal"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            :rules="[(v) => !!v || 'Este campo es obligatorio']"
            hide-details="auto"
          ></v-text-field>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelarllenadoDeMonto()" text>
            Cancelar
          </v-btn>
          <v-btn color="primary" @click="confirmarDeposito"> CONTINUAR </v-btn>
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
      mostrarDetalle: false,
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
        { text: "Moneda Y Monto", value: "montopagar" },
        { text: "Expediente", value: "code_master" },
        { text: "Tipo", value: "tipo_gasto" },
        { text: "Ver Factura.", value: "action" },
        { text: "Fecha Factura", value: "fecha" },

        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Saldo", value: "saldo" },
        { text: "Total Monto Abonado", value: "totalabonado" },
      ],
      headersPagosGastosBancario: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Moneda Y Monto", value: "montoparcial" },
        // { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Fecha Factura", value: "fecha" },
        { text: "Tipo", value: "tipo_gasto", align: "center" },

        { text: "Moneda y Monto Facturado", value: "saldo_pendiente_local" },
        { text: "Monto Equivalente en Dólares", value: "saldo_pendiente" },
        { text: "Saldo", value: "saldo" },
        // { text: "Factura", value: "documentos" },
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
    cancelarllenadoDeMonto() {
      this.dialogLlenarMontoDepositadoBanco = false;
      this.monto_local = null;
      this.id_cuenta = {};
    },
    abrirFactura(item) {
      let id = item.id_admininvoice;
      window.open(`/home/folderModulesPays/viewAccountPays/${id}`, "_blank");
    },
    // abrirFactura(item) {

    //   let id = item.id_admininvoice;
    //   window.open(
    //     `/home/folderModulesPays/viewAccountPays/${id}`,
    //     "Instructivo",
    //     "width=1593,height=1293,menubar=no,location=no,resizable=no",
    //   );
    // },
    confirmarDeposito() {
      if (this.monto_local) {
        this.dialogLlenarMontoDepositadoBanco = false;
        this.mostrarDetalle = true;
      }
    },
    async onItemSelected({ item, value }) {
      if (value) {
        console.log("Item seleccionado:", item);
        if (item.symbol !== this.symbol) {
          const result = await Swal.fire({
            icon: "warning",
            title: "Moneda diferente",
            html: `
              La factura seleccionada está en <b>${item.symbol}</b>
              y la cuenta está en <b>${this.symbol}</b>
              <br><br>
              ¿Desea Continuar?
            `,
            showCancelButton: true,
            confirmButtonText: "Sí, continuar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            reverseButtons: true,
          });

          // Si cancela, quitar la factura de selected
          if (!result.isConfirmed) {
            this.selected = this.selected.filter((i) => i.id !== item.id);

            this.calcularTotal();
            return;
          }
        }

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
      if (Object.keys(file).length > 0) {
        this.id_path = file.id;
      } else {
        this.id_path = null;
      }
      // this.payfile = file.archivo;

      // this.msgfile = "Archivo procesado y vinculado correctamente.";
      // this.errfile = "";
    },
    async obtenerListado() {
      this.errorMesage.proveedor = "";
      this.selected = [];
      this.monto = 0;
      this.monto_local = 0;
      this.montogastobancario = 0;
      this.conceptogastobancario = "";

      this.pasos = 0;
      this.editable = false;
      this.editableGastoBancario = false;

      this.searchTableDetalle = "";

      this.id_cuenta = {};

      this.fechaoperacion = null;
      this.numerooperacion = "";

      this.id_path = null;

      this.esDuplicado = false;
      this.operacionesSimilares = [];
      this.mostrarDetalle = false;
      if (this.proveedor) {
        this.$store.state.spiner = true;

        try {
          await this.getDeudaAProveedorPorSucursal(this.proveedor);
        } finally {
          this.$store.state.spiner = false;
        }
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
      let totalUSD = this.selected.reduce((acc, item) => {
        let valorFilaUSD = 0;

        // Evaluamos con item.symbol que es la propiedad real usada en tu vista
        const esFacturaSoles = item.symbol !== "USD" && item.symbol !== "$";

        let montoIngresado = parseFloat(item.montoparcial) || 0;
        let saldoLocal = parseFloat(item.saldo_pendiente_local) || 0;
        let saldoDolares = parseFloat(item.saldo_pendiente) || 0;

        if (item.parcialflag) {
          if (esFacturaSoles) {
            // Regla de tres: (Monto en Soles / Saldo Total Soles) * Saldo Total Dólares
            if (saldoLocal > 0) {
              let porcentajePago = montoIngresado / saldoLocal;
              valorFilaUSD = saldoDolares * porcentajePago;
            }
          } else {
            // Si la factura ya es en dólares, el monto ingresado está en USD
            valorFilaUSD = montoIngresado;
          }
        } else {
          // Abono completo: toma directamente el equivalente en dólares de la fila
          valorFilaUSD = saldoDolares;
        }

        return acc + valorFilaUSD;
      }, 0);

      // Asigna el total convertido a dólares para el campo superior
      this.monto = totalUSD.toFixed(2);
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
      if (
        Number(this.totalGeneralAbonadoMonLocal) !== Number(this.monto_local)
      ) {
        Swal.fire({
          icon: "warning",
          title: "Discrepancia en los Montos",
          html: `
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 16px;">
                El registro no puede completarse porque los valores monetarios no coinciden.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; text-align: left;">
                <div style="flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #adb5bd; text-transform: uppercase; font-weight: bold;">Registrado en Banco</span>
                    <span style="font-size: 15px; font-weight: bold; color: #495057;">${
                      this.symbol
                    } ${Number(this.monto_local).toFixed(2)}</span>
                </div>
                <div style="flex: 1; background: #fff5f5; border: 1px solid #ffe3e3; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #e03131; text-transform: uppercase; font-weight: bold;">Total a Pagar</span>
                    <span style="font-size: 15px; font-weight: bold; color: #c92a2a;">${
                      this.symbol
                    } ${Number(this.totalGeneralAbonadoMonLocal).toFixed(
            2,
          )}</span>
                </div>
            </div>
        `,
          confirmButtonText: "Revisar y Corregir",
          confirmButtonColor: "#3085d6",
          buttonsStyling: true,
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
      await this.setRegistroEgresos(data).catch((e) => console.error(er));
      this.loading = false;
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
          return `${this.symbol} ${(
            monto / (this.tipocambio ? this.tipocambio : 1)
          ).toFixed(2)}`;
        }
      } else {
        if (item.symbol == "USD") {
          return `${this.symbol} ${(
            monto * (this.tipocambio ? this.tipocambio : 1)
          ).toFixed(2)}`;
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
      return this.monto || "0.00";
    },
    mostrarTipoCambio() {
      if (this.selected.length == 0) return false;
      if (this.symbol != "USD") {
        return true;
      }

      if (this.selected.some((v) => v.symbol != "USD")) {
        return true;
      }
      return false;
      // return this.selected.some((v) => v.symbol != "USD");
    },
    tipocambio() {
      if (this.symbol == "USD") {
        return 1;
      }
      let tc =
        (parseFloat(this.monto_local) +
          parseFloat(this.montogastobancario || 0)) /
        this.monto;
      return tc ? tc.toFixed(4) : 1;
    },
    totalGeneralAbonadoMonLocal() {
      let monto = this.selected.reduce((acc, item) => {
        let monto = parseFloat(item.montoparcial) || 0;

        return acc + monto;
      }, 0);
      monto = monto + parseFloat(this.montogastobancario || 0);
      return parseFloat(monto).toFixed(2);
    },
    totalGeneralAbonadoMonLocalSeleccionado() {
      let monto = this.selected.reduce((acc, item) => {
        let monto = parseFloat(item.montoparcial) || 0;

        return acc + monto;
      }, 0);
      monto = monto;
      return parseFloat(monto).toFixed(2);
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
    id_cuenta(newVal, oldVal) {
      if (newVal && newVal.id && (!oldVal || newVal.id !== oldVal.id)) {
        if (oldVal && oldVal.id && this.selected.length > 0) {
          this.selected = [];

          this.monto = 0;
          this.calcularTotal();
        }
        let id_coins = newVal.id_coins;
        let coins = this.$store.state.itemsCoinsList.find(
          (coin) => coin.id === id_coins,
        );
        this.symbol = coins ? coins.symbol : "USD";

        // this.calcularTotal();

        this.dialogLlenarMontoDepositadoBanco = true;
      }
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
