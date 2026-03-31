<template>
  <v-card>
    <v-container fluid class="px-5">
      <v-row no-gutters>
        <v-col v-if="verDatosPreview" :cols="verPrevisualizacion ? 4 : 12">
          <div class="clsSequence">
            <v-stepper v-model="e6" vertical non-linear>
              <v-stepper-step :editable="true" :complete="e6 > 1" step="1">
                SERVICIO
              </v-stepper-step>

              <v-stepper-content step="1">
                <v-row>
                  <v-col cols="12">
                    <!-- <v-checkbox
                  @change="checkNoAplica(1)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.servicio"
                ></v-checkbox> -->
                    <v-text-field
                      placeholder="Individual/ Grupal"
                      v-model="datosManuales.servicio"
                      ref="txtServicio"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="continuarEmail">
                      Continue
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 2" step="2">
                EMAIL DE SEGUIMIENTO
              </v-stepper-step>

              <v-stepper-content step="2">
                <v-row>
                  <v-col cols="12">
                    <!-- <v-checkbox
                  @change="checkNoAplica(2)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.email"
                ></v-checkbox> -->
                  </v-col>
                  <v-col cols="12">
                    <p class="red--text">
                      Email de Seguimiento con el coloader o Agente donde se
                      consiguió la tarifa
                    </p>
                    <v-text-field
                      placeholder="example@mail.com"
                      v-model="datosManuales.email"
                      ref="txtEmail"
                      :rules="[
                        (v) => !datosManualesNoAplica.email,
                        (v) => !!v || 'Dato Requerido',
                        (v) =>
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                          'Formato de correo no válido',
                      ]"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuarListaDiaFecha"
                    >
                      Continue
                    </v-btn>
                    <v-btn color="error" class="mx-1" @click="regresar()">
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 3" step="3">
                CARGA LISTA DIA FECHA
              </v-stepper-step>

              <v-stepper-content step="3">
                <v-row>
                  <!-- <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(3)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.listDiaFecha"
                ></v-checkbox>
              </v-col> -->
                  <v-col cols="12">
                    <v-textarea
                      rows="1"
                      auto-grow
                      placeholder=""
                      v-model="datosManuales.listDiaFecha"
                      ref="txtcondiciones"
                      class="txtNroFactura"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" class="mx-1" @click="continuar">
                      Continue
                    </v-btn>
                    <v-btn color="error" class="mx-1" @click="regresar()">
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 4" step="4">
                GRUPO DE WHATSAPP
              </v-stepper-step>

              <v-stepper-content step="4">
                <v-row>
                  <!-- <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(4)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.grupoWhatsapp"
                ></v-checkbox>
              </v-col> -->
                  <v-col cols="12">
                    <v-textarea
                      rows="1"
                      auto-grow
                      placeholder=""
                      v-model="datosManuales.grupoWhatsapp"
                      ref="txtcondiciones"
                      class="txtNroFactura"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" class="mx-1" @click="continuar">
                      Continue
                    </v-btn>
                    <v-btn color="error" class="mx-1" @click="regresar()">
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 5" step="5">
                SE ADJUNTA
              </v-stepper-step>

              <v-stepper-content step="5">
                <v-row>
                  <v-col cols="12">
                    <p class="red--text">
                      si se adjunta todo lo que más puedas facturas permisos,
                      fotos, y cualquier información relevante
                    </p>
                  </v-col>
                  <v-col cols="12">
                    <v-file-input
                      small-chips
                      label="Se pueden cargar varios archivos a la vez"
                      v-model="files"
                      counter
                      multiple
                      show-size
                      dense
                    />

                    <div
                      v-if="
                        datosManuales.table_allpath_list &&
                        datosManuales.table_allpath_list.length > 0
                      "
                    >
                      <p
                        v-for="(
                          file, index
                        ) in datosManuales.table_allpath_list"
                        :key="index"
                      >
                        {{ file.nombre || "" }}
                        <v-btn
                          color="default"
                          icon
                          :href="file.url"
                          target="_blank"
                          ><v-icon>mdi-file</v-icon></v-btn
                        >
                      </p>
                    </div>

                    <!-- <v-textarea
                  rows="1"
                  auto-grow
                  placeholder=""
                  v-model="datosManuales.grupoWhatsapp"
                  ref="txtcondiciones"
                  class="txtNroFactura"
                /> -->
                  </v-col>
                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuarCargarArchivos()"
                    >
                      Continue
                    </v-btn>
                    <v-btn color="error" class="mx-1" @click="regresar()">
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 6" step="6">
                DEBEMOS PAGAR AL PROVEEDOR
              </v-stepper-step>

              <v-stepper-content step="6">
                <v-row>
                  <v-col cols="12">
                    <p class="red--text">
                      solo aplica si el cliente nos cancela a nosotros y
                      nosotros debemos pagar al proveedor
                    </p>
                    <v-select
                      dense
                      :items="cboSiNo"
                      v-model="datosManuales.pagarProveedor"
                      outlined
                      label="Si/ No"
                      hide-details
                    ></v-select>
                  </v-col>

                  <v-col cols="12">
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuarPagarProveedor"
                    >
                      Continue
                    </v-btn>
                    <v-btn color="error" class="mx-1" @click="regresar()">
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 7" step="7">
                ESCOGE UNA OPCIÓN DE PAGO
              </v-stepper-step>
              <v-stepper-content step="7">
                <v-row>
                  <v-col cols="12" v-if="datosManuales.pagarProveedor">
                    <v-radio-group
                      v-model="datosManuales.metodoPagarProveedor"
                      dense
                    >
                      <v-radio label="Transferencia Internacional" value="1" />
                      <v-radio label="Pago por Alibaba" value="2" />
                      <v-radio label="Otros" value="3" />
                    </v-radio-group>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!--  -->
              <v-stepper-step :editable="true" :complete="e6 > 8" step="8">
                DONDE SE DEBE PAGAR
              </v-stepper-step>
              <v-stepper-content step="8">
                <v-row>
                  <v-col cols="12">
                    <p class="red--text">
                      solo aplica si el cliente nos cancela a nosotros...
                    </p>
                    <v-checkbox
                      @change="checkNoAplica(8)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.dondePagar"
                    ></v-checkbox>
                    <v-text-field
                      v-model="datosManuales.dondePagar"
                      ref="txtClientePago"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 9" step="9">
                MONTO A PAGAR
              </v-stepper-step>
              <v-stepper-content step="9">
                <v-row>
                  <v-col cols="12">
                    <p class="red--text">
                      solo aplica si el cliente nos cancela a nosotros...
                    </p>
                    <v-checkbox
                      @change="checkNoAplica(9)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.monto"
                    ></v-checkbox>
                    <v-text-field
                      v-model="datosManuales.monto"
                      type="number"
                      placeholder="0.00"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 10" step="10">
                CLIENTE YA NOS PAGÓ
              </v-stepper-step>
              <v-stepper-content step="10">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(10)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.clientePago"
                    ></v-checkbox>
                    <v-text-field
                      v-model="datosManuales.clientePago"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 11" step="11">
                LINK DE PAGO o DATOS DE LA TRANSFERENCIA INTERNACIONAL
              </v-stepper-step>
              <v-stepper-content step="11">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(11)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.linkDePago"
                    ></v-checkbox>
                    <v-text-field
                      v-model="datosManuales.linkDePago"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 12" step="12">
                CONDICIONES DE LINK DE CONTRATO DE ALIBABA
              </v-stepper-step>
              <v-stepper-content step="12">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(12)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.condicionesLink"
                    ></v-checkbox>
                    <v-textarea
                      v-model="datosManuales.condicionesLink"
                      auto-grow
                      rows="1"
                    />
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 13" step="13">
                PAGO DE TRANSFERENCIA INTERNACIONAL
              </v-stepper-step>
              <v-stepper-content step="13">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(13)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.nroFactura"
                    ></v-checkbox>
                    <v-text-field
                      v-model="datosManuales.nroFactura"
                      class="txtNroFactura"
                    />
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 14" step="14">
                SEGURO DE MERCANCIA
              </v-stepper-step>
              <v-stepper-content step="14">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="datosManuales.seguro"
                      placeholder="Si/No"
                    />
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 15" step="15">
                OBSERVACIONES ADICIONALES 1
              </v-stepper-step>
              <v-stepper-content step="15">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(15)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.observacion1"
                    ></v-checkbox>
                    <v-textarea
                      v-model="datosManuales.observacion1"
                      auto-grow
                      rows="1"
                    />
                  </v-col>
                </v-row>
              </v-stepper-content>

              <v-stepper-step :editable="true" :complete="e6 > 16" step="16">
                OBSERVACIONES ADICIONALES 2
              </v-stepper-step>
              <v-stepper-content step="16">
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      @change="checkNoAplica(16)"
                      label="No Aplica"
                      v-model="datosManualesNoAplica.observacion2"
                    ></v-checkbox>
                    <v-textarea
                      v-model="datosManuales.observacion2"
                      auto-grow
                      rows="1"
                    />
                  </v-col>
                </v-row>
              </v-stepper-content>
            </v-stepper>
          </div>
          <!-- <v-card-actions v-if="e6 > 15 || $store.state.pricing.aprobadoflag">
            <v-btn
              class="mx-2"
              color="success"
              @click="setDatosInstructivo"
              v-if="!$store.state.pricing.aprobadoflag"
            >
              Guardar Datos Manuales
            </v-btn>
            <v-btn
              class="mx-2"
              color="success"
              @click="generarHTML"
              v-if="$store.state.pricing.aprobadoflag"
            >
              Generar Instructivo
            </v-btn>
            <v-btn
              class="mx-2"
              color="info"
              @click="generarHTMLPDF(false)"
              v-if="$store.state.pricing.aprobadoflag"
            >
              Generar PDF Instructivo
            </v-btn>
            <v-btn
              class="mx-2"
              color="warning"
              @click="generarHTMLPDF(true)"
              v-if="$store.state.pricing.aprobadoflag"
            >
              Guardar Pdf Instructivo
            </v-btn>
            <v-btn color="error" class="mx-1" @click="regresar()">
              VOLVER
            </v-btn>
          </v-card-actions>
           -->
        </v-col>
        <v-col
          v-if="verPrevisualizacion"
          :cols="verDatosPreview ? 8 : 12"
          class="px-10"
        >
          <v-tabs color="deep-purple accent-4" right v-model="tabPreview">
            <v-spacer></v-spacer>
            <v-tabs-slider></v-tabs-slider>
            <v-tab href="#op">INSTRUCTIVO A OPERACIONES</v-tab>
            <v-tab href="#agente">INSTRUCTIVO AL AGENTE</v-tab>
            <v-tabs-items v-model="tabPreview" class="mt-5">
              <v-tab-item value="op">
                <div class="clsInstructivo">
                  <v-simple-table>
                    <tbody>
                      <tr>
                        <td valign="top" style="border: solid windowtext 1pt">
                          <p class="MsoNormal my-0">FECHA</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border: solid windowtext 1pt;
                            border-left: none;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ fecha || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">ASESOR/ PRICING</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ asesor ? asesor.name : "" }}
                            / {{ asesorPricing ? asesorPricing.name : "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">N° QUOTE</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ this.nro_quote || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">TIPO DE EMBARQUE</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ Shipment.code || "" }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">SERVICIO</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.servicio || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">COLOADER/AGENTE</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0 my-0">
                            Datos:
                            {{ this.proveedorInstructivo.namelong || "" }}
                          </p>
                          <p class="MsoNormal my-0 my-0">
                            Contacto:
                            {{ this.proveedorInstructivo.contacto || "" }}
                          </p>
                          <p class="MsoNormal my-0 my-0">
                            Téfono:
                            {{ this.proveedorInstructivo.contacto_phone || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">Email de Seguimiento</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ this.datosManuales.email || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">PUERTO DE SALIDA</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ puertoOrigen ? puertoOrigen.name : "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            DATOS DE LA CARGA <br />
                            <span style="color: red"
                              >Si es EXWORD enviar dirección de recolecta</span
                            >
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            INCOTERMS: {{ incoterms.name || "" }}<br />
                            PESO:{{ datosPrincipales.peso || "" }} KG<br />
                            VOLUMEN:
                            {{ datosPrincipales.volumen || "" }} M3<br />
                            TIPO DE MERCANCIA:
                            {{ datosPrincipales.descripcioncarga || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">DETALLES DEL PROVEEDOR</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            NOMBRE: {{ proveedor.namelong || "" }} <br />
                            CONTACTO: {{ proveedor.contacto || "" }} <br />
                            EMAIL:
                            <a :href="`mailto:${proveedor.addressProveedor}`">
                              {{ proveedor.addressProveedor || "" }} </a
                            ><br />
                            TELEFONO: {{ proveedor.contacto_phone || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">CLIENTE / RAZON SOCIAL</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ cliente ? cliente.nombrecompleto : "" }} <br />
                            RUC: {{ cliente ? cliente.document : "" }} <br />
                            DIRECCION: {{ cliente ? cliente.address : "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0"><b>NOTIFY</b></p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            PIC LOGISTICA SAC <br />
                            RUC: 20609852861 <br />
                            AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br />
                            Contacto: Carlos Ramirez <br />
                            CORREO: ASESOR2@PIC-CARGO.COM
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>CARGA LISTA DIA FECHA</b>
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.listDiaFecha }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0"><b>GRUPO DE WHATSAPP</b></p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.grupoWhatsapp }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0"><b>SE ADJUNTA</b></p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p
                            class="MsoNormal my-0"
                            v-html="formatearArchivos"
                          ></p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0"><b>TIPO DE MERCANCIA</b></p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosPrincipales.descripcioncarga || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>DEBEMOS PAGAR AL PROVEEDOR</b>
                          </p>
                          <span style="color: red"
                            >Solo aplica si el cliente nos cancela a nosotros y
                            nosotros debemos pagar al proveedor</span
                          >
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.pagarProveedor || "" }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>DONDE SE DEBE PAGAR</b>
                          </p>
                          <span style="color: red"
                            >Solo aplica si el cliente nos cancela a nosotros y
                            nosotros debemos pagar al proveedor</span
                          >
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.dondePagar }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b
                              >LINK DE PAGO o DATOS DE A TRANSFERENCIA
                              INTERNACIONAL</b
                            >
                          </p>
                          <span style="color: red"
                            >Recuerda debes cobrar la comisión bancaria</span
                          >
                          <span style="color: red"
                            >Solo aplica si el cliente nos cancela a nosotros y
                            nosotros debemos pagar al proveedor</span
                          >
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.linkDePago }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>CONDICIONES DE LINK DE CONTRATO DE ALIBABA</b>
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.condicionesLink }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>PAGO DE TRANSFERENCIA INTERNCIONAL</b>
                          </p>
                          <span style="color: red"
                            >DEBE PONERSE EL NUMERO DE FACTURA</span
                          >
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.nroFactura }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            <b>SEGURO DE MERCANCIA</b>
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.seguro }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            OBSERVACIONES ADICIONALES 1
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.observacion1 }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            OBSERVACIONES ADICIONALES 2
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.observacion2 }}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">CARPETA OPERATIVA</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p
                            class="MsoNormal my-0"
                            v-if="datosPrincipales.url_folderonedriveexp"
                          >
                            CARPETA OPERATIVA
                            <a
                              :href="datosPrincipales.url_folderonedriveexp"
                              target="_blank"
                              style="color: blue; font-weight: bold"
                              >CLICK AQUÍ</a
                            >
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </div>
              </v-tab-item>
              <v-tab-item value="agente">
                <div class="clsInstructivo">
                  <v-simple-table>
                    <tbody>
                      <tr>
                        <td valign="top" style="border: solid windowtext 1pt">
                          <p class="MsoNormal my-0">PUERTO DE SALIDA</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border: solid windowtext 1pt;
                            border-left: none;
                          "
                        >
                          {{ puertoOrigen ? puertoOrigen.name : "" }}
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">TIPO DE EMBARQUE</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ Shipment.code || "" }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">
                            DATOS DE LA CARGA Si es EXWORK enviar dirección de
                            recolecta
                          </p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            INCOTERMS: {{ incoterms.name || "" }}<br />
                            PESO:{{ datosPrincipales.peso || "" }} KG<br />
                            VOLUMEN:
                            {{ datosPrincipales.volumen || "" }} M3<br />
                            TIPO DE MERCANCIA:
                            {{ datosPrincipales.descripcioncarga || "" }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">DETALLES DEL PROVEEDOR</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            NOMBRE: {{ proveedor.namelong || "" }} <br />
                            CONTACTO: {{ proveedor.contacto || "" }} <br />
                            EMAIL:
                            <a :href="`mailto:${proveedor.addressProveedor}`">
                              {{ proveedor.addressProveedor || "" }} </a
                            ><br />
                            TELEFONO: {{ proveedor.contacto_phone || "" }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">CLIENTE / RAZON SOCIAL</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ cliente ? cliente.nombrecompleto : "" }} <br />
                            RUC: {{ cliente ? cliente.document : "" }} <br />
                            DIRECCION: {{ cliente ? cliente.address : "" }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">NOTIFY</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          PIC LOGISTICA SAC <br />
                          RUC: 20609852861 <br />
                          AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br />
                          Contacto: Carlos Ramirez <br />
                          CORREO: ASESOR2@PIC-CARGO.COM
                        </td>
                      </tr>
                      <tr>
                        <td
                          valign="top"
                          style="border: solid windowtext 1pt; border-top: none"
                        >
                          <p class="MsoNormal my-0">CARGA LISTA DIA FECHA</p>
                        </td>
                        <td
                          valign="top"
                          style="
                            width: 510.5pt;
                            border-top: none;
                            border-left: none;
                            border-bottom: solid windowtext 1pt;
                            border-right: solid windowtext 1pt;
                          "
                        >
                          <p class="MsoNormal my-0">
                            {{ datosManuales.listDiaFecha }}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </div>
              </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-col>
        <v-col cols="12 my-5">
          <v-btn
            color="success"
            v-if="!aprobadoflag"
            @click="setDatosInstructivo"
          >
            Guardar Borrador Y Continuar
          </v-btn>
          <v-btn
            color="success"
            v-if="aprobadoflag"
            @click="guardarYGenenarCorreo"
            class="mx-1"
          >
            <v-icon class="mx-2">mdi-content-save-move</v-icon> Guardar y Enviar
            Email a Operaciones
          </v-btn>
          <v-btn
            color="red"
            class="mx-1"
            dark
            v-if="aprobadoflag"
            @click="generarHTMLPDF()"
          >
            <v-icon class="mx-2">mdi-file-pdf-box</v-icon> Imprimir
          </v-btn>
          <v-btn color="#E65100" dark @click="$emit('cerrarDialogo')">
            <v-icon class="mx-1">mdi-close</v-icon> Cerrar
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import moment from "moment";
import Swal from "sweetalert2";
import axios from "axios";
import { mapActions } from "vuex";

export default {
  props: {
    aprobadoflag: {
      type: Boolean,
      default: false,
    },
    verPrevisualizacion: {
      type: Boolean,
      default: true,
    },
    verDatosPreview: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      nro_quote: "",
      cboSiNo: [
        { value: true, text: "Si" },
        { value: false, text: "No" },
      ],
      fecha: moment().format("YYYY-MM-DD HH:MM"),
      tabPreview: "op",
      Modality: null,
      Shipment: null,
      Incoterms: null,
      Proveedor: null,
      proveedorInstructivo: {},
      asesor: {},
      asesorPricing: {},
      incoterms: {},
      proveedor: {},
      cliente: {},
      pricing: this.$store.state.pricing,
      datosPrincipales: this.$store.state.pricing.datosPrincipales,
      files: [],
      datosFile: [],
      e6: 1,
      datosManualesNoAplica: {
        servicio: false,
        email: false,
        monto: false,

        clientePago: false,
        linkDePago: false,
        condiciones: false,
        nroFactura: false,
        seguro: false,
        observacion1: false,
        observacion2: false,
      },
      datosManuales: {
        servicio: "",
        email: "",
        monto: 0,
        listDiaFecha: "",
        grupoWhatsapp: "",
        pagarProveedor: true,
        metodoPagarProveedor: "1",
        condicionesLink: "",
        dondePagar: "",
        clientePago: "",
        linkDePago: "",
        condiciones: "",
        nroFactura: "",
        seguro: "",
        observacion1: "",
        observacion2: "",
        id_path: [],
      },
      puertoOrigen: null,
      puertoDestino: null,
    };
  },
  methods: {
    ...mapActions([
      "uploadFileFromUrlToOneDrive",
      "guardarDatosInstructivo",
      "quotePreviewInstructivoManual",
      "verPuerto",
    ]),
    cambiarPagarProvedor() {
      this.datosManuales.condicionesLink = "No Aplica";
      this.datosManuales.dondePagar = "No Aplica";
      this.datosManuales.clientePago = "No Aplica";
      this.datosManuales.linkDePago = "No Aplica";
      this.datosManuales.condiciones = "No Aplica";
      this.datosManuales.nroFactura = "No Aplica";
      this.e6 = 13;
    },
    continuarEmail() {
      if (!this.datosManuales.servicio) {
        this.$refs.txtServicio.focus();
        return;
      }
      this.e6 = 2;
    },

    setDatosInstructivo() {
      this.guardarDatosInstructivo({
        id: this.$route.params.id,
        datosInstructivoManual: this.datosManuales,
      });
      this.$emit("continuar");
    },
    continuarListaDiaFecha() {
      if (!this.datosManuales.email) {
        this.$refs.txtEmail.focus();
        return;
      }
      // const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!expresion.test(this.datosManuales.email)) {
      //   console.log("d");
      //   this.$refs.txtEmail.focus();
      //   return;
      // }
      this.e6 = 3;
    },
    continuarPagarProveedor() {
      if (this.datosManualesNoAplica.pagarProveedor) {
        this.e6 = 11;
        return;
      }
      this.continuar();
    },
    continuar() {
      this.e6++;
    },
    regresar() {
      this.e6--;
    },
    continuarCargarArchivos() {
      this.datosManuales.id_path = [];
      this.datosFile = [];
      for (let index = 0; index < this.files.length; index++) {
        this._uploadFile(index);
      }
      this.e6++;
    },
    async _uploadFile(i) {
      var FormData = require("form-data");
      var fs = require("fs");
      var data = new FormData();
      var vm = this;
      let nameWithoutExtension = vm.files[i].name.replace(/\.[^/.]+$/, "");
      data.append("name", nameWithoutExtension);
      data.append("file", vm.files[i]);
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "uploadAllPath",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          // this.datosManuales.id_path =
          let res = response.data.data[0];
          vm.datosManuales.id_path.push(res.insertid);
          vm.datosFile.push({
            name: nameWithoutExtension,
            url: res.ruta,
          });
          await vm.uploadFileFromUrlToOneDrive({
            fileUrl: res.ruta,
            destinationFolderUrl:
              vm.$store.state.pricing.datosPrincipales.url_folderonedrive,
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    guardarYGenenarCorreo() {
      Promise.all([
        this.guardarDatosInstructivo({
          id: this.$route.params.id,
          datosInstructivoManual: this.datosManuales,
        }),
        this.generarHTML(),
        this.generarHTMLPDF(true),
        // this.generarHTMLPDF(),
      ]);
    },
    async generarHTMLPDF(guardarFlag) {
      const state = this.$store.state.pricing;
      const main = state.datosPrincipales;
      const cliente = state.dataCliente;

      // 1. Buscamos con fallback a objeto vacío para evitar errores de .name

      // 2. Limpieza de nombres para el subject
      const nro_quote_clean = (state.nro_quote || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s-]+/g, "_");

      const nombre_clean = (cliente.nombrecompleto || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s-]+/g, "_");

      // 3. Construcción segura del subject

      const subjectStr = `INSTRUCTIVO_VENTAS_${nro_quote_clean}_EXPEDIENTE_${this.pricing.nro_exp}`;
      const subject = encodeURIComponent(subjectStr);

      // 4. Ejecución del preview/guardado
      await this.quotePreviewInstructivoManual({
        guardarFlag: guardarFlag,
        subject: subject,
        asesor: this.asesor.name || "",
        asesorPricing: this.asesorPricing.name || "",
        nro_quote: state.nro_quote || "",
        servicio: this.datosManuales.servicio || "",
        email: this.datosManuales.email || "",
        PortBegin: this.puertoOrigen.name || "",
        Incoterms: this.incoterms.name || "",
        peso: main.peso || 0,
        volumen: main.volumen || 0,
        descripcioncarga: main.descripcioncarga || "",
        nombrecompletoProveedor: this.proveedor.namelong || "",
        contactoProveedor: this.proveedor.contacto || "",
        addressProveedor: this.proveedor.emailaddress || "",
        contactoPhoneProveedor: this.proveedor.contacto_phone || "",
        nombrecompletoCliente: cliente.nombrecompleto || "",
        documentCliente: cliente.document || "",
        addressCliente: cliente.address || "",
        emailaddressCliente: state.emailaddress || "",
        listDiaFecha: this.datosManuales.listDiaFecha || "",
        grupoWhatsapp: this.datosManuales.grupoWhatsapp || "",
        Shipment: this.Shipment.name || "",
        url_folderonedrive: this.datosPrincipales.url_folderonedrive,
        url_folderonedriveexp: this.datosPrincipales.url_folderonedriveexp,
        pagarProveedor: this.datosManuales.pagarProveedor || "",
        dondePagar: this.datosManuales.dondePagar || "",
        linkDePago: this.datosManuales.linkDePago || "",
        condicionesLink: this.datosManuales.condicionesLink || "",
        nroFactura: this.datosManuales.nroFactura || "",
        seguro: this.datosManuales.seguro || "",
        observacion1: this.datosManuales.observacion1 || "",
        observacion2: this.datosManuales.observacion2 || "",
        namelongColoader: this.proveedorInstructivo.namelong || "",
        contactoColoader: this.proveedorInstructivo.contacto || "",
        phoneColoader: this.proveedorInstructivo.contacto_phone || "",
        seAdjunta:
          this.datosFile && this.datosFile.length > 0
            ? this.datosFile
                .map((file) => `• ${file.nombre || file}`)
                .join("<br />")
            : "No hay archivos",
        url_logo: JSON.parse(sessionStorage.getItem("dataBranch"))[0].logo,
        document: JSON.parse(sessionStorage.getItem("dataBranch"))[0].document,
        address: JSON.parse(sessionStorage.getItem("dataBranch"))[0].address,
        phone: JSON.parse(sessionStorage.getItem("dataBranch"))[0].phone,
      });
    },
    async generarHTML() {
      // 2. Formateo de archivos adjuntos
      const listaArchivos =
        this.datosFile?.length > 0
          ? this.datosFile.map((f) => `• ${f.nombre || f}`).join("<br />")
          : "No hay archivos";
      // 3. Construcción del Template HTML
      const htmlTable = `
        <p> Hola Compañero</p>
        <p>Hemos logrado cerrar esta nueva carga abajo los detalles </p>
        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-family: Arial, sans-serif; width: 100%;">
          <tbody>
            ${this._tr("FECHA", moment().format("DD/MM/YYYY"))}
            ${this._tr("ASESOR", this.asesor.name)}
            ${this._tr("N° QUOTE", this.pricing.nro_quote)}
            ${this._tr("TIPO DE EMBARQUE", this.Shipment.code)}
            ${this._tr("SERVICIO", this.datosManuales.servicio)}
            ${this._tr(
              "COLOADER/AGENTE",
              `
              <b>Datos:</b> ${this.proveedorInstructivo.namelong}<br>
              <b>Contacto:</b> ${this.proveedorInstructivo.contacto}<br>
              <b>Teléfono:</b> ${this.proveedorInstructivo.contacto_phone}
            `,
            )}
            ${this._tr("Email de Seguimiento", this.datosManuales.email)}
            ${this._tr("PUERTO DE SALIDA", this.puertoOrigen.name || "")}
            ${this._tr(
              "DATOS DE LA CARGA<br><span style='color:red;font-size:10px;'>Si es EXW enviar dirección de recolecta</span>",
              `
              INCOTERMS: ${this.incoterms.name || ""}<br>
              PESO: ${this.datosPrincipales.peso || 0} KG<br>
              VOLUMEN: ${this.datosPrincipales.volumen || 0} M3<br>
              TIPO DE MERCANCIA: ${this.datosPrincipales.descripcioncarga || ""}
            `,
            )}
            ${this._tr(
              "DETALLES DEL PROVEEDOR",
              `
              NOMBRE: ${this.proveedor.namelong || ""}<br>
              CONTACTO: ${this.proveedor.contacto || ""}<br>
              EMAIL: ${this.proveedor.emailaddress || ""}<br>
              TELÉFONO: ${this.proveedor.contacto_phone || ""}
            `,
            )}
            ${this._tr(
              "CLIENTE / RAZON SOCIAL",
              `
              ${this.pricing.dataCliente.nombrecompleto || ""}<br>
              RUC: ${this.pricing.dataCliente.document || ""}<br>
              DIRECCIÓN: ${this.pricing.dataCliente.address || ""}<br>
              EMAIL: ${this.pricing.emailaddress || ""}
            `,
            )}
            ${this._tr(
              "<b>NOTIFY</b>",
              `
              PIC LOGISTICA SAC <br>
              RUC: 20609852861 <br>
              AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
              Contacto: Carlos Ramirez <br>
              CORREO: ASESOR2@PIC-CARGO.COM
            `,
            )}
            ${this._tr(
              "CARGA LISTA DIA FECHA",
              this.datosManuales.listDiaFecha,
            )}
            ${this._tr("GRUPO DE WHATSAPP", this.datosManuales.grupoWhatsapp)}
            ${this._tr("SE ADJUNTA", listaArchivos)}
            ${this._tr(
              "DEBEMOS PAGAR AL PROVEEDOR",
              this.datosManuales.pagarProveedor,
            )}
            ${this._tr("DONDE SE DEBE PAGAR", this.datosManuales.dondePagar)}
            ${this._tr(
              "LINK DE PAGO / TRANSFERENCIA",
              this.datosManuales.linkDePago,
            )}
            ${this._tr(
              "CONDICIONES ALIBABA",
              this.datosManuales.condicionesLink,
            )}
            ${this._tr("NRO FACTURA", this.datosManuales.nroFactura)}
            ${this._tr("SEGURO", this.datosManuales.seguro)}
            ${this._tr("OBSERVACIONES 1", this.datosManuales.observacion1)}
            ${this._tr("OBSERVACIONES 2", this.datosManuales.observacion2)}
            ${
              this.datosPrincipales.url_folderonedriveexp
                ? this._tr(
                    "CARPETA OPERATIVA",
                    `<a href="${this.datosPrincipales.url_folderonedriveexp}" target="_blank" style="color: blue; font-weight: bold;">CLICK AQUÍ</a>`,
                  )
                : ""
            }
          </tbody>
        </table>
        <p>Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos</p>`;

      try {
        // 4. Copiar al Portapapeles
        const blob = new Blob([htmlTable], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob }),
        ]);

        alert(
          "Tabla copiada. Se abrirá Outlook; pega el contenido con Ctrl+V.",
        );

        // 5. Configuración del correo
        // Función para quitar tildes
        const clean = (str) =>
          str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

        // Aplicación en tu constante
        const subject = `EXPEDIENTE-${this.pricing.nro_exp} QUOTE ${
          this.pricing.nro_quote
        } ${clean(this.pricing.dataCliente.nombrecompleto)} ${clean(
          this.incoterms.name,
        )} ${clean(this.Modality.name)}`;

        const body =
          "Hola colega, adjunto los detalles del expediente (Pega la tabla aquí):\n\n";

        setTimeout(() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(
            subject,
          )}&body=${encodeURIComponent(body)}`;
          this.abrirModalSegundoCorreo();
        }, 500);
      } catch (err) {
        console.error("Error:", err);
        alert("Error al copiar automáticamente.");
      }
    },

    // Método auxiliar para no repetir tanto código de filas

    abrirModalSegundoCorreo() {
      setTimeout(() => {
        Swal.fire({
          icon: "info",
          title: "",
          html: `
          <h1 style="font-size: 2.5em; font-weight: bold;">📧 Crear email al agente</h1>

              <h1 style="font-size: 2em; font-weight: bold;">🚨 OBLIGATORIO</h1>
              <h2 style="font-size: 1.5em;">Antes de abrir el segundo correo, primero envía el email a Operaciones.</h2>
            `,
          confirmButtonText: "☑️ Ya envié el email a Operaciones. Continuar",
          showCancelButton: true,
          cancelButtonText: "Cancelar",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
          confirmButtonColor: "#00C853",
          cancelButtonColor: "red",
          // 2. Personalización de tamaños mediante clases
          customClass: {
            title: "custom-title-class",
            confirmButton: "custom-button-class",
          },

          didOpen: () => {
            const confirmBtn = Swal.getConfirmButton();
            const cancelBtn = Swal.getCancelButton();
            confirmBtn.style.display = "none";
            cancelBtn.style.display = "none";

            setTimeout(() => {
              confirmBtn.style.display = "inline-block";
              cancelBtn.style.display = "inline-block";
            }, 2000);
          },
        }).then((res) => {
          if (res.isConfirmed) {
            this.GenerartSegundoCorreo();
          }
        });
      }, 3000);
    },
    async GenerartSegundoCorreo() {
      const cargaDetalles = `
            <strong>INCOTERMS:</strong> ${this.incoterms.name || ""}<br/>
            <strong>PESO:</strong> ${this.datosPrincipales.peso || 0} KG <br/>
            <strong>VOLUMEN:</strong> ${
              this.datosPrincipales.volumen || 0
            } M3 <br/>
            <strong>TIPO DE MERCANCIA:</strong> ${
              this.datosPrincipales.descripcioncarga || ""
            }
          `;

      const proveedorDetalles = `
            NOMBRE: ${this.proveedor.namelong || ""}<br>
            CONTACTO: ${this.proveedor.contacto || ""}<br>
            EMAIL: ${this.proveedor.emailaddress || ""}<br>
            TELÉFONO: ${this.proveedor.contacto_phone || ""}
          `;

      const clienteDetalles = `
              ${this.pricing.dataCliente.nombrecompleto || ""}<br />
              RUC: ${this.pricing.dataCliente.document || ""}<br />
              DIRECCION: ${this.pricing.dataCliente.address || ""} <br />
              EMAIL: ${
                this.pricing.emailaddress
                  ? `<a href="mailto:${this.pricing.emailaddress}">${this.pricing.emailaddress}</a>`
                  : ""
              }
            `;

      const htmlBody = `
            <p>Hola Colega Por aquí tenemos una nueva carga, por indicarnos tu numero de routing order y que Customer seguirá el tema</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
              <tbody>
                ${this._tr("PUERTO DE SALIDA", this.puertoOrigen.name || "")}
                ${this._tr("TIPO DE EMBARQUE", this.Shipment.code || "")}
                ${this._tr(
                  "DATOS DE LA CARGA<br/><small style='font-weight:normal;'>Si es EXWORK enviar dirección de recolecta</small>",
                  cargaDetalles,
                )}
                ${this._tr("DETALLES DEL PROVEEDOR", proveedorDetalles)}
                ${this._tr("CLIENTE / RAZON SOCIAL", clienteDetalles)}
                ${this._tr(
                  "NOTIFY",
                  "PIC LOGISTICA SAC<br/>RUC: 20609852861<br/>AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br/>Contacto: Carlos Ramirez<br/>CORREO: ASESOR2@PIC-CARGO.COM",
                )}
                ${this._tr(
                  "CARGA LISTA DIA FECHA",
                  this.datosManuales.listDiaFecha || "Pendiente",
                )}
              </tbody>
            </table>
          <p>Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos</p>`;

      try {
        const blob = new Blob([htmlBody], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob }),
        ]);

        alert("Copiado. Se abrirá Outlook. (Usa Ctrl+V)");

        // Construcción del Subject (Sin caracteres especiales que rompan la URL)
        const clean = (str) =>
          str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

        // Aplicación en tu constante
        const subject = `EXPEDIENTE-${this.pricing.nro_exp} QUOTE ${
          this.pricing.nro_quote
        } ${clean(this.pricing.dataCliente.nombrecompleto)} ${clean(
          this.incoterms.name,
        )} ${clean(this.Modality.name)}`;

        window.location.href = `mailto:${
          this.cliente.emailaddress || ""
        }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
          "Hola colega, (PEGA LA TABLA AQUÍ)",
        )}`;

        this.$emit("continuar");
      } catch (err) {
        console.error("Error:", err);
        alert("Hubo un problema al copiar los datos.");
      }
    },
    checkNoAplica(step) {
      const campos = {
        1: "servicio",
        2: "email",
        3: "listDiaFecha",
        4: "grupoWhatsapp",
        6: "pagarProveedor",
        7: "dondePagar",
        8: "monto",
        9: "clientePago",
        10: "linkDePago",
        11: "condicionesLink",
        12: "nroFactura",
        13: "seguro",
        14: "observacion1",
        15: "observacion2",
      };

      const propiedad = campos[step];

      if (propiedad) {
        this.datosManuales[propiedad] = this.datosManualesNoAplica[propiedad]
          ? "No Aplica"
          : "";
      }
    },
    _tr(label, value) {
      return `
    <tr>
      <td valign="top" style="width:123pt; border:solid windowtext 1.0pt; padding:4pt;">
        <p style="margin:0; font-size:11px;">${label}</p>
      </td>
      <td valign="top" style="border:solid windowtext 1.0pt; border-left:none; padding:4pt;">
        <p style="margin:0; font-size:11px;">${value || ""}</p>
      </td>
    </tr>`;
    },

    cargarDatosModality() {
      if (!this.pricing?.listModality || !this.datosPrincipales) return;
      this.Modality =
        this.pricing.listModality.find(
          (v) => v.id == this.datosPrincipales.idsentido,
        ) || {};
      console.log(this.Modality);
    },

    cargarDatosShipment() {
      if (!this.pricing?.listShipment || !this.datosPrincipales) return;
      this.Shipment =
        this.pricing.listShipment.find(
          (v) => v.id == this.datosPrincipales.idtipocarga,
        ) || {};
    },

    cargarDatosProveedor() {
      // OJO: Verifica si itemsProveedorList está en 'pricing' o directamente en 'this'
      const lista = this.pricing?.itemsProveedorList || this.itemsProveedorList;
      if (!lista || !this.datosPrincipales) return;

      this.Proveedor =
        lista.find((v) => v.id == this.datosPrincipales.id_proveedor) || {};
    },
    cargarDatosAsesor() {
      this.asesor = this.encontrar(
        this.pricing.listEjecutivo,
        this.datosPrincipales.id_vendedor,
        "id_entitie",
      );
    },
    cargarDatosAsesorPricing() {
      this.asesorPricing = this.encontrar(
        this.pricing.listEjecutivo,
        this.datosPrincipales.id_pricing,
        "id_entitie",
      );
    },
    cargarDatosIncoterms() {
      this.incoterms = this.encontrar(
        this.pricing.listIncoterms,
        this.datosPrincipales.idincoterms,
      );
    },

    cargarDatosProveedor() {
      this.proveedor = this.encontrar(
        this.$store.state.itemsProveedorList,
        this.datosPrincipales.id_proveedor,
      );
    },
    cargarDatosCliente() {
      this.cliente = { ...this.$store.state.pricing.dataCliente };
      this.cliente.nombre_clean = (this.cliente.nombrecompleto || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s-]+/g, "_");
    },

    encontrar(lista, id, campo = "id") {
      return lista.find((v) => v[campo] == id) || {};
    },

    cargaNroQuote() {
      if (!this.pricing?.nro_quote) {
        this.nro_quote = "";
        return;
      }
      this.nro_quote = this.pricing.nro_quote
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s-]+/g, "_");
    },
  },

  async mounted() {
    if (this.aprobadoflag) {
      this.e6 = 16;
    }
    Promise.all([
      this.cargarDatosModality(),
      this.cargarDatosShipment(),
      this.cargarDatosIncoterms(),
      this.cargarDatosProveedor(),
      this.cargaNroQuote(),
      this.cargarDatosAsesor(),
      this.cargarDatosIncoterms(),
      this.cargarDatosProveedor(),
      this.cargarDatosCliente(),
      this.cargarDatosAsesorPricing(),
    ]);

    const tipoCargaItem = this.$store.state.pricing.listShipment.find(
      (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
    );

    let idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;
    if (this.$store.state.pricing.datosPrincipales.datosinstructivomanual) {
      this.datosManuales =
        this.$store.state.pricing.datosPrincipales.datosinstructivomanual;
      this.datosFile =
        this.$store.state.pricing.datosPrincipales.datosinstructivomanual.table_allpath_list;
      let opcionCostos = this.$store.state.pricing.opcionCostos.filter(
        (v) => !!v.selected,
      );
      let costosFlete = opcionCostos[0].listCostos.filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
      );

      let proveedoresUnicos = [
        ...new Set(costosFlete.map((v) => v.id_proveedor)),
      ];
      this.proveedorInstructivo = this.$store.state.provedores.find(
        (v) => v.id == proveedoresUnicos[0],
      );
    }
    this.puertoOrigen = await this.verPuerto({
      id_transport: idTipoCarga,
      id: this.$store.state.pricing.datosPrincipales.idorigen,
    });
    this.puertoDestino = await this.verPuerto({
      id_transport: idTipoCarga,
      id: this.$store.state.pricing.datosPrincipales.iddestino,
    });
  },
  watch: {
    "datosManuales.pagarProveedor"() {
      console.log(this.datosManuales.pagarProveedor);
      if (!this.datosManuales.pagarProveedor) {
        this.cambiarPagarProvedor();
      }
    },
  },
  computed: {
    formatearArchivos() {
      if (!this.datosFile || this.datosFile.length === 0) {
        return "No hay archivos";
      }
      return this.datosFile.map((f) => `• ${f.nombre || f}`).join("<br />");
    },
  },
};
</script>

<style scoped>
.txtCondiciones {
  field-sizing: content !important;
}

.clsInstructivo {
  height: 450px;
  overflow-y: scroll;
  scrollbar-gutter: stable;
}
.clsSequence {
  height: 500px;
  overflow-y: auto; /* 'auto' es más limpio que 'scroll' */
  scrollbar-gutter: stable;
  position: relative; /* Estabiliza el contexto de posicionado */
  will-change: scroll-position; /* Optimiza el renderizado del scroll */
}

/* Agrega esto a tu archivo CSS */
.custom-title-class {
  font-size: 2.5rem !important; /* Título de la alerta más grande */
}

.custom-button-class {
  font-size: 1.5rem !important; /* Texto del botón más grande */
  padding: 15px 30px !important; /* Botón más amplio */
}
</style>
