<template>
  <v-container fluid>
    <v-dialog
      v-model="dialogRegistroNotaLlamada"
      v-if="dialogRegistroNotaLlamada"
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          <span class="text-headline-medium">Detalle de Nota de llamada</span>
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
              :items="pricingStore.listEjecutivo"
              label="Ejecutivo."
              density="compact"
              clearable
              item-title="name"
              item-value="id_entitie"
              v-model="fromData.identities"
            ></v-autocomplete>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1 text-right">
            <v-btn variant="text" color="success" @click="guardarNota">Aceptar</v-btn>
            <v-btn
              variant="text"
              color="red"
              @click="dialogRegistroNotaLlamada = !dialogRegistroNotaLlamada"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col cols="8" offset="4">
        <div class="col-6 offset-md-6 text-right">
          <v-btn
            color="red"
            @click="imprimierCalls()"
            class="mx-1"
            :loading="loading4"
            :disabled="loading4"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> Imprimir
          </v-btn>
          <v-btn
            color="info"
            @click="
              pricingStore.filtrarCallsFlag =
                !pricingStore.filtrarCallsFlag
            "
            class="mx-1"
            size="small"
          >
            Filtrar
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-data-table
        density="compact"
        :headers="headers"
        :items="pricingStore.listCall"
        :items-per-page="5"
        class="elevation-1 contenido"
        :search="search"
        multi-sort
      >
        <template v-slot:item="row">
          <tr
            @dblclick="accionVerCotizacion(row.item.id)"
            :class="{
              'text-red':
                row.item.status === 'COTIZANDO SEGURO' ||
                row.item.status === 'COTIZANDO PROSPECTO',
            }"
          >
            <td>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text"
                    class="ma-2"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    color="#A43542 "
                    @click="registrarLlamada(row.item.id)"
                  >
                    <v-icon size="small">mdi-phone-plus</v-icon>
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
        <template v-slot:no-data> No se encontraron registros </template>
      </v-data-table>
    </v-row>
  </v-container>
</template>

<script>
import moment from "moment";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
export default {
  data() {
    return {
      search: "",
      loading4: false,
      dialogRegistroNotaLlamada: false,
      headers: [
        { key: "acciones", title: "", align: "center", estado: true },
        { key: "status", title: "ESTATUS ", aling: "center", estado: true },
        {
          key: "codigo_quote",
          title: "CÓDIGO ",
          aling: "center",
          estado: true,
        },
        {
          key: "fecha_ultima_llamada",
          title: "FECHA ÚLTIMA LLAMADA",
          aling: "center",
          estado: true,
        },
        {
          key: "ejecutivo_ventas",
          title: "EJECUTIVO",
          aling: "center",
          estado: true,
        },
        { key: "cliente", title: "CLIENTE", aling: "center", estado: true },
        {
          key: "ultimo_comentario",
          title: "ULTIMO COMENTARIO",
          aling: "center",
          estado: true,
        },
        { key: "telefono", title: "TELEFONO", aling: "center", estado: true },
        {
          key: "fecha_solicitud",
          title: "FECHA SOLICITUD",
          aling: "center",
          estado: true,
        },
        { key: "sentido", title: "SENTIDO", aling: "center", estado: true },
        { key: "origen", title: "ORIGEN ", aling: "center", estado: true },
        { key: "destino", title: "DESTINO", aling: "center", estado: true },
        {
          key: "incoterms",
          title: "INCOTERMS",
          aling: "center",
          estado: true,
        },
        {
          key: "tipo_de_carga",
          title: "TIPO DE CARGA",
          aling: "center",
          estado: true,
        },
      ],
      filtro: {
        id_estado: "",
        id_sentido: "",
        id_carga: "",
        id_incoterms: "",
        desde: "",
        hasta: "",
      },
      filtroLlamada: {
        idmarketing: null,
        idstatus: null,
        identities: null,
        idmodality: null,
        idshipment: null,
        idincoterm: null,
        fechainicio: null,
        fechafin: null,
      },
    };
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this.getQuoteCallAduana(this.filtro);
    this.$store.state.spiner = false;
  },
  computed: {
    ...mapStores(usePricingStore),
  },
  methods: {
    ...mapPiniaActions(useAduanaStore, ["getQuoteCallAduana"]),
    ...mapPiniaActions(usePricingStore, ["imprimiReporteListadoCalls", "guardarNotaQuote"]),
    async imprimierCalls() {
      this.$store.state.spiner = true;
      this.loading4 = true;
      await this.imprimiReporteListadoCalls({ filtro: this.filtro });
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
      this.pricingStore.id = id;
      this.dialogRegistroNotaLlamada = true;
    },
    async guardarNota() {
      if ((await this.$refs.detallenota.validate()).valid) {
        this.dialogRegistroNotaLlamada = false;
        this.$store.state.spiner = true;

        let data = {
          id_quote: this.pricingStore.id,
          id_operador: this.fromData.identities,
          comentario: this.fromData.descripcion,
          fecha: this.fromData.date,
        };

        await this.guardarNotaQuote(data).catch((err) => {
          console.log(err);
        });
        await this.getQuoteCallAduana(this.filtro).catch((err) => {
          console.log(err);
        });

        this.$store.state.spiner = false;
      }
    },
  },
};
</script>

<style></style>
