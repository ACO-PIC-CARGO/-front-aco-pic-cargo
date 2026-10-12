<template class="formulario">
  <v-row>
    <!-- <v-col cols="12">
      <center><p class="text-azul">2. CONFIGURACIÓN DE PROVEEDORES</p></center>
    </v-col> -->
    <v-row v-if="!subirProveedor" class="mx-1 my-1">
      <!-- <v-col cols="12" class="ocultarMovil">
        <center>
          <v-icon size="60" color="red">mdi-alert</v-icon>
        </center>
      </v-col> -->
      <v-col cols="12" md="6" offset-md="4">
        <div style="text-align: center">
          <v-icon style="color: #1a237e" size="x-large">mdi-account</v-icon>
        </div>
        <div class="" style="text-align: center">
          <h2 style="color: #1a237e">CARGA MASIVA DE PROVEEDORES</h2>
        </div>
        <div class="">
          <table>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">mdi-check-circle</v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Permite subir todos los proveedores de una sola vez
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">mdi-check-circle</v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Te entregamos una plantilla para hacerlo
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">mdi-check-circle</v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Se evita tener que añadirlos uno por uno después
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #388e3c">mdi-check-circle</v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Podrás cargar o modificar tus proveedores más adelante desde el
                módulo de ficheros.
              </td>
            </tr>
          </table>
        </div>
        <div
          class=""
          style="align-items: center; align-content: center; text-align: center"
        >
          <v-btn
            class="my-1 mx-1 button"
            color="#7E7E7E"
            dark
            @click="subirProveedor = !subirProveedor"
            size="x-small"
          >
            CARGA MASIVA
          </v-btn>
          <v-btn
            class="my-1 mx-1 buttonDosFilas"
            color="#1A237E"
            dark
            @click="$emit('omitir')"
            size="x-small"
          >
            CONTINUAR <br class="ocultarPc" />
            LO HARÉ DESPUÉS
          </v-btn>
        </div>
      </v-col>
      <!-- <v-col cols="12" lg="6">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 1: CARGA MASIVA </b></p>
            <p>
              Permite cargar todos los
              <span class="spanProveedores">PROVEEDORES</span> de forma masiva
              (te brindaremos una plantilla de carga). De esta forma, se evita
              tener que agregar proveedores individualmente en el futuro y tu
              operatividad sea más rápida.
            </p>
          </div>
          <v-btn
            class="my-1"
            block
            color="#4256BE"
            dark
            @click="subirProveedor = !subirProveedor"
          >
            CARGA MASIVA PROVEEDORES
          </v-btn>
        </div>
      </v-col> -->
      <!-- <v-col lg="6" xl="6" cols="12">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 2: CARGA MANUAL </b></p>
            <p>
              Si no usas la opción 1, el sistema creará
              <span class="spanProveedores">PROVEEDORES</span> automáticos para
              su uso inicial. Podrás agregar o modificar proveedores más
              adelante, ya sea de manera individual o masiva en el módulo de
              configuración.
            </p>
          </div>
          <v-btn
            class="my-1 wrap-text-button"
            block
            color="#7E7E7E"
            dark
            @click="$emit('omitir')"
          >
            USAR PROVEEDORES PROVISIONALES
          </v-btn>
        </div>
      </v-col> -->
    </v-row>
    <v-col cols="12" v-else class="my-1">
      <v-row>
        <v-col cols="8">
          <v-icon size="40" color="red">mdi-alert</v-icon> Encuentra los pasos a
          seguir en el tutorial adjunto
        </v-col>
        <v-col cols="4">
          <v-btn color="#5E9AD6" dark size="small" @click="dialog = true">
            Ver Tutorial
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              LISTADO DE PROVEEDORES <v-spacer></v-spacer>
              <v-btn
                color="#7d8288"
                dark
                @click="descargarFormato()"
                size="x-small"
                class="mx-1"
              >
                Descargar Plantilla
              </v-btn>
              <v-btn
                color="#062c52"
                dark
                size="x-small"
                class="mx-1"
                @click="openFileInput()"
              >
                Cargar Proveedores
              </v-btn>
              <v-file-input
                v-model="files"
                id="fileInput"
                style="display: none"
                @change="handleFileChange"
                accept=".xlsx, .xls"
              />
            </v-card-title>
            <v-data-table
              :headers="headers"
              :items="$store.state.configEmpresa.lstProveedor"
              pagination.sync="pagination"
              item-key="index"
              class="elevation-5"
            >
              <template v-slot:[`item.action`]="{ item, index }">
                <v-btn icon color="red" @click="eliminar(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12" md="6" offset-md="4" style="text-align: center">
      <v-btn
        @click="$emit('regresar')"
        color="#78909C"
        dark
        class="mx-5 mt-1 mb-10"
      >
        REGRESAR A LA ANTERIOR
      </v-btn>
      <v-btn
        class="mx-5 mt-1 mb-10"
        @click="continuar()"
        v-if="subirProveedor"
        color="#1A237E"
        :dark="subirProveedor"
      >
        Guardar y Continuar
      </v-btn>
    </v-col>
    <v-dialog
      v-model="dialog"
      v-if="dialog"
      scrollable
      persistent
      max-width="60%"
    >
      <v-card>
        <v-card-title primary-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <iframe
            width="800"
            height="400"
            src="https://www.youtube.com/embed/Vk07cXLM2vo"
            title="Tutorial Carga Proveedor"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { readSheet as readXlsxFile } from "read-excel-file/browser";
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      dialog: false,
      subirProveedor: false,
      files: [],
      headers: [
        { title: "Acción", key: "action" },
        { title: "TAX ID / RUC /  VAT / RIF", key: "nro_documento" },
        { title: "Razón social/Nombre Comercial", key: "nombre_comercial" },
        { title: "Email", key: "email" },
        { title: "Persona Contacto 1", key: "contacto_1" },
        { title: "Teléfono Contacto 1", key: "contacto_telf_1" },
        { title: "Persona Contacto 2", key: "contacto_2" },
        { title: "Teléfono Contacto 2", key: "contacto_telf_2" },
        { title: "Dirección", key: "direccion" },
        { title: "Teléfono adicional 1", key: "telefono_1" },
        { title: "Teléfono adicional 2", key: "telefono_2" },
      ],
      mostrarGuardar: false,
      index_nombre_comercial: 0,
      index_nro_documento: 1,
      index_contacto_1: 2,
      index_contacto_telf_1: 3,
      index_contacto_2: 4,
      index_contacto_telf_2: 5,
      index_direccion: 6,
      index_telefono_1: 7,
      index_telefono_2: 8,
      index_email: 9,
      loading: false,
      subconjuntos: [],
    };
  },
  methods: {
    ...mapActions(["actualizarDatoCMProveedor"]),
    omitir() {
      this.$store.state.enterprises.datoProveedorFlag = false;
      this.$store.state.enterprises.datoClienteFlag = true;
    },
    scrollToSubirCostos() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    async continuar() {
      this.scrollToSubirCostos();
      this.$store.state.dialogProcessing = true;
      if (this.$store.state.configEmpresa.lstProveedor.length > 0) {
        this.dividirEnSubconjuntos();
        for (const subconjunto of this.dividirEnSubconjuntos()) {
          await this.actualizarDatoCMProveedor(subconjunto);
        }
        Swal.fire({
          icon: "success",
          text: "Registro Correcto",
          showCancelButton: false,
          confirmButtonText: "Ok",
          allowEnterKey: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((res) => {
          if (res.isConfirmed) {
            this.$emit("continuarClientes");
          }
        });

        // this.$emit("continuarClientes");
      } else {
        Swal.fire({
          icon: "warning",
          text: "NO HA CARGADO NINGUN ARCHIVO",
          showCancelButton: false,
          confirmButtonText: "Ok",
          allowEnterKey: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((res) => {
          if (res.isConfirmed) {
            this.$emit("continuarClientes");
          }
        });
      }
      this.$store.state.dialogProcessing = false;
    },
    descargarFormato() {
      window.open(
        `${import.meta.env.VUE_APP_URL_MAIN}uploads/Formato Proveedor.xlsx`,
        "_blank"
      );
    },
    dividirEnSubconjuntos() {
      const SUBCONJUNTO_TAMANO = 100;
      const subconjuntos = [];
      for (
        let i = 0;
        i < this.$store.state.configEmpresa.lstProveedor.length;
        i += SUBCONJUNTO_TAMANO
      ) {
        subconjuntos.push(
          this.$store.state.configEmpresa.lstProveedor.slice(
            i,
            i + SUBCONJUNTO_TAMANO
          )
        );
      }
      return subconjuntos;
    },
    openFileInput() {
      let fileInput = document.getElementById("fileInput");
      if (fileInput) {
        this.files = [];
        fileInput.click();
      }
      //   document.getElementById("fileInput").click();
    },
    handleFileChange() {
      this.$store.state.configEmpresa.lstProveedor = [];
      readXlsxFile(this.files).then((rows) => {
        this.procesarDatosProveedor(rows);
      });
      this.mostrarGuardar = true;
      this.files = [];
    },
    procesarDatosProveedor(rows) {
      for (let index = 0; index < rows[0].length; index++) {
        if (rows[0][index] == "nombre_comercial") {
          this.index_nombre_comercial = index;
        }
        if (rows[0][index] == "nro_documento") {
          this.index_nro_documento = index;
        }
        if (rows[0][index] == "contacto_1") {
          this.index_contacto_1 = index;
        }
        if (rows[0][index] == "contacto_telf_1") {
          this.index_contacto_telf_1 = index;
        }
        if (rows[0][index] == "contacto_2") {
          this.index_contacto_2 = index;
        }
        if (rows[0][index] == "contacto_telf_2") {
          this.index_contacto_telf_2 = index;
        }
        if (rows[0][index] == "direccion") {
          this.index_direccion = index;
        }
        if (rows[0][index] == "telefono_1") {
          this.index_telefono_1 = index;
        }
        if (rows[0][index] == "telefono_2") {
          this.index_telefono_2 = index;
        }

        if (rows[0][index] == "email") {
          this.index_email = index;
        }
      }

      for (let index = 1; index < rows.length; index++) {
        this.$store.state.configEmpresa.lstProveedor.push({
          nombre_comercial: rows[index][this.index_nombre_comercial],
          nro_documento: rows[index][this.index_nro_documento],
          contacto_1: rows[index][this.index_contacto_1],
          contacto_telf_1: rows[index][this.index_contacto_telf_1],
          contacto_2: rows[index][this.index_contacto_2],
          contacto_telf_2: rows[index][this.index_contacto_telf_2],
          direccion: rows[index][this.index_direccion],
          telefono_1: rows[index][this.index_telefono_1],
          telefono_2: rows[index][this.index_telefono_2],
          email: rows[index][this.index_email],
        });
      }
      this.files = [];
    },
    eliminar(index) {
      this.$store.state.configEmpresa.lstProveedor.splice(index, 1);
    },
  },
  mounted() {
    // console.log("recargo");
    this.ids_modality = this.$store.state.pricing.listModality.map(
      (element) => {
        return element.id;
      }
    );
    this.ids_shipment = this.$store.state.pricing.listShipment.map(
      (element) => {
        return element.id;
      }
    );
    this.id_modality = this.ids_modality[0];
    this.id_shipment = this.ids_shipment[0];
  },
};
</script>

<style scoped>
.opcion {
  border: 1px solid #4256be;
  margin: 1%;
  padding: 5%;
  border-radius: 25px;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
  /* text-decoration: underline; */
  /*  text-decoration-color: yellow; */
}
.opcionText {
  /* border: 1px solid red; */
  /* margin: 5%; */
  text-align: justify;
  height: 150px;
}
.spanProveedores {
  text-transform: uppercase;
  font-weight: bold;
  background: yellow;
  padding: 0 5px;
}
.button {
  padding: 23px !important;
  width: 160px;
}
.buttonDosFilas {
  padding: 23px !important;
  width: 160px;
  white-space: normal;
}
@media (max-width: 918px) {
  .formulario {
    /* margin: 0%; */
    /* width: 50px !important; */
    padding: 0 0 5% 5%;
  }
  .opcion {
    border: 1px solid #4256be;
    margin: 1% 0;
    padding: 5%;
    border-radius: 25px;
    max-width: 93% !important;
  }
  .opcionText {
    text-align: justify;
    height: 250px;
  }
  .button {
    padding: 15px !important;
    width: 120px;
  }
  .buttonDosFilas {
    padding: 15px !important;
    width: 120px;
    white-space: normal;
  }
}
</style>
