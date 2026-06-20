<template>
  <div>
    <v-dialog v-model="$store.state.reportsDialog" width="600" persistent>
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Filtros Generales
        </v-card-title>

        <v-card-text class="mt-5">
          <v-autocomplete
            :items="itemsStatusExpedientes"
            v-model="filtro.status_op"
            item-value="id"
            item-text="name"
            label="Estado de Expediente Operativo"
            dense
          ></v-autocomplete>
          <v-autocomplete
            :items="itemsStatusExpedientes"
            v-model="filtro.status_admin"
            item-value="id"
            item-text="name"
            label="Estado de Expediente Administrativo"
            dense
          ></v-autocomplete>
          <v-autocomplete
            :items="itemsSentido"
            item-value="id"
            item-text="name"
            label="Sentido"
            v-model="filtro.sentido"
            dense
          ></v-autocomplete>
          <p class="my-0 py-0">Confirmación Salida</p>
          <v-radio-group v-model="filtro.salidaflag" row dense>
            <v-radio label="Si" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
            <v-radio label="Todos" :value="null"></v-radio>
          </v-radio-group>
          <p class="my-0 py-0">Confirmación Llegada</p>
          <v-radio-group v-model="filtro.llegadaflag" row dense>
            <v-radio label="Si" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
            <v-radio label="Todos" :value="null"></v-radio>
          </v-radio-group>
          <p class="my-0 py-0">Confirmación Disponibilidad</p>
          <v-radio-group v-model="filtro.disponibilidadflag" row dense>
            <v-radio label="Si" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
            <v-radio label="Todos" :value="null"></v-radio>
          </v-radio-group>
          <v-autocomplete
            :items="$store.state.itemsOperadorList"
            item-value="id"
            item-text="namelong"
            label="Operador"
            v-model="filtro.id_operativo"
            clearable
            dense
          ></v-autocomplete>
          <p>Fecha de Disponibilidad</p>
          <FormatFecha
            :dense="true"
            label="Fecha Desde"
            id="filtroDesde"
            v-model="filtro.desde"
          />
          <FormatFecha
            :dense="true"
            label="Fecha Hasta"
            id="filtroHasta"
            v-model="filtro.hasta"
          />
          <!-- <v-text-field v-model="filtro.desde" type="date" label="Fecha Inicio">
          </v-text-field>
          <v-text-field v-model="filtro.hasta" type="date" label="Fecha Final">
          </v-text-field> -->
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :loading="loading"
            text
            @click="refreshReport()"
          >
            BUSCAR
          </v-btn>
          <v-btn
            color="error"
            :loading="loading"
            text
            @click="$store.state.reportsDialog = !$store.state.reportsDialog"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card elevation="0">
      <v-card-title>
        LISTA DE EXPEDIENTES MASTER's
        <v-btn
          @click="$store.state.reportsDialog = !$store.state.reportsDialog"
          class="ml-4"
          rounded
          elevation="0"
          color="primary"
          :loading="loading"
          >FILTRAR</v-btn
        ><v-btn
          @click="_generatePDF()"
          class="ml-4"
          rounded
          elevation="0"
          color="success"
          :loading="loading"
          >GENERAR PDF</v-btn
        >
        <v-spacer></v-spacer>
        - Leyenda
        <span
          style="
            background: #00ea80;
            width: 20px;
            height: 20px;
            border-radius: 250px;
            margin-left: 10px;
            margin-right: 20px;
          "
        ></span>
        Cargas Llegadas |
        <span
          style="
            background: #fddd0c;
            width: 20px;
            height: 20px;
            border-radius: 250px;
            margin-left: 10px;
            margin-right: 20px;
          "
        ></span>
        Cargas a 5 días de llegar
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="$store.state.itemsReportFileAll"
        item-key="index"
        :loading="loading"
        disable-pagination
        fixed-header
        disable-sort
        hide-default-footer
        class="div_table__Main"
        height="650"
        dense
      >
        <template v-slot:item="{ item }">
          <tr :style="{ backgroundColor: item.background }">
            <td width="15%">
              <p class="ma-0">
                <b>{{ item.code_master }}</b>

                <!-- <b></b> -->
              </p>
              <p class="ma-0">{{ item.modality }} {{ item.shipment }}</p>
              <p class="ma-0">{{ item.port_begin }}</p>
              <p class="ma-0">{{ item.port_end }}</p>
              <p class="ma-0">Salida: {{ getFecha(item.fecha_eta) }}</p>
              <p class="ma-0">Llegada: {{ getFecha(item.fecha_etd) }}</p>
              <p class="ma-0">
                Disponibilidad:{{ getFecha(item.fecha_disponibilidad) }}
              </p>
              <p class="ma-0">Incoterms: {{ item.incoterms }}</p>
            </td>
            <td width="40%">
              <p class="ma-0">Cliente: {{ item.listhouse }}</p>
              <p class="ma-0"><b>Comentarios:</b></p>
              <p
                class="ma-0"
                v-for="(i, index) in item.comentario"
                :key="index"
              >
                {{ i.fecha }} ({{ i.namelong }}) :
                {{ i.comentario }}
              </p>
            </td>
            <td width="20%">
              <p v-for="(telex,index) in item.house_telex" :key="index">
                  {{ telex.nombrecompleto }} : {{ telex.fechaconfirmaciontelex }}
              </p>
              
              </td>
            <td width="30%">
              <p class="ma-0">Operador:{{ item.operador }}</p>

              <p class="ma-0">Fecha Registro:{{ getFecha(item.created) }}</p>
              <p class="ma-0">
                Status Expediente Op.:{{
                  item.statuslock == 0 ? "Abierto" : "Cerrado"
                }}
              </p>
              <p class="ma-0">
                Status Expediente Adm.:{{
                  item.statuslockadm == 0 ? "Abierto" : "Cerrado"
                }}
              </p>
            </td>
            <v-divider></v-divider>
          </tr>
        </template>
      </v-data-table>

      <!-- este es el pie de pagina -->
      <v-container class="div__total">
        <v-row>
          <v-col cols="12" md="3">
            <p>
              Total de Expedientes Master:
              {{ $store.state.itemsReportFileAll.length }}
            </p>
          </v-col>

          <v-col cols="12" md="2">
            <p>
              Total Llegados:
              {{
                $store.state.itemsReportFileAll.filter((v) => v.orden == 1)
                  .length
              }}
            </p>
            <p>
              Total por Llegar:
              {{
                $store.state.itemsReportFileAll.filter((v) => v.orden == 2)
                  .length
              }}
            </p>
            <p>
              Total de Otras:
              {{
                $store.state.itemsReportFileAll.filter((v) => v.orden == 3)
                  .length
              }}
            </p>
          </v-col>

          <v-col cols="12" md="5">
            <v-simple-table dense>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Operador</th>
                    <th class="text-left">Cerradas</th>
                    <th class="text-left">Abiertas</th>
                    <th class="text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in resumenOperador" :key="index">
                    <td>{{ item.operador }}</td>
                    <td>{{ item.totalAbiertas }}</td>
                    <td>{{ item.totalCerradas }}</td>
                    <td>{{ item.totalFiles }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
export default {
  name: "listMasterCom",
  props: {
    // statusReport: Boolean,
    statusList: String,
  },
  components: {
    FormatFecha,
  },
  data() {
    return {
      search: "",
      filterFlag: false,
      dialog: false,
      filtro: {
        status_op: "0",
        status_admin: "",
        sentido: "",
        desde: "",
        id_operativo: "",
        hasta: "",
        salidaflag: null,
        llegadaflag: null,
        disponibilidadflag: null,
      },
      itemsStatusExpedientes: [
        { id: "0", name: "Abierto" },
        { id: "1", name: "Cerrado" },
        { id: "", name: "Todos" },
      ],
      itemsOperadores: [
        { id: "9", name: "ANDREINA REYES" },
        { id: "10", name: "HENRRY CISNEROS" },
        { id: "", name: "TODOS" },
      ],
      itemsSentido: [
        { id: "1", name: "Importación" },
        { id: "2", name: "Exportación" },
        { id: "", name: "Todos" },
      ],

      headers: [
        { text: "EXP MASTER", value: "datos_expedientes" },
        {
          text: "GENERALES EMBARQUE",
          align: "start",
          value: "datos_embarque",
        },

        { text: "Telex", value: "house_telex" },
        { text: "OPERADOR / FECHAS", value: "datos_operador" },
      ],
      loading: false,
      resumenOperador: [],
    };
  },
  // created() {
  //   this._getOperador();
  // },

  async mounted() {
    this.loading = true;
    await this._getOperador();
    await this._getControlFileAll(this.filtro);
    await this.getResumen();
    this.loading = false;
  },
  computed: {
    ...mapState([
      "itemsHouseListAll",
      "itemsReportFileAll",
      "itemsOperadorList",
    ]),
  },
  methods: {
    ...mapActions([
      "_getHouseListAll",
      "_getControlFileAll",
      "_getControlFileAllFilter",
      "_getOperador",
      "exportReporteFile",
      "_getTotalesAll",
      "_getTotales",
      "getModulesEntities",
    ]),
    getFecha(fecha) {
      moment.locale("es");
      return moment(fecha).format("DD-MMM-YYYY");
    },

    getResumen() {
      let data = this.$store.state.itemsReportFileAll;
      const operadoresInfo = {};

      // Itera sobre las etiquetas
      data.forEach((etiqueta) => {
        const operador = etiqueta.operador;
        if (!operadoresInfo[operador]) {
          operadoresInfo[operador] = {
            operador: operador,
            totalAbiertas: 0,
            totalCerradas: 0,
            totalFiles: 0,
          };
        }

        operadoresInfo[operador].totalFiles++;

        if (etiqueta.statuslock === 1) {
          operadoresInfo[operador].totalAbiertas++;
        } else if (etiqueta.statuslock === 0) {
          operadoresInfo[operador].totalCerradas++;
        }
      });
      this.resumenOperador = operadoresInfo;
    },
    selectHouse(id) {
      this.$router.push("/home/folderBilling/billControlGastos/" + id);
    },
    async refreshReport() {
      this.loading = true;
      this.filterFlag = true;
      await this._getControlFileAll(this.filtro);
      await this.getResumen();
      this.$store.state.reportsDialog = false;
      this.filterFlag = false;
      this.loading = false;
    },

    getRowBackground(item) {
      const backgroundValue = item.background;
      return `background-color: ${backgroundValue};`;
    },

    async _generatePDF() {
      if (this.$store.state.itemsReportFileAll.length == 0) {
        Swal.fire({
          icon: "error",
          text: "No se encontraron registros",
        });
        return false;
      }

      await this.exportReporteFile(this.filtro);
    },

    getColor(color) {
      return `${color} !important`;
    },
  },
};
</script>

<style lang="scss" scoped>
.div_table__Main p {
  margin: 0px;
  font-size: 13px;
}

.div__total {
  box-shadow: -1px -49px 26px -46px rgba(191, 191, 191, 1);
}

.div__total p {
  margin: 0px;
}
.custom-data-table tbody tr:nth-child(odd) {
  background-color: #e6f7ff; /* Establece el color de fondo azul para las filas impares */
}
.table-data[data-v-02d9b950] {
  background: red;
}
</style>
