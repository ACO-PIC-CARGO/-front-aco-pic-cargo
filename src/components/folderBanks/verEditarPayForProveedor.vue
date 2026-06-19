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
            disabled
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
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            width="50px"
            hide-details
            :disabled="verflag"
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
        <v-col cols="12" md="2" v-if="verflag">
          <v-btn
            color="success"
            class="mt-5"
            @click="
              $router.push({
                name: 'editarPagosPorProveedor',
                params: { id: $route.params.id },
              })
            "
          >
            Ir a Editar
          </v-btn>
        </v-col>
        <v-col cols="12" md="2" v-if="!verflag">
          <v-btn
            class="mt-5"
            color="success"
            :loading="loading"
            @click="finalizarOperacion()"
          >
            Actualizar Operación
          </v-btn>
        </v-col>
        <v-col cols="12" md="2" v-if="!verflag">
          <v-btn
            class="mt-5"
            color="red"
            dark
            :loading="loading"
            @click="confirmarEliminar()"
          >
            Eliminar Operación
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-tabs
            v-model="pasos"
            centered
            color="#000000"
            background-color="#C8E6C9"
          >
            <v-tab key="detallesPago">Detalles de Pago</v-tab>
            <v-tab key="datosPrincipales">Datos Principales</v-tab>
            <v-tab key="gastoBancario"> Resumen y Comisión Bancario</v-tab>
          </v-tabs>

          <v-tabs-items v-model="pasos">
            <v-tab-item key="detallesPago">
              <v-row class="mt-1">
                <v-col cols="12">
                  <!-- show-select -->
                  <v-data-table
                    :headers="headers"
                    :items="itemsOrdenados"
                    v-model="selected"
                    item-key="id"
                    @input="calcularTotal"
                    :search="searchTableDetalle"
                    @item-selected="onItemSelected"
                    @toggle-select-all="onSelectAll"
                  >
                    <template v-slot:body.append>
                      <tr class="grey lighten-4 font-weight-bold">
                        <td :colspan="headers.length - 1" class="text-right">
                          Total General Seleccionado ({{ symbol }}):
                        </td>
                        <td class="text-left">
                          {{ symbol }} {{ totalGeneralAbonado }}
                        </td>
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
                        :disabled="verflag"
                        style="max-width: 120px"
                        :prefix="item.symbol"
                        type="number"
                      ></v-text-field>
                    </template>
                    <template v-slot:[`item.concepto`]="{ item, index }">
                      <v-text-field
                        v-model="item.concepto"
                        :id="`txtConcepto${index}`"
                        outlined
                        dense
                        hide-details
                        :disabled="verflag"
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
                    :disabled="verflag"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6" class="py-1">
                  <v-text-field
                    readonly
                    v-model="id_cuenta.banco"
                    label="Banco:"
                    outlined
                    dense
                    :disabled="verflag"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6" class="py-1"
                  ><v-text-field
                    readonly
                    v-model="id_cuenta.cuenta"
                    label="N° Cuenta:"
                    outlined
                    dense
                    :disabled="verflag"
                  ></v-text-field
                ></v-col>
                <v-col cols="12" md="6" class="py-1"
                  ><v-text-field
                    readonly
                    v-model="id_cuenta.cci"
                    label="CCI:"
                    outlined
                    dense
                    :disabled="verflag"
                  ></v-text-field
                ></v-col>
                <v-col cols="12" md="6" class="py-1">
                  <FormatFecha
                    :outlined="true"
                    :dense="true"
                    label="Fecha Operación"
                    v-model="fechaoperacion"
                    :errorMessages="errorMesage.fechaoperacion"
                    :verflag="verflag"
                  />
                </v-col>
                <v-col cols="12" md="6" class="py-1">
                  <v-text-field
                    readonly
                    v-model="id_cuenta.moneda"
                    label="Moneda:"
                    outlined
                    dense
                    :disabled="verflag"
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
                        ? (errorMesage.numerooperacion = null)
                        : (errorMesage.numerooperacion =
                            'Número de Operación es requerido')
                    "
                    :disabled="verflag"
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
                    :disabled="verflag"
                  ></v-textarea>
                </v-col>
                <v-col cols="12" class="pt-1">
                  <p class="my-1">
                    Soporte de Pago:
                    <v-btn
                      color="error"
                      small
                      class="mx-1"
                      @click="urlfile = null"
                      v-if="!verflag && urlfile"
                      >Eliminar Soporte de Pago</v-btn
                    >
                  </p>
                  <div v-if="urlfile" class="d-inline-block">
                    <!-- CASO 1: SI ES IMAGEN (Miniatura + Visualizador al hacer clic) -->
                    <template v-if="esImagen(urlfile)">
                      <v-dialog max-width="800px">
                        <template v-slot:activator="{ on: dialogOn, attrs }">
                          <v-hover v-slot="{ hover }">
                            <div
                              v-bind="attrs"
                              v-on="dialogOn"
                              class="d-inline-block rounded-circle elevation-2 position-relative cursor-zoom-in"
                              :class="{ 'white--overlay': hover }"
                            >
                              <v-avatar size="120" class="flex-shrink-0">
                                <v-img :src="urlfile" alt="Miniatura">
                                  <template v-slot:placeholder>
                                    <v-row
                                      class="fill-height ma-0"
                                      align="center"
                                      justify="center"
                                    >
                                      <v-progress-circular
                                        indeterminate
                                        color="info"
                                        size="20"
                                      ></v-progress-circular>
                                    </v-row>
                                  </template>
                                </v-img>
                              </v-avatar>

                              <v-overlay
                                absolute
                                :value="hover"
                                color="white"
                                opacity="0.6"
                                class="rounded-circle"
                                z-index="1"
                              >
                                <v-icon color="grey darken-2" size="24"
                                  >mdi-magnify</v-icon
                                >
                              </v-overlay>
                            </div>
                          </v-hover>
                        </template>

                        <v-card flat color="transparent" class="text-center">
                          <v-img
                            :src="urlfile"
                            max-height="85vh"
                            contain
                          ></v-img>
                        </v-card>
                      </v-dialog>
                    </template>

                    <!-- CASO 2: SI NO ES IMAGEN (Tu botón original para PDF/otros archivos) -->
                    <template v-else>
                      <v-btn color="info" icon :href="urlfile" target="_blank">
                        <v-icon color="info" size="large"
                          >mdi-file-pdf-box</v-icon
                        >
                      </v-btn>
                    </template>
                  </div>
                  <ArrastraYSolarComponent
                    v-else
                    @idArchivoCargado="recibirId"
                  />
                </v-col>
                <!-- <v-col cols="12" class="pt-1 pb-5">
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="continuarDetalles()">
                    Continue
                  </v-btn>
                  <v-btn text> Cancel </v-btn>
                </v-col> -->
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
                    <template v-slot:[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template v-slot:[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
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
                    :disabled="verflag"
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
                    :disabled="verflag"
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
                    v-model="montoFinal"
                    disabled
                  ></v-text-field>
                </v-col>
                <!-- <v-col cols="12">
                  <v-btn
                    class="mx-1"
                    color="success"
                    :loading="loading"
                    @click="finalizarOperacion()"
                  >
                    Actualizar Operación
                  </v-btn>
                </v-col> -->
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
  props: {
    verflag: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
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
      urlfile: "",
      loading: false,
      headers: [
        // { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montopagar" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },

        { text: "Moneda y Monto Facturado", value: "montomonedalocal" },
        { text: "Monto Equivalente en Dólares", value: "montodolar" },
        // { text: "Saldo", value: "saldo" },
        { text: "Factura", value: "documentos" },
        { text: "Total Monto Abonado", value: "totalabonado" },
      ],
      headersPagosGastosBancario: [
        // { text: "Abono Completo o Parcial", value: "parcialflag" },
        { text: "Monto DDL", value: "montoparcial" },
        { text: "Fecha Facturación", value: "fecha" },
        { text: "Expediente", value: "code_master" },
        { text: "Procedencia", value: "tipo_gasto" },

        { text: "Moneda y Monto Facturado", value: "montomonedalocal" },
        { text: "Monto Equivalente en Dólares", value: "montodolar" },
        // { text: "Saldo", value: "saldo" },
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
    console.log("editable", this.verflag);
    this.$store.state.mainTitle = "BANCOS - VER SALIDA";
    this.$store.state.spiner = true;
    await Promise.all([
      this.cargarProveedores(),
      this._getCoinsList(),
      this.getListBanksDetailsCargar(),
    ]);
    let data = await this.verRegistroEgresos({ id: this.$route.params.id });
    this.$store.state.spiner = false;
    this.proveedor = data.id_proveedor;
    this.id_cuenta =
      this.$store.state.bancos.cuentas.find(
        (c) => c.id === data.id_cuentabancaria,
      ) || {};
    this.fechaoperacion = data.fechaoperacion;
    this.numerooperacion = data.numerooperacion;
    this.comentarios = data.comentario;
    this.monto =
      data.totaldolar -
      (data.comisionbancaria.length > 0
        ? data.comisionbancaria[0].montodolar
        : 0);
    this.monto_local =
      data.totalmonedalocal -
      (data.comisionbancaria.length > 0 ? data.comisionbancaria[0].monto : 0);
    this.urlfile = data.urlfile;
    this.$store.state.bank.deudaAProveedor = data.detalles;
    this.selected = data.detalles;
    this.id_path = data.id_soporte;
    this.conceptogastobancario =
      data.comisionbancaria.length > 0 ? data.comisionbancaria[0].concepto : "";
    this.montogastobancario =
      data.comisionbancaria.length > 0 ? data.comisionbancaria[0].monto : 0;
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
      "updateRegistroEgresos",
      "verRegistroEgresos",
      "eliminarRegistroEgresos",
    ]),
    confirmarEliminar() {
      Swal.fire({
        icon: "warning",
        title: "Eliminar Registro",
        text: "¿Está seguro que quiere eliminar el registro?",
        showDenyButton: true,
        denyButtonColor: "#263238",
        denyButtonText: "Cancelar",
        confirmButtonText: "Si, Eliminar",
        confirmButtonColor: "red",
        showCloseButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          this.eliminar();
        }
      });
    },
    async eliminar() {
      let val = true;
      let msg = "";
      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value.trim();
          const input2 = document.getElementById("swal-input2").value.trim();
          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }
          return { usuario: input1, clave: input2 };
        },
      }).then(async (result) => {
        if (!result.isConfirmed) {
          // Usuario canceló
          val = false;
          msg = "Operación cancelada";
          return;
        }

        if (result.value) {
          const vm = this;
          const res = await vm.validarUsuarioAdmin({
            usuario: result.value.usuario,
            clave: result.value.clave,
          });

          if (res && res.estadoflag) {
            val = true;
          } else {
            val = false;
            msg = res?.mensaje || "Credenciales incorrectas";
          }
        } else {
          val = false;
          msg = "Debe ingresar las credenciales";
        }
      });

      if (!val) {
        await Swal.fire({
          icon: "error",
          text: msg,
        });
        return false;
      }
      await this.eliminarRegistroEgresos({ id: this.$route.params.id });
      this.$router.push({
        name: "listBankCxP",
      });
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
    esImagen(url) {
      if (!url) return false;
      // Convierte a minúsculas y quita parámetros de consulta (?query=...) si los hay
      const limpiaUrl = url.split("?")[0].toLowerCase();
      // Verifica las extensiones de imagen más comunes
      return limpiaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) !== null;
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
        fechaoperacion: "",
        numerooperacion: "",
      };
      if (
        this.proveedor &&
        Object.keys(this.id_cuenta).length > 0 &&
        this.fechaoperacion &&
        this.numerooperacion
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
        this.errorMesage.fechaoperacion = this.fechaoperacion
          ? ""
          : "Fecha de Operación es requerida";
        this.errorMesage.numerooperacion = this.numerooperacion
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
          let maximo = parseFloat(item.montoparcial / item.tipocambio) || 0;
          let escrito = parseFloat(item.montoparcial / item.tipocambio) || 0;

          valorFila = escrito > maximo ? maximo : escrito;
        } else {
          valorFila = parseFloat(item.montoparcial / item.tipocambio) || 0;
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
      if (this.monto_local != this.monto / this.tipocambio) {
        Swal.fire({
          icon: "error",
          title: "Monto Local Incorrecto",
          text: `El monto local debe ser equivalente a ${this.symbol} ${this.monto}.`,
        });
        return false;
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
        id: this.$route.params.id,
      };
      this.loading = true;
      await this.updateRegistroEgresos(data);
      this.loading = false;
      Swal.fire({
        icon: "success",
        title: "Operación Actualizada",
        text: "El pago se ha actualizado correctamente.",
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
        // 1. IMPORTANTE: Usar la misma lógica que fn_totalAbonado
        // Si tu individual usa montoparcial, aquí también.
        let monto = parseFloat(item.montoparcial) || 0;

        let montoConvertido = 0;
        const tc = parseFloat(this.tipocambio) || 1;

        if (this.symbol === "USD") {
          if (item.symbol === "USD") {
            montoConvertido = monto;
          } else {
            // De Local a USD -> Dividir (Redondeamos a 2 decimales como en el individual)
            montoConvertido = Math.round((monto / tc) * 100) / 100;
          }
        } else {
          // Si la cuenta bancaria es Soles (S/.)
          if (item.symbol === "USD") {
            // De USD a Local -> Multiplicar
            montoConvertido = Math.round(monto * tc * 100) / 100;
          } else {
            montoConvertido = monto;
          }
        }

        return acc + montoConvertido;
      }, 0);

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

<style scoped>
.cursor-zoom-in {
  cursor: zoom-in !important;
}

/* Necesario para que v-overlay absolute funcione dentro de v-avatar */
.position-relative {
  position: relative !important;
}
</style>
