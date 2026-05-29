<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4" class="pb-0">
          Cliente:
          <v-autocomplete
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
            :error-messages="errorMesage.monto_local"
            @input="
              monto_local
                ? (errorMesage.monto_local = '')
                : (errorMesage.monto_local =
                    'Monto de Depósito en banco es requerido')
            "
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
                    :items="$store.state.itemsDataBanksList"
                    v-model="id_banco_origen"
                    label="Banco Origen"
                    item-text="acronym"
                    item-value="id"
                    outlined
                    dense
                    :error-messages="errorMesage.id_cuenta_origen"
                    @change="errorMesage.id_cuenta_origen = null"
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
                    v-model="fecha_operacion"
                    :errorMessages="errorMesage.fecha_operacion"
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
                    :error-messages="errorMesage.nro_operacion"
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
                    @item-selected="onItemSelected"
                    @toggle-select-all="onSelectAll"
                    :search="searchTableDetalle"
                    :item-disabled="checkDeshabilitado"
                  >
                    <template v-slot:body.append>
                      <tr class="grey lighten-4 font-weight-bold">
                        <td :colspan="headers.length" class="text-right">
                          Total General Seleccionado ({{ symbol }}):
                        </td>
                        <td class="text-left">
                          {{ symbol }} {{ totalGeneralAbonado }}
                        </td>
                      </tr>
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
                    item-key="id"
                  >
                    <template v-slot:body.append>
                      <tr class="grey lighten-4 font-weight-bold">
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado ({{ symbol }}):
                        </td>
                        <td class="text-left">
                          {{ symbol }} {{ totalGeneralAbonado }}
                        </td>
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
      esDuplicado: false,
      timer: null,
      operacionesSimilares: {},
      comentarios: "",
      comentariosadmin: "",
      conceptogastobancario: "",
      montogastobancario: 0,
      monto_local: 0,
      snackbar: false,
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
        { width: "6%", text: "Abono Completo o Parcial", value: "parcialflag" },
        { width: "12%", text: "Ingrese Monto a Abonar", value: "montopagar" },
        { width: "8%", text: "Fecha Facturación", value: "fecha" },
        { width: "8%", text: "Expediente", value: "referencia" },
        { width: "8%", text: "Módulo Origen", value: "tipo" },
        {
          width: "8%",
          text: "Monto Según Factura",
          value: "monto_original_total",
        },
        { width: "8%", text: "Saldo Actual", value: "total_mon_local" },
        {
          text: "Monto Equivalente en Dólares",
          value: "totaldolar",
          width: "8%",
        },
        { width: "8%", text: "Saldo Final", value: "saldo" },
        { width: "8%", text: "Factura", value: "documentos" },
        { width: "8%", text: "Monto Total Abonado", value: "totalabonado" },
      ],
      headersPagosGastosBancario: [
        { width: "6%", text: "Abono Completo o Parcial", value: "parcialflag" },
        { width: "12%", text: "Monto Abonado", value: "montopagar" },
        { width: "8%", text: "Fecha Facturación", value: "fecha" },
        { width: "8%", text: "Expediente", value: "referencia" },
        { width: "8%", text: "Módulo Origen", value: "tipo" },
        {
          width: "8%",
          text: "Monto Según Factura",
          value: "monto_original_total",
        },
        { width: "8%", text: "Saldo Actual", value: "total_mon_local" },
        {
          text: "Monto Equivalente en Dólares",
          value: "totaldolar",
          width: "8%",
        },
        { width: "8%", text: "Saldo Final", value: "saldo" },
        { width: "8%", text: "Factura", value: "documentos" },
        { width: "8%", text: "Monto Total Abonado", value: "totalabonado" },
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
    checkDeshabilitado(item) {
      // Si editaflag es false, devuelve true para deshabilitar el checkbox
      return item.editaflag === false;
    },
    onItemSelected({ item, value }) {
      if (value && item.editaflag === false) {
        // Removerlo inmediatamente si fue seleccionado
        this.selected = this.selected.filter((i) => i.id !== item.id);

        // Mostrar el mensaje
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No sé puede seleccionar porque está en departamento operativo. Comuníquese.",
        });
      }
      if (value) {
        // Si se selecciona, por defecto es Abono Completo (false) y carga el saldo
        item.parcialflag = false;
        item.montoparcial = item.total_mon_local;
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
    obtenerListado() {
      this.errorMesage.cliente = "";
      this.pasos = 0;
      this.editable = false;
      if (this.cliente) {
        this.getDeudaDeClientePorSucursal(this.cliente);
      } else {
        this.$store.state.bank.deudaAProveedor = [];
      }
    },

    continuarDetalles() {
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
        const diffMeses =
          (fechaOp.getFullYear() - hoy.getFullYear()) * 12 +
          (fechaOp.getMonth() - hoy.getMonth());

        if (Math.abs(diffMeses) < 1) {
          this.pasos = 1;
          this.editable = true;
        } else {
          Swal.fire({
            icon: "warning",
            title: "Fecha inusual",
            text: `La fecha seleccionada (${this.fecha_operacion}) tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
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
      let total = this.selected.reduce((acc, item) => {
        let valorFila = 0;
        if (item.parcialflag) {
          let maximo = parseFloat(item.total_mon_local / item.tipocambio) || 0;
          let escrito = parseFloat(item.montoparcial / item.tipocambio) || 0;

          valorFila = escrito > maximo ? maximo : escrito;
        } else {
          valorFila = parseFloat(item.total_mon_local / item.tipocambio) || 0;
        }
        return acc + valorFila;
      }, 0);

      this.monto = total.toFixed(2);
    },
    continuarGastoBancario() {
      if (!this.monto_local) {
        Swal.fire({
          icon: "error",
          title: "Monto Local Requerido",
          text: "Por favor, ingrese el monto depositado en banco para continuar.",
        });
        return;
      }
      this.pasos = 2;
      this.editableGastoBancario = true;
    },
    async finalizarOperacion() {
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
        return `${this.symbol} ${(monto / this.tipocambio).toFixed(2)}`;
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
        console.log("Respuesta de validación de número de operación:", res);
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
    totalGeneralAbonado() {
      return this.selected
        .reduce((acc, item) => {
          let monto = 0;

          // Lógica similar a tu fn_totalAbonado pero puramente numérica
          if (item.parcialflag) {
            monto = parseFloat(item.montoparcial) || 0;
          } else {
            monto = parseFloat(item.total_mon_local) || 0;
          }

          // Convertimos a USD si no lo está
          if (item.symbol !== "USD") {
            const tc = parseFloat(this.tipocambio) || 1;
            monto = monto / tc;
          }

          return acc + monto;
        }, 0)
        .toFixed(2);
    },
    tipocambio() {
      const tc = (this.monto_local||0) / (this.monto||1);
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
      let montogastobancario = 0;
      montogastobancario = Number(this.montogastobancario || 0);
      const total = Number(this.monto_local || 0) + montogastobancario;
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
