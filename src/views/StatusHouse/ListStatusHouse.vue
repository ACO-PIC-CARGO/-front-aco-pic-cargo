<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card-title primary-title>
            <v-text-field label="Buscar..." v-model="search"></v-text-field>
            <v-spacer></v-spacer>
            <v-btn color="success" small class="mx-2" @click="nuevoStatus()">
              CREAR ESTATUS
              <v-icon class="ml-1" dense>mdi-plus</v-icon>
            </v-btn>
            <v-btn
              color="purple"
              dark
              small
              class="mx-2"
              @click="abrirModalOrden()"
            >
              Cambiar Orden
              <v-icon class="ml-1" dense>mdi-swap-vertical</v-icon>
            </v-btn>
            <v-btn color="info" small class="mx-2" @click="filtrar = !filtrar">
              Filtrar <v-icon class="ml-1" dense>mdi-filter-outline</v-icon>
            </v-btn>
            <v-btn
              color="default"
              small
              class="mx-2"
              @click="getListStatusHouse()"
            >
              Limpiar <v-icon class="ml-1" dense>mdi-clean</v-icon>
            </v-btn>
          </v-card-title>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="listStatusHouse"
            item-key="id"
            loading="true"
            :search="search"
          >
            <template v-slot:[`item.exw`]="{ item }">
              {{ item.exwflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.fca`]="{ item }">
              {{ item.fcaflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.cfr`]="{ item }">
              {{ item.cfrflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.cif`]="{ item }">
              {{ item.cifflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.fob`]="{ item }">
              {{ item.fobflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.ddp`]="{ item }">
              {{ item.ddpflag ? "Si" : "No" }}
            </template>
            <template v-slot:[`item.comentarios`]="{ item }">
              <div class="" v-if="item.comentarios.length > 0">
                <v-btn
                  color="success"
                  v-if="!item.verComentarios"
                  @click="item.verComentarios = !item.verComentarios"
                  x-small
                >
                  Ver Comentarios
                </v-btn>
                <v-btn
                  color="warning"
                  v-else
                  @click="item.verComentarios = !item.verComentarios"
                  x-small
                >
                  Ocultar Comentarios
                </v-btn>
                <ol type="I" v-if="item.verComentarios">
                  <li
                    class="justify"
                    v-for="(comentario, index) in item.comentarios"
                    :key="index"
                  >
                    {{ comentario.descripcion }}
                  </li>
                </ol>
              </div>
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <!-- <v-btn color="info" x-small @click="edi"> <v-icon dense>mdi-plus</v-icon> Comentario</v-btn> -->
              <v-btn x-small color="warning" @click="editar(item)">
                AÑADIR COMENTARIOS
              </v-btn>
              <v-btn class="mx-1" x-small color="error" @click="eliminar(item)">
                <v-icon size="medium">mdi-delete</v-icon>
              </v-btn>
              <!-- <v-btn color="error" icon @click="edi" > <v-icon dense>mdi-delete</v-icon></v-btn> -->
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title v-if="!id"> Agregar Status </v-card-title>
        <v-card-title primary-title v-else> Editar Status </v-card-title>
        <v-card-text>
          <v-form ref="frmStatus">
            <v-row>
              <v-col cols="6">
                <v-autocomplete
                  :items="$store.state.pricing.listModality"
                  label="Sentido*"
                  item-text="name"
                  item-value="id"
                  @change="obtenerOrden()"
                  v-model="id_modality"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  :items="$store.state.pricing.listShipment"
                  label="Tipo de Embarque*"
                  item-text="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  @change="obtenerOrden"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Estatus"
                  v-model="name"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-if="nroorden"
                  label="Orden"
                  type="number"
                  v-model="nroorden"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'No puede ser 0 o menor',
                  ]"
                  min="1"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <h4>Incoterms</h4>
              </v-col>
              <v-col cols="12" v-if="errorInconterms">
                <span class="red--text">
                  {{ errorInconterms }}
                </span>
              </v-col>
            </v-row>
            <v-row>
              <v-checkbox
                row
                label="EXW"
                class="mx-2"
                v-model="exw"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="FOB"
                class="mx-2"
                v-model="fob"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="FCA"
                class="mx-2"
                v-model="fca"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="CFR"
                class="mx-2"
                v-model="cfr"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="CIF"
                class="mx-2"
                v-model="cif"
                :value="true"
              ></v-checkbox>
              <v-checkbox
                row
                label="DDP"
                class="mx-2"
                v-model="ddp"
                :value="true"
              ></v-checkbox>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn color="success" small @click="anadirComentario()">
                  Añadir Comentario
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-simple-table>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Comentario</th>
                      <th>Mover</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>
                        <v-textarea
                          auto-grow
                          v-model="item.descripcion"
                          dense
                          hide-details
                          solo
                          rows="1"
                        ></v-textarea>
                      </td>
                      <td>
                        <v-btn
                          color="error"
                          icon
                          @click="moveUp(index)"
                          :disabled="index === 0"
                        >
                          <v-icon>mdi-arrow-up-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          color="success"
                          icon
                          @click="moveDown(index)"
                          :disabled="index === items.length - 1"
                        >
                          <v-icon>mdi-arrow-down-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          color="error"
                          @click="eliminarComentario(item)"
                          ><v-icon>mdi-delete</v-icon></v-btn
                        >
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions v-if="!id">
          <v-spacer></v-spacer>
          <v-btn small class="mx-1" color="success" @click="guardarStatus()">
            Guardar
          </v-btn>
          <v-btn small class="mx-1" color="error" @click="dialog = false">
            Cancelar
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <v-spacer></v-spacer>
          <v-btn small class="mx-1" color="success" @click="guardarStatus()">
            Actualizar
          </v-btn>
          <v-btn small class="mx-1" color="error" @click="dialog = false">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogOrden" scrollable persistent width="80%">
      <v-card>
        <v-card-title primary-title> Ordenar Estatus: </v-card-title>
        <v-card-text>
          <v-form ref="frmOrdenEstatus">
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  :items="$store.state.pricing.listModality"
                  label="Sentido*"
                  item-text="name"
                  item-value="id"
                  v-model="id_modality"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-autocomplete
                  :items="$store.state.pricing.listShipment"
                  label="Tipo de Embarque*"
                  item-text="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-btn
                  small
                  color="info"
                  @click="buscarEstatusPorModalidadYEmbarque()"
                  >Buscar</v-btn
                >
              </v-col>
            </v-row>
          </v-form>
          <v-row>
            <v-col cols="12">
              <v-data-table
                :headers="headerEstado"
                :items="lstStatus"
                class="elevation-1"
                item-key="index"
                :loading="loadingTable"
              >
                <template v-slot:[`item.exw`]="{ item }">
                  {{ item.exwflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.fob`]="{ item }">
                  {{ item.fobflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.fca`]="{ item }">
                  {{ item.fcaflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.cfr`]="{ item }">
                  {{ item.cfrflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.cif`]="{ item }">
                  {{ item.cifflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.ddp`]="{ item }">
                  {{ item.ddpflag ? "Si" : "No" }}
                </template>
                <template v-slot:[`item.orden`]="{ item, index }">
                  <v-text-field
                    dense
                    hide-details
                    v-model="item.orden"
                    type="number"
                    :min="0"
                    @input="cambiarOrdenEstado(index)"
                  ></v-text-field>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" class="mx-1" @click="guardarOrden()" small>
            Guardar
          </v-btn>
          <v-btn color="error" class="mx-1" @click="dialogOrden = false" small>
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtrar"
      right
      absolute
      bottom
      persistent
      width="30%"
      temporary
      class="px-5 py-5"
    >
      <template v-slot:prepend> FILTRAR </template>

      <v-divider></v-divider>

      <v-autocomplete
        :items="$store.state.pricing.listModality"
        label="Sentido*"
        item-text="name"
        item-value="id"
        v-model="id_modality"
        :rules="[(v) => !!v || 'Dato Requerido']"
      ></v-autocomplete>

      <v-autocomplete
        :items="$store.state.pricing.listShipment"
        label="Tipo de Embarque*"
        item-text="embarque"
        item-value="id"
        v-model="id_shipment"
        :rules="[(v) => !!v || 'Dato Requerido']"
      ></v-autocomplete>
      <!-- <v-row>
        <v-checkbox
          row
          label="EXW"
          class="mx-2"
          v-model="exw"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="FOB"
          class="mx-2"
          v-model="fob"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="FCA"
          class="mx-2"
          v-model="fca"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="CFR"
          class="mx-2"
          v-model="cfr"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="CIF"
          class="mx-2"
          v-model="cif"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="DDP"
          class="mx-2"
          v-model="ddp"
          :value="true"
        ></v-checkbox>
      </v-row> -->
      <v-divider class="mb-5"></v-divider>
      <v-btn color="success" class="mx-1" small @click="filtrarListado()"
        >Filtrar</v-btn
      >
      <v-btn color="error" class="mx-1" small>Cancelar</v-btn>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      filtrar: false,
      loadingTable: false,
      lstStatus: [],
      dialogOrden: false,
      dialog: false,
      search: "",
      name: "",
      id: "",
      exw: false,
      fob: false,
      fca: false,
      cfr: false,
      cif: false,
      ddp: false,
      headerComentario: [
        { text: "Orden", value: "index" },
        { text: "Nombre", value: "name" },
        { text: "Mover", value: "" },
      ],
      headerEstado: [
        { text: "Nombre", value: "name", sortable: false },
        { value: "exw", text: "EXW", sortable: false },
        { value: "fob", text: "fob", sortable: false },
        { value: "fca", text: "FCA", sortable: false },
        { value: "cfr", text: "CFR", sortable: false },
        { value: "cif", text: "CIF", sortable: false },
        { value: "ddp", text: "DDP", sortable: false },
        { text: "Orden", value: "orden", sortable: false },
      ],
      headers: [
        { value: "modalidad", text: "Modalidad", sort: false },
        { value: "shipment", text: "Tipo de Embarque", sort: false },
        { value: "name", text: "Status", sort: false },
        { value: "comentarios", text: "Comentarios", sort: false },
        { value: "exw", text: "EXW", sort: false },
        { value: "fob", text: "FOB", sortable: false },
        { value: "fca", text: "FCA", sort: false },
        { value: "cfr", text: "CFR", sort: false },
        { value: "cif", text: "CIF", sort: false },
        { value: "ddp", text: "DDP", sort: false },
        { value: "orden", text: "Orden", sort: false },
        { value: "action", text: "", sort: false },
      ],
      items: [],
      id_modality: "",
      id_shipment: "",
      nroorden: "",
      errorInconterms: "",
    };
  },
  methods: {
    ...mapActions("statushouse", [
      "getListStatusHouse",
      "getObtenerOrdenStatusHouse",
      "GuardarStatusHouse",
      "GuardarStatus",
      "EliminarStatus",
      "EliminarComentario",
    ]),
    ...mapActions(["getModality", "getShipment"]),
    eliminarComentario(comentario) {
      
      Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esto!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.$store.state.spiner = true;
          await this.EliminarComentario(comentario);
          this.$store.state.spiner = false;
          this.dialog = false;
        }
      });
    },
    eliminar(estado) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esto!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.$store.state.spiner = true;
          await this.EliminarStatus(estado);
          this.$store.state.spiner = false;
        }
      });
    },
    nuevoStatus() {
      this.dialog = true;
      this.id = "";
      this.items = [];
      this.$nextTick(() => {
        this.$refs.frmStatus.reset();
      });
    },
    async filtrarListado() {
      let data = {
        id_modalidad: this.id_modality,
        id_shipment: this.id_shipment,

        // exwflag: this.exw,
        // fcaflag: this.fca,
        // fobflag: this.fob,
        // cfrflag: this.cfr,
        // cifflag: this.cif,
        // ddpflag: this.ddp,
      };
      await this.getListStatusHouse(data);
      this.filtrar = false;
    },
    moveUp(index) {
      const item = this.items[index];
      this.items.splice(index, 1);
      this.items.splice(index - 1, 0, item);
    },
    moveDown(index) {
      const item = this.items[index];
      this.items.splice(index, 1);
      this.items.splice(index + 1, 0, item);
    },
    abrirModalOrden() {
      this.lstStatus = [];
      this.dialogOrden = true;
      this.$nextTick(() => {
        this.$refs.frmOrdenEstatus.reset();
      });
    },
    buscarEstatusPorModalidadYEmbarque() {
      if (this.$refs.frmOrdenEstatus.validate()) {
        this.lstStatus = [];
        this.lstStatus = [
          ...this.listStatusHouse.filter(
            (v) =>
              v.id_modalidad == this.id_modality &&
              v.id_shipment == this.id_shipment
          ),
        ];
      }
    },
    cambiarOrdenEstado(index) {
      const elementoModificado = this.lstStatus[index];
      const nuevoOrden = parseFloat(elementoModificado.orden);

      if (isNaN(nuevoOrden) || nuevoOrden <= 0) {
        console.warn("El orden debe ser un número positivo.");
        return;
      }

      // Mostrar un indicador visual de "calculando" (opcional)
      this.loadingTable = true;

      // Agregar un pequeño retraso
      setTimeout(() => {
        const lstSinElemento = this.lstStatus.filter((_, i) => i !== index);

        let ordenActual = 1;
        const lstReordenada = lstSinElemento.map((element) => {
          if (ordenActual === nuevoOrden) ordenActual++;
          return { ...element, orden: ordenActual++ };
        });

        lstReordenada.splice(nuevoOrden - 1, 0, {
          ...elementoModificado,
          orden: nuevoOrden,
        });

        this.lstStatus = [];
        this.$nextTick(() => {
          this.lstStatus = lstReordenada;

          // Ocultar el indicador de "calculando" (opcional)
          this.loadingTable = false;

          // Enfocar el campo
          this.$nextTick(() => {
            const input = document.querySelector(
              `[data-index="${nuevoOrden - 1}"] input`
            );
            if (input) {
              input.focus();
              input.select();
            }
          });
        });
      }, 500); // Retraso de 500 ms
    },
    async obtenerOrden() {
      if (this.id_modality && this.id_shipment) {
        await this.getObtenerOrdenStatusHouse({
          id_modalidad: this.id_modality,
          id_shipment: this.id_shipment,
        });
        let orden = { ...this.orden };
        this.nroorden = orden.orden;
      }
    },
    anadirComentario() {
      this.items.push({ descripcion: "" });
    },
    async guardarStatus() {
      this.errorInconterms = "";
      if (this.$refs.frmStatus.validate()) {
        if (!this.exw && !this.fca && !this.cfr && !this.cif && !this.ddp) {
          this.errorInconterms =
            "Es necesario seleccionar al menos un Incoterms";
          return false;
        }
        this.items.map((item, index) => {
          item.orden = index + 1;
        });
        let data = {
          id: this.id,
          id_modality: this.id_modality,
          id_shipment: this.id_shipment,
          name: this.name,
          nroorden: this.nroorden,
          exw: this.exw,
          fob: this.fob,
          fca: this.fca,
          cfr: this.cfr,
          cif: this.cif,
          ddp: this.ddp,
          lstComentatios: this.items,
        };
        await this.GuardarStatusHouse(data);
        this.dialog = false;
      }
    },
    editar(item) {
      this.dialog = true;
      this.id = item.id;
      this.id_modality = item.id_modalidad;
      this.id_shipment = item.id_shipment;
      this.name = item.name;
      this.exw = item.exwflag;
      this.fob = item.fobflag;
      this.fca = item.fcaflag;
      this.cfr = item.cfrflag;
      this.cif = item.cifflag;
      this.ddp = item.ddpflag;
      this.lst = item.itemsflag;
      this.items = item.comentarios;
      this.nroorden = item.orden;
    },
    mostrarComentario(item) {
      item.verComentarios = item.verComentarios;
      this.$forceUpdate();
    },
    async guardarOrden() {
      await this.GuardarStatus(this.lstStatus);
      this.dialogOrden = false;
    },
  },
  computed: {
    ...mapState("statushouse", ["listStatusHouse", "orden"]),
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this.getListStatusHouse();
    this.$store.state.spiner = false;
    await this.getModality();
    await this.getShipment();
  },
};
</script>

<style scoped>
.justify {
  text-align: justify;
}
</style>
