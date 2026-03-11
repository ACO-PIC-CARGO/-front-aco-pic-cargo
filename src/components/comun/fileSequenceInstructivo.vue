<template>
  <v-container>
    <v-card>
      <v-card-text>
        <v-stepper v-model="e6" vertical non-linear>
          <v-stepper-step :complete="e6 > 1" step="1">
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

          <v-stepper-step :complete="e6 > 2" step="2">
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
          <v-stepper-step :complete="e6 > 3" step="3">
            CARGA LISTA DIA FECHA
          </v-stepper-step>

          <v-stepper-content step="3">
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(3)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.listDiaFecha"
                ></v-checkbox>
              </v-col>
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
          <v-stepper-step :complete="e6 > 4" step="4">
            GRUPO DE WHATSAPP
          </v-stepper-step>

          <v-stepper-content step="4">
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(4)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.grupoWhatsapp"
                ></v-checkbox>
              </v-col>
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
          <v-stepper-step :complete="e6 > 5" step="5">
            SE ADJUNTA
          </v-stepper-step>

          <v-stepper-content step="5">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  si se adjunta todo lo que más puedas facturas permisos, fotos,
                  y cualquier información relevante
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

                <!-- <div v-if="files.length > 0">
                  <p v-for="(file, index) in files" :key="index">
                    {{ file.name }}
                  </p>
                </div> -->

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
          <v-stepper-step :complete="e6 > 6" step="6">
            DEBEMOS PAGAR AL PROVEEDOR
          </v-stepper-step>

          <v-stepper-content step="6">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
                <v-checkbox
                  @change="checkNoAplica(6)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.pagarProveedor"
                ></v-checkbox>
                <v-text-field
                  placeholder=""
                  v-model="datosManuales.pagarProveedor"
                  ref="txtClientePago"
                ></v-text-field>
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
          <v-stepper-step :complete="e6 > 7" step="7">
            DONDE SE DEBE PAGAR
          </v-stepper-step>

          <v-stepper-content step="7">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
                <v-checkbox
                  @change="checkNoAplica(7)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.dondePagar"
                ></v-checkbox>
                <v-text-field
                  placeholder=""
                  v-model="datosManuales.dondePagar"
                  ref="txtClientePago"
                ></v-text-field>
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
          <v-stepper-step :complete="e6 > 8" step="8">
            MONTO A PAGAR
          </v-stepper-step>

          <v-stepper-content step="8">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
                <v-checkbox
                  @change="checkNoAplica(8)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.monto"
                ></v-checkbox>
                <v-text-field
                  placeholder="0.00"
                  v-model="datosManuales.monto"
                  ref="txtMonto"
                  type="number"
                ></v-text-field>
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
          <v-stepper-step :complete="e6 > 9" step="9">
            CLIENTE YA NOS PAGOS
          </v-stepper-step>

          <v-stepper-content step="9">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  Solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
                <v-checkbox
                  @change="checkNoAplica(9)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.clientePago"
                ></v-checkbox>
                <v-text-field
                  placeholder=""
                  v-model="datosManuales.clientePago"
                  ref="txtClientePago"
                ></v-text-field>
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
          <v-stepper-step :complete="e6 > 10" step="10">
            LINK DE PAGO o DATOS DE A TRANSFERENCIA INTERNACIONAL
          </v-stepper-step>

          <v-stepper-content step="10">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  Recuerda debes cobrar la comisión bancaria solo aplica si el
                  cliente nos cancela a nosotros y nosotros debemos pagar al
                  proveedor
                </p>
                <v-checkbox
                  @change="checkNoAplica(10)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.linkDePago"
                ></v-checkbox>
                <v-text-field
                  placeholder=""
                  v-model="datosManuales.linkDePago"
                  ref="txtLink"
                ></v-text-field>
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

          <v-stepper-step :complete="e6 > 11" step="11">
            CONDICIONES DE LINK DE CONTRATO DE ALIBABA
          </v-stepper-step>

          <v-stepper-content step="11">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  DEBE ESTAR DETALLADO ESPECIFICAR UNIDADES ITEMS Y DEBE
                  COINCIDIR CON EL INVOCE POR SI SUNAT LO OBSERVA
                </p>
                <v-checkbox
                  @change="checkNoAplica(11)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.condicionesLink"
                ></v-checkbox>
                <v-textarea
                  auto-grow
                  rows="1"
                  placeholder=""
                  v-model="datosManuales.condicionesLink"
                  ref="txtLink"
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
          <v-stepper-step :complete="e6 > 12" step="12">
            PAGO DE TRANSFERENCIA INTERNCIONAL
          </v-stepper-step>

          <v-stepper-content step="12">
            <v-row>
              <v-col cols="12">
                <p class="red--text">DEBE PONERSE EL NUMERO DE FACTURA</p>
                <v-checkbox
                  @change="checkNoAplica(12)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.nroFactura"
                ></v-checkbox>
                <v-text-field
                  placeholder=""
                  v-model="datosManuales.nroFactura"
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
          <v-stepper-step :complete="e6 > 13" step="13">
            SEGURO DE MERCANCIA
          </v-stepper-step>

          <v-stepper-content step="13">
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(13)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.seguro"
                ></v-checkbox>
                <v-text-field
                  placeholder="Si/No"
                  v-model="datosManuales.seguro"
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
          <v-stepper-step :complete="e6 > 14" step="14">
            OBSERVACIONES ADICIONALES 1
          </v-stepper-step>

          <v-stepper-content step="14">
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(14)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.observacion1"
                ></v-checkbox>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  auto-grow
                  rows="1"
                  placeholder=""
                  v-model="datosManuales.observacion1"
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
          <v-stepper-step :complete="e6 > 15" step="15">
            OBSERVACIONES ADICCIONALES 2
          </v-stepper-step>

          <v-stepper-content step="15">
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  @change="checkNoAplica(15)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.observacion2"
                ></v-checkbox>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  rows="1"
                  auto-grow
                  placeholder=""
                  v-model="datosManuales.observacion2"
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
        </v-stepper>
      </v-card-text>
      <v-card-actions v-if="e6 > 15">
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
          class="mx-auto mx-1"
          color="info"
          @click="generarHTML"
          v-if="$store.state.pricing.aprobadoflag"
        >
          Generar PDF Instructivo
        </v-btn>
        <v-btn
          class="mx-2"
          color="warning"
          @click="generarHTML"
          v-if="$store.state.pricing.aprobadoflag"
        >
          Guardar Pdf Instructivo
        </v-btn>
        <v-btn color="error" class="mx-1" @click="regresar()"> VOLVER </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import moment from "moment";
import Swal from "sweetalert2";
import axios from "axios";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      files: [],
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
        pagarProveedor: "",
        condicionesLink: "",
        dondePagar: "",
        clientePago: "",
        linkDePago: "",
        condiciones: "",
        nroFactura: "",
        seguro: "",
        observacion1: "",
        observacion2: "",
      },
    };
  },
  methods: {
    ...mapActions(["uploadFileFromUrlToOneDrive", "guardarDatosInstructivo"]),
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
      data.append("name", "Prueba");
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
          let res = response.data.data[0];
          await vm.uploadFileFromUrlToOneDrive({
            fileUrl: res.ruta,
            destinationFolderUrl:
              vm.$store.state.pricing.datosPrincipales.url_folderonedrive,
          });
          console.log(res);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    moverArchivo() {},
    async generarHTML() {
      let asunto =
        "EXPEDIENTE1523 QUOTE10098 PLASMAME S.A.C FOB INVIDUAL IMPORTACION";
      let asesor = this.$store.state.pricing.listEjecutivo.find(
        (v) =>
          v.id_entitie ==
          this.$store.state.pricing.datosPrincipales.id_vendedor,
      );

      let Modality = this.$store.state.pricing.listModality.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idsentido,
      );

      let Shipment = this.$store.state.pricing.listShipment.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
      );

      let PortBegin = this.$store.state.pricing.listPortBegin.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idorigen,
      );
      let PortEnd = this.$store.state.pricing.listPortEnd.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.iddestino,
      );
      let Incoterms = this.$store.state.pricing.listIncoterms.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idincoterms,
      );
      let Proveedor = this.$store.state.itemsProveedorList.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.id_proveedor,
      );
      console.log("dataCliente", this.$store.state.pricing.dataCliente);
      let hmtl1 = `
        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
          <tbody>
            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">FECHA</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border:solid windowtext 1.0pt; border-left:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${moment().format("DD/MM/YYYY")}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">ASESOR</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${asesor.name || ""}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">N° QUOTE</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${
                  this.$store.state.pricing.nro_quote || ""
                }</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">SERVICIO</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.servicio || ""}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">COLOADER/AGENTE</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">&nbsp;</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">Email de Seguimiento</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.email || ""}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">PUERTO DE SALIDA</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${PortBegin.name || ""}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">DATOS DE LA CARGA <br>
                  <span style="color:red">Si es EXWORD enviar dirección de recolecta</span>
                </p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">
                  INCOTERMS: ${Incoterms.name || ""}<br>
                  PESO: ${
                    this.$store.state.pricing.datosPrincipales.peso || 0
                  } KG<br>
                  VOLUMEN: ${
                    this.$store.state.pricing.datosPrincipales.volumen || 0
                  } M3<br>
                  TIPO DE MERCANCIA: ${
                    this.$store.state.pricing.datosPrincipales
                      .descripcioncarga || ""
                  }
                </p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">DETALLES DEL PROVEEDOR</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">
                  NOMBRE: ${Proveedor.namelong}<br>
                  CONTACTO: ${Proveedor.contacto || ""}<br>
                  EMAIL: <a href="mailto:${Proveedor.emailaddress || ""}">${
        Proveedor.emailaddress || ""
      }</a><br>
                  TELEFONO: ${Proveedor.contacto_phone || ""}
                </p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">CLIENTE / RAZON SOCIAL</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">
                  ${
                    this.$store.state.pricing.dataCliente.nombrecompleto
                      ? this.$store.state.pricing.dataCliente.nombrecompleto
                      : ""
                  }<br>
                  RUC: ${
                    this.$store.state.pricing.dataCliente.document
                      ? this.$store.state.pricing.dataCliente.document
                      : ""
                  }
                  <br>
                  DIRECCION: ${
                    this.$store.state.pricing.dataCliente.address
                      ? this.$store.state.pricing.dataCliente.address
                      : ""
                  }
                  <br>
                  GMAIL: ${
                    this.$store.state.pricing.emailaddress
                      ? this.$store.state.pricing.emailaddress
                      : ""
                  }
                </p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>NOTIFY</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">
                  PIC LOGISTICA SAC <br>
                  RUC: 20609852861 <br>
                  AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
                  Contacto: Carlos Ramirez <br>
                  CORREO: ASESOR2@PIC-CARGO.COM
                </p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>CARGA LISTA DIA FECHA</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.listDiaFecha}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>GRUPO DE WHATSAPP</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.grupoWhatsapp}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>SE ADJUNTA</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"></p>
              </td>
            </tr>


            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>TIPO DE MERCANCIA</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${Shipment.name}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>DEBEMOS PAGAR AL PROVEEDOR</b></p>
                <span style="color:red">Solo aplica si el cliente nos cancela a nosotros y nosotros debemos pagar al proveedor</span>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.pagarProveedor}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>DONDE SE DEBE PAGAR</b></p>
                <span style="color:red">Solo aplica si el cliente nos cancela a nosotros y nosotros debemos pagar al proveedor</span>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.dondePagar}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>LINK DE PAGO o DATOS DE A TRANSFERENCIA INTERNACIONAL</b></p>
                <span style="color:red">Recuerda debes cobrar la comisión bancaria</span>
                <span style="color:red">Solo aplica si el cliente nos cancela a nosotros y nosotros debemos pagar al proveedor</span>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.linkDePago}</p>
              </td>
            </tr>


            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>CONDICIONES DE LINK DE CONTRATO DE ALIBABA</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.condicionesLink}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>PAGO DE TRANSFERENCIA INTERNCIONAL</b></p>
                <span style="color:red">DEBE PONERSE EL NUMERO DE FACTURA</span>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.nroFactura}</p>
              </td>
            </tr>


            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal"><b>SEGURO DE MERCANCIA</b></p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.seguro}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">OBSERVACIONES ADICIONALES 1</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.observacion1}</p>
              </td>
            </tr>

            <tr>
              <td width="164" valign="top" style="width:123.05pt; border:solid windowtext 1.0pt; border-top:none; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">OBSERVACIONES ADICIONALES 2</p>
              </td>
              <td width="681" valign="top" style="width:510.5pt; border-top:none; border-left:none; border-bottom:solid windowtext 1.0pt; border-right:solid windowtext 1.0pt; padding:0cm 5.4pt 0cm 5.4pt">
                <p class="MsoNormal">${this.datosManuales.observacion2}</p>
              </td>
            </tr>
          </tbody>
        </table>`;
      try {
        const blob = new Blob([hmtl1], { type: "text/html" });
        const data = [new ClipboardItem({ ["text/html"]: blob })];
        await navigator.clipboard.write(data);

        alert(
          "Información de cotización copiada. Al aceptar, se abrirá Outlook. (Luego presiona Ctrl+V)",
        );

        const subject = encodeURIComponent(
          `QUOTE ${this.$store.state.pricing.nro_quote} ${this.$store.state.pricing.dataCliente.nombrecompleto} ${Incoterms.name} ${Modality.name}`,
        );
        const body = encodeURIComponent("Hola colega, (PEGA LA TABLA AQUÍ)");

        setTimeout(() => {
          window.location.href = `mailto:?subject=${subject}&body=${body}`;

          this.abrirModalSegundoCorreo();
        }, 1000);
      } catch (err) {
        console.error("Error al copiar:", err);
        alert("Hubo un problema al copiar los datos automáticamente.");
      }
    },
    abrirModalSegundoCorreo() {
      setTimeout(() => {
        Swal.fire({
          icon: "info",
          text: "Generar Siguiente Correo. Recuerde haber pegado el correo anterior.",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            this.GenerartSegundoCorreo();
          }
        });
      }, 3000);
    },
    async GenerartSegundoCorreo() {
      let asesor = this.$store.state.pricing.listEjecutivo.find(
        (v) =>
          v.id_entitie ==
          this.$store.state.pricing.datosPrincipales.id_vendedor,
      );

      let Modality = this.$store.state.pricing.listModality.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idsentido,
      );

      let PortBegin = this.$store.state.pricing.listPortBegin.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idorigen,
      );
      let PortEnd = this.$store.state.pricing.listPortEnd.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.iddestino,
      );
      let Incoterms = this.$store.state.pricing.listIncoterms.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.idincoterms,
      );
      let Proveedor = this.$store.state.itemsProveedorList.find(
        (v) => v.id == this.$store.state.pricing.datosPrincipales.id_proveedor,
      );

      let hmtl1 = `
            <p>Hola Colega Por aquí tenemos una nueva carga, por indicarnos tu numero de routing order y que Customer seguirá el tema</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">PUERTO DE SALIDA</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    PortBegin.name || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">
                    DATOS DE LA CARGA<br />
                    <small style="font-weight: normal;">Si es EXWORK enviar dirección de recolecta, no la de la factura</small>
                  </td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    <strong>INCOTERMS:</strong> ${Incoterms.name || ""}<br/>
                    <strong>PESO:</strong> ${
                      this.$store.state.pricing.datosPrincipales.peso || 0
                    } KG <br/>
                    <strong>VOLUMEN:</strong> ${
                      this.$store.state.pricing.datosPrincipales.volumen || 0
                    } M3 <br/>
                    <strong>TIPO DE MERCANCIA:</strong> ${
                      this.$store.state.pricing.datosPrincipales
                        .descripcioncarga
                        ? this.$store.state.pricing.datosPrincipales
                            .descripcioncarga
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">DETALLES DEL PROVEEDOR</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    <strong>NOMBRE:</strong> ${
                      this.$store.state.pricing.dataCliente.business_name ||
                      "Sin nombre"
                    } <br />
                    <strong>CONTACTO:</strong> ${
                      this.$store.state.pricing.dataCliente.contact || ""
                    } <br />
                    <strong>EMAIL:</strong> ${
                      this.$store.state.pricing.dataCliente.emailaddress || ""
                    } <br />
                    <strong>TELÉFONO:</strong> ${
                      this.$store.state.pricing.dataCliente.phone || ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">CLIENTE / RAZON SOCIAL</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    ${
                      this.$store.state.pricing.dataCliente.nombrecompleto || ""
                    }<br />
                    RUC: ${
                      this.$store.state.pricing.dataCliente.document || ""
                    }<br />
                    DIRECCION: ${
                      this.$store.state.pricing.dataCliente.address || ""
                    } <br />
                    EMAIL: ${
                      this.$store.state.pricing.emailaddress
                        ? `<a href="mailto:${this.$store.state.pricing.emailaddress}">${this.$store.state.pricing.emailaddress}</a>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">NOTIFY</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    PIC LOGISTICA SAC<br />RUC: 20609852861<br />AV . AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br />
                    Contacto: Carlos Ramirez<br />CORREO: <a href="mailto:ASESOR2@PIC-CARGO.COM">ASESOR2@PIC-CARGO.COM</a>
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">CARGA LISTA DIA FECHA</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.fechaCarga || "Shors"
                  }</td>
                </tr>
              </tbody>
            </table>
          `;

      try {
        const blob = new Blob([hmtl1], { type: "text/html" });
        const data = [new ClipboardItem({ ["text/html"]: blob })];
        await navigator.clipboard.write(data);

        alert(
          "Información de cotización copiada. Al aceptar, se abrirá Outlook. (Luego presiona Ctrl+V)",
        );

        const subject = encodeURIComponent(
          `QUOTE ${this.$store.state.pricing.nro_quote} ${this.$store.state.pricing.dataCliente.nombrecompleto} ${Incoterms.name} ${Modality.name}`,
        );
        const body = encodeURIComponent("Hola colega, (PEGA LA TABLA AQUÍ)");

        window.location.href = `mailto:${this.$store.state.pricing.dataCliente.emailaddress}?subject=${subject}&body=${body}`;

        this.$emit("continuar");
      } catch (err) {
        console.error("Error al copiar:", err);
        alert("Hubo un problema al copiar los datos automáticamente.");
      }
      //
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
  },
  mounted() {
    if (this.$store.state.pricing.datosPrincipales.datosinstructivomanual)
      this.datosManuales =
        this.$store.state.pricing.datosPrincipales.datosinstructivomanual;
  },
  watch: {
    files() {
      console.log(this.files);
    },
  },
};
</script>

<style scoped>
.txtCondiciones {
  field-sizing: content !important;
}
</style>
