<template fluid class="">
  <v-container class="elevation-5 px-2">
    <v-row>
      <v-col cols="12">
        <label for=""> Seleccione una opción: </label>
      </v-col>
      <v-col cols="4">
        <v-radio-group v-model="tipo" row hide-details dense :click="change()">
          <v-radio label="LCL" value="lcl"></v-radio>
          <v-radio label="FCL" value="fcl"></v-radio>
          <v-radio label="AÉREO" value="aereo"></v-radio>
        </v-radio-group>
      </v-col>
      <v-col cols="4">
        <v-file-input
          show-size
          dense
          v-model="excel"
          label="Excel"
          placeholder="Seleccione un archivo"
          id="excel"
          hide-details
          @click:clear="subir = false"
          @change="subir = false"
          @click.native="subir = false"
        ></v-file-input>
      </v-col>
      <v-col cols="4">
        <v-btn
          color="warning"
          @click="procesarExcel()"
          :loading="procesando"
          v-if="!subir"
          class="mx-1"
          small
          :disabled="!procesarflag"
        >
          Procesar
        </v-btn>
        <v-btn
          color="success"
          :loading="procesando"
          v-if="subir"
          class="mx-1"
          small
          @click="registrarFlag = true"
        >
          REGISTRAR
        </v-btn>
        <v-btn
          color="info"
          :loading="procesando2"
          class="mx-1"
          small
          @click="exportarFormato()"
        >
          Descargar Formato
        </v-btn>
        <v-btn
          color="default"
          class="mx-1"
          small
          @click="offcanvas = !offcanvas"
        >
          Nuevo Registro
        </v-btn>
      </v-col>
      <v-col cols="12" class="mt-2" v-if="tipo == 'lcl'">
        <v-data-table
          :headers="headerLCL"
          :items="itemsLCL"
          class="elevation-1"
          loading="true"
          item-key="id"
          dense
          :items-per-page="10"
        >
        </v-data-table>
      </v-col>
      <v-col cols="12" class="mt-2" v-if="tipo == 'fcl'">
        <v-data-table
          :headers="headerFCL"
          :items="itemsFCL"
          class="elevation-1"
          loading="true"
          item-key="id"
          dense
          :items-per-page="10"
        >
        </v-data-table>
      </v-col>
      <v-col cols="12" class="mt-2" v-if="tipo == 'aereo'">
        <v-data-table
          :headers="headerAereo"
          :items="itemsAereo"
          class="elevation-1"
          loading="true"
          item-key="id"
          dense
          :items-per-page="10"
        >
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="registrarFlag"
      max-width="50%"
      transition="dialog-transition"
      persistent
    >
      <v-card>
        <v-card-title primary-title> REGISTRO DE TARIFAS </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="$store.state.calculadoras.listSucursal"
            item-value="paises_id"
            item-text="paises_nombre"
            label="Sucursal(s)"
            multiple
            placeholder="Selecciones un(as) sucursal(es)"
            v-model="sucursales"
            chips
            clearable
            deletable-chips
            small-chips
          >
          </v-autocomplete>
          <v-radio-group v-model="importacionflag" row hide-details dense>
            <v-radio label="Importación" value="true"></v-radio>
            <v-radio label="Exportación" value="false"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" :loading="procesando" @click="registrar()">
            Aceptar
          </v-btn>
          <v-btn color="warning" @click="registrarFlag = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-if="offcanvas"
      v-model="offcanvas"
      absolute
      persistent
      temporary
      right
      width="28%"
      class="px-2"
      height="100vh"
    >
      <v-card elevation="5">
        <v-card-title primary-title>
          Nuevo Registro
          {{ tipo == "lcl" ? "LCL" : tipo == "fcl" ? "FCL" : "Aéreo" }}
        </v-card-title>

        <v-card-actions class="mt-5">
          <div class="row">
            <!-- PAIS ORIGEN -->
            <div class="col-12">
              <v-autocomplete
                :items="$store.state.itemsPais"
                v-model="datosFormulario.paisOrigen"
                item-text="pais_descripcion"
                label="País de Origen"
                placeholder="Seleccione un país"
                clearable
                dense
                return-object
                hide-details
                hide-selected
                hide-no-data
                @change="cargarPuertoOrigen"
                prepend-icon="mdi-ferry"
              >
              </v-autocomplete>
            </div>
            <!-- PUERTO ORIGEN -->
            <div class="col-12">
              <v-autocomplete
                :items="puertosOrigen"
                v-model="datosFormulario.puertoOrigen"
                item-text="puerto_descripcion"
                label="Puerto de Origen"
                placeholder="Seleccione un puerto"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                multiple
                dense
                deletable-chips
                small-chips
                prepend-icon="mdi-ferry"
              >
              </v-autocomplete>
            </div>
            <!-- PAIS DESTINO -->
            <div class="col-12">
              <v-autocomplete
                :items="$store.state.itemsPais"
                v-model="datosFormulario.paisDestino"
                item-text="pais_descripcion"
                label="País de Destino"
                placeholder="Seleccione un país"
                clearable
                return-object
                hide-details
                dense
                @change="cargarPuertoDestino"
                prepend-icon="mdi-import"
              >
              </v-autocomplete>
            </div>
            <!-- PUERTO DSTINO -->
            <div class="col-12">
              <v-autocomplete
                :items="puertosDestino"
                v-model="datosFormulario.puertoDestino"
                item-text="puerto_descripcion"
                label="Puerto de Destino"
                placeholder="Seleccione un puerto"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                multiple
                dense
                prepend-icon="mdi-import"
                deletable-chips
                small-chips
              >
              </v-autocomplete>
            </div>
            <!-- CONTENEDOR -->
            <div class="col-12" v-if="tipo == 'fcl'">
              <v-autocomplete
                :items="$store.state.calculadora.contendedorCalc"
                v-model="datosFormulario.contenedor"
                item-text="contenedores_nombre"
                label="Tipo de Contenedor"
                placeholder="Seleccione un tipo Contenedor"
                clearable
                dense
                return-object
                hide-details
                hide-selected
                hide-no-data
                prepend-icon="mdi-truck-cargo-container"
              >
              </v-autocomplete>
            </div>
            <!-- MONTO MÍNIMO -->
            <div class="col-4" v-if="tipo != 'fcl'">
              <v-text-field
                label="Volumen Mínimo"
                v-model="datosFormulario.volumen_minimo"
                step="0.01"
                type="number"
                suffix="m3"
                dense
              ></v-text-field>
            </div>
            <!-- VOLUMEN DESDE -->
            <div class="col-4" v-if="tipo != 'fcl'">
              <v-text-field
                label="Volumen Desde"
                v-model="datosFormulario.volumen_desde"
                step="0.01"
                type="number"
                suffix="m3"
                dense
              ></v-text-field>
            </div>
            <!-- VOLUMEN HASTA -->
            <div class="col-4" v-if="tipo != 'fcl'">
              <v-text-field
                label="Volumen Hasta"
                v-model="datosFormulario.volumen_hasta"
                step="0.01"
                type="number"
                suffix="m3"
                dense
              ></v-text-field>
            </div>

            <!-- MONEDA -->
            <div class="col-4">
              <v-autocomplete
                :items="$store.state.moneda.moneda"
                v-model="datosFormulario.moneda"
                item-text="moneda_descripcion"
                label="Moneda"
                placeholder="Seleccione una moneda"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                dense
                @change="obtenerSimbol()"
              >
              </v-autocomplete>
            </div>
            <!-- COSTO MÍNIMO -->
            <div class="col-4" v-if="tipo != 'fcl'">
              <v-text-field
                label="Costo mínimo"
                v-model="datosFormulario.costo_minimo"
                step="0.01"
                type="number"
                :prefix="symbol"
                dense
              ></v-text-field>
            </div>

            <!-- COSTO -->
            <div class="col-4">
              <v-text-field
                label="Costo"
                v-model="datosFormulario.costo"
                step="0.01"
                type="number"
                :prefix="symbol"
                dense
              ></v-text-field>
            </div>
            <!-- SERVICIO -->
            <div class="col-6" v-if="tipo != 'fcl'">
              <v-text-field
                label="SERVICIO/ VÍA/ TRANSBORDO"
                v-model="datosFormulario.servicio"
                dense
              ></v-text-field>
            </div>
            <!-- FRECUENCIA -->
            <div class="col-6" v-if="tipo != 'fcl'">
              <v-autocomplete
                :items="frecuencias"
                v-model="datosFormulario.frecuencia"
                label="Frecuencia"
                placeholder="Seleccione una frecuencia"
                clearable
                hide-details
                hide-selected
                hide-no-data
                dense
              >
              </v-autocomplete>
            </div>
            <!--  TT APROX -->
            <div class="col-6" v-if="tipo == 'lcl'">
              <v-text-field
                label="T.T APROX"
                v-model="datosFormulario.tt_aprox"
                step="0.01"
                type="number"
                dense
              >
              </v-text-field>
            </div>
            <!-- RECARGOS -->
            <div class="col-6" v-if="tipo == 'lcl'">
              <v-text-field
                label="Recargos"
                v-model="datosFormulario.recargps"
                dense
              >
              </v-text-field>
            </div>
            <!-- AGENTES -->
            <div class="col-12" v-if="tipo != 'fcl'">
              <v-text-field
                label="Agente"
                v-model="datosFormulario.agente"
                dense
              >
              </v-text-field>
            </div>
            <!-- NAVIERA -->
            <div class="col-12" v-if="tipo == 'fcl'">
              <v-autocomplete
                :items="$store.state.calculadora.navieraCalc"
                v-model="datosFormulario.naviera"
                item-text="navieras_nombre"
                label="Naviera"
                placeholder="Seleccione un Naviera"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                dense
                prepend-icon="mdi-shipping-pallet"
              >
              </v-autocomplete>
            </div>
            <!-- CORTES -->
            <div class="col-6" v-if="tipo == 'aereo'">
              <v-text-field
                label="Cortes"
                v-model="datosFormulario.cortes"
                dense
              >
              </v-text-field>
            </div>
            <!--  CARRIER TT  -->
            <div class="col-6" v-if="tipo == 'aereo'">
              <v-text-field
                label="Carrier T.T "
                v-model="datosFormulario.carrier_tt"
                step="0.01"
                type="number"
                dense
              >
              </v-text-field>
            </div>
            <!-- FECHA DE VALIDEZ -->
            <div class="col-12">
              <label for="">VALIDEZ</label>
            </div>
            <!-- DEDE -->
            <div class="col-6">
              <v-text-field
                label="Desde"
                v-model="datosFormulario.vigencia_desde"
                dense
                type="date"
              >
              </v-text-field>
            </div>
            <!-- HASTA -->
            <div class="col-6">
              <v-text-field
                label="Hasta"
                v-model="datosFormulario.vigencia_hasta"
                dense
                type="date"
              >
              </v-text-field>
            </div>
          </div>
        </v-card-actions>
        <v-card-actions>
          <v-flex text-right>
            <v-btn class="mx-1" text color="success" @click="anadirRegistros()">
              Agregar
            </v-btn>
            <v-btn class="mx-1" text color="red" @click="offcanvas = false">
              Cancelar
            </v-btn>
          </v-flex>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import readXlsFile from "read-excel-file";
import exportXlsFile from "export-from-json";
import moment from "moment";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';
import { mapActions } from "vuex";
export default {
  data() {
    return {
      tipo: "lcl",
      tipoSelected: "lcl",
      excel: null,
      count: 0,
      subir: false,
      procesando: false,
      procesando2: false,
      sucursal: [],
      sucursales: null,
      registrarFlag: false,
      offcanvas: false,
      importacionflag: "true",
      symbol: "",
      headerLCL: [
        { text: "PAIS ORIGEN", value: "pais_origen", sortable: false },
        { text: "PUERTO ORIGEN", value: "puerto_origen", sortable: false },
        { text: "PAIS DESTINO", value: "pais_destino", sortable: false },
        { text: "PUERTO DESTINO", value: "puerto_destino", sortable: false },
        { text: "VOL MIN", value: "volumen_minimo", sortable: false },
        { text: "VOL DESDE", value: "volumen_desde", sortable: false },
        { text: "VOL HASTA", value: "volumen_hasta", sortable: false },
        { text: "COSTO MINIMO", value: "costo_minimo", sortable: false },
        { text: "COSTO", value: "costo", sortable: false },
        { text: "MONEDA", value: "moneda", sortable: false },
        { text: "SERVICIO", value: "servicio", sortable: false },
        { text: "FRECUENCA", value: "frecuencia", sortable: false },
        { text: "TT APROX", value: "tt_aprox", sortable: false },
        { text: "RECARGOS", value: "recargos", sortable: false },
        { text: "AGENTE", value: "agente", sortable: false },
        { text: "VIGENCIA DESDE", value: "vigencia_desde", sortable: false },
        { text: "VIGENCIA HASTA", value: "vigencia_hasta", sortable: false },
      ],
      headerFCL: [
        { text: "PAÍS ORIGEN", value: "pais_origen", sortable: false },
        { text: "PUERTO ORIGEN", value: "puerto_origen", sortable: false },
        { text: "PAÍS DESTINO", value: "pais_destino", sortable: false },
        { text: "PUERTO DESTINO", value: "puerto_destino", sortable: false },
        { text: "TIPO CONTENEDOR", value: "Tipo_contenedor", sortable: false },
        { text: "COSTO", value: "costo", sortable: false },
        { text: "MONEDA", value: "moneda", sortable: false },
        { text: "NAVIERA", value: "Naviera", sortable: false },
        { text: "DESDE", value: "vigencia_desde", sortable: false },
        { text: "HASTA", value: "vigencia_hasta", sortable: false },
      ],
      headerAereo: [
        { text: "PAÍS DESTINO", value: "pais_origen", sortable: false },
        { text: "PUERTO DESTINO", value: "puerto_origen", sortable: false },
        { text: "PAÍS DESTINO", value: "pais_destino", sortable: false },
        { text: "PUERTO DESTINO", value: "puerto_destino", sortable: false },
        { text: "VOL. MÍNIMO", value: "volumen_minimo", sortable: false },
        { text: "VOL. DESDE", value: "volumen_desde", sortable: false },
        { text: "VOL. HASTA", value: "volumen_hasta", sortable: false },
        { text: "COSTO MÍNIMO", value: "costo_minimo", sortable: false },
        { text: "COSTO ", value: "costo", sortable: false },
        { text: "MONEDA", value: "moneda", sortable: false },
        { text: "SERVICIO", value: "servicio", sortable: false },
        { text: "FRECUENCIA", value: "frecuencia", sortable: false },
        { text: "CORTES", value: "cortes", sortable: false },
        { text: "CARRIER TT", value: "carrier_tt", sortable: false },
        { text: "AGENTE", value: "agente", sortable: false },
        { text: "DESDE", value: "vigencia_desde", sortable: false },
        { text: "HASTA", value: "vigencia_hasta", sortable: false },
      ],
      itemsLCL: [],
      itemsFCL: [],
      itemsAereo: [],
      procesarflag: false,
      puertosOrigen: [],
      puertosDestino: [],
      frecuencias: [
        { value: "SEMANAL", text: "SEMANAL" },
        { value: "QUINCENAL", text: "QUINCENAL" },
        { value: "MENSUAL", text: "MENSUAL" },
        { value: "INDEFINIDO", text: "INDEFINIDO" },
      ],
      datosFormulario: {
        paisOrigen: [],
        puertoOrigen: [],
        paisDestino: [],
        puertoDestino: [],
        volumen_minimo: 0,
        volumen_hasta: 0,
        volumen_max: 0,
        costo_minimo: 0,
        costo: 0,
        tt_aprox: 0,
        moneda: [],
        symbol: "",
        recargos: "",
        servicio: "DIRECTO",
        frecuencia: "",
        recargps: "",
        agente: "PIER17",
        desde: null,
        hasta: null,
        contenedor: [],
        naviera: [],
        cortes: "",
        carrier_tt: 0,
      },
    };
  },
  methods: {
    ...mapActions([
      "_getPais",
      "CargarPuertoPorTipoPorPais",
      "CargarMoneda",
      "CargarnavieraCalc",
      "CargarcontendedorCalc",
      "CargarSucursal",
    ]),
    computed: {
      //   ...mapState(["$store.state.itemsPais", "$store.state.moneda.moneda", "$store.state.calculadora.navieraCalc", "$store.state.calculadora.contendedorCalc"]),
    },
    async procesarExcel() {
      const file = document.getElementById("excel");
      let validacionFormato = await this.validarCabecerasExcel(file.files[0]);

      if (validacionFormato == true) {
        switch (this.tipo) {
          case "lcl":
            readXlsFile(file.files[0]).then((rows) => {
              this.procesarLCL(rows);
            });
            break;
          case "fcl":
            readXlsFile(file.files[0]).then((rows) => {
              this.procesarFCL(rows);
            });
            break;
          case "aereo":
            readXlsFile(file.files[0]).then((rows) => {
              this.procesarAereo(rows);
            });
            break;

          default:
            break;
        }
      }
    },
    exportarFormato() {
      this.procesando2 = true;
      var data = [];
      var fileName = "";
      var exportType = exportXlsFile.types.xls;
      switch (this.tipo) {
        case "lcl":
          data = [
            {
              Continente: "",
              pais_origen: "",
              puerto_origen: "",
              pais_destino: "",
              puerto_destino: "",
              volumen_minimo: "",
              volumen_desde: "",
              volumen_hasta: "",
              costo_minimo: "",
              costo: "",
              moneda: "",
              servicio: "",
              frecuencia: "",
              cortes: "",
              carrier_tt: "",
              agente: "",
              vigencia_desde: "",
              vigencia_hasta: "",
            },
          ];
          fileName = "FORMATO LCL";

          break;
        case "fcl":
          data = [
            {
              Continente: "",
              pais_origen: "",
              puerto_origen: "",
              pais_destino: "",
              puerto_destino: "",
              Tipo_contenedor: "",
              costo: "",
              moneda: "",
              Naviera: "",
              vigencia_desde: "",
              vigencia_hasta: "",
            },
          ];
          fileName = "FORMATO FCL";

          break;
        case "aereo":
          data = [
            {
              Continente: "",
              pais_origen: "",
              puerto_origen: "",
              pais_destino: "",
              puerto_destino: "",
              volumen_minimo: "",
              volumen_desde: "",
              volumen_hasta: "",
              costo_minimo: "",
              costo: "",
              moneda: "",
              servicio: "",
              frecuencia: "",
              cortes: "",
              carrier_tt: "",
              agente: "",
              vigencia_desde: "",
              vigencia_hasta: "",
            },
          ];
          fileName = "FORMATO AÉREO";

          break;

        default:
          break;
      }
      setTimeout(() => {
        exportXlsFile({ data, fileName, exportType });
        this.procesando2 = false;
      }, 800);
    },
    async procesarLCL(rows) {
      var vm = this;
      vm.procesando = true;
      let datos = [];
      for (let index = 0; index < rows.length; index++) {
        if (index > 0) {
          datos.push({
            Continente: rows[index][0],
            pais_origen: rows[index][1],
            puerto_origen: rows[index][2],
            pais_destino: rows[index][3],
            puerto_destino: rows[index][4],
            volumen_minimo: rows[index][5],
            volumen_desde: rows[index][6],
            volumen_hasta: rows[index][7],
            costo_minimo: rows[index][8],
            costo: rows[index][9],
            moneda: rows[index][10],
            servicio: rows[index][11],
            frecuencia: rows[index][12],
            tt_aprox: rows[index][13],
            recargos: rows[index][14],
            agente: rows[index][15],
            vigencia_desde: moment(rows[index][16]).format("YYYY-MM-DD"),
            vigencia_hasta: moment(rows[index][17]).format("YYYY-MM-DD"),
          });
        }
      }
      // empezar a validar los datos
      let datosValidar = [];

      datos.map(function (element) {
        datosValidar.push(element);
      });

      // empezar a validar los datos

      let pais_origen2 = [];
      let puerto_origen2 = [];
      let pais_destino2 = [];
      let puerto_destino2 = [];
      let volumen_minimo2 = [];
      let volumen_desde2 = [];
      let volumen_hasta2 = [];
      let costo_minimo2 = [];
      let costo2 = [];
      let moneda2 = [];
      let servicio2 = [];
      let frecuencia2 = [];
      let tt_aprox2 = [];
      let recargos2 = [];
      let agente2 = [];
      let vigencia_desde2 = [];
      let vigencia_hasta2 = [];

      datos.forEach((element) => {
        pais_origen2.push(element.pais_origen);
        puerto_origen2.push(element.puerto_origen);
        pais_destino2.push(element.pais_destino);
        puerto_destino2.push(element.puerto_destino);
        volumen_minimo2.push(element.volumen_minimo);
        volumen_desde2.push(element.volumen_desde);
        volumen_hasta2.push(element.volumen_hasta);
        costo_minimo2.push(element.costo_minimo);
        costo2.push(element.costo);
        moneda2.push(element.moneda);
        servicio2.push(element.servicio);
        frecuencia2.push(element.frecuencia);
        tt_aprox2.push(element.tt_aprox);
        recargos2.push(element.recargos);
        agente2.push(element.agente);
        vigencia_desde2.push(
          moment(element.vigencia_desde).format("YYYY-MM-DD")
        );
        vigencia_hasta2.push(
          moment(element.vigencia_hasta).format("YYYY-MM-DD")
        );
      });
      //  AXIOS
      var headers = {
       
        "Content-Type": "application/json",
      };
      var data = {
        id_branch: JSON.parse(sessionStorage.getItem("branch")),
        pais_origen: pais_origen2,
        puerto_origen: puerto_origen2,
        pais_destino: pais_destino2,
        puerto_destino: puerto_destino2,
        volumen_minimo: volumen_minimo2,
        volumen_desde: volumen_desde2,
        volumen_hasta: volumen_hasta2,
        costo_minimo: costo_minimo2,
        costo: costo2,
        moneda: moneda2,
        servicio: servicio2,
        frecuencia: frecuencia2,
        tt_aprox: tt_aprox2,
        recargos: recargos2,
        agente: agente2,
        vigencia_desde: vigencia_desde2,
        vigencia_hasta: vigencia_hasta2,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + `validar_registros_lcl`,
        headers: headers,
        data: data,
      };

      let response = await axios(config).then((response) => {
        return response.data;
      });

      if (response.estadoflag == true) {
        vm.subir = true;
        datosValidar.map(function (element) {
          vm.itemsLCL.push(element);
        });
      } else {
        let text =
          response.permiso == false
            ? "EXISTEN DATOS POR CORREGIR. NO SE CARGARÁN LOS DATOS."
            : " ";
        Swal.fire({
          title: `OJO ATENCION  LEER BIEN. .${text}`,
          icon: "error",
          width: "80%",
          scrollbarPadding: true,
          html: `<div style="font-size: 1.5rem">${response.mensaje}</div>`,
          showDenyButton: true,
          confirmButtonText: "Aceptar",
          denyButtonText: `Corregir Errores`,
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            datosValidar.map(function (element) {
              vm.itemsLCL.push(element);
            });
            vm.subir = true;
          } else if (result.isDenied) {
            Swal.fire(
              "No se cargaron los REGISTROS procese un nuevo documento.",
              "",
              "info"
            );
          }
        });
      }

      vm.procesando = false;
    },
    async procesarFCL(rows) {
      var vm = this;
      vm.procesando = true;
      let datos = [];

      for (let index = 0; index < rows.length; index++) {
        if (index > 0) {
          datos.push({
            Continente: rows[index][0],
            pais_origen: rows[index][1],
            puerto_origen: rows[index][2],
            pais_destino: rows[index][3],
            puerto_destino: rows[index][4],
            Tipo_contenedor: rows[index][5],
            costo: rows[index][6],
            moneda: rows[index][7],
            Naviera: rows[index][8],
            vigencia_desde: moment(rows[index][9]).format("YYYY-MM-DD"),
            vigencia_hasta: moment(rows[index][10]).format("YYYY-MM-DD"),
          });
        }
      }

      // empezar a validar los datos
      let datosValidar = [];

      datos.map(function (element) {
        datosValidar.push(element);
      });
      // empezar a validar los datos
      let pais_origen2 = [];
      let puerto_origen2 = [];
      let pais_destino2 = [];
      let puerto_destino2 = [];
      let Tipo_contenedor2 = [];
      let moneda2 = [];
      let Naviera2 = [];
      let vigencia_desde2 = [];
      let vigencia_hasta2 = [];

      datos.forEach((element) => {
        pais_origen2.push(element.pais_origen);
        puerto_origen2.push(element.puerto_origen);
        pais_destino2.push(element.pais_destino);
        puerto_destino2.push(element.puerto_destino);
        Tipo_contenedor2.push(element.Tipo_contenedor);
        moneda2.push(element.moneda);
        Naviera2.push(element.Naviera);
        vigencia_desde2.push(
          moment(element.vigencia_desde).format("YYYY-MM-DD")
        );
        vigencia_hasta2.push(
          moment(element.vigencia_hasta).format("YYYY-MM-DD")
        );
      });
      var headers = {
       
        "Content-Type": "application/json",
      };
      var data = {
        id_branch: JSON.parse(sessionStorage.getItem("branch")),
        pais_origen: pais_origen2,
        puerto_origen: puerto_origen2,
        pais_destino: pais_destino2,
        puerto_destino: puerto_destino2,
        Tipo_contenedor: Tipo_contenedor2,
        moneda: moneda2,
        Naviera: Naviera2,
        vigencia_desde: vigencia_desde2,
        vigencia_hasta: vigencia_hasta2,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + `validar_registros_fcl`,
        headers: headers,
        data: data,
      };

      let response = await axios(config).then((response) => {
        return response.data;
      });

      if (response.estadoflag == true) {
        vm.subir = true;

        datosValidar.map(function (element) {
          vm.itemsFCL.push(element);
        });
      } else {
        let text =
          response.permiso == false
            ? "EXISTEN DATOS POR CORREGIR. NO SE CARGARÁN LOS DATOS."
            : " ";
        Swal.fire({
          title: `OJO ATENCION  LEER BIEN. .${text}`,
          icon: "error",
          width: "80%",
          scrollbarPadding: true,
          html: `<div style="font-size: 1.5rem">${response.mensaje}</div>`,
          showDenyButton: true,
          confirmButtonText: "Aceptar",
          denyButtonText: `Corregir Errores`,
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            if (response.permiso == false) {
              vm.subir = response.permiso;
            } else {
              datosValidar.map(function (element) {
                vm.itemsFCL.push(element);
                vm.subir = response.permiso;
              });
            }
          } else if (result.isDenied) {
            Swal.fire(
              "No se cargaron los REGISTROS procese un nuevo documento.",
              "",
              "info"
            );
          }
        });
      }

      vm.procesando = false;
    },

    async procesarAereo(rows) {
      var vm = this;
      vm.procesando = true;
      let datos = [];

      for (let index = 0; index < rows.length; index++) {
        if (index > 0) {
          datos.push({
            Continente: rows[index][0],
            pais_origen: rows[index][1],
            puerto_origen: rows[index][2],
            pais_destino: rows[index][3],
            puerto_destino: rows[index][4],
            volumen_minimo: rows[index][5],
            volumen_desde: rows[index][6],
            volumen_hasta: rows[index][7],
            costo_minimo: rows[index][8],
            costo: rows[index][9],
            moneda: rows[index][10],
            servicio: rows[index][11],
            frecuencia: rows[index][12],
            cortes: rows[index][13],
            carrier_tt: rows[index][14],
            agente: rows[index][15],
            vigencia_desde: moment(rows[index][16]).format("YYYY-MM-DD"),
            vigencia_hasta: moment(rows[index][17]).format("YYYY-MM-DD"),
          });
        }
      }

      // empezar a validar los datos
      let datosValidar = [];

      datos.map(function (element) {
        datosValidar.push(element);
      });
      // empezar a validar los datos
      let pais_origen2 = [];
      let puerto_origen2 = [];
      let pais_destino2 = [];
      let puerto_destino2 = [];
      // let volumen_minimo2 = [];
      // let volumen_desde2 = [];
      // let volumen_hasta2 = [];
      // let costo_minimo2 = [];
      // let costo2 = [];
      let moneda2 = [];
      let servicio2 = [];
      let frecuencia2 = [];
      // let cortes2 = [];
      // let carrier_tt2 = [];
      let agente2 = [];
      let vigencia_desde2 = [];
      let vigencia_hasta2 = [];

      datos.forEach((element) => {
        pais_origen2.push(element.pais_origen);
        puerto_origen2.push(element.puerto_origen);
        pais_destino2.push(element.pais_destino);
        puerto_destino2.push(element.puerto_destino);
        moneda2.push(element.moneda);
        servicio2.push(element.servicio);
        frecuencia2.push(element.frecuencia);
        agente2.push(element.agente);
        vigencia_desde2.push(
          moment(element.vigencia_desde).format("YYYY-MM-DD")
        );
        vigencia_hasta2.push(
          moment(element.vigencia_hasta).format("YYYY-MM-DD")
        );
      });
      var headers = {
       
        "Content-Type": "application/json",
      };
      var data = {
        id_branch: JSON.parse(sessionStorage.getItem("branch")),
        pais_origen: pais_origen2,
        puerto_origen: puerto_origen2,
        pais_destino: pais_destino2,
        puerto_destino: puerto_destino2,
        moneda: moneda2,
        servicio: servicio2,
        frecuencia: frecuencia2,
        agente: agente2,
        vigencia_desde: vigencia_desde2,
        vigencia_hasta: vigencia_hasta2,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + `validar_registros_aereo`,
        headers: headers,
        data: data,
      };

      let response = await axios(config).then((response) => {
        return response.data;
      });

      if (response.estadoflag == true) {
        vm.subir = true;
        datosValidar.map(function (element) {
          vm.itemsAereo.push(element);
        });
      } else {
        let text =
          response.permiso == false
            ? "EXISTEN DATOS POR CORREGIR."
            : " Sino desea cargar los datos y procesar un nuevo documento presione Cancelar.";
        Swal.fire({
          title: `OJO ATENCION  LEER BIEN. .${text}`,
          icon: "error",
          width: "80%",
          scrollbarPadding: true,
          html: response.mensaje,
          showDenyButton: true,
          confirmButtonText: "Aceptar",
          denyButtonText: `Cancelar`,
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            if (response.permiso == false) {
              vm.subir = response.permiso;
            } else {
              datosValidar.map(function (element) {
                vm.itemsAereo.push(element);
                vm.subir = response.permiso;
              });
            }
          } else if (result.isDenied) {
            Swal.fire(
              "No se cargaron los REGISTROS procese un nuevo documento.",
              "",
              "info"
            );
          }
        });
      }

      vm.procesando = false;
    },
    change() {
      let vm = this;

      if (vm.tipoSelected != vm.tipo) {
        Swal.fire({
          icon: "info",
          title: "Advertencia",
          showDenyButton: true,
          denyButtonText: `Regresar`,
          text: `Va a cambiar de ${
            vm.tipoSelected == "lcl"
              ? "LCL"
              : vm.tipoSelected == "fcl"
              ? "FLC"
              : "AÉRO"
          } a ${
            vm.tipo == "lcl" ? "LCL" : vm.tipo == "fcl" ? "FLC" : "AÉRO"
          }. Perderá todos los datos procesados. ¿Desea seguro continuar.?`,
          confirmButtonText: "Continuar",
        }).then((result) => {
          if (result.isConfirmed) {
            vm.tipoSelected = vm.tipo;
            vm.procesarflag = false;
            vm.subir = false;
            vm.itemsLCL = [];
            vm.itemsFCL = [];
            vm.itemsAereo = [];
            vm.excel = null;
          }
          if (result.isDenied) {
            vm.tipo = vm.tipoSelected;
          }
        });
      }
    },
    async validarCabecerasExcel(data) {
      let vm = this;
      let count = 0;
      let validacion = true;
      let headerLCL = [
        { name: "Continente" },
        { name: "pais_origen" },
        { name: "puerto_origen" },
        { name: "pais_destino" },
        { name: "puerto_destino" },
        { name: "volumen_minimo" },
        { name: "volumen_desde" },
        { name: "volumen_hasta" },
        { name: "costo_minimo" },
        { name: "costo" },
        { name: "moneda" },
        { name: "servicio" },
        { name: "frecuencia" },
        { name: "tt_aprox" },
        { name: "recargos" },
        { name: "agente" },
        { name: "vigencia_desde" },
        { name: "vigencia_hasta" },
      ];
      let headerFCL = [
        { name: "Continente" },
        { name: "pais_origen" },
        { name: "puerto_origen" },
        { name: "pais_destino" },
        { name: "puerto_destino" },
        { name: "Tipo_contenedor" },
        { name: "costo" },
        { name: "moneda" },
        { name: "Naviera" },
        { name: "vigencia_desde" },
        { name: "vigencia_hasta" },
      ];
      let headerAereo = [
        { name: "CONTINENTE" },
        { name: "pais_origen" },
        { name: "puerto_origen" },
        { name: "pais_destino" },
        { name: "puerto_destino" },
        { name: "volumen_minimo" },
        { name: "volumen_desde" },
        { name: "volumen_hasta" },
        { name: "costo_minimo" },
        { name: "costo" },
        { name: "moneda" },
        { name: "servicio" },
        { name: "frecuencia" },
        { name: "cortes" },
        { name: "carrier_tt" },
        { name: "agente" },
        { name: "vigencia_desde" },
        { name: "vigencia_hasta" },
      ];
      let datosExcel = await readXlsFile(data).then((rows) => {
        return rows[0];
      });
      switch (vm.tipo) {
        case "lcl":
          datosExcel.forEach((element) => {
            count = headerLCL.filter((v) => v.name == element).length;
            if (count == 0) {
              validacion = false;
            }
          });
          break;
        case "fcl":
          datosExcel.forEach((element) => {
            count = headerFCL.filter((v) => v.name == element).length;
            if (count == 0) {
              validacion = false;
            }
          });
          break;
        case "aereo":
          datosExcel.forEach((element) => {
            count = headerAereo.filter((v) => v.name == element).length;

            if (count == 0) {
              validacion = false;
            }
          });
          break;

        default:
          break;
      }
      if (validacion == false) {
        Swal.fire({
          icon: "warning",
          text: "El archivo seleccionado, no coincide con el tipo seleccionado.",
        });
      }
      return validacion;
    },

    async registrar() {
      let vm = this;
      vm.procesando = true;
      let sucursal = "";
      vm.sucursales.map((item) => {
        if (sucursal) {
          sucursal += "," + item;
        } else {
          sucursal += item;
        }
      });
      let config = null;
      let pais_origen = [];
      let puerto_origen = [];
      let pais_destino = [];
      let puerto_destino = [];
      let volumen_minimo = [];
      let volumen_desde = [];
      let volumen_hasta = [];
      let costo_minimo = [];
      let costo = [];
      let moneda = [];
      let servicio = [];
      let frecuencia = [];
      let tt_aprox = [];
      let recargos = [];
      let agente = [];
      let vigencia_desde = [];
      let vigencia_hasta = [];
      let Tipo_contenedor = [];
      let Naviera = [];
      let cortes = [];
      let carrier_tt = [];
      let data = null;
      let response = null;
      var headers = {
       
        "Content-Type": "application/json",
      };
      if (vm.tipo == "lcl") {
        vm.itemsLCL.forEach((element) => {
          pais_origen.push(element.pais_origen);
          puerto_origen.push(element.puerto_origen);
          pais_destino.push(element.pais_destino);
          puerto_destino.push(element.puerto_destino);
          volumen_minimo.push(element.volumen_minimo);
          volumen_desde.push(element.volumen_desde);
          volumen_hasta.push(element.volumen_hasta);
          costo_minimo.push(element.costo_minimo);
          costo.push(element.costo);
          moneda.push(element.moneda);
          servicio.push(element.servicio);
          frecuencia.push(element.frecuencia);
          tt_aprox.push(element.tt_aprox);
          recargos.push(element.recargos);
          agente.push(element.agente);
          vigencia_desde.push(
            moment(element.vigencia_desde).format("YYYY-MM-DD")
          );
          vigencia_hasta.push(
            moment(element.vigencia_hasta).format("YYYY-MM-DD")
          );
        });
        data = {
          id_branch: JSON.parse(sessionStorage.getItem("branch")),
          pais_origen: pais_origen,
          puerto_origen: puerto_origen,
          pais_destino: pais_destino,
          puerto_destino: puerto_destino,
          volumen_minimo: volumen_minimo,
          volumen_desde: volumen_desde,
          volumen_hasta: volumen_hasta,
          costo_minimo: costo_minimo,
          costo: costo,
          moneda: moneda,
          servicio: servicio,
          frecuencia: frecuencia,
          tt_aprox: tt_aprox,
          recargos: recargos,
          agente: agente,
          vigencia_desde: vigencia_desde,
          vigencia_hasta: vigencia_hasta,
          importarcionflag: vm.importacionflag == "true" ? true : false,
          sucursal: sucursal,
        };

        config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + `registrar_carga_masiva_lcl`,
          headers: headers,
          data: data,
        };
        response = await axios(config);
        if (response.data.estadoflag == true) {
          Swal.fire({
            icon: "success",
            title: response.data.data[0].mensaje,
          });
        }
      }
      if (vm.tipo == "fcl") {
        vm.itemsFCL.forEach((element) => {
          Tipo_contenedor.push(element.Tipo_contenedor);
          costo.push(element.costo);
          moneda.push(element.moneda);
          Naviera.push(element.Naviera);
          pais_origen.push(element.pais_origen);
          puerto_origen.push(element.puerto_origen);
          pais_destino.push(element.pais_destino);
          puerto_destino.push(element.puerto_destino);
          vigencia_desde.push(
            moment(element.vigencia_desde).format("YYYY-MM-DD")
          );
          vigencia_hasta.push(
            moment(element.vigencia_hasta).format("YYYY-MM-DD")
          );
        });
        data = {
          id_branch: JSON.parse(sessionStorage.getItem("branch")),
          Tipo_contenedor: Tipo_contenedor,
          costo: costo,
          moneda: moneda,
          Naviera: Naviera,
          pais_origen: pais_origen,
          puerto_origen: puerto_origen,
          pais_destino: pais_destino,
          puerto_destino: puerto_destino,
          vigencia_desde: vigencia_desde,
          vigencia_hasta: vigencia_hasta,
          importarcionflag: vm.importacionflag == "true" ? true : false,
          sucursal: sucursal,
        };
        config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + `registrar_carga_masiva_fcl`,
          headers: headers,
          data: data,
        };
        response = await axios(config);

        if (response.data.estadoflag == true) {
          Swal.fire({
            icon: "success",
            title: response.data.data[0].mensaje,
          });
        }
      }
      if (vm.tipo == "aereo") {
        vm.itemsAereo.forEach((element) => {
          pais_origen.push(element.pais_origen),
            puerto_origen.push(element.puerto_origen),
            pais_destino.push(element.pais_destino),
            puerto_destino.push(element.puerto_destino),
            volumen_minimo.push(element.volumen_minimo),
            volumen_desde.push(element.volumen_desde),
            volumen_hasta.push(element.volumen_hasta),
            costo_minimo.push(element.costo_minimo),
            costo.push(element.costo),
            moneda.push(element.moneda),
            servicio.push(element.servicio),
            frecuencia.push(element.frecuencia),
            cortes.push(element.cortes),
            carrier_tt.push(element.carrier_tt),
            agente.push(element.agente),
            vigencia_hasta.push(element.vigencia_hasta),
            vigencia_desde.push(
              moment(element.vigencia_desde).format("YYYY-MM-DD")
            );
          vigencia_hasta.push(
            moment(element.vigencia_hasta).format("YYYY-MM-DD")
          );
        });
        data = {
          id_branch: JSON.parse(sessionStorage.getItem("branch")),
          pais_origen: pais_origen,
          puerto_origen: puerto_origen,
          pais_destino: pais_destino,
          puerto_destino: puerto_destino,
          volumen_minimo: volumen_minimo,
          volumen_desde: volumen_desde,
          volumen_hasta: volumen_hasta,
          costo_minimo: costo_minimo,
          costo: costo,
          moneda: moneda,
          servicio: servicio,
          frecuencia: frecuencia,
          cortes: cortes,
          carrier_tt: carrier_tt,
          agente: agente,
          vigencia_hasta: vigencia_hasta,
          vigencia_desde: vigencia_desde,
          importarcionflag: vm.importacionflag == "true" ? true : false,
          sucursal: sucursal,
        };
        config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + `registrar_carga_masiva_aereo`,
          headers: headers,
          data: data,
        };
        response = await axios(config);
        if (response.data.estadoflag == true) {
          Swal.fire({
            icon: "success",
            title: response.data.data[0].mensaje,
          });
        }
      }
      vm.procesando = false;
      vm.registrarFlag = false;
      this.limpiarData();
    },
    limpiarData() {
      this.tipo = "lcl";
      this.tipoSelected = "lcl";
      this.excel = null;
      this.count = 0;
      this.subir = false;
      this.procesando = false;
      this.procesando2 = false;
      this.sucursales = null;
      this.registrarFlag = false;
      this.importacionflag = "true";
      this.itemsLCL = [];
      this.itemsFCL = [];
      this.itemsAereo = [];
      this.procesarflag = false;
    },
    async cargarPuertoDestino() {
      this.puertosDestino = [];
      if (this.datosFormulario.paisDestino) {
        this.puertosDestino = await this.CargarPuertoPorTipoPorPais({
          id_pais: this.datosFormulario.paisDestino.pais_id,
          tipo: "M",
        });
      }
    },
    async cargarPuertoOrigen() {
      this.puertosOrigen = [];
      if (this.datosFormulario.paisOrigen) {
        this.puertosOrigen = await this.CargarPuertoPorTipoPorPais({
          id_pais: this.datosFormulario.paisOrigen.pais_id,
          tipo: "M",
        });
      }
    },
    obtenerSimbol() {
      this.symbol = "";
      if (this.moneda) {
        this.symbol = this.moneda.moneda_symbol;
      }
    },
    anadirRegistros() {
      let vm = this;

      if (vm.tipo == "lcl") {
        vm.datosFormulario.puertoOrigen.forEach((ePortOrigin) => {
          vm.datosFormulario.puertoDestino.forEach((ePortDestino) => {
            vm.itemsLCL.push({
              pais_origen: vm.datosFormulario.paisOrigen.pais_descripcion,
              puerto_origen: ePortOrigin.puerto_descripcion,
              pais_destino: vm.datosFormulario.paisDestino.pais_descripcion,
              puerto_destino: ePortDestino.puerto_descripcion,
              volumen_minimo: vm.datosFormulario.volumen_minimo,
              volumen_desde: vm.datosFormulario.volumen_desde,
              volumen_hasta: vm.datosFormulario.volumen_hasta,
              costo_minimo: vm.datosFormulario.costo_minimo,
              costo: vm.datosFormulario.costo,
              moneda: vm.datosFormulario.moneda.moneda_descripcion,
              servicio: vm.datosFormulario.servicio,
              frecuencia: vm.datosFormulario.frecuencia,
              tt_aprox: vm.datosFormulario.tt_aprox,
              recargos: vm.datosFormulario.recargos,
              agente: vm.datosFormulario.agente,
              vigencia_desde: moment(vm.datosFormulario.vigencia_desde).format(
                "YYYY-MM-DD"
              ),
              vigencia_hasta: moment(vm.datosFormulario.vigencia_hasta).format(
                "YYYY-MM-DD"
              ),
            });
          });
        });
      }
      if (vm.tipo == "fcl") {
        vm.datosFormulario.puertoOrigen.forEach((ePortOrigin) => {
          vm.datosFormulario.puertoDestino.forEach((ePortDestino) => {
            vm.itemsFCL.push({
              pais_origen: vm.datosFormulario.paisOrigen.pais_descripcion,
              puerto_origen: ePortOrigin.puerto_descripcion,
              pais_destino: vm.datosFormulario.paisDestino.pais_descripcion,
              puerto_destino: ePortDestino.puerto_descripcion,
              Tipo_contenedor:
                vm.datosFormulario.contenedor.contenedores_nombre,
              costo: vm.datosFormulario.costo,
              moneda: vm.datosFormulario.moneda.moneda_descripcion,
              Naviera: vm.datosFormulario.naviera.navieras_nombre,
              vigencia_desde: moment(vm.datosFormulario.vigencia_desde).format(
                "YYYY-MM-DD"
              ),
              vigencia_hasta: moment(vm.datosFormulario.vigencia_hasta).format(
                "YYYY-MM-DD"
              ),
            });
          });
        });
      }
      if (vm.tipo == "aereo") {
        vm.datosFormulario.puertoOrigen.forEach((ePortOrigin) => {
          vm.datosFormulario.puertoDestino.forEach((ePortDestino) => {
            vm.itemsAereo.push({
              pais_origen: vm.datosFormulario.paisOrigen.pais_descripcion,
              puerto_origen: ePortOrigin.puerto_descripcion,
              pais_destino: vm.datosFormulario.paisDestino.pais_descripcion,
              puerto_destino: ePortDestino.puerto_descripcion,
              volumen_minimo: vm.datosFormulario.volumen_minimo,
              volumen_desde: vm.datosFormulario.volumen_desde,
              volumen_hasta: vm.datosFormulario.volumen_hasta,
              costo_minimo: vm.datosFormulario.costo_minimo,
              costo: vm.datosFormulario.costo,
              moneda: vm.datosFormulario.moneda.moneda_descripcion,
              servicio: vm.datosFormulario.servicio,
              frecuencia: vm.datosFormulario.frecuencia,
              cortes: vm.datosFormulario.cortes,
              carrier_tt: vm.datosFormulario.carrier_tt,
              agente: vm.datosFormulario.agente,
              vigencia_desde: moment(vm.datosFormulario.vigencia_desde).format(
                "YYYY-MM-DD"
              ),
              vigencia_hasta: moment(vm.datosFormulario.vigencia_hasta).format(
                "YYYY-MM-DD"
              ),
            });
          });
        });
        vm.offcanvas = false;
      }
      vm.limpiarNuevoRegistro();
      vm.offcanvas = false;
      vm.subir = true;
    },
    limpiarNuevoRegistro() {
      this.datosFormulario = {
        paisOrigen: [],
        puertoOrigen: [],
        paisDestino: [],
        puertoDestino: [],
        volumen_minimo: 0,
        volumen_hasta: 0,
        volumen_max: 0,
        costo_minimo: 0,
        costo: 0,
        tt_aprox: 0,
        moneda: [],
        symbol: "",
        recargos: "",
        servicio: "DIRECTO",
        frecuencia: "",
        recargps: "",
        agente: "PIER17",
        desde: null,
        hasta: null,
        contenedor: [],
        naviera: [],
        cortes: "",
        carrier_tt: 0,
      };
    },
    validar() {
      // var vm = this
      // if () {
      // }
    },
  },
  async mounted() {
    this.$store.state.spiner = true
    await this._getPais();
    await this.CargarMoneda();
    await this.CargarSucursal();
    await this.CargarnavieraCalc();
    await this.CargarcontendedorCalc();

    this.$store.state.spiner = false
  },

  watch: {
    excel() {
      if (this.excel == null || this.excel == []) {
        this.procesarflag = false;
        this.itemsLCL = [];
        this.itemsFCL = [];
        this.itemsAereo = [];
      } else {
        this.procesarflag = true;
      }
    },
  },
};
</script>

<style></style>
