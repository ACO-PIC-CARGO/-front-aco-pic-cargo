<template>
  <div class="">
    <v-btn color="#25D366" dark @click="abrirModal">
      <v-icon class="mr-2">mdi-whatsapp</v-icon> ENVIAR A WHATSAPP
    </v-btn>
    <v-dialog v-model="dialog" persistent max-width="50%">
      <v-card>
        <v-card-title primary-title>
          <span style="font-size: 1.2em; font-weight: bold"
            >Mensaje para el cliente
          </span>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEnvioWsp">
            <v-row>
              <v-col cols="12">
                <v-tabs v-model="tabIndex" centered slider-color="primary">
                  <v-tab href="#pdfflag"> PDF </v-tab>
                </v-tabs>
                <v-tabs-items v-model="tabIndex">
                  <v-tab-item value="linkflag">
                    <v-card-text>
                      <v-textarea
                        v-model="localTextoLink"
                        auto-grow
                        outlined
                        class="my-2"
                        :rules="[(v) => !!v || 'Dato Requerido']"
                      />
                    </v-card-text>
                  </v-tab-item>
                  <v-tab-item value="pdfflag">
                    <p class="py-0 mt-5" style="font-size: 1.2em; color: red">
                      <center>
                        <v-icon color="warning" class="mx-2">mdi-alert</v-icon>
                        <i>
                          Este mensaje solo se verá reflejado, si está dentro de
                          las 24h
                        </i>
                      </center>
                    </p>
                    <v-textarea
                      v-model="localTextoPdf"
                      auto-grow
                      outlined
                      class="py-0 my-0"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                    />
                  </v-tab-item>
                </v-tabs-items>
              </v-col>
              <!-- <v-col cols="12">
              {{ $store.state.pricing.datosPrincipales }}
              <v-select :items="cboTipoReporte" label="Tipo de Reporte a Envíar"></v-select>
            </v-col> -->
              <v-col cols="12">
                <v-text-field
                  label="Nombre de Archivo"
                  v-model="nombrePdfEnviarCliente"
                  outlined
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="auto"
                  outline
                  v-if="$store.state.pricing.datosPrincipales.esgrupalflag"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="dateRangeText"
                      label="Fecha Aproximada de Salida"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      v-if="$store.state.pricing.datosPrincipales.esgrupalflag"
                      color="blue-grey darken-2"
                      outlined
                      dense
                    ></v-text-field>
                  </template>

                  <v-date-picker v-model="dates" range no-title scrollable>
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="menu = false">
                      Confirmar
                    </v-btn>
                    <v-btn text color="error" @click="menu = false">
                      Cerrar
                    </v-btn>
                  </v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="6">
                <FormatFecha
                  :dense="true"
                  label="Fecha Máxima de Entrega"
                  v-model="fecha_max"
                  v-if="$store.state.pricing.datosPrincipales.esgrupalflag"
                  :errorMessages="errorFechaEntrega"
                  :outlined="true"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="enviarWsp" :loading="loading">
            Enviar
            {{ tabIndex == "pdfflag" ? "PDF" : "LINK" }} Cotización</v-btn
          >
          <v-btn color="error" @click="dialog = false" text :loading="loading"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      errorFechaEntrega: "",
      dialog: false,
      tabIndex: "pdfflag",
      loading: false,
      localTextoPdf: "",
      localTextoLink: "",
      // dateRangeText: null,
      dates: [],
      menu: false,
      fecha_max: "",
      nombrePdfEnviarCliente: "",
      cboTipoReporte: [
        { text: "Costo detallado por cada item", value: "DETALLE" },
        { text: "Totales por servicios", value: "TOTAL" },
        { text: "Reporte total general sin desglose", value: "AGRUPADO" },
      ],
    };
  },
  mounted() {
    this.obtenerDatosEmpresa();
    let contenedor = [];

    this.$store.state.pricing.datosPrincipales.containers.forEach((element) => {
      contenedor.push({
        name: element.description,
        valor: element.cantidad,
        code:element.code
      });
    });

    this.nombrePdfEnviarCliente = "COTIZACION_";

    if (!!this.$store.state.pricing.datosPrincipales.esindividualflag) {
      this.nombrePdfEnviarCliente += "INDIVIDUAL";
    }
    if (!!this.$store.state.pricing.datosPrincipales.esgrupalflag) {
      this.nombrePdfEnviarCliente += "GRUPAL";
    }

    let shipment = this.$store.state.pricing.listShipment.find(
      (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
    );

    if (shipment.code == "FCL") {
      this.nombrePdfEnviarCliente += contenedor
        .map((v) => {
          return "_" + v.valor + "x" + v.code;
        })
        .join("_");
    }
    if (shipment.code == "LCL") {
      this.nombrePdfEnviarCliente += "_CONSOLIDADOS";
    }
    this.nombrePdfEnviarCliente +=
      "_" +
      this.limpiarNombre(this.$store.state.pricing.datosPrincipales.nombre);
  },
  watch: {
    texto_pdf_vuex: {
      handler(val) {
        this.localTextoPdf = val;
      },
      immediate: true, // <-- Hace que se asigne el valor al cargar el componente
    },
    texto_link_vuex: {
      handler(val) {
        this.localTextoLink = val;
      },
      immediate: true, // <-- Hace que se asigne el valor al cargar el componente
    },
  },
  computed: {
    ...mapState({
      texto_pdf_vuex: (state) =>
        state.pricing.textWhatsapp?.[0]?.texto_pdf || "",
      texto_link_vuex: (state) =>
        state.pricing.textWhatsapp?.[0]?.texto_link || "",
    }),
    dateRangeText() {
      if (!this.dates || this.dates.length === 0) return "";

      const fechasOrdenadas = this.dates.slice().sort();
      const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];

      const desglosarFecha = (fecha) => {
        const [year, month, day] = fecha.split("-");
        return {
          dia: parseInt(day, 10).toString(), // Convierte "05" a "5"
          mes: meses[parseInt(month, 10) - 1],
          year: year,
        };
      };

      if (fechasOrdenadas.length === 1) {
        // Si solo ha seleccionado una fecha
        const f1 = desglosarFecha(fechasOrdenadas[0]);
        return `${f1.dia} de ${f1.mes}`;
      }

      const f1 = desglosarFecha(fechasOrdenadas[0]);
      const f2 = desglosarFecha(fechasOrdenadas[1]);

      if (f1.year === f2.year) {
        if (f1.mes === f2.mes) {
          // Mismo año y MISMO mes (El formato exacto que pediste)
          // Ejemplo: "25 al 30 de julio"
          return `${f1.dia} al ${f2.dia} de ${f1.mes}`;
        } else {
          // Mismo año pero DIFERENTE mes
          // Ejemplo: "25 de julio al 5 de agosto"
          return `${f1.dia} de ${f1.mes} al ${f2.dia} de ${f2.mes}`;
        }
      } else {
        // Diferente año
        // Ejemplo: "25 de diciembre de 2026 al 5 de enero de 2027"
        return `${f1.dia} de ${f1.mes} de ${f1.year} al ${f2.dia} de ${f2.mes} de ${f2.year}`;
      }
    },
  },
  methods: {
    ...mapActions(["generarReporte", "obtenerDatosEmpresa", "GetArchivos"]),
    abrirModal() {
      this.dialog = true;
    },
    limpiarNombre(str) {
      return str
        .normalize("NFD") // Separa los acentos del carácter base
        .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
        .replace(/ñ/g, "n") // Convierte ñ a n
        .replace(/Ñ/g, "N") // Convierte Ñ a N
        .replace(/\s+/g, "_") // Convierte espacios a guion bajo
        .replace(/[^a-zA-Z0-9_]/g, ""); // Elimina cualquier otro carácter especial que sobre
    },
    async enviarWsp() {
      this.errorFechaEntrega = "";

      if (!this.$refs.frmEnvioWsp.validate()) {
        return;
      }

      if (!this.fecha_max && this.$store.state.pricing.datosPrincipales.esgrupalflag) {
        this.errorFechaEntrega = "Dato Requerido";
        return;
      }

      const nameFile = this.nombrePdfEnviarCliente + ".pdf";
      if (
        this.$store.state.pricing.listadoFilesDrive.some(
          (v) => v.name == nameFile,
        )
      ) {
        Swal.fire({
          icon: "warning",
          title: "Nombre duplicado",
          text: "El nombre del archivo ya está en uso en la carpeta. Por favor, ingresa un nombre diferente para continuar.",
          confirmButtonText: "Entendido",
        });
        return;
      }

      this.loading = true;
      let tipo = "individual";
      if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
        tipo = "grupal";
      }
      await this.generarReporte({
        tipo: "AGRUPADO",
        enviarWspCliente: true,
        guardarFlag: true,
        textWhatsapp:
          this.tabIndex == "pdfflag" ? this.localTextoPdf : this.localTextoLink,
        pdfflag: this.tabIndex == "pdfflag",
        linkflag: this.tabIndex == "linkflag",
        tipoCotizacion: tipo,
        fecha_salida: this.dateRangeText,
        nombre_cliente: this.$store.state.pricing.datosPrincipales.nombre,
        fecha_max: this.fecha_max,
        nombrePdfEnviarCliente: this.nombrePdfEnviarCliente,
      });
      this.loading = false;
      this.dialog = false;
    },
    formatearFecha(fecha) {
      if (!fecha) return "";
      const [year, month, day] = fecha.split("-");
      const meses = [
        "ENE",
        "FEB",
        "MAR",
        "ABR",
        "MAY",
        "JUN",
        "JUL",
        "AGO",
        "SEP",
        "OCT",
        "NOV",
        "DIC",
      ];
      // Aseguramos que el mes sea un índice válido y formateamos
      return `${day}/${meses[parseInt(month) - 1]}/${year}`;
    },
  },
};
</script>

<style></style>
