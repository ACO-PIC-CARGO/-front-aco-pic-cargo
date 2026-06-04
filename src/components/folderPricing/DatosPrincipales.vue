<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0" ref="frmPuerto">
      <v-card-title primary-title>Datos Principales</v-card-title>
      <v-card-text>
        <v-form class="" ref="frmDatosPrincipales">
          <v-container>
            <v-row>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Tipo de Marketing"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-1"
                  :items="listMarketingActivos"
                  item-text="name"
                  item-value="id"
                  v-model="$store.state.pricing.datosPrincipales.id_marketing"
                ></v-autocomplete>
                <v-autocomplete
                  label="Estado de la cotización"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listQuoteStatus"
                  item-text="name"
                  item-value="id"
                  v-model="$store.state.pricing.datosPrincipales.id_status"
                  :item-disabled="(item) => item.status != 1"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Ejecutivo"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listEjecutivo"
                  item-text="nombrecompleto"
                  item-value="id"
                  item-key="id"
                  v-model="$store.state.pricing.datosPrincipales.id_vendedor"
                ></v-autocomplete>
              </v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Pricing"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listEjecutivo"
                  item-text="nombrecompleto"
                  item-value="id"
                  item-key="id"
                  v-model="$store.state.pricing.datosPrincipales.id_pricing"
                ></v-autocomplete
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  label="Nombre del cliente"
                  outlined
                  placeholder="Nombre del cliente"
                  :append-icon="'mdi-account-search'"
                  @click:append="abrirModalCliente()"
                  @click="abrirModalCliente()"
                  :rules="[(v) => !!v || 'El nombre es requerido']"
                  dense
                  required
                  autocomplete="off"
                  id="nombre"
                  name="nombre"
                  v-model="$store.state.pricing.datosPrincipales.nombre"
                  readonly
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  label="Teléfono"
                  outlined
                  placeholder="Teléfono..."
                  dense
                  readonly
                  v-model="$store.state.pricing.datosPrincipales.telefono"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Sentido"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listModality"
                  item-text="name"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.pricing.datosPrincipales.idsentido"
                  @change="recargarServiciosCostos()"
                  :disabled="!EditableFlag"
                ></v-autocomplete
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Tipo de Embarque"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listShipment"
                  item-text="embarque"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.pricing.datosPrincipales.idtipocarga"
                  @change="recargarServiciosCostos()"
                  return-object
                  :disabled="!EditableFlag"
                ></v-autocomplete
              ></v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Incoterms"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="incoterms"
                  item-text="text"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.pricing.datosPrincipales.idincoterms"
                  @change="recargarServiciosCostos"
                >
                  <template slot="selection" slot-scope="data">
                    {{ data.item.name }} - {{ data.item.description }}
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="name"
                  label="Nombre del proveedor"
                  id="id"
                  v-model="$store.state.pricing.datosPrincipales.proveedor"
                  dense
                  outlined
                  v-if="mostrarProveedorFlag"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="Teléfono"
                  label="Teléfono del proveedor"
                  v-model="
                    $store.state.pricing.datosPrincipales.telefonoproveedor
                  "
                  dense
                  outlined
                  :rules="[
                    (v) => {
                      if (v === '' || /^\+?\d+$/.test(v)) {
                        return true; // Válido si está en blanco o cumple con el formato
                      } else {
                        return 'Formato de teléfono no válido';
                      }
                    },
                  ]"
                  v-if="mostrarProveedorFlag"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="name"
                  label="Dirección del proveedor"
                  id="id"
                  v-model="
                    $store.state.pricing.datosPrincipales.direccionproveedor
                  "
                  dense
                  outlined
                  v-if="mostrarProveedorFlag"
                ></v-text-field>
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0 align-right"
                v-if="mostrarContinuarFlag && mostrarBtn"
              >
                <v-btn color="#3F51B5" dark @click="continuarDatosCarga()" small
                  >Continuar Datos Carga</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
    </v-card>
    <!-- dIALOG -->
    <v-dialog v-model="buscarClienteDialog" max-width="80%">
      <v-card>
        <v-card-title
          >Buscar Cliente<v-spacer></v-spacer>
          <v-btn color="success" @click="registrarNuevoCliente" small>
            Nuevo Cliente
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field label="Buscar..." v-model="search"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="$store.state.itemsEntities"
                  :search="search"
                  @dblclick:row="guardarCliente"
                  item-key="index"
                  :loading="$store.state.itemsEntities.length == 0"
                  loading-text="Buscando Clientes..."
                >
                  <template v-slot:[`item.action`]="{ item }">
                    <v-btn
                      small
                      color="success"
                      @click="guardarCliente(null, { item })"
                    >
                      Seleccionar <v-icon class="mx-2">mdi-account-plus</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFiles" max-width="40%">
      <v-card>
        <v-card-title> Archivos a Copiar </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFiles"
            :items="$store.state.pricing.listadoFilesDrive"
            show-select
            v-model="$store.state.pricing.selectedFile"
            item-key="id"
          >
            <template v-slot:[`item.action`]="{ item }">
              <v-btn
                icon
                small
                :color="getColorIcon(item)"
                :href="item.webUrl"
                target="_blank"
              >
                <v-icon>{{ getIconFile(item) }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn small color="success" @click="copiarArchivos"
            >Guardar e Ir A la Nueva Cotización</v-btn
          >
          <v-btn small color="error" @click="dialogFiles = false"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
export default {
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
    EditableFlag: {
      type: Boolean,
      default: true,
    },
    recargarFlag: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialogFiles: false,
      search: "",
      buscarClienteDialog: false,
      mostrarContinuarFlag: true,
      headers: [
        { text: "Documento", value: "document" },
        { text: "Nombres (s)", value: "nombrecompleto" },
        { text: "Teléfono", value: "phone" },
        { value: "action" },
      ],
      mostrar: false,
      servicesActuales: [],
      nuevosServicios: [],
      opcionsActuales: [],
      opcionNuevos: [],
      idincoterms: null,
      urlGenerada: "",
      headersFiles: [
        { text: "Archivo", value: "name" },
        { text: "", value: "action" },
      ],
    };
  },
  async mounted() {
    this.$refs.frmDatosPrincipales.resetValidation();
    this._getProveedor();
    setTimeout(async () => {
      this.servicesActuales = this.$store.state.pricing.listServices;
      if (this.$route.name === "editQuote") {
        this.idincoterms =
          this.$store.state.pricing.datosPrincipales.idincoterms;
      }
      // await this.GetArchivos();
    }, 500);

    // this.mostrar = true;
  },
  methods: {
    ...mapActions([
      "getMarketingList",
      "getQuoteStatus",
      "getModality",
      "getShipment",
      "getIncoterms",
      "_getEntitiesCliente",
      "getCargarEjecutivo",
      "_getProveedor",
      "registrarQuotePorCambioIncoterms",
      "crearCarpetaOneDrive",
      "actualizarURLEnElQuote",
      "GetArchivos",
      "moveFileToOneDrive",
    ]),
    async copiarArchivos() {
      await this.moveFileToOneDrive({
        fileIds: this.$store.state.pricing.selectedFile.map((file) => file.id),
        destinationFolderUrl: this.urlGenerada,
      }).catch((e) => {
        console.error(e);
      });
      this.$router.push({
        name: "editQuote",
        params: {
          id: this.$store.state.pricing.id,
        },
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    registrarNuevoCliente() {
      this.$store.state.modalEntitie = true;
    },
    abrirModalCliente() {
      this.buscarClienteDialog = true;
      this.$store.state.itemsEntities = [];
      this._getEntitiesCliente();
    },
    guardarCliente(e, { item }) {
      if (!item.phone) {
        Swal.fire({
          icon: "warning",
          title: "¡Advertencia!",
          text: "El cliente seleccionado no tiene un número de teléfono registrado. Por favor, seleccione otro cliente o puede actualizar luego en el fichero de cliente.",
        });
      }
      this.$store.state.pricing.datosPrincipales.id_entitie = item.id;
      this.$store.state.pricing.datosPrincipales.nombre = item.nombrecompleto;
      this.$store.state.pricing.datosPrincipales.telefono = item.phone;
      this.buscarClienteDialog = false;
    },
    continuarDatosCarga() {
      if (this.$refs.frmDatosPrincipales.validate()) {
        this.$emit("activarDatosCarga", true);
        this.mostrarContinuarFlag = false;
      }
    },
    getColorIcon(item) {
      if (item.folder) return "amber";
      const extension = item.extension ? item.extension.toLowerCase() : "";

      const colors = {
        pdf: "red",
        xlsx: "green",
        xls: "green",
        docx: "blue",
        doc: "blue",
        png: "purple",
        jpg: "purple",
      };

      return colors[extension] || "grey";
    },
    getIconFile(item) {
      if (item.folder) return "mdi-folder";

      const extension = item.extension ? item.extension.toLowerCase() : "";

      switch (extension) {
        case "pdf":
          return "mdi-file-pdf-box";
        case "xls":
        case "xlsx":
          return "mdi-file-excel";
        case "doc":
        case "docx":
          return "mdi-file-word";
        case "png":
        case "jpg":
        case "jpeg":
          return "mdi-file-image";
        case "zip":
        case "rar":
          return "mdi-zip-box";
        default:
          return "mdi-file";
      }
    },
    recargarServiciosCostos(id_incoterms) {
      if (this.$route.name === "editQuote") {
        Swal.fire({
          icon: "question",
          title: "Nueva Cotización",
          html: "<span style='font-size:1.5em'> Se creará una nueva cotización con el <b> NUEVO INCOTERMS </b> seleccionado.</span> ",
          confirmButtonText: "Si, crear una nueva Cotización",
          cancelButtonText: "Cancelar",
          showCancelButton: true,
          allowEnterKey: true,
          allowEscapeKey: true,
          allowOutsideClick: true,
          cancelButtonColor: "red",
        }).then((res) => {
          if (res.isConfirmed) {
            this.recargarServiciosCostosContinuar(id_incoterms);
          } else {
            this.$store.state.pricing.datosPrincipales.idincoterms =
              this.idincoterms;
            Swal.close();
          }
        });
      }
      // this.recargarServiciosCostosContinuar(id_incoterms)
    },
    recargarServiciosCostosContinuar(id_incoterms) {
      if (this.$route.name == "editQuote") {
        this.recargarServicioEditar(id_incoterms);
        this.recargarCostosEditar(id_incoterms);
        let data = {
          listServices: this.nuevosServicios,
          opcionCostos: this.opcionNuevos,
        };
        setTimeout(async () => {
          this.$store.state.spiner = true;
          await this.registrarQuotePorCambioIncoterms(data);
          this.$store.state.spiner = false;
          if (this.$store.state.pricing.nro_quote) {
            Swal.fire({
              icon: "success",
              title: "Aviso",
              text: this.$store.state.pricing.mensaje,
              confirmButtonText: "Copiar Archivos",
              showConfirmButton: true,
              allowEnterKey: true,
              allowOutsideClick: true,
              allowEscapeKey: true,
            }).then((result) => {
              this.dialogFiles = true;
            });
            let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch;
            let branchCreacion = [1, 2];
            if (branchCreacion.includes(id_branch)) {
              const urlGenerada = await this.crearCarpetaOneDrive({
                nro_quote: this.$store.state.pricing.nro_quote,
                nombre: this.$store.state.pricing.datosPrincipales.nombre,
              }).catch((e) => {
                console.log(e);
              });

              if (urlGenerada) {
                this.urlGenerada = urlGenerada;
                console.log(this.urlGenerada);
                await Promise.all([
                  this.actualizarURLEnElQuote({
                    id: this.$store.state.pricing.id,
                    url: urlGenerada,
                  }),
                ]);
              } else {
                console.warn(
                  "No se obtuvo URL de OneDrive, se saltó la actualización.",
                );
              }
            }
          }
        }, 500);
      }
      // if (this.$route.name == "newQuote") {
      //   this.recargarNuevo(id_incoterms);
      // }
    },
    recargarServicioEditar(id_incoterms) {
      let servicesPorIncoterm = this.$store.state.pricing.preServices.filter(
        (v) =>
          v.id_incoterms == id_incoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga,
      );

      let servicesActual = this.servicesActuales;

      let nuevosServicios = [];

      servicesPorIncoterm.forEach((element) => {
        if (
          servicesActual.some(
            (v) => Number(v.code_service) === Number(element.code_service),
          )
        ) {
          let serv = servicesActual.find(
            (v) => Number(v.code_service) === Number(element.code_service),
          );
          nuevosServicios.push({ ...element, status: serv.status });
        } else {
          nuevosServicios.push(element);
        }
      });

      this.nuevosServicios = nuevosServicios;
    },

    recargarCostosEditar(id_incoterms) {
      let preCostos = this.$store.state.pricing.preCostos.filter(
        (v) =>
          v.id_incoterms == id_incoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga,
      );
      let opcionCostos = [...this.$store.state.pricing.opcionCostos];
      // console.log(preCostos);
      // console.log(this.$store.state.pricing.opcionCostos);
      let newOpcionCosto = [];
      opcionCostos.forEach((opcion) => {
        let newCosto = [];
        let {
          listCostos,
          listImpuestos,
          nro_propuesta,
          listNotasQuote,
          date_end,
          tiempo_transito,
          selected,
        } = opcion;
        preCostos.forEach((element) => {
          if (
            listCostos.some(
              (v) => String(v.code_cost) === String(element.code_cost),
            )
          ) {
            let costo = listCostos.find(
              (v) =>
                v.esopcionflag == 1 &&
                String(v.code_cost) === String(element.code_cost),
            );
            let venta = listCostos.find(
              (v) =>
                v.esventaflag == 1 &&
                String(v.code_cost) === String(element.code_cost),
            );
            newCosto.push({
              ...element,
              id_proveedor: costo.id_proveedor,
              id_multiplicador: costo.id_multiplicador,
              costounitario: costo.costounitario,
              nameservice: costo.nameservice,
              seguro: costo.seguro,
              status: 1,
              esopcionflag: 1,
              esventaflag: 0,
            });
            newCosto.push({
              ...element,
              id_proveedor: costo.id_proveedor,
              id_multiplicador: costo.id_multiplicador,
              costounitario: costo.costounitario,
              nameservice: costo.nameservice,
              seguro: costo.seguro,
              status: 1,
              esopcionflag: 0,
              esventaflag: 1,
            });
          } else {
            newCosto.push({
              ...element,
              status: 1,
              esopcionflag: 1,
              esventaflag: 0,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            });
            newCosto.push({
              ...element,
              status: 1,
              esopcionflag: 0,
              esventaflag: 1,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            });
          }
        });
        newOpcionCosto.push({
          listCostos: newCosto,
          listImpuestos: listImpuestos,
          nro_propuesta: nro_propuesta,
          listNotasQuote: listNotasQuote,
          date_end: date_end,
          tiempo_transito: tiempo_transito,
          selected: selected,
        });
      });
      this.opcionNuevos = newOpcionCosto;
    },
    recargarNuevo(id_incoterms) {
      let servicesPorIncoterm = this.$store.state.pricing.preServices.filter(
        (v) => v.id_incoterms == id_incoterms,
      );
    },
  },
  computed: {
    ...mapState(["registroClienteFlag", ""]),
    listMarketingActivos() {
      let list = this.$store.state.pricing.listMarketing || [];
      // Solo activos y ordenados por posición, igual que en FolderMarketing/list.vue
      return list
        .filter((m) => m.status === 1 || m.status === true)
        .sort((a, b) => {
          const pa = a.position || 0;
          const pb = b.position || 0;
          return pa - pb;
        });
    },
    incoterms() {
      let Icoterms = [];
      [...this.$store.state.pricing.listIncoterms].forEach((element) => {
        element.text = element.name + " - " + element.description;
        Icoterms.push(element);
      });

      return Icoterms;
    },
    mostrarProveedorFlag() {
      let exw = this.$store.state.pricing.listIncoterms.filter(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.name == "EXW",
      );

      return exw.length > 0 ? true : false;
    },
  },
  watch: {
    async registroClienteFlag() {
      this.$store.state.spiner = true;
      await this._getEntitiesCliente();
      this.$store.state.spiner = false;
      if (!!this.$store.state.entities.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.$store.state.entities.id,
        )[0];
        this.$store.state.pricing.datosPrincipales.id_entitie = cliente.id;
        this.$store.state.pricing.datosPrincipales.nombre =
          cliente.nombrecompleto;
        this.$store.state.pricing.datosPrincipales.telefono = cliente.phone;
      }
      this.buscarClienteDialog = false;
    },
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
