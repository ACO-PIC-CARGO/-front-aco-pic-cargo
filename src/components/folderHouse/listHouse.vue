<template>
  <div>
    <v-card elevation="0">
      <v-card-title>
        <v-row>
          <v-col cols="12" lg="6" xl="6">
            <v-text-field
              v-model="search"
              label="Buscar"
              single-line
              hide-details
              prepend-icon="mdi-magnify"
            >
            </v-text-field>
          </v-col>
          <v-col cols="12" lg="6" xl="6">
            <v-btn
              color="secondary"
              elevation="0"
              dark
              @click="
                $store.state.house_filtrarData = !$store.state.house_filtrarData
              "
            >
              FILTRAR
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="$store.state.houses.listHouse"
        :search="search"
        @click:row="handleClickRow"
        :expanded.sync="expanded"
        single-expand
        disable-sort
      >
        <template v-slot:expanded-item="{ item }">
          <td
            :colspan="headers.length"
            class="py-3 px-3"
            v-if="item.list_comentarios.length > 0 && item.status != 0"
          >
            <v-simple-table v-if="item.list_comentarios.length > 0">
              <thead>
                <tr>
                  <th width="10%">Fecha</th>
                  <th width="20%">Ejecutivo</th>
                  <th width="70%">Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(c, index) in item.list_comentarios"
                  :key="index"
                  class="bg-comentarios"
                >
                  <td class="bg-comentarios">{{ c.fecha }}</td>
                  <td class="bg-comentarios">{{ c.ejecutivo }}</td>
                  <td class="bg-comentarios">{{ c.comentario }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </td>
        </template>

        <template v-slot:[`item.quote_number`]="{ item }">
          <v-chip
            v-if="item.quote_number"
            color="primary"
            small
            @click.stop="verCotizacion(item.id_quote)"
            class="cursor-pointer"
          >
            <v-icon small left>mdi-file-document-outline</v-icon>
            {{ item.quote_number }}
          </v-chip>
          <span v-else class="grey--text text--lighten-1">Sin cotización</span>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <div class="d-flex">
            <v-icon
              v-if="statusList != '2'"
              color="secondary"
              class="mr-1"
              @click.stop="abrirModalComentario(item)"
            >
              mdi-chat-plus
            </v-icon>

            <v-icon
              color="#FFD600"
              class="mr-1"
              @click.stop="abrirCaperta(item)"
            >
              mdi-folder
            </v-icon>

            <v-icon
              v-if="statusList != '2'"
              color="info"
              class="mr-1"
              aria-label="Ver house"
              @click.stop="viewHouse(item.id)"
            >
              mdi-eye
            </v-icon>

            <v-icon
              v-if="statusList != '2'"
              color="orange"
              class="mr-1"
              @click.stop="editHouse(item.id)"
            >
              mdi-pencil
            </v-icon>

            <v-icon
              v-if="statusList == '2'"
              large
              color="primary"
              class="mr-1"
              aria-label="Abrir control de gastos"
              @click.stop="selectHouse(item)"
            >
              mdi-cursor-default-click
            </v-icon>
          </div>
        </template>
      </v-data-table>
      <v-container>
        <v-row>
          <v-col>
            <v-btn v-if="statusReport" color="primary" elevation="0"
              >GENERAR REPORTE {{ pagination.page }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>

      <v-dialog v-model="dialogComentario" persistent width="50%">
        <v-card>
          <v-card-title>
            Registro de Estado/ Comentario - {{ house.code_house }}
            <v-spacer></v-spacer>
            <v-btn
              icon
              color="default"
              @click="dialogComentario = !dialogComentario"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="frmComentario">
              <v-text-field
                label="Fecha"
                v-model="fecha"
                type="date"
                readonly
              ></v-text-field>
              <v-autocomplete
                label="Ejecutivo"
                :items="$store.state.pricing.listEjecutivo"
                item-text="name"
                item-value="id_entitie"
                item-key="id_entitie"
                v-model="id_vendedor"
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-autocomplete>
              <v-textarea
                label="Estado/ Comentario"
                v-model="comentario"
                rows="4"
                auto-grow
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              small
              color="success"
              @click="guardarComentario"
              :loading="loading"
              >Guardar</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
    <v-dialog
      v-model="dialogUrl"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title> Actualizar URL Carpeta </v-card-title>
        <v-card-text>
          <v-btn
            color="success"
            small
            :disabled="!houseEditar.url_folderonedrive"
            @click="to_link({ url: houseEditar.url_folderonedrive })"
          >
            Abrir <v-icon class="mx-1">mdi-folder-open-outline</v-icon>
          </v-btn>
          <v-divider class="my-3"></v-divider>
          <v-text-field
            label="Nueva URL"
            id="id"
            v-model="url_folderonedrive"
            append-icon="mdi-folder-check"
            @click:append="actualizarUrl"
          ></v-text-field>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="dialogUrl = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import moment from "moment";

export default {
  name: "listMasterCom",
  props: {
    statusReport: Boolean,
    statusList: String,
  },
  data() {
    return {
      search: "",
      dialogUrl: false,
      url_folderonedrive: "",
      houseEditar: {},
      options: {},
      expanded: [],
      singleExpand: false,
      loadingDataTable: false,
      headers: [
        { text: "Master", value: "code_master" },
        { text: "Nro BL House", value: "nro_hbl", align: "start" },
        { text: "Cotización", value: "quote_number" },
        { text: "Sentido", value: "namemodality" },
        { text: "Origen", value: "nameportbegin" },
        { text: "Destino", value: "nameportend" },
        { text: "Proveedor", value: "nameproveedor" },
        { text: "Cliente del House", value: "nameconsigner" },
        { text: "Salida ETD", value: "fecha_etd" },
        { text: "Llegada ETA", value: "fecha_eta" },
        { text: "Naviera", value: "naviera" },
        { text: "Acciones", value: "actions", sortable: false },
      ],
      dialogComentario: false,
      loading: false,
      house: {},
      fecha: moment().format("YYYY-MM-DD"),
      id_vendedor: "",
      comentario: "",
    };
  },
  async mounted() {
    this.$store.state.spiner = true;

    await this.listarHouse(this.$store.state.house_filtro);
    // await this._getHouseListAll();
    this.$store.state.spiner = false;
    await Promise.all([
      this._getTotalHouseListAll(),
      this.getModulesEntities(),
      this._getModality(),
      this._getShipment(),
      this.cargarClientes(),
      this._getMasterList(),
    ]);
  },
  computed: {
    ...mapState(["itemsHouseListAll", "totalItemsHouseListAll"]),
  },
  methods: {
    ...mapActions([
      "_getHouseListAll",
      "_getTotalHouseListAll",
      "_getMasterList",
      "_getModality",
      "_getShipment",
      "cargarClientes",
      "getModulesEntities",
      "insertComentarioHouse",
      "listarHouse",
      "actualizarURLEnElMaster",
    ]),
    abrirCaperta(item) {
      console.log("item:", item);
      this.houseEditar = { ...item };
      this.url_folderonedrive = "";
      this.dialogUrl = true;
      // window.open(url, "_blank");
    },
    async actualizarUrl() {
      await this.actualizarURLEnElMaster({
        id: this.houseEditar.id,
        url: this.url_folderonedrive,
      });
      this.houseEditar.url_folderonedrive = this.url_folderonedrive;
      this.dialogUrl = false;
      setTimeout(async () => {
        await this.listarHouse(this.$store.state.house_filtro);
      }, 1000);
    },
    to_link({ url = "" }) {
      window.open(url, "_blank");
    },
    editHouse(id) {
      this.$router.push("/home/folderHouse/control/editar/" + id);
    },
    viewHouse(id) {
      this.$router.push("/home/folderHouse/control/ver/" + id);
    },
    verCotizacion(id_quote) {
      if (id_quote) {
        this.$router.push(`/home/folderPricing/verQuote/${id_quote}`);
      }
    },
    selectHouse(house) {
      this.$router.push({
        name: "editControlGasto",
        params: {
          id: house.id_master,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
      });
    },

    abrirModalComentario(item) {
      this.dialogComentario = true;
      this.house = item;
      this.id_vendedor = JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "";
      this.comentario = "";
    },
    async guardarComentario() {
      if (this.$refs.frmComentario.validate()) {
        this.loading = true;
        this.$store.state.spiner = true;

        await this.insertComentarioHouse({
          id_house: this.house.id,
          id_entities: this.id_vendedor,
          fecha: this.fecha,
          comentario: this.comentario,
        });

        this.dialogComentario = !this.dialogComentario;

        await this._getHouseListAll();

        this.$store.state.spiner = false;
        this.loading = false;
      }
    },
    handleClickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
  },
};
</script>
