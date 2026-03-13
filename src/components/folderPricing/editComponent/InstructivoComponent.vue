<template>
  <v-container>
    <v-col cols="12">
      <template>
        <div class="text-center">
          <v-pagination
            v-model="page"
            :length="
              $store.state.pricing.opcionCostos.filter((v) => !!v.selected)
                .length
            "
            circle
          ></v-pagination>
        </div>
      </template>
    </v-col>
    <v-dialog
      v-model="aprobarflag"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card>
        <v-card-title primary-title>
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="aprobarflag = !aprobarflag">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAprobar">
            <v-row>
              <v-autocomplete
                :items="$store.state.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-text="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :no-data-text="noDataText()"
                @change="verificarMaster()"
                class="mx-5 my-5"
              >
              </v-autocomplete>
            </v-row>
          </v-form>
          <v-alert
            v-if="mostrarAdvertencia"
            border="left"
            colored-border
            type="error"
            elevation="2"
          >
            El Master seleccionado no coincide con
            {{ textValidacionCotizacionMaster.join(", ") }} asociados a la
            cotización.
            <h3>¿Está seguro, de asociar la cotización a este registro?</h3>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1" small @click="aprobar()" color="success"
            >Generar</v-btn
          >
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="aprobarflag = !aprobarflag"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="seleccionQuoteAprobar"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card>
        <v-card-title primary-title>
          <h2 class="blue--text">
            USARIO DEBE GUARDAR LOS CAMBIOS PARA PODER ENVIAR DESEA GUARDAR Y
            ENVIAR
          </h2>
          <v-spacer></v-spacer>
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1" @click="guardarQuote()" color="success"
            >Si, guardar
          </v-btn>
          <v-btn
            class="mx-1"
            color="error"
            @click="seleccionQuoteAprobar = !seleccionQuoteAprobar"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div class="col-12 mb-0 pa-0">
      <v-btn
        class="mx-1"
        color="#FF4500"
        elevation="2"
        small
        @click="imprimir()"
        v-if="!mostrarBtnAprobar()"
      >
        <v-icon color="white">mdi-printer-outline</v-icon>
      </v-btn>
      <v-btn
        class="mx-1"
        color="#004D40"
        elevation="2"
        v-if="mostrarBtnAprobar()"
        small
        @click="abrirSeleccionDeQuoteAAprobar()"
      >
        <v-icon color="white">Enviar a Operaciones - Tráfico</v-icon>
      </v-btn>
      <center>
        <h3>
          INSTRUCTIVO COMPRA
          {{ $store.state.pricing.listInstructivo[0].expediente }} - N°{{
            $store.state.pricing.listIngresosInstructivo[page - 1].nro_propuesta
          }}
        </h3>

        <h3 class="mb-1 ml-1">
          {{
            $store.state.pricing.listQuoteStatus.filter(
                  (v) => v.id == $store.state.pricing.datosPrincipales.id_status
                )[0].name
          }}
          | Exp. Master:
          {{
            $store.state.pricing.listInstructivo[0].code_master
              ? $store.state.pricing.listInstructivo[0].code_master
              : "--"
          }}
          | Exp. House:
          {{
            $store.state.pricing.listInstructivo[0].code_house
              ? $store.state.pricing.listInstructivo[0].code_house
              : "--"
          }}
        </h3>
        <h4 class="mb-1 ml-1">
          {{ $store.state.pricing.listInstructivo[0].sentido }} -
          {{ $store.state.pricing.listInstructivo[0].carga }} -
          {{ $store.state.pricing.listInstructivo[0].incoterms }}
        </h4>
      </center>
    </div>
    <v-row>
      <v-col cols="12" md="4" lg="4" xl="4">
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">DATOS DEL CLIENTE</h4>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.datosPrincipales.nombre"
              label="NOMBRE:"
              dense
            ></v-text-field>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.listInstructivo[0].direccion"
              label="DIRECCIÓN:"
              dense
            ></v-text-field>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.datosPrincipales.telefono"
              label="CONTACTO:"
              dense
            ></v-text-field>

            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.vendedor"
              label="VENDEDOR:"
              dense
            ></v-text-field>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-1 ml-1">SERVICIOS A REALIZAR</h4>
            <v-simple-table dense>
              <tbody>
                <tr
                  v-for="(servicio, i) in $store.state.pricing
                    .listServiciosInstructivo"
                  :key="i"
                >
                  <td>{{ servicio.name }}</td>
                  <td>{{ servicio.status }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">DATOS DE MOVIMIENTO DE MERCANCIA</h4>
            <v-text-field
              class="my-1"
              dense
              label="NOMBRE DEL PROVEEDOR:"
              v-model="$store.state.pricing.listInstructivo[0].proveedor"
              required
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].direccionorigen"
              label="DIRECCION ORIGEN:"
              v-if="$store.state.pricing.listInstructivo[0].icotems == 'SXWORK'"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].origen"
              label="POL:"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].destino"
              label="POD:"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              v-model="$store.state.pricing.listInstructivo[0].fiscal"
              required
              label="NOMBRE FISCAL"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].ruc"
              label="RUC:"
            >
            </v-text-field>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">
              NOTAS ESPECIALES:
              <v-btn color="success" @click="dialog = !dialog" icon>
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </h4>
            <v-simple-table dense border>
              <tbody>
                <tr
                  v-for="(nota, i) in $store.state.pricing.listInstructivo[0]
                    .notas"
                  :key="i"
                >
                  <td>{{ nota.description }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card>
        </v-col>
        <div class="col-12"></div>
      </v-col>

      <v-col cols="12" md="8" lg="8" xl="8">
        <v-row>
          <v-col cols="12">
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">INGRESOS</h4>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header align-right"></th>
                    <th class="header align-left">DESCRIPCIÓN</th>
                    <th class="header align-right"></th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(venta, index) in $store.state.pricing
                      .listIngresosInstructivo[page - 1].opcion"
                    :key="index"
                    :class="[
                      venta.descripcion === 'TOTAL'
                        ? 'totalClass'
                        : venta.descripcion === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                      venta.service === 'TOTAL'
                        ? 'totalClass'
                        : venta.service === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ venta.descripcion }}
                    </td>
                    <td>
                      {{ venta.service }}
                    </td>
                    <td class="align-right">
                      {{ venta.igv }}
                    </td>
                    <td class="align-right">
                      {{ venta.total }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">COSTOS:</h4>

              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header"></th>
                    <th class="header align-left">DESCRIPCIÓN</th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in $store.state.pricing
                      .listCostosInstructivo[page - 1].opcion"
                    :key="index"
                    :class="[
                      costo.proveedor === 'TOTAL'
                        ? 'totalClass'
                        : costo.proveedor === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                      costo.service === 'TOTAL'
                        ? 'totalClass'
                        : costo.service === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ costo.proveedor }}
                    </td>
                    <td>
                      {{ costo.service }}
                    </td>
                    <td class="align-right">
                      {{ costo.total }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            v-if="$store.state.pricing.listImpuestosInstructivo.length > 0"
          >
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">IMPUESTOS</h4>

              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header align-left">DESCRIPCIÓN</th>

                    <th class="header align-left">PORCENTAJE</th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in $store.state.pricing
                      .listImpuestosInstructivo[page - 1].opcion"
                    :key="index"
                    :class="[
                      costo.name === 'TOTAL'
                        ? 'totalClass'
                        : costo.name === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ costo.name }}
                    </td>
                    <td>
                      {{ costo.percentage }}
                    </td>

                    <td class="align-right">
                      {{ costo.valor }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="600px" transition="dialog-transition">
      <v-card>
        <v-card-title primary-title> NUEVA NOTA: </v-card-title>
        <v-card-text>
          <v-form ref="nota">
            <v-text-field
              label="DESCRIPCIÓN"
              v-model="descripcionNota"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" text @click="guardarNota">Añadir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import moment from "moment";
import mixins from "../../mixins/funciones.js";
export default {
  mixins: [mixins],
  data() {
    return {
      nuevoexpediente: "",
      aprobarflag: "",
      id_exp: "",
      fecha_validez: "",
      descripcionNota: "",
      dialog: false,
      seleccionQuoteAprobar: false,
      opcionesSeleccionadas: [],
      page: 1,
      nro_propuesta: "",
      mostrarAdvertencia: false,
      textValidacionCotizacionMaster: [],
    };
  },

  async mounted() {
    // await this.cargarMaster(this.$store.state.pricing.datosPrincipales);
    setTimeout(async () => {
      await this.generaInstructivoparaguardata();
    }, 1500);
  },
  methods: {
    ...mapActions([
      "imprimirInstructivoQuote",
      "aprobarCotizacion",
      "cargarMaster",
      "setNoteQuote",
      "getInstructivoId",
      "generaInstructivoparaguardata",
      "updateQuote",
    ]),
    verificarMaster() {
      this.mostrarAdvertencia = false;
      this.textValidacionCotizacionMaster = [];
      let master = this.$store.state.itemsMasterList.filter(
        (v) => v.id == this.id_exp
      )[0];
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idsentido ==
          master.id_modality
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Modalidad");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idtipocarga ==
          master.id_shipment
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Tipó de Cargar");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idincoterms ==
          master.id_incoterms
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Incoterms");
      }

      if (
        !(
          this.$store.state.pricing.datosPrincipales.idorigen ==
          master.id_port_begin
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Puerto de origien");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.iddestino ==
          master.id_port_end
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Puerto de Destino");
      }
      console.log(this.textValidacionCotizacionMaster);
    },
    async imprimir() {
      for (
        let index = 0;
        index <
        this.$store.state.pricing.opcionCostos.filter((v) => !!v.selected)
          .length;
        index++
      ) {
        (function (index) {
          this.imprimirInstructivoQuote(
            this.$store.state.pricing.opcionCostos[index].nro_propuesta
          );
        }.call(this, index)); // Pasamos 'index' como argumento y establecemos el contexto a 'this'
      }
    },
    async guardarNota() {
      if (this.$refs.nota.validate()) {
        this.$store.state.spiner = true;
        let data = {
          name: this.descripcionNota,
          id_quote: this.$route.params.id,
        };
        await this.setNoteQuote(data);
        this.$refs.nota.reset();
        await this.getInstructivoId({ id: this.$route.params.id });
        this.dialog = false;
        this.$store.state.spiner = false;
      }
    },
    async abrirSeleccionDeQuoteAAprobar() {
      await this.cargarMaster(this.$store.state.pricing.datosPrincipales);
      this.seleccionQuoteAprobar = true;
    },
    mostrarBtnAprobar() {
      // let code =
      //   this.$store.state.pricing.listQuoteStatus.some(
      //     (v) =>
      //       v.id == this.$store.state.pricing.datosPrincipales.id_status &&
      //       v.code == 7
      //   ) && !this.$store.state.pricing.aprobadoflag;

      return !this.$store.state.pricing.aprobadoflag;
    },
    abrirModalAprobar() {
      if (this.$refs.frmAprobar.validate()) {
        let fecha_validez = this.$store.state.pricing.opcionCostos.filter(
          (v) => v.nro_propuesta == this.nro_propuesta
        )[0].date_end;
        let esValida = moment(fecha_validez).isSameOrAfter(moment(), "day");
        if (!esValida) {
          return Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: "No se puede aprobar ya que la validez ya expiró.",
          }).then(() => false);
        }
        esValida = moment(fecha_validez, "YYYY-MM-DD").isSameOrAfter(
          moment().add(15, "days").startOf("day")
        );
        let hoy = moment();
        let newFechaValize = moment(fecha_validez);
        let cantFecha = newFechaValize.diff(hoy, "days");
        console.log(cantFecha);
        console.log(esValida);

        if (!esValida) {
          return Swal.fire({
            icon: "question",
            title: "Advertencia",
            text: `Quedan ${
              cantFecha + 1
            } días de validez. ¿Desea continuar.? `,
            allowEnterKey: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: "Enviar a Operaciones.",
            cancelButtonText: "No aprobar.",
          }).then((res) => {
            if (res.isDismissed) {
              return false;
            }

            this.nuevoexpediente = true;
            this.id_exp = "";
            let vm = this;
            Swal.fire({
              icon: "question",
              iconColor: "red",
              width: 1000,
              html:
                this.$store.state.itemsMasterList.length > 0
                  ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
                  : "<h1>¿Desea crear un nuevo expediente?</h1>",
              showConfirmButton: true,
              confirmButtonText: "CREAR NUEVO EXPEDIENTE",
              showDenyButton: this.$store.state.itemsMasterList.length > 0,
              denyButtonText: "SELECCIONAR EXPEDIENTE",
              showCloseButton: true,
              showCancelButton: false,
              allowOutsideClick: false,
            }).then(async (res) => {
              if (res.isConfirmed) {
                Swal.fire({
                  icon: "warning",
                  width: 1000,
                  title: "Fecha de Disponibilidad - Master",
                  html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
                  allowOutsideClick: false,
                  confirmButtonText: "ACEPTAR",
                  showCancelButton: true,
                  cancelButtonText: "CANCELAR",
                  preConfirm: () => {
                    const dateInput =
                      document.getElementById("swal-input1").value;
                    if (!dateInput) {
                      Swal.showValidationMessage(
                        "La fecha de validez es requerida"
                      );
                    } else {
                      const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                      const currentDate = moment(); // Obtiene la fecha actual

                      if (selectedDate.isSameOrBefore(currentDate)) {
                        Swal.showValidationMessage(
                          "La fecha debe ser mayor que la fecha actual"
                        );
                      } else {
                        return dateInput;
                      }
                    }
                  },
                }).then(async (res) => {
                  this.fecha_validez = res.value;
                  console.log(
                    this.$store.state.pricing.listIngresosInstructivoAprobar
                  );
                  let sum =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta
                    );
                  let igv =
                    this.$store.state.pricing.listIngresosInstructivoAprobar
                      .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                      .dataIngresos.filter(
                        (v) => v.descripcion === "TOTAL"
                      )[0].igv;
                  let valor =
                    this.$store.state.pricing.listIngresosInstructivoAprobar
                      .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                      .dataIngresos.filter(
                        (v) => v.descripcion === "TOTAL"
                      )[0].valor;
                  let listCostosInstructivo =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta
                    )[0].dataCostos;
                  let listVentasInstructivo =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta
                    )[0].dataVentas;
                  if (res.isConfirmed) {
                    Swal.fire({
                      icon: "info",
                      title: "Aprobando Cotizacion",
                      timerProgressBar: true,
                      allowOutsideClick: false,
                      timer: null,
                      didOpen: () => {
                        Swal.showLoading();
                      },
                    });
                    await vm.aprobarCotizacion({
                      id_quote: vm.$route.params.id,
                      nuevoexpediente: true,
                      id_exp: vm.id_exp,
                      fecha_validez: vm.fecha_validez,
                      totalIngreso: valor,
                      igvIngreso: igv,
                      valorIngreso: valor,
                      listCostosInstructivo: listCostosInstructivo,
                      listVentasInstructivo: listVentasInstructivo,
                    });
                    this.$store.state.spiner = true;

                    this.$store.state.spiner = false;
                  }
                });
              }
              if (res.isDenied) {
                this.nuevoexpediente = false;
                this.aprobarflag = true;
              }
            });
          });
        } else {
          this.nuevoexpediente = true;
          this.id_exp = "";
          let vm = this;
          Swal.fire({
            icon: "question",
            iconColor: "red",
            width: 1000,
            html:
              this.$store.state.itemsMasterList.length > 0
                ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
                : "<h1>¿Desea crear un nuevo expediente?</h1>",
            showConfirmButton: true,
            confirmButtonText: "CREAR NUEVO EXPEDIENTE",
            showDenyButton: this.$store.state.itemsMasterList.length > 0,
            denyButtonText: "SELECCIONAR EXPEDIENTE",
            showCloseButton: true,
            showCancelButton: false,
            allowOutsideClick: false,
          }).then(async (res) => {
            if (res.isConfirmed) {
              Swal.fire({
                icon: "warning",
                width: 1000,
                title: "Fecha de Disponibilidad - Master",
                html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
                allowOutsideClick: false,
                confirmButtonText: "ACEPTAR",
                showCancelButton: true,
                cancelButtonText: "CANCELAR",
                preConfirm: () => {
                  const dateInput =
                    document.getElementById("swal-input1").value;
                  if (!dateInput) {
                    Swal.showValidationMessage(
                      "La fecha de validez es requerida"
                    );
                  } else {
                    const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                    const currentDate = moment(); // Obtiene la fecha actual

                    if (selectedDate.isSameOrBefore(currentDate)) {
                      Swal.showValidationMessage(
                        "La fecha debe ser mayor que la fecha actual"
                      );
                    } else {
                      return dateInput;
                    }
                  }
                },
              }).then(async (res) => {
                this.fecha_validez = res.value;
                console.log(
                  this.$store.state.pricing.listIngresosInstructivoAprobar
                );
                let sum =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta
                  );
                let igv =
                  this.$store.state.pricing.listIngresosInstructivoAprobar
                    .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                    .dataIngresos.filter(
                      (v) => v.descripcion === "TOTAL"
                    )[0].igv;
                let valor =
                  this.$store.state.pricing.listIngresosInstructivoAprobar
                    .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                    .dataIngresos.filter(
                      (v) => v.descripcion === "TOTAL"
                    )[0].valor;
                let listCostosInstructivo =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta
                  )[0].dataCostos;
                let listVentasInstructivo =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta
                  )[0].dataVentas;

                if (res.isConfirmed) {
                  Swal.fire({
                    icon: "info",
                    title: "Aprobando Cotizacion",
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    timer: null,
                    didOpen: () => {
                      Swal.showLoading();
                    },
                  });
                  await vm.aprobarCotizacion({
                    id_quote: vm.$route.params.id,
                    nuevoexpediente: true,
                    id_exp: vm.id_exp,
                    fecha_validez: vm.fecha_validez,
                    totalIngreso: valor,
                    igvIngreso: igv,
                    valorIngreso: valor,
                    listCostosInstructivo: listCostosInstructivo,
                    listVentasInstructivo: listVentasInstructivo,
                  });
                  this.$store.state.spiner = true;

                  this.$store.state.spiner = false;
                }
              });
            }
            if (res.isDenied) {
              this.nuevoexpediente = false;
              this.aprobarflag = true;
            }
          });
        }
      }
    },

    async aprobar() {
      await this.generaInstructivoparaguardata();

      let sum = this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
        (v) => v.nro_propuesta == this.nro_propuesta
      );
      let igv = this.$store.state.pricing.listIngresosInstructivoAprobar
        .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
        .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0].igv;
      let valor = this.$store.state.pricing.listIngresosInstructivoAprobar
        .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
        .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0].valor;
      let listCostosInstructivo =
        this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
          (v) => v.nro_propuesta == this.nro_propuesta
        )[0].dataCostos;
      let listVentasInstructivo =
        this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
          (v) => v.nro_propuesta == this.nro_propuesta
        )[0].dataVentas;
      if (this.$refs.frmAprobar.validate()) {
        Swal.fire({
          icon: "info",
          title: "Aprobando Cotizacion",
          timerProgressBar: true,
          allowOutsideClick: false,
          timer: null,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await this.aprobarCotizacion({
          id_quote: this.$route.params.id,
          nuevoexpediente: false,
          id_exp: this.id_exp,
          fecha_validez: this.fecha_validez,
          totalIngreso: valor,
          igvIngreso: igv,
          valorIngreso: valor,
          listCostosInstructivo: listCostosInstructivo,
          listVentasInstructivo: listVentasInstructivo,
        });
        this.$store.state.spiner = true;
        this.aprobarflag = false;
        this.$store.state.spiner = false;
      }
    },

    noDataText() {
      return `No se encontraron Masters con la misma Modalidad, Tipo de Carga, Incoterms y/o Puerto Origen/ Destino asociados a la cotización.`;
    },
    getProveedor(element) {
      let id_proveedor = element.listCostos.some(
        (v) => v.code_cost == 4 && v.esopcionflag == 1
      )
        ? element.listCostos.filter(
            (v) => v.code_cost == 4 && v.esopcionflag == 1
          )[0].id_proveedor
        : "";
      let nameProveedor = id_proveedor
        ? this.$store.state.provedores.filter((v) => v.id == id_proveedor)[0]
            .namelong
        : "";
      return nameProveedor;
    },
    async guardarQuote() {
      await this.updateQuote();
      this.$router.push({
        name: "verQuote",
        params: {
          id: this.$store.state.pricing.id,
        },
      });
      this.$store.state.pricing.e1 = 5;
    },
  },
};
</script>

<style scoped>
.header[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  /* text-align: center !important; */
}
.align-left {
  text-align: left !important;
}
.align-center {
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
.header align-right[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
/* .tableClass:hover[data-v-44bc4a93] { */
/* .v-data-table >>> tr:hover {
  background: unset !important;
} */
.classDialog {
  min-height: 900px !important;
}
</style>
