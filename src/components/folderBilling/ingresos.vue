<template>
  <v-container fluid>
    <h3>
      Ingresos (Venta al cliente) Pricing:
      {{ formatUsd(ingreso_pr) }} / ------- Operaciones:
      {{ formatUsd(ingreso_op) }}
    </h3>
    <v-expansion-panels v-model="openedPanel" accordion>
      <v-expansion-panel
        v-for="(house, index) in ($store.state.controlGastos
          .listControlGastos[0] &&
          $store.state.controlGastos.listControlGastos[0].master_houses) ||
        []"
        :key="index"
        :value="house.isExpanded"
      >
        <v-expansion-panel-header @click.stop="abrirExpandIngreso(index)">
          <template #actions>
            <v-icon @click="abrirExpandIngreso(index)"
              >mdi-unfold-more-horizontal</v-icon
            >
          </template>
          <v-simple-table dense>
            <thead>
              <tr>
                <th width="10%">House</th>
                <th width="10%">Cotización</th>
                <th width="22%">Consignatario</th>
                <th width="12%" style="background: #d6f4ff">Total Pricing</th>
                <th width="12%" style="background: #ffd6d6">
                  Total Operaciones
                </th>
                <th width="12%" style="background: #fff9c4">Total Deuda</th>
                <th v-if="editable" width="6%">Acción</th>
                <th v-if="editable" width="6%">Abonos</th>
                <th v-if="editable" width="8%">Más acciones</th>
                <th>Ver Proformas</th>
                <th v-if="editable" width="8%">Facturas y Proformas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ house.code_house }}</td>
                <td>{{ getQuoteNumber(house) }}</td>
                <td>{{ house.consigner }}</td>
                <td>{{ house.total_total_pr_ingresos }}</td>
                <td>{{ house.total_total_op_ingresos }}</td>
                <td>{{ getDeudaActual(house) }}</td>
                <td v-if="editable">
                  <v-btn
                    v-if="house.id_orders"
                    @click.stop="handleNuevoIngreso(index, house)"
                    color="blue"
                    dark
                    x-small
                  >
                    Nuevo Concepto

                    <!-- <v-icon>mdi-plus</v-icon> -->
                  </v-btn>
                  <v-btn
                    v-else
                    small
                    @click="nuevoControlGasto(house)"
                    color="green darken-3"
                    dark
                    @click.stop="abrirExpandIngreso(index)"
                    >Nuevo Control de Gastos Ingresos</v-btn
                  >
                  <v-tooltip
                    bottom
                    color="error"
                    v-if="bloquearCopiarMontos(house.ingresos)"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        color="success"
                        x-small
                        @click="
                          copiarMontosHouse(
                            null,
                            bloquearCopiarMontos(house.ingresos),
                          )
                        "
                      >
                        Copiar Montos Pr->Op
                      </v-btn>
                    </template>
                    <span>
                      No se Puede Copiar porqué ya existe Montos Facturados
                    </span>
                  </v-tooltip>
                  <v-btn
                    v-else
                    color="success"
                    x-small
                    @click="
                      copiarMontosHouse(
                        house,
                        bloquearCopiarMontos(house.ingresos),
                      )
                    "
                  >
                    Copiar Montos Pr->Op
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    v-if="house.id_orders"
                    :color="house.debscliente.length > 0 ? 'green' : 'red'"
                    :dark="
                      house.total_total_pr_ingresos != 0 ||
                      house.total_total_op_ingresos != 0
                    "
                    :disabled="
                      house.total_total_pr_ingresos == 0 &&
                      house.total_total_op_ingresos == 0
                    "
                    small
                    @click="_openDebs(house)"
                    @click.stop="abrirExpandIngreso(index)"
                  >
                    CARGAR ABONOS
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    v-if="house.id_orders"
                    color="indigo"
                    small
                    dark
                    class="mb-1"
                    @click.stop="abrirModalCambiarExpediente(house)"
                    :loading="flagCambiarExpediente"
                  >
                    Cambiar expediente
                  </v-btn>
                  <v-btn
                    v-if="house.id_orders"
                    color="red darken-1"
                    small
                    dark
                    @click.stop="eliminarHouseIngreso(house)"
                  >
                    Eliminar
                  </v-btn>
                </td>
                <td>
                  <v-icon color="info" @click.stop="verProformas(house)"
                    >mdi-eye</v-icon
                  >
                </td>
                <td v-if="editable">
                  <v-btn
                    color="primary"
                    small
                    @click.stop="abrirModalFacturasFiscales(house)"
                  >
                    FACTURA FISCAL
                  </v-btn>
                  <v-btn
                    v-if="house.id_orders"
                    color="pink"
                    small
                    class="mt-1"
                    :dark="!isBotonEmitirProformaDisabled(house)"
                    :disabled="isBotonEmitirProformaDisabled(house)"
                    @click="abrirModalFacturar(house)"
                    @click.stop="abrirExpandIngreso(index)"
                  >
                    EMITIR PROFORMA
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
                <th class="text-left">Descripción</th>
                <th style="background: #d6f4ff" class="text-left">Monto Pr</th>
                <th
                  style="background: #d6f4ff"
                  class="text-left"
                  v-if="mostrarImpuesto"
                >
                  {{ $store.state.enterprises.impuesto.nombre_impuesto }} Pr
                </th>
                <th style="background: #d6f4ff" class="text-left">Total Pr</th>
                <th style="background: #ffd6d6" class="text-left">Monto Op</th>
                <th
                  style="background: #ffd6d6"
                  class="text-left"
                  v-if="mostrarImpuesto"
                >
                  {{ $store.state.enterprises.impuesto.nombre_impuesto }} Op
                </th>
                <th style="background: #ffd6d6" class="text-left">Total Op</th>
                <th class="text-center">Facturado</th>
                <th v-if="editable" class="text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item of house.ingresos" :key="item.id">
                <td>{{ item.concepto }}</td>
                <td style="background: #d6f4ff">
                  {{ parseFloat(item.monto_pr).toFixed(2) }}
                </td>
                <td style="background: #d6f4ff" v-if="mostrarImpuesto">
                  {{ parseFloat(item.igv_pr).toFixed(2) }}
                </td>
                <td style="background: #d6f4ff">
                  {{ parseFloat(item.total_pr).toFixed(2) }}
                </td>
                <td style="background: #ffd6d6">
                  {{ parseFloat(item.monto_op).toFixed(2) }}
                </td>
                <td style="background: #ffd6d6" v-if="mostrarImpuesto">
                  {{ parseFloat(item.igv_op).toFixed(2) }}
                </td>
                <td style="background: #ffd6d6">
                  {{ parseFloat(item.total_op).toFixed(2) }}
                </td>
                <td>
                  <v-chip
                    class="ma-2"
                    color="orange"
                    text-color="white"
                    v-if="item.facturado == true"
                  >
                    Si
                  </v-chip>
                  <v-chip class="ma-2" color="green" text-color="white" v-else>
                    No
                  </v-chip>
                  <br />

                  <span v-if="item.verFactura">
                    Nro Factura: <br />
                    {{ item.nro_factura }}
                  </span>
                </td>
                <td v-if="editable">
                  <v-icon
                    color="info"
                    @click.native="activarFactura(item)"
                    v-if="item.facturado == true"
                  >
                    mdi-eye
                  </v-icon>
                  <v-icon color="orange" @click="editIngreso(item)">
                    mdi-pencil
                  </v-icon>

                  <v-icon
                    color="red"
                    v-if="item.facturado == false"
                    @click="delIngreso(item.id)"
                  >
                    mdi-delete
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!--  -->
    <v-dialog v-model="dialogIngreso" width="800" persistent>
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Datos del servicio
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogIngreso = !dialogIngreso">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="frmIngreso">
              <v-row>
                <v-col cols="9">
                  <v-text-field
                    v-model="ingresos.concepto"
                    label="Concepto"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="3">
                  <v-switch
                    v-if="mostrarImpuesto"
                    @change="calcular()"
                    v-model="ingresos.statusCalcula"
                    dense
                    :label="`Calcula ${$store.state.enterprises.impuesto.nombre_impuesto}`"
                  ></v-switch>
                  <!-- <p v-else>NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de Configuración</p> -->
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    @keyup="calcular()"
                    v-model="ingresos.montoop"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                    type="number"
                    label="Monto"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    readonly
                    v-model="ingresos.igvop"
                    type="number"
                    :label="`${$store.state.enterprises.impuesto.nombre_impuesto}`"
                    v-if="mostrarImpuesto"
                  ></v-text-field>
                  <p v-else>
                    NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de
                    Configuración
                  </p>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    v-model="ingresos.totalop"
                    type="number"
                    label="Total"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag">
                  <v-text-field
                    @keyup="calcular()"
                    v-model="ingresos.montopr"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                    type="number"
                    label="Monto"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag && mostrarImpuesto">
                  <v-text-field
                    readonly
                    v-model="ingresos.igvpr"
                    type="number"
                    :label="`${$store.state.enterprises.impuesto.nombre_impuesto}`"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag">
                  <v-text-field
                    v-model="ingresos.totalpr"
                    type="number"
                    label="Total"
                  ></v-text-field>
                </v-col>

                <v-col>
                  <v-btn
                    v-if="this.statusBtn == 1"
                    @click.native="setIngresos()"
                    block
                    color="success"
                    elevation="0"
                    >Agregar servicio</v-btn
                  >
                  <v-btn
                    v-if="this.statusBtn == 2"
                    @click.native="editIngresos()"
                    block
                    color="success"
                    elevation="0"
                    >Guardar Cambios</v-btn
                  >
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!--  -->
    <v-dialog max-width="90%" v-model="dialogDebs" persistent>
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Abonos del cliente
          <v-spacer></v-spacer>

          <v-btn icon color="default" @click="dialogDebs = !dialogDebs">
            <v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-data-table :headers="headersdebs" :items="house.debscliente">
            <template v-slot:[`item.accion`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                small
                color="default"
                @click="openDoc(item.path)"
                >mdi-eye</v-icon
              >
              <v-icon
                class="btn_add mr-2"
                small
                color="warning"
                v-if="item.status == 1"
                @click="editarDebs(item)"
                >mdi-pencil</v-icon
              >
              <v-icon
                class="btn_add mr-2"
                small
                color="red"
                v-if="item.status == 1"
                @click="_delDebsClient(item.id)"
                >mdi-delete</v-icon
              >
            </template>
            <template v-slot:[`item.status`]="{ item }">
              <v-chip
                block
                v-if="item.status == 2"
                small
                class=""
                color="success"
                outlined
              >
                <v-icon left> mdi-check </v-icon>
                Confirmado
              </v-chip>
              <v-chip
                block
                v-if="item.status == 1"
                small
                class=""
                color="orange"
                outlined
              >
                <v-icon left> mdi-warning </v-icon>
                Por Confirmar
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="_newDebs()">
            CARGAR NUEVO ABONO
          </v-btn>
          <v-btn color="error" @click="dialogDebs = !dialogDebs">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog max-width="80%" v-model="dialogNewDebs" v-if="dialogNewDebs">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Cargar un Nuevo abonos
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogNewDebs = !dialogNewDebs">
            <v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form ref="frmNuevoAbono">
              <v-row dense>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Fecha de Operación"
                    prepend-icon="mdi-calendar"
                    type="date"
                    v-model="date"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="number"
                    label="No. Operación del Voucher"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider></v-divider>
              <v-row>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="id_coins"
                    item-text="acronym"
                    item-value="id"
                    label="Moneda "
                    @change="obtenerMoneda()"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="3" v-if="sufmoneda != 'USD'">
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="monto_abonado"
                    type="number"
                    label="Monto Ingresado al Banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change.native="calcularMontoDolar()"
                    :prefix="sufmoneda"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12" md="3" v-if="sufmoneda != 'USD'">
                  <v-text-field
                    v-model="monto"
                    type="number"
                    label="Monto de la Factura (Solo Lectura)"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    prefix="USD"
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider></v-divider>
              <!--  -->
              <v-row>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    :items="$store.state.itemsDataBanksList"
                    v-model="id_banks"
                    item-text="acronym"
                    item-value="id"
                    label="Banco Origen"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    :items="
                      ($store.state.bancos.cuentas || []).filter(
                        (v) => v.symbol == sufmoneda,
                      )
                    "
                    v-model="id_cuenta_pic"
                    label="Cuenta Destino (PIC)"
                    item-text="label"
                    item-value="id"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="3">
                  <v-textarea
                    auto-grow
                    rows="1"
                    append-outer-icon="mdi-comment"
                    v-model="comentario"
                    label="Comentario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-textarea>
                </v-col>
                <v-col md="12" cols="12">
                  <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="loading" @click="_setDebsClient()"
            >GUARDAR ABONO</v-btn
          >

          <v-btn color="red" dark @click="dialogNewDebs = !dialogNewDebs"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog max-width="80%" v-model="dialogDebsEdit">
      <v-card>
        <v-card-title>
          Cargar un nuevo abono
          <v-spacer></v-spacer>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form ref="frmNuevoAbono">
              <v-row dense>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Fecha de Operación"
                    prepend-icon="mdi-calendar"
                    type="date"
                    v-model="date"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="number"
                    label="No. Operación"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="monto"
                    type="number"
                    label="Monto En Dolares"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    suffix="USD"
                    disabled
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!--  -->
              <v-row>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    :items="$store.state.itemsDataBanksList"
                    v-model="id_banks"
                    item-text="acronym"
                    item-value="id"
                    label="Banco Origen"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    :items="
                      ($store.state.bancos.cuentas || []).filter(
                        (v) => v.symbol == sufmoneda,
                      )
                    "
                    v-model="id_cuenta_pic"
                    label="Cuenta Destino (PIC)"
                    item-text="label"
                    item-value="id"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="3">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="id_coins"
                    item-text="acronym"
                    item-value="id"
                    label="Moneda En cuenta de Banco"
                    @change="obtenerMoneda()"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="monto_abonado"
                    type="number"
                    label="Monto En cuenta de Banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change.native="calcularMontoDolar()"
                    :prefix="sufmoneda"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="12">
                  <v-textarea
                    rows="2"
                    v-model="comentario"
                    label="Comentario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-textarea>
                </v-col>
                <v-col md="12" cols="12">
                  <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
                </v-col>
                <v-col cols="3">
                  <v-btn
                    :disabled="boolFile || payfile == []"
                    color="blue-grey"
                    block
                    class="ma-2 white--text"
                    large
                    @click="_uploadFile()"
                  >
                    Subir
                    <v-icon right dark> mdi-cloud-upload </v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="actualizar()">GUARDAR ABONO</v-btn>
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogDebsEdit = !dialogDebsEdit"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- --------------------------- -->
    <v-dialog
      v-model="dialogFacturar"
      scrollable
      persistent
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
      v-if="dialogFacturar"
    >
      <v-card>
        <v-card-title primary-title> GENERAR PROFORMA </v-card-title>
        <v-card-text>
          <v-stepper v-model="stepProforma" vertical>
            <v-stepper-step step="1" :complete="stepProforma > 1">
              Descripción de la Cabecera del Documento
            </v-stepper-step>
            <v-stepper-content step="1">
              <v-text-field
                v-model="nombreProforma"
                label="Nombre a Imprimir"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
              <v-btn color="primary" @click="stepProforma = 2">
                Continue
              </v-btn>
            </v-stepper-content>

            <v-stepper-step step="2"> Conceptos a Facturar </v-stepper-step>

            <v-stepper-content step="2">
              <v-row>
                <v-col cols="12">
                  <v-data-table
                    v-model="selected"
                    :headers="headersFacturas"
                    :items="conceptos.filter((v) => !v.facturado)"
                    show-select
                    item-key="id"
                  >
                  </v-data-table>
                </v-col>
                <v-col cols="6">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    item-text="symbol"
                    item-value="id"
                    label="Moneda"
                    placeholder="Seleccione una moneda"
                    v-model="id_coins"
                    :error-messages="errorCoin"
                    ref="coinSelect"
                  >
                  </v-autocomplete>
                </v-col>
                <v-col cols="6" v-if="$store.state.branchs.length > 1">
                  <v-autocomplete
                    :items="$store.state.branchs"
                    item-text="trade_name"
                    item-value="id"
                    label="Sucursal"
                    placeholder="Seleccione una sucursal"
                    v-model="id_branch"
                    @change="obtenerDatos()"
                  >
                  </v-autocomplete>
                </v-col>
                <v-col cols="12"> </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="stepProforma == 2"
            color="success"
            :loading="obtenerDatosHouse"
            :disabled="id_branch == '' || selected.length == 0"
            @click="generarDocumento()"
            class="mx-1"
          >
            Generar Proforma
          </v-btn>
          <v-btn
            color="warning"
            @click="dialogFacturar = !dialogFacturar"
            class="mx-1"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--FACTURAS FISCALES-->
    <v-dialog max-width="80%" v-model="dialogFacturasFiscales">
      <v-card>
        <v-card-title>
          Facturas y Proformas Fiscales de {{ house.consigner }}
          <v-spacer></v-spacer>
          <v-btn outlined @click="cargarProformaFiscal" color="primary"
            >Cargar Nueva</v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFacturasFiscales"
            :items="lstFacturasFiscales"
            dense
            item-key="id"
            class="elevation-0"
            :loading="isDataTableLoading"
          >
            <template v-slot:[`item.originalname`]="{ item }">
              <v-icon v-if="item.type == 'pdf'" color="red" class="mr-2"
                >mdi-file-pdf</v-icon
              >
              <v-icon
                v-if="
                  item.type == 'png' ||
                  item.type == 'jpg' ||
                  item.type == 'jpeg'
                "
                color="blue-grey darken-1"
                class="mr-2"
                >mdi-file-image</v-icon
              >
              {{
                item.tipo_pago == 1
                  ? "FACTURA"
                  : "" || item.tipo_pago == 2
                  ? "PERFORMANCE"
                  : "OTRO"
              }}
              -
              {{ item.nro_factura }}
            </template>
            <template v-slot:[`item.path`]="{ item }">
              <v-btn icon small>
                <v-icon
                  class="btn_add mr-2"
                  dense
                  large
                  color="grey"
                  @click.native="openDoc(item.path)"
                >
                  mdi-eye
                </v-icon></v-btn
              >
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <v-btn icon small>
                <v-icon
                  class="btn_add mr-2"
                  dense
                  large
                  color="red"
                  @click.native="eliminarProformaFiscal(item.id)"
                >
                  mdi-delete
                </v-icon></v-btn
              >
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!--PROFORMA FISCAL-->
    <v-dialog width="80%" v-model="dialogProformaFiscal">
      <v-card>
        <v-card-title>
          <h3>Subir Proformas Fiscales de {{ house.consigner }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row dense>
              <v-col cols="12" md="12">
                <v-radio-group v-model="proformaFiscal.tipo_pago" row>
                  <v-radio label="Factura" value="1"></v-radio>
                  <v-radio label="Performance" value="2"></v-radio>
                  <v-radio label="Otro" value="3"></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Fecha de Operación"
                  prepend-icon="mdi-calendar"
                  type="date"
                  v-model="proformaFiscal.fecha"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="proformaFiscal.nro_factura"
                  :label="`Nro de ${
                    proformaFiscal.tipo_pago == 1
                      ? 'Factura'
                      : '' || proformaFiscal.tipo_pago == 2
                      ? 'Performance'
                      : 'Otro'
                  }`"
                ></v-text-field>
              </v-col>
              <v-col md="12" cols="12">
                <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="registrarProformaFiscal()"
            :disabled="!$store.state.files.payPath"
          >
            GUARDAR
            {{
              proformaFiscal.tipo_pago == 1
                ? "Factura"
                : "" || proformaFiscal.tipo_pago == 2
                ? "Performance"
                : "Otro"
            }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            outlined
            color="red"
            @click="dialogProformaFiscal = !dialogProformaFiscal"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogFacturaEmitidas"
      persistent
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          <h2>Proformas Activas</h2>
        </v-card-title>

        <v-card-text class="px-5">
          <v-simple-table width="100%">
            <thead>
              <th>#</th>
              <th>Nro Factura</th>
              <th>Doc. Ref.</th>
              <th>Monto</th>
              <th>IGV</th>
              <th>Total</th>
              <th></th>
            </thead>
            <tbody>
              <tr v-for="(item, index) in lstFacturasEmitidas" :key="index">
                <td>{{ index + 1 }}</td>
                <td style="text-align: center">{{ item.nro_factura }}</td>
                <td style="text-align: center">
                  <v-icon color="red" @click="abrirPdf(item.url_documento)">
                    mdi-file-pdf-box
                  </v-icon>
                </td>
                <td style="text-align: center">{{ item.total_monto }}</td>
                <td style="text-align: center">{{ item.total_igv }}</td>
                <td style="text-align: center">{{ item.total }}</td>
                <td>
                  <v-icon color="red" @click="eliminarFactura(item.id)"
                    >mdi-delete</v-icon
                  >
                </td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-subheader class="blinking">
            <v-icon color="warning">mdi-alert</v-icon> PARA EDITAR , DEBES
            ELIMINAR Y VOLVER A GENERAR LA PROFORMA
          </v-subheader>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="error"
            @click="dialogFacturaEmitidas = !dialogFacturaEmitidas"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- CAMBIAR EXPEDIENTE (HOUSE CODE) -->
    <v-dialog v-model="dialogCambiarExpediente" max-width="500">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Cambiar expediente (House)
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogCambiarExpediente = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-select
            :items="listaExpedientes"
            v-model="selectedNuevoExpediente"
            item-text="text"
            item-value="value"
            label="Seleccione nuevo expediente"
            dense
          ></v-select>
          <p class="caption mb-0">Actual: {{ house.code_house }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogCambiarExpediente = false"
            >Cancelar</v-btn
          >
          <v-btn
            color="primary"
            :disabled="!selectedNuevoExpediente"
            @click="aplicarCambioExpediente"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from "moment";
import axios from "axios";
import Swal from "sweetalert2";
import { mapActions } from "vuex";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import swal from "sweetalert2";
export default {
  props: {
    statusBtn: {
      default: 0,
      type: Number,
    },
    prFlag: {
      default: false,
      type: Boolean,
    },
    opFlag: {
      default: false,
      type: Boolean,
    },
    ingreso_pr: {
      default: 0,
      type: Number,
    },
    ingreso_op: {
      default: 0,
      type: Number,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      flagCambiarExpediente: false,
      stepProforma: 1,
      errorCoin: "",
      dialogFacturaEmitidas: false,
      lstFacturasEmitidas: [],
      nombreProforma: "PROFORMA",
      openedPanel: null,
      payfile: [],
      date: "",
      number: "",
      monto: "",
      tipocambio: "",
      id_banks: "",
      id_cuenta_pic: "",
      id_coins: "",
      monto_abonado: "",
      comentario: "",
      errfile: "",
      sufmoneda: "",
      msgfile: "",
      id_branch: "",
      obtenerDatosHouse: null,
      loadingFile: false,
      dialogFacturar: false,
      dialogNewDebs: false,
      dialogIngreso: false,
      dialogDebs: false,
      dialogDebsEdit: false,
      loading: false,
      boolFile: false,
      house: {
        debscliente: [],
      },
      ingresos: {
        id: null,
        concepto: "",
        statusCalcula: false,
        opcion: null,
        numero: "",
        fecha: moment(new Date()).format("YYYY-MM-DD"),
        montoop: 0,
        igvop: 0,
        totalop: 0,
        montopr: 0,
        igvpr: 0,
        totalpr: 0,
      },
      headersdebs: [
        {
          text: "Documento",
          align: "start",
          sortable: false,
          value: "name",
        },
        {
          text: "Fecha",
          value: "date",
        },
        {
          text: "Monto En Dolares",
          value: "monto_letra",
        },
        {
          text: "Monto en Destino",
          value: "monto_destino",
        },
        {
          text: "Tipo Moneda En Destino.",
          value: "symbol_destino",
        },
        {
          text: "Comentario del Usuario.",
          value: "comentario_usuario",
        },
        {
          text: "Comentario de Admin.",
          value: "comentario_admin",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "Ver",
          value: "accion",
        },
      ],
      headersFacturas: [
        { text: "Concepto", value: "concepto" },
        // { text: "Monto Pr", value: "monto_pr" },
        // { text: "IGV Pr", value: "igv_pr" },
        // { text: "Total Pr", value: "total_pr" },
        { text: "Monto Op", value: "monto_op" },
        { text: "IGV Op", value: "igv_op" },
        { text: "Total Op", value: "total_op" },
      ],
      conceptos: [],
      selected: [],

      isDataTableLoading: false,
      dialogFacturasFiscales: false,
      dialogProformaFiscal: false,
      headersFacturasFiscales: [
        { text: "Nombre", value: "originalname" },
        { text: "Fecha", value: "fecha" },
        { text: "Ver", value: "path" },
        { text: "Acción", value: "action" },
      ],
      lstFacturasFiscales: [],
      proformaFiscal: {
        id_consigner: "",
        nameconsigner: "",
        tipo_pago: "1",
        nro_factura: "",
        fecha: moment().format("YYYY-MM-DD"),
        archivo: "",
        id_master: "",
        id_correlativo: "",
      },
      mostrarImpuesto: true,
      dialogCambiarExpediente: false,
      selectedNuevoExpediente: null,
      listaExpedientes: [],
    };
  },
  async mounted() {
    this.id_branch = Number(this.$route.params.id_branch);
    setTimeout(() => {
      this.headersFacturas[2].text =
        this.$store.state.enterprises.impuesto.nombre_impuesto;
      this.headersFacturas[5].text =
        this.$store.state.enterprises.impuesto.nombre_impuesto;
      this.mostrarImpuesto =
        this.$store.state.enterprises.impuesto.mostrarimpuesto;
      if (!this.mostrarImpuesto) {
        this.headersFacturas.splice(2, 1);
        this.headersFacturas.splice(4, 1);
      }
    }, 2000);
  },
  methods: {
    recibirId(file) {
      this.payPath = file.inserid;
      this.payfile = file.archivo;

      this.msgfile = "Archivo procesado y vinculado correctamente.";
      this.errfile = "";
    },
    async eliminarHouseIngreso(house) {
      let vm = this;

      Swal.fire({
        icon: "question",
        title: "ADVERTENCIA",
        text: "¿Está seguro que desea eliminar todo el registro de ingresos de este expediente (house)?",
        showDenyButton: true,
        confirmButtonText: "Si",
        denyButtonText: "No",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const config = {
              method: "put",
              url:
                process.env.VUE_APP_URL_MAIN +
                "setHouseIngresosDelete/" +
                house.id_house,
              headers: {
                "auth-token": sessionStorage.getItem("auth-token"),
                "Content-Type": "application/json",
              },
            };

            const response = await axios(config);

            if (response.data && response.data.status == "401") {
              Swal.fire({
                icon: "error",
                text: response.data.mensaje,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
              });
              return;
            }

            if (response.data && response.data.statusBol) {
              Swal.fire({
                icon: "success",
                title: "REGISTRO ELIMINADO.",
              });

              await vm.getListControlGastos(vm.$route.params.id);
              vm.$emit("recalcularProfit");
            }
          } catch (error) {
            console.log(error);
            Swal.fire({
              icon: "error",
              title: "Lo sentimos",
              text: error,
            });
          }
        }
      });
    },
    _openDebs(house) {
      this.house = house;
      this.dialogDebs = true;
    },
    handleNuevoIngreso(index, house) {
      this.nuevoIngreso(house);
      this.abrirExpandIngreso(index);
    },
    formatUsd(val) {
      return `${parseFloat(val).toFixed(2)} USD`;
    },
    getQuoteNumber(house) {
      return house.id_cot || "-";
    },
    openDoc(path) {
      window.open(path, "_blank");
    },
    copiarMontosHouse(house, bloquearCopiarMontos) {
      console.log(house);
      if (bloquearCopiarMontos) {
        return;
      }
      Swal.fire({
        icon: "question",
        title: "Copiar Montos de Pricing a Operaciones",
        text: `¿Desea copiar los Montos del house ${house.code_house} Pricing a Operaciones `,
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        showDenyButton: true,
        confirmButtonText: "Copiar",
        denyButtonText: "Cancelar",
      }).then(async (res) => {
        if (res.isConfirmed) {
          await this.copiarCGingresos({ id_orders: house.id_orders });
          await this.getListControlGastos(this.$route.params.id);
        }
      });
      // console.log(id_orders);
    },
    _newDebs() {
      this.loading = false;
      this.boolFile = false;
      this.payfile = [];
      this.date = "";
      this.number = "";
      this.monto = "";
      this.tipocambio = "";
      this.id_banks = "";
      this.id_cuenta_pic = "";
      this.id_coins = "";
      this.monto_abonado = "";
      this.comentario = "";
      this.$store.state.files.payPath = null;
      this.dialogNewDebs = true;
    },
    abrirExpandIngreso(index) {
      this.$store.state.controlGastos.listControlGastos[0].master_houses[
        index
      ].isExpanded =
        !this.$store.state.controlGastos.listControlGastos[0].master_houses[
          index
        ].isExpanded;
    },
    editIngreso(item) {
      this.statusBtn = 2;
      this.ingresos = {
        id: item.id,
        concepto: item.concepto,
        statusCalcula: this.igv_pr != 0 || this.igv_op != 0 ? true : false,
        numero: "",
        fecha: moment(new Date()).format("YYYY-MM-DD"),
        montoop: item.monto_op,
        igvop: item.igv_op,
        totalop: item.total_op,
        montopr: item.monto_pr,
        igvpr: item.igv_pr,
        totalpr: item.total_pr,
        opcion: item.tipo_pago,
        numero: item.numero,
        fecha: item.fecha,
      };
      this.dialogIngreso = true;
    },
    abrirModalFacturar(house) {
      this.stepProforma = 1;
      this.house = house;
      this.selected = [];
      this.conceptos = house.ingresos;
      this.obtenerDatos();
      this.id_coins = "";
      this.dialogFacturar = true;
    },
    async nuevoControlGasto(house) {
      house.id_master = this.$route.params.id;
      let vm = this;
      await vm.setControl(house);
      await vm.getListControlGastos(this.$route.params.id);
      vm.$store.state.spiner = false;
    },
    obtenerMoneda() {
      let monedas = [...this.$store.state.itemsCoinsList];
      this.sufmoneda = monedas.filter((v) => v.id == this.id_coins)[0].symbol;
      this.sufmoneda == "USD"
        ? (this.tipocambio = 1)
        : (this.tipocambio = this.tipocambio);
    },
    calcularMontoDolar() {
      this.monto = parseFloat(
        (this.monto_abonado ? this.monto_abonado : 0) / this.tipocambio,
      ).toFixed(2);
    },
    async _setDebsClient() {
      this.calcularMontoDolar();
      this.loading = true;
      if (this.$refs.frmNuevoAbono.validate()) {
        var vm = this;
        vm.$swal({
          icon: "info",
          title: "Cargando pago...",
          text: "Por favor espere",
        });
        var data = {
          id_house: this.house.id_house,
          date: vm.date,
          number: vm.number,
          id_banks: vm.id_banks,
          monto: vm.monto,
          comentario_usuario: vm.comentario,
          id_path: vm.$store.state.files.payPath,
          id_cuenta_pic: vm.id_cuenta_pic,
          tipocambio: vm.tipocambio,
          id_moneda_destino: vm.id_coins,
          monto_destino: vm.monto_abonado,
          nro_operacion: vm.number,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setDebsClient",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.dialogNewDebs = false;
            vm.dialogDebs = false;
            vm.listControlGasto(vm.$route.params.code_master);

            vm.cleandData();

            // vm.dialogDebs = true;
            vm.$swal({
              icon: "success",
              title: "Pago Cargado",
              text: "El pago ha sido cargado correctamente",
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      }
      this.loading = false;
    },
    async listControlGasto() {
      this.$store.state.spiner = true;
      await this.getListControlGastos(this.$route.params.id);
      this.$store.state.spiner = false;
    },
    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";
      if (this.payfile) {
        this.loadingFile = true;
        await this._uploadFile(this.payfile);
        this.loadingFile = false;
        this.$store.state.files.payPath
          ? (this.msgfile = "Archivo cargado")
          : (this.errfile = "Comuniquese con el admistrador");
      } else {
        this.errfile = "Dato Requerido";
      }
    },
    nuevoIngreso(house) {
      this.statusBtn = 1;
      this.ingresos = {
        id: null,
        concepto: "",
        statusCalcula: false,
        opcion: null,
        numero: "",
        fecha: moment(new Date()).format("YYYY-MM-DD"),
        montoop: 0,
        igvop: 0,
        totalop: 0,
        montopr: 0,
        igvpr: 0,
        totalpr: 0,
      };
      this.house = house;

      this.dialogIngreso = true;
    },
    calcular() {
      if (this.ingresos.statusCalcula) {
        this.ingresos.igvop = parseFloat(
          (this.ingresos.montoop *
            this.$store.state.enterprises.impuesto.impuesto) /
            100,
        ).toFixed(2);
        this.ingresos.igvpr = parseFloat(
          (this.ingresos.montopr *
            this.$store.state.enterprises.impuesto.impuesto) /
            100,
        ).toFixed(2);
        this.ingresos.totalop =
          parseFloat(this.ingresos.montoop) + parseFloat(this.ingresos.igvop);
        this.ingresos.totalpr =
          parseFloat(this.ingresos.montopr) + parseFloat(this.ingresos.igvpr);
      } else {
        this.ingresos.igvop = 0.0;
        this.ingresos.igvpr = 0.0;
        this.ingresos.totalop =
          parseFloat(this.ingresos.montoop) + parseFloat(this.ingresos.igvop);
        this.ingresos.totalpr =
          parseFloat(this.ingresos.montopr) + parseFloat(this.ingresos.igvpr);
      }
    },
    editarDebs(item) {
      this.id = item.id;
      this.date = item.date;
      this.number = item.number;
      this.monto = item.monto;
      this.tipocambio = item.tipocambio;
      this.id_banks = item.id_banks;
      this.id_cuenta_pic = item.id_cuenta_pic;
      this.id_coins = item.id_moneda_destino;
      this.monto_abonado = item.monto_destino;
      this.comentario = item.comentario_usuario;
      this.dialogDebsEdit = true;
    },
    cleandData() {
      this.date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10);
      this.number = "";
      this.monto = 0;
      this.comentario = "";
      this.payfile = [];
      this.payPath = "";
      this.boolFile = false;
      this.id_cuenta_pic = "";
      this.tipocambio = 1;
      this.id_coins = "";
      this.monto_abonado = "";
      this.number = "";
    },
    async _delDebsClient(id) {
      var vm = this;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delDebsClient/" + id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.listControlGasto();
          vm.dialogDebs = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async editIngresos() {
      let data = {
        code_master: this.$route.params.code_master,
        concepto: this.ingresos.concepto,
        monto_pr: this.ingresos.montopr,
        monto_op: this.ingresos.montoop,
        igv_pr: this.ingresos.igvpr,
        igv_op: this.ingresos.igvop,
        total_pr: this.ingresos.totalpr,
        total_op: this.ingresos.totalop,
        tipo_pago: this.ingresos.opcion,
        numero: this.ingresos.numero,
        fecha: this.ingresos.fecha,
        id: this.ingresos.id,
      };
      await this.actualizarIngresos(data);
      await this.getListControlGastos(this.$route.params.id);
      this.statusBtn = 1;
      this.dialogIngreso = false;
      this.$forceUpdate();
      this.$emit("recalcularProfit");
    },
    async delIngreso(id) {
      let data = {
        code_master: this.$route.params.code_master,
        id: id,
      };
      await this.eliminarIngreso(data);
      await this.getListControlGastos(this.$route.params.id);
      this.$emit("recalcularProfit");
    },
    async setIngresos() {
      // this.calcularE();
      if (this.$refs.frmIngreso.validate()) {
        var data = {
          code_master: this.$route.params.code_master,
          id_orders: this.house.id_orders,
          concepto: this.ingresos.concepto,
          monto_op: this.ingresos.montoop,
          igv_op: this.ingresos.igvop,
          total_op: this.ingresos.totalop,
          monto_pr: this.ingresos.montopr,
          igv_pr: this.ingresos.igvpr,
          total_pr: this.ingresos.totalpr,
          id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
          tipo_pago: this.ingresos.opcion,
          numero: this.ingresos.numero,
          fecha: this.ingresos.fecha,
          id_master: this.$route.params.id,
        };
        await this.guardarIngresos(data);
        this.dialogIngreso = false;
        this.$emit("recalcularProfit");
      }
    },
    async actualizar() {
      if (this.$refs.frmNuevoAbono.validate()) {
        var vm = this;
        vm.$swal({
          icon: "info",
          title: "Cargando pago...",
          text: "Por favor espere",
        });
        var data = {
          id_house: this.house.id_house,
          date: vm.date,
          number: vm.number,
          id_banks: vm.id_banks,
          monto: vm.monto,
          comentario_usuario: vm.comentario,
          id_path: vm.$store.state.files.payPath,
          id_cuenta_pic: vm.id_cuenta_pic,
          tipocambio: vm.tipocambio,
          id_moneda_destino: vm.id_coins,
          monto_destino: vm.monto_abonado,
          nro_operacion: vm.number,
          id: vm.id,
        };
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "actualizar_debs_client",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.cleandData();

            // vm.dialogDebs = true;
            vm.$swal({
              icon: "success",
              title: "Pago Cargado",
              text: "El pago ha sido cargado correctamente",
            }).then((result) => {
              if (result.isConfirmed) {
                vm.dialogDebsEdit = false;
                vm.dialogDebs = false;
                vm.listControlGasto();
              }
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    async obtenerDatos() {
      let vm = this;
      vm.obtenerDatosHouse = true;
      vm.datosFactura = [];
      var config = {
        method: "get",
        url: `${process.env.VUE_APP_URL_MAIN}data_factura/${vm.house.id_house}/${vm.id_branch}`,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config).then(function (response) {
        if (response.data.statusBol == true) {
          vm.datosFactura = response.data.data[0];
        }
      });
      vm.obtenerDatosHouse = false;
    },
    async generarDocumento() {
      this.errorCoin = "";
      if (!this.id_coins) {
        this.errorCoin = "Seleccione una moneda";
        this.$refs.coinSelect.focus();
        return;
      }
      let vm = this;
      let monedas = [...this.$store.state.itemsCoinsList];
      const monedaSeleccionada = monedas.find((v) => v.id === vm.id_coins);
      if (monedaSeleccionada) {
        vm.datosFactura.coins = monedaSeleccionada.symbol;
      }
      vm.datosFactura.details = vm.selected.map((element) => {
        return {
          concepto: element.concepto,
          id_orders: element.id_orders,
          igv: element.igv_op,
          monto: element.monto_op,
          total: element.total_op,
        };
      });
      vm.id_house = vm.selected[0].id_house;
      let total = 0;
      let total_igv = 0;
      let total_monto = 0;

      vm.selected.forEach((element) => {
        total = parseFloat(total) + parseFloat(element.total_op);
        total_igv = parseFloat(total_igv) + parseFloat(element.igv_op);
        total_monto = parseFloat(total_monto) + parseFloat(element.monto_op);
      });

      vm.datosFactura.total = parseFloat(total).toFixed(2);
      vm.datosFactura.url_logo = JSON.parse(
        sessionStorage.getItem("dataUser"),
      )[0].path;
      vm.datosFactura.total_igv = parseFloat(total_igv).toFixed(2);
      vm.datosFactura.total_monto = parseFloat(total_monto).toFixed(2);
      vm.datosFactura.nombreProforma = vm.nombreProforma;
      vm.obtenerDatosHouse = true;
      let data = vm.datosFactura;
      // console.log(vm.datosFactura);
      // return;
      var config = {
        method: "post",
        url: `${process.env.VUE_APP_URL_MAIN}generar_factura`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      let res = await axios(config).then(function (response) {
        return response;
      });

      if (res.data.statusBol == true) {
        vm.registrarFactura(res.data);
        vm.dialogFacturar = false;
        vm.nombreProforma = "PROFORMA";
      }
      vm.obtenerDatosHouse = false;
    },
    async registrarFactura(data) {
      let vm = this;
      let dataFactura = {
        id_house: vm.id_house,
        id_coins: vm.id_coins,
        nro_factura: data.nro_factura,
        url_documento: process.env.VUE_APP_URL_MAIN + data.path,
        total_monto: vm.datosFactura.total_monto,
        total_igv: vm.datosFactura.total_igv,
        total: vm.datosFactura.total,
        details: vm.selected,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "registrar_factura",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: dataFactura,
      };
      await axios(config);
      window.open(process.env.VUE_APP_URL_MAIN + data.path, "_blank");
      vm.listControlGasto();
    },
    isBotonEmitirProformaDisabled(house = {}) {
      let disabled = false;

      if (
        house.total_total_pr_ingresos == 0 &&
        house.total_total_op_ingresos == 0
      ) {
        disabled = !disabled;
      } else if (house.ingresos.every((v) => v.facturado)) {
        disabled = !disabled;
      }

      return disabled;
    },
    getDeudaActual(data = {}) {
      let { ingresos = [], total_total_op_ingresos = 0 } = data;

      let abono = ingresos.reduce((suma, v) => {
        return v.facturado ? suma + (parseFloat(v.total_op) || 0) : suma;
      }, 0);

      let deuda =
        parseFloat(total_total_op_ingresos) - parseFloat(abono.toFixed(2));

      return deuda != 0 ? deuda.toFixed(2) : 0;
    },
    async abrirModalFacturasFiscales(house = {}) {
      var vm = this;

      vm.house = house;
      vm.dialogFacturasFiscales = true;

      vm.isDataTableLoading = true;
      await vm.getFacturasFiscales(house);
      vm.isDataTableLoading = false;
    },
    cargarProformaFiscal() {
      var vm = this;

      vm.boolFile = false;
      vm.msgfile = "";
      vm.errfile = "";
      vm.proformaFiscal = {
        ...vm.proformaFiscal,
        tipo_pago: "1",
        nro_factura: "",
        fecha: moment().format("YYYY-MM-DD"),
        archivo: vm.$store.state.files.payPath,
        status: 1,
        id_house: vm.house.id_house,
      };

      vm.dialogProformaFiscal = true;
    },
    async uploadFileProformaFiscal() {
      var vm = this;

      vm.boolFile = false;
      vm.msgfile = "";
      vm.errfile = "";
      if (vm.proformaFiscal.archivo) {
        vm.loadingFile = true;
        await vm._uploadFile(vm.proformaFiscal.archivo);
        vm.loadingFile = false;

        if (vm.$store.state.files.payPath) {
          vm.boolFile = true;
          vm.msgfile = "Archivo cargado";
          vm.proformaFiscal = {
            ...vm.proformaFiscal,
            id_path: vm.$store.state.files.payPath,
          };
        } else {
          vm.errfile = "Comuniquese con el administrador";
        }
      } else {
        vm.errfile = "Dato Requerido";
      }
    },
    async registrarProformaFiscal() {
      var vm = this;

      vm.$swal({
        icon: "info",
        title: "Guardando...",
        text: "Por favor, espere",
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setProformaFiscal",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: vm.proformaFiscal,
      };

      await axios(config).then(async function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.estadoflag) {
          vm.$swal({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido cargado correctamente",
          });

          await vm.getFacturasFiscales(vm.house);
        } else {
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && response.data.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      });

      vm.dialogProformaFiscal = !vm.dialogProformaFiscal;
    },
    async getFacturasFiscales(house = {}) {
      var vm = this;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getFacturasFiscales?id_house=${house.id_house}`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (!!response.data.data[0].estadoflag) {
            vm.lstFacturasFiscales = response.data.data;
          } else {
            vm.lstFacturasFiscales = [];
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async eliminarProformaFiscal(id = "") {
      var vm = this;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delProformaFiscal/" + id,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            vm.$swal({
              icon: "success",
              title: "Información",
              text: response.data.mensaje,
            });

            vm.isDataTableLoading = true;
            await vm.getFacturasFiscales(vm.house);
            vm.isDataTableLoading = false;
          } else {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    activarFactura(item) {
      item.verFactura = !item.verFactura;
      this.$forceUpdate();
    },
    async verProformas(item) {
      let vm = this;
      var config = {
        method: "get",
        url: `${process.env.VUE_APP_URL_MAIN}ver_factura_house`,
        params: {
          id: item.id_house,
        },
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config).then(function (response) {
        if (response.data.estadoflag) {
          let res = response.data.data;
          vm.lstFacturasEmitidas = response.data.data;
          vm.dialogFacturaEmitidas = true;
        }
      });
    },
    abrirPdf(url) {
      window.open(url, "_blank");
    },
    async abrirModalCambiarExpediente(house = {}) {
      this.house = house;
      // Cargar lista de masters y poblar el combo con sus códigos
      this.flagCambiarExpediente = true;
      await this._getMasterList();
      const masters = (this.$store.state.itemsMasterList || []).slice();
      this.listaExpedientes = masters.map((v) => ({
        text: v.code_master,
        value: v.id,
      }));
      this.selectedNuevoExpediente = Number(this.$route.params.id) || null;
      this.dialogCambiarExpediente = true;
      this.flagCambiarExpediente = false;
    },
    async aplicarCambioExpediente() {
      if (!this.house || !this.selectedNuevoExpediente) return;
      if (
        Number(this.selectedNuevoExpediente) === Number(this.$route.params.id)
      ) {
        this.dialogCambiarExpediente = false;
        return;
      }
      const targetLabel =
        (
          this.listaExpedientes.find(
            (x) => x.value === this.selectedNuevoExpediente,
          ) || {}
        ).text || this.selectedNuevoExpediente;
      const res = await Swal.fire({
        icon: "question",
        title: "Confirmar cambio",
        text: `¿Desea mover el house ${this.house.code_house} (con todos sus registros) al master ${targetLabel}?`,
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });
      if (!res.isConfirmed) return;

      try {
        const payload = {
          id_orders: this.house.id_orders,
          id_house: this.house.id_house,
          id_master_origen: Number(this.$route.params.id),
          id_master_destino: Number(this.selectedNuevoExpediente),
        };
        const config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "reasignar_house",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: payload,
        };
        const response = await axios(config);
        if (response && response.data && response.data.estadoflag) {
          await Swal.fire({ icon: "success", text: "Expediente actualizado" });
          this.dialogCambiarExpediente = false;
          this.flagCambiarExpediente = true;
          await this.getListControlGastos(this.$route.params.id);
          this.flagCambiarExpediente = false;
        } else {
          await Swal.fire({
            icon: "warning",
            text:
              (response && response.data && response.data.mensaje) ||
              "No se pudo reasignar el expediente. Se requiere soporte de backend.",
          });
        }
      } catch (error) {
        console.error(error);
        await Swal.fire({
          icon: "info",
          text: "Endpoint para reasignar house a otro master no disponible. Front listo; requerirá habilitar API (PUT reasignar_house).",
        });
      }
    },
    async eliminarFactura(item) {
      this.dialogFacturaEmitidas = false;
      let val = false;
      let msg = "";

      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        focusConfirm: false,
        didOpen: () => {
          // Aquí forzamos el foco manualmente
          document.getElementById("swal-input1").focus();
        },
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value;
          const input2 = document.getElementById("swal-input2").value;

          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }

          return {
            usuario: input1,
            clave: input2,
          };
        },
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const res = await this.validarUsuarioAdmin(result.value);
          val = res.estadoflag === true;
          msg = res.mensaje;
        }
      });

      if (!val) {
        if (msg) {
          await Swal.fire({ icon: "error", text: msg });
        }
        return;
      }

      // Si pasa la validación, anula la factura
      const datos = { id: item };
      const config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "anular_factura",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: datos,
      };

      try {
        const response = await axios(config);
        console.log(response);
        await Swal.fire(
          "¡Anulada!",
          "Factura anulada correctamente.",
          "success",
        );
        this.$emit("recargarDatos");
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          "Ocurrió un problema al anular la factura.",
          "error",
        );
      }
    },
    ...mapActions([
      "setControl",
      "guardarIngresos",
      "_uploadFile",
      "getListControlGastos",
      "delDebsClient",
      "data_factura",
      "generar_factura",
      "registrar_factura",
      "actualizarIngresos",
      "eliminarIngreso",
      "validarUsuarioAdmin",
      "copiarCGingresos",
      "getCargarHouse",
      "_getMasterList",
    ]),
    bloquearCopiarMontos(ingresos) {
      return ingresos.some((v) => v.facturado);
    },
  },
  computed: {},
  components: {
    ArrastraYSolarComponent,
  },
};
</script>

<style scoped>
.blinking {
  padding: 10px 20px;
  /* color: white; */
  background-color: #f3e5f5;
  animation: blinkOnOff 1s infinite;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  display: inline-block;
}

@keyframes blinkOnOff {
  0%,
  100% {
    background-color: #f3e5f5; /* prendido */
  }
  50% {
    background-color: white; /* apagado, pero aún visible */
  }
}
</style>
