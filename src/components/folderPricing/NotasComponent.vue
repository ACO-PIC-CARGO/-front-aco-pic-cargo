<template>
  <v-card fluid v-if="opcionSeleccionadaActual">
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          Registro de nueva nota - Opción
          {{ opcionSeleccionadaActual.nro_propuesta }}<v-spacer></v-spacer>
          <v-btn variant="text" icon color="default" @click="dialog = false">
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
        {{ opcionSeleccionadaActual.nro_propuesta }}
        <v-btn variant="text" icon color="primary" @click="dialog = !dialog">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="12" class="derecha">
        
          <div class="text-center">
            <v-pagination
              v-model="pricingStore.page"
              :length="opcionesSeleccionadas.length"
              rounded
            ></v-pagination>
          </div>
        
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed">
          <v-expansion-panel>
            <v-expansion-panel-title>
              Notas Principales
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-data-table
                :headers="headers"
                :items="
                  opcionSeleccionadaActual.listNotasQuote.filter(
                    (v) =>
                      v.estado == 1 && !v.statusincluye && !v.statusnoincluye,
                  )
                "
                hide-default-footer
                density="compact"
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
                        density="compact"
                        rows="1"
                        auto-grow
                      ></v-textarea>
                    </td>
                    <td class="btnTblClass">
                      <v-btn variant="text"
                        icon
                        color="red"
                        size="x-small"
                        @click="row.item.estado = 0"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <span class="d-inline-flex align-center">
                Se incluye
                <v-btn variant="text"
                  color="success"
                  size="x-small"
                  icon
                  class="ml-2"
                  @click="abrirDialog({ statusincluye: 1 })"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-data-table
                :headers="headers"
                :items="lstSeIncluye"
                hide-default-footer
                density="compact"
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
                        density="compact"
                        rows="1"
                        auto-grow
                      ></v-textarea>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-expansion-panels class="my-1 condensed">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <span class="d-inline-flex align-center">
              No Se Incluye
              <v-btn variant="text"
                color="success"
                size="x-small"
                icon
                class="ml-2"
                @click="abrirDialog({ statusnoincluye: 1 })"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-data-table
              :headers="headers"
              :items="lstNoIncluye"
              hide-default-footer
              density="compact"
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
                      density="compact"
                      rows="1"
                      auto-grow
                    ></v-textarea>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-col class="derecha">
        <v-btn color="#3363A2" @click="abrirModalCambioNombreSecciones()">
          PREVIEW COTIZACIÓN(es)</v-btn
        >
        <v-btn
          color="#FFD600"
          class="mx-1"
          @click="abrirDialogCotizacionRapida"
        >
          <v-icon class="mx-1" size="small">mdi-folder</v-icon>Guardar en
          Carpeta</v-btn
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
          <v-table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(tipocosto, index) in pricingStore.namesection"
                :key="index"
              >
                <td>{{ tipocosto.codigo }}</td>
                <td>
                  <v-text-field v-model="tipocosto.name"></v-text-field>
                </td>
              </tr>
            </tbody>
          </v-table>
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
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red-darken-3"
                value="DETALLE"
              ></v-radio>

              <v-radio
                label="Totales por servicios"
                color="indigo-darken-3"
                value="TOTAL"
              ></v-radio>

              <v-radio
                label="Reporte total general sin desglose"
                color="orange-darken-3"
                value="AGRUPADO"
              ></v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="loading" variant="text" @click="generar">
            Aceptar
          </v-btn>
          <v-btn color="red" variant="text" @click="imprimirFlag = false">
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
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red-darken-3"
                value="DETALLE"
              ></v-radio>

              <v-radio
                label="Totales por servicios"
                color="indigo-darken-3"
                value="TOTAL"
              ></v-radio>

              <v-radio
                label="Reporte total general sin desglose"
                color="orange-darken-3"
                value="AGRUPADO"
              ></v-radio>
            </v-radio-group>

            <v-divider class="my-4"></v-divider>

            <v-switch
              v-model="cambiarStatus"
              label="¿Desea cambiar el estatus de la cotización?"
              inset
            ></v-switch>

            <v-slide-y-transition>
              <div v-if="cambiarStatus">
                <v-select
                  v-model="selectedStatusId"
                  :items="pricingStore.listQuoteStatus"
                  item-title="name"
                  item-value="id"
                  label="Nuevo estatus de la cotización"
                  density="compact"
                  variant="outlined"
                ></v-select>
              </div>
            </v-slide-y-transition>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="generarPreview"> Aceptar </v-btn>
          <v-btn color="red" variant="text" @click="previewFlag = false">
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
        <v-card-title class="bg-indigo text-white my-0 py-0 d-flex align-center flex-wrap">
          PREVISUALIZACIÓN DE LA COTIZACIÓN - NO TIENE NINGÚN VALOR COMERCIAL

          <v-spacer></v-spacer>
          <v-btn variant="text" icon color="white" @click="dialogPreview = !dialogPreview">
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
          
            <div class="text-center">
              <v-pagination
                v-model="pagePrev"
                :length="opcionesSeleccionadas.length"
                rounded
              ></v-pagination>
            </div>
          
          <v-textarea
            label="Nombre Archivo Generar"
            v-model="pricingStore.nombre_cotizacion"
            auto-grow
            rows="1"
          />

          <v-btn
            v-if="pricingStore.datosPrincipales.url_folderonedrive"
            color="#FFD600"
            class="mx-1"
            size="small"
            @click="
              to_link({
                url: pricingStore.datosPrincipales.url_folderonedrive,
              })
            "
          >
            <v-icon>mdi-folder-open-outline</v-icon>
            Abrir Carpeta
          </v-btn>
          <v-btn
            color="#FFD600"
            class="mx-1"
            size="small"
            @click="abrirModalTipoReporte(true)"
          >
            <v-icon>mdi-folder-arrow-right</v-icon> Guardar En Folder
          </v-btn>
          <v-btn
            color="#A43542"
            class="mx-1"
            size="small"
            :disabled="pricingStore.bloquearBtnImprimir"
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
import { defineAsyncComponent } from "vue";
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { getNombreCotizacion, usePricingStore } from "@/stores/pricing";
export default {
  components: {
    previewCotizacion: defineAsyncComponent(() =>
      import("@/components/folderPricing/previewQuote.vue")),
  },
  data() {
    return {
      // opcionesSeleccionadas: [{ listNotasQuote: [] }],
      dialog: false,
      headers: [
        { key: "index", title: "#" },
        { key: "description", title: "Descripción", align: "center" },
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
    ...mapPiniaActions(usePricingStore, ["registrarQuote", "getQuote", "obtenerDatosEmpresa", "generarReporte", "crearCarpetaOneDrive", "actualizarURLEnElQuote", "predata", "updateQuote", "setEmisionPdf"]),
    abrirDialogCotizacionRapida() {
      let esperandoSeguro = this.pricingStore.listQuoteStatus.find(
        (v) => v.code == "4",
      );
      // this.previewFlag = true;
      this.$nextTick(() => {
        this.tiporeporte = "AGRUPADO";
        this.selectedStatusId = esperandoSeguro.id;
        this.generarPreview({ val: true });
      });
    },

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
        this.pricingStore.opcionCostos.filter((v) => !!v.selected);
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
    async anidarNota() {
      if ((await this.$refs.frmNota.validate()).valid) {
        this.opcionSeleccionadaActual.listNotasQuote.push({
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
      this.pricingStore.tiporeporte = this.tiporeporte;
      this.loading = true;

      if ((await this.$refs.frmReporte.validate()).valid) {
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
        if (this.pricingStore.nro_quote) {
          this.$store.state.spiner = false;
          await this.obtenerDatosEmpresa().catch((e) => console.log(e));

          // 2. Generación de reportes
          for (
            let index = 0;
            index < this.pricingStore.opcionCostos.length;
            index++
          ) {
            if (
              this.pricingStore.opcionCostos[index].selected == true
            ) {
              await Promise.all([
                this.generarReporte({
                  tipo: this.tiporeporte,
                  nro_propuesta:
                    this.pricingStore.opcionCostos[index].nro_propuesta,
                  guardarFlag: this.guardarFlag,
                }).catch((e) => console.log(e)),
                this.setEmisionPdf(),
              ]);
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
              nro_quote: this.pricingStore.nro_quote,
              nombre: this.pricingStore.datosPrincipales.nombre,
            });


            if (urlGenerada) {
              await this.actualizarURLEnElQuote({
                id: this.pricingStore.id,
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
          const destino = {
            name: "verQuote",
            params: { id: this.pricingStore.id },
          };
          if (
            this.$router.resolve(destino).fullPath !==
            this.$route.fullPath
          ) {
            await this.$router.push(destino);
          }else{
            window.location.reload()
          }
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
      this.pricingStore.bloquearBtnImprimir = false;
      // valor por defecto: primer estado disponible
      const list = this.pricingStore.listQuoteStatus || [];
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
    async generarPreview({ val = false }) {
      if (val || (await this.$refs.frmReporte.validate()).valid) {
        this.$store.state.spiner = true;
        this.previewFlag = false;
        if (this.cambiarStatus && this.selectedStatusId) {
          this.pricingStore.datosPrincipales.id_status =
            this.selectedStatusId;
        }
        await this.obtenerDatosEmpresa();
        this.predataCotizacion = await this.predata({
          tipo: this.tiporeporte,
        });
        this.$store.state.spiner = false;
        this.dialogPreview = true;
        getNombreCotizacion(this.pricingStore);
      }
    },
  },
  computed: {
    ...mapStores(usePricingStore),
    opcionesSeleccionadas() {
      return this.pricingStore.opcionCostos.filter((v) => !!v.selected);
    },
    opcionSeleccionadaActual() {
      const page = this.pricingStore.page - 1;
      return (
        this.opcionesSeleccionadas[page] ||
        this.opcionesSeleccionadas[0] ||
        null
      );
    },
    actualizarNotas: {
      get() {
        return this.pricingStore.actualizarNotas;
      },
      set(val) {
        return (this.pricingStore.actualizarNotas = actualizarNotas);
      },
    },
    lstSeIncluye() {
      let val = this.pricingStore.listServices.filter(
        (v) => v.status == 1,
      );

      const opcionActual = this.opcionSeleccionadaActual;
      if (!opcionActual) {
        return val;
      }
      let opcion = opcionActual.listNotasQuote.filter(
        (v) => v.estado == 1 && v.statusincluye == 1,
      );
      opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

      let final = [...val, ...opcion];

      
      const opt = opcionActual;
      const fechaVigencia =
        opt.date_end || this.pricingStore.datosPrincipales.fecha_fin;
      const ttransito =
        opt.tiempo_transito ||
        this.pricingStore.datosPrincipales.tiempo_transito;
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
      let val = this.pricingStore.listServices.filter(
        (v) => v.status == 0,
      );

      const opcionActual = this.opcionSeleccionadaActual;
      if (!opcionActual) {
        return val;
      }
      let opcion = opcionActual.listNotasQuote.filter(
        (v) => v.estado == 1 && v.statusnoincluye == 1,
      );
      opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

      let final = [...val, ...opcion];

      return final;
    },
  },
  watch: {
    opcionesSeleccionadas() {
      this.pricingStore.page = 1;
    },
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
