<template>
  <v-card fluid v-if="this.opcionesSeleccionadas.length > 0">
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Registro de nueva nota - Opción
          {{ opcionesSeleccionadas[page].nro_propuesta }}<v-spacer></v-spacer>
          <v-btn icon color="default" @click="abrirDialog()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmNota">
            <v-text-field
              label="Descripción Nota Nueva"
              v-model="descripcion"
              id="id"
              :rules="[(v) => !!v || 'Dato requerido']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="anidarNota" color="success">Agregar Nueva nota</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row>
      <v-col cols="12">
        Añadir nueva Nota: Opción
        {{ opcionesSeleccionadas[page].nro_propuesta }}
        <v-btn icon color="primary" @click="dialog = !dialog">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="12" class="derecha">
        <template>
          <div class="text-center">
            <v-pagination
              v-model="$store.state.aduana.page"
              :length="opcionesSeleccionadas.length"
              circle
            ></v-pagination>
          </div>
        </template>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed" hover>
          <v-expansion-panel>
            <v-expansion-panel-header>
              Notas Principales
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                :headers="headers"
                :items="
                  opcionesSeleccionadas[
                    $store.state.aduana.page - 1
                  ].listNotasQuote.filter(
                    (v) =>
                      v.estado == 1 && !v.statusincluye && !v.statusnoincluye
                  )
                "
                hide-default-footer
                dense
                disable-sort
                :items-per-page="-1"
              >
                <template v-slot:item="row">
                  <tr>
                    <td class="indexTblClass">{{ row.index + 1 }}</td>
                    <td class="btnDescriptionClass">
                      <v-textarea
                        v-model="row.item.descripcion"
                        hide-details
                        dense
                        rows="1"
                        auto-grow
                      ></v-textarea>
                    </td>
                    <td class="btnTblClass">
                      <v-btn
                        icon
                        color="red"
                        x-small
                        @click="row.item.estado = 0"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed" hover>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <span class="d-inline-flex align-center">
                Se incluye
                <v-btn
                  color="success"
                  x-small
                  icon
                  class="ml-2"
                  @click="abrirDialog({ statusincluye: 1 })"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                :headers="headers"
                :items="lstSeIncluye"
                hide-default-footer
                dense
                :items-per-page="-1"
                disable-sort
              >
                <template v-slot:item="row">
                  <tr>
                    <td class="indexTblClass">{{ row.index + 1 }}</td>

                    <td class="btnDescriptionClass">
                      <v-textarea
                        v-model="row.item.service"
                        readonly
                        hide-details
                        dense
                        rows="1"
                        auto-grow
                      ></v-textarea>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-expansion-panels class="my-1 condensed" hover>
        <v-expansion-panel>
          <v-expansion-panel-header
            ><span class="d-inline-flex align-center">
              No Se Incluye
              <v-btn
                color="success"
                x-small
                icon
                class="ml-2"
                @click="abrirDialog({ statusnoincluye: 1 })"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </span>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-data-table
              :headers="headers"
              :items="lstNoIncluye"
              hide-default-footer
              dense
              :items-per-page="-1"
              disable-sort
            >
              <template v-slot:item="row">
                <tr>
                  <td class="indexTblClass">{{ row.index + 1 }}</td>

                  <td class="btnDescriptionClass">
                    <v-textarea
                      v-model="row.item.service"
                      readonly
                      hide-details
                      dense
                      rows="1"
                      auto-grow
                    ></v-textarea>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-col class="derecha">
        <v-btn color="#3363A2" dark @click="abrirModalCambioNombreSecciones()">
          PREVIEW COTIZACIÓN(es)</v-btn
        >
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogCambioNombreSecciones"
      scrollable
      persistent
      width="50%"
    >
      <v-card>
        <v-card-title> Secciones de los costos </v-card-title>
        <v-card-text>
          <v-simple-table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(tipocosto, index) in $store.state.aduana.namesection"
                :key="index"
              >
                <td>{{ tipocosto.codigo }}</td>
                <td>
                  <v-text-field v-model="tipocosto.name"></v-text-field>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-btn
            class="mx-1"
            @click="abrirModalTipoReportePreview()"
            color="success"
            >Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            @click="dialogCambioNombreSecciones = !dialogCambioNombreSecciones"
            color="warning"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="imprimirFlag" max-width="40%" v-if="imprimirFlag">
      <v-card color="" class="py-5">
        <v-card-title primary-title>
          SELECCIÓN DE TIPO DE REPORTE A IMPRIMIR
        </v-card-title>
        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="tiporeporte"
              disabled
              column
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red darken-3"
                value="DETALLE"
              ></v-radio>

              <v-radio
                label="Totales por servicios"
                color="indigo darken-3"
                value="TOTAL"
              ></v-radio>

              <v-radio
                label="Reporte total general sin desglose"
                color="orange darken-3"
                value="AGRUPADO"
              ></v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="loading" text @click="generar">
            Aceptar
          </v-btn>
          <v-btn color="red" text @click="imprimirFlag = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="previewFlag" max-width="40%" v-if="previewFlag">
      <v-card color="" class="py-5">
        <v-card-title primary-title>
          SELECCIÓN DE TIPO DE REPORTE PARA LA PREVISUALIZACIÓN
        </v-card-title>
        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="tiporeporte"
              column
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red darken-3"
                value="DETALLE"
              ></v-radio>

              <v-radio
                label="Totales por servicios"
                color="indigo darken-3"
                value="TOTAL"
              ></v-radio>

              <v-radio
                label="Reporte total general sin desglose"
                color="orange darken-3"
                value="AGRUPADO"
              ></v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="generarPreview"> Aceptar </v-btn>
          <v-btn color="red" text @click="previewFlag = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogPreview"
      scrollable
      persistent
      max-width="80%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="indigo white--text my-0 py-0" dark>
          PREVISUALIZACIÓN DE LA COTIZACIÓN - NO TIENE NINGÚN VALOR COMERCIAL

          <v-spacer></v-spacer>
          <v-btn icon color="white" @click="dialogPreview = !dialogPreview">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <previewCotizacion
            :data="predataCotizacion"
            v-on:cerrar="dialogPreview = $event"
            :index="pagePrev"
          />
        </v-card-text>
        <v-card-actions>
          <template>
            <div class="text-center">
              <v-pagination
                v-model="pagePrev"
                :length="opcionesSeleccionadas.length"
                circle
              ></v-pagination>
            </div>
          </template>

          <v-spacer></v-spacer>
          <v-btn
            color="#A43542"
            class="mx-1"
            style="color: white !important"
            small
            :disabled="$store.state.aduana.bloquearBtnImprimir"
            @click="abrirModalTipoReporte()"
          >
            Imprimir Cotizacion
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  components: {
    previewCotizacion: () =>
      import("@/components/folderPricing/previewQuote.vue"),
  },
  data() {
    return {
      // opcionesSeleccionadas: [{ listNotasQuote: [] }],
      dialog: false,
      headers: [
        { value: "index", text: "#" },
        { value: "description", text: "Descripción", align: "center" },
      ],

      pagePrev: 1,
      tiporeporte: "",
      descripcion: "",
      predataCotizacion: null,
      dialogPreview: false,
      previewFlag: false,
      imprimirFlag: false,
      loading: false,
      dialogCambioNombreSecciones: false,
      statusincluye: 0,
      statusnoincluye: 0,
    };
  },
  mounted() {
    this.dialog = false;
    this.dialogPreview = false;
  },
  methods: {
    ...mapActions([
      "registrarAduana",
      "getQuote",
      "obtenerDatosEmpresaAduana",
      "generarReporteAduana",
      "crearCarpetaOneDrive",
      "actualizarURLEnElQuote",
      "predataAduana",
      "actualizarQuoteAduana",
    ]),
    formatDate(val) {
      if (!val) return "";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      } catch (e) {
        return String(val);
      }
    },
    llenarNotasSeleccionadas() {
      this.opcionesSeleccionadas = this.$store.state.aduana.opcionCostos.filter(
        (v) => !!v.selected
      );
    },
    abrirModalTipoReporte() {
      this.tiporeporte = "";
      this.dialogPreview = false;

      this.previewFlag = true;
    },
    abrirModalCambioNombreSecciones() {
      Swal.fire({
        icon: "question",
        width: 1000,
        html: "<h1> ¿Desea cambiar el nombre de la secciones?. Recuerde que  este cambio se verá reflejado solo en la cotización(pdf) </h1>",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        confirmButtonText: "<h1>Si cambiar</h1>",
        showCancelButton: true,
        showDenyButton: true,
        cancelButtonText: "<h1>No cambiar<h1>",
        denyButtonText: "<h1>Cerrar<h1>",
      }).then((accion) => {
        if (accion.isConfirmed) {
          this.dialogCambioNombreSecciones = true;
        }
        if (accion.isDismissed) {
          this.abrirModalTipoReportePreview();
        }
      });
    },
    abrirDialog({ statusincluye = 0, statusnoincluye = 0 }) {
      this.statusincluye = statusincluye;
      this.statusnoincluye = statusnoincluye;
      this.dialog = true;
    },
    anidarNota() {
      if (this.$refs.frmNota.validate()) {
        this.opcionesSeleccionadas[
          this.$store.state.aduana.page - 1
        ].listNotasQuote.push({
          descripcion: this.descripcion,
          estado: 1,
          statusincluye: this.statusincluye,
          statusnoincluye: this.statusnoincluye,
        });
      }
      setTimeout(() => {
        this.descripcion = "";
        this.$refs.frmNota.resetValidation();
      }, 10);
      this.dialog = !this.dialog;
    },

    async generar() {
      this.$store.state.aduana.tiporeporte = this.tiporeporte;
      this.loading = true;
      if (!this.$route.params.id) {
        if (this.$refs.frmReporte.validate()) {
          this.$store.state.spiner = true;
          await this.registrarAduana({ fullflag: true }).catch((e) => {
           console.error(e);
          });
          if (this.$store.state.aduana.nro_quote) {
            this.$store.state.spiner = false;
            let vm = this;
            await this.obtenerDatosEmpresaAduana().catch((e) => {
             console.error(e);
            });

            for (
              let index = 0;
              index < this.$store.state.aduana.opcionCostos.length;
              index++
            ) {
              if (
                this.$store.state.aduana.opcionCostos[index].selected == true
              ) {
                await this.generarReporteAduana({
                  tipo: this.tiporeporte,
                  nro_propuesta:
                    this.$store.state.aduana.opcionCostos[index].nro_propuesta,
                }).catch((e) => {
                 console.error(e);
                });
              }
            }
            this.loadingTable = false;
            this.loading = false;
            this.$store.state.spiner = false;
            let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch;
            let branchCreacion = [1, 2];
            // if (branchCreacion.includes(id_branch)) {
            //   this.crearCarpetaOneDrive({
            //     nro_quote: this.$store.state.aduana.nro_quote,
            //     nombre: this.$store.state.aduana.datosPrincipales.nombre,
            //   }).catch((err) => {
            //     console.log("crearCarpetaOneDrive", err);
            //   });

            //   await this.actualizarURLEnElQuote({
            //     id: this.$store.state.aduana.id,
            //     url: this.$store.state.aduana.urlFolder,
            //   }).catch((err) => {
            //     console.log("actualizarURLEnElQuote", err);
            //   });
            // }
            console.log(this.$store.state.aduana.id);
            this.$router.push({
              name: "VerAduana",
              params: {
                id: this.$store.state.aduana.id,
              },
            });
          }
        }
      } else {
        if (this.$refs.frmReporte.validate()) {
          this.$store.state.spiner = true;
          this.imprimirFlag = false;

          await this.actualizarQuoteAduana();
          await this.obtenerDatosEmpresaAduana();

          for (
            let index = 0;
            index < this.$store.state.aduana.opcionCostos.length;
            index++
          ) {
            Swal.fire({
              icon: "info",
              text: "Se está generando el (los) pdf.",
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
              timerProgressBar: true,
              timer: null,
              didOpen: () => {
                Swal.showLoading();
              },
            });
            if (this.$store.state.aduana.opcionCostos[index].selected == true) {
              await this.generarReporteAduana({
                tipo: this.$store.state.aduana.tiporeporte,
                nro_propuesta:
                  this.$store.state.aduana.opcionCostos[index].nro_propuesta,
              }).catch((e) => {
                console.error(e);
              });
            }
          }
          Swal.close();
          this.$router.push({
            name: "VerAduana",
            params: {
              id: this.$store.state.aduana.id,
            },
          });
          this.$store.state.spiner = false;
        }
      }
    },
    abrirModalTipoReporte() {
      this.imprimirFlag = true;
    },
    abrirModalTipoReportePreview() {
      this.tiporeporte = "";
      this.previewFlag = true;
      this.dialogCambioNombreSecciones = false;
      this.$store.state.aduana.bloquearBtnImprimir = false;
    },
    async generarPreview() {
      if (this.$refs.frmReporte.validate()) {
        this.$store.state.spiner = true;
        this.previewFlag = false;
        await this.obtenerDatosEmpresaAduana();
        this.predataCotizacion = await this.predataAduana({
          tipo: this.tiporeporte,
        });
        this.$store.state.spiner = false;
        this.dialogPreview = true;
      }
    },
  },
  computed: {
    opcionesSeleccionadas() {
      return this.$store.state.aduana.opcionCostos.filter((v) => !!v.selected);
    },
    actualizarNotas: {
      get() {
        return this.$store.state.aduana.actualizarNotas;
      },
      set(val) {
        return (this.$store.state.aduana.actualizarNotas = actualizarNotas);
      },
    },
    page() {
      return this.$store.state.aduana.page - 1;
    },
    items() {
      console.log(this.opcionesSeleccionadas[this.page]);
      return this.opcionesSeleccionadas[this.page].listNotasQuote.filter(
        (v) => v.estado == 1
      );
    },
    lstSeIncluye() {
      let val = this.$store.state.aduana.listServices.filter(
        (v) => v.status == 1
      );

      let opcion = this.opcionesSeleccionadas[
        this.$store.state.aduana.page - 1
      ].listNotasQuote.filter((v) => v.estado == 1 && v.statusincluye == 1);
      opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

      let final = [...val, ...opcion];

      const opt = this.opcionesSeleccionadas[this.$store.state.aduana.page - 1] || {};
      const fechaVigencia = opt.date_end || this.$store.state.aduana.datosPrincipales.fecha_fin;
      const ttransito = opt.tiempo_transito || this.$store.state.aduana.datosPrincipales.tiempo_transito;
      if (fechaVigencia) {
        final.push({ service: `Fecha de vigencia: ${this.formatDate(fechaVigencia)}` });
      }
      if (ttransito) {
        const unidad = Number(ttransito) === 1 ? "día" : "días";
        final.push({ service: `Tiempo de tránsito: ${ttransito} ${unidad}` });
      }

      return final;
    },
    lstNoIncluye() {
      let val = this.$store.state.aduana.listServices.filter(
        (v) => v.status == 0
      );

      let opcion = this.opcionesSeleccionadas[
        this.$store.state.aduana.page - 1
      ].listNotasQuote.filter((v) => v.estado == 1 && v.statusnoincluye == 1);
      opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

      let final = [...val, ...opcion];

      return final;
    },
  },
  watch: {
    actualizarNotas() {
      this.llenarNotasSeleccionadas();
    },
  },
};
</script>

<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.izquierda {
  text-align: left !important;
  align-content: left !important;
}
</style>
