<template>
  <v-container>
    <v-col cols="12">
      <center>
        <v-btn
          :class="opcionCalculadora == opcion.id ? 'Active' : 'Inactive'"
          v-for="(opcion, index) in opciones"
          :key="index"
          class="mx-1"
          small
          @click="opcionCalculadora = opcion.id"
        >
          {{ opcion.nombre }}
        </v-btn>
      </center>
    </v-col>
    <v-row class="mt-2">
      <v-col cols="12" class="py-0">
        <v-divider></v-divider>
      </v-col>
      <v-col cols="12">
        <v-tabs v-model="tabTransporte" centered>
          <v-tabs-slider color="yellow"></v-tabs-slider>
          <v-tab href="#datosactuales">Datos Actuales</v-tab>
          <v-tab href="#cargamasiva">Carga Masiva</v-tab>
          <v-tab-item value="datosactuales">
            <v-row>
              <v-col cols="12" class="d-flex justify-end">
                <v-btn color="success" small @click="abrirModalNuevo"
                  >Nuevo Registro</v-btn
                >
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headersListado"
                  :items="obtenerValoresTransportePorOpcion"
                >
                  <template v-slot:[`item.action`]="{ item }">
                    <v-btn color="#E65100" icon @click="editar(item)">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn color="#D50000" icon @click="borrar(item)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item value="cargamasiva">
            <v-row class="my-2">
              <v-col cols="12" md="2" style="text-align: right">
                <v-text-field
                  type="number"
                  label="Tipo Cambio"
                  step="0.01"
                  dense
                  outlined
                  v-model="tipocambio"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4" style="text-align: right">
                <v-file-input
                  outlined
                  show-size
                  dense
                  v-model="excel"
                  label="Cargar Excel de Transporte"
                  placeholder="Seleccione un archivo"
                  id="excel"
                  hide-details
                  @click:clear="subir = false"
                  @change="subir = false"
                  @click.native="subir = false"
                ></v-file-input>
              </v-col>
              <v-col cols="12" md="6" style="text-align: right">
                <v-btn
                  color="warning"
                  @click="procesarExcel()"
                  :loading="procesando"
                  class="mx-1"
                  small
                  :disabled="!procesarflag"
                >
                  Procesar
                </v-btn>
                <!-- <v-btn color="success" small @click="abrirModalNuevo">Nuevo</v-btn> -->
                <v-btn
                  color="success"
                  small
                  @click="registrarDatos"
                  :disabled="!datosExcel.length"
                  >Guardar</v-btn
                >
              </v-col>
              <v-col cols="12">
                <v-form ref="frmDatos">
                  <v-data-table
                    :headers="headers"
                    :items="
                      datosExcel.filter(
                        (v) =>
                          v.opcion ==
                          $store.state.calculadoras.opcionCalculadora,
                      )
                    "
                    dense
                  >
                    <template v-slot:[`item.index`]="{ item }">
                      {{ item.index }}
                    </template>
                    <template v-slot:[`item.provinciacbo`]="{ item }">
                      <v-autocomplete
                        :items="$store.state.calculadoras.lstCiudades"
                        v-model="item.id_provincia"
                        item-value="id"
                        item-text="name"
                        dense
                        :rules="[(v) => !!v || 'Datos requeridos']"
                      />
                    </template>
                    <template v-slot:[`item.distritocbo`]="{ item }">
                      <v-autocomplete
                        :items="
                          $store.state.calculadoras.lstDistritos.filter(
                            (d) => d.id_city == item.id_provincia,
                          )
                        "
                        v-model="item.id_distrito"
                        item-value="id"
                        item-text="name"
                        dense
                        :rules="[(v) => !!v || 'Datos requeridos']"
                      />
                    </template>
                  </v-data-table>
                </v-form>
              </v-col>
            </v-row>
          </v-tab-item>
        </v-tabs>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogEditar" persistent max-width="30%">
      <v-card>
        <v-card-title>
          {{ transporte.id ? "Editar Transporte" : "Nuevo Registro" }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEditar">
            <v-text-field
              label="Peso Desde"
              v-model="transporte.peso_desde"
              type="number"
              step="0.01"
              :rules="[(v) => v === 0 || !!v || 'Dato Requerido']"
            ></v-text-field>
            <v-text-field
              label="Peso Hasta"
              v-model="transporte.peso_hasta"
              type="number"
              step="0.01"
              :rules="[(v) => v === 0 || !!v || 'Dato Requerido']"
            ></v-text-field>

            <v-autocomplete
              :items="$store.state.calculadoras.lstCiudades"
              label="Departamento"
              placeholder="Departamento"
              item-value="id"
              item-text="name"
              v-model="transporte.id_provincia"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-autocomplete>

            <v-autocomplete
              :items="
                $store.state.calculadoras.lstDistritos.filter(
                  (v) => v.id_city == transporte.id_provincia,
                )
              "
              label="Distrito"
              placeholder="Distrito"
              item-value="id"
              item-text="name"
              :loading="loading"
              v-model="transporte.id_distrito"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-autocomplete>

            <v-text-field
              v-model="transporte.tarifamonlocal"
              label="Tarifa SOLES"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            ></v-text-field>

            <v-text-field
              v-model="transporte.tipocambio"
              label="Tipo Cambio"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            ></v-text-field>

            <v-text-field
              v-model="transporte.tarifadolar"
              label="Tarifa Dolar"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            v-if="!transporte.id"
            @click="guardarRegistro"
            small
          >
            Guardar
          </v-btn>
          <v-btn
            color="success"
            v-if="!!transporte.id"
            @click="actualizarRegistro"
            small
          >
            Actualizar
          </v-btn>
          <v-btn color="error" small @click="dialogEditar = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import readXlsFile from "read-excel-file";
import Swal from "sweetalert2";
export default {
  props: {
    type: {
      default: "type",
      type: String,
    },
    id_modality: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {
      id_state: null,
      monto: 0,
      dialogEditar: false,
      loading: false,
      items: [],
      id_town: 0,
      headers: [
        { value: "index", text: "#" },
        { value: "peso_desde", text: "Peso Desde" },
        { value: "peso_hasta", text: "Peso Hasta" },
        { value: "provinciacbo", text: "Provincia Sistema" },
        { value: "provincia", text: "Provincia Excel" },
        { value: "distritocbo", text: "Distrito Sistema" },
        { value: "distrito", text: "Distrito Excel" },
        { value: "tarifamonlocal", text: "Tarifa Soles" },
        { value: "tarifadolar", text: "Tarifa En Dolares" },
      ],

      headersListado: [
        { value: "peso_desde", text: "Peso Desde" },
        { value: "peso_hasta", text: "Peso Hasta" },
        { value: "provincia", text: "Provincia" },
        { value: "distrito", text: "Distrito" },
        { value: "tarifamonlocal", text: "Tarifa Soles" },
        { value: "tipocambio", text: "Tipo Cambio" },
        { value: "tarifadolar", text: "Tarifa En Dolares" },
        { value: "action" },
      ],
      procesando: false,
      excel: null,
      tipocambio: 3.4,
      tabTransporte: "datosactuales",
      datosExcel: [],
      transporte: {},
    };
  },
  async mounted() {
    Promise.all([this.cargarDistritos({}), this.getCiudad({})]);
  },
  methods: {
    ...mapActions([
      "getDistritos",
      "getTransporteGuardar",
      "getProfitList",
      "validarTransporte",
      "getCiudad",
      "setGuardarTransporte",
      "EliminarTransporte",
      "getTransporte",
      "ActualizarTransporte",
      "RegistroTransporte",
    ]),
    editar(item) {
      this.transporte = { ...item };
      this.dialogEditar = true;
    },

    abrirModalNuevo() {
      this.transporte = {
        id: null,
        peso_desde: null,
        peso_hasta: null,
        id_provincia: null,
        id_distrito: null,
        tarifadolar: null,
        tarifamonlocal: null,
        opcion: this.$store.state.calculadoras.opcionCalculadora,
        shimpent: this.type,
        tipocambio: 1,
        id_modality: this.id_modality,
      };
      this.dialogEditar = true;
      setTimeout(() => {
        this.$refs.frmEditar.resetValidation();
      }, 100);
    },
    async guardarRegistro() {
      console.log("frmEditar", this.$refs.frmEditar);
      if (this.$refs.frmEditar.validate()) {
        await this.RegistroTransporte(this.transporte);
        await this.getTransporte({
          shimpent: this.type,
          id_modality: this.id_modality,
        });
        this.dialogEditar = false;
      }
    },
    async actualizarRegistro() {
      if (this.$refs.frmEditar.validate) {
        await this.ActualizarTransporte(this.transporte);
        await this.getTransporte({
          shimpent: this.type,
          id_modality: this.id_modality,
        });
        this.dialogEditar = false;
      }
    },
    borrar(item) {
      Swal.fire({
        icon: "question",
        title: "Eliminar",
        text: "Está seguro que desea eliminar el registro",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        confirmButtonText: "Si, Eliminar",
        denyButtonText: "Cancelar",
        showDenyButton: true,
        showCloseButton: true,
      }).then(async (res) => {
        if (res.isConfirmed) {
          await this.EliminarTransporte(item);
          await this.getTransporte({
            shimpent: this.type,
            id_modality: this.id_modality,
          });
        }
      });
    },
    async cargarDistritos() {
      this.loading = true;
      await this.getDistritos({
        id_state: this.id_state,
      });
      this.loading = false;
    },
    async procesarExcel() {
      const file = document.getElementById("excel");
      let datos = [];
      this.datosExcel = [];

      await readXlsFile(file.files[0]).then((rows) => {
        for (let index = 0; index < rows.length; index++) {
          if (index > 1) {
            datos.push({
              peso_desde: rows[index][0],
              peso_hasta: rows[index][1],
              provincia: rows[index][2],
              // puerto_destino: rows[index][3],
              distrito: rows[index][4],
              tarifadolar: parseFloat(rows[index][5] / this.tipocambio).toFixed(
                2,
              ),
              tarifamonlocal: rows[index][5],
              opcion: this.$store.state.calculadoras.opcionCalculadora,
            });
          }
        }
      });
      this.$store.state.spiner = true;
      this.datosExcel = await this.validarTransporte({ datovalidar: datos });
      this.$store.state.spiner = false;
    },
    async registrarDatos() {
      let data = {
        shimpent: "LCL",
        id_modality: this.id_modality,
        datos: this.datosExcel,
      };
      if (this.$refs.frmDatos.validate()) {
        this.$store.state.spiner = true;
        await this.setGuardarTransporte(data);
        await this.getTransporte({
          shimpent: this.type,
          id_modality: id_modality,
        });
        this.tabTransporte = "datosactuales";
        this.$store.state.spiner = false;
        // this.dialognNuevo = false;
      } else {
        Swal.fire({
          icon: "error",
          title: "Verificar",
          text: "Faltan Datos por Rellenar. Verifique",
        });
      }
    },
  },
  computed: {
    opcionCalculadora: {
      get() {
        return this.$store.state.calculadoras.opcionCalculadora;
      },
      set(value) {
        this.$store.commit("setOpcion", value); // o una mutation/action de Vuex
      },
    },
    obtenerValoresTransportePorOpcion() {
      return this.$store.state.calculadoras.lstTransporte.filter(
        (v) => v.opcion == this.opcionCalculadora,
      );
    },
    opciones: {
      get() {
        return this.$store.state.calculadoras.opciones;
      },
      set(value) {
        this.$store.commit("setOpcion", value); // o una mutation/action de Vuex
      },
    },
    procesarflag() {
      if (!this.excel) return false;
      return true;
    },
  },
  watch: {
    opcionCalculadora() {
      this.datosExcel = [];
      this.excel = null;
    },
    "transporte.tipocambio"() {
      if (this.transporte.tipocambio > 0) {
        this.transporte.tarifadolar = parseFloat(
          this.transporte.tarifamonlocal / this.transporte.tipocambio,
        ).toFixed(2);
      }
    },
    "transporte.tarifamonlocal"() {
      if (this.transporte.tipocambio > 0) {
        this.transporte.tarifadolar = parseFloat(
          this.transporte.tarifamonlocal / this.transporte.tipocambio,
        ).toFixed(2);
      }
    },
  },
};
</script>
