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
                    />
                  </v-card-text>
                </v-tab-item>
                <v-tab-item value="pdfflag">
                  <v-textarea
                    v-model="localTextoPdf"
                    auto-grow
                    outlined
                    class="my-2"
                  />
                </v-tab-item>
              </v-tabs-items>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Nombre de Archivo"
                v-model="nombrePdfEnviarCliente"
                outlined
              ></v-text-field>
            </v-col>
            <!-- <v-col cols="12">
              <v-menu
                v-model="menu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="auto"
                outline
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="dateRangeText"
                    label="Rango de fechas"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>

                <v-date-picker v-model="dates" range no-title scrollable>
                  <v-spacer></v-spacer>
                  <v-btn text color="primary" @click="menu = false">
                    Confirmar
                  </v-btn>
                </v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Fecha Máxima"
                type="date"
                v-model="fecha_max"
              ></v-text-field>
            </v-col> -->
          </v-row>
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
export default {
  data() {
    return {
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
    };
  },
  mounted() {
    this.obtenerDatosEmpresa();
    let contenedor = [];

    this.$store.state.pricing.datosPrincipales.containers.forEach((element) => {
      contenedor.push({
        name: element.description,
        valor: element.cantidad,
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
      this.nombrePdfEnviarCliente = contenedor
        .map((v) => {
          return "_" + v.valor + "x" + v.name;
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
    // Sincronizamos cuando los datos de Vuex lleguen
    texto_pdf_vuex(val) {
      this.localTextoPdf = val;
    },
    texto_link_vuex(val) {
      this.localTextoLink = val;
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
      if (this.dates.length === 0) return "";

      // Ordenamos las fechas primero
      const fechasOrdenadas = this.dates.slice().sort();

      // Mapeamos cada fecha a través de la lógica de formato
      return fechasOrdenadas
        .map((fecha) => this.formatearFecha(fecha))
        .join(" a ");
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
