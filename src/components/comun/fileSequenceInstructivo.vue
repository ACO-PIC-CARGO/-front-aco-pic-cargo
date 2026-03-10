<template>
  <v-container>
    <v-card>
      <v-card-title> Datos Manuales Instructivo </v-card-title>
      <v-card-text>
        <v-stepper v-model="e6" vertical non-linear>
          <v-stepper-step :complete="e6 > 1" step="1">
            Servicio
          </v-stepper-step>

          <v-stepper-content step="1">
            <v-row>
              <v-col cols="12">
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
            Email de Seguimiento
          </v-stepper-step>

          <v-stepper-content step="2">
            <v-row>
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
            MONTO A PAGAR
          </v-stepper-step>

          <v-stepper-content step="3">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
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
          <v-stepper-step :complete="e6 > 4" step="4">
            CLIENTE YA NOS PAGOS
          </v-stepper-step>

          <v-stepper-content step="4">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  Solo aplica si el cliente nos cancela a nosotros y nosotros
                  debemos pagar al proveedor
                </p>
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
          <v-stepper-step :complete="e6 > 5" step="5">
            LINK DE PAGO o DATOS DE A TRANSFERENCIA INTERNACIONAL
          </v-stepper-step>

          <v-stepper-content step="5">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  Recuerda debes cobrar la comisión bancaria solo aplica si el
                  cliente nos cancela a nosotros y nosotros debemos pagar al
                  proveedor
                </p>
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

          <!--  -->
          <v-stepper-step :complete="e6 > 6" step="6">
            CONDICIONES DE LINK DE CONTRATO DE ALIBABA
          </v-stepper-step>

          <v-stepper-content step="6">
            <v-row>
              <v-col cols="12">
                <p class="red--text">
                  DEBE ESTAR DETALLADO ESPECIFICAR UNIDADES ITEMS Y DEBE
                  COINCIDIR CON EL INVOCE POR SI SUNAT LO OBSERVA
                </p>
                <v-textarea
                  placeholder=""
                  auto-grow
                  v-model="datosManuales.condiciones"
                  ref="txtcondiciones"
                  rows="1"
                  class="txtCondiciones"
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
          <v-stepper-step :complete="e6 > 7" step="7">
            PAGO DE TRANSFERENCIA INTERNCIONAL
          </v-stepper-step>

          <v-stepper-content step="7">
            <v-row>
              <v-col cols="12">
                <p class="red--text">DEBE PONERSE EL NUMERO DE FACTURA</p>
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
          <v-stepper-step :complete="e6 > 8" step="8">
            SEGURO DE MERCANCIA
          </v-stepper-step>

          <v-stepper-content step="8">
            <v-row>
              <v-col cols="12">
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
          <v-stepper-step :complete="e6 > 9" step="9">
            OBSERVACIONES ADICIONALES 1
          </v-stepper-step>

          <v-stepper-content step="9">
            <v-row>
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
          <v-stepper-step :complete="e6 > 10" step="10">
            OBSERVACIONES ADICCIONALES 2
          </v-stepper-step>

          <v-stepper-content step="10">
            <v-row>
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
        <div>
          <v-btn
            class="mx-auto my-5"
            color="success"
            v-if="e6 == 11"
            @click="generarHTML"
            >Generar Instructivo</v-btn
          >
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import moment from "moment";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      e6: 1,
      datosManuales: {
        servicio: "",
        email: "",
        monto: 0,
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
    continuarEmail() {
      if (!this.datosManuales.servicio) {
        this.$refs.txtServicio.focus();
        return;
      }
      this.e6 = 2;
    },
    continuarListaDiaFecha() {
      if (!this.datosManuales.email) {
        console.log("d");
        this.$refs.txtEmail.focus();
        return;
      }
      const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!expresion.test(this.datosManuales.email)) {
        console.log("d");
        this.$refs.txtEmail.focus();
        return;
      }
      this.e6 = 3;
    },
    continuar() {
      this.e6++;
    },
    regresar() {
      this.e6--;
    },
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
            <p>Hemos cerrado una nueva carga</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 30%;">FECHA</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">${moment().format(
                    "DD/MM/YYYY",
                  )}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">ASESOR</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    asesor.name || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">N° QUOTE</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.$store.state.pricing.nro_quote || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">SERVICIO</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.servicio || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">COLOADER/AGENTE</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.agente || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Email de Seguimiento</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.email || ""
                  }</td>
                </tr>
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
                        .descripcionMercancia || ""
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
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">GRUPO DE WHATSAPP</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.grupoWhatsapp || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">SE ADJUNTA</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    PACKING LIST, PROFORMA INVOICE, VOUCHER DE PAGO, COTIZACION
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">TIPO DE CARGA</td>
                  <td style="border: 1px solid #000; padding: 8px;">LCL</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">PAGOS Y TRANSFERENCIAS</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    <strong>Cliente paga:</strong> ${
                      this.datosManuales.clientePago || ""
                    }<br/>
                    <strong>Monto:</strong> ${
                      this.datosManuales.monto || ""
                    }<br/>
                    <strong>Factura:</strong> ${
                      this.datosManuales.nroFactura || ""
                    }<br/>
                    <strong>Link:</strong> ${
                      this.datosManuales.linkDePago || ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">SEGURO DE MERCANCIA</td>
                  <td style="border: 1px solid #000; padding: 8px;">${
                    this.datosManuales.seguro || ""
                  }</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">OBSERVACIONES 1</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    ${this.datosManuales.observacion1 || ""}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">OBSERVACIONES 2</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    ${this.datosManuales.observacion2 || ""}
                  </td>
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

        window.location.href = `mailto:?subject=${subject}&body=${body}`;

        this.abrirModalSegundoCorreo();
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
      }, 1000);
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
                        .descripcionMercancia || ""
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
  },
};
</script>

<style scoped>
.txtCondiciones {
  field-sizing: content !important;
}
</style>
