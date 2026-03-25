<template>
  <v-container>
    <v-card>
      <v-card-text>
        <v-stepper v-model="e6" vertical non-linear>
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 1" step="1">
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

          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 2" step="2">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 3" step="3">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 4" step="4">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 5" step="5">
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

                <div
                  v-if="
                    datosManuales.table_allpath_list &&
                    datosManuales.table_allpath_list.length > 0
                  "
                >
                  <p
                    v-for="(file, index) in datosManuales.table_allpath_list"
                    :key="index"
                  >
                    {{ file.nombre }}
                    <v-btn color="default" icon :href="file.url" target="_blank"
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 6" step="6">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 7" step="7">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 8" step="8">
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
          <v-stepper-step :editable="aprobadoflag" :complete="e6 > 9" step="9">
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
          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 10"
            step="10"
          >
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

          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 11"
            step="11"
          >
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
          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 12"
            step="12"
          >
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
          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 13"
            step="13"
          >
            SEGURO DE MERCANCIA
          </v-stepper-step>

          <v-stepper-content step="13">
            <v-row>
              <v-col cols="12">
                <!-- <v-checkbox
                  @change="checkNoAplica(13)"
                  label="No Aplica"
                  v-model="datosManualesNoAplica.seguro"
                ></v-checkbox> -->
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
          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 14"
            step="14"
          >
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
          <v-stepper-step
            :editable="aprobadoflag"
            :complete="e6 > 15"
            step="15"
          >
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
      <v-card-actions v-if="e6 > 15 || $store.state.pricing.aprobadoflag">
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
import puerto from "../../store/modules/puerto";
export default {
  props: {
    aprobadoflag: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      proveedorInstructivo: {},
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
      console.log("vm.files[i]", vm.files[i].name);
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
          console.log(res);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    moverArchivo() {},
    async generarHTMLPDF(guardarFlag) {
      const state = this.$store.state.pricing;
      const main = state.datosPrincipales;
      const cliente = state.dataCliente;

      // 1. Buscamos con fallback a objeto vacío para evitar errores de .name
      const asesor =
        state.listEjecutivo.find((v) => v.id_entitie == main.id_vendedor) || {};
      const Modality =
        state.listModality.find((v) => v.id == main.idsentido) || {};
      const Shipment =
        state.listShipment.find((v) => v.id == main.idtipocarga) || {};
      const PortBegin = this.puertoOrigen;
      const Incoterms =
        state.listIncoterms.find((v) => v.id == main.idincoterms) || {};
      const Proveedor =
        this.$store.state.itemsProveedorList.find(
          (v) => v.id == main.id_proveedor,
        ) || {};

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
      const subjectStr = `EXPEDIENTE_${
        state.nro_exp
      }_QUOTE_${nro_quote_clean}_${nombre_clean}_${Incoterms.name || ""}_${
        Modality.name || ""
      }`;
      const subject = encodeURIComponent(subjectStr);

      // 4. Ejecución del preview/guardado
      await this.quotePreviewInstructivoManual({
        guardarFlag: guardarFlag,
        subject: subject,
        asesor: asesor.name || "",
        nro_quote: state.nro_quote || "",
        servicio: this.datosManuales.servicio || "",
        email: this.datosManuales.email || "",
        PortBegin: this.puertoOrigen.name || "",
        Incoterms: Incoterms.name || "",
        peso: main.peso || 0,
        volumen: main.volumen || 0,
        descripcioncarga: main.descripcioncarga || "",
        nombrecompletoProveedor: Proveedor.namelong || "",
        contactoProveedor: Proveedor.contacto || "",
        addressProveedor: Proveedor.emailaddress || "",
        contactoPhoneProveedor: Proveedor.contacto_phone || "",
        nombrecompletoCliente: cliente.nombrecompleto || "",
        documentCliente: cliente.document || "",
        addressCliente: cliente.address || "",
        emailaddressCliente: state.emailaddress || "",
        listDiaFecha: this.datosManuales.listDiaFecha || "",
        grupoWhatsapp: this.datosManuales.grupoWhatsapp || "",
        Shipment: Shipment.name || "",
        url_folderonedrive: main.url_folderonedrive,
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
      });
    },
    async generarHTML() {
      const { state } = this.$store;
      const pricing = state.pricing;
      const dp = pricing.datosPrincipales;

      // 1. Búsquedas con validación (Evita errores si no encuentra el objeto)
      const encontrar = (lista, id, campo = "id") =>
        lista.find((v) => v[campo] == id) || {};

      const asesor = encontrar(
        pricing.listEjecutivo,
        dp.id_vendedor,
        "id_entitie",
      );
      const modality = encontrar(pricing.listModality, dp.idsentido);
      const shipment = encontrar(pricing.listShipment, dp.idtipocarga);
     
      const portEnd = encontrar(pricing.listPortEnd, dp.iddestino);
      const incoterms = encontrar(pricing.listIncoterms, dp.idincoterms);
      const proveedor = encontrar(state.itemsProveedorList, dp.id_proveedor);
    
      // 2. Formateo de archivos adjuntos
      const listaArchivos =
        this.datosFile?.length > 0
          ? this.datosFile.map((f) => `• ${f.nombre || f}`).join("<br />")
          : "No hay archivos";
      // 3. Construcción del Template HTML
      const htmlTable = `
        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-family: Arial, sans-serif; width: 100%;">
          <tbody>
            ${this._tr("FECHA", moment().format("DD/MM/YYYY"))}
            ${this._tr("ASESOR", asesor.name)}
            ${this._tr("N° QUOTE", pricing.nro_quote)}
            ${this._tr("TIPO DE EMBARQUE", shipment.code)}
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
            ${this._tr("PUERTO DE SALIDA", this.puertoOrigen.name)}
            ${this._tr(
              "DATOS DE LA CARGA<br><span style='color:red;font-size:10px;'>Si es EXW enviar dirección de recolecta</span>",
              `
              INCOTERMS: ${incoterms.name || ""}<br>
              PESO: ${dp.peso || 0} KG<br>
              VOLUMEN: ${dp.volumen || 0} M3<br>
              TIPO DE MERCANCIA: ${dp.descripcioncarga || ""}
            `,
            )}
            ${this._tr(
              "DETALLES DEL PROVEEDOR",
              `
              NOMBRE: ${proveedor.namelong || ""}<br>
              CONTACTO: ${proveedor.contacto || ""}<br>
              EMAIL: ${proveedor.emailaddress || ""}<br>
              TELÉFONO: ${proveedor.contacto_phone || ""}
            `,
            )}
            ${this._tr(
              "CLIENTE / RAZON SOCIAL",
              `
              ${pricing.dataCliente.nombrecompleto || ""}<br>
              RUC: ${pricing.dataCliente.document || ""}<br>
              DIRECCIÓN: ${pricing.dataCliente.address || ""}<br>
              EMAIL: ${pricing.emailaddress || ""}
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
          </tbody>
        </table>`;

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
        const subject = `EXPEDIENTE-${pricing.nro_exp} QUOTE ${pricing.nro_quote} ${pricing.dataCliente.nombrecompleto} ${incoterms.name} ${modality.name}`;
        const body =
          "Hola colega, adjunto los detalles del expediente (Pega la tabla aquí):\n\n";

        setTimeout(() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(
            subject,
          )}&body=${encodeURIComponent(body)}`;
          this.abrirModalSegundoCorreo();
        }, 1000);
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
          title: "📧 Crear email al agente",
          text: "✅ Confirmar que ya enviaste el email operaciones",
          confirmButtonText: "Lo Confirmo",
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
      const state = this.$store.state.pricing;
      const main = state.datosPrincipales;
      const cliente = state.dataCliente;

      // Obtenemos los objetos o un objeto vacío para evitar errores de .name
      const PortBegin = this.puertoOrigen;
      const Incoterms =
        state.listIncoterms.find((v) => v.id == main.idincoterms) || {};
      const Modality =
        state.listModality.find((v) => v.id == main.idsentido) || {};

      // Formateamos los bloques de texto complejos
      const cargaDetalles = `
    <strong>INCOTERMS:</strong> ${Incoterms.name || ""}<br/>
    <strong>PESO:</strong> ${main.peso || 0} KG <br/>
    <strong>VOLUMEN:</strong> ${main.volumen || 0} M3 <br/>
    <strong>TIPO DE MERCANCIA:</strong> ${main.descripcioncarga || ""}
  `;

      const proveedorDetalles = `
    <strong>NOMBRE:</strong> ${cliente.business_name || "Sin nombre"} <br />
    <strong>CONTACTO:</strong> ${cliente.contact || ""} <br />
    <strong>EMAIL:</strong> ${cliente.emailaddress || ""} <br />
    <strong>TELÉFONO:</strong> ${cliente.phone || ""}
  `;

      const clienteDetalles = `
    ${cliente.nombrecompleto || ""}<br />
    RUC: ${cliente.document || ""}<br />
    DIRECCION: ${cliente.address || ""} <br />
    EMAIL: ${
      state.emailaddress
        ? `<a href="mailto:${state.emailaddress}">${state.emailaddress}</a>`
        : ""
    }
  `;

      const htmlBody = `
    <p>Hola Colega Por aquí tenemos una nueva carga, por indicarnos tu numero de routing order y que Customer seguirá el tema</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
      <tbody>
        ${this._tr("PUERTO DE SALIDA", PortBegin.name)}
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
          this.datosManuales.fechaCarga || "Pendiente",
        )}
      </tbody>
    </table>
  `;

      try {
        const blob = new Blob([htmlBody], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob }),
        ]);

        alert("Copiado. Se abrirá Outlook. (Usa Ctrl+V)");

        const subject = `EXPEDIENTE-${pricing.nro_exp} QUOTE ${pricing.nro_quote} ${pricing.dataCliente.nombrecompleto} ${incoterms.name} ${modality.name}`;
        window.location.href = `mailto:${
          cliente.emailaddress || ""
        }?subject=${subject}&body=${encodeURIComponent(
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
      <td width="164" valign="top" style="width:123pt; border:solid windowtext 1.0pt; padding:4pt;">
        <p style="margin:0; font-size:11px;">${label}</p>
      </td>
      <td valign="top" style="border:solid windowtext 1.0pt; border-left:none; padding:4pt;">
        <p style="margin:0; font-size:11px;">${value || ""}</p>
      </td>
    </tr>`;
    },
  },
  async mounted() {
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
      console.log(this.proveedorInstructivo);
    }
    this.puertoOrigen = await this.verPuerto({
      id_transport: idTipoCarga,
      id: this.$store.state.pricing.datosPrincipales.idorigen,
    });
    this.puertoDestino = await this.verPuerto({
      id_transport: idTipoCarga,
      id: this.$store.state.pricing.datosPrincipales.iddestino,
    });
    console.log("this.puertoOrigen", this.puertoOrigen);
    console.log("this.puertoDestino", this.puertoDestino);
  },
  watch: {},
};
</script>

<style scoped>
.txtCondiciones {
  field-sizing: content !important;
}
</style>
