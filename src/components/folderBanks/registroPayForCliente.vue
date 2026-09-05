<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4" class="pb-0">
          <v-autocomplete
            label="Cliente"
            outlined
            dense
            :items="clientes"
            item-text="namelong"
            item-value="id"
            placeholder="Clientes"
            v-model="cliente"
            clearable
            @change="obtenerListado()"
            hide-details
            :error-messages="errorMesage.cliente"
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
            label="Monto Depositado En Banco:"
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
            outlined
            dense
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
            label="Total Factura Seleccionada"
          ></v-text-field>
        </v-col>
        <!--  -->
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

        <v-col cols="12" v-if="cliente" class="pt-0">
          <v-tabs
            v-model="pasos"
            centered
            color="#000000"
            background-color="#C8E6C9"
          >
            <v-tab key="detallesPago"> Facturas </v-tab>
            <v-tab key="datosPrincipales" :disabled="!editable">
              Detalles Bancarios
            </v-tab>
            <v-tab key="gastoBancario" :disabled="!editableGastoBancario">
              Resumen y Comisión Bancario
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="pasos">
            <v-tab-item key="detallesPago">
              <v-row class="mt-2">
                <v-col cols="12" md="6" class="py-1">
                  <v-autocomplete
                    :items="$store.state.bancos.cuentas"
                    item-text="label"
                    item-value="id"
                    label="Cuenta y Banco Ingreso de Banco"
                    v-model="id_cuenta"
                    return-object
                    outlined
                    dense
                    :rules="[
                      (v) =>
                        (v && Object.keys(v).length > 0 && !!v.id) ||
                        'Dato Requerido',
                    ]"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6" class="py-1">
                  <v-text-field
                    label="Buscar"
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
                    @item-selected="onItemSelected"
                    @toggle-select-all="onSelectAll"
                    :search="searchTableDetalle"
                    :item-disabled="checkDeshabilitado"
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
                    <template v-slot:[`item.action`]="{ item }">
                      <v-btn
                        flat
                        icon
                        color="primary"
                        v-if="item.tipo == 'A'"
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
                        hide-details
                        @change="verificarMontoCompleto(item)"
                        style="max-width: 200px"
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
                        :prefix="item.symbol"
                        @input="calcularTotal"
                        :rules="[
                          (v) =>
                            !v ||
                            parseFloat(v) <= parseFloat(item.total_mon_local) ||
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
                    <template v-slot:[`item.totaldolar`]="{ item }">
                      USD {{ item.totaldolar }}
                    </template>
                    <template v-slot:[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template v-slot:[`item.monto_original_total`]="{ item }">
                      {{ item.symbol }} {{ item.monto_original_total }}
                    </template>
                    <template v-slot:[`item.total_mon_local`]="{ item }">
                      {{ item.symbol }} {{ item.total_mon_local }}
                    </template>
                    <template v-slot:[`item.saldo`]="{ item }">
                      <span
                        v-if="
                          selected.some(
                            (s) => s.registro_id === item.registro_id,
                          )
                        "
                      >
                        {{ item.symbol }}
                        {{
                          parseFloat(
                            item.total_mon_local -
                              (item.montoparcial
                                ? item.montoparcial
                                : item.total_mon_local),
                          ).toFixed(2)
                        }}
                      </span>
                      <span v-else> ----- </span>
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
              <v-form ref="validacionDatosPrincipales">
                <v-row class="mt-1">
                  <v-col cols="12" md="6" class="py-1">
                    <v-autocomplete
                      :items="$store.state.itemsDataBanksList"
                      v-model="id_banco_origen"
                      label="Banco Origen"
                      item-text="acronym"
                      item-value="id"
                      outlined
                      dense
                      :rules="[(v) => !!v || 'Dato Requerido']"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-autocomplete
                      :items="$store.state.bancos.cuentas"
                      item-text="label"
                      item-value="id"
                      label="Cuenta y Banco Ingreso de Banco"
                      v-model="id_cuenta"
                      return-object
                      outlined
                      dense
                      readonly
                      :rules="[
                        (v) =>
                          (v && Object.keys(v).length > 0 && !!v.id) ||
                          'Dato Requerido',
                      ]"
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
                      outlined
                      dense
                      label="Fecha Operación"
                      v-model="fecha_operacion"
                      :rules="[(v) => !!fecha_operacion || 'Dato Requerido']"
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
                      v-model="nro_operacion"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      @input="
                        nro_operacion !== ''
                          ? ((errorMesage.nro_operacion = null),
                            buscarOperacionAlEscribir())
                          : ((errorMesage.nro_operacion =
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
                      label="Comentarios Usuario"
                      rows="1"
                      outlined
                      dense
                      auto-grow
                      v-model="comentarios"
                    ></v-textarea>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <v-textarea
                      label="Comentarios Administrativos"
                      rows="1"
                      outlined
                      dense
                      auto-grow
                      v-model="comentariosadmin"
                    ></v-textarea>
                  </v-col>
                  <v-col cols="12" class="py-1">
                    <p class="my-1">Soporte de Pago:</p>
                    <ArrastraYSolarComponent
                      @idArchivoCargado="recibirId"
                      :rules="[
                        (v) => !!v || 'Debe adjuntar un soporte de pago',
                      ]"
                    />
                  </v-col>
                  <v-col cols="12" class="pt-1 pb-5">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="continuarDetalles()">
                      Continuar Comisión Bancaría
                    </v-btn>
                    <v-btn class="mx-1" color="error" @click="pasos = 0">
                      Cancel
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>
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
                    <template v-slot:[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                    <template v-slot:[`item.montopagar`]="{ item }">
                      {{ item.montoparcial }}
                    </template>
                    <template v-slot:[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
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

                <v-col cols="2" offset="7">
                  <v-text-field
                    outlined
                    dense
                    label="Comisión Bancaria"
                    id="id"
                    v-model="conceptogastobancario"
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
                    v-model="montogastobancario"
                  ></v-text-field>
                </v-col>
                <v-col cols="3" offset="9">
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
          <v-icon left color="primary">mdi-hand-coin</v-icon> Confirmar Depósito
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Banner de advertencia idéntico a la imagen -->
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
                Ingresa el monto recibido en el banco, según tu estado de
                cuenta.
              </div>
            </div>
          </v-alert>

          <v-text-field
            outlined
            label="Monto recibido en el banco"
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
      comentariosadmin: "",
      conceptogastobancario: "",
      montogastobancario: 0,
      monto_local: 0,
      mostrarDetalle: false,
      pasos: 0,
      monto: 0,
      loading: false,
      nro_operacion: "",
      cliente: null,
      symbol: "USD",
      id_cuenta: {},
      id_banco_origen: null,
      fecha_operacion: null,
      id_path: null,
      selected: [],
      headers: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Moneda Y Monto", value: "montopagar" },

        { text: "Expediente", value: "referencia" },
        { text: "Tipo", value: "tipo" },
        { text: "Ver Factura.", value: "action" },
        { text: "Fecha Factura", value: "fecha" },
        {
          text: "Moneda y Monto Facturado",
          value: "monto_original_total",
        },
        {
          text: "Monto Equivalente en Dólares",
          value: "totaldolar",
        },
        { text: "Saldo Actual", value: "total_mon_local" },
        { text: "Saldo Final", value: "saldo" },
        { text: "Factura", value: "documentos" },
        { text: "Monto Total Abonado", value: "totalabonado" },
      ],
      headersPagosGastosBancario: [
        { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Moneda Y Monto", value: "montopagar" },
        // { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "referencia" },
        { text: "Tipo", value: "tipo", align: "center" },
        { text: "Fecha Factura", value: "fecha" },
        {
          text: "Moneda y Monto Facturado",
          value: "monto_original_total",
        },
        { text: "Saldo Actual", value: "total_mon_local" },
        {
          text: "Monto Equivalente en Dólares",
          value: "totaldolar",
        },
        { text: "Saldo Final", value: "saldo" },
        // { text: "Factura", value: "documentos" },
        { text: "Monto Total Abonado", value: "totalabonado" },
      ],
      items: [],
      errorMesage: {
        cliente: "",
        id_cuenta: "",
        fecha_operacion: "",
        nro_operacion: "",
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
    this.$store.state.bank.deudaACliente = [];
    this.$store.state.mainTitle = "BANCOS - NUEVO INGRESO";
    await Promise.all([
      this.cargarClientes(),
      this._getCoinsList(),
      this.getListBanksDetailsCargar(),
      this._getBanksList(),
    ]);
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxP",
      "_uploadFile",
      "getValidaNroOp",
      "cargarClientes",
      "_getCoinsList",
      "getListBanksDetailsCargar",
      "getDeudaDeClientePorSucursal",
      "cargarClientes",
      "_getBanksList",
      "setRegistroIgresos",
      "validarIngresoNroOperacion",
    ]),
    abrirFactura(item) {
      let id = item.admin_invoice_id;
      window.open(`/home/viewAccountPaysCxC/${id}`, "_blank");
    },
    cancelarllenadoDeMonto() {
      this.dialogLlenarMontoDepositadoBanco = false;
      this.monto_local = null;
      this.id_cuenta = {};

      // Si usas validación de formulario (v-form), es recomendable resetearla aquí:
      // this.$refs.tuFormulario?.resetValidation();
    },
    confirmarDeposito() {
      if (this.monto_local) {
        this.dialogLlenarMontoDepositadoBanco = false;
        this.mostrarDetalle = true;
      }
    },
    checkDeshabilitado(item) {
      // Si editaflag es false, devuelve true para deshabilitar el checkbox
      return item.editaflag === false;
    },
    async onItemSelected({ item, value }) {
      // Si está intentando seleccionar
      if (value) {
        // Validar que la factura y la cuenta tengan la misma moneda
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

        // Si confirma o las monedas son iguales
        item.parcialflag = false;
        item.montoparcial = item.total_mon_local;
      } else {
        // Si deselecciona normalmente
        item.montoparcial = 0;
        item.parcialflag = false;
      }

      this.calcularTotal();
    },
    onSelectAll({ items, value }) {
      items.forEach((item) => {
        if (value) {
          item.parcialflag = false;
          item.montoparcial = item.total_mon_local;
        } else {
          item.montoparcial = 0;
          item.parcialflag = false;
        }
      });
      this.calcularTotal();
    },
    verificarMontoCompleto(item) {
      // Si el combo cambia a "Abono Completo" (value: false)
      if (!item.parcialflag) {
        item.montoparcial = item.total_mon_local;
      }
      this.calcularTotal();
    },
    recibirId(file) {
      if (Object.keys(file).length > 0) {
        this.id_path = file.id;
      } else {
        this.id_path = null;
      }
    },
    async obtenerListado() {
      this.errorMesage.cliente = "";

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

      this.id_banco_origen = null;
      this.fecha_operacion = null;
      this.nro_operacion = "";

      this.id_path = null;

      this.esDuplicado = false;
      this.operacionesSimilares = [];
      this.mostrarDetalle = false;
      if (this.cliente) {
        this.$store.state.spiner = true;

        try {
          await this.getDeudaDeClientePorSucursal(this.cliente);
        } finally {
          this.$store.state.spiner = false;
        }
      } else {
        this.$store.state.bank.deudaACliente = [];
      }
    },

    continuarDetalles() {
      if (!this.$refs.validacionDatosPrincipales.validate()) {
        console.log("ssss");
        return;
      }
      this.errorMesage = {
        cliente: "",
        id_cuenta: "",
        fecha_operacion: "",
        nro_operacion: "",
        monto_local: "",
      };

      if (
        this.id_banco_origen &&
        this.cliente &&
        Object.keys(this.id_cuenta).length > 0 &&
        this.fecha_operacion &&
        this.nro_operacion &&
        this.id_path &&
        !this.esDuplicado
      ) {
        const hoy = new Date();
        const fechaOp = new Date(this.fecha_operacion);
        const unMesEnMs = 30 * 24 * 60 * 60 * 1000;
        const diferencia = Math.abs(fechaOp.getTime() - hoy.getTime());
        if (diferencia < unMesEnMs) {
          this.pasos = 2;
          this.editableGastoBancario = true;
        } else {
          Swal.fire({
            icon: "warning",
            title: "Fecha inusual",
            html: `La fecha seleccionada <b> (${this.fecha_operacion})</b> tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
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
        this.errorMesage.cliente = this.cliente ? "" : "Proveedor es requerido";

        this.errorMesage.id_banco_origen = this.id_banco_origen
          ? ""
          : "Proveedor es requerido";
        this.errorMesage.id_cuenta =
          Object.keys(this.id_cuenta).length > 0 ? "" : "Cuenta es requerida";
        this.errorMesage.fecha_operacion = this.fecha_operacion
          ? ""
          : "Fecha de Operación es requerida";

        // CORRECCIÓN AQUÍ: Cambiado de false a un String de error
        this.errorMesage.nro_operacion = this.nro_operacion
          ? ""
          : "Número de Operación es requerido";
        if (!this.id_path) {
          Swal.fire({
            icon: "error",
            title: "Archivo de Soporte Requerido",
            text: "Por favor, suba el archivo de soporte para continuar.",
          });
        }
        if (this.esDuplicado) {
          this.errorMesage.nro_operacion = "El número de operación ya existe";
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
        if (this.symbol === "USD") {
          return acc + parseFloat(item.montoparcial || 0);
        } else {
          let porcentagePago =
            (item.montoparcial || 0 * 100) / item.monto_original_total;
          return acc + parseFloat(item.totaldolar * porcentagePago);
        }
      }, 0);

      this.monto = totalUSD.toFixed(2);
    },
    continuarGastoBancario() {
      if (!this.cliente || this.selected.length == 0) {
        let text = "";
        text = !this.cliente ? "Cliente Requerido. <br>" : "";
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
        id_cliente: this.cliente,
        id_banco_origen: this.id_banco_origen,
        id_cuentabancaria: this.id_cuenta.id,
        id_moneda: this.id_cuenta.id_coins,
        fecha_operacion: this.fecha_operacion,
        nro_operacion: this.nro_operacion,
        totaldolar: this.monto,
        tipocambio: this.tipocambio,
        comentarios: this.comentarios,
        totalmonedalocal: this.monto_local,
        comentariosadmin: this.comentariosadmin,
        conceptogastobancario: this.conceptogastobancario,
        montogastobancario: this.montogastobancario,
        detalle: this.selected,
        id_soporte: this.id_path,
      };
      this.loading = true;
      await this.setRegistroIgresos(data);
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
            name: "listBankCxC",
          });
        }
      });
    },
    fn_totalAbonado(item) {
      if (!this.selected.includes(item)) {
        return 0;
      }
      let monto = 0;
      if (item.parcialflag) {
        monto = parseFloat(item.montoparcial) || 0;
      } else {
        monto = parseFloat(item.total_mon_local) || 0;
      }
      if (item.symbol == "USD") {
        return `${item.symbol} ${monto.toFixed(2)}`;
      } else {
        return `${this.symbol} ${monto.toFixed(2)}`;
      }
    },
    buscarOperacionAlEscribir() {
      clearTimeout(this.timer);
      if (this.nro_operacion.length < 3) {
        this.operacionesSimilares = [];
        this.esDuplicado = false;
        return;
      }
      this.timer = setTimeout(async () => {
        const res = await this.validarIngresoNroOperacion({
          numerooperacion: this.nro_operacion,
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
          this.errorMesage.nro_operacion = "El número de operación ya existe";
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
      "clientes",
      "cuentas",
    ]),
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
    totalGeneralAbonado() {
      // const total = this.selected.reduce((acc, item) => {
      //   let monto = parseFloat(item.montoparcial) || 0;

      //   return acc + monto;
      // }, 0);
      // return total.toFixed(2);
      return this.monto || "0.00";
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
    tipocambio() {
      if (this.symbol === "USD") {
        return 1;
      }

      if (!this.monto || !this.monto_local) {
        return 1;
      }

      let tc =
        (parseFloat(this.monto_local || 1) +
          parseFloat(this.montogastobancario || 0)) /
        (this.monto || 1);

      return Number(tc.toFixed(4));
    },
    itemsOrdenados() {
      const items = [...this.$store.state.bank.deudaACliente];
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

        this.dialogLlenarMontoDepositadoBanco = true;
      }
    },
    fecha_operacion(newVal) {
      if (newVal) {
        this.errorMesage.fecha_operacion = "";
      } else {
        this.errorMesage.fecha_operacion = "Fecha de Operación es requerida";
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
