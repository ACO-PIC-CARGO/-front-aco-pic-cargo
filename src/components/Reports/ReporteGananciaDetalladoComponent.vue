<template>
  <v-container fluid>
    
      <!-- CONTENEDOR PRINCIPAL -->
      <v-card class="main-card" flat>
        <!-- HEADER -->
        <div class="header-section">
          <v-btn text small class="back-btn" @click="volverReporte">
            <v-icon small left>mdi-arrow-left</v-icon>
            Volver al reporte general
          </v-btn>

          <h1 class="page-title">DETALLE DE EXPEDIENTES</h1>

          <!-- MENSAJE INFORMATIVO -->
          <div class="info-message">
            <v-icon small>mdi-information</v-icon>

            <span>
              Los datos mostrados corresponden al año
              <strong>{{ anio }}</strong>
              y a los meses seleccionados:
              <strong>{{ mesesTexto }}</strong
              >.
            </span>
          </div>
        </div>

        <!-- FILTROS -->
        <v-card class="filters-card" flat outlined>
          <v-row align="center" no-gutters class="filters-row">
            <!-- AÑO -->
            <v-col cols="12" sm="2" class="filter-col">
              <label>Año</label>

              <v-select
                v-model="anio"
                :items="anios"
                dense
                outlined
                hide-details
                class="filter-input"
                style="max-width: 130px"
                prepend-inner-icon="mdi-calendar-month"
              />
            </v-col>

            <!-- MESES -->
            <v-col cols="12" sm="3" md="2" class="filter-col">
              <label>Meses</label>

              <v-menu
                v-model="menuMeses"
                offset-y
                :close-on-content-click="false"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    outlined
                    dense
                    block
                    class="month-selector"
                  >
                    <span>
                      Seleccionar meses ({{ mesesSeleccionados.length }})
                    </span>

                    <v-icon small right> mdi-chevron-down </v-icon>
                  </v-btn>
                </template>

                <v-card class="">
                  <v-list dense>
                    <!-- TODOS -->
                    <v-list-item dense @click="toggleTodos">
                      <v-list-item-action>
                        <v-checkbox
                          :input-value="todosLosMeses"
                          hide-details
                          color="primary"
                        />
                      </v-list-item-action>

                      <v-list-item-content>
                        <v-list-item-title> Todos los meses </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>

                    <v-divider />

                    <!-- MESES -->
                    <v-list-item
                      v-for="mes in meses"
                      :key="mes.value"
                      dense
                      @click="toggleMes(mes.value)"
                    >
                      <v-list-item-action>
                        <v-checkbox
                          :input-value="mesesSeleccionados.includes(mes.value)"
                          hide-details
                          color="primary"
                        />
                      </v-list-item-action>

                      <v-list-item-content>
                        <v-list-item-title>
                          {{ mes.text }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>

                  <v-divider />

                  <div class="menu-actions">
                    <v-btn text small @click="cancelarMeses"> Cancelar </v-btn>

                    <v-btn
                      color="primary"
                      small
                      depressed
                      @click="aplicarMeses"
                    >
                      Aplicar
                    </v-btn>
                  </div>
                </v-card>
              </v-menu>
            </v-col>

            <!-- COMPARAR -->
            <v-col
              cols="12 mt-4 ml-5"
              sm="3"
              md="2"
              class="filter-col compare-col"
            >
              <v-btn outlined dense class="compare-btn" @click="compararAnos">
                <v-icon small left> mdi-calendar-sync </v-icon>

                Comparar con años anteriores
              </v-btn>
            </v-col>

            <v-spacer />

            <!-- IMPRIMIR -->
            <v-col cols="6" sm="2" md="2" class="action-col mt-4 mx-10">
              <v-btn outlined block class="print-btn" @click="imprimirPDF">
                <v-icon small left> mdi-printer </v-icon>

                Imprimir PDF
              </v-btn>
            </v-col>

            <!-- FILTROS -->
            <v-col cols="6" sm="2" md="2" class="action-col mt-4 mx-10">
              <v-btn
                color="primary"
                block
                depressed
                class="apply-filter-btn"
                @click="aplicarFiltros"
              >
                <v-icon small left> mdi-filter </v-icon>

                Aplicar filtros
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- KPIs -->
        <v-row class="kpi-row" no-gutters>
          <!-- EXPEDIENTES -->
          <v-col cols="12" sm="6" md="3">
            <div class="kpi-card">
              <div>
                <v-icon color="blue" class="mr-5" size="50px">
                  mdi-folder-open
                </v-icon>
              </div>

              <div class="kpi-content">
                <div class="kpi-label">
                  TOTAL
                  <br />
                  EXPEDIENTES
                </div>

                <div class="kpi-value blue-text">
                  {{ resumen.totalExpedientes }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- CLIENTES -->
          <v-col cols="12" sm="6" md="3">
            <div class="kpi-card">
              <div>
                <v-icon color="orange" class="mr-5" size="50px">
                  mdi-account-group
                </v-icon>
              </div>

              <div class="kpi-content">
                <div class="kpi-label">
                  TOTAL
                  <br />
                  CLIENTES
                </div>

                <div class="kpi-value orange-text">
                  {{ resumen.totalClientes }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- GANANCIA PRICING -->
          <v-col cols="12" sm="6" md="3">
            <div class="kpi-card">
              <div>
                <v-icon color="purple" class="mr-5" size="50px">
                  mdi-tag
                </v-icon>
              </div>

              <div class="kpi-content">
                <div class="kpi-label">GANANCIA S/ PRICING</div>

                <div class="kpi-value purple-text">
                  USD {{ formatMoney(resumen.gananciaPricing) }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- GANANCIA OPERACIONES -->
          <v-col cols="12" sm="6" md="3">
            <div class="kpi-card">
              <div>
                <v-icon color="green" class="mr-5" size="50px">
                  mdi-cog
                </v-icon>
              </div>

              <div class="kpi-content">
                <div class="kpi-label">GANANCIA S/ OPERACIONES</div>

                <div class="kpi-value green-text">
                  USD {{ formatMoney(resumen.gananciaOperaciones) }}
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- TABLA -->
        <div class="table-container">
          <v-simple-table class="expedientes-table">
            <thead>
              <tr>
                <th>MES</th>

                <th>EXPEDIENTE</th>

                <th>CLIENTE</th>

                <th>TIPO DE EMBARQUE</th>

                <th>
                  GANANCIA S/ PRICING<br />
                  (USD)
                </th>

                <th>
                  GANANCIA S/ OPERACIONES<br />
                  (USD)
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in expedientes" :key="item.id">
                <!-- MES -->
                <td>
                  <span class="month-badge" :class="'month-' + item.mesNumero">
                    {{ item.mes }}
                  </span>
                </td>

                <!-- EXPEDIENTE -->
                <td class="expediente">
                  {{ item.expediente }}
                </td>

                <!-- CLIENTE -->
                <td>
                  {{ item.cliente }}
                </td>

                <!-- TIPO -->
                <td>
                  <span
                    class="shipment-badge"
                    :class="shipmentClass(item.tipo)"
                  >
                    {{ item.tipo }}
                  </span>
                </td>

                <!-- PRICING -->
                <td class="money">
                  {{ formatMoney(item.pricing) }}
                </td>

                <!-- OPERACIONES -->
                <td class="money">
                  {{ formatMoney(item.operaciones) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </div>

        <!-- FOOTER TABLA -->
        <div class="table-footer">
          <div class="showing-text">
            Mostrando
            <strong>{{ expedientes.length }}</strong>
            de
            <strong>{{ resumen.totalExpedientes }}</strong>
            expedientes ({{ mesesTexto }} {{ anio }})
          </div>

          <div class="pagination-container">
            <v-btn
              outlined
              small
              min-width="32"
              class="page-btn"
              @click="paginaAnterior"
            >
              <v-icon small> mdi-chevron-left </v-icon>
            </v-btn>

            <v-btn
              v-for="page in 5"
              :key="page"
              small
              min-width="32"
              class="page-btn"
              :class="{ active: pagina === page }"
              @click="pagina = page"
            >
              {{ page }}
            </v-btn>

            <v-btn
              outlined
              small
              min-width="32"
              class="page-btn"
              @click="paginaSiguiente"
            >
              <v-icon small> mdi-chevron-right </v-icon>
            </v-btn>
          </div>
        </div>

        <!-- TOTAL -->
        <div class="total-row">
          <div class="total-label">TOTAL ({{ mesesTexto }} {{ anio }})</div>

          <div class="total-pricing">
            USD {{ formatMoney(resumen.gananciaPricing) }}
          </div>

          <div class="total-operaciones">
            USD {{ formatMoney(resumen.gananciaOperaciones) }}
          </div>
        </div>

        <!-- NOTA -->
        <div class="note-box">
          <div class="note-icon">
            <v-icon> mdi-information </v-icon>
          </div>

          <div>
            <div class="note-title">Nota:</div>

            <div class="note-text">
              Los datos mostrados corresponden al periodo y filtros
              seleccionados.
            </div>
          </div>
        </div>
      </v-card>
  </v-container>
</template>

<script>
export default {
  name: "DetalleExpedientes",

  data() {
    return {
      anio: 2026,

      anios: [2024, 2025, 2026],

      menuMeses: false,

      mesesSeleccionados: [1, 2, 3],

      mesesTemporales: [1, 2, 3],

      pagina: 1,

      meses: [
        {
          value: 1,
          text: "Enero",
        },
        {
          value: 2,
          text: "Febrero",
        },
        {
          value: 3,
          text: "Marzo",
        },
        {
          value: 4,
          text: "Abril",
        },
        {
          value: 5,
          text: "Mayo",
        },
        {
          value: 6,
          text: "Junio",
        },
        {
          value: 7,
          text: "Julio",
        },
        {
          value: 8,
          text: "Agosto",
        },
        {
          value: 9,
          text: "Septiembre",
        },
        {
          value: 10,
          text: "Octubre",
        },
        {
          value: 11,
          text: "Noviembre",
        },
        {
          value: 12,
          text: "Diciembre",
        },
      ],

      resumen: {
        totalExpedientes: 42,
        totalClientes: 68,
        gananciaPricing: 196602.91,
        gananciaOperaciones: 345789.02,
      },

      expedientes: [
        {
          id: 1,
          mes: "Enero",
          mesNumero: 1,
          expediente: "EXP-1456",
          cliente: "Importadora XYZ SAC",
          tipo: "LCL",
          pricing: 1250,
          operaciones: 1480,
        },
        {
          id: 2,
          mes: "Enero",
          mesNumero: 1,
          expediente: "EXP-1457",
          cliente: "Comercial Andina SRL",
          tipo: "FCL",
          pricing: 2100,
          operaciones: 2450,
        },
        {
          id: 3,
          mes: "Febrero",
          mesNumero: 2,
          expediente: "EXP-1460",
          cliente: "Distribuidora Norte SAC",
          tipo: "LCL",
          pricing: 3200,
          operaciones: 4150,
        },
        {
          id: 4,
          mes: "Febrero",
          mesNumero: 2,
          expediente: "EXP-1461",
          cliente: "Servicios Logísticos Peru SAC",
          tipo: "GRUPAL",
          pricing: 980,
          operaciones: 1320,
        },
        {
          id: 5,
          mes: "Marzo",
          mesNumero: 3,
          expediente: "EXP-1463",
          cliente: "Grupo Empresarial Lima SAC",
          tipo: "FCL",
          pricing: 1680,
          operaciones: 2230,
        },
        {
          id: 6,
          mes: "Marzo",
          mesNumero: 3,
          expediente: "EXP-1464",
          cliente: "Comercializadora del Sur SAC",
          tipo: "LCL",
          pricing: 2950,
          operaciones: 3870,
        },
        {
          id: 7,
          mes: "Marzo",
          mesNumero: 3,
          expediente: "EXP-1465",
          cliente: "Negocios Internacionales SAC",
          tipo: "GRUPAL",
          pricing: 1300,
          operaciones: 1650,
        },
        {
          id: 8,
          mes: "Marzo",
          mesNumero: 3,
          expediente: "EXP-1466",
          cliente: "Soluciones Industriales SAC",
          tipo: "FCL",
          pricing: 2480,
          operaciones: 3120,
        },
        {
          id: 9,
          mes: "Marzo",
          mesNumero: 3,
          expediente: "EXP-1467",
          cliente: "Inversiones Globales SAC",
          tipo: "LCL",
          pricing: 1150,
          operaciones: 1980,
        },
        {
          id: 10,
          mes: "Enero",
          mesNumero: 1,
          expediente: "EXP-1468",
          cliente: "Comercializadora Alpha SAC",
          tipo: "FCL",
          pricing: 3600,
          operaciones: 4560,
        },
      ],
    };
  },

  computed: {
    todosLosMeses() {
      return this.mesesSeleccionados.length === 12;
    },

    mesesTexto() {
      if (this.mesesSeleccionados.length === 0) {
        return "Ninguno";
      }

      if (this.mesesSeleccionados.length === 12) {
        return "Todos los meses";
      }

      return this.meses
        .filter((m) => this.mesesSeleccionados.includes(m.value))
        .map((m) => m.text)
        .join(", ");
    },
  },

  methods: {
    toggleMes(value) {
      const index = this.mesesTemporales.indexOf(value);

      if (index === -1) {
        this.mesesTemporales.push(value);
      } else {
        this.mesesTemporales.splice(index, 1);
      }
    },

    toggleTodos() {
      if (this.mesesTemporales.length === 12) {
        this.mesesTemporales = [];
      } else {
        this.mesesTemporales = this.meses.map((mes) => mes.value);
      }
    },

    cancelarMeses() {
      this.mesesTemporales = [...this.mesesSeleccionados];

      this.menuMeses = false;
    },

    aplicarMeses() {
      this.mesesSeleccionados = [...this.mesesTemporales];

      this.menuMeses = false;
    },

    aplicarFiltros() {
      console.log("Aplicando filtros:", {
        anio: this.anio,
        meses: this.mesesSeleccionados,
      });

      // Aquí llamarías tu API
    },

    compararAnos() {
      console.log("Comparar años anteriores");
    },

    imprimirPDF() {
      window.print();
    },

    volverReporte() {
      this.$router.go(-1);
    },

    paginaAnterior() {
      if (this.pagina > 1) {
        this.pagina--;
      }
    },

    paginaSiguiente() {
      this.pagina++;
    },

    formatMoney(value) {
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    shipmentClass(tipo) {
      switch (tipo) {
        case "LCL":
          return "shipment-lcl";

        case "FCL":
          return "shipment-fcl";

        case "GRUPAL":
          return "shipment-grupal";

        default:
          return "";
      }
    },
  },
};
</script>

<style scoped>
/* =========================================================
   GENERAL
========================================================= */

.detalle-page {
  min-height: 100vh;
  background: #f5f8fb;
  padding: 20px;
  font-family: "Montserrat", Arial, sans-serif;
  color: #17365d;
}

.main-card {
  /* max-width: 1100px; */
  margin: 0 auto;
  padding: 14px;
  border: 1px solid #e1e8ef;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(31, 60, 90, 0.04);
}

/* =========================================================
   HEADER
========================================================= */

.header-section {
  position: relative;
  text-align: center;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  border: 1px solid #dce6ef;
  color: #16447d !important;
  font-size: 11px !important;
  text-transform: none;
}

.page-title {
  margin: 0;
  padding-top: 0;
  color: #123f78;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.info-message {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 4px auto 12px;
  padding: 7px 14px;
  border-radius: 6px;
  background: #edf6fd;
  color: #24517e;
  font-size: 10px;
}

.info-message .v-icon {
  color: #1565c0;
}

/* =========================================================
   FILTROS
========================================================= */

.filters-card {
  padding: 8px 10px;
  border-color: #dce5ee !important;
  background: #fbfdff;
}

.filters-row {
  min-height: 45px;
}

.filter-col {
  padding-right: 10px;
}

.filter-col label {
  display: block;
  margin-bottom: 3px;
  color: #24446d;
  font-size: 10px;
  font-weight: 700;
}

.filter-input {
  font-size: 11px;
}

.filter-input >>> .v-input__slot {
  min-height: 34px !important;
}

.month-selector {
  min-height: 34px !important;
  justify-content: space-between;
  border-color: #cfdbe7 !important;
  color: #274b76 !important;
  font-size: 10px;
  text-transform: none;
}

.compare-col {
  display: flex;
  align-items: flex-end;
}

.compare-btn {
  min-height: 34px !important;
  border-color: #d3dfe9 !important;
  color: #234773 !important;
  font-size: 10px;
  text-transform: none;
}

.print-btn {
  min-height: 34px !important;
  border-color: #d7e1ea !important;
  color: #234773 !important;
  font-size: 10px;
  text-transform: none;
}

.apply-filter-btn {
  min-height: 34px !important;
  background: #073e7d !important;
  font-size: 10px;
  text-transform: none;
}

.months-menu {
  width: 150px;
}

.months-menu .v-list-item {
  min-height: 27px !important;
}

.months-menu .v-list-item__title {
  font-size: 10px;
}

.months-menu .v-input--selection-controls {
  margin: 0;
  padding: 0;
}

.menu-actions {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  padding: 7px;
}

.menu-actions .v-btn {
  font-size: 10px;
  text-transform: none;
}

.menu-actions .v-btn:last-child {
  background: #074387;
}

/* =========================================================
   KPI
========================================================= */

.kpi-row {
  margin-top: 10px;
  border: 1px solid #dce5ed;
  border-radius: 5px;
  overflow: hidden;
}

.kpi-card {
  display: flex;
  align-items: center;
  min-height: 66px;
  padding: 10px 22px;
  border-right: 1px solid #e0e7ed;
}

.kpi-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  margin-right: 14px;
}

.kpi-icon .v-icon {
  font-size: 35px;
}

.kpi-icon.blue .v-icon {
  color: #0c58bd;
}

.kpi-icon.orange .v-icon {
  color: #f27c00;
}

.kpi-icon.purple .v-icon {
  color: #9612a5;
}

.kpi-icon.green .v-icon {
  color: #087c43;
}

.kpi-label {
  color: #24446d;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.25;
}

.kpi-value {
  margin-top: 3px;
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}

.blue-text {
  color: #0c58bd;
}

.orange-text {
  color: #f27c00;
}

.purple-text {
  color: #8c169b;
}

.green-text {
  color: #087c43;
}

/* =========================================================
   TABLA
========================================================= */

.table-container {
  margin-top: 10px;
  border: 1px solid #dbe4eb;
  border-radius: 5px;
  overflow: hidden;
}

.expedientes-table {
  width: 100%;
}

.expedientes-table >>> table {
  width: 100%;
  border-collapse: collapse;
}

.expedientes-table >>> thead th {
  height: 37px !important;
  padding: 5px 8px !important;
  background: #063c79 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  text-align: center !important;
  white-space: nowrap;
}

.expedientes-table >>> tbody td {
  height: 27px !important;
  padding: 4px 9px !important;
  border-right: 1px solid #e0e6eb;
  border-bottom: 1px solid #e5eaef;
  color: #24446d;
  font-size: 9px !important;
}

.expedientes-table >>> tbody tr:hover {
  background: #f6faff;
}

.expediente {
  font-weight: 600;
}

.money {
  text-align: right;
  font-weight: 500;
}

/* =========================================================
   BADGES
========================================================= */

.month-badge {
  display: inline-block;
  min-width: 55px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-align: center;
}

.month-1 {
  background: #dbeeff;
  color: #1461a7;
}

.month-2 {
  background: #d9f1dc;
  color: #24752f;
}

.month-3 {
  background: #ffe4d0;
  color: #d05d1a;
}

.shipment-badge {
  display: inline-block;
  min-width: 52px;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
}

.shipment-lcl {
  background: #d9ebff;
  color: #1764a6;
}

.shipment-fcl {
  background: #d9f2d8;
  color: #267230;
}

.shipment-grupal {
  background: #ffe5d3;
  color: #b8581d;
}

/* =========================================================
   TABLE FOOTER
========================================================= */

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
}

.showing-text {
  color: #315478;
  font-size: 9px;
}

.pagination-container {
  display: flex;
  gap: 3px;
}

.page-btn {
  min-width: 27px !important;
  height: 25px !important;
  padding: 0 !important;
  border: 1px solid #d8e2eb !important;
  color: #234773 !important;
  font-size: 10px !important;
}

.page-btn.active {
  background: #063f7e !important;
  border-color: #063f7e !important;
  color: white !important;
}

/* =========================================================
   TOTAL
========================================================= */

.total-row {
  display: grid;
  grid-template-columns: 1fr 200px 200px;
  min-height: 39px;
  border-radius: 0 0 5px 5px;
  overflow: hidden;
  background: #063f7e;
  color: white;
}

.total-label,
.total-pricing,
.total-operaciones {
  display: flex;
  align-items: center;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 700;
}

.total-pricing,
.total-operaciones {
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

/* =========================================================
   NOTE
========================================================= */

.note-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 8px;
  border: 1px solid #cfddec;
  border-radius: 5px;
  background: #fbfdff;
}

.note-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  border-radius: 50%;
  background: #e8f2ff;
}

.note-icon .v-icon {
  color: #0a59b3;
  font-size: 20px;
}

.note-title {
  color: #234773;
  font-size: 11px;
  font-weight: 700;
}

.note-text {
  color: #52708e;
  font-size: 8px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 800px) {
  .detalle-page {
    padding: 8px;
  }

  .page-title {
    margin-top: 35px;
    font-size: 20px;
  }

  .back-btn {
    position: relative;
    display: block;
    width: fit-content;
  }

  .info-message {
    font-size: 9px;
  }

  .kpi-card {
    border-bottom: 1px solid #e0e7ed;
  }

  .table-container {
    overflow-x: auto;
  }

  .expedientes-table {
    min-width: 850px;
  }

  .table-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .total-row {
    grid-template-columns: 1fr;
  }

  .total-label,
  .total-pricing,
  .total-operaciones {
    min-height: 35px;
  }

  .total-pricing,
  .total-operaciones {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
  }
}

@media print {
  .detalle-page {
    padding: 0;
    background: white;
  }

  .back-btn,
  .filters-card,
  .pagination-container {
    display: none !important;
  }

  .main-card {
    max-width: none;
    border: none;
    box-shadow: none;
  }
}
</style>
