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
        :items="housesStore.listHouse"
        :search="search"
        expand-on-click
        v-model:expanded="expanded"
        item-value="id"
        disable-sort
      >
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td
              :colspan="columns.length"
              class="py-3 px-3"
              v-if="item.list_comentarios.length > 0 && item.status != 0"
            >
              <v-table v-if="item.list_comentarios.length > 0">
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
              </v-table>
            </td>
          </tr>
        </template>

        <template v-slot:[`item.quote_number`]="{ item }">
          <v-chip
            v-if="item.quote_number"
            color="primary"
            size="small"
            @click.stop="verCotizacion(item.id_quote)"
            class="cursor-pointer"
          >
            <v-icon size="small" start>mdi-file-document-outline</v-icon>
            {{ item.quote_number }}
          </v-chip>
          <span v-else class="text-grey-lighten-1">Sin cotización</span>
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
              size="large"
              color="primary"
              class="mr-1"
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
          <v-card-title class="d-flex align-center flex-wrap">
            Registro de Estado/ Comentario - {{ house.code_house }}
            <v-spacer></v-spacer>
            <v-btn variant="text"
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
                :items="pricingStore.listEjecutivo"
                item-title="name"
                item-value="id_entitie"
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
              size="small"
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
            size="small"
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
            append-inner-icon="mdi-folder-check"
            @click:append-inner="actualizarUrl"
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import { useMastersStore } from "@/stores/masters";

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
        { title: "Master", key: "code_master" },
        { title: "Nro BL House", key: "nro_hbl", align: "start" },
        { title: "Cotización", key: "quote_number" },
        { title: "Sentido", key: "namemodality" },
        { title: "Origen", key: "nameportbegin" },
        { title: "Destino", key: "nameportend" },
        { title: "Proveedor", key: "nameproveedor" },
        { title: "Cliente del House", key: "nameconsigner" },
        { title: "Salida ETD", key: "fecha_etd" },
        { title: "Llegada ETA", key: "fecha_eta" },
        { title: "Naviera", key: "naviera" },
        { title: "Acciones", key: "actions", sortable: false },
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
    ...mapStores(useHousesStore, usePricingStore),
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
    ]),
    ...mapPiniaActions(useMastersStore, ["actualizarURLEnElMaster"]),
    ...mapPiniaActions(useHousesStore, ["insertComentarioHouse", "listarHouse"]),
    ...mapPiniaActions(usePricingStore, ["getModulesEntities"]),
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
      if ((await this.$refs.frmComentario.validate()).valid) {
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
  },
};
</script>
