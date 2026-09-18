<template>
  <v-container fluid>
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
    <v-row>
      <v-col cols="12" class="mt-3 clsFiltro">
        <v-row>
          <v-col cols="6" class="py-1">
            <v-row>
              <v-col cols="4" class="clsFechaPor">
                <v-text-field
                  value="Fecha Creación"
                  label="Fecha Por"
                  readonly
                  hide-details
                  dense
                  outlined
                  prepend-icon="mdi-calendar-month"
                ></v-text-field>
              </v-col>

              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :value="
                    formatearFecha($store.state.pricing.filtroCalls.fechainicio)
                  "
                  dense
                  readonly
                  hide-details
                  outlined
                  label="Desde"
                  id="frmFechaDesde"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :value="
                    formatearFecha($store.state.pricing.filtroCalls.fechafin)
                  "
                  dense
                  readonly
                  hide-details
                  outlined
                  label="Hasta"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="6"
            class="py-1"
            v-if="
              $store.state.pricing.filtroCalls.fechaemisiondesde ||
              $store.state.pricing.filtroCalls.fechaemisionhasta
            "
          >
            <v-row>
              <v-col cols="4" class="clsFechaPor">
                <v-text-field
                  value="Fecha Envíado"
                  label="Fecha Por"
                  readonly
                  hide-details
                  outlined
                  dense
                  prepend-icon="mdi-calendar-month"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :value="
                    formatearFecha(
                      $store.state.pricing.filtroCalls.fechaemisiondesde,
                    )
                  "
                  dense
                  readonly
                  hide-details
                  outlined
                  label="Desde"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :value="
                    formatearFecha(
                      $store.state.pricing.filtroCalls.fechaemisionhasta,
                    )
                  "
                  dense
                  readonly
                  hide-details
                  outlined
                  label="Hasta"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-col>

          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_marketing"
          >
            <v-autocomplete
              :items="$store.state.pricing.listMarketing"
              label="Tipo de Marketing"
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id"
              v-model="$store.state.pricing.filtroCalls.id_marketing"
            ></v-autocomplete>
          </v-col>
          <!-- <v-col cols="12" md="2" class="py-1" v-if="$store.state.pricing.filtroCalls.id_status">
            <v-autocomplete
              :items="$store.state.pricing.listQuoteStatus"
              label="Estado de la Cotización"
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id"
              v-model="$store.state.pricing.filtroCalls.id_status"
            ></v-autocomplete>
          </v-col> -->
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_pricing"
          >
            <v-autocomplete
              :items="$store.state.pricing.listEjecutivo"
              label="Pricing."
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id_entitie"
              v-model="$store.state.pricing.filtroCalls.id_pricing"
            ></v-autocomplete>
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_entities"
          >
            <v-autocomplete
              :items="$store.state.pricing.listEjecutivo"
              label="Ejecutivo."
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id_entitie"
              v-model="$store.state.pricing.filtroCalls.id_entities"
            ></v-autocomplete>
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_modality"
          >
            <v-autocomplete
              :items="$store.state.pricing.listModality"
              label="Sentido"
              v-model="$store.state.pricing.filtroCalls.id_modality"
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_shipment"
          >
            <v-autocomplete
              :items="$store.state.pricing.listShipment"
              label="Tipo Embarque"
              dense
              readonly
              hide-details
              outlined
              item-text="embarque"
              item-value="id"
              v-model="$store.state.pricing.filtroCalls.id_shipment"
            >
            </v-autocomplete>
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="$store.state.pricing.filtroCalls.id_incoterm"
          >
            <v-autocomplete
              :items="$store.state.pricing.listIncoterms"
              label="Incoterm"
              dense
              readonly
              hide-details
              outlined
              item-text="name"
              item-value="id"
              v-model="$store.state.pricing.filtroCalls.id_incoterm"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="4" xl="4">
        <v-text-field
          placeholder="Buscar..."
          label="Buscar"
          v-model="search"
          append-icon="mdi-magnify"
          dense
          outlined
          messages=" "
        >
          <template v-slot:message>
            <span v-if="search">
              <v-icon color="orange">mdi-file-alert</v-icon> Este filtro no se
              usará para el exportar en pdf
            </span>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="12" lg="8" xl="8">
        <div class="text-right">
          <v-btn
            color="red"
            @click="imprimierCalls()"
            class="mx-1"
            :loading="loading4"
            :disabled="loading4"
            :dark="!loading4"
            small
          >
            <v-icon>mdi-file-pdf-box</v-icon> REPORTE
          </v-btn>
          <v-btn
            color="info"
            @click="
              $store.state.pricing.filtrarCallsFlag =
                !$store.state.pricing.filtrarCallsFlag
            "
            class="mx-1"
            dark
            small
          >
            <v-icon>mdi-filter</v-icon>
            Filtrar
          </v-btn>
          <v-btn color="default" class="mx-1 my-1" small @click="limpiar()">
            <v-icon class="mx-1">mdi-filter-remove</v-icon>
            Limpiar
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-data-table
        dense
        :headers="headers"
        :items="$store.state.pricing.listCall"
        :items-per-page="5"
        class="elevation-1 contenido"
        :search="search"
        multi-sort
        mobile
        disable-sort
      >
        <template v-slot:[`item.llamadas`]="{ item }"> 
          <span style="font-weight: bold;">{{ item.fecha_ultima_llamada }} </span>
          <br>
          <span style="font-size: 0.7rem; font-style: italic;">{{ item.ultimo_comentario }}</span>
        </template>
        <!-- <template v-slot:item="row">
          <tr
            @dblclick="accionVerCotizacion(row.item.id)"
            :class="{
              'text-red':
                row.item.status === 'COTIZANDO SEGURO' ||
                row.item.status === 'COTIZANDO PROSPECTO',
            }"
          >
            <td>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    class="ma-2"
                    icon
                    dark
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    color="#A43542 "
                    @click="registrarLlamada(row.item.id)"
                  >
                    <v-icon dense small>mdi-phone-plus</v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Registro Llamada</span>
              </v-tooltip>
            </td>
            <td>
              {{ row.item.status }}
            </td>
            <td>
              {{ row.item.codigo }}
            </td>
            <td>
              {{ row.item.fecha_ultima_llamada }}
            </td>
            <td>
              {{ row.item.ejecutivo_pricing }}
            </td>
            <td>
              {{ row.item.ejecutivo_ventas }}
            </td>
            <td>
              {{ row.item.cliente }}
            </td>
            <td>
              {{ row.item.ultimo_comentario }}
            </td>
            <td>
              {{ row.item.telefono }}
            </td>
            <td>
              {{ row.item.fecha_solicitud }}
            </td>
            <td>
              {{ row.item.sentido }}
            </td>
            <td>
              {{ row.item.origen }}
            </td>
            <td>
              {{ row.item.destino }}
            </td>
            <td>
              {{ row.item.incoterms }}
            </td>
            <td>
              {{ row.item.tipo_de_carga }}
            </td>
          </tr>
        </template>
        <template v-slot:no-data> No se encontraron registros </template> -->
      </v-data-table>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import moment from "moment";
export default {
  data() {
    return {
      search: "",
      loading4: false,
      dialogRegistroNotaLlamada: false,
      headers: [
        // {
        //   value: "acciones",
        //   text: "",
        //   align: "center",
        //   groupable: true,
        //   estado: true,
        // },
        {
          value: "created_at",
          text: "FECHA REGISTRO",
          align: "center",
          groupable: true,
          estado: true,
          dataType: "Date",
        },
        // {
        //   value: "status",
        //   text: "RECIBIDO COTIZACION EN PRICING",
        //   align: "center",
        //   groupable: true,
        //   estado: true,
        // },
        // {
        //   value: "enviadocliente",
        //   text: "ENVIADO AL CLIENTE",
        //   align: "center",
        //   groupable: true,
        //   estado: true,
        // },
        {
          value: "llamadas",
          text: "DATOS LLAMADA",
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
          value: "ejecutivo_pricing",
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
          value: "cliente",
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
        // {
        //   value: "marketing",
        //   text: "MARKETING",
        //   align: "center",
        //   groupable: true,
        //   estado: true,
        // },
        {
          value: "fecha_solicitud",
          text: "Fecha Emision",
          align: "center",
        },
      ],
    };
  },
  async mounted() {},
  methods: {
    ...mapActions([
      "getQuoteCall",
      "imprimiReporteListadoCalls",
      "guardarNotaQuote",
    ]),
    formatearFecha(fecha) {
      if (!fecha) return "";

      return moment(fecha).format("YYYY-MMM-DD").toUpperCase();
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.$store.state.pricing.filtroCalls = {
        fechainicio: moment().format("YYYY-01-01"),
        fechafin: moment().endOf("month").format("YYYY-MM-DD"),
      };
      // this.$store.state.pricing.filtroCalls.estado = true;
      await this.getQuoteCall();

      this.$store.state.pricing.filtrarQuoteFlag = false;
      this.$store.state.pricing.filtroCalls.estado = true;
      this.$store.state.spiner = false;
    },
    async imprimierCalls() {
      this.$store.state.spiner = true;

      let filtroSeleccionado = {};
      const f = this.$store.state.pricing.filtroCalls;
      const store = this.$store.state.pricing;

      if (f.fechainicio)
        filtroSeleccionado["Fecha Creación de Cotización inicio"] =
          f.fechainicio;
      if (f.fechafin)
        filtroSeleccionado["Fecha Creación de Cotización fin"] = f.fechafin;
      if (f.fechaemisiondesde)
        filtroSeleccionado["Fecha de Envío Al Cliente  Desde"] =
          f.fechaemisiondesde;
      if (f.fechaemisionhasta)
        filtroSeleccionado["Fecha de Envío Al Cliente  Hasta"] =
          f.fechaemisionhasta;

      let filtroCabecera = {};

      if (f.id_marketing) {
        filtroCabecera.Marketing = store.listMarketing.find(
          (v) => v.id == f.id_marketing,
        )?.name;
      }
      if (f.id_status) {
        filtroCabecera.QuoteStatus = store.listQuoteStatus.find(
          (v) => v.id == f.id_status,
        )?.name;
      }
      if (f.id_pricing) {
        filtroCabecera.Pricing = store.listEjecutivo.find(
          (v) => v.id_entitie == f.id_pricing,
        )?.name;
      }
      if (f.id_entities) {
        filtroCabecera.Ejecutivo = store.listEjecutivo.find(
          (v) => v.id_entitie == f.id_entities,
        )?.name;
      }
      if (f.id_modality) {
        filtroCabecera.Modalidad = store.listModality.find(
          (v) => v.id == f.id_modality,
        )?.name;
      }
      if (f.id_shipment) {
        filtroCabecera.Shipment = store.listShipment.find(
          (v) => v.id == f.id_shipment,
        )?.embarque;
      }
      if (f.id_incoterm) {
        filtroCabecera.Incoterms = store.listIncoterms.find(
          (v) => v.id == f.id_incoterm,
        )?.name;
      }
      if (f.id_cliente) {
        filtroCabecera.Cliente = this.$store.state.clientes.find(
          (v) => v.id == f.id_cliente,
        )?.namelong;
      }

      this.loading4 = true;
      await this.imprimiReporteListadoCalls({
        filtroSeleccionado: filtroSeleccionado,
        filtroCabecera: filtroCabecera,
      });
      this.loading4 = false;
      this.$store.state.spiner = false;
    },
    registrarLlamada(id) {
      this.fromData = {
        date: moment().format("YYYY-MM-DD"),
        descripcion: "",
        identities: JSON.parse(sessionStorage.getItem("dataUser"))
          ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
          : "",
      };
      console.log(id);
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
        await this.getQuoteCall(this.$store.state.pricing.filtroCalls).catch(
          (err) => {
            console.log(err);
          },
        );

        this.$store.state.spiner = false;
      }
    },
  },
};
</script>

<style></style>
