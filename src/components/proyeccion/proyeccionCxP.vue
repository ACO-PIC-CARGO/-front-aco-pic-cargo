<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        name="Buscar"
        label="Buscar Proyección"
        v-model="search"
      ></v-text-field>

      <v-spacer></v-spacer>
      <v-btn
        dark
        color="#3F51B5"
        class="mx-1"
        @click="dialogn = !dialogn"
        size="small"
        rounded
        v-if="generarflag"
      >
        GENERAR
      </v-btn>
      <v-btn
        color="success"
        class="mx-1"
        @click="$router.push({ name: 'nuevaProyeccionCXP' })"
        size="small"
        rounded
        >NUEVA
      </v-btn>
      <v-btn color="info" class="mx-1" size="small" rounded @click="filtar = !filtar"
        >FILTRAR</v-btn
      >
      <v-btn color="success" class="mx-1" size="small" rounded>EXPORTAR</v-btn>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.proyecciones.listProyeccion"
          class="elevation-1"
          item-key="id"
          loading="true"
          :search="search"
        >
          <template v-slot:[`item.action`]="{ item }">
            <v-btn icon>
              <v-icon color="info" @click="ver(item.proyeccion_id)"
                >mdi-eye</v-icon
              >
            </v-btn>
            <v-btn icon v-if="!item.proyeccion_aprobadoflag">
              <v-icon color="orange" @click="editar(item.proyeccion_id)"
                >mdi-pencil</v-icon
              >
            </v-btn>
            <v-btn icon>
              <v-icon color="blue-grey-darken-4" @click="copiar(item)"
                >mdi-content-copy</v-icon
              >
            </v-btn>
            <v-btn
              icon
              v-if="!item.proyeccion_aprobadoflag && !!item.proyeccion_estado"
              @click="eliminar(item.proyeccion_id)"
            >
              <v-icon color="red">mdi-trash-can</v-icon>
            </v-btn>
          </template>
          <template v-slot:[`item.proyeccion_estado`]="{ item }">
            <v-chip dark :color="!!item.proyeccion_estado ? 'green' : 'red'">
              {{ !!item.proyeccion_estado ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>
          <template v-slot:[`item.proyeccion_aprobadoflag`]="{ item }">
            <v-chip
              dark
              :color="!!item.proyeccion_aprobadoflag ? 'green' : 'red'"
            >
              {{ !!item.proyeccion_aprobadoflag ? "Si" : "No" }}</v-chip
            >
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" persistent :overlay="false" max-width="30%">
      <v-card>
        <v-card-title primary-title>
          Copiar Proyección {{ item.proyeccion_correlativo }}
          <v-spacer></v-spacer>
          <v-btn icon color="defaul" @click="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                :items="$store.state.month"
                v-model="id_month"
                label="Mes"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-select
                :items="$store.state.year"
                v-model="id_year"
                label="Año"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            class="mx-1"
            @click="copyProyeccion()"
            :loading="loading"
            >Copiar</v-btn
          >
          <v-btn color="red" dark class="mx-1" @click="dialog = !dialog"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogn" persistent :overlay="false" max-width="30%">
      <v-card>
        <v-card-title primary-title>
          REALIZAR PRIMERA PROYECCIÓN
          <v-spacer></v-spacer>
          <v-btn icon color="defaul" @click="dialogn = !dialogn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                :items="$store.state.month"
                v-model="id_monthn"
                label="Mes"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-select
                :items="$store.state.year"
                v-model="id_yearn"
                label="Año"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            class="mx-1"
            @click="pProyeccion()"
            :loading="loading"
            >Copiar</v-btn
          >
          <v-btn color="red" dark class="mx-1" @click="dialogn = !dialogn"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtar"
      absolute
      location="bottom right"
      temporary
      
      width="20%"
      height="92vh"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6"> Filtrar </v-list-item-title>
        
      </v-list-item>

      <v-divider></v-divider>

      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-row>
          <v-col cols="12">
            <v-select
              :items="$store.state.month"
              v-model="id_month"
              label="Mes"
              density="compact"
              item-title="description"
              item-value="id"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12">
            <v-select
              :items="$store.state.year"
              v-model="id_year"
              label="Año"
              density="compact"
              item-title="description"
              item-value="id"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Correlativo"
              v-model="correlativo"
              clearable
              density="compact"
              step="1"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto Proyectado (USD)"
              v-model="total_proyectado_ext"
              clearable
              density="compact"
              step="1"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            Estado
            <v-radio-group v-model="estado" inline density="compact">
              <v-radio label="Activo" :value="'true'"></v-radio>
              <v-radio label="Inactivo" color="red" :value="'false'"></v-radio>
              <v-btn icon size="small" @click="clearestado()" v-if="!!estado">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-radio-group>
          </v-col>
          <v-col cols="12">
            Aprobados
            <v-radio-group v-model="aprobado" inline density="compact">
              <v-radio label="Aprobados" :value="'true'"></v-radio>
              <v-radio
                label="No Aprobados"
                color="red"
                :value="'false'"
              ></v-radio>
              <v-btn icon size="small" @click="clearaprobado()" v-if="!!aprobado">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-radio-group>
          </v-col>
        </v-row>
      </v-list>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="small" color="success" @click="filtrar()">Aceptar</v-btn>
        <v-btn size="small" dark color="red" @click="filtar = !filtar">Cerrar</v-btn>
      </v-card-actions>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      filtar: false,
      item: "",
      dialog: false,
      search: "",
      id_month: "",
      id_year: "",
      correlativo: "",
      total_proyectado_ext: "",
      estado: "",
      aprobado: "",
      id_monthn: "",
      id_yearn: "",
      headers: [
        { text: "Correlativo", value: "proyeccion_correlativo" },
        { text: "Mes", value: "month_description" },
        { text: "Año", value: "year_description" },
        // { text:'Tipo de Cambio' ,value: "proyeccion_tipocambio" },
        // { text:'Total Moneda Local' ,value: "proyeccion_total_monlocal" },
        // { text:'Total Conversion' ,value: "proyeccion_total_conversionext" },
        // { text:'Total Dolar' ,value: "proyeccion_total_monext" },
        { text: "Proyectado (USD)", value: "proyeccion_total_proyectado_ext" },
        { text: "Usuario Creación", value: "entitie_namelong" },
        { text: "Estado", value: "proyeccion_estado" },
        { text: "Aprobado", value: "proyeccion_aprobadoflag" },
        { text: "Acciones", value: "action" },
      ],
      items: [
        {
          id: "1",
          correlativo: "000001",
          description: "Primera Proyección",
          anio: "2023",
          mes: "Enero",
          monto: 2394.9,
          user: "Sistema",
          status: true,
          aprobado: true,
        },
      ],
      loading: false,
      dialogn: false,
      generarflag: false,
    };
  },
  methods: {
    ...mapActions([
      "getProyeccion",
      "_getChargeMonth",
      "_getChargeYear",
      "copiarProyeccion",
      "eliminarProyeccion",
      "primeraProyeccion",
    ]),
    async pProyeccion() {
      let data = {
        id_month: this.id_monthn,
        id_year: this.id_yearn,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,
      };
      await this.primeraProyeccion(data);
      this.dialogn = false;
    },
    ver(id) {
      this.$router.push({ name: "verProyeccion", params: { id: id } });
    },
    editar(id) {
      this.$router.push({ name: "editarProyeccion", params: { id: id } });
    },
    async eliminar(id) {
      this.$store.state.spiner = true;
      let data = { id: id };
      await this.eliminarProyeccion(data);
      data = {};
      await this.getProyeccion(data);
      this.$store.state.spiner = false;
    },
    copiar(item) {
      this.id_month = "";
      this.id_year = "";
      this.item = item;
      this.dialog = true;
    },
    async copyProyeccion() {
      this.loading = true;
      let data = {
        id: this.item.proyeccion_id,
        id_month: this.id_month,
        id_year: this.id_year,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,
      };

      await this.copiarProyeccion(data);
      data = {
        id_month: "",
        id_year: "",
        correlativo: "",
        total_proyectado_ext: "",
        estado: "",
        aprobadoflag: "",
      };
      await this.getProyeccion(data);
      this.loading = false;
      this.dialog = false;
      this.id_month = "";
      this.id_year = "";
    },
    async filtrar() {
      let data = {
        id_month: this.id_month ? this.id_month : "",
        id_year: this.id_year ? this.id_year : "",
        correlativo: this.correlativo ? this.correlativo : "",
        total_proyectado_ext: this.total_proyectado_ext
          ? this.total_proyectado_ext
          : "",
        estado: this.estado ? this.estado : "",
        aprobadoflag: this.aprobado ? this.aprobado : "",
      };
      await this.getProyeccion(data);
      this.filtar = false;
    },
    clearestado() {
      this.estado = "";
    },
    clearaprobado() {
      this.aprobado = "";
    },
  },

  async mounted() {
    let data = {
      id_month: "",
      id_year: "",
      correlativo: "",
      total_proyectado_ext: "",
      estado: "",
      aprobadoflag: "",
    };
    this.$store.state.spiner = true;
    await Promise.all([
      this.getProyeccion(data),
      this._getChargeMonth(),
      this._getChargeYear(),
    ]);
    this.$store.state.proyecciones.listProyeccion.length == 0
      ? (this.generarflag = true)
      : (this.generarflag = false);
    this.$store.state.spiner = false;
    this.$store.state.drawer = false;
  },
};
</script>

<style></style>
