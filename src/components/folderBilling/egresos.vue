<template>
  <div class="">
    <h3>
      Costos -------------------------------- | Pricing:
      {{ parseFloat(egreso_pr).toFixed(2) }} USD /------ Operaciones:
      {{ parseFloat(egreso_op).toFixed(2) }} USD
      <v-spacer></v-spacer>
      <v-btn @click="nuevoEngreso()" color="blue" dark small>
        Nuevo Control Gastos Egresos
      </v-btn>
    </h3>
    <v-expansion-panels accordion>
      <v-expansion-panel
        v-for="(egreso, index) in ($store.state.controlGastos
          .listControlGastos[0] &&
          $store.state.controlGastos.listControlGastos[0].master_egresos) ||
        []"
        :key="index"
        :value="egreso.isExpanded"
      >
        <v-expansion-panel-header @click.stop="abrirExpandEgreso(index)">
          <template #actions>
            <v-icon @click="abrirExpandEgreso(index)"
              >mdi-unfold-more-horizontal</v-icon
            >
          </template>
          <v-simple-table dense>
            <thead>
              <tr>
                <th width="28%">Proveedor</th>
                <th width="12%" style="background: #d6f4ff">Total Pricing</th>
                <th width="12%" style="background: #ffd6d6">
                  Total Operaciones
                </th>
                <th width="12%" style="background: #fff9c4">Deuda Actual</th>
                <th v-if="editable" width="12%"></th>
                <th v-if="editable" width="12%" class="text-left">
                  Facturas o Proformance
                </th>
                <th v-if="editable" width="12%" class="text-left">
                  Generar PDF de pago
                </th>
                <th v-if="editable" width="12%" class="text-left">
                  Solicitar a Administración
                </th>
                <th v-if="editable" width="12%" class="text-left">
                  Más Acciones
                </th>
                <!-- <th width="10%">Acciones</th> -->
                <!-- <th width="10%">Acciones</th> -->
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{ egreso.nombre_proveedor }}
                  <v-btn
                    icon
                    color="success"
                    v-if="egreso.code_tipo_proveedor === '01'"
                    @click="abrirModalPorcentajeProveedor(egreso)"
                  >
                    <v-icon>mdi-percent-box-outline</v-icon>
                  </v-btn>
                </td>
                <td>{{ egreso.total_total_pr }}</td>
                <td>{{ egreso.total_total_op }}</td>
                <td>{{ getDeudaActual(egreso) }}</td>
                <td v-if="editable">
                  <v-tooltip
                    bottom
                    color="error"
                    v-if="bloquearCopiarMontos(egreso.detalle)"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        color="success"
                        x-small
                        @click="
                          copiarMontos(
                            null,
                            bloquearCopiarMontos(egreso.detalle),
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
                      abriModalCopiar(
                        egreso,
                        bloquearCopiarMontos(egreso.detalle),
                      )
                    "
                  >
                    Copiar Montos Pr->Op
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    icon
                    small
                    :loading="loading"
                    :color="egreso.docs > 0 ? 'blue' : 'grey'"
                    @click.native="openInvoice(egreso)"
                    @click.stop="abrirExpandEgreso(index)"
                  >
                    <v-icon>mdi-file-compare</v-icon>
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    small
                    color="white"
                    icon
                    @click.stop="validarSolicitudPago(egreso)"
                    @click="abrirExpandEgreso(index)"
                  >
                    <v-icon color="blue">mdi-send</v-icon>
                  </v-btn>
                </td>

                <td v-if="editable">
                  <v-btn
                    small
                    :color="egreso.solicitudes > 0 ? 'blue' : 'grey'"
                    icon
                    @click="openPayments(egreso)"
                    @click.stop="abrirExpandEgreso(index)"
                    :disabled="!(egreso.solicitudes && egreso.solicitudes > 0)"
                  >
                    <v-icon :color="'blue'">mdi-email-send</v-icon>
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    color="success"
                    small
                    @click="abrirModalCambiarExp(egreso)"
                    >CAMBIAR EXPEDIENTE</v-btn
                  >
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
                <th class="text-left">Proveedor</th>
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
                <th style="background: #d8ffde" class="text-left">
                  Monto Op Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarImpuesto"
                >
                  {{ $store.state.enterprises.impuesto.nombre_impuesto }} Op
                  Cuenta Banco
                </th>
                <th style="background: #d8ffde" class="text-left">
                  Total Op Cuenta Banco
                </th>
                <th style="background: #d8ffde" class="text-left">
                  Tipo Cambio Cuenta Banco
                </th>
                <th class="text-center">Enviado a Admin.</th>
                <th width="10%" class="text-center">Fecha Pago.</th>
                <th class="text-center">Status</th>
                <th v-if="editable" class="text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(grupo, idx) in groupDetallePorCliente(egreso.detalle)"
              >
                <tr
                  class="blue lighten-5"
                  :key="`header-${
                    grupo.id_house || grupo.code_house || grupo.consigner || idx
                  }`"
                  style="cursor: pointer"
                  @click="toggleCliente(egreso, grupo)"
                >
                  <td
                    :colspan="mostrarImpuesto ? 16 : 13"
                    class="font-weight-bold"
                  >
                    Cliente:
                    {{ grupo.consigner }}
                    <span v-if="grupo.code_house">
                      - {{ grupo.code_house }}
                    </span>
                  </td>
                </tr>
                <tr
                  v-for="item in grupo.items"
                  v-if="isClienteAbierto(egreso, grupo)"
                  :key="`item-${
                    grupo.id_house ||
                    grupo.code_house ||
                    grupo.consigner ||
                    item.id
                  }`"
                >
                  <td>{{ item.nombre_proveedor }}</td>
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
                  <td style="background: #d8ffde">
                    {{ parseFloat(item.montoopcuentabanco).toFixed(2) }}
                    {{ item.acronym }}
                  </td>
                  <td style="background: #d8ffde" v-if="mostrarImpuesto">
                    {{ parseFloat(item.igvopcuentabanco).toFixed(2) }}
                    {{ item.acronym }}
                  </td>
                  <td style="background: #d8ffde">
                    {{ parseFloat(item.totalopcuentabanco).toFixed(2) }}
                    {{ item.acronym }}
                  </td>
                  <td style="background: #d8ffde">
                    {{ item.tipocambio == 1 ? "No Aplica" : item.tipocambio }}
                  </td>
                  <td class="text-center">
                    <v-chip
                      v-if="item.statusadmin == 1 && item.pagado == 1"
                      small
                      class="mx-auto"
                      color="green"
                      outlined
                      text-color="green"
                    >
                      SI
                    </v-chip>
                    <v-chip
                      v-if="item.statusadmin == 1 && item.pagado == 0"
                      small
                      class="mx-auto"
                      color="orange"
                      outlined
                      text-color="orange"
                    >
                      SI
                    </v-chip>
                  </td>
                  <td class="text-center">{{ item.fecha_pago_letra }}</td>
                  <td>
                    <v-chip
                      v-if="item.pagado == 1"
                      small
                      class="ma-2"
                      color="green"
                      text-color="white"
                    >
                      Pagado
                    </v-chip>
                  </td>
                  <td v-if="editable">
                    <v-icon
                      class="btn__add mr-2"
                      dense
                      color="orange"
                      v-if="item.pagado == 0"
                      @click.native="_editEgreso(item)"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                      class="btn__add"
                      dense
                      color="red"
                      v-if="!item.statusadmin && item.pagado == 0"
                      @click.native="_delEngreso(item)"
                      >mdi-delete</v-icon
                    >
                  </td>
                </tr>
              </template>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- --------------------- -->
    <v-dialog id="mydiv" v-model="dialog" width="70%" persistent>
      <v-card>
        <v-card-title id="mydivheader" class="text-h5 grey lighten-2">
          REGISTRO DE NUEVO COSTO
          <v-spacer></v-spacer>
          <v-btn color="default" text @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-5">
          <v-container style="min-height: 435px">
            <v-form ref="frmEgreso">
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="$store.state.itemsProveedorList"
                    item-text="namelong"
                    item-value="id"
                    v-model="egresos.id_proveedor"
                    label="Proveedor"
                    :rules="[(v) => !!v || 'Dato requerido']"
                  ></v-autocomplete>
                </v-col>
              </v-row>

              <v-row v-show="showSeccion2NuevoEgreso">
                <v-col cols="12" xl="6" lg="6">
                  <v-text-field
                    dense
                    v-model="egresos.concepto"
                    label="Concepto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" xl="3" lg="3">
                  <v-autocomplete
                    @change="activarSeccion3"
                    :items="$store.state.controlGastos.listCorrelativo"
                    v-model="id_correlativo"
                    item-text="description"
                    item-value="id"
                    label="Correlativo"
                    dense
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" xl="3" lg="3">
                  <v-switch
                    v-if="mostrarImpuesto"
                    dense
                    @change="calcularE()"
                    v-model="egresos.statusCalcula"
                    :label="`Calcula ${$store.state.enterprises.impuesto.nombre_impuesto}`"
                  ></v-switch>
                  <p v-else>
                    NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de
                    Configuración
                  </p>
                </v-col>
              </v-row>

              <v-row v-show="showSeccion3NuevoEgreso">
                <v-col cols="12" md="3">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="id_coins"
                    item-text="acronym"
                    item-value="id"
                    label="Moneda de Banco Salida"
                    @change="obtenerMoneda()"
                    dense
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>

                <v-col cols="12" md="3" v-if="opFlag">
                  <v-text-field
                    dense
                    v-if="this.sufmoneda != 'USD'"
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    @input="calcularE()"
                    step="0.01"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row v-show="showSeccion4NuevoEgreso">
                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    dense
                    @input="calcularE()"
                    v-model="egresos.montoopcuentabanco"
                    type="number"
                    label="Monto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    :prefix="sufmoneda"
                    :disabled="!id_coins"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag && mostrarImpuesto">
                  <v-text-field
                    dense
                    v-model="egresos.igvopcuentabanco"
                    type="number"
                    :label="`${$store.state.enterprises.impuesto.nombre_impuesto}`"
                    :prefix="sufmoneda"
                    :disabled="!id_coins"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    dense
                    v-model="egresos.totalopcuentabanco"
                    type="number"
                    label="Total Operaciones"
                    :prefix="sufmoneda"
                    :disabled="!id_coins"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag">
                  <v-text-field
                    dense
                    @input="calcularE()"
                    v-model="egresos.montopr"
                    type="number"
                    label="Monto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag && mostrarImpuesto">
                  <v-text-field
                    dense
                    v-model="egresos.igvpr"
                    type="number"
                    :label="`${$store.state.enterprises.impuesto.nombre_impuesto}`"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="prFlag">
                  <v-text-field
                    dense
                    v-model="egresos.totalpr"
                    type="number"
                    label="Total"
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    dense
                    v-model="egresos.montoopview"
                    type="number"
                    label="Monto Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag && mostrarImpuesto">
                  <v-text-field
                    dense
                    v-model="egresos.igvopview"
                    type="number"
                    :label="`${$store.state.enterprises.impuesto.nombre_impuesto} Operaciones (Solo lectura)`"
                    suffix="USD"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4" v-if="opFlag">
                  <v-text-field
                    dense
                    v-model="egresos.totalopview"
                    type="number"
                    label="Total Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions class="pb-4">
          <v-btn
            v-if="this.statusBtn == 1"
            @click.native="_setData()"
            block
            color="success"
            elevation="0"
            :disabled="isBotonGuardarEgresoDisabled"
            >Agregar servicio</v-btn
          >

          <v-btn
            v-if="this.statusBtn == 2"
            @click.native="_editEgresos()"
            block
            color="success"
            elevation="0"
            :disabled="isBotonGuardarEgresoDisabled"
          >
            Guardar servicio
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- ---------------------------------------------------- -->
    <v-dialog max-width="80%" v-model="dialogListInvoice">
      <v-card>
        <v-card-title>
          Facturas y Performance de {{ nameproveedor }}
          <v-spacer></v-spacer>
          <v-btn outlined @click="cargarFactura" color="primary"
            >Cargar Nueva</v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersInvoice"
            :items="itemsListInvoice"
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
                item.type_pago == 1
                  ? "FACTURA"
                  : "" || item.type_pago == 2
                  ? "PERFORMANCE"
                  : "OTRO"
              }}
              -
              {{ item.number }}
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
                  @click.native="_delInvoice(item.id)"
                >
                  mdi-delete
                </v-icon></v-btn
              >
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- --------------------------- -->
    <v-dialog width="80%" v-model="dialogInvoice">
      <v-card>
        <v-card-title>
          <h3>Subir factura o proforma para {{ nameproveedor }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row dense>
              <v-col cols="12" md="12">
                <v-radio-group v-model="radio" row>
                  <v-radio label="Factura" value="1"></v-radio>
                  <v-radio label="Performance" value="2"></v-radio>
                  <v-radio label="Otro" value="3"></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  label="Fecha de Operación"
                  prepend-icon="mdi-calendar"
                  type="date"
                  v-model="date"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  v-model="nro_invoice"
                  :label="`Nro de ${
                    radio == 1
                      ? 'Factura'
                      : '' || radio == 2
                      ? 'Performance'
                      : 'Otro'
                  }`"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  v-model="monto_factura"
                  label="Monto de la Factura"
                  :rules="[(v) => v > 0 || 'Debe ser un monto numérico']"
                  @change="validarMontoFactura"
                ></v-text-field>
              </v-col>
              <v-col md="12" cols="12">
                <p>
                  <v-icon
                    color="red"
                    v-if="$store.state.files.payPath"
                    size="xl"
                    >mdi-file</v-icon
                  >
                  <span v-if="$store.state.files.payPath" color="red"
                    >Archivo Cargado</span
                  >
                </p>
                <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="_setInvoice()"
            :disabled="!$store.state.files.payPath || !monto_factura"
          >
            GUARDAR
            {{
              radio == 1 ? "Factura" : "" || radio == 2 ? "Performance" : "Otro"
            }}
          </v-btn>

          <v-btn outlined color="red" @click="dialogInvoice = !dialogInvoice">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog width="80%" v-model="dialogSolicitud">
      <v-card class="px-5 py-5">
        <h2>{{ egreso.nombre_proveedor }}</h2>
        <v-stepper v-model="e1">
          <v-stepper-header>
            <v-stepper-step :complete="e1 > 1" step="1">
              Códigos
            </v-stepper-step>

            <v-divider></v-divider>

            <v-stepper-step :complete="e1 > 2" step="2">
              Cuentas Bancarias
            </v-stepper-step>
            <v-divider></v-divider>

            <v-stepper-step :complete="e1 > 3" step="3">
              Observaciones
            </v-stepper-step>
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <v-card class="mb-12" elevation="0" height="200px">
                <v-card-text>
                  <v-row dense>
                    <v-col md="6" cols="12">
                      <v-checkbox
                        v-model="checkPago"
                        :label="`Aplica código de pago ${nombreCodigoPago}`"
                      ></v-checkbox>
                      <v-text-field
                        dense
                        v-if="checkPago"
                        v-model="codigo_pago"
                        label="CODIGO DE PAGO"
                        >CODIGO DE PAGO</v-text-field
                      >
                    </v-col>
                    <v-col md="6" cols="12">
                      <v-checkbox
                        v-model="checkMaster"
                        label="Aplica Número de Expediente"
                      ></v-checkbox>
                      <v-text-field
                        dense
                        v-if="checkMaster"
                        v-model="codigo_master"
                        label="CODIGO DE MASTER BL"
                        readonly
                        >CODIGO DE MASTER BL</v-text-field
                      >
                    </v-col>
                  </v-row>
                </v-card-text></v-card
              >

              <v-btn color="primary" @click="e1 = 2"> Continuar </v-btn>
              <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
            </v-stepper-content>

            <v-stepper-content step="2">
              <v-card class="mb-12" elevation="0" min-height="200px">
                <v-card-text>
                  <div class="text-right">
                    <v-btn
                      small
                      color="primary"
                      @click="abrirModalCuentaBancaria()"
                    >
                      Nueva Cuenta Bancaria
                    </v-btn>
                  </div>
                  <b>Cuentas</b>
                  <v-data-table
                    v-if="!checkPago"
                    v-model="selectedAccount"
                    :headers="headersAccount"
                    :items="$store.state.itemsDataAccountsNumberList"
                    hide-default-footer
                    item-key="id"
                    show-select
                    class="elevation-0"
                    dense
                  >
                  </v-data-table>
                  <h2 v-else class="mt-5">Ya seleccionó el codigo de pago</h2>
                </v-card-text></v-card
              >

              <v-btn color="primary" @click="validarStep2Solicitud">
                Continuar
              </v-btn>
              <v-btn text @click="e1 = 1"> Volver</v-btn>
              <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
            </v-stepper-content>

            <v-stepper-content step="3">
              <v-card class="mb-12" elevation="0" height="200px">
                <v-card-text>
                  <v-textarea
                    v-model="comentarios"
                    rows="3"
                    label="Observación Adicionales"
                  >
                  </v-textarea>
                  <v-btn
                    block
                    @click.native="_generateSolicitud()"
                    class="mt-2"
                    color="primary"
                    >ENVIAR A ADMINISTRACIÓN UNA SOLICITUD DE PAGO</v-btn
                  >
                </v-card-text>
              </v-card>

              <v-btn text @click="e1 = 2"> Volver </v-btn>
              <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-card>
    </v-dialog>
    <!-- ------------------------------------------------- -->
    <v-dialog width="80%" v-model="dialogSolicitudDivision">
      <v-card>
        <v-card-title> Solicitar pago por concepto</v-card-title>

        <v-card-text>
          <v-row dense>
            <v-col md="6" cols="12">
              <v-text-field dense v-model="codigo_pago" label="CODIGO DE PAGO"
                >CODIGO DE PAGO</v-text-field
              >
            </v-col>
            <v-col md="6" cols="12">
              <v-text-field
                dense
                v-model="codigo_master"
                label="CODIGO DE MASTER BL"
                readonly
                >CODIGO DE MASTER BL</v-text-field
              >
            </v-col>
          </v-row>

          <v-textarea
            v-model="comentarios"
            rows="3"
            label="Observación Adicionales"
          >
          </v-textarea>

          <h2>Seleccione los conceptos</h2>

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="conceptos"
            hide-default-footer
            item-key="concepto"
            :footer-props="{
              'items-per-page-options': [10, 20, 30, 40, 50],
            }"
            :items-per-page="30"
            dense
            show-select
            class="elevation-0"
          >
            <template
              v-slot:[`item.data-table-select`]="{ item, isSelected, select }"
            >
              <v-simple-checkbox
                :value="isSelected"
                :readonly="item.pagado == 1"
                v-if="!item.pagado == 1"
                @input="select($event)"
              ></v-simple-checkbox>
            </template>
            <template v-slot:[`item.pagado`]="{ item }">
              <v-chip
                v-if="item.pagado == 1"
                class="ma-2"
                color="green"
                small
                text-color="white"
              >
                {{ item.pagado == 1 ? "Pagado" : "" }}
              </v-chip>

              <v-icon
                class="btn__add mr-2"
                dense
                large
                color="grey"
                v-if="item.pagado == 1"
                @click.native="openPaymentFile(item.path)"
                >mdi-eye</v-icon
              >
            </template>
            <template v-slot:[`item.monto`]="{ item }">
              {{ parseFloat(item.monto_op).toFixed(2) }}
            </template>
          </v-data-table>

          <b>Cuentas</b>
          <v-data-table
            v-model="selectedAccount"
            :headers="headersAccount"
            :items="$store.state.itemsDataAccountsNumberList"
            hide-default-footer
            item-key="id"
            show-select
            dense
            class="elevation-0"
          >
          </v-data-table>

          <v-btn
            block
            @click.native="_generateSolicitud()"
            class="mt-2"
            color="primary"
            :loading="loading"
            >GENERAR SOLICITUD</v-btn
          >
        </v-card-text>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog width="80%" v-model="dialogPayment">
      <v-card class="mx-auto">
        <v-toolbar color="cyan" dark>
          <v-toolbar-title>SOLICITUDES GENERADAS</v-toolbar-title>

          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-title>
          <v-text-field
            dense
            v-model="search"
            append-icon="mdi-magnify"
            label="Buscar solicitud"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        <v-container v-if="!dataList" style="height: 400px">
          <v-row class="fill-height" align-content="center" justify="center">
            <v-col class="text-subtitle-1 text-center" cols="12">
              Cargando informacíon
            </v-col>
            <v-col cols="12" xl="6" lg="6">
              <v-progress-linear
                color="deep-purple accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
        <v-data-table
          v-if="dataList"
          :headers="headersPdf"
          :items="itemsSPayment"
          :search="search"
        >
          <template v-slot:[`item.status`]="{ item }">
            <v-chip
              v-if="item.status == 2"
              class="ma-2"
              color="orange"
              text-color="white"
            >
              {{ item.status == 2 ? "Pendiente" : "" }}
            </v-chip>
            <v-chip
              v-if="item.status == 3"
              class="ma-2"
              color="green"
              text-color="white"
            >
              {{ item.status == 3 ? "Pagado" : "" }}
            </v-chip>
          </template>
          <template v-slot:[`item.accion`]="{ item }">
            <v-icon class="mr-2" @click="viewPdf(item.path)"> mdi-eye </v-icon>
          </template>
          <template v-slot:[`item.accions`]="{ item }">
            <v-icon
              v-if="item.status == 1"
              class="mr-2"
              color="green"
              @click="sendAdmin(item.id)"
            >
              mdi-send
            </v-icon>
            <v-icon
              v-if="item.status != 3"
              class="mr-2"
              color="red"
              @click="eliminar(item.id)"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      v-model="dialogPorcentajeProveedor"
      persistent
      max-width="50%"
      transition=""
    >
      <v-card>
        <v-card-title primary-title>
          Registrar División de Pagos <v-spacer></v-spacer>
          <v-btn icon color="default" @click="cerrarModal()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmPorcentajeProveedor">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  dense
                  class="col-3"
                  label="Nro Cuotas"
                  v-model="$store.state.nro_cuotas"
                  min="1"
                  type="number"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col
                cols="6"
                v-for="n in Number($store.state.nro_cuotas)"
                :key="n"
              >
                <v-row>
                  <v-col cols="4">
                    <v-text-field
                      dense
                      :label="`Porcentaje Cuota-${n}`"
                      v-model="$store.state.cuota[n - 1]"
                      type="number"
                      suffix="%"
                      min="0"
                      max="100"
                      :rules="[
                        (v) => !!v || 'Dato Requerido',
                        (v) => v > 0 || 'El porcentaje tiene que ser positivo',
                        (v) =>
                          v <= 100 ||
                          'El por centaje no puede ser mayor que 100%',
                      ]"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="8">
                    <v-text-field
                      dense
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      :label="`Fecha de pago ${n}`"
                      v-model="$store.state.fechacuota[n - 1]"
                      type="date"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            :loading="loadingPorcentaje"
            @click="InsertarActualizarPorcentajeProveedor"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--CUENTA BANCARIA-->
    <v-dialog v-model="dialogCuentaBancaria" width="30%" persistent>
      <v-card class="pa-5">
        <h2>{{ egreso.nombre_proveedor }}</h2>
        <v-card-title>AGREGAR NUEVA CUENTA BANCARIA</v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="frmCuentaBancaria">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    dense
                    placeholder="Beneficiario"
                    label="Beneficiario"
                    v-model="cuentaBancaria.beneficiario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    dense
                    placeholder="Nro Cuenta"
                    label="Nro Cuenta"
                    v-model="cuentaBancaria.nro_cuenta"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    dense
                    placeholder="CCI"
                    label="CCI"
                    v-model="cuentaBancaria.cci"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    dense
                    :items="$store.state.bank.list"
                    item-text="name"
                    item-value="id"
                    placeholder="Bancos"
                    label="Bancos"
                    v-model="cuentaBancaria.id_banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    dense
                    :items="$store.state.coins.itemsCoinsList"
                    item-text="acronym"
                    item-value="id"
                    placeholder="Monedas"
                    label="Monedas"
                    v-model="cuentaBancaria.id_coins"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-text-field
                    dense
                    placeholder="Nro swift"
                    label="Nro swift"
                    v-model="cuentaBancaria.nro_swift"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-autocomplete
                    dense
                    :items="$store.state.bank.list"
                    item-text="name"
                    item-value="id"
                    placeholder="Bancos"
                    label="Bancos"
                    v-model="cuentaBancaria.id_intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-text-field
                    dense
                    placeholder="Cuenta Intermediario"
                    label="Cuenta Intermediario"
                    v-model="cuentaBancaria.nro_cuenta_intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            @click="dialogCuentaBancaria = !dialogCuentaBancaria"
            >Cancelar</v-btn
          >
          <v-btn
            color="success"
            @click="registrarCuentaBancaria"
            :loading="loadingBotonGuardarCuentaBancaria"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogCopiar" scrollable persistent max-width="30%">
      <v-card>
        <v-card-title primary-title>
          COPIAR COSTOS {{ egreso.nombre_proveedor }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCopiar">
            <v-autocomplete
              :items="$store.state.itemsCoinsList"
              v-model="egreso.id_coins"
              item-text="acronym"
              item-value="id"
              label="Moneda de Banco Salida"
              @change="obtenerMoneda()"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />

            <v-text-field
              dense
              v-model="egreso.tipocambio"
              type="number"
              label="Tipo de Cambio"
              step="0.01"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="copiarMontos()">COPIAR</v-btn>
          <v-btn color="danger" @click="dialogCopiar = !dialogCopiar">
            CANCELAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogCambiarExp" persistent max-width="500px">
      <v-card>
        <v-card-title>
          Mover {{ egreso.nombre_proveedor ? egreso.nombre_proveedor : null }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmMoverCosto">
            <v-autocomplete
              v-model="id_masterdestino"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :items="
                $store.state.itemsMasterList.filter(
                  (v) => v.id != egreso.id_master,
                )
              "
              item-value="id"
              item-text="code_master"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :loading="loading" color="success" @click="functionMoverCostos"
            >Mover Costo</v-btn
          >
          <v-btn
            :loading="loading"
            color="error"
            @click="dialogCambiarExp = false"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import moment from "moment";
import axios from "axios";
import Swal from "sweetalert2";
import { mapActions } from "vuex";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
export default {
  props: {
    statusBtn: {
      type: Number,
      default: 0,
    },
    prFlag: {
      type: Boolean,
      default: false,
    },
    opFlag: {
      type: Boolean,
      default: false,
    },
    egreso_pr: {
      type: Number,
      default: 0,
    },
    egreso_op: {
      type: Number,
      default: 0,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  data: () => {
    return {
      dialogCambiarExp: false,
      egreso: {},
      id_masterdestino: null,
      dialogCopiar: false,
      loadingPorcentaje: false,
      loading: false,
      dialog: false,
      dialogListInvoice: false,
      dialogInvoice: false,
      dialogPorcentajeProveedor: false,
      dialogPayment: false,
      dialogSolicitudDivision: false,
      dialogSolicitudDivision: false,

      dialogSolicitud: false,
      checkPago: false,
      checkMaster: false,
      date: moment().format("YYYY-MM-DD"),
      id_proveedor: "",
      id_correlativo: "",
      tipocambio: 1,
      id_coins: null,
      sufmoneda: "USD",
      nameproveedor: "",
      payfile: "",
      boolFile: false,
      errFile: "",
      msgFile: "",
      nro_invoice: "",
      conceptos: "",
      codigo_master: null,
      search: "",
      comentarios: "",
      codigo_pago: "",
      radio: 1,
      e1: 1,
      egresos: {
        id: null,
        concepto: "",
        statusCalcula: false,
        opcion: null,
        numero: "",
        fecha: moment(new Date()).format("YYYY-MM-DD"),
        montoop: 0,
        montoopview: 0,
        igvop: 0,
        totalop: 0,
        montopr: 0,
        igvpr: 0,
        totalpr: 0,
        id_proveedor: null,
        montoopcuentabanco: 0,
        igvopcuentabanco: 0,
        totalopcuentabanco: 0,
      },
      headersInvoice: [
        {
          text: "Nombre",
          value: "originalname",
        },
        {
          text: "Fecha",
          value: "date_letra",
        },
        {
          text: "Monto de la Factura",
          value: "monto",
        },
        {
          text: "Ver",
          value: "path",
        },
        {
          text: "Acción",
          value: "action",
        },
      ],
      headersPdf: [
        {
          text: "Nombre",
          align: "start",
          sortable: false,
          value: "path",
        },
        {
          text: "Fecha Creado",
          value: "fecha_letra",
        },
        {
          text: "Hora Creado",
          value: "hora_letra",
        },
        {
          text: "Fecha de Solicitud",
          value: "fecha_sol_letra",
        },
        {
          text: "Fecha de Pago",
          value: "fecha_pago_letra",
        },
        {
          text: "Ver",
          value: "accion",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "Enviar",
          value: "accions",
        },
      ],
      headersAccount: [
        { text: "Beneficiario", value: "beneficiario" },
        {
          text: "Cuenta",
          align: "start",
          sortable: false,
          value: "nameaccount",
        },
        { text: "Banco", value: "namebanks" },
        { text: "Moneda", value: "namecoins" },
        { text: "Número de cuenta", value: "accountnumber" },
      ],
      headers: [
        {
          text: "Concepto",
          align: "start",
          sortable: false,

          value: "concepto",
        },
        {
          text: "Monto",
          value: "monto",
        },
        {
          text: "IGV",
          value: "igv_op",
        },
        {
          text: "Total",
          value: "total_op",
        },
        {
          text: "Status",
          value: "pagado",
        },
      ],
      itemsListInvoice: [],
      dataList: [],
      itemsSPayment: [],
      selectedAccount: [],
      selected: [],

      showSeccion2NuevoEgreso: false,
      showSeccion3NuevoEgreso: false,
      showSeccion4NuevoEgreso: false,
      isBotonGuardarEgresoDisabled: true,
      dialogCuentaBancaria: false,
      loadingBotonGuardarCuentaBancaria: false,
      cuentaBancaria: {
        id_entities: "",
        nro_cuenta: "",
        cci: "",
        id_banco: "",
        id_coins: "",
        nro_swift: "",
        id_intermediario: "",
        nro_cuenta_intermediario: "",
      },
      monto_factura: "",
      isFileLoading: false,
      isDataTableLoading: false,
      mostrarImpuesto: true,
      egreso: {},
      clientesAbiertos: {},
    };
  },
  async mounted() {
    await Promise.all([
      this.getBanksListCargar(),
      this.getCoinsListCargar(),
      this.cargarMasterDetalleTipoTransaccion(),
      this._getProveedor(),
      this._getMasterList(),
    ]);

    this.headers[2].text =
      this.$store.state.enterprises.impuesto.nombre_impuesto;
    this.mostrarImpuesto =
      this.$store.state.enterprises.impuesto.mostrarimpuesto;
  },
  methods: {
    recibirId(file) {
      this.payPath = file.inserid;
      this.payfile = file.archivo;

      this.msgfile = "Archivo procesado y vinculado correctamente.";
      this.errfile = "";
    },
    abrirModalCambiarExp(item) {
      this.egreso = item;
      this.dialogCambiarExp = true;
      this.$nextTick(() => {
        this.$refs.frmMoverCosto.reset();
      });
      console.log(item);
    },
    async functionMoverCostos() {
      if (this.$refs.frmMoverCosto.validate()) {
        let data = {
          id_masterorigen: this.egreso.id_master,
          id_proveedor: this.egreso.id_proveedor,
          id_masterdestino: this.id_masterdestino,
          id_correlativo: this.egreso.id_correlativo,
        };
        this.loading = true;
        await this.moverCostos(data);
        this.loading = false;
        console.log("llegp 2");
        this.dialogCambiarExp = false;
        console.log("llegp 3");
        this.$emit("recargarDatos");
        console.log("llegp 4");
      }
    },
    clienteKey(egreso, grupo) {
      const base = egreso.id_proveedor || egreso.id_master || "";
      const id_house = grupo.id_house || "";
      const code_house = grupo.code_house || "";
      const consigner = grupo.consigner || "";
      return `${base}-${id_house}-${code_house}-${consigner}`;
    },
    toggleCliente(egreso, grupo) {
      const key = this.clienteKey(egreso, grupo);
      this.$set(this.clientesAbiertos, key, !this.clientesAbiertos[key]);
    },
    isClienteAbierto(egreso, grupo) {
      const key = this.clienteKey(egreso, grupo);
      return !!this.clientesAbiertos[key];
    },
    groupDetallePorCliente(detalle) {
      if (!detalle || !Array.isArray(detalle)) {
        return [];
      }

      const gruposMap = new Map();

      const masterHouses =
        (this.$store.state.controlGastos.listControlGastos[0] &&
          this.$store.state.controlGastos.listControlGastos[0].master_houses) ||
        [];

      detalle.forEach((item) => {
        const id_house = item.id_house || null;
        const code_house = item.code_house || "";

        let consigner = item.consigner || "";

        // Si no tenemos consigner en el detalle pero sí tenemos id_house,
        // intentamos obtenerlo desde master_houses.
        if (!consigner && id_house !== null && id_house !== undefined) {
          const house = masterHouses.find(
            (h) => h.id_house == id_house || h.id == id_house,
          );
          if (house && house.consigner) {
            consigner = house.consigner;
          }
        }

        // clave estable: si hay id_house se usa, si no, combina consigner+code_house
        const key =
          id_house !== null && id_house !== undefined
            ? `house-${id_house}`
            : `client-${consigner}-${code_house}`;

        if (!gruposMap.has(key)) {
          gruposMap.set(key, {
            id_house,
            code_house,
            consigner,
            items: [],
          });
        }

        gruposMap.get(key).items.push(item);
      });

      const grupos = Array.from(gruposMap.values());
      return grupos;
    },
    abrirExpandEgreso(index) {},
    abrirModalCuentaBancaria() {
      this.dialogCuentaBancaria = true;
    },
    nuevoEngreso() {
      this.egresos.id = null;
      this.egresos.concepto = "";
      this.egresos.statusCalcula = false;
      this.egresos.opcion = null;
      this.egresos.numero = "";
      this.egresos.fecha = moment(new Date()).format("YYYY-MM-DD");
      this.egresos.montoop = 0;
      this.egresos.igvop = 0;
      this.egresos.totalop = 0;
      this.egresos.montopr = 0;
      this.egresos.igvpr = 0;
      this.egresos.totalpr = 0;
      this.egresos.id_proveedor = null;
      this.egresos.montoopcuentabanco = 0;
      this.egresos.igvopcuentabanco = 0;
      this.egresos.totalopcuentabanco = 0;
      this.$emit("statusBtn", 1);
      this.id_coins = null;
      this.tipocambio = 1;
      (this.showSeccion2NuevoEgreso = false),
        (this.showSeccion3NuevoEgreso = false),
        (this.showSeccion4NuevoEgreso = false),
        (this.isBotonGuardarEgresoDisabled = true);
      this.dialog = !this.dialog;
      setTimeout(() => {
        this.$refs.frmEgreso.resetValidation();
      }, 100);
    },
    obtenerMoneda() {
      if (
        typeof this.id_coins !== "undefined" &&
        this.id_coins !== "" &&
        this.id_coins !== null
      ) {
        const monedaSeleccionada = this.$store.state.itemsCoinsList.find(
          (v) => v.id == this.id_coins,
        );

        if (monedaSeleccionada) {
          this.sufmoneda = monedaSeleccionada.symbol;
          this.tipocambio = this.sufmoneda === "USD" ? 1 : this.tipocambio;
        } else {
          console.warn("No se encontró la moneda con id:", this.id_coins);
        }
      }
    },
    calcularE() {
      if (this.tipocambio) {
        let partes = this.tipocambio.toString().split(".");
        let decimales = partes[1] ? partes[1].length : 0;
        if (decimales > 2) {
          this.tipocambio = parseFloat(this.tipocambio).toFixed(2);
        }
      }

      if (this.egresos.statusCalcula) {
        // pricing
        this.egresos.igvpr = parseFloat(
          (this.egresos.montopr *
            this.$store.state.enterprises.impuesto.impuesto) /
            100,
        ).toFixed(2);
        this.egresos.totalpr =
          parseFloat(this.egresos.montopr) + parseFloat(this.egresos.igvpr);
        // op
        this.egresos.igvopcuentabanco = parseFloat(
          (this.egresos.montoopcuentabanco *
            this.$store.state.enterprises.impuesto.impuesto) /
            100,
        ).toFixed(2);
        this.egresos.totalopcuentabanco = parseFloat(
          parseFloat(this.egresos.montoopcuentabanco) +
            parseFloat(
              (this.egresos.montoopcuentabanco *
                this.$store.state.enterprises.impuesto.impuesto) /
                100,
            ),
        ).toFixed(2);
        this.egresos.montoop = parseFloat(
          this.egresos.montoopcuentabanco / this.tipocambio,
        ).toFixed(4);
        this.egresos.montoopview = parseFloat(
          this.egresos.montoopcuentabanco / this.tipocambio,
        ).toFixed(2);
        this.egresos.igvop = parseFloat(
          this.egresos.igvopcuentabanco / this.tipocambio,
        ).toFixed(4);
        this.egresos.totalop = parseFloat(
          parseFloat(this.egresos.montoop) + parseFloat(this.egresos.igvop),
        ).toFixed(4);
        this.egresos.igvopview = parseFloat(
          this.egresos.igvopcuentabanco / this.tipocambio,
        ).toFixed(2);
        this.egresos.totalopview = parseFloat(
          parseFloat(this.egresos.montoop) + parseFloat(this.egresos.igvop),
        ).toFixed(2);
      } else {
        // pr

        this.egresos.igvpr = 0;
        this.egresos.totalpr = parseFloat(this.egresos.montopr);
        // op
        this.egresos.igvopcuentabanco = 0.0;
        this.egresos.totalopcuentabanco = parseFloat(
          parseFloat(this.egresos.montoopcuentabanco),
        ).toFixed(2);
        this.egresos.montoop = parseFloat(
          this.egresos.montoopcuentabanco / this.tipocambio,
        ).toFixed(4);
        this.egresos.montoopview = parseFloat(
          this.egresos.montoopcuentabanco / this.tipocambio,
        ).toFixed(2);
        this.egresos.igvop = parseFloat(
          this.egresos.igvopcuentabanco / this.tipocambio,
        ).toFixed(4);
        this.egresos.igvopview = parseFloat(
          this.egresos.igvopcuentabanco / this.tipocambio,
        ).toFixed(2);
        this.egresos.totalop = parseFloat(parseFloat(this.egresos.montoop));
        this.egresos.totalopview = parseFloat(parseFloat(this.egresos.montoop));
      }
      this.$forceUpdate();
    },
    validarSolicitudPago(egreso) {
      let vm = this;
      let tipocambio = egreso.detalle[0].tipocambio;
      let correcto = true;
      egreso.detalle.forEach((element) => {
        tipocambio == element.tipocambio
          ? (correcto = correcto)
          : (correcto = false);
      });

      let statusPagado = egreso.detalle.some((v) => !!v.pagado);
      let statusAdmin_noPagado = egreso.detalle.some(
        (v) => !!v.statusadmin && !v.pagado,
      );

      if (!!statusPagado) {
        vm.$swal({
          icon: "error",
          html: `<b>No se puede realizar una solicitud de pago, porque todos los registros ya han sido pagados</b>`,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "ACEPTAR",
        });
      } else if (!!statusAdmin_noPagado) {
        vm.$swal({
          icon: "question",
          html: `<b>Ya se ha realizado una solicitud de pago a administración. ¿Desea generar una solicitud nueva y eliminar la anterior?</b>`,
          showCancelButton: true,
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#d33",
          confirmButtonText: "Si",
          cancelButtonText: "No",
        }).then(async (res) => {
          if (res.isConfirmed) {
            await vm._getSPaymentPro(egreso);
            if (vm.itemsSPayment[0] && vm.itemsSPayment[0].id) {
              await vm.eliminar(vm.itemsSPayment[0].id);

              vm.selected = [];
              vm.TotalLocal = egreso.detalle.reduce((suma, element) => {
                return suma + parseFloat(element.total_op);
              }, 0);
              vm.total = 0;
              vm.proveedorId = egreso.id_proveedor;
              vm.nameproveedor = egreso.nombre_proveedor;
              vm.conceptos = egreso.detalle;
              vm.id_correlativo = egreso.id_correlativo;
              vm.id_master = egreso.id_master;

              await vm._generateSolicitud();
            }
          }
        });
      } else if (!!correcto) {
        vm.solicitar(egreso);
      } else {
        vm.$swal({
          icon: "error",
          html: `<p style="text-align: center;"><strong>&iexcl;Advertencia!</strong></p>
                1. Debe registrar cada factura con un solo n&uacute;mero de correlativo y tipo de cambio. <br>
                2. Se han detectado que hay dos tipos de cambios distintos para el mismo correlativo en la factura.
                `,
        });
      }
    },
    async abrirModalPorcentajeProveedor(item) {
      this.$store.state.cuota = [];
      this.$store.state.fechacuota = [];
      this.dataProveedor = item;
      this.$store.state.nro_cuotas = item.nro_cuotas ? item.nro_cuotas : 3;
      if (!!item.nro_cuotas) {
        await item.cuotas.forEach((element) => {
          this.$store.state.cuota.push(element.porcentaje);
          this.$store.state.fechacuota.push(element.fecha);
        });
      }
      // } else {
      //   this.$store.state.cuota = [];
      //   this.$store.state.fechacuota = [];
      // }

      this.dialogPorcentajeProveedor = !this.dialogPorcentajeProveedor;
    },
    cerrarModal() {
      this.$refs.frmPorcentajeProveedor.reset();
      this.dialogPorcentajeProveedor = !this.dialogPorcentajeProveedor;
    },
    viewPdf(pdf) {
      window.open(process.env.VUE_APP_URL_MAIN + pdf, "_blank");
    },
    validatePorcentaje() {
      let val = true;
      let sum = 0;
      let html = "<ul>";
      for (let i = 0; i < this.$store.state.nro_cuotas; i++) {
        sum += parseFloat(this.$store.state.cuota[i]);
      }
      if (sum != 100) {
        val = false;
        html += "<li>El porcentaje final debe ser igual al 100%</li>";
      }
      html += "</ul>";
      if (!val) {
        Swal.fire({
          icon: "error",
          html: html,
        });
      }
      return val;
    },
    async _setData() {
      if (this.$refs.frmEgreso.validate()) {
        var vm = this;

        var data = {
          id_master:
            vm.$store.state.controlGastos.listControlGastos[0].master_id,
          id_orders:
            vm.$store.state.controlGastos.listControlGastos[0].master_houses.filter(
              (v) => v.id_orders,
            )[0].id_orders,
          id_proveedor: vm.egresos.id_proveedor,
          concepto: vm.egresos.concepto,
          monto_op: vm.egresos.montoop,
          monto_pr: vm.egresos.montopr,
          igv_pr: vm.egresos.igvpr,
          total_pr: vm.egresos.totalpr,
          igv_op: vm.egresos.igvop,
          total_op: vm.egresos.totalop,
          id_coins: vm.id_coins,
          montoopcuentabanco: vm.egresos.montoopcuentabanco,
          igvopcuentabanco: vm.egresos.igvopcuentabanco,
          totalopcuentabanco: vm.egresos.totalopcuentabanco,
          id_correlativo: vm.id_correlativo,
          tipocambio: vm.tipocambio,
          id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
        };

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setEgresos",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.listControlGasto();
            vm.dialog = false;
          })
          .catch(function (error) {
            console.log(error);
          });
        this.$emit("recalcularProfit");
      }
    },
    solicitar(egreso) {
      var vm = this;
      vm.selected = [];
      let TLocal = 0;
      // this.TotalLocal = egreso.detalle.reduce(monto);
      egreso.detalle.forEach((element) => {
        TLocal = parseFloat(TLocal) + parseFloat(element.total_op);
      });
      vm.TotalLocal = TLocal;
      vm.total = 0;

      vm.proveedorId = egreso.id_proveedor;
      vm.nameproveedor = egreso.nombre_proveedor;
      vm.conceptos = egreso.detalle;
      vm.id_correlativo = egreso.id_correlativo;
      vm.id_master = egreso.id_master;
      vm.id_tipotransaccion =
        (
          vm.$store.state.itemsProveedorList.find(
            (v) => v.id == egreso.id_proveedor,
          ) || {}
        ).id_tipotransaccion || "";

      vm.$swal({
        html: "<b>¿Desea realizar una solicitud de pago? Recuerde que luego de generarse la solicitud no se podrá editar.</b>",
        // showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Si",
        denyButtonText: `No`,
        cancelButtonText: "Cancelar",
        icon: "warning",
        // imageUrl: "https://point.qreport.site/files/alto_icono.png",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await vm.mostrarModalSolicitudPago(egreso);
        } else if (result.isDenied) {
          vm.dialogSolicitudDivision = !vm.dialogSolicitudDivision;
        }
      });
    },
    async mostrarModalSolicitudPago(egreso) {
      this.egreso = egreso;

      var vm = this;

      vm.e1 = 1;
      vm.checkPago = false;
      vm.checkMaster = false;
      vm.codigo_pago = "";
      vm.codigo_master = "";
      vm.selectedAccount = [];
      vm.comentarios = "";

      vm.dialogSolicitud = !vm.dialogSolicitud;

      await this._getAccountsNumber();
    },
    async _setInvoice() {
      var vm = this;

      vm.$swal({
        icon: "info",
        title: "Guardando...",
        text: "Por favor, espere",
      });

      var data = {
        id_house:
          this.$store.state.controlGastos.listControlGastos[0].master_houses.filter(
            (v) => v.id_house,
          )[0].id_house,
        id_proveedor: vm.egreso.id_proveedor,
        id_path: vm.$store.state.files.payPath,
        type_pago: vm.radio,
        number: vm.nro_invoice,
        date: vm.date,
        monto: vm.monto_factura,
        id_correlativo: vm.egreso.id_correlativo,
        id_master: vm.egreso.id_master,
        status: 1,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setInvoice",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          vm.itemsInvoice = response.data.data;
          vm.listControlGasto();
          vm.$swal({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido cargado correctamente",
          });

          // vm.cleandData();
          // vm.dialogListInvoice = false;
          vm.dialogInvoice = false;

          await vm._getInvoice(vm.egreso);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _delInvoice(id) {
      var vm = this;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delInvoice/" + id,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          vm.itemsInvoice = response.data.data;
          vm._getInvoice(vm.egreso);
          vm.dialogInvoice = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async InsertarActualizarPorcentajeProveedor() {
      if (
        this.$refs.frmPorcentajeProveedor.validate() &&
        this.validatePorcentaje()
      ) {
        var vm = this;
        vm.loadingPorcentaje = true;
        let cuotas = [];
        for (let i = 0; i < this.$store.state.nro_cuotas; i++) {
          cuotas.push({
            porcentaje: this.$store.state.cuota[i],
            fecha: this.$store.state.fechacuota[i],
          });
        }

        let data = {
          id_master: vm.dataProveedor.id_master,
          id_proveedor: vm.dataProveedor.id_proveedor,
          id_correlativo: vm.dataProveedor.id_correlativo,
          nro_cuotas: this.$store.state.nro_cuotas,
          cuotas: cuotas,
        };
        await this.guardarCuotasCgeTipoProveedor(data);
        await this.getListControlGastos(this.$route.params.id);
        this.$refs.frmPorcentajeProveedor.reset();
        this.loadingPorcentaje = false;
        this.dialogPorcentajeProveedor = false;
      }
    },
    async _getAccountsNumber() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN + "getAccountsNumber/" + vm.proveedorId,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(function (response) {
          vm.$store.state.itemsDataAccountsNumberList =
            response.data.data || [];
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _editEgreso(egreso) {
      this.egresos = {
        id: egreso.id,
        concepto: egreso.concepto,
        statusCalcula: true,
        opcion: egreso.igvop || egreso.igvpr ? true : false,
        numero: "",
        fecha: moment(new Date()).format("YYYY-MM-DD"),
        montoop: egreso.monto_op,
        igvop: egreso.igv_op,
        totalop: egreso.total_op,
        montopr: egreso.monto_pr,
        igvpr: egreso.igv_pr,
        totalpr: egreso.total_pr,
        id_proveedor: egreso.id_proveedor,
        montoopcuentabanco: egreso.montoopcuentabanco,
        igvopcuentabanco: egreso.igvopcuentabanco,
        totalopcuentabanco: egreso.totalopcuentabanco,
      };
      this.id_correlativo = egreso.id_correlativo;
      this.tipocambio = egreso.tipocambio;
      this.id_coins = egreso.id_coins;
      if (this.id_coins) {
        this.obtenerMoneda();
      }
      this.$emit("statusBtn", 2);
      this.dialog = true;
    },
    async _delEngreso(item) {
      var vm = this;

      vm.$swal({
        icon: "question",
        title: "Advertencia",
        html: `Está seguro de eliminar el concepto <b>${item.concepto}</b> del proveedor
              <b>${item.nombre_proveedor}</b>`,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonText: "Continuar",
        denyButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          vm.$store.state.spiner = true;
          var config = {
            method: "put",
            url: process.env.VUE_APP_URL_MAIN + "delEgregso/" + item.id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
          };
          axios(config)
            .then(function (response) {
              let res = response.data;
              if (res.estadoflag == true) {
                vm.$swal({
                  icon: "info",
                  title: "informacíon",
                  text: res.mensaje,
                });
                vm.$store.state.spiner = false;
                vm.listControlGasto();
              } else {
                vm.$swal({
                  icon: "error",
                  title: "informacíon",
                  text: res.mensaje,
                });
                vm.$store.state.spiner = false;
              }
            })
            .catch(function (error) {
              console.log(error);
            });
        }
      });
    },
    async openPayments(egreso) {
      var vm = this;
      vm.sPaymentId = egreso.id_proveedor;
      vm.dialogPayment = true;
      vm.dataList = false;
      await vm._getSPaymentPro(egreso);
      vm.dataList = true;
    },
    async _getSPaymentPro(egreso) {
      var vm = this;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getSPaymentPro?" +
          `id_master=${egreso.id_master}&id_proveedor=${
            egreso.id_proveedor
          }&id_correlativo=${egreso.id_correlativo}&id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          console.log(response);
          vm.itemsSPayment = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async listControlGasto() {
      this.$store.state.spiner = true;
      await this.getListControlGastos(this.$route.params.id);
      this.$store.state.spiner = false;
    },
    activarSeccion3() {
      // console.log(this.egresos)
      if (this.egresos.concepto) {
        this.showSeccion3NuevoEgreso = true;
      }
    },
    async _editEgresos() {
      this.calcularE();
      var vm = this;
      var data = {
        id_proveedor: vm.egresos.id_proveedor,
        concepto: vm.egresos.concepto,
        monto_op: vm.egresos.montoop,
        monto_pr: vm.egresos.montopr,
        igv_pr: vm.egresos.igvpr,
        total_pr: vm.egresos.totalpr,
        igv_op: vm.egresos.igvop,
        total_op: vm.egresos.totalop,
        id_coins: vm.id_coins,
        montoopcuentabanco: vm.egresos.montoopcuentabanco,
        igvopcuentabanco: vm.egresos.igvopcuentabanco,
        totalopcuentabanco: vm.egresos.totalopcuentabanco,
        id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
        id_master: vm.$store.state.controlGastos.listControlGastos[0].master_id,
        id_correlativo: vm.id_correlativo,
        tipocambio: vm.tipocambio,
        status: true,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "editEgreso/" + vm.egresos.id,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.listControlGasto();
          vm.dialog = false;
        })
        .catch(function (error) {
          console.log(error);
        });
      this.$emit("recalcularProfit");
    },
    async imprimirControl() {
      let master = this.$store.state.controlGastos.listControlGastos[0];

      let data = {
        bultos: master.master_volumen,
        peso: master.master_peso,
        puerto_origen: master.master_port_begin,
        puerto_destino: master.master_port_end,
        tipo_embarque: master.master_shipment,
        volumen: master.master_volumen,
        gananciapr: parseFloat(this.ingreso_pr - this.egreso_pr).toFixed(2),
        gananciaop: parseFloat(this.ingreso_op - this.egreso_op).toFixed(2),
        exp: this.codigo_master,
        sentido: master.master_modality,
        itemsTotalesProveedores: master.master_egresos.map((element) => {
          return {
            nameproveedor: element.nombre_proveedor,
            restante: parseFloat(element.monto_pagar_op).toFixed(2),
            total_op: parseFloat(element.total_total_op).toFixed(2),
            total_p: parseFloat(element.total_total_op).toFixed(2),
            total_pr: parseFloat(element.total_total_pr).toFixed(2),
          };
        }),
        itemTotalHouse: master.master_houses.map((element) => {
          return {
            consigner: element.consigner,
            code_house: element.code_house,
            total_igv_op_ingresos: parseFloat(
              element.total_igv_op_ingresos,
            ).toFixed(2),
            total_igv_pr_ingresos: parseFloat(
              element.total_igv_pr_ingresos,
            ).toFixed(2),
            total_monto_op_ingresos: parseFloat(
              element.total_monto_op_ingresos,
            ).toFixed(2),
            total_monto_pr_ingresos: parseFloat(
              element.total_monto_pr_ingresos,
            ).toFixed(2),
            total_total_op_ingresos: parseFloat(
              element.total_total_op_ingresos,
            ).toFixed(2),
            total_total_pr_ingresos: parseFloat(
              element.total_total_pr_ingresos,
            ).toFixed(2),
          };
        }),
      };
    },
    async imprimirControlDetallado() {
      let master = this.$store.state.controlGastos.listControlGastos[0];
      let egresos = [];
      let totalEgreso = 0;
      let totalIgvEgresos = 0;
      let totalTotalEgresos = 0;
      let totalEgresoOp = 0;
      let totalIgvEgresosOp = 0;
      let totalTotalEgresosOp = 0;
      master.master_egresos.forEach((element) => {
        element.detalle.forEach((element2) => {
          egresos.push({
            namePagado: "",
            nameproveedor: element2.nombre_proveedor,
            concepto: element2.concepto,
            monto_pr: element2.monto_pr,
            igv_pr: element2.igv_pr,
            total_pr: element2.total_pr,
            monto_op: element2.monto_op,
            igv_op: element2.igv_op,
            total_op: element2.total_op,
          });
          totalEgreso += parseFloat(element2.monto_pr);
          totalIgvEgresos += parseFloat(element2.igv_pr);
          totalTotalEgresos += parseFloat(element2.total_pr);
          totalEgresoOp += parseFloat(element2.monto_op);
          totalIgvEgresosOp += parseFloat(element2.igv_op);
          totalTotalEgresosOp += parseFloat(element2.total_op);
        });
      });
      let data = {
        bultos: master.master_volumen,
        peso: master.master_peso,
        puerto_origen: master.master_port_begin,
        puerto_destino: master.master_port_end,
        tipo_embarque: master.master_shipment,
        volumen: master.master_volumen,
        sentido: master.master_modality,
        gananciapr: parseFloat(this.ingreso_pr - this.egreso_pr).toFixed(2),
        gananciaop: parseFloat(this.ingreso_op - this.egreso_op).toFixed(2),
        exp: this.codigo_master,
        totalEgreso,
        totalIgvEgresos,
        totalTotalEgresos,
        totalEgresoOp,
        totalIgvEgresosOp,
        totalTotalEgresosOp,
        itemsTotalesProveedores: master.master_egresos.map((element) => {
          return {
            nameproveedor: element.nombre_proveedor,
            restante: parseFloat(element.monto_pagar_op).toFixed(2),
            total_op: parseFloat(element.total_total_op).toFixed(2),
            total_p: parseFloat(element.total_total_op).toFixed(2),
            total_pr: parseFloat(element.total_total_pr).toFixed(2),
          };
        }),

        itemTotalHouse: master.master_houses.map((element) => {
          return {
            consigner: element.consigner,
            code_house: element.code_house,
            total_igv_op_ingresos: parseFloat(
              element.total_igv_op_ingresos,
            ).toFixed(2),
            total_igv_pr_ingresos: parseFloat(
              element.total_igv_pr_ingresos,
            ).toFixed(2),
            total_monto_op_ingresos: parseFloat(
              element.total_monto_op_ingresos,
            ).toFixed(2),
            total_monto_pr_ingresos: parseFloat(
              element.total_monto_pr_ingresos,
            ).toFixed(2),
            total_total_op_ingresos: parseFloat(
              element.total_total_op_ingresos,
            ).toFixed(2),
            total_total_pr_ingresos: parseFloat(
              element.total_total_pr_ingresos,
            ).toFixed(2),
          };
        }),
        itemHouses: master.master_houses,
        itemEgresos: master.master_egresos,
      };
      var vm = this;
      vm._calcularTotales();
      vm.$swal({
        icon: "info",
        title: "Generando PDF...",
        text: "Por favor espere",
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPdfInstructivoDetallado",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });

          window.open(
            process.env.VUE_APP_URL_MAIN + response.data.path,
            "_blank",
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    sendAdmin(id) {
      this.$swal({
        title: "¿Desea realizar esta solicitud a Administración?",
        showDenyButton: true,

        confirmButtonText: "Si",
        denyButtonText: `No`,

        icon: "info",
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          var data = {
            fecha_sol: new Date(
              Date.now() - new Date().getTimezoneOffset() * 60000,
            )
              .toISOString()
              .substr(0, 10),
            status: 2,
          };
          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "putSPaymentPro/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: data,
          };

          var vm = this;

          axios(config)
            .then(function (response) {
              vm.$swal({
                icon: "success",
                title: "Excelente",
                text: "Solicitud enviada correctamente",
              });
              vm.listControlGasto();
              vm._getSPaymentPro(vm.sPaymentId);
              vm.dataList = true;
            })
            .catch(function (error) {
              console.log(error);
            });
        }
      });

      this._getAccountsNumber();

      this.nameproveedorLocal = this.nameproveedor;
    },
    async eliminar(id) {
      let vm = this;
      let data = {
        id: id,
      };

      vm.$store.state.spiner = true;

      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "eliminar_spaymentpro",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          let res = response.data;

          vm.$swal({
            icon: "info",
            title: "Información",
            text: res.data[0].mensaje,
          }).then(async (result) => {
            if (result.isConfirmed) {
              vm.dialogPayment = false;
              vm.$store.state.spiner = true;
              await vm.listControlGasto();
              vm.$store.state.spiner = false;
            }
          });
        })
        .catch(function (error) {
          console.log(error);
        });

      vm.$store.state.spiner = false;
    },
    async _generateSolicitud() {
      var vm = this;
      vm.loading = true;
      vm._calcularTotales();
      vm.$swal({
        icon: "info",
        title: "Generando PDF...",
        text: "Por favor espere",
      });

      let pago;
      if (vm.total > 0) {
        pago = vm.total;
      } else {
        pago = vm.TotalLocal;
      }

      let concepto = [];

      if (vm.selected.length > 0) {
        concepto = vm.selected;
      } else {
        concepto = vm.conceptos;
      }
      let proveedor =
        this.$store.state.controlGastos.listControlGastos[0].master_egresos.map(
          (element) => {
            return {
              nameproveedor: element.nombre_proveedor,
              total_pr: parseFloat(element.total_total_pr).toFixed(2),
              total_op: parseFloat(element.total_total_op).toFixed(2),
            };
          },
        );

      var datas = {
        id_house:
          vm.$store.state.controlGastos.listControlGastos[0].master_houses.filter(
            (v) => v.id_house,
          )[0].id_house,
        id_proveedor: vm.proveedorId,
        conceptos: concepto,
        monto: pago,
        id_correlativo: vm.id_correlativo,
        id_master: vm.id_master,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setSPaymentPro",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: datas,
      };
      let clientes =
        this.$store.state.controlGastos.listControlGastos[0].master_houses
          .map((element) => {
            return element.consigner;
          })
          .join(", ");

      await axios(config)
        .then(function (response) {
          var data = {
            nameProveedor: vm.nameproveedor,
            nameConsignatario: clientes,
            totalPagar: vm.TotalLocal,
            expediente:
              vm.$store.state.controlGastos.listControlGastos[0]
                .master_nromaster,
            fecha: vm.currentDate(),
            totalProveedores: proveedor,
            comentarios: vm.comentarios,
            codigo_pago: vm.codigo_pago,
            codigo_master:
              vm.$store.state.controlGastos.listControlGastos[0]
                .master_nromaster,
            cuentas: vm.selectedAccount,
            operador: vm.$store.state.dataHouse_operador,
            conceptos: vm.conceptos,
            selected: vm.selected,
            totalSelected: vm.total,
            number: response.data.number,
            url_logo: JSON.parse(sessionStorage.getItem("dataUser"))[0].path,
            url: vm.$store.state.controlGastos.listControlGastos[0]
              .url_folderonedrive,
          };
          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "pdfSolicitud",
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: data,
          };

          axios(config)
            .then(function (response) {
              vm.listControlGasto();
              vm.$swal({
                icon: "success",
                title: "PDF Generado",
                text: "El PDF se descargará automaticamente",
              });

              window.open(
                process.env.VUE_APP_URL_MAIN + response.data.path,
                "_blank",
              );
              vm.dialogSolicitudDivision = false;
              vm.dialogSolicitud = false;
            })
            .catch(function (error) {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.loading = false;
    },
    _calcularTotales() {
      var vm = this;
      vm.total = 0;
      let calculo = 0;
      if (vm.selected.length > 0) {
        let calculo = 0;
        vm.selected.map((item) => {
          calculo = calculo + parseFloat(item.total_op);
          vm.total = calculo.toFixed(2);
        });
      } else {
        vm.conceptos.map((item) => {
          calculo = calculo + parseFloat(item.total_op);

          vm.total = calculo.toFixed(2);
        });
      }
    },
    currentDate() {
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const current = new Date();
      const date = `${current.getDate()} de ${
        monthNames[current.getMonth()]
      } del ${current.getFullYear()}`;
      return date;
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
    async openInvoice(egreso) {
      var vm = this;
      vm.msgFile = null;
      vm.loading = true;
      vm.itemsListInvoice = [];
      vm.proveedorId = egreso.id_proveedor;
      vm.egreso = egreso;
      vm.nameproveedor = egreso.nombre_proveedor;
      await vm._getInvoice(egreso);
      vm.loading = false;
    },
    async _getInvoice(egreso) {
      console.log("-----");
      var vm = this;

      vm.isDataTableLoading = true;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `list_invoice_path?id_master=${egreso.id_master}&id_proveedor=${egreso.id_proveedor}&id_correlativo=${egreso.id_correlativo}`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          vm.dialogListInvoice = true;
          if (!!response.data.data[0].estadoflag) {
            vm.itemsListInvoice = response.data.data;
          } else {
            vm.itemsListInvoice = [];
          }

          vm.isDataTableLoading = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    openDoc(path) {
      window.open(path, "_blank");
    },
    validarStep2Solicitud() {
      var vm = this;

      if (!vm.checkPago && !vm.selectedAccount.length) {
        vm.$swal({
          icon: "error",
          text: "Para avanzar al paso 3, debe seleccionar al menos una cuenta bancaria",
        });
      } else {
        vm.e1 = 3;
      }
    },
    isProveedorInternacional() {
      let val = this.$store.state.masterusuarios.lstTipoTransaccion.some(
        (v) => v.codigo == "02" && v.id == this.id_tipotransaccion,
      );
      return val;
    },
    registrarCuentaBancaria() {
      var vm = this;
      if (vm.$refs.frmCuentaBancaria.validate()) {
        Swal.fire({
          icon: "question",
          html: "<b>Si guarda este banco, se agregará a la lista de bancos de la ficha del proveedor. ¿Desea continuar?</b>",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Si",
          cancelButtonText: "No",
        }).then(async (result) => {
          if (result.isConfirmed) {
            vm.loadingBotonGuardarCuentaBancaria = true;

            var config = {
              method: "post",
              url: process.env.VUE_APP_URL_MAIN + "setAccount",
              headers: {
                "auth-token": sessionStorage.getItem("auth-token"),
                "Content-Type": "application/json",
              },
              data: {
                ...vm.cuentaBancaria,
                id_entities: vm.proveedorId,
                id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
                  .id_branch,
              },
            };

            await axios(config).then(async function (response) {
              sessionStorage.setItem("auth-token", response.data.token);

              if (response.data.estadoflag) {
                Swal.fire({
                  icon: "success",
                  text: response.data.mensaje,
                });

                await vm._getAccountsNumber();
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

            vm.loadingBotonGuardarCuentaBancaria = false;
            vm.dialogCuentaBancaria = !vm.dialogCuentaBancaria;

            vm.$refs.frmCuentaBancaria.reset();
          }
        });
      }
    },
    getDeudaActual(data = {}) {
      let { detalle: costos = [], total_total_op = 0 } = data;

      let abono = costos.reduce((suma, v) => {
        return v.pagado ? suma + (parseFloat(v.total_op) || 0) : suma;
      }, 0);

      let deuda = parseFloat(total_total_op) - parseFloat(abono.toFixed(2));

      return deuda != 0 ? deuda.toFixed(2) : 0;
    },
    cargarFactura() {
      this.payfile = "";
      this.msgFile = "";
      this.errFile = "";
      var vm = this;

      let abono = vm.itemsListInvoice.reduce((suma, v) => {
        return suma + (parseFloat(v.monto) || 0);
      }, 0);

      if (abono == parseFloat(vm.egreso.total_total_op)) {
        vm.$swal({
          icon: "error",
          html: `<b>No se puede cargar más facturas porque el monto de Total Operaciones es igual al total de facturas cargadas.</b>`,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "ACEPTAR",
        });

        vm.dialogInvoice = false;
      } else {
        vm.radio = "1";
        vm.date = moment().format("YYYY-MM-DD");
        vm.nro_invoice = "";
        vm.monto_factura = "";
        vm.payfile = null;
        vm.boolFile = false;

        vm.dialogInvoice = true;
      }
    },
    validarMontoFactura() {
      var vm = this;

      let abono = vm.itemsListInvoice.reduce((suma, v) => {
        return suma + (parseFloat(v.monto ? v.monto : 0) || 0);
      }, 0);

      let total =
        (parseFloat(vm.monto_factura ? vm.monto_factura : 0) || 0) +
        (parseFloat(abono) || 0);
      if (total > parseFloat(vm.egreso.total_total_op)) {
        vm.$swal({
          icon: "error",
          html: `<b>La suma del monto de las facturas cargadas debe ser menor o igual al monto del Total Operaciones para el proveedor. Verifique el monto de la factura.</b>`,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "ACEPTAR",
        }).then((result) => {
          if (result.isConfirmed) {
            vm.monto_factura = "";
          }
        });
      }
    },
    ...mapActions([
      "setEgresos",
      "setInvoice",
      "delInvoice",
      "getAccountsNumber",
      "delEgregso",
      "getSPaymentPro",
      "getListControlGastos",
      "editEgreso",
      "getPdfInstructivoDetallado",
      "putSPaymentPro",
      "eliminar_spaymentpro",
      "pdfSolicitud",
      "_uploadFile",
      "list_invoice_path",
      "setSPaymentPro",
      "uploadAllPath",
      "guardarCuotasCgeTipoProveedor",
      "getBanksListCargar",
      "getCoinsListCargar",
      "_getProveedor",
      "cargarMasterDetalleTipoTransaccion",
      "copiarCGEgresos",
      "_getMasterList",
      "moverCostos",
    ]),
    bloquearCopiarMontos(detalle) {
      return detalle.some((v) => v.pagado == 1 || v.statusadmin == 1);
      // return true;
    },
    abriModalCopiar(egreso, bloquearCopiarMontos) {
      this.egreso = {};
      if (bloquearCopiarMontos) {
        return;
      }

      this.egreso = egreso;
      this.dialogCopiar = true;
    },
    async copiarMontos() {
      if (this.$refs.frmCopiar.validate()) {
        await this.copiarCGEgresos(this.egreso);
        await this.getListControlGastos(this.$route.params.id);
        this.dialogCopiar = false;
      }
    },
  },
  watch: {
    egresos: {
      handler(newValue, oldValue) {
        var vm = this;

        if (newValue.id_proveedor && vm.showSeccion2NuevoEgreso === false) {
          vm.showSeccion2NuevoEgreso = true;
        }

        if (
          newValue.concepto &&
          vm.id_correlativo &&
          (!newValue.statusCalcula || newValue.statusCalcula) &&
          vm.showSeccion3NuevoEgreso === false
        ) {
          vm.showSeccion3NuevoEgreso = true;
        }

        if (newValue.montoopcuentabanco || newValue.montopr) {
          vm.isBotonGuardarEgresoDisabled = false;
        } else {
          vm.isBotonGuardarEgresoDisabled = true;
        }
      },
      deep: true,
    },
    id_correlativo: {
      handler(newValue) {
        if (
          newValue &&
          this.egresos.concepto &&
          this.egresos.statusCalcula &&
          this.showSeccion3NuevoEgreso === false
        ) {
          this.showSeccion3NuevoEgreso = true;
        }
      },
      immediate: true,
    },
    id_coins: {
      handler(newValue) {
        if (
          newValue &&
          this.tipocambio &&
          this.showSeccion4NuevoEgreso === false
        ) {
          this.showSeccion4NuevoEgreso = true;
        }
      },
      immediate: true,
    },
    tipocambio: {
      handler(newValue) {
        if (
          newValue &&
          this.id_coins &&
          this.showSeccion4NuevoEgreso === false
        ) {
          this.showSeccion4NuevoEgreso = true;
        }
      },
      immediate: true,
    },
    checkMaster() {
      this.codigo_master = "";
      if (!!this.checkMaster) {
        this.codigo_master =
          this.$store.state.controlGastos.listControlGastos[0].master_codemaster;
      }
    },
  },
  computed: {
    nombreCodigoPago() {
      let shipment =
        (this.$store.state.controlGastos.listControlGastos[0] &&
          this.$store.state.controlGastos.listControlGastos[0]
            .master_shipment) ||
        "";
      let codigoPago = "";
      switch (shipment) {
        case "LCL":
          codigoPago = "Coloader";
          break;

        case "FCL":
          codigoPago = "Naviera";
          break;

        case "Aéreo":
          codigoPago = "Linea Aerea";
          break;

        default:
          break;
      }
      return codigoPago;
    },
  },
  components: {
    ArrastraYSolarComponent,
  },
};
</script>

<style></style>
