<template>
  <v-container fluid>
    <v-row v-if="lstPricing">
      <v-col cols="12" lg="4" xl="4">
        <v-text-field
          placeholder="Buscar..."
          label="Buscar"
          v-model="search"
          append-icon="mdi-magnify"
        >
        </v-text-field>
      </v-col>
      <v-col cols="12" lg="8" xl="8">
        <div class="text-right">
          <v-btn
            color="red"
            @click="reporteListado()"
            class="mx-1 my-1"
            :loading="loading2"
            :disabled="loading2"
            :dark="!loading2"
            small
          >
            <v-icon>mdi-file-pdf-box</v-icon> REPORTE
          </v-btn>
          <v-btn
            color="teal darken-4"
            @click="excelListadoQuote()"
            class="mx-1 my-1"
            :loading="loading3"
            :disabled="loading3"
            :dark="!loading3"
            small
          >
            <v-icon>mdi-file-excel</v-icon> REPORTE
          </v-btn>
          <v-btn
            color="red"
            @click="imprimirListMercadeo()"
            class="mx-1 my-1"
            :loading="loading"
            :disabled="loading"
            :dark="!loading"
            small
          >
            <v-icon>mdi-file-pdf-box</v-icon> MERCADEO
          </v-btn>
          <v-btn
            color="info"
            @click="
              $store.state.pricing.filtrarQuoteFlag =
                !$store.state.pricing.filtrarQuoteFlag
            "
            class="mx-1 my-1"
            dark
            small
          >
            Filtrar
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-data-table
      :search="search"
      :headers="cabCotizaciones"
      :items="$store.state.pricing.listQuotes"
      :single-expand="singleExpand"
      :expanded.sync="expanded"
      item-key="index"
      show-expand
      class="elevation-1"
      disable-sort
    >
      <template v-slot:item="{ item, expand, isExpanded }">
        <tr
          :class="[
            item.aprobadoflag || item.status_code == 4
              ? 't-green-approved'
              : item.status_code == 3 ||
                (item.status &&
                  item.status
                    .toString()
                    .toLowerCase()
                    .includes('COTIZANDO SEGURO'))
              ? 't-red'
              : item.status_code == 5
              ? 't-green'
              : 't-black',
            isExpanded ? 'filaActivda' : '',
          ]"
        >
          <!-- <td></td> -->
          <td>
            <v-btn-toggle>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    x-small
                    v-on="on"
                    v-bind="attrs"
                    @click="ira('verQuote', item.id)"
                  >
                    <v-icon color="#4A148C" dense small>mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    x-small
                    fab
                    v-on="on"
                    v-bind="attrs"
                    @click="handleEditar(item)"
                    v-if="item.statusmain != 0"
                  >
                    <v-icon color="#FB9514" dense small>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Editar</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    v-bind="attrs"
                    v-on="on"
                    x-small
                    @click="abrirModal(item)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon color="#E65100" dense small
                      >mdi-receipt-text-send-outline</v-icon
                    >
                  </v-btn>
                </template>
                <span>Actualizar Estado Cotización</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    v-bind="attrs"
                    v-on="on"
                    x-small
                    @click="registrarLlamada(item.id)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon color="#1A237E" dense small>mdi-phone-plus</v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Registro Llamada</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    @click="eliminar(item.id, item.codigo)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon color="#A43542" dense small>mdi-delete</v-icon>
                  </v-btn>
                </template>
                <span>Eliminar</span>
              </v-tooltip>
            </v-btn-toggle>
            <v-btn-toggle>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    @click="abrirCaperta(item)"
                  >
                    <v-icon color="#FFAB00" dense small>mdi-folder</v-icon>
                  </v-btn>
                </template>
                <span>Abrir Carpeta cotización</span>
              </v-tooltip>
              <!--  -->

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    @click="toggleRow(item)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon color="#263238" dense small>mdi-phone</v-icon>
                  </v-btn>
                </template>
                <span>Historial llamada</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    fab
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    @click="abrirModalEnlazarHouse(item)"
                    color="success"
                  >
                    <v-icon dense small>mdi-link</v-icon>
                  </v-btn>
                </template>
                <span>Enlazar a House</span>
              </v-tooltip>
            </v-btn-toggle>
          </td>
          <td @click="expand(!isExpanded)">{{ fecha(item.created) }}</td>
          <td @click="expand(!isExpanded)">{{ item.recibidocotizacion }}</td>
          <td @click="expand(!isExpanded)">{{ item.enviadocliente }}</td>
          <td @click="expand(!isExpanded)">{{ item.status }}</td>
          <td @click="expand(!isExpanded)">{{ item.codigo }}</td>
          <td @click="expand(!isExpanded)">{{ item.pricing }}</td>
          <td @click="expand(!isExpanded)">{{ item.ejecutivo_ventas }}</td>
          <td @click="expand(!isExpanded)">{{ item.nombres }}</td>
          <td @click="expand(!isExpanded)">{{ item.telefono }}</td>
          <td @click="expand(!isExpanded)">{{ item.sentido }}</td>
          <td @click="expand(!isExpanded)">{{ item.tipo_de_carga }}</td>
          <td @click="expand(!isExpanded)">{{ item.incoterms }}</td>
          <td @click="expand(!isExpanded)">{{ item.origen }}</td>
          <td @click="expand(!isExpanded)">{{ item.destino }}</td>
          <td @click="expand(!isExpanded)">{{ displayMarketing(item) }}</td>
          <td @click="expand(!isExpanded)">{{ item.fechaemisionpdf }}</td>
        </tr>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <v-simple-table>
            <thead class="headerDetails">
              <tr>
                <th v-if="item.details.length > 0">Notas</th>
                <th v-if="item.details.length > 0">Pricing Call</th>
                <th>Fecha Enviado Al Cliente</th>
              </tr>
            </thead>
            <tbody v-if="item.details.length > 0">
              <tr v-for="i in item.details" :key="i">
                <td>{{ i.notes }}</td>
                <td>{{ i.namelong }}</td>
                <td>{{ item.fecha_enviocliente }}</td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td>{{ item.fecha_enviocliente }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </td>
      </template>
    </v-data-table>
    <!-- <template>
      <div class="text-center">
        <v-pagination
          v-model="$store.state.pricing.pagina"
          :total-visible="7"
          :length="$store.state.pricing.totalregistro"
          circle
          @input="cambiarPagina()"
        ></v-pagination>
      </div>
    </template> -->
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Actualizar Recibido / Enviado
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEstado">
            <v-select
              auto-select-first
              :items="
                $store.state.pricing.listQuoteStatus.filter((v) => v.id != 1)
              "
              label="ESTADO DE LA COTIZACIÓN"
              v-model="id_status"
              :rules="[(v) => !!v || 'Dato Requerido']"
              item-text="name"
              item-value="id"
            ></v-select>
            <v-select
              :items="$store.state.pricing.listRecibidoCotizacion"
              item-value="id"
              item-text="descripcion"
              v-model="id_master_recibidocotizacion"
              label="RECIBIDO COTIZACION EN PRICING"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-select>
            <v-select
              :items="$store.state.pricing.listEnviadoCliente"
              item-value="id"
              item-text="descripcion"
              v-model="id_master_enviadocliente"
              label="ENVIADO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
            >
            </v-select>
            <v-text-field
              type="date"
              label="FECHA DE ENVÍO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-if="
                $store.state.pricing.listEnviadoCliente.filter(
                  (v) => v.id == id_master_enviadocliente && v.codigo == 'SE',
                ).length > 0
              "
              v-model="fecha_enviocliente"
            ></v-text-field>
            <v-text-field
              label="COMENTARIO"
              v-model="comentario"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="updateQuoteRecibidoEnviado"
            >Guardar</v-btn
          >
          <v-btn color="red" dark @click="dialog = !dialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogRegistroNotaLlamada"
      v-if="dialogRegistroNotaLlamada"
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          <span class="headline">Detalle de Nota de llamada</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="detallenota">
            <v-text-field
              v-model="fromData.date"
              readonly
              type="date"
            ></v-text-field>
            <v-text-field
              v-model="fromData.descripcion"
              :rules="[(v) => !!v || 'El dato es requerido']"
              label="Descripcion"
            >
            </v-text-field>
            <v-autocomplete
              :items="$store.state.pricing.listEjecutivo"
              label="Ejecutivo."
              dense
              search
              clearable
              item-text="name"
              item-value="id_entitie"
              v-model="fromData.identities"
            ></v-autocomplete>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-flex text-right>
            <v-btn text color="success" @click="guardarNota">Aceptar</v-btn>
            <v-btn
              text
              color="red"
              @click="dialogRegistroNotaLlamada = !dialogRegistroNotaLlamada"
            >
              Cancelar
            </v-btn>
          </v-flex>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="aprobarflag"
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="aprobarflag = !aprobarflag">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAprobar">
            <v-row>
              <v-autocomplete
                :items="$store.state.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-text="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
              >
              </v-autocomplete>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1 my-1" small @click="aprobar()" color="success"
            >Generar</v-btn
          >
          <v-btn
            class="mx-1 my-1"
            small
            color="error"
            @click="aprobarflag = !aprobarflag"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal para enlazar Houses -->
    <v-dialog v-model="modalEnlazarHouse" max-width="900">
      <v-card>
        <v-card-title>
          Enlazar Houses a Cotización
          {{ quoteSeleccionada ? quoteSeleccionada.codigo : "" }}
          <v-spacer></v-spacer>
          <v-btn icon @click="modalEnlazarHouse = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersHouses"
            :items="housesDisponibles"
            :loading="loadingHouses"
            class="elevation-1"
          >
            <template v-slot:[`item.actions`]="{ item }">
              <v-btn small color="primary" @click="enlazarHouse(item)">
                Enlazar
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Modal abrir y/o editar url -->

    <GuardarUrlPricing
      :dialogUrl="dialogUrl"
      :masterEditar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </v-container>
</template>

<script>
import moment from "moment";
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/axios-config";
import GuardarUrlPricing from "../comun/GuardarUrlPricing.vue";
export default {
  components: {
    GuardarUrlPricing,
  },
  name: "ListQuoteComponent",
  data() {
    return {
      typingTimer: null,
      page: 1,
      limit: 10,
      dialogUrl: false,
      url_folderonedrive: "",
      search: "",
      masterEditar: {},
      statusDialog: false,
      quoteEditar: {
        url_folderonedrive: "",
      },
      url_folderonedrive: null,
      lstPricing: true,
      id_status: null,
      comentario: "",
      search: "",
      dialogRegistroNotaLlamada: false,
      expanded: [],
      singleExpand: false,
      loading: false,
      loading2: false,
      loading3: false,
      dialog: false,
      fromData: {
        date: moment().format("YYYY-MM-DD"),
        descripcion: "",
        identities: JSON.parse(sessionStorage.getItem("dataUser"))
          ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
          : "",
      },
      aprobarflag: false,
      modalEnlazarHouse: false,
      housesDisponibles: [],
      loadingHouses: false,
      quoteSeleccionada: null,
      headersHouses: [
        { text: "Código House", value: "codigo" },
        { text: "Master", value: "master" },
        { text: "Cliente", value: "cliente" },
        { text: "Origen", value: "origen" },
        { text: "Destino", value: "destino" },
        { text: "Acciones", value: "actions", sortable: false },
      ],
      cabCotizaciones: [
        // {
        //   value: "acciones",
        //   text: "",
        //   align: "center",
        //   groupable: true,
        //   estado: true,
        // },
        {
          value: "created",
          text: "FECHA REGISTRO",
          align: "center",
          groupable: true,
          estado: true,
          dataType: "Date",
        },
        {
          value: "recibidocotizacion",
          text: "RECIBIDO COTIZACION EN PRICING",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "enviadocliente",
          text: "ENVIADO AL CLIENTE",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "status",
          text: "ESTATUS",
          align: "center",
          groupable: true,
          estado: true,
        },

        {
          value: "codigo",
          text: "CÓD.",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "pricing",
          text: "EJECUTIVO PRICING",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "ejecutivo_ventas",
          text: "EJECUTIVO VENTAS",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "nombres",
          text: "CLIENTE",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "telefono",
          text: "TÉLEFONO",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "sentido",
          text: "SENTIDO",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "tipo_de_carga",
          text: "TIPO DE CARGA",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "incoterms",
          text: "INCOTERMS",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "origen",
          text: "ORIGEN",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "destino",
          text: "DESTINO",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "marketing",
          text: "MARKETING",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "fechaemisionpdf",
          text: "Fecha Emision",
          align: "center",
        },
      ],
      // filtro: {
      //   idmarketing: null,
      //   idstatus: null,
      //   identities: null,
      //   idmodality: null,
      //   idshipment: null,
      //   idincoterm: null,
      //   fechainicio: null,
      //   fechafin: null,
      //   estado: "activo",
      // },
      quote: null,
      id_master_recibidocotizacion: "",
      id_master_enviadocliente: "",
      fecha_enviocliente: "",
      nuevoexpediente: true,
      id_exp: "",
    };
  },
  methods: {
    ...mapActions([
      "getListQuote",
      "imprimiReporteListado",
      "exportarExcelListadoQuote",
      "imprimirMercadeo",
      "actualizarQuoteRecibidoEnviado",
      "getListRecibidoCotizacion",
      "getListEnviadoCliente",
      "getModulesEntities",
      "getMarketingList",
      "guardarNotaQuote",
      "eliminarRegistro",
      "getQuoteStatus",
      "cargarMaster",
      "aprobarCotizacion",
      "validarUsuarioAdmin",
      "actualizarURLEnElQuote",
    ]),
    async cambiarPagina() {
      this.$store.state.spiner = true;
      await this.getListQuote();
      this.$store.state.spiner = false;
    },
    displayMarketing(item) {
      // Prefer server-provided friendly name if present
      if (item.marketing) return item.marketing;
      const id = item.id_marketing || item.idmarketing || item.idMarketing;
      if (!id) return "";
      const m = (this.$store.state.pricing.listMarketing || []).find(
        (v) => String(v.id) === String(id),
      );
      return m ? m.name : "";
    },
    esItemAprobado(item) {
      // Verificar por aprobadoflag
      if (item.aprobadoflag === true) return true;

      const statusName = (item.status || "").toString().toUpperCase().trim();
      if (statusName === "APROBADO" || statusName === "APROBADA") return true;

      return false;
    },
    esUsuarioAdmin() {
      try {
        const dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
        if (dataUser && dataUser[0]) {
          const userEmail = dataUser[0].user || dataUser[0].usuario || "";
          return userEmail.toLowerCase() === "cmrg1979a@gmail.com";
        }
      } catch (e) {
        console.error("Error al verificar usuario admin:", e);
      }
      return false;
    },
    handleEditar(item) {
      if (this.esItemAprobado(item)) {
        if (this.esUsuarioAdmin()) {
          this.ira("editQuote", item.id);
        } else {
          this.iraAprobado(item.id);
        }
      } else {
        this.ira("editQuote", item.id);
      }
    },
    async iraAprobado(id) {
      let val = false;
      let msg = "";

      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        focusConfirm: false,
        didOpen: () => {
          // Aquí forzamos el foco manualmente
          document.getElementById("swal-input1").focus();
        },
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value;
          const input2 = document.getElementById("swal-input2").value;

          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }

          return {
            usuario: input1,
            clave: input2,
          };
        },
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const res = await this.validarUsuarioAdmin(result.value);
          val = res.estadoflag === true;
          msg = res.mensaje;
        }
      });

      if (!val) {
        if (msg) {
          await Swal.fire({ icon: "error", text: msg });
        }
        return;
      }
      this.$router.push({
        name: "editQuote",
        params: {
          id: id,
        },
      });
    },
    fecha(fecha) {
      moment.locale("es");
      let newFecha = moment(fecha).format("YYYY-MMM-DD HH:mm");
      return newFecha;
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    toggleRow(item) {
      const isExpanded = this.expanded.includes(item);
      if (isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    to_direct({ url }) {
      window.open(url, "_blank");
    },
    abrirCaperta(item) {
      console.log("item:", item);
      this.masterEditar = { ...item };
      this.url_folderonedrive = "";
      this.dialogUrl = true;
      // window.open(url, "_blank");
    },
    async cerrarDialog() {
      console.log("llegó");
      this.dialogUrl = false;
      this.$store.state.spiner = true;
      await this.getListQuote();
      this.$store.state.spiner = false;
    },
    async reporteListado() {
      this.loading2 = true;
      await this.imprimiReporteListado(this.filtro).catch((e) => {
        console.log(e);
      });
      this.loading2 = false;
    },
    async excelListadoQuote() {
      this.loading3 = true;
      await this.exportarExcelListadoQuote(this.filtro).catch((e) => {
        console.log(e);
      });
      this.loading3 = false;
    },
    async imprimirListMercadeo() {
      this.loading = true;
      await this.imprimirMercadeo().catch((e) => {
        console.log(e);
      });
      this.loading = false;
    },
    abrirModal(quote) {
      this.quote = quote;
      this.id_master_recibidocotizacion = quote.id_master_recibidocotizacion;
      this.id_master_enviadocliente = quote.id_master_enviadocliente;
      this.fecha_enviocliente = quote.fecha_enviocliente;
      this.dialog = true;
    },
    async updateQuoteRecibidoEnviado() {
      if (this.$refs.frmEstado.validate()) {
        this.$store.state.spiner = true;
        let data = {
          id: this.quote.id,
          id_master_recibidocotizacion: this.id_master_recibidocotizacion,
          id_master_enviadocliente: this.id_master_enviadocliente,
          fecha_enviocliente: this.fecha_enviocliente,
          id_status: this.id_status,
          comentario: this.comentario,
          id_pricing: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
        };
        await this.actualizarQuoteRecibidoEnviado(data);
        await this.getListQuote();
        this.dialog = false;
        this.$store.state.spiner = false;
        this.$refs.frmEstado.reset();
      }
    },
    registrarLlamada(id) {
      this.fromData = {
        date: moment().format("YYYY-MM-DD"),
        descripcion: "",
        identities: JSON.parse(sessionStorage.getItem("dataUser"))
          ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
          : "",
      };
      this.$store.state.pricing.id = id;
      this.dialogRegistroNotaLlamada = true;
    },
    async guardarNota() {
      if (this.$refs.detallenota.validate()) {
        this.dialogRegistroNotaLlamada = false;
        this.$store.state.spiner = true;

        let data = {
          id_quote: this.$store.state.pricing.id,
          id_operador: this.fromData.identities,
          comentario: this.fromData.descripcion,
          fecha: this.fromData.date,
        };

        await this.guardarNotaQuote(data).catch((err) => {
          console.log(err);
        });
        await this.getListQuote().catch((err) => {
          console.log(err);
        });

        this.$store.state.spiner = false;
      }
    },

    abrirModalAprobar({ item: item }) {
      this.quote = item;
      this.nuevoexpediente = true;
      this.id_exp = "";
      let vm = this;
      Swal.fire({
        icon: "question",
        iconColor: "red",
        text: "¿Desea crear un nuevo expediente o seleccionar uno registrado?",
        showConfirmButton: true,
        confirmButtonText: "CREAR NUEVO EXPEDIENTE",
        showDenyButton: true,
        denyButtonText: "SELECCIONAR EXPEDIENTE",
        showCancelButton: true,
        cancelButtonText: "CERRAR",
        allowOutsideClick: false,
      }).then(async (res) => {
        if (res.isConfirmed) {
          Swal.fire({
            icon: "warning",
            title: "Fecha de Validez de la Cotización",
            html: '<input type="date" id="swal-input1" class="swal2-input">',
            allowOutsideClick: false,
            confirmButtonText: "ACEPTAR",
            showCancelButton: true,
            cancelButtonText: "CANCELAR",
            preConfirm: () => {
              const dateInput = document.getElementById("swal-input1").value;
              if (!dateInput) {
                Swal.showValidationMessage("La fecha de validez es requerida");
              } else {
                const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                const currentDate = moment(); // Obtiene la fecha actual

                if (selectedDate.isSameOrBefore(currentDate)) {
                  Swal.showValidationMessage(
                    "La fecha debe ser mayor que la fecha actual",
                  );
                } else {
                  return dateInput;
                }
              }
            },
          }).then(async (res) => {
            this.fecha_validez = res.value;
            if (res.isConfirmed) {
              Swal.fire({
                icon: "info",
                title: "Aprobando Cotizacion",
                timerProgressBar: true,
                allowOutsideClick: false,
                timer: null,
                didOpen: () => {
                  Swal.showLoading();
                },
              });
              await vm.aprobarCotizacion({
                id_quote: vm.quote.id,
                nuevoexpediente: true,
                id_exp: vm.id_exp,
                fecha_validez: this.fecha_validez,
              });
              this.$store.state.spiner = true;
              await this.getListQuote();
              this.$store.state.spiner = false;
            }
          });
        }
        if (res.isDenied) {
          vm.nuevoexpediente = false;
          vm.aprobarflag = true;
        }
      });
    },

    async aprobar() {
      if (this.$refs.frmAprobar.validate()) {
        Swal.fire({
          icon: "info",
          title: "Aprobando Cotizacion",
          timerProgressBar: true,
          allowOutsideClick: false,
          timer: null,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await this.aprobarCotizacion({
          id_quote: this.quote.id,
          nuevoexpediente: this.nuevoexpediente,
          id_exp: this.id_exp,
          fecha_validez: this.fecha_validez,
        });
        this.$store.state.spiner = true;
        await this.getListQuote();
        this.aprobarflag = false;
        this.$store.state.spiner = false;
      }
    },

    ira(ruta, id) {
      this.$router.push({
        name: ruta,
        params: {
          id: id,
        },
      });
      // setTimeout(() => {
      //   window.location.reload();
      // }, 100);
    },

    async eliminar(id, codigo) {
      let vm = this;
      Swal.fire({
        title: "ADVERTENCIA",
        text: "DESEA ELIMINAR LA COTIZACIÓN CON CÓDIGO: " + codigo,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ACEPTAR",
        cancelButtonText: "CANCELAR",
        reverseButtons: false,
      }).then(async (result) => {
        if (result.isConfirmed) {
          vm.eliminarRegistro(id);
          Swal.fire(
            "ELIMINADO!",
            "COTIZACIÓN " + codigo + " ELIMINADA CON ÉXITO",
            "success",
          );
          this.lstPricing = false;
          await vm.getListQuote().catch((err) => {
            console.log(err);
          });
          this.lstPricing = true;
        }
      });
    },
    async abrirModalEnlazarHouse(quote) {
      this.quoteSeleccionada = quote;
      this.modalEnlazarHouse = true;
      this.loadingHouses = true;
      try {
        const id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
          .id_branch;
        const response = await axios.get(
          process.env.VUE_APP_URL_MAIN + "listado_houses",
          {
            params: {
              id_branch,
            },
            headers: {},
          },
        );
        console.log("✅ Houses disponibles:", response.data);
        const allHouses = response.data.data || [];
        const housesFiltrados = allHouses.filter(
          (house) =>
            !house.id_cot || house.id_cot === 0 || house.id_cot === "0",
        );

        // Mapear los campos del backend a los que espera el frontend
        this.housesDisponibles = housesFiltrados.map((house) => ({
          id: house.id,
          codigo: house.code_house || house.code_master || "N/A",
          master: house.nro_house || house.nro_hbl || "N/A",
          cliente: house.nameconsigner || "Sin cliente",
          origen: house.nameportbegin || "N/A",
          destino: house.nameportend || "N/A",
        }));
        sessionStorage.setItem("auth-token", response.data.token);
      } catch (error) {
        console.error("❌ Error al cargar houses:", error);
        this.$swal({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los Houses disponibles",
        });
      } finally {
        this.loadingHouses = false;
      }
    },
    async enlazarHouse(house) {
      const result = await this.$swal({
        title: "¿Confirmar enlace?",
        text: `¿Desea enlazar el House ${house.codigo} a la cotización ${this.quoteSeleccionada.codigo}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, enlazar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;

      try {
        const response = await axios.post(
          process.env.VUE_APP_URL_MAIN + "link_house_quote",
          {
            id_house: house.id,
            id_quote: this.quoteSeleccionada.id,
          },
          {
            headers: {},
          },
        );

        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.statusBol) {
          this.$swal({
            icon: "success",
            title: "Éxito",
            text: "House enlazado exitosamente a la cotización",
          });
          this.modalEnlazarHouse = false;
          // Recargar la lista de houses disponibles si se quiere seguir enlazando
          // this.abrirModalEnlazarHouse(this.quoteSeleccionada);
        }
      } catch (error) {
        console.error("❌ Error al enlazar house:", error);
        this.$swal({
          icon: "error",
          title: "Error",
          text: "No se pudo enlazar el House a la cotización",
        });
      }
    },
  },
  async mounted() {
    this.$store.state.mainTitle = "LISTADO DE COTIZACIONES";

    this.$store.state.pricing.filtroCalls = {
      id_marketing: "",
      id_status: "",
      id_entities: "",
      id_modality: "",
      id_shipment: "",
      id_incoterm: "",
      fechainicio: "",
      fechafin: "",
      estado: "activo",
    };
    this.$store.state.spiner = true;
    await this.getListQuote();
    await Promise.all([
      this.getListRecibidoCotizacion(),
      this.getListEnviadoCliente(),
      this.getModulesEntities(),
      this.getQuoteStatus(),
      this.getMarketingList(),
    ]);
    // await this.cargarMaster({
    //   idsentido: "",
    //   idtipocarga: "",
    //   idincoterms: "",
    // });
    this.$store.state.spiner = false;
  },
  watch: {
    async "$store.state.pricing.search"() {
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }
      this.typingTimer = setTimeout(async () => {
        this.$store.state.spiner = true;
        await this.getListQuote();
        this.$store.state.spiner = false;
      }, 500);
    },
  },
};
</script>

<style scoped>
.headerDetails {
  color: #000 !important;
  background: #80deea !important;
}
.t-red {
  color: red;
}
.t-green {
  color: green;
}
.t-green-approved {
  background-color: #c8e6c9 !important;
  color: #2e7d32 !important;
  font-weight: 500;
}
.t-black {
  color: #000;
}
.filaActivda {
  background: #0097a7;
}
/* #create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
} */
</style>

<!--  -->
