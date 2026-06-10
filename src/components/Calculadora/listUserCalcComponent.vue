<template>
  <v-card elevation="5">
    <v-card-title>
      <!-- <v-row>
        <v-col cols="4"> -->
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
      <!-- </v-col> -->
      <!-- <v-col> -->
      <v-spacer></v-spacer>
      <v-simple-table dense class="elevation-5">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Nuevos</th>
            <th>Recurente</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(i, index) in itemResumen" :key="index">
            <td>{{ getFecha(i.day) }}</td>
            <td>{{ i.new }}</td>
            <td>{{ i.recurrente }}</td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-spacer></v-spacer>

      <v-btn color="green" text @click="exportar()" :loading="loading"
        >Exportar</v-btn
      >
      <!-- </v-col> -->
      <!-- </v-row> -->
    </v-card-title>
    <v-card-text>
      <v-divider></v-divider>
      <v-data-table
        :headers="headers"
        :items="$store.state.calculadoras.listUser"
        class="elevation-5"
        :search="search"
        item-key="index"
      >
        <!-- </v-data-table>
      <v-data-table
        dense
        :headers="headers"
        :items="$store.state.calculadoras.listUser"
        class="elevation-5"
        :search="search"
        :single-expand="singleExpand"
        show-expand
        :expanded.sync="expanded"
        item-key="index"
        multi-sort
      > -->
        <template v-slot:[`item.accion`]="{ item }">
          <v-btn x-small icon color="primary" @click="openCall(item)">
            <v-icon>mdi-phone</v-icon>
          </v-btn>
          <v-btn x-small icon color="info" @click="openHistoryCall(item)">
            <v-icon>mdi-clipboard-text-clock</v-icon>
          </v-btn>
        </template>
        <template v-slot:expanded-item="{ item }">
          <td :colspan="headers.length" class="px-3">
            <v-simple-table>
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Token</th>
                  <th>Tipo Carga</th>
                  <th>Fecha Registro</th>
                  <th>Peso</th>
                  <th>Volumen</th>
                  <th>Valor Mercancia</th>
                  <th>Contenedor(s)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(i, index) in item.list_cotizacion" :key="index">
                  <td>
                    <v-btn
                      icon
                      color="primary"
                      v-if="i.esfcl"
                      @click="obtenerFCL(i.reporte_token, item)"
                      ><v-icon>mdi-eye</v-icon></v-btn
                    >
                    <v-btn
                      icon
                      color="success"
                      v-if="i.eslcl"
                      @click="obtenerLCL(i.reporte_token, item)"
                      ><v-icon>mdi-eye</v-icon></v-btn
                    >
                    <v-btn
                      icon
                      color="info"
                      v-if="i.esaereo"
                      @click="obtenerAEREO(i.reporte_token, item)"
                      ><v-icon>mdi-eye</v-icon></v-btn
                    >
                  </td>
                  <td>{{ i.reporte_token }}</td>
                  <td>{{ i.reporte_tipo_carga }}</td>
                  <td>
                    {{ obtener_fecha(i.reporte_datecreation) }}
                  </td>
                  <td>{{ i.reporte_peso }}</td>
                  <td>{{ i.reporte_volumen }}</td>
                  <td>{{ i.reporte_input_valor_mercancia }}</td>
                  <td>
                    <p v-for="c in i.reporte_contenedores" :key="c">
                      Tipo Contenedor: {{ c.contenedor }} Cantidad:
                      {{ c.cant_contenedor }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </td>
        </template>
      </v-data-table>
    </v-card-text>
    <v-dialog
      v-model="dialogCalls"
      scrollable
      persistent
      :overlay="false"
      max-width="50%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Registro de Llamadas : {{ user.usuario_nombre }} -
          {{ user.usuario_telefono }} -
          {{ user.usuario_email }}
          <v-spacer></v-spacer>
          <v-btn icon color="default" text @click="dialogCalls = !dialogCalls">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCall">
            <v-select
              :items="$store.state.calculadoras.cboStatus"
              label="Estado de la llamada"
              item-text="status_description"
              item-value="status_id"
              v-model="call.statuscall"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-select>
            <v-text-field
              id="txtfecha"
              label="Fecha y Hora"
              type="datetime-local"
              v-model="call.date"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-text-field>
            <v-textarea
              label="Comentario"
              v-model="call.comentario"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-textarea>
            <v-autocomplete
              :items="$store.state.pricing.listEjecutivo"
              label="Ejecutivo."
              dense
              search
              item-text="name"
              item-value="id_entitie"
              v-model="call.identities"
              :rules="[(v) => !!v || 'Dato Requerido']"
              return-object
            ></v-autocomplete>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" text @click="registrarLlamada()">
            Registrar
          </v-btn>
          <v-btn color="warning" @click="dialogCalls = !dialogCalls" text
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCallHistory"
      scrollable
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Registro de Llamadas : {{ user.usuario_nombre }} -
          {{ user.usuario_telefono }} -
          {{ user.usuario_email }}
          <v-spacer></v-spacer>
          <v-btn
            icon
            color="default"
            @click="dialogCallHistory = !dialogCallHistory"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersCall"
            :items="calls"
            class="elevation-1"
            item-key="id"
            loading="true"
          >
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCotizacion"
      scrollable
      persistent
      :overlay="false"
      max-width="90%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          <h1>{{ title }}</h1>
          <v-spacer></v-spacer>
          <v-btn
            icon
            color="default"
            @click="dialogCotizacion = !dialogCotizacion"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert color="#2A3B4D" dark border="start">
            INFORMACIÓN DE LA CARGA
          </v-alert>
          <v-row>
            <v-col cols="6">
              <ul>
                <li>Transporte:{{ datos.tipo }}</li>
                <li>
                  Ruta Origen:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].detalles_calculos.pais_origen +
                        " - " +
                        datos.flete[0].detalles_calculos.puerto_origen
                      : ""
                  }}
                </li>
                <li>
                  Ruta Destino:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].detalles_calculos.pais_destino +
                        " - " +
                        datos.flete[0].detalles_calculos.puerto_destino
                      : ""
                  }}
                </li>
                <li>
                  Contenido de carga :
                  {{
                    datos.flete[0]
                      ? datos.tipo === "Maritimo - Completo"
                        ? conver_conten(datos.flete)
                        : datos.flete[0].input_cantidad_bultos +
                          " Bultos, " +
                          datos.flete[0].input_peso +
                          " Kl, " +
                          datos.flete[0].input_volumen +
                          " M3 "
                      : ""
                  }}
                </li>
                <li>
                  Gastos portuarios:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_calcular_gastos_y_almacen_aduanero
                        ? " SI"
                        : " NO"
                      : ""
                  }}
                </li>
              </ul>
            </v-col>
            <v-col cols="6">
              <ul>
                <li>
                  Valor Mercancia:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_calcular_inpuestos_y_permisos
                        ? datos.flete[0].input_valor_mercancia
                        : " NO COTIZADO"
                      : ""
                  }}
                </li>
                <li>
                  Servicios / Impuestos de Aduana:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_calcular_inpuestos_y_permisos
                        ? " SI"
                        : " NO"
                      : ""
                  }}
                </li>
                <li>
                  Transporte a Domicilio:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_calcular_transporte
                        ? " SI"
                        : " NO"
                      : ""
                  }}
                </li>
                <li>
                  Seguro de Mercancia:
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_calcular_seguro_mercancia
                        ? " SI"
                        : " NO"
                      : ""
                  }}
                </li>
                <li>Naviera / Agente: {{ datos.naviera }}</li>

                <li>
                  {{
                    datos.flete[0]
                      ? datos.flete[0].input_ha_cotizado
                        ? " Segunda Importación"
                        : " Primera Importación"
                      : ""
                  }}
                </li>
              </ul>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <v-alert color="#2A3B4D" dark border="start"> GANANCIA </v-alert>

          <v-simple-table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>SUB ITEM</th>
                <th>DETALLES</th>
                <th>PROFIT</th>
                <th>IGV</th>
                <th>PROFIT+IGV</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in datos.servicioLogistico" :key="item">
                <th scope="row">{{ item.tipo }}</th>
                <td>{{ item.nombre }}</td>
                <td>{{ item.detalles }}</td>
                <td>{{ item.valor.toFixed(2) }}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">--</th>
                <td>--</td>
                <td>TOTAL</td>
                <td>
                  {{
                    datos.servicioLogisticoTotal[0]
                      ? datos.servicioLogisticoTotal[0].toFixed(2)
                      : 0
                  }}
                </td>
                <td>
                  {{
                    datos.flete[0]
                      ? datos.flete[0].detalles_calculos.pais_destino ==
                          "PERU" && datos.totalIGVCostos > 0
                        ? ((datos.Serviciologis[0] / 3) * 2 * 0.18).toFixed(2)
                        : "n/a"
                      : "n/a"
                  }}
                </td>
                <td>
                  {{
                    datos.flete[0]
                      ? datos.flete[0].detalles_calculos.pais_destino ==
                          "PERU" && datos.totalIGVCostos > 0
                        ? (
                            (datos.Serviciologis[0] / 3) * 2 * 0.18 +
                            datos.servicioLogisticoTotal[0]
                          ).toFixed(2)
                        : "n/a"
                      : "n/a"
                  }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>
          <v-alert color="#2A3B4D" dark border><h1>VENTA</h1></v-alert>
          <v-simple-table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>VALOR</th>
                <th>IGV</th>
                <th>VALOR+IGV</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in datos.venta" :key="item">
                <th scope="row">{{ item.tipo }}</th>
                <td>{{ item.valor.toFixed(2) }}</td>
                <td>
                  {{
                    datos.flete[0].detalles_calculos
                      ? igv(
                          item,
                          datos.flete[0].detalles_calculos.pais_destino,
                          datos.totalIGVCostos,
                        )
                      : 0
                  }}
                </td>
                <td>
                  {{
                    datos.flete[0].detalles_calculos
                      ? igvMasTotal(
                          item,
                          datos.flete[0].detalles_calculos.pais_destino,
                          datos.totalIGVCostos,
                        )
                      : 0
                  }}
                </td>
              </tr>
              <tr>
                <th scope="row">TOTAL:</th>
                <td>
                  {{ datos.totalVenta ? datos.totalVenta : 0 }}
                </td>
                <td>
                  {{
                    datos.flete[0]
                      ? totalGeneralMasIGVGanancias(
                          datos.servicioLogisticoTotal[0],
                          datos.totalIGVCostos,
                          datos.flete[0].detalles_calculos.pais_destino,
                          datos.totalIGVCostos,
                        )
                      : 0
                  }}
                </td>
                <td>
                  {{
                    datos.flete[0]
                      ? totalGeneralMasIgvVEnta(
                          datos.servicioLogisticoTotal[0],
                          datos.totalIGVFleteCostos,
                          datos.flete[0].detalles_calculos.pais_destino,
                          datos.totalIGVCostos,
                          datos.totalVenta,
                        )
                      : 0
                  }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>
          <v-alert color="#2A3B4D" dark border><h1>COSTOS</h1></v-alert>
          <v-simple-table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>SUB ITEM</th>
                <th>TOTAL</th>
                <th>--</th>
                <th>IGV</th>
                <th>--</th>
                <th>TOTAL+IGV</th>
                <th>DETALLES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in datos.flete" :key="item">
                <th scope="row">{{ item.nombre }}</th>
                <td>{{ item.nombre }}</td>
                <td>{{ item.valor.toFixed(2) }}</td>
                <td>--</td>
                <td>n/a</td>
                <td>--</td>
                <td>{{ item.valor.toFixed(2) }}</td>
                <td>{{ item.detalles }}</td>
              </tr>
              <tr v-for="item in datos.desgloseValues" :key="item">
                <th scope="row">{{ item.tipo }}</th>
                <td>{{ item.nombre }}</td>
                <td>{{ item.valor.toFixed(2) }}</td>
                <td>--</td>
                <td>
                  {{
                    datos.flete[0]
                      ? igv(
                          item,
                          datos.flete[0].detalles_calculos.pais_destino,
                          datos.totalIGVCostos,
                        )
                      : 0
                  }}
                </td>
                <td>--</td>
                <td>
                  {{
                    igvMasTotal(
                      item,
                      datos.flete[0].detalles_calculos.pais_destino,
                      datos.totalIGVCostos,
                    )
                  }}
                </td>
                <td>{{ item.detalles }}</td>
              </tr>
              <tr>
                <td colspan="2">TOTAL</td>
                <td>{{ Number(datos.desgloseTotal).toFixed(2) }}</td>
                <td>--</td>
                <td>
                  {{
                    datos.flete[0]
                      ? totalGeneralCostos(
                          datos.totalIGVCostos,
                          datos.flete[0].detalles_calculos.pais_destino,
                        )
                      : 0
                  }}
                </td>
                <td>--</td>
                <td>
                  {{
                    datos.flete[0]
                      ? totalGeneralCostos(
                          datos.totalIGVFleteCostos,
                          datos.flete[0].detalles_calculos.pais_destino,
                        )
                      : 0
                  }}
                </td>
                <td>--</td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>

          <v-alert color="#2A3B4D" dark border
            ><h1>IMPUESTOS DE ADUANA</h1></v-alert
          >
          <v-simple-table>
            <thead>
              <tr>
                <th>TIPO</th>
                <th>IMPUESTOS BAJOS</th>
                <th>IMPUESTOS MEDIOS</th>
                <th>IMPUESTOS ALTOS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Percepciones 1era vez</th>
                <td>{{ datos.impuestosBajos[0] }}</td>
                <td>{{ datos.impuestosMedios[0] }}</td>
                <td>{{ datos.impuestosAltos[0] }}</td>
              </tr>
              <tr>
                <th scope="row">ISC</th>
                <td>{{ datos.impuestosBajos[1] }}</td>
                <td>{{ datos.impuestosMedios[1] }}</td>
                <td>{{ datos.impuestosAltos[1] }}</td>
              </tr>

              <tr>
                <th scope="row">IPM</th>
                <td>{{ datos.impuestosBajos[2] }}</td>
                <td>{{ datos.impuestosMedios[2] }}</td>
                <td>{{ datos.impuestosAltos[2] }}</td>
              </tr>

              <tr>
                <th scope="row">IGV</th>
                <td>{{ datos.impuestosBajos[3] }}</td>
                <td>{{ datos.impuestosMedios[3] }}</td>
                <td>{{ datos.impuestosAltos[3] }}</td>
              </tr>

              <tr>
                <th scope="row">AD valorem</th>
                <td>{{ datos.impuestosBajos[4] }}</td>
                <td>{{ datos.impuestosMedios[4] }}</td>
                <td>{{ datos.impuestosAltos[4] }}</td>
              </tr>
              <tr>
                <th scope="row">TOTAL</th>
                <td>
                  {{
                    datos.impuestosBajosTotal[0] > 0
                      ? "$ " + datos.impuestosBajosTotal[0]
                      : "No cotizado"
                  }}
                </td>
                <td>
                  {{
                    datos.impuestosMediosTotal[0] > 0
                      ? "$ " + datos.impuestosMediosTotal[0]
                      : "No cotizado"
                  }}
                </td>
                <td>
                  {{
                    datos.impuestosAltosTotal[0] > 0
                      ? "$ " + datos.impuestosAltosTotal[0]
                      : "No cotizado"
                  }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>
        </v-card-text>

        <v-card-actions> </v-card-actions>
        <!-- {{ $store.state.calculadoras.datosresumen }} -->
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import moment from "moment";
import funcion from "../mixins/funciones";
// import axios from '@/api/axios-config';;
export default {
  mixins: [funcion],
  data() {
    return {
      dialogCotizacion: false,
      expanded: [],
      singleExpand: false,
      search: "",
      dialogCalls: false,
      dialogCallHistory: false,
      loading: false,
      title: "",
      costos: [],
      headersResumen: [
        { text: "Dia", value: "day" },
        { text: "Nuevos", value: "new" },
        { text: "Recurente", value: "recurrente" },
      ],
      itemResumen: [],
      headers: [
        // { text: "Acciones", value: "accion" },
        // { text: "Fecha Última Actualizacion", value: "usuario_updated" },
        { text: "Cliente", value: "nombre" },
        { text: "Tipo", value: "tipo" },
        { text: "Puerto Origen", value: "port_origen" },
        { text: "Puerto Destino", value: "port_destino" },
        { text: "Peso", value: "peso" },
        { text: "Volumn", value: "volumen" },
        // { text: "", value: "servicios" },
        { text: "Valor Mercancía", value: "valormercancia" },
        { text: "Correo", value: "email" },
        { text: "Tel.", value: "telefono" },
      ],
      headersCall: [
        { text: "Acciones", value: "action" },
        { text: "Fecha Registro", value: "date" },
        { text: "Comentario", value: "comentario" },
        { text: "Estado", value: "estado" },
      ],
      user: {
        usuario_nombre: "",
        usuario_email: "",
      },
      call: {
        iduser: "",
        statuscall: "",
        isuser: "",
        date: "",
        comentario: "",
        fecha: new Date(),
        identities: JSON.parse(sessionStorage.getItem("dataUser"))[0]
          .id_entitie,
      },
      calls: [],
      datos: {
        desgloseKey: [],
        desglose: false,
        desgloseValues: [],
        desgloseValuesCostos: [],
        resumen: [],
        show: false,
        flete: [],
        impuestosBajos: [],
        totalVenta: [],
        impuestosMedios: [],
        impuestosAltos: [],
        honorarios: [],
        servicioLogistico: [],
        Serviciologis: [],
        impuestosAltosTotal: [],
        impuestosBajosTotal: [],
        impuestosMediosTotal: [],
        servicioLogisticoTotal: [],
        venta: [],
        token: [],
        tipo: [],
        totalIGVFleteCostos: [],
        totalIGVCostos: [],
        activar: false,
        cliente: "",
        contacto: "",
        correo: "",
        ejecutivo: "",
        naviera: [],
      },
    };
  },
  async mounted() {
    //this.$store.state.spiner = true;
    await this.getModulesEntities();
    moment.locale("es");
    let fechahora = moment(this.fecha).format("YYYY-MM-DDTHH:mm");
    this.call.date = fechahora;
    await this.getListUserCalc();
    await this.getCboStatus();
    this.calcResumen();
    let index = 0;
    this.$store.state.calculadoras.listUser.forEach((element) => {
      element.index = index;
      index++;
    });

    //this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "getListUserCalc",
      "ExportarListUser",
      "getCboStatus",
      "SetCall",
      "GetCotFCL",
      "GetCotLCL",
      "GetCotAereo",
      "GetCotFCLResumen",
      "GetCotLCLResumen",
      "GetCotAereoResumen",
      "getModulesEntities",
    ]),
    getFecha(fecha) {
      moment.locale("es");
      return moment(fecha).format("YYYY-MMM-DD");
    },
    async exportar() {
      this.loading = true;
      await this.ExportarListUser();
      this.loading = false;
    },
    openCall(user) {
      this.user = user;
      let fechahora = moment(this.fecha).format("YYYY-MM-DDTHH:mm");
      this.call.date = fechahora;
      this.dialogCalls = true;
    },
    async registrarLlamada() {
      if (this.$refs.frmCall.validate()) {
        let data = {
          iduser: this.user.usuario_id,
          statuscall: this.call.statuscall,
          isuser: this.user.usuario_system,
          date: moment(this.call.date).format("YYYY-MM-DD HH:mm"),
          comentario: this.call.comentario,
          identities: this.call.identities.id_entitie
            ? this.call.identities.name
            : `${JSON.parse(sessionStorage.getItem("dataUser"))[0].surname} ${
                JSON.parse(sessionStorage.getItem("dataUser"))[0].second_surname
              } ${JSON.parse(sessionStorage.getItem("dataUser"))[0].names}`,
        };
        this.$store.state.overlay = true;
        await this.SetCall(data);
        await this.getListUserCalc();

        this.call = {
          iduser: "",
          statuscall: "",
          isuser: "",
          date: "",
          comentario: "",
          fecha: new Date(),
        };
        this.dialogCalls = false;

        this.$store.state.overlay = false;
      }
    },
    calcResumen() {
      let items = [];
      let hoy = moment(new Date()).format("YYYY-MM-DD");
      if (this.$store.state.calculadoras.listUser.length > 0) {
        while (items.length <= 1) {
          if (
            this.$store.state.calculadoras.listUser.filter(
              (v) =>
                moment(v.usuario_creacion).format("YYYY-MM-DD") == hoy ||
                moment(v.usuario_updated).format("YYYY-MM-DD") == hoy,
            ).length > 0
          ) {
            items.push({
              day: hoy,
            });
          }
          hoy = moment(hoy).subtract(1, "days").format("YYYY-MM-DD");
        }
      }
      items.forEach((element) => {
        element.new = this.$store.state.calculadoras.listUser.filter(
          (v) =>
            moment(v.usuario_creacion).format("YYYY-MM-DD") == element.day &&
            v.list_cotizacion.length == 1,
        ).length;
        element.recurrente = this.$store.state.calculadoras.listUser.filter(
          (v) =>
            moment(v.usuario_creacion).format("YYYY-MM-DD") == element.day &&
            v.list_cotizacion.length != 1,
        ).length;
      });
      this.itemResumen = items;
    },
    openHistoryCall(item) {
      this.user = item;
      this.calls = item.list_call;

      this.dialogCallHistory = true;
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    obtener_fecha(date) {
      moment.locale("es");
      return moment(date).format("YYYY-MMM-DD HH:mm");
    },
    async obtenerFCL(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-FCL." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Maritimo - Completo";

      await this.GetCotFCL(token);
      await this.GetCotFCLResumen(token);
      await this.calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },
    async obtenerLCL(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-LCL." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Maritimo - Compartido";

      await this.GetCotLCL(token);
      await this.GetCotLCLResumen(token);
      await this.calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },

    async obtenerAEREO(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-AEREO." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Aereo";

      await this.GetCotAereo(token);
      await this.GetCotAereoResumen(token);
      await this.getModulesEntities();
      await this.calculoPrincpipal("FLETE AÉREO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },

    // -----------------------------------------------------------
    calculo(tipoCon) {
      let resumen2 = this.$store.state.calculadoras.datosresumen;

      let impuestosBajosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      let impuestosMediosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      let impuestosAltosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });
      var Serviciologistico;
      let preServiciologistico = resumen2
        .filter(function (item) {
          if (
            item.tipo == "SERVICIO LOGÍSTICO" ||
            item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
          ) {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      if (preServiciologistico.length > 1) {
        Serviciologistico = preServiciologistico
          .reduce(function (accumulator, current) {
            return [+accumulator + +current];
          })
          .map(function (duration) {
            return duration.toFixed(2);
          });
      } else {
        Serviciologistico = preServiciologistico;
      }

      let venta = resumen2.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS"
        ) {
          return item;
        }
      });

      this.datos.impuestosAltosTotal = impuestosAltosTotal;
      this.datos.impuestosMediosTotal = impuestosMediosTotal;
      this.datos.impuestosBajosTotal = impuestosBajosTotal;
      this.datos.Serviciologis = Serviciologistico;
      this.datos.venta = venta;
      this.datos.tipo = tipoCon;
    },
    // ----------------------------------------------------------------------
    calculoPrincpipal(transportes, tipoCon) {
      let response = this.$store.state.calculadoras.datos;
      let flete = response
        .filter(function (item) {
          if (item.tipo == transportes) {
            return item;
          }
        })
        .filter(function (item) {
          if (item.valor > 0) {
            return item;
          }
        });

      let impuestosBajos = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      // let IPM = response
      //   .filter(function (item) {
      //     if (
      //       item.tipo == "IMPUESTOS DE ADUANA BAJOS" &&
      //       item.nombre == "IPM"
      //     ) {
      //       return item;
      //     } else {
      //       return false;
      //     }
      //   })
      //   .map(function (duration) {
      //     if (duration !== false) {
      //       return duration.valor.toFixed(2);
      //     } else {
      //       return duration;
      //     }
      //   });

      let impuestosMedios = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      let impuestosAltos = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      let transporte = response.filter(function (item) {
        if (item.tipo == "TRANSPORTE DE MERCANCÍA") {
          return item;
        } else {
          return false;
        }
      });

      let honorarios = response.filter(function (item) {
        if (item.tipo == "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA") {
          return item;
        } else {
          return false;
        }
      });

      let seguro = response.filter(function (item) {
        if (item.tipo == "SEGURO DE MERCANCÍA SUGERIDO") {
          return item;
        } else {
          return false;
        }
      });

      let servicioLogistico = response.filter(function (item) {
        if (
          item.tipo == "SERVICIO LOGÍSTICO" ||
          item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
          item.detalles == "Ganancia"
        ) {
          return item;
        } else {
          return false;
        }
      });

      let desgloseValuesCostos = response.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== transportes &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.detalles !== "Ganancia" &&
          item.tipo !== "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA"
        ) {
          if (item.valor > 0) {
            return item;
          }
        }
      });

      let desgloseValues = response.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== transportes &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.detalles !== "Ganancia"
        ) {
          if (item.valor !== 0) {
            return item;
          }
        }
      });

      let PretotalIGVCostos, totalIGVCostos;

      switch (flete[0].detalles_calculos.pais_destino) {
        case "PERU":
          PretotalIGVCostos = response.filter(function (item) {
            if (
              item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
              item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
              item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
              item.tipo !== "SERVICIO LOGÍSTICO" &&
              item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
              item.tipo !== transportes &&
              item.tipo !== "FLETE" &&
              item.detalles !== "Ganancia" &&
              item.tipo !== "THCD" &&
              item.tipo !== "TCHD DOCUMENTACION" &&
              item.tipo !== "SEGURO DE MERCANCÍA SUGERIDO"
            ) {
              if (item.valor > 0) {
                return item;
              }
            }
          });
          totalIGVCostos = [0];

          if (PretotalIGVCostos.length > 1) {
            totalIGVCostos = PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.18).toFixed(2);
            })
              .reduce(function (accumulator, current) {
                return [+accumulator + +current];
              })
              .map(function (duration) {
                return duration.toFixed(2);
              });
          }

          break;
        case "PANAMA":
          PretotalIGVCostos = response.filter(function (item) {
            if (item.tipo == "PORT CHARGES" || item.tipo == "MANEJOS") {
              if (item.valor > 0) {
                return item;
              }
            }
          });
          totalIGVCostos = [0];

          if (PretotalIGVCostos.length > 1) {
            totalIGVCostos = PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.07).toFixed(2);
            })
              .reduce(function (accumulator, current) {
                return [+accumulator + +current];
              })
              .map(function (duration) {
                return duration.toFixed(2);
              });
          }

          break;
        case "VENEZUELA":
          totalIGVCostos = [0];
          break;

        default:
      }

      let desgloseTotal = response
        .filter(function (item) {
          if (
            item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
            item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
            item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
            item.tipo !== "SERVICIO LOGÍSTICO" &&
            item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
            item.detalles !== "Ganancia"
          ) {
            if (item.valor > 0) {
              return item;
            }
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        })
        .reduce(function (accumulator, current) {
          return [+accumulator + +current];
        });

      let preservicioLogisticoTotal = response
        .filter(function (item) {
          if (
            item.tipo == "SERVICIO LOGÍSTICO" ||
            item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
            item.detalles == "Ganancia"
          ) {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor;
        });
      var servicioLogisticoTotal;
      if (preservicioLogisticoTotal.length > 1) {
        servicioLogisticoTotal = preservicioLogisticoTotal.reduce(function (
          accumulator,
          current,
        ) {
          return [+accumulator + +current];
        });
      } else {
        servicioLogisticoTotal = preservicioLogisticoTotal;
      }

      let totalIGVFleteCostos =
        Number(desgloseTotal[0]) + Number(totalIGVCostos[0]);

      var totalVenta =
        Number(servicioLogisticoTotal[0]) + Number(desgloseTotal[0]);

      var naviera;
      switch (tipoCon) {
        case "Maritimo - Completo":
          {
            naviera = flete[0].detalles_calculos.naviera;
          }
          break;
        case "Maritimo - Compartido":
          {
            naviera = flete[0].detalles_calculos.agentes_lcl_nombre;
          }
          break;
        case "Aereo":
          {
            naviera = flete[0].detalles_calculos.agentes_aereo_nombre;
          }
          break;

        default:
      }

      this.datos.desgloseValues = desgloseValues;
      this.datos.desgloseValuesCostos = desgloseValuesCostos;
      this.datos.show = true;
      this.datos.flete = flete;
      this.datos.impuestosAltos = impuestosAltos;
      this.datos.impuestosMedios = impuestosMedios;
      this.datos.impuestosBajos = impuestosBajos;
      this.datos.servicioLogistico = servicioLogistico;
      this.datos.transporte = transporte;
      this.datos.seguro = seguro;
      this.datos.honorarios = honorarios;
      this.datos.naviera = naviera;
      this.datos.totalIGVFleteCostos = totalIGVFleteCostos.toFixed(2);
      this.datos.totalIGVCostos = totalIGVCostos[0];
      this.datos.servicioLogisticoTotal = servicioLogisticoTotal;
      this.datos.desgloseTotal = desgloseTotal[0];
      this.datos.totalVenta = totalVenta;
    },

    igv(item, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (
            item.tipo != "THCD" &&
            item.tipo != "TCHD DOCUMENTACION" &&
            item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
            item.tipo != "FLETE" &&
            item.tipo != "FLETE MARÍTIMO" &&
            item.tipo != "FLETE AÉREO" &&
            totalIGVCostos > 0
          ) {
            if (
              item.tipo == "SERVICIO LOGÍSTICO" ||
              item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
            ) {
              valor = ((item.valor / 3) * 2 * 0.18).toFixed(2);
            } else {
              valor = (item.valor * 0.18).toFixed(2);
            }
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (
            item.tipo == "PORT CHARGES" ||
            (item.tipo == "MANEJOS" && totalIGVCostos > 0)
          ) {
            valor = (item.valor * 0.07).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },
    igvMasTotal(item, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (
            item.tipo != "THCD" &&
            item.tipo != "TCHD DOCUMENTACION" &&
            item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
            item.tipo != "FLETE" &&
            item.tipo != "FLETE MARÍTIMO" &&
            item.tipo != "FLETE AÉREO" &&
            totalIGVCostos > 0
          ) {
            if (
              item.tipo == "SERVICIO LOGÍSTICO" ||
              item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
            ) {
              valor = ((item.valor / 3) * 2 * 0.18 + item.valor).toFixed(2);
            } else {
              valor = (item.valor * 1.18).toFixed(2);
            }
          } else {
            valor = item.valor;
          }

          break;
        case "PANAMA":
          if (
            item.tipo == "PORT CHARGES" ||
            (item.tipo == "MANEJOS" && totalIGVCostos > 0)
          ) {
            valor = (item.valor * 0.07 + item.valor).toFixed(2);
          } else {
            valor = item.valor;
          }

          break;
        case "VENEZUELA":
          valor = item.valor;
          break;

        default:
      }
      return valor;
    },
    totalGeneralCostos(item, pais) {
      var valor;
      switch (pais) {
        case "PERU":
          valor = item;
          break;
        case "PANAMA":
          valor = item;
          break;
        case "VENEZUELA":
          valor = "";
          break;

        default:
      }
      return valor;
    },
    totalGeneralMasIGVGanancias(item, item2, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (totalIGVCostos > 0) {
            valor = ((Number(item) / 3) * 2 * 0.18 + Number(item2)).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (totalIGVCostos > 0) {
            valor = Number(item2).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },
    totalGeneralMasIgvVEnta(
      servicioLogisticoTotal,
      totalIGVFleteCostos,
      pais,
      totalIGVCostos,
      totalVenta,
    ) {
      var valor;
      switch (pais) {
        case "PERU":
          if (totalIGVCostos > 0) {
            valor = (
              Number(totalIGVFleteCostos) +
              Number(
                (servicioLogisticoTotal / 3) * 2 * 0.18 +
                  servicioLogisticoTotal,
              )
            ).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (totalIGVCostos > 0) {
            valor = (Number(totalVenta) + Number(totalIGVCostos)).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },
    conver_conten(valor) {
      var contenedores = " ";
      var flete = valor[0].input_contenedores;
      for (var i = 0; i < flete.length; i++) {
        switch (flete[i][0]) {
          case 1:
            contenedores += flete[i][1] + "*20' STD, ";
            break;
          case 2:
            contenedores += flete[i][1] + "*40' STD, ";
            break;
          case 3:
            contenedores += flete[i][1] + "*40' HC, ";
            break;
          case 4:
            contenedores += flete[i][1] + "*40' NOR";
            break;

          default:
        }
      }
      return contenedores;
    },
  },
};
</script>

<style scoped>
.type {
  background: "#0d5084" !important;
  text-align: "center" !important;
}
</style>
