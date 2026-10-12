<template>
  <v-container grid-list-xs>
    <v-row>
      <v-col cols="12" style="text-align: end">
        <v-spacer></v-spacer>
        <!-- <v-btn color="success" small @click="abrirModalServicio"
          >Añadir Servicio</v-btn
        > -->
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.calculadoras.lstServicio"
        >
          <template v-slot:[`item.opcionflag`]="{ item }">
            {{ item.opcionflag ? "Si" : "No" }}
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogNuevo" persistent width="40%">
      <v-card>
        <v-card-title class="my-2" primary-title> Nuevo Servicio </v-card-title>
        <v-card-text>
          <v-form ref="frmServicio">
            <v-row>
              <v-col cols="12" class="py-0">
                <v-autocomplete
                  variant="outlined"
                  label="Modalidad"
                  :items="$store.state.itemsModality"
                  density="compact"
                  item-value="id"
                  item-title="name"
                  :model-value="id_modality"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  disabled
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-autocomplete
                  variant="outlined"
                  label="Pais"
                  :items="$store.state.itemsPais"
                  density="compact"
                  item-value="id"
                  item-title="name"
                  v-model="id_pais"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  disabled
                >
                  <template v-slot:item="{ item }">
                    <div class="text-uppercase">
                      {{ item.name }}
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-text-field
                  label="Código"
                  variant="outlined"
                  density="compact"
                  append-icon="mdi-information"
                  @click:append="mostrarAdvertencia()"
                  v-model="code"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-text-field
                  label="Descripción"
                  variant="outlined"
                  density="compact"
                  v-model="descripcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-text-field
                  type="number"
                  label="Orden"
                  variant="outlined"
                  density="compact"
                  v-model="orden"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-switch label="Opcional" v-model="opcionalflag"></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn size="small" color="success" :loading="loading" @click="anadirServ"
            >Añadir</v-btn
          >
          <v-btn size="small" color="error" @click="dialogNuevo = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar">
      <p>Código para Impuestos (01)</p>
      <p>Código para Transporte local y entrega (02)</p>

      <v-btn block color="red" @click="snackbar = false"> Close </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";

export default {
  props: {
    type: {
      default: "FCL",
      type: String,
    },
    id_modality: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {
      dialogNuevo: false,
      snackbar: false,
      headers: [
        { key: "modality", title: "Modalidad" },
        { key: "pais", title: "Pais" },
        { key: "code", title: "Código" },
        { key: "descripcion", title: "Servicio" },
        { key: "orden", title: "Orden" },
        { key: "opcionflag", title: "Opcional" },
      ],
      items: [
        {
          modality: "Importación",
          pais: "Perú",
          // section: "ORIGEN: FLETE Y GASTOS DE ORIGEN",
          code: "001",
          descripcion: "Almacén aduanero",
          opcionalflag: false,
          orden: 1,
        },
      ],

      modality: {},
      pais: {},
      code: "",
      orden: "",
      descripcion: "",
      opcionalflag: false,
      id_pais: "",

      loading: false,
    };
  },
  async mounted() {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    this.id_pais = branch[0].id_pais;
  },
  // components() {},
  methods: {
    ...mapActions(["_getModality", "_getPais", "PostCalcServicio"]),
    mostrarAdvertencia() {
      this.snackbar = true;
    },
    abrirModalServicio() {
      this.dialogNuevo = true;
      this.$nextTick(() => {
        this.$refs.frmServicio.reset();
        setTimeout(() => {
          let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
          this.id_pais = branch[0].id_pais;
          this.id_modality = 1;
        }, 100);
      });
    },
    async anadirServ() {
      if (this.$refs.frmServicio.validate()) {
        this.loading = true;
        let serv = {
          id_modality: this.id_modality,
          modality: this.modality.name,
          id_pais: this.id_pais,
          pais: this.pais.name,
          code: this.code,
          descripcion: this.descripcion,
          orden: this.orden,
          opcionalflag: this.opcionalflag,
        };
        await this.PostCalcServicio(serv);
        this.dialogNuevo = false;
        this.loading = false;
      }
    },
  },
};
</script>

<style></style>
