<template>
  <v-card fluid class="pa-10 preview">
    <v-row>
      <v-col cols="6">
        <v-img
          width="240px"
          alt="logo_empresa"
          class="img-fluid"
          :src="datosEmpresa.logo"
        ></v-img>
      </v-col>
      <v-col cols="6" class="align_right">
        <b>Fecha</b> {{ fechaHoy() }}
      </v-col>
      <v-col cols="6">
        <table width="100%">
          <tbody>
            <tr>
              <td>RUC:</td>
              <td>{{ datosEmpresa.document }}</td>
            </tr>
            <tr>
              <td>DIRECCIÓN:</td>
              <td>{{ datosEmpresa.address }}</td>
            </tr>
            <tr>
              <td>TELÉFONO:</td>
              <td>{{ datosEmpresa.phone }}</td>
            </tr>
          </tbody>
        </table>
      </v-col>
      <v-col cols="6" class="align_right">
        <table width="100%">
          <tbody>
            <tr>
              <td style="font-size: 1.2rem; font-weight: bold">
                COTIZACIÓN
                {{
                  $store.state.pricing.nro_quote
                    ? $store.state.pricing.nro_quote
                    : "#####"
                }}
              </td>
            </tr>
            <tr>
              <td>CLIENTE: {{ data.cliente }}</td>
            </tr>
            <tr
              v-if="
                data.OpcionesSelecciondas[index - 1] &&
                data.OpcionesSelecciondas[index - 1].date_end
              "
            >
              <td>
                Fecha Validez:
                {{ formatDate(data.OpcionesSelecciondas[index - 1].date_end) }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="6">
        <v-simple-table dense>
          <thead>
            <tr class="text-center">
              <th colspan="2" class="bg_total">DATOS EMBARQUE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="40%"><b>PUERTO DE ORIGEN:</b></td>
              <td width="60%">{{ data.origen }}</td>
            </tr>
            <tr>
              <td width="40%"><b>PUERTO DE DESTINO: </b></td>
              <td width="60%">{{ data.destino }}</td>
            </tr>
            <tr>
              <td width="40%"><b>MODALIDAD: </b></td>
              <td width="60%">{{ data.sentido }}</td>
            </tr>
            <tr>
              <td width="40%"><b>TIPO EMBARQUE: </b></td>
              <td width="60%">{{ data.embarque }}</td>
            </tr>
            <tr>
              <td width="40%"><b>INCOTERMS: </b></td>
              <td width="60%">{{ data.icoterm }}</td>
            </tr>
            <tr v-if="!isFCL">
              
              <td width="40%"><b>N° BULTOS: </b></td>
              <td width="60%">{{ data.numerobultos }}</td>
            </tr>
            <tr v-if="!isFCL">
              <td width="40%"><b>PESO: </b></td>
              <td width="60%">{{ data.peso }}</td>
            </tr>
            <tr v-if="!isFCL">
              <td width="40%"><b>VOLUMEN: </b></td>
              <td width="60%">{{ data.volumen }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>

      <v-col cols="6">
        <v-simple-table dense>
          <thead>
            <tr class="text-center">
              <th colspan="2" class="bg_total">SERVICIOS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(serv, servIndex) in lstServices" :key="servIndex">
              <td>{{ serv.name }}</td>
              <td>{{ serv.estado }}</td>
            </tr>
            <tr
              v-if="
                data.OpcionesSelecciondas[index - 1] &&
                data.OpcionesSelecciondas[index - 1].tiempo_transito
              "
            >
              <td><b>TIEMPO DE TRÁNSITO</b></td>
              <td>
                {{ data.OpcionesSelecciondas[index - 1].tiempo_transito }}
                {{
                  Number(
                    data.OpcionesSelecciondas[index - 1].tiempo_transito,
                  ) === 1
                    ? "día"
                    : "días"
                }}
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>

      <v-col cols="12" class="text-center py-0">
        <hr />
      </v-col>

      <v-col cols="12" v-if="data.tipo != 'AGRUPADO' && data.isImport">
        <table
          width="100%"
          style="padding: 0 2rem; border-collapse: collapse"
          v-if="data.OpcionesSelecciondas[index - 1].totalFlete != '$0.00'"
        >
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "FL")
                    ? data.TipoCostos.filter((v) => v.codigo == "FL")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, fleteIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosFlete"
              :key="fleteIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalFlete }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>
      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          data.OpcionesSelecciondas[index - 1].totalOrigen != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "OR")
                    ? data.TipoCostos.filter((v) => v.codigo == "OR")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosOrigen"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalOrigen }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          data.OpcionesSelecciondas[index - 1].totalLocales != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "LO")
                    ? data.TipoCostos.filter((v) => v.codigo == "LO")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosLocales"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalLocales }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          data.OpcionesSelecciondas[index - 1].totalAduanas != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "AD")
                    ? data.TipoCostos.filter((v) => v.codigo == "AD")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosAduanas"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalAduanas }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          !data.isImport &&
          data.OpcionesSelecciondas[index - 1].totalFlete != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "FL")
                    ? data.TipoCostos.filter((v) => v.codigo == "FL")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosFlete"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalFlete }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          data.OpcionesSelecciondas[index - 1].totalAlmacenes != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "AL")
                    ? data.TipoCostos.filter((v) => v.codigo == "AL")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosAlmacenes"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalAlmacenes }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col
        cols="12"
        v-if="
          data.tipo != 'AGRUPADO' &&
          data.OpcionesSelecciondas[index - 1].totalGastosTercero != '$0.00'
        "
      >
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="5">
                {{
                  data.TipoCostos.some((v) => v.codigo == "GT")
                    ? data.TipoCostos.filter((v) => v.codigo == "GT")[0].name
                    : ""
                }}
              </th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(element, elementIndex) in data.OpcionesSelecciondas[
                index - 1
              ].datosGastosTercero"
              :key="elementIndex"
            >
              <td class="text-left" colspan="5">{{ element.name }}</td>
              <td class="text-right" colspan="1">{{ element.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalGastosTercero }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col cols="12" v-if="data.tipo == 'AGRUPADO'">
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="6">
                CONCEPTOS DE GASTOS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(concepto, conceptoIndex) in data.OpcionesSelecciondas[
                index - 1
              ].conceptos"
              :key="conceptoIndex"
            >
              <td class="text-left" colspan="6">{{ concepto.name }}</td>
            </tr>
          </tbody>
        </table>
      </v-col>
      <v-col cols="12">
        <v-simple-table dense>
          <thead>
            <tr>
              <th colspan="2" class="bg_total">TOTALES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TOTAL SERVICIOS DE {{ nameEmpresa }}</td>
              <td>{{ data.OpcionesSelecciondas[index - 1].totalServicios }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>

      <v-col cols="12">
        <table width="100%" style="padding: 0 2rem; border-collapse: collapse">
          <thead>
            <tr class="subrayado">
              <th class="text-left bg_total" colspan="4">
                IMPUESTO A LA ADUANA
              </th>
              <th class="text-left bg_total" colspan="1"></th>
              <th class="text-right bg_total" colspan="1">MONTO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(imp, impIndex) in data.OpcionesSelecciondas[index - 1]
                .impuesto"
              :key="impIndex"
            >
              <td class="text-left" colspan="2">{{ imp.name }}</td>
              <td class="text-right" colspan="2">
                {{ imp.percentage ? imp.percentage : "" }}
              </td>
              <td class="text-right" colspan="2">${{ imp.valor }}</td>
            </tr>

            <tr
              style="
                border-top: 1.5px solid black;
                border-bottom: 1.5px solid black;
              "
            >
              <td class="text-right" colspan="5">Total:</td>
              <td class="text-right" colspan="1">
                {{ data.OpcionesSelecciondas[index - 1].totalImpuesto }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-col>

      <v-col cols="12">
        <v-simple-table dense>
          <thead>
            <tr>
              <th colspan="2" class="bg_total">TOTALES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {{ $store.state.enterprises.impuesto.nombre_impuesto }} SOBRE
                SERVICIOS LOGISTICO
              </td>
              <td class="align_right">
                {{ data.OpcionesSelecciondas[index - 1].totalImpuestosIGV }}
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>

      <!--  -->

      <v-col cols="12">
        <v-simple-table>
          <thead>
            <tr>
              <th colspan="2" class="bg_total">TOTAL COTIZACIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                TOTAL {{ nameEmpresa }}
                {{
                  data.OpcionesSelecciondas[index - 1].impuesto.length > 0
                    ? "+ "
                    : "IMPUESTO DE ADUANA SUNAT"
                }}
                IMPUESTO DE ADUANA {{ data.iso == "9589" ? "SUNAT" : "" }}
              </td>
              <td class="align_right">
                {{ data.OpcionesSelecciondas[index - 1].total }}
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="6">
        <v-row>
          <v-col cols="12">
            <v-simple-table
              dense
              style="
                width: 100% !important;
                display: table !important;
                table-layout: fixed;
              "
            >
              <tr>
                <td
                  style="
                    background: #004d40 !important;
                    color: white !important;
                  "
                >
                  ESTA OFERTA INCLUYE
                </td>
              </tr>

              <tr v-for="(i, incluyeIndex) in incluye" :key="incluyeIndex">
                <td style="text-transform: uppercase">
                  <span style="color: green; font-size: 1em">&#10004;</span>
                  {{ i.name }}
                </td>
              </tr>
            </v-simple-table>
          </v-col>
          <v-col cols="12">
            <v-simple-table
              dense
              style="
                width: 100% !important;
                display: table !important;
                table-layout: fixed;
              "
            >
              <tr>
                <td
                  style="
                    background: #dd2c00 !important;
                    color: white !important;
                  "
                >
                  ESTA OFERTA NO INCLUYE
                </td>
              </tr>
              <tr
                v-for="(i, noincluyeIndex) in noincluye"
                :key="noincluyeIndex"
              >
                <td style="text-transform: uppercase">
                  <span style="color: green; font-size: 1em">&#10004;</span>
                  {{ i.name }}
                </td>
              </tr>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="6">
        <v-simple-table
          dense
          style="
            width: 100% !important;
            display: table !important;
            table-layout: fixed;
          "
        >
          <tr>
            <td style="background: #ffeb3b !important">IMPORTANTE</td>
          </tr>
          <tr v-for="(i, notasIndex) in notasPrincipales" :key="notasIndex">
            <td style="text-transform: uppercase">
              {{ i.name }}
            </td>
          </tr>
        </v-simple-table>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import moment from "moment";
export default {
  props: ["data", "index"],
  name: "PreviewQuote",
  data() {
    return {
      lstServices: [],
      lstServicesOne: [],
      lstServicesTwo: [],
      lstServicesTree: [],
      datosFlete: [],
      nameEmpresa: "",
      incluye: [],
      noincluye: [],
      notasPrincipales: [],
      datosEmpresa: {},
    };
  },
  mounted() {
    this.lstServices = [];
    this.lstServicesOne = [];
    this.lstServicesTwo = [];
    this.lstServicesTree = [];
    this.nameEmpresa = JSON.parse(
      sessionStorage.getItem("dataBranch"),
    )[0].trade_name;
    this.generarData();
    this.datosEmpresa = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
  },

  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyPress);
  },
  computed: {
    isFCL() {
      let id = this.$store.state.pricing.datosPrincipales.idtipocarga;
      let code = this.$store.state.pricing.listShipment.filter(
        (v) => v.id == id,
      )[0].code;

      let validate = code == "FCL" ? true : false;
      return validate;
    },
  },
  methods: {
    handleKeyPress(event) {
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault(); // Evita que se ejecute la acción predeterminada (imprimir)
      }
    },
    fechaHoy() {
      return moment().format("YYYY-MM-DD");
    },
    formatDate(val) {
      if (!val) return "";
      return moment(val).isValid()
        ? moment(val).format("DD-MM-YYYY")
        : String(val);
    },
    cerrar() {
      this.$emit("cerrar", false);
    },
    generarData() {
      window.addEventListener("keydown", this.handleKeyPress);
      let vm = this;
      let flete = vm.data.flete;
      let almacen = vm.data.almacen;
      let aduana = vm.data.aduana;
      let local = vm.data.local;
      let contenedor = vm.data.contenedor;

      if (Array.isArray(flete)) {
        flete.forEach((element) => {
          vm.lstServices.push({
            name: element.name,
            estado: element.estado,
          });
        });
      }

      if (Array.isArray(almacen)) {
        almacen.forEach((element) => {
          vm.lstServices.push({
            name: element.name,
            estado: element.estado,
          });
        });
      }

      if (Array.isArray(aduana)) {
        aduana.forEach((element) => {
          vm.lstServices.push({
            name: element.name,
            estado: element.estado,
          });
        });
      }

      if (Array.isArray(local)) {
        local.forEach((element) => {
          vm.lstServices.push({
            name: element.name,
            estado: element.estado,
          });
        });
      }

      vm.data.OpcionesSelecciondas[this.index - 1].listServices.forEach(
        (element) => {
          if (element.status == 1) {
            vm.incluye.push({
              name: element.service,
            });
          }
          if (element.status != 1) {
            vm.noincluye.push({
              name: element.service,
            });
          }
        },
      );

      vm.data.OpcionesSelecciondas[this.index - 1].listNotasQuote
        .filter((v) => v.estado == 1 && v.statusincluye == 1)
        .forEach((element) => {
          vm.incluye.push({ name: element.descripcion });
        });

      vm.data.OpcionesSelecciondas[this.index - 1].listNotasQuote
        .filter((v) => v.estado == 1 && v.statusnoincluye == 1)
        .forEach((element) => {
          vm.noincluye.push({ name: element.descripcion });
        });
      vm.data.OpcionesSelecciondas[this.index - 1].listNotasQuote
        .filter((v) => v.estado == 1 && v.statusprincipal == 1)
        .forEach((element) => {
          vm.notasPrincipales.push({ name: element.descripcion });
        });
    },
  },
  watch: {
    data() {
      this.lstServices = [];
      this.lstServicesOne = [];
      this.lstServicesTwo = [];
      this.lstServicesTree = [];
      this.incluye = [];
      this.noincluye = [];
      this.notasPrincipales = [];
      this.generarData();
    },
  },
};
</script>

<style scoped>
* {
  font-size: 0.8rem;
}
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td,
.v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
.v-data-table > .v-data-table__wrapper > table > thead > tr > td,
.v-data-table > .v-data-table__wrapper > table > thead > tr > th,
.v-data-table > .v-data-table__wrapper > table > tfoot > tr > td,
.v-data-table > .v-data-table__wrapper > table > tfoot > tr > th {
  padding: 0;
  transition: height 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}
.t-bg {
  background-color: #a43542 !important;
  color: white;
}
.st-bg {
  background: rgb(51, 63, 80) !important;
  color: #fff !important;
  font-weight: bold !important;
}
.st-ti {
  background: #2587b1 !important;
  color: #fff !important;
  font-weight: bold !important;
}
.preview {
  background-image: url("../../../public/img/no_valid.jpg");
  background-size: cover; /* Ajusta la imagen al tamaño de la sección */
  background-repeat: no-repeat; /* Evita que se repita la imagen */
}
.table[data-v-4339395b] {
  background-color: transparent;
}
.align_right {
  text-align: right;
}
.bg_total {
  background: #182e4b !important;
  color: white !important;
}
</style>
