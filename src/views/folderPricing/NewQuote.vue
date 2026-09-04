<template>
  <v-container fluid class="pt-0 px-0">
    <v-stepper v-model="step" class="pt-0">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1" editable>
          Datos de la Carga
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="step > 2" step="2" :editable="editableStep2">
          costos de la Cotización
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3"> Comparativa </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="4"> Notas de Costos </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-row>
            <!-- <v-col cols="12" md="6" class="pt-0"> -->
            <v-col cols="12" md="6" class="pt-0">
              <v-row>
                <v-col cols="12" class="my-0 py-0">
                  <DatosPrincipales
                    @recargarServiciosCostos="recargar"
                    @activarDatosCarga="activarDatosCarga"
                    :recargarFlag="DatosCargaComponentFlag"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="6" class="my-0 py-0" id="DatosCargaComponent">
              <DatosCargaComponent
                v-if="DatosCargaComponentFlag"
                @activarServicios="activarServicios()"
                @recargarCostos="recargarCostos"
              />
            </v-col>
            <v-col cols="12" id="ServicesComponent">
              <ServicesComponent
                v-if="ServicesComponentFlag"
                @activarLlenadoCostos="activarLlenadoCostos()"
                @recargarCostos="recargarCostos()"
              />
            </v-col>
          </v-row>

          <!-- <v-btn color="primary" @click="step = 2"> Continue </v-btn>

          <v-btn text> Cancel </v-btn> -->
        </v-stepper-content>

        <v-stepper-content step="2">
          <DatosCostosComponent
            :key="indexCostos"
            @anadirNuevaOpcion="anadirNuevaOpcion"
            @continuarComparativa="continuarComparativa"
            @irANotas="irANotas"
            :mostrarImpuestosEditar="true"
          />
        </v-stepper-content>

        <v-stepper-content step="3">
          <ComparativaComponent @irVentaCliente="irVentaCliente" />
        </v-stepper-content>
        <v-stepper-content step="4">
          <NotasComponent :editable="editableStep4" />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-container>
</template>

<script>
import DatosPrincipales from "../../components/folderPricing/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderPricing/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderPricing/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderPricing/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderPricing/ComparativaComponent.vue";
import NotasComponent from "../../components/folderPricing/NotasComponent.vue";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import readXlsFile from "read-excel-file";
import mixins from "@/components/mixins/funciones.js";
export default {
  mixins: [mixins],
  components: {
    DatosPrincipales,
    DatosCargaComponent,
    ServicesComponent,
    DatosCostosComponent,
    ComparativaComponent,
    NotasComponent,
  },
  data() {
    return {
      step: 1,
      DatosCargaComponentFlag: false,
      ServicesComponentFlag: false,
      editableStep2: false,
      editableStep4: false,
      recargarSegmentos: false,
      indexCostos: 0,
    };
  },
  async mounted() {
    this.$store.state.pricing.step = 1;
    this.$store.commit("SET_RESET");
    this.$store.state.mainTitle = "Nueva Cotización";
    await Promise.all([
      // await this.resetQuoteNew(),
      this.getMarketingList(),
      this.getQuoteStatus(),
      this.ensurePreliminarStatus(),
      this.getModality(),
      this.getShipment(),
      this.getIncoterms(),
      this.getCargarEjecutivo(),
    ]);

    await this.setDefaultStatusPreliminar();
    let opciones = [...this.$store.state.pricing.opcionCostos];
    let IdProveedor = [];
    opciones.forEach((opcion) => {
      opcion.listCostos.forEach((costo) => {
        if (!IdProveedor.some((v) => v == costo.id_proveedor))
          IdProveedor.push(costo.id_proveedor);
      });
    });
    await Promise.all([
      this.getBegEndList(),
      this.getServices(),
      this.obtenerCostosPricing(),
      this.getImpuestos(),
      this.getCargarMasterDetalleNotasCotizacion(),
      this.obtenerImpuestoXEmpresa(),
      this.cargarMasterDetallePercepcionAduana(),
      this._getContainers(),
    ]);
    await this.obtenerProveedorPricing({
      id: IdProveedor.join(","),
      search: null,
    });
  },
  methods: {
    ...mapActions([
      "resetQuoteNew",
      "obtenerProveedorPricing",
      "getMarketingList",
      "getQuoteStatus",
      "getModality",
      "getShipment",
      "getIncoterms",
      "getCargarEjecutivo",
      "getPortBegin",
      "getPortEnd",
      "getServices",
      "getBegEndList",
      "getTipoCostos",
      "obtenerCostosPricing",
      "getMultiplicador",
      "getImpuestos",
      "getCargarMasterDetalleNotasCotizacion",
      "cargarProveedores",
      "obtenerImpuestoXEmpresa",
      "registrarQuote",
      "cargarMasterDetallePercepcionAduana",
      "_getContainers",
      "crearCarpetaOneDrive",
      "actualizarURLEnElQuote",
      "obtenerFleteCalculadora",
      "getTransporte",
    ]),
    recargar() {
      if (this.$store.state.pricing.listServices.length > 0) {
        this.recargarServicios();
        this.getTipoCostos();
      }
      if (this.editableStep2) {
        this.recargarCostos();
        // this.$store.state.pricing.index = 0;
      }
    },
    continuarComparativa() {
      this.step = 3;
      this.$store.state.pricing.step = 3;
    },
    async activarDatosCarga() {
      this.$store.state.spiner = true;
      await Promise.all([
        this.getPortBegin({
          id_transport: this.$store.state.pricing.datosPrincipales.idtipocarga
            .id_transport
            ? this.$store.state.pricing.datosPrincipales.idtipocarga
                .id_transport
            : this.$store.state.pricing.datosPrincipales.idtipocarga,
        }),
        this.getPortEnd({
          id_transport: this.$store.state.pricing.datosPrincipales.idtipocarga
            .id_transport
            ? this.$store.state.pricing.datosPrincipales.idtipocarga
                .id_transport
            : this.$store.state.pricing.datosPrincipales.idtipocarga,
        }),
      ]);
      this.DatosCargaComponentFlag = true;
      this.$nextTick(() => {
        // setTimeout(() => {
        const element = document.getElementById("DatosCargaComponent");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // }, 100);
      });
      this.$store.state.spiner = false;
    },
    async activarServicios() {
      this.ServicesComponentFlag = true;
      let idTipoCarga =
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
        "object"
          ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
          : this.$store.state.pricing.datosPrincipales.idtipocarga;

      let services = [...this.$store.state.pricing.preServices];
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id,
      );
      Promise.all([
        this.getTipoCostos(),
        this.obtenerFleteCalculadora({
          shipment: this.$store.state.pricing.listShipment.find(
            (v) => v.id == idTipoCarga,
          ).code,
          puerto_origen: this.$store.state.pricing.listPortBegin.find(
            (v) =>
              v.id_port == this.$store.state.pricing.datosPrincipales.idorigen,
          ).puerto,
          puerto_destino: this.$store.state.pricing.listPortEnd.find(
            (v) =>
              v.id_port == this.$store.state.pricing.datosPrincipales.iddestino,
          ).puerto,
          volumen: this.$store.state.pricing.datosPrincipales.volumen,
          peso: this.$store.state.pricing.datosPrincipales.peso,
        }),
        this.getTransporte({
          shimpent: this.$store.state.pricing.listShipment.find(
            (v) => v.id == idTipoCarga,
          ).code,
          id_modality: this.$store.state.pricing.datosPrincipales.idsentido,
          id_pais: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_pais,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        }),
      ]);

      this.$store.state.pricing.listServices = serv;
      this.$nextTick(() => {
        // setTimeout(() => {
        const element = document.getElementById("ServicesComponent");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // }, 100);
      });

      this.$store.state.spiner = false;
    },
    recargarServicios() {
      let services = [...this.$store.state.pricing.preServices];
      if (services.length == 0) {
        return;
      }
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id,
      );
      // eliminando los servicios que ya no van
      let IdServices = serv.map((v) => v.id);
      this.$store.state.pricing.listServices
        .filter((v) => !!v.id)
        .forEach((servicios) => {
          if (!IdServices.includes(servicios.id)) {
            let index = this.$store.state.pricing.listServices.findIndex(
              (v) => v.code_service == servicios.code_service,
            );
            this.$store.state.pricing.listServices.splice(index, 1);
          }
        });
      // agregando los servicios que faltan
      IdServices = this.$store.state.pricing.listServices.map(
        (v) => v.code_service,
      );

      serv.forEach((servicios) => {
        if (!IdServices.includes(servicios.code_service)) {
          this.$store.state.pricing.listServices.push(servicios);
        }
      });
    },
    async activarLlenadoCostos() {
      this.$store.state.spiner = true;
      await this.getMultiplicador();
      // await this.getImpuestos();

      // 1. DESESTRUCTURACIÓN: Extraemos todo lo que necesitamos para no escribir rutas tan largas
      const {
        datosPrincipales,
        listServices,
        preCostos,
        listImpuestos,
        listNotasQuote,
        opcionCostos,
      } = this.$store.state.pricing;

      const {
        esindividualflag,
        esgrupalflag,
        idincoterms,
        idsentido,
        idtipocarga,
        containers,
        id_percepcionaduana,
      } = datosPrincipales;

      // 2. PREPARACIÓN DE FILTROS Y VARIABLES COMUNES
      const codeServicesActivos = new Set(
        listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      const idContainersSet = new Set(containers.map((v) => v.id));
      const COSTOS_ESPECIALES = [69, 114, 105, 39];

      const tipoImportacion =
        this.$store.state.masterusuarios.lstPercepcionAduana.find(
          (v) => v.id == id_percepcionaduana,
        );
      const codigoImportacion = tipoImportacion?.codigo; // "01" o "02"

      // 3. FILTRADO UNIFICADO (Optimizado en una sola pasada)
      const cFiltrado = preCostos.filter((v) => {
        const matchBasico =
          v.id_incoterms == idincoterms &&
          v.id_modality == idsentido &&
          v.id_shipment == idtipocarga.id &&
          codeServicesActivos.has(v.code_service);

        if (!matchBasico) return false;

        // Si cumple lo básico, verificamos el contenedor (si aplica)
        if (v.escontenedorflag) return idContainersSet.has(v.id_container);

        return true;
      });

      // 4. MAPEO (flatMap)

      const cDuplicado = cFiltrado.flatMap((item) => {
        const flete = this.obtenerFleteOpcion(item);
        const fleteVenta = this.obtenerFleteOpcionVenta(item);
        const transporte = this.obtenerTransporte(item);
        const costoBaseUnitario = parseFloat(
          esgrupalflag ? 0 : item.costounitario || 0,
        );

        // Objeto base sin cif/seguro, ya que ahora dependen de la fila
        const baseItem = {
          ...item,
          status: true,
          nro_propuesta: 1,
        };

        // Valores calculados según tu nueva regla
        const cifOpcion = esgrupalflag ? 0 : parseFloat(0.35);
        const seguroOpcion = esgrupalflag ? 0 : parseFloat(0.45);
        const cifVenta = esgrupalflag ? 0 : parseFloat(0.35);
        const seguroVenta = esgrupalflag ? 0 : parseFloat(0.45);

        // CASO A: Costos Especiales
        if (COSTOS_ESPECIALES.includes(item.code_cost)) {
          return [
            {
              ...baseItem,
              esopcionflag: 1,
              esventaflag: 0,
              cif: cifOpcion, // <--- Aplicado
              seguro: seguroOpcion, // <--- Aplicado
              costounitario:
                costoBaseUnitario +
                parseFloat(flete.monto || 0) +
                parseFloat(fleteVenta.monto || 0),
              tienefleteflag: false,
              fechavigencia: null,
            },
          ];
        }

        // CASO B: Costos Normales
        let montoprofit = 0;
        if (item.profit_ganancia_pricing?.length > 0) {
          const profitObj = item.profit_ganancia_pricing.find((v) =>
            esindividualflag ? v.esindividualflag : v.esgrupalflag,
          );

          if (profitObj) {
            if (codigoImportacion === "01")
              montoprofit = profitObj.profitprimeraimportacion;
            else if (codigoImportacion === "02")
              montoprofit = profitObj.profitsegundaimportacion;
          }
        }
        if (item.code_cost === "39") {
          return [
            {
              // ITEM COMPRA / OPCIÓN
              ...baseItem,
              esopcionflag: 1,
              esventaflag: 0,
              cif: cifOpcion, // <--- Regla con validación grupal
              seguro: seguroOpcion, // <--- Regla con validación grupal
              costounitario:
                (esgrupalflag
                  ? 0
                  : item.code_cost == 13
                  ? transporte
                  : costoBaseUnitario) + parseFloat(flete.monto || 0),
              tienefleteflag: esgrupalflag ? false : flete.tienefleteflag,
              fechavigencia: esgrupalflag ? null : flete.fechavigencia,
            },
          ];
        }
        return [
          {
            // ITEM COMPRA / OPCIÓN
            ...baseItem,
            esopcionflag: 1,
            esventaflag: 0,
            cif: cifOpcion, // <--- Regla con validación grupal
            seguro: seguroOpcion, // <--- Regla con validación grupal
            costounitario:
              (esgrupalflag
                ? 0
                : item.code_cost == 13
                ? transporte
                : costoBaseUnitario) + parseFloat(flete.monto || 0),
            tienefleteflag: esgrupalflag ? false : flete.tienefleteflag,
            fechavigencia: esgrupalflag ? null : flete.fechavigencia,
          },
          {
            // ITEM VENTA
            ...baseItem,
            esopcionflag: 0,
            esventaflag: 1,
            cif: cifVenta, // <--- Siempre 0.35
            seguro: seguroVenta, // <--- Siempre 0.45
            costounitario:
              item.code_cost == 13
                ? parseFloat(transporte)
                : parseFloat(costoBaseUnitario) +
                  parseFloat(montoprofit || 0) +
                  parseFloat(!esgrupalflag ? flete.monto || 0 : 0) +
                  parseFloat(esgrupalflag ? fleteVenta.monto || 0 : 0),
            tieneprofitflag: parseFloat(montoprofit) > 0,
            tienefleteflag: esindividualflag
              ? flete.tienefleteflag
              : fleteVenta.tienefleteflag,
            fechavigencia: esindividualflag
              ? flete.fechavigencia
              : fleteVenta.fechavigencia,
          },
        ];
      });
      // 5. ASIGNACIÓN FINAL AL STORE
      opcionCostos[0].listCostos = cDuplicado;
      opcionCostos[0].listImpuestos = listImpuestos;
      opcionCostos[0].listNotasQuote = listNotasQuote.filter((v) =>
        esindividualflag
          ? v.individualflag
          : esgrupalflag
          ? v.grupalflag
          : false,
      );

      this.$store.state.spiner = false;

      // 6. CONFIRMACIÓN
      Swal.fire({
        icon: "question",
        title: "Cotizar",
        text: "¿Desea pasar a Cotizar?",
        confirmButtonText: "Pasar a Cotizar",
        denyButtonText: "Guardar Borrador",
        allowEnterKey: false,
        allowOutsideClick: false,
        confirmButtonColor: "green",
        showDenyButton: true,
        allowEscapeKey: false,
        showCloseButton: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.step = 2;
          this.$store.state.pricing.step = 2;
          this.editableStep2 = true;
        } else if (result.isDenied) {
          await this.guardar();
        }
      });
    },
    obtenerFleteOpcion(item) {
      let datoFlete = { monto: 0, tienefleteflag: false, fechavigencia: null };
      if (item.code_cost == 4) {
        if (this.$store.state.pricing.datosPrincipales.esindividualflag) {
          let val = !!this.$store.state.calculadoras.fletePricing.monto_flete;
          datoFlete.monto = val
            ? this.$store.state.calculadoras.fletePricing.monto_flete
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.$store.state.calculadoras.fletePricing.vigencia
            : null;
        }
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.$store.state.calculadoras.fletePricing.monto_flete_grupal;
          datoFlete.monto = val
            ? this.$store.state.calculadoras.fletePricing.monto_flete_grupal
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.$store.state.calculadoras.fletePricing.vigencia_grupal ||
              null
            : null;
        }
      }
      return datoFlete;
    },
    obtenerFleteOpcionVenta(item) {
      let datoFlete = { monto: 0, tienefleteflag: false, fechavigencia: null };
      if (item.code_cost == 7) {
        let val = this.$store.state.pricing.preCostos.find(
          (v) =>
            v.id_incoterms ==
              this.$store.state.pricing.datosPrincipales.idincoterms &&
            v.id_modality ==
              this.$store.state.pricing.datosPrincipales.idsentido &&
            v.id_shipment ==
              this.$store.state.pricing.datosPrincipales.idtipocarga.id &&
            v.code_cost == 4,
        );
        let facMultiplicador = this.formatearCostoTotal(val);
        console.log("facMultiplicador", facMultiplicador);
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.$store.state.calculadoras.fletePricing
              .monto_flete_grupal_venta;
          datoFlete.monto = val
            ? this.$store.state.calculadoras.fletePricing
                .monto_flete_grupal_venta -
              parseFloat(
                this.$store.state.calculadoras.fletePricing.monto_flete_grupal *
                  facMultiplicador,
              )
            : 0;
          // this.formatearCostoTotal()
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.$store.state.calculadoras.fletePricing
                .vigencia_grupal_venta || null
            : null;
        }
      }
      if (item.code_cost == 4) {
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.$store.state.calculadoras.fletePricing.monto_flete_grupal;
          datoFlete.monto = val
            ? this.$store.state.calculadoras.fletePricing.monto_flete_grupal
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.$store.state.calculadoras.fletePricing
                .vigencia_grupal_venta || null
            : null;
        }
      }
      if (datoFlete.monto < 0) {
        datoFlete.monto = 0;
      }
      return datoFlete;
    },
    obtenerTransporte(item) {
      let monto = 0;
      if (item.code_cost == 13) {
        let opcion = this.$store.state.pricing.datosPrincipales.esindividualflag
          ? 1
          : this.$store.state.pricing.datosPrincipales.esgrupalflag
          ? 2
          : 0;

        // Obtener el peso actual y asegurar formato numérico
        let pesoActual =
          parseFloat(this.$store.state.pricing.datosPrincipales.peso) || 0;

        let transporte = this.$store.state.calculadoras.lstTransporte.find(
          (v) =>
            v.id_distrito ==
              this.$store.state.pricing.datosPrincipales.id_town &&
            v.opcion == opcion &&
            pesoActual >= parseFloat(v.peso_desde) &&
            pesoActual <= parseFloat(v.peso_hasta),
        );

        if (transporte) {
          monto = parseFloat(transporte.tarifadolar); // o mantenerlo como string/número según tus necesidades
        }
      }
      return monto;
    },
    async guardar() {
      this.$store.state.spiner = true;

      this.$store.state.pricing.opcionCostos[0].selected = true;
      await this.registrarQuote({ fullflag: false }).catch((err) => {});
      if (this.$store.state.pricing.nro_quote) {
        this.$store.state.spiner = false;
        let vm = this;

        Swal.fire({
          icon: "success",
          title: "Aviso",
          text: vm.$store.state.pricing.mensaje,
          confirmButtonText: "Ir al listado",
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            vm.$router.push({
              name: "lstQuote",
            });
          }
          if (result.isDismissed) {
            vm.$router.push({
              name: "lstQuote",
            });
          }
        });
        let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
          .id_branch;
        let branchCreacion = [1, 2];
        if (branchCreacion.includes(id_branch)) {
          const urlGenerada = await this.crearCarpetaOneDrive({
            nro_quote: this.$store.state.pricing.nro_quote,
            nombre: this.$store.state.pricing.datosPrincipales.nombre,
          });

          if (urlGenerada) {
            await this.actualizarURLEnElQuote({
              id: this.$store.state.pricing.id,
              url: urlGenerada,
            });
          } else {
            console.error(
              "No se obtuvo URL de OneDrive, se saltó la actualización.",
            );
          }
        }
      }
    },
    anadirNuevaOpcion(nro_propuesta) {
      // this.$store.state.spiner = true;
      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );
      let costos = [...this.$store.state.pricing.preCostos];
      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(v.code_service),
      );
      let idContainer = [];
      if (this.$store.state.pricing.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.pricing.datosPrincipales.containers.map(
          (v) => v.id,
        );
      }
      let cFiltrado = c.filter((v) => {
        if (v.escontenedorflag) {
          return idContainer.includes(v.id_container);
        }
        return true;
      });

      let codeCost = [69, 114, 105, 39];

      let cDuplicado = cFiltrado.flatMap((item) => {
        if (codeCost.includes(item.code_cost)) {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.35),
              seguro: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.45),
              costounitario: this.$store.state.pricing.datosPrincipales
                .esgrupalflag
                ? 0
                : item.costounitario,
              nro_propuesta: 1,
            },
          ];
        } else {
          let montoprofit = 0;

          let tipoImportacion =
            this.$store.state.masterusuarios.lstPercepcionAduana.find(
              (v) =>
                v.id ==
                this.$store.state.pricing.datosPrincipales.id_percepcionaduana,
            );
          // OBTENIENDO LOS PROFIT
          if (this.$store.state.pricing.datosPrincipales.esindividualflag) {
            if (tipoImportacion.codigo == "01") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esindividualflag,
              ).profitprimeraimportacion;
            }
            if (tipoImportacion.codigo == "02") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esindividualflag,
              ).profitsegundaimportacion;
            }
          }
          if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
            if (tipoImportacion.codigo == "01") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esgrupalflag,
              ).profitprimeraimportacion;
            }
            if (tipoImportacion.codigo == "02") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esgrupalflag,
              ).profitsegundaimportacion;
            }
          }
          return [
            {
              ...item,
              nro_propuesta: 1,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.35),
              seguro: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.45),
              costounitario: this.$store.state.pricing.datosPrincipales
                .esgrupalflag
                ? 0
                : item.costounitario,
              nro_propuesta: 1,
            },
            {
              ...item,
              nro_propuesta: 1,
              esopcionflag: 0,
              esventaflag: 1,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
              nro_propuesta: 1,
              costounitario:
                parseFloat(
                  this.$store.state.pricing.datosPrincipales.esgrupalflag
                    ? 0
                    : item.costounitario,
                ) + parseFloat(montoprofit),
              tieneprofitflag: parseFloat(montoprofit) > 0,
            },
          ];
        }
      });
      let newPropuesta = {
        nro_propuesta: nro_propuesta,
        date_end: "",
        tiempo_transito: 0,
        listCostos: cDuplicado,
        listImpuestos: this.$store.state.pricing.listImpuestos,
        listNotasQuote: this.$store.state.pricing.listNotasQuote,
      };
      this.$store.state.pricing.opcionCostos.push(newPropuesta);
      this.$store.state.spiner = false;
    },
    async recargarCostos() {
      Promise.all([this.getTipoCostos(), this.getMultiplicador()]);
      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      let c = this.$store.state.pricing.preCostos.filter(
        (v) =>
          v.id_incoterms ===
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ===
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ===
            this.$store.state.pricing.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(v.code_service),
      );
      let idContainer = [];
      if (this.$store.state.pricing.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.pricing.datosPrincipales.containers.map(
          (v) => v.id,
        );
      }

      let cFiltrado = c.filter((v) => {
        if (v.escontenedorflag) {
          return idContainer.includes(v.id_container);
        }
        return true;
      });

      let codeCost = [69, 114, 105, 39];

      let cDuplicado = cFiltrado.flatMap((item) => {
        if (codeCost.includes(item.code_cost)) {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.35),
              seguro: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.45),
              costounitario: this.$store.state.pricing.datosPrincipales
                .esgrupalflag
                ? 0
                : item.costounitario,
              nro_propuesta: 1,
            },
          ];
        } else {
          let montoprofit = 0;

          let tipoImportacion =
            this.$store.state.masterusuarios.lstPercepcionAduana.find(
              (v) =>
                v.id ==
                this.$store.state.pricing.datosPrincipales.id_percepcionaduana,
            );
          // OBTENIENDO LOS PROFIT
          if (this.$store.state.pricing.datosPrincipales.esindividualflag) {
            if (tipoImportacion.codigo == "01") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esindividualflag,
              ).profitprimeraimportacion;
            }
            if (tipoImportacion.codigo == "02") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esindividualflag,
              ).profitsegundaimportacion;
            }
          }
          if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
            if (tipoImportacion.codigo == "01") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esgrupalflag,
              ).profitprimeraimportacion;
            }
            if (tipoImportacion.codigo == "02") {
              montoprofit = item.profit_ganancia_pricing.find(
                (v) => v.esgrupalflag,
              ).profitsegundaimportacion;
            }
          }
          return [
            {
              ...item,
              nro_propuesta: 1,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.35),
              seguro: this.$store.state.pricing.datosPrincipales.esgrupalflag
                ? 0
                : parseFloat(0.45),
              costounitario: this.$store.state.pricing.datosPrincipales
                .esgrupalflag
                ? 0
                : item.costounitario,
              nro_propuesta: 1,
            },
            {
              ...item,
              nro_propuesta: 1,
              esopcionflag: 0,
              esventaflag: 1,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
              nro_propuesta: 1,
              costounitario:
                parseFloat(
                  this.$store.state.pricing.datosPrincipales.esgrupalflag
                    ? 0
                    : item.costounitario,
                ) + parseFloat(montoprofit),
              tieneprofitflag: parseFloat(montoprofit) > 0,
            },
          ];
        }
      });
      this.$store.state.pricing.opcionCostos =
        this.$store.state.pricing.opcionCostos.slice(0, 1);
      this.$store.state.pricing.index = 0;
      this.$store.state.pricing.opcionCostos[0].listCostos = cDuplicado;
      this.$store.state.pricing.opcionCostos[0].listImpuestos =
        this.$store.state.pricing.listImpuestos;
      this.$store.state.pricing.opcionCostos[0].listNotasQuote =
        this.$store.state.pricing.listNotasQuote;

      this.$store.state.pricing.llenadoCostos = true;
      this.$forceUpdate();
      this.indexCostos++;
    },
    irVentaCliente() {
      this.step = 2;
      this.$store.state.pricing.step = 2;
    },
    irANotas() {
      this.step = 4;
      this.$store.state.pricing.step = 4;
      this.editableStep4 = true;
      this.$store.state.pricing.btnRegistrar = true;
    },
    triggerExcel() {
      if (this.$refs.excelInput) this.$refs.excelInput.click();
    },
    async onExcelSelected(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      this.$store.state.spiner = true;
      try {
        const rows = await readXlsFile(file);
        const { actualizados } = this.cargarDesdeExcelDatosPrincipales(rows);
        Swal.fire({
          icon: "success",
          title: "Excel cargado",
          text: `Se actualizaron ${actualizados} campos de la cotización.`,
        });
        await this.ensurePreliminarStatus();
        await this.getQuoteStatus();
        await this.setDefaultStatusPreliminar();
        await this.emitirPreliminarAuto();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo leer el archivo Excel.",
        });
      } finally {
        this.$store.state.spiner = false;
        e.target.value = null;
      }
    },
    cargarDesdeExcelDatosPrincipales(rows) {
      if (!Array.isArray(rows) || rows.length < 2) return { actualizados: 0 };
      const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());
      const headers = rows[0].map((h) => norm(h));
      const findIdx = (...names) => {
        const targets = names.map((n) => norm(n));
        for (let i = 0; i < headers.length; i++) {
          const h = headers[i];
          if (targets.some((t) => h === t || h.includes(t))) return i;
        }
        return -1;
      };
      const row =
        rows.slice(1).find((r) => (r || []).some((v) => norm(v) !== "")) ||
        rows[1];
      let cambios = 0;
      const sp = this.$store.state.pricing;

      const idxMarketing = findIdx("marketing", "tipo de marketing");
      const idxStatus = findIdx(
        "status",
        "estado",
        "estado de la cotizacion",
        "estado de la cotización",
      );
      const idxEjecutivo = findIdx("ejecutivo", "vendedor");
      const idxPricing = findIdx("pricing", "analista pricing");
      const idxCliente = findIdx(
        "cliente",
        "nombre cliente",
        "razon social",
        "razón social",
      );
      const idxTelefono = findIdx("telefono", "teléfono");
      const idxSentido = findIdx("sentido", "modality", "modalidad");
      const idxShipment = findIdx("tipo de embarque", "embarque", "shipment");
      const idxIncoterms = findIdx("incoterms", "incoterm");
      const idxProveedor = findIdx("proveedor", "nombre proveedor");
      const idxTelProveedor = findIdx(
        "telefono proveedor",
        "teléfono proveedor",
      );
      const idxDirProveedor = findIdx(
        "direccion proveedor",
        "dirección proveedor",
      );

      if (idxMarketing > -1) {
        const val = norm(row[idxMarketing]);
        const it = (sp.listMarketing || []).find((x) => norm(x.name) === val);
        if (it) {
          sp.datosPrincipales.id_marketing = it.id;
          cambios++;
        }
      }
      if (idxStatus > -1) {
        const val = norm(row[idxStatus]);
        const it = (sp.listQuoteStatus || []).find((x) => norm(x.name) === val);
        if (it) {
          sp.datosPrincipales.id_status = it.id;
          cambios++;
        }
      }
      if (idxEjecutivo > -1) {
        const val = norm(row[idxEjecutivo]);
        const it = (sp.listEjecutivo || []).find(
          (x) => norm(x.nombrecompleto) === val,
        );
        if (it) {
          sp.datosPrincipales.id_vendedor = it.id;
          cambios++;
        }
      }
      if (idxPricing > -1) {
        const val = norm(row[idxPricing]);
        const it = (sp.listEjecutivo || []).find(
          (x) => norm(x.nombrecompleto) === val,
        );
        if (it) {
          sp.datosPrincipales.id_pricing = it.id;
          cambios++;
        }
      }
      if (idxCliente > -1) {
        const val = row[idxCliente];
        if (norm(val) !== "") {
          sp.datosPrincipales.nombre = String(val);
          cambios++;
        }
      }
      if (idxTelefono > -1) {
        const val = row[idxTelefono];
        if (norm(val) !== "") {
          sp.datosPrincipales.telefono = String(val);
          cambios++;
        }
      }
      if (idxSentido > -1) {
        const val = norm(row[idxSentido]);
        const it = (sp.listModality || []).find(
          (x) =>
            norm(x.name) === val ||
            norm(x.name).includes(val) ||
            val.includes(norm(x.name)),
        );
        if (it) {
          sp.datosPrincipales.idsentido = it.id;
          cambios++;
        }
      }
      if (idxShipment > -1) {
        const val = norm(row[idxShipment]);
        const it = (sp.listShipment || []).find(
          (x) =>
            norm(x.embarque) === val ||
            norm(x.embarque).includes(val) ||
            val.includes(norm(x.embarque)),
        );
        if (it) {
          sp.datosPrincipales.idtipocarga = it;
          cambios++;
        }
      }
      if (idxIncoterms > -1) {
        const val = norm(row[idxIncoterms]);
        const it = (sp.listIncoterms || []).find(
          (x) => norm(x.name) === val || norm(x.text || "") === val,
        );
        if (it) {
          sp.datosPrincipales.idincoterms = it.id;
          cambios++;
        }
      }
      if (idxProveedor > -1) {
        const val = row[idxProveedor];
        if (norm(val) !== "") {
          sp.datosPrincipales.proveedor = String(val);
          cambios++;
        }
      }
      if (idxTelProveedor > -1) {
        const val = row[idxTelProveedor];
        if (norm(val) !== "") {
          sp.datosPrincipales.telefonoproveedor = String(val);
          cambios++;
        }
      }
      if (idxDirProveedor > -1) {
        const val = row[idxDirProveedor];
        if (norm(val) !== "") {
          sp.datosPrincipales.direccionproveedor = String(val);
          cambios++;
        }
      }
      return { actualizados: cambios };
    },
    async ensurePreliminarStatus() {
      const estados = this.$store.state.pricing.listQuoteStatus || [];
      const existe = estados.some(
        (e) =>
          typeof e.name === "string" &&
          e.name.toLowerCase().includes("preliminar"),
      );
      if (existe) return;
      // await this.createPreliminarStatus();
    },
    async createPreliminarStatus() {
      try {
        await this.$store.dispatch("MaxPositionQuoteStatus");
        const max = this.$store.state.QuoteStatus;
        const id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
          .id_branch;
        this.$store.state.QuoteStatus.StatusModel = {
          id: "",
          name: "PRELIMINAR",
          code: "",
          position: (max.max_position || 0) + 1,
          position_select: (max.max_position_select || 0) + 1,
          position_report: (max.max_position_report || 0) + 1,
          position_calls: (max.max_position_calls || 0) + 1,
          status_calls: 0,
          status_calls_all: 0,
          description: "Cotización preliminar",
          status: 1,
          id_branch,
        };
        await this.$store.dispatch("setQuoteStatus");
      } catch (e) {}
    },
    setDefaultStatusPreliminar() {
      const estados = this.$store.state.pricing.listQuoteStatus || [];
      if (!Array.isArray(estados) || estados.length === 0) return;
      const prelim = estados.find(
        (e) =>
          typeof e.name === "string" &&
          e.name.toLowerCase().includes("preliminar") &&
          e.status == 1,
      );
      if (prelim) {
        this.$store.state.pricing.datosPrincipales.id_status = prelim.id;
        return;
      }
      const activo = estados.find((e) => e.status == 1) || estados[0];
      if (activo) {
        this.$store.state.pricing.datosPrincipales.id_status = activo.id;
      }
    },
    async emitirPreliminarAuto() {
      this.$store.state.pricing.opcionCostos[0].selected = true;
      try {
        await this.registrarQuote({ fullflag: false });
        Swal.fire({
          icon: "success",
          title: "Preliminar emitida",
          text: "La cotización preliminar fue registrada automáticamente.",
        });
      } catch (err) {}
    },
    recargarGrupalFlag() {
      this.mostrarCostos = false;
      setTimeout(async () => {
        this.mostrarCostos = true;
      }, 200);
    },
    formatearCostoTotal(valor) {
      // 1. Desestructuración de los estados del Vuex para escribir menos y más limpio
      const { listMultiplicador, datosPrincipales } = this.$store.state.pricing;
      const multiplicadores = listMultiplicador || [];

      // 2. Buscamos el multiplicador correspondiente UNA SOLA VEZ
      const multEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      // 3. Extraemos las variables con valores por defecto si no existe el multiplicador
      const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
      const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

      // 4. Ejecutamos la función calcularFac pasándole los datos de pricing
      const factorCalculado = this.calcularFac(
        codigoMultiplicador,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      );

      return factorCalculado;
    },
  },
  computed: {
    // ...mapState(["preServices", "preCostos"]),
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
