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
          {{ opcionesSeleccionadas[$store.state.pricing.page - 1].nro_propuesta
          }}<v-spacer></v-spacer>
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
        {{ opcionesSeleccionadas[$store.state.pricing.page - 1].nro_propuesta }}
        <v-btn icon color="primary" @click="dialog = !dialog">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="12" class="derecha">
        <template>
          <div class="text-center">
            <v-pagination
              v-model="$store.state.pricing.page"
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
                    $store.state.pricing.page - 1
                  ].listNotasQuote.filter(
                    (v) =>
                      v.estado == 1 && !v.statusincluye && !v.statusnoincluye,
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
          <v-expansion-panel-header>
            <span class="d-inline-flex align-center">
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
      <!-- <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="info"
        class="mx-1"
        small
        @click="abrirModalTipoReportePreview()"
      >
        Preview Cotizacion
      </v-btn>
    </v-card-actions> -->
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
                v-for="(tipocosto, index) in $store.state.pricing.namesection"
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

            <v-divider class="my-4"></v-divider>

            <!-- <v-switch
              v-model="cambiarStatus"
              label="¿Desea cambiar el estatus de la cotización?"
              inset
            ></v-switch> -->

            <v-slide-y-transition>
              <div v-if="cambiarStatus">
                <v-select
                  v-model="selectedStatusId"
                  :items="$store.state.pricing.listQuoteStatus"
                  item-text="name"
                  item-value="id"
                  label="Nuevo estatus de la cotización"
                  dense
                  outlined
                ></v-select>
              </div>
            </v-slide-y-transition>
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
          <v-textarea
            label="Nombre Archivo Generar"
            v-model="$store.state.pricing.nombre_cotizacion"
            auto-grow
            rows="1"
          />

          <v-btn
            v-if="$store.state.pricing.datosPrincipales.url_folderonedrive"
            color="#FFD600"
            class="mx-1"
            small
            @click="
              to_link({
                url: $store.state.pricing.datosPrincipales.url_folderonedrive,
              })
            "
          >
            <v-icon>mdi-folder-open-outline</v-icon>
            Abrir Carpeta
          </v-btn>
          <v-btn
            color="#FFD600"
            class="mx-1"
            small
            @click="abrirModalTipoReporte(true)"
          >
            <v-icon>mdi-folder-arrow-right</v-icon> Guardar En Folder
          </v-btn>
          <v-btn
            color="#A43542"
            class="mx-1"
            dark
            small
            :disabled="$store.state.pricing.bloquearBtnImprimir"
            @click="abrirModalTipoReporte(false)"
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
import { getNombreCotizacion } from "../../../store/modules/pricing";
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
      guardarFlag: false,
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
      cambiarStatus: false,
      selectedStatusId: null,
      esNuevoFlag: this.$route.name == "newQuote",
    };
  },
  mounted() {
    this.dialog = false;
   
  },
  methods: {
    ...mapActions([
      "registrarQuote",
      "getQuote",
      "obtenerDatosEmpresa",
      "generarReporte",
      "crearCarpetaOneDrive",
      "actualizarURLEnElQuote",
      "predata",
      "updateQuote",
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
    to_link({ url = "" }) {
      window.open(url, "_blank");
    },
    llenarNotasSeleccionadas() {
      this.opcionesSeleccionadas =
        this.$store.state.pricing.opcionCostos.filter((v) => !!v.selected);
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
          this.$store.state.pricing.page - 1
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
      this.$store.state.pricing.tiporeporte = this.tiporeporte;
      this.loading = true;

      if (this.$refs.frmReporte.validate()) {
        this.$store.state.spiner = true;
        let name = this.$route.name;
        // 1. Registro inicial
        if (name == "newQuote") {
          await this.registrarQuote({ fullflag: true }).catch((e) =>
            console.log(e),
          );
        }
        if (name == "editQuote") {
          await this.updateQuote();
        }
        if (this.$store.state.pricing.nro_quote) {
          this.$store.state.spiner = false;
          await this.obtenerDatosEmpresa().catch((e) => console.log(e));

          // 2. Generación de reportes
          for (
            let index = 0;
            index < this.$store.state.pricing.opcionCostos.length;
            index++
          ) {
            if (
              this.$store.state.pricing.opcionCostos[index].selected == true
            ) {
              await this.generarReporte({
                tipo: this.tiporeporte,
                nro_propuesta:
                  this.$store.state.pricing.opcionCostos[index].nro_propuesta,
                guardarFlag: this.guardarFlag,
              }).catch((e) => console.log(e));
            }
          }

          this.loadingTable = false;
          this.loading = false;
          this.dialog = false;
          this.guardarFlag = false;
          this.dialogPreview = false;
          this.previewFlag = false;
          this.imprimirFlag = false;
          this.loading = false;
          this.dialogCambioNombreSecciones = false;
          this.cambiarStatus = false;
          // 3. Lógica de OneDrive
          let userStr = sessionStorage.getItem("dataUser");
          let id_branch = userStr ? JSON.parse(userStr)[0].id_branch : null;
          let branchCreacion = [1, 2];

          if (branchCreacion.includes(id_branch) && name == "newQuote") {
            console.log("Iniciando creación de carpeta...");

            // Aquí recibimos el return de la función anterior
            const urlGenerada = await this.crearCarpetaOneDrive({
              nro_quote: this.$store.state.pricing.nro_quote,
              nombre: this.$store.state.pricing.datosPrincipales.nombre,
            });

            console.log("URL capturada en generar():", urlGenerada);

            if (urlGenerada) {
              await this.actualizarURLEnElQuote({
                id: this.$store.state.pricing.id,
                url: urlGenerada,
              });
              console.log("Base de datos actualizada con URL de OneDrive");
            } else {
              console.warn(
                "No se obtuvo URL de OneDrive, se saltó la actualización.",
              );
            }
          }

          // 4. Redirección final
          this.$router.push({
            name: "verQuote",
            params: { id: this.$store.state.pricing.id },
          });
        }
      }
    },
    abrirModalTipoReporte(guardarFlag = false) {
      this.guardarFlag = guardarFlag;
      this.imprimirFlag = true;
    },
    abrirModalTipoReportePreview() {
      this.tiporeporte = "";
      this.previewFlag = true;
      this.dialogCambioNombreSecciones = false;
      this.$store.state.pricing.bloquearBtnImprimir = false;
      // valor por defecto: primer estado disponible
      const list = this.$store.state.pricing.listQuoteStatus || [];
      const estatusDefault = list.find(
        (estatus) =>
          estatus.defaultstatus === 1 ||
          estatus.defaultstatus === "1" ||
          estatus.defaultstatus === true,
      );

      if (estatusDefault) {
        this.selectedStatusId = estatusDefault.id;
      } else if (list.length > 0) {
        this.selectedStatusId = list[0].id;
      } else {
        this.selectedStatusId = null;
      }
      this.cambiarStatus = false;
    },
    async generarPreview() {
      if (this.$refs.frmReporte.validate()) {
        this.$store.state.spiner = true;
        this.previewFlag = false;
        if (this.cambiarStatus && this.selectedStatusId) {
          this.$store.state.pricing.datosPrincipales.id_status =
            this.selectedStatusId;
        }
        await this.obtenerDatosEmpresa();
        this.predataCotizacion = await this.predata({
          tipo: this.tiporeporte,
        });
        this.$store.state.spiner = false;
        this.dialogPreview = true;
        getNombreCotizacion();
      }
    },
  },
  computed: {
    opcionesSeleccionadas() {
      return this.$store.state.pricing.opcionCostos.filter((v) => !!v.selected);
    },
    actualizarNotas: {
      get() {
        return this.$store.state.pricing.actualizarNotas;
      },
      set(val) {
        return (this.$store.state.pricing.actualizarNotas = actualizarNotas);
      },
    },
    lstSeIncluye() {
      let val = this.$store.state.pricing.listServices.filter(
        (v) => v.status == 1,
      );

      let opcion = this.opcionesSeleccionadas[
        this.$store.state.pricing.page - 1
      ].listNotasQuote.filter((v) => v.estado == 1 && v.statusincluye == 1);
      opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

      let final = [...val, ...opcion];

      // Agregar al final: Fecha de Vigencia y Tiempo de Tránsito (si existen)
      const opt =
        this.opcionesSeleccionadas[this.$store.state.pricing.page - 1] || {};
      const fechaVigencia =
        opt.date_end || this.$store.state.pricing.datosPrincipales.fecha_fin;
      const ttransito =
        opt.tiempo_transito ||
        this.$store.state.pricing.datosPrincipales.tiempo_transito;
      if (fechaVigencia) {
        final.push({
          service: `Fecha de vigencia: ${this.formatDate(fechaVigencia)}`,
        });
      }
      if (ttransito) {
        const unidad = Number(ttransito) === 1 ? "día" : "días";
        final.push({ service: `Tiempo de tránsito: ${ttransito} ${unidad}` });
      }

      return final;
    },
    lstNoIncluye() {
      let val = this.$store.state.pricing.listServices.filter(
        (v) => v.status == 0,
      );

      let opcion = this.opcionesSeleccionadas[
        this.$store.state.pricing.page - 1
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
