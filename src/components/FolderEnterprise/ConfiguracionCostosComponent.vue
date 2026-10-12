<template>
  <v-container fluid>
    <div v-if="finalizar" ref="subirCostos">
      <v-row>
        <v-col cols="12">
          <center>
            <p class="text-azul">4. CONFIGURACIÓN TARIFAS DE SERVICIO</p>
          </center>
        </v-col>
        <v-row v-if="!subirCostos" class="mx-10 my-1">
          <v-col cols="12">
            <v-row>
              <v-col cols="1" class="ocultarMovil">
                <v-icon size="50" color="red">mdi-alert</v-icon>
              </v-col>
              <v-col cols="12" lg="11" xl="11" class="infoImportante">
                <h2>AUTOMATIZA LAS TARIFAS DE TUS PROVEEDORES</h2>

                <p>
                  Con esta opción podrás agilizar tus cotizaciones. Olvídate de
                  los cálculos manuales y evita errores. La configuración que
                  realices se aplicará automáticamente en cada propuesta a tus
                  clientes, ahorrándote tiempo y garantizando precisión en todas
                  tus cotizaciones
                </p>
                <h2 class="mt-10">SI DECIDES OMITIR ESTA CONFIGURACION</h2>
                <p>
                  El sistema asignará conceptos predeterminados con precios en
                  cero.
                  <span class="bg-yellow">
                    Podrás ajustarlas la configuración de las tarifas en
                    cualquier momento desde el módulo de configuración
                  </span>
                </p>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" class="centrado">
            <v-btn
              class="mt-1 mb-1"
              color="#7E7E7E"
              dark
              @click="OmitirConfiguracionCostos()"
              v-if="!subirCostos"
            >
              Omitir
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="#5E9AD6"
              @click="subirCostos = !subirCostos"
              dark
              class="mt-1 mb-1"
            >
              CONFIGURAR TARIFAS
            </v-btn>
          </v-col>
          <v-col cols="12" class="centrado mt-10">
            <v-btn
              @click="retroceder()"
              color="#78909C"
              dark
              class="mt-1 mb-1"
              v-if="!subirCostos"
            >
              REGRESAR A LA ANTERIOR
            </v-btn>
          </v-col>
        </v-row>
        <v-col cols="12" v-else>
          <v-card elevation="2" class="px-5 mb-3">
            <v-row>
              <v-col cols="12" lg="8" xl="8">
                TARIFAS SEGÚN TIPO DE SERVICIO
              </v-col>
              <v-col cols="12" lg="4" xl="4">
                <v-btn
                  outlined
                  dense
                  hide-details
                  class="my-2"
                  color="success"
                  small
                  @click="abrirNuevoCosto()"
                >
                  Agregar nuevo Costo
                  <v-icon color="green">mdi-plus</v-icon></v-btn
                >
              </v-col>
              <v-col cols="12" lg="3" xl="3">
                <b>Modalidad: </b>
                <span class="description">
                  {{
                    $store.state.pricing.listModality.filter(
                      (v) => v.id == id_modality
                    )[0].name
                  }}
                </span>
              </v-col>

              <v-col cols="12" lg="3" xl="3">
                <b>Tipo de Carga: </b>
                <span class="description">
                  {{
                    $store.state.pricing.listShipment.filter(
                      (v) => v.id == id_shipment
                    )[0].code
                  }}
                </span>
              </v-col>

              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="$store.state.configEmpresa.lstCostos"
                  class="elevation-1 table_costos"
                  item-key="id"
                  :loading="loadingTable"
                  hide-default-footer
                  :items-per-page="20"
                  disable-sort
                  mobile
                >
                  <template v-slot:[`item.exwflag`]="{ item }">
                    <v-icon color="green" v-if="item.exwflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.fcaflag`]="{ item }">
                    <v-icon color="green" v-if="item.fcaflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.fobflag`]="{ item }">
                    <v-icon color="green" v-if="item.fobflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.cfrflag`]="{ item }">
                    <v-icon color="green" v-if="item.cfrflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.cifflag`]="{ item }">
                    <v-icon color="green" v-if="item.cifflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.ddpflag`]="{ item }">
                    <v-icon color="green" v-if="item.ddpflag"
                      >mdi-check-bold</v-icon
                    >
                    <v-icon color="red" v-else>mdi-close</v-icon>
                  </template>
                  <template v-slot:[`item.monto`]="{ item }">
                    <v-text-field
                      v-model="item.monto"
                      @blur="reponerCero(item)"
                      dense
                      hide-details
                      class="my-2"
                      v-if="item.concepto"
                    ></v-text-field>
                  </template>
                  <template v-slot:[`item.multiplicador`]="{ item }">
                    <v-autocomplete
                      :items="$store.state.configEmpresa.lstMultiplicador"
                      v-model="item.id_multiplicador"
                      dense
                      hide-details
                      class="my-2"
                      item-value="id"
                      v-if="item.concepto"
                    />
                  </template>
                  <template v-slot:[`item.proveedor`]="{ item }">
                    <v-autocomplete
                      :items="$store.state.itemsProveedorList"
                      v-model="item.id_proveedor"
                      dense
                      hide-details
                      class="my-2"
                      item-text="namelong"
                      item-value="id"
                      v-if="item.concepto"
                    />
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-col cols="12" class="centrado">
        <!-- @click="$emit('regresar')" -->

        <v-btn
          v-if="subirCostos"
          class="mx-5 mt-1 mb-1"
          color="#7E7E7E"
          dark
          @click="omitir()"
        >
          Omitir
        </v-btn>
        <v-btn
          class="mx-5 mt-1 mb-1"
          color="#1A237E"
          :dark="subirCostos"
          v-if="subirCostos"
          @click="guardarCosto()"
        >
          Guardar y continuar
        </v-btn>
      </v-col>
      <v-col cols="12" class="centrado">
        <v-btn
          @click="retroceder()"
          color="#78909C"
          dark
          class="mx-5 mt-1 mb-1"
          v-if="subirCostos"
        >
          REGRESAR A LA ANTERIOR
        </v-btn>
      </v-col>
    </div>
    <div v-else>
      <v-row>
        <v-col cols="12" md="4" offset-md="4">
          <v-card elevation="2" class="pa-5">
            <center class="mb-5">
              <h1>
                <img src="/img/png/trofeo.png" width="30px" alt="" srcset="" />
                Tu empresa ha sido configurada
              </h1>
            </center>
            <table>
              <tr style="margin: 150px 0 !important">
                <td style="text-align: left; vertical-align: top">
                  <v-icon>mdi-check</v-icon>
                </td>
                <td style="text-align: justify; vertical-align: top">
                  Ya puedes comenzar a usar ACO ahora mismo.
                </td>
              </tr>
              <tr>
                <td colspan="2" style="height: 30px"></td>
              </tr>
              <tr style="margin: 150px 0 !important">
                <td style="text-align: left; vertical-align: top">
                  <v-icon>mdi-check</v-icon>
                </td>
                <td style="text-align: justify; vertical-align: top">
                  Para aplicar los últimos ajustes que realizaste (Tarifario,
                  logo, Impuestos), solo debes volver a ingresar.
                </td>
              </tr>
            </table>
            <div class="mt-5" style="text-align: center">
              <!-- color="#4256BE" -->
              <v-btn
                class="my-1 mx-1 buttonDosFilas"
                x-small
                dark
                color="#1A237E"
                @click="finalizarSinLogin()"
              >
                INGRESAR Y EXPLORAR <br class="ocultarPc" />
                LOS MÓDULOS
              </v-btn>
              <v-btn
                class="my-1 mx-1 buttonDosFilas"
                @click="finalizarConfig()"
                x-small
              >
                VOLVER A INGRESAR <br class="ocultarPc" />
                PARA APLICAR CAMBIOS
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <!-- max-width="30%" -->
    <v-dialog
      v-model="dialog"
      scrollable
      :max-width="isMobile ? '100%' : '30%'"
      transition="dialog-transition"
      persistent
      class="modalNuevoCosto"
    >
      <v-card>
        <v-card-title primary-title>
          AGREGAR NUEVO COSTO
          <v-spacer></v-spacer>
          <v-icon @click="dialog = !dialog" color="default">mdi-close</v-icon>
        </v-card-title>
        <v-form ref="frmNuevosCostos">
          <v-card-text>
            <v-select
              :items="lstTramo"
              v-model="frmNuevoCosto.tramo"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Tramo*"
              outlined
              dense
              hide-details
              class="my-2"
            ></v-select>

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Servicio*"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.servicio"
            />
            <v-autocomplete
              :items="$store.state.configEmpresa.listTipoCostos"
              v-model="frmNuevoCosto.id_tipocosto"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="name"
              label="Sección*"
              item-text="name"
              outlined
              dense
              hide-details
              class="my-2"
            />
            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Concepto*"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.concepto"
            />

            <v-autocomplete
              :items="$store.state.configEmpresa.lstMultiplicador"
              v-model="frmNuevoCosto.id_multiplicador"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="id"
              label="Multiplicador*"
              outlined
              dense
              hide-details
              class="my-2"
            />
            <v-text-field
              label="Monto"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.monto"
            />

            <v-autocomplete
              :items="$store.state.itemsEntities"
              v-model="frmNuevoCosto.id_proveedor"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Proveedor*"
              item-text="namelong"
              outlined
              dense
              hide-details
              class="my-2"
              item-value="id"
            />
            <p>Incoterms</p>
            <v-row>
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.exwflag
                  )
                "
                label="EXW"
                v-model="frmNuevoCosto.exwflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.fcaflag
                  )
                "
                label="FCA"
                v-model="frmNuevoCosto.fcaflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.fobflag
                  )
                "
                label="FOB"
                v-model="frmNuevoCosto.fobflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.cfrflag
                  )
                "
                label="CFR"
                v-model="frmNuevoCosto.cfrflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.cifflag
                  )
                "
                label="CIF"
                v-model="frmNuevoCosto.cifflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  this.$store.state.configEmpresa.lstCostos.some(
                    (v) => v.ddpflag
                  )
                "
                label="DDP"
                v-model="frmNuevoCosto.ddpflag"
              />
            </v-row>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1 mt-1 mb-5"
            @click="dialog = !dialog"
            color="#923939"
            dark
          >
            CANCELAR
          </v-btn>
          <v-btn
            class="mx-1 mt-1 mb-5"
            @click="agregarNuevoCosto()"
            color="#346E3D"
            dark
          >
            AGREGAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  components: {
    Proceesing: () => import("../modal/modalProcessing.vue"),
  },
  data() {
    return {
      isMobile: false,
      finalizar: true,
      subirCostos: false,
      dialogProcessing: false,
      loadingTable: false,
      loading: false,
      items: [],
      headers: [
        { text: "TRAMO", value: "tramo" },
        { text: "SERVICIO", value: "servicio" },
        { text: "CONCEPTO", value: "concepto" },
        { text: "MULTIPLICADOR", value: "multiplicador" },
        { text: "MONTO", value: "monto" },
        { text: "PROVEEDOR", value: "proveedor" },
      ],
      dialog: false,
      ids_modality: [],
      ids_shipment: [],
      id_modality: "",
      id_shipment: "",
      lstTramo: [
        { id: "ORIGEN", text: "ORIGEN" },
        { id: "FLETE", text: "FLETE" },
        { id: "DESTINO", text: "DESTINO" },
        { id: "OPCIONAL", text: "OPCIONAL" },
      ],
      frmNuevoCosto: {
        exwflag: false,
        fcaflag: false,
        fobflag: false,
        cfrflag: false,
        cifflag: false,
        ddpflag: false,
        tramo: "",
        servicio: "",
        concepto: "",
        id_multiplicador: "",
        monto: 0,
        id_proveedor: "",
      },
      indexShipment: 0, // Índice para rastrear la posición actual del shipment
      indexModality: 0, // Índice para rastrear la posición actual de la modalidad
      loading: false,
      loadingTable: false,
      finalizar: false,
    };
  },

  async mounted() {
    this.checkIfMobile();
    this.loadingTable = true;
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
    await this.obtenerConfigCostos({
      id_modality: this.id_modality,
      shipment: this.$store.state.pricing.listShipment.filter(
        (v) =>
          v.id ==
          this.$store.state.pricing.listShipment.map((element) => {
            return element.id;
          })[0]
      )[0].code,
    });
    this.generarHeader();
    await this.getMultiplicadorConfig({
      id_shipment: this.id_shipment,
    });
    this.loadingTable = false;
    await this.generarSecciones();
  },
  methods: {
    ...mapActions([
      "obtenerConfigCostos",
      "getMultiplicadorConfig",
      "getTipoCostosConfig",
      "guardarCostos",
      "finalizarConfiguracion",
      "OmitirConfiguracionCost",
      "_getMenuItem",
    ]),
    async finalizarSinLogin() {
      Swal.fire({
        title: "Procesando...",
        text: "Por favor espera",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"));

      dataBranch[0].esnuevoflag = false;

      sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
      await this._getMenuItem();

      setTimeout(async () => {
        this.$router.push({
          name: "Main",
        });
        this.$swal.close();
        window.location.reload();
      }, 1000);
    },
    checkIfMobile() {
      this.isMobile = window.innerWidth <= 600; // 600px como referencia para dispositivos móviles
    },
    scrollToSubirCostos() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    abrirNuevoCosto() {
      this.checkIfMobile();
      this.dialog = true;
      this.$refs.frmNuevosCostos.reset();
    },
    agregarNuevoCosto() {
      if (this.$refs.frmNuevosCostos.validate()) {
        this.$store.state.configEmpresa.lstCostos.push({
          exwflag: this.frmNuevoCosto.exwflag,
          fcaflag: this.frmNuevoCosto.fcaflag,
          fobflag: this.frmNuevoCosto.fobflag,
          cfrflag: this.frmNuevoCosto.cfrflag,
          cifflag: this.frmNuevoCosto.cifflag,
          ddpflag: this.frmNuevoCosto.ddpflag,
          tramo: this.frmNuevoCosto.tramo,
          servicio: this.frmNuevoCosto.servicio,
          concepto: this.frmNuevoCosto.concepto,
          id_multiplicador: this.frmNuevoCosto.id_multiplicador,
          monto: this.frmNuevoCosto.monto,
          id_proveedor: this.frmNuevoCosto.id_proveedor,
          seccion: this.frmNuevoCosto.id_tipocosto,
          code: 0,
        });
        this.dialog = false;
        console.log(this.$store.state.configEmpresa.lstCostos);
      }
    },
    // omitir() {
    //   this.$store.state.enterprises.step++;
    //   this.$store.state.enterprises.datoCostosFlag = false;

    // },
    // async omitir() {
    //   this.$store.state.dialogProcessing = true;
    //   this.scrollToSubirCostos();
    //   if (this.subirCostos) {
    //     this.loading = !this.loading;
    //     if (this.ids_shipment.length > 1) {
    //       this.loadingTable = true;
    //       this.ids_shipment.splice(0, 1);
    //       this.id_shipment = this.ids_shipment[0];
    //       await this.obtenerConfigCostos({
    //         id_modality: this.id_modality,
    //         shipment: this.$store.state.pricing.listShipment.filter(
    //           (v) => v.id == this.id_shipment
    //         )[0].code,
    //       });
    //       await this.getMultiplicadorConfig({
    //         id_shipment: this.id_shipment,
    //       });
    //       this.generarHeader();
    //       this.loadingTable = false;
    //     } else {
    //       if (this.ids_modality.length > 1) {
    //         this.loadingTable = true;
    //         this.ids_modality.splice(0, 1);
    //         this.id_modality = this.ids_modality[0];
    //         this.ids_shipment = this.$store.state.pricing.listShipment.map(
    //           (element) => {
    //             return element.id;
    //           }
    //         );
    //         this.id_shipment = this.ids_shipment[0];
    //         await this.obtenerConfigCostos({
    //           id_modality: this.id_modality,
    //           shipment: this.$store.state.pricing.listShipment.filter(
    //             (v) => v.id == this.id_shipment
    //           )[0].code,
    //         });

    //         await this.getMultiplicadorConfig({
    //           id_shipment: this.id_shipment,
    //         });
    //         this.generarHeader();
    //         this.loadingTable = false;
    //       } else {
    //         this.finalizar = true;
    //       }
    //     }
    //     this.generarSecciones();
    //     this.loading = !this.loading;
    //   } else {
    //     this.finalizar = true;
    //   }
    //   setTimeout(() => {
    //     this.$store.state.dialogProcessing = false;
    //   }, 300);
    // },
    OmitirConfiguracionCostos() {
      Swal.fire({
        icon: "warning",
        title: "OMITIR CONFIGURACIÓN DE COSTOS.",
        html: `Se usaran los valores predeterminado del sistema, con la finalidad de que puedas usar el istema. Podras editar estos valores mas adelante`,
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Continuar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      }).then((res) => {
        if (res.isConfirmed) {
          this.OmitirConfiguracionCost();
          this.finalizar = true;
        }
      });
    },
    omitir() {
      Swal.fire({
        icon: "warning",
        title: "OPCIÓN OMITIDA",
        html: `Se usaran los valores predeterminado del sistema, con la finalidad de que puedas usar el istema. Podras editar estos valores mas adelante`,
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Continuar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      }).then((res) => {
        if (res.isConfirmed) {
          this.guardarCostosPredefinidos();
        }
      });
    },
    async guardarCostosPredefinidos() {
      this.$store.state.dialogProcessing = true;
      await this.guardarCostos({
        id_modality: this.id_modality,
        id_shipment: this.id_shipment,
        lstCostos: this.$store.state.configEmpresa.lstCostos,
      });
      this.scrollToSubirCostos();

      if (this.subirCostos) {
        this.loading = !this.loading;

        // Avanzar en los shipments
        if (this.indexShipment < this.ids_shipment.length - 1) {
          this.loadingTable = true;
          this.indexShipment++;
          this.id_shipment = this.ids_shipment[this.indexShipment];

          await this.obtenerConfigCostos({
            id_modality: this.id_modality,
            shipment: this.$store.state.pricing.listShipment.find(
              (v) => v.id === this.id_shipment
            ).code,
          });

          await this.getMultiplicadorConfig({
            id_shipment: this.id_shipment,
          });

          this.generarHeader();
          this.loadingTable = false;
        } else if (this.indexModality < this.ids_modality.length - 1) {
          // Si ya no quedan shipments, pasar a la siguiente modalidad
          this.loadingTable = true;
          this.indexModality++;
          this.id_modality = this.ids_modality[this.indexModality];

          // Reiniciar los shipments para la nueva modalidad
          this.indexShipment = 0;
          this.ids_shipment = this.$store.state.pricing.listShipment.map(
            (element) => element.id
          );
          this.id_shipment = this.ids_shipment[this.indexShipment];

          await this.obtenerConfigCostos({
            id_modality: this.id_modality,
            shipment: this.$store.state.pricing.listShipment.find(
              (v) => v.id === this.id_shipment
            ).code,
          });

          await this.getMultiplicadorConfig({
            id_shipment: this.id_shipment,
          });

          this.generarHeader();
          this.loadingTable = false;
        } else {
          this.finalizar = true;
        }

        this.generarSecciones();
        this.loading = !this.loading;
      } else {
        this.finalizar = true;
      }

      setTimeout(() => {
        this.$store.state.dialogProcessing = false;
      }, 300);
    },

    async retroceder() {
      this.$store.state.dialogProcessing = true;
      this.scrollToSubirCostos();

      if (this.subirCostos) {
        this.loading = !this.loading;

        // Retroceder en los shipments
        if (this.indexShipment > 0) {
          this.loadingTable = true;
          this.indexShipment--;
          this.id_shipment = this.ids_shipment[this.indexShipment];

          await this.obtenerConfigCostos({
            id_modality: this.id_modality,
            shipment: this.$store.state.pricing.listShipment.find(
              (v) => v.id === this.id_shipment
            ).code,
          });

          await this.getMultiplicadorConfig({
            id_shipment: this.id_shipment,
          });

          this.generarHeader();
          this.loadingTable = false;
        } else if (this.indexModality > 0) {
          // Retroceder en las modalidades si no hay más shipments anteriores
          this.loadingTable = true;
          this.indexModality--;
          this.id_modality = this.ids_modality[this.indexModality];

          // Reiniciar los shipments para la modalidad anterior
          this.indexShipment = this.ids_shipment.length - 1;
          this.ids_shipment = this.$store.state.pricing.listShipment.map(
            (element) => element.id
          );
          this.id_shipment = this.ids_shipment[this.indexShipment];

          await this.obtenerConfigCostos({
            id_modality: this.id_modality,
            shipment: this.$store.state.pricing.listShipment.find(
              (v) => v.id === this.id_shipment
            ).code,
          });

          await this.getMultiplicadorConfig({
            id_shipment: this.id_shipment,
          });

          this.generarHeader();
          this.loadingTable = false;
        } else {
          this.$emit("regresar");
        }

        this.generarSecciones();
        this.loading = !this.loading;
      } else {
        this.$emit("regresar");
      }

      setTimeout(() => {
        this.$store.state.dialogProcessing = false;
      }, 300);
    },

    async guardarCosto() {
      this.scrollToSubirCostos();
      this.loading = !this.loading;
      this.$store.state.dialogProcessing = true;
      await this.guardarCostos({
        id_modality: this.id_modality,
        id_shipment: this.id_shipment,
        lstCostos: this.$store.state.configEmpresa.lstCostos,
      });

      if (this.indexShipment < this.ids_shipment.length - 1) {
        this.loadingTable = true;
        this.indexShipment++; // Avanzar al siguiente shipment
        this.id_shipment = this.ids_shipment[this.indexShipment];

        // Obtener los costos y multiplicadores para el siguiente shipment
        await this.obtenerConfigCostos({
          id_modality: this.id_modality,
          shipment: this.$store.state.pricing.listShipment.find(
            (v) => v.id === this.id_shipment
          ).code,
        });

        await this.getMultiplicadorConfig({
          id_shipment: this.id_shipment,
        });

        this.generarHeader();
        this.loadingTable = false;
      } else if (this.indexModality < this.ids_modality.length - 1) {
        // Si no hay más envíos, verificar si hay más modalidades
        this.loadingTable = true;
        this.indexModality++; // Avanzar a la siguiente modalidad
        this.id_modality = this.ids_modality[this.indexModality];

        // Reiniciar los shipments para la nueva modalidad
        this.indexShipment = 0;
        this.ids_shipment = this.$store.state.pricing.listShipment.map(
          (element) => element.id
        );
        this.id_shipment = this.ids_shipment[this.indexShipment];

        // Obtener los costos y multiplicadores para el primer shipment de la nueva modalidad
        await this.obtenerConfigCostos({
          id_modality: this.id_modality,
          shipment: this.$store.state.pricing.listShipment.find(
            (v) => v.id === this.id_shipment
          ).code,
        });

        await this.getMultiplicadorConfig({
          id_shipment: this.id_shipment,
        });

        this.generarHeader();
        this.loadingTable = false;
      } else {
        // Si no quedan más modalidades o envíos, finalizar el proceso
        this.finalizar = true;
      }

      this.loading = !this.loading;
      this.$store.state.dialogProcessing = false;
      this.generarSecciones();

      // Mover el scroll hacia arriba al finalizar el registro
      this.$nextTick(() => {
        const frmRegistro = this.$refs.frmRegistro;
        if (frmRegistro && frmRegistro.$el) {
          frmRegistro.$el.scrollTop = 0; // Mover el scroll hacia arriba
        }
      });
    },
    generarHeader() {
      this.headers = [];
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.exwflag)) {
        this.headers.push({ text: "EXW", value: "exwflag" });
      }
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.fcaflag)) {
        this.headers.push({ text: "FCA", value: "fcaflag" });
      }
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.fobflag)) {
        this.headers.push({ text: "FOB", value: "fobflag" });
      }
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.cfrflag)) {
        this.headers.push({ text: "CFR", value: "cfrflag" });
      }
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.cifflag)) {
        this.headers.push({ text: "CIF", value: "cifflag" });
      }
      if (this.$store.state.configEmpresa.lstCostos.some((v) => v.ddpflag)) {
        this.headers.push({ text: "DDP", value: "ddpflag" });
      }
      this.headers.push({ text: "TRAMO", value: "tramo" });
      this.headers.push({ text: "SERVICIO", value: "servicio" });
      this.headers.push({ text: "CONCEPTO", value: "concepto" });
      this.headers.push({ text: "MULTIPLICADOR", value: "multiplicador" });
      this.headers.push({ text: "MONTO", value: "monto" });
      this.headers.push({ text: "PROVEEDOR", value: "proveedor" });
    },
    generarSecciones() {
      this.$store.state.configEmpresa.listTipoCostos = [];
      let seccionesArr = this.$store.state.configEmpresa.lstCostos.map(
        (item) => {
          return item.seccion;
        }
      );
      let secciones = new Set(seccionesArr);
      let lstSecciones = [];
      secciones.forEach((element) => {
        if (element) {
          lstSecciones.push({
            name: element,
          });
        }
      });

      lstSecciones.push({
        name: "DESTINO: GASTOS DE TERCEROS",
      });

      this.$store.state.configEmpresa.listTipoCostos = lstSecciones;
    },
    async finalizarConfig() {
      await this.finalizarConfiguracion();
      if (sessionStorage.getItem("auth-token")) {
        sessionStorage.removeItem("auth-token");
      }
      if (sessionStorage.getItem("dataUser")) {
        sessionStorage.removeItem("dataUser");
      }
      if (sessionStorage.getItem("dataBranch")) {
        sessionStorage.removeItem("dataBranch");
      }
      this.$router.push({ name: "Login" });
      window.location.reload(true);
    },
    reponerCero(valor) {
      if (
        valor.monto == "" ||
        valor.monto == null ||
        valor.monto == undefined
      ) {
        valor.monto = 0;
      }
      this.$forceUpdate();
    },
  },
  watch: {
    loading() {},
  },
};
</script>

<style scoped>
.derecha {
  align-content: right !important;
  text-align: right !important;
}
.izquierda {
  align-content: left !important;
  text-align: left !important;
}
.centrado {
  align-content: center !important;
  text-align: center !important;
}
.logo {
  max-width: 25%;
  background: brown;
}
.blue {
  background: none !important;
  color: #09305e !important;
}
.btnAcciones {
  margin: 0 0 10% 0 !important;
}
.no-scroll {
  overflow: hidden;
}
.no-scroll-dialog {
  overflow: hidden;
  position: relative;
}
.bg-yellow {
  background: yellow;
  padding: 0 1%;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
}
.text-description {
  padding: 0 5px;
  /* color: red; */
}
/* .table_costos[data-v-3a7680ae] .v-data-table-header thead th {
  font-weight: bold !important;
  background: #bbdefb !important;
} */

.description {
  color: #203bc7;
  font-size: 1.2rem;
  font-weight: bold;
}
.infoImportante {
  text-align: justify;
}
.button {
  padding: 20px !important;
  width: 160px;
}
.buttonDosFilas {
  padding: 23px !important;
  width: 160px;
  white-space: normal;
}
@media (max-width: 918px) {
  .infoImportante {
    padding: 0 2% 0 0 !important;
  }
  ::v-deep .v-data-table__sort-label {
    display: none !important;
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
