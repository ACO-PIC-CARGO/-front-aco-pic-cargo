<template>
  <v-card fluid>
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> Notas Principales </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="
              $store.state.aduana.opcionCostos[
                $store.state.aduana.page - 1
              ].listNotasQuote.filter(
                (v) => v.estado == 1 && !v.statusincluye && !v.statusnoincluye
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
                <!-- <td class="btnTblClass">
                  <v-btn icon color="red" x-small @click="row.item.estado = 0">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td> -->
              </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-divider></v-divider>
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> Se incluye </v-expansion-panel-title>
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
                    v-model="row.item.namegroupservice"
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
    <v-divider></v-divider>
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> No se incluye </v-expansion-panel-title>
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
                    v-model="row.item.namegroupservice"
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
    <v-col cols="12" class="derecha">
      <div class="text-center">
        <v-pagination
          v-model="$store.state.aduana.page"
          :length="opcionesSeleccionadas.length"
          rounded
        ></v-pagination>
      </div>
    </v-col>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="info" class="mx-1" size="small" @click="abrirModalCambioHeader()">
        Imprimir Cotizacion
      </v-btn>
    </v-card-actions>
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
                v-for="(tipocosto, index) in $store.state.aduana.namesection"
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
          <v-btn class="mx-1" @click="abrirModalTipoReporte()" color="success"
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
    <v-dialog v-model="previewFlag" max-width="40%" v-if="previewFlag">
      <v-card color="" class="py-5">
        <v-card-title primary-title>
          <p>TIPO DE REPORTE</p>

          <p class="text-red">
            Si necesita cambiar el tipo de reporte, lo debe realizar desde el
            editar
          </p>
        </v-card-title>

        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="$store.state.aduana.tiporeporte"
              :rules="[(v) => !!v || 'Dato requerido']"
              disabled
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
          <v-btn color="primary" variant="text" @click="generar"> Aceptar </v-btn>
          <v-btn color="red" variant="text" @click="previewFlag = false">
            Cancelar
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
  data() {
    return {
      headers: [
        { key: "index", title: "#" },
        { key: "description", title: "Descripción", align: "center" },
      ],
      previewFlag: false,
      tiporeporte: "",
      page: 1,
      dialogCambioNombreSecciones: false,
      opcionesSeleccionadas: [{ listNotasQuote: [] }],
    };
  },
  mounted() {
    if (
      (this.opcionesSeleccionadas = this.$store.state.aduana.opcionCostos.some(
        (v) => !!v.selected
      ))
    ) {
      this.opcionesSeleccionadas = this.$store.state.aduana.opcionCostos.filter(
        (v) => !!v.selected
      );
    }
  },
  methods: {
    ...mapActions([
      "registrarQuote",
      "generarReporteAduana",
      "obtenerDatosEmpresaAduana",
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
    abrirModalTipoReporte() {
      this.tiporeporte = "";
      this.dialogCambioNombreSecciones = false;
      this.previewFlag = true;
    },
    abrirModalCambioHeader() {
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
          this.abrirModalTipoReporte();
        }
      });
    },
    async generar() {
      this.$store.state.spiner = true;
      this.previewFlag = false;
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
      this.$store.state.spiner = false;
    },
  },
  computed: {
    lstSeIncluye() {
      let val = this.$store.state.aduana.listServices.filter(
        (v) => v.status == 1
      );

      let opcion = this.opcionesSeleccionadas[
        this.$store.state.aduana.page - 1
      ].listNotasQuote.filter((v) => v.estado == 1 && v.statusincluye == 1);
      opcion = opcion.map((v) => ({
        ...v,
        service: v.descripcion,
        namegroupservice: v.descripcion,
      }));
      let final = [...val, ...opcion];

      const opt = this.opcionesSeleccionadas[this.$store.state.aduana.page - 1] || {};
      const fechaVigencia = opt.date_end || this.$store.state.aduana.datosPrincipales.fecha_fin;
      const ttransito = opt.tiempo_transito || this.$store.state.aduana.datosPrincipales.tiempo_transito;
      if (fechaVigencia) {
        const texto = `Fecha de vigencia: ${this.formatDate(fechaVigencia)}`;
        final.push({ service: texto, namegroupservice: texto });
      }
      if (ttransito) {
        const unidad = Number(ttransito) === 1 ? "día" : "días";
        const texto = `Tiempo de tránsito: ${ttransito} ${unidad}`;
        final.push({ service: texto, namegroupservice: texto });
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
      opcion = opcion.map((v) => ({
        ...v,
        service: v.descripcion,
        namegroupservice: v.descripcion,
      }));

      let final = [...val, ...opcion];

      return final;
    },
  },
};
</script>

<style></style>
