<template>
  <div class="reporte-ganancia px-5 py-4">
    <div class="titulo-reporte">REPORTE DE GANANCIA</div>

    <div class="filtro-anio">
      <v-select
        v-model="anioSeleccionado"
        :items="listaAnios"
        label="Año"
        outlined
        dense
        hide-details
        prepend-inner-icon="far fa-calendar-alt"
        class="select-anio"
        @change="cambiarAnio"
      />
    </div>

    <v-card outlined class="info-card">
      <div class="info-icon">
        <i class="fas fa-info"></i>
      </div>

      <div class="info-content">
        <div class="info-title">
          Este reporte considera las transacciones según la fecha de
          disponibilidad:
        </div>

        <ul>
          <li>
            Las fechas que caen dentro de enero se consideran en el mes de
            enero.
          </li>
          <li>
            Las fechas que caen dentro de febrero se consideran en el mes de
            febrero.
          </li>
          <li>
            Las fechas que caen dentro de marzo se consideran en el mes de
            marzo.
          </li>
        </ul>
      </div>
    </v-card>

    <div class="resumen-container">
      <!-- INGRESOS PRICING -->
      <div class="resumen-item">
        <div class="resumen-icon pricing-icon">
          <i class="fas fa-tag"></i>
        </div>

        <div class="resumen-label">
          INGRESOS SEGÚN<br />
          PRICING
        </div>

        <div class="resumen-value pricing-color">
          {{ formatMoney(totalMasterAgrupado.total_pr) }}
        </div>
      </div>

      <!-- INGRESOS OPERACIONES -->
      <div class="resumen-item">
        <div class="resumen-icon operaciones-icon">
          <i class="fas fa-cog"></i>
        </div>

        <div class="resumen-label">
          INGRESOS SEGÚN<br />
          OPERACIONES
        </div>

        <div class="resumen-value operaciones-color">
          {{ formatMoney(totalMasterAgrupado.total_op) }}
        </div>
      </div>

      <!-- EXPEDIENTES -->
      <div class="resumen-expedientes">
        <div class="grupo-titulo">
          <i class="far fa-folder-open"></i>
          <span>CANTIDAD DE EXPEDIENTES</span>
        </div>

        <div class="grupo-columnas">
          <div class="grupo-columna">
            <div class="columna-label">INDIVIDUALES</div>

            <div class="columna-value azul">
              {{ totalMasterAgrupado.total_individuales }}
            </div>
          </div>

          <div class="grupo-columna">
            <div class="columna-label">GRUPALES</div>

            <div class="columna-value azul">
              {{ totalMasterAgrupado.total_grupales }}
            </div>
          </div>
        </div>

        <div class="total-azul">
          <span>TOTAL EXPEDIENTES</span>
          <strong>{{ totalExpedientes }}</strong>
        </div>
      </div>

      <!-- CLIENTES -->
      <div class="resumen-clientes">
        <div class="grupo-titulo">
          <i class="fas fa-user-friends"></i>
          <span>CANTIDAD DE CLIENTES</span>
        </div>

        <div class="grupo-columnas">
          <div class="grupo-columna">
            <div class="columna-label">INDIVIDUALES</div>

            <div class="columna-value naranja">
              {{ totalMasterAgrupado.total_house_individuales }}
            </div>
          </div>

          <div class="grupo-columna">
            <div class="columna-label">
              GRUPALES
              <br />
              (10 a 15 c/u)
            </div>

            <div class="columna-value naranja">
              {{ totalMasterAgrupado.total_house_grupales }}
            </div>
          </div>

          <div class="grupo-columna total-columna">
            <div class="columna-label">TOTAL</div>

            <div class="columna-value naranja">
              {{ totalClientes }}
            </div>
          </div>
        </div>
      </div>

      <!-- TOTAL CLIENTES -->
      <div class="total-clientes-card">
        <div class="total-clientes-label">
          TOTAL CLIENTES<br />
          MANEJADOS<br />
          EN EL MES
        </div>

        <div class="total-clientes-value">
          {{ totalClientes }}
        </div>
      </div>
    </div>

    <!-- =========================================================
         TABLA
    ========================================================== -->
    <div class="tabla-wrapper">
      <table class="tabla-reporte">
        <!-- ===================== CABECERA ===================== -->
        <thead>
          <tr class="header-principal">
            <th rowspan="2" class="header-azul">MES</th>

            <th rowspan="2" class="header-azul">
              INGRESOS<br />
              SEGÚN PRICING
            </th>

            <th rowspan="2" class="header-azul">
              INGRESOS<br />
              SEGÚN OPERACIONES
            </th>

            <th colspan="2" class="header-azul">CANTIDAD DE EXPEDIENTES</th>

            <th rowspan="2" class="header-azul">
              TOTAL<br />
              EXPEDIENTES
            </th>

            <th colspan="2" class="header-azul">CANTIDAD DE CLIENTES</th>

            <th rowspan="2" class="header-naranja">
              TOTAL CLIENTES<br />
              MANEJADOS<br />
              EN EL MES
            </th>
          </tr>

          <tr class="header-secundario">
            <th class="header-azul">INDIVIDUALES</th>

            <th class="header-azul">GRUPALES</th>

            <th class="header-naranja">INDIVIDUALES</th>

            <th class="header-naranja">
              GRUPALES<br />
              (10 a 15 c/u)
            </th>
          </tr>
        </thead>

        <!-- ===================== CUERPO ===================== -->
        <tbody>
          <tr v-for="mes in totalMasterPorMes" :key="mes.mes">
            <!-- MES -->
            <td class="mes-cell">
              <span @click="abrirReporteGananciaDetallado(mes)" style="cursor: pointer;">
                <i class="far fa-calendar-alt"></i>
                {{ mes.nombre_mes }}
              </span>
            </td>

            <!-- PRICING -->
            <td class="money pricing-text">
              {{ formatMoney(mes.total_pr) }}
            </td>

            <!-- OPERACIONES -->
            <td class="money operaciones-text">
              {{ formatMoney(mes.total_op) }}
            </td>

            <!-- EXPEDIENTES INDIVIDUALES -->
            <td>
              {{ mes.total_individuales }}
            </td>

            <!-- EXPEDIENTES GRUPALES -->
            <td>
              {{ mes.total_grupales }}
            </td>

            <!-- TOTAL EXPEDIENTES -->
            <td class="total-expedientes">
              {{
                parseFloat(mes.total_individuales) +
                parseFloat(mes.total_grupales)
              }}
            </td>

            <!-- CLIENTES INDIVIDUALES -->
            <td class="clientes-individuales">
              {{ mes.total_house_individuales }}
            </td>

            <!-- CLIENTES GRUPALES -->
            <td class="clientes-grupales">
              {{ mes.total_house_grupales }}
            </td>

            <!-- TOTAL CLIENTES -->
            <td class="total-clientes-cell">
              {{
                parseFloat(mes.total_house_individuales) +
                parseFloat(mes.total_house_grupales)
              }}
            </td>
          </tr>

          <!-- ===================== TOTALES ===================== -->
          <tr class="fila-totales">
            <td class="total-label" style="color: #472147 !important; ">
              TOTALES
              DEL AÑO
            </td>

            <td class="total-pricing">
              {{ formatMoney(totalIngresosPricing) }}
            </td>

            <td class="total-operaciones">
              {{ formatMoney(totalIngresosOperaciones) }}
            </td>

            <td>
              {{ totalExpedientesIndividuales }}
            </td>

            <td>
              {{ totalExpedientesGrupales }}
            </td>

            <td class="total-expedientes">
              {{ totalExpedientes }}
            </td>

            <td class="clientes-individuales">
              {{ totalClientesIndividuales }}
            </td>

            <td class="clientes-grupales">
              {{ totalClientesGrupales }}
            </td>

            <td class="total-clientes-cell">
              {{ totalClientes }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- =========================================================
         FOOTER
    ========================================================== -->
    <div class="footer-reporte">
      <div class="footer-nota">
        <div class="footer-info-icon">
          <i class="fas fa-info"></i>
        </div>

        <strong>Nota:</strong>
        Los montos están expresados en DOLARES (USD).
      </div>

      <div class="fecha-generacion">
        <i class="far fa-calendar-alt"></i>

        Reporte generado el:
        {{ fechaGeneracion }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "ReporteGanancia",

  data() {
    return {
      anioSeleccionado: new Date().getFullYear(),
      fechaGeneracion: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      listaAnios: Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - i,
      ),
    };
  },
  mounted() {
    this.cargarReporte();
  },
  computed: {
    // =========================================================
    // DATOS DEL STORE
    // =========================================================

    totalMasterAgrupado() {
      return (
        this.$store.state.reportes.totalMasterAgrupado || {
          total_pr: 0,
          total_op: 0,
          total_individuales: 0,
          total_grupales: 0,
          total_house_individuales: 0,
          total_house_grupales: 0,
        }
      );
    },

    totalMasterPorMes() {
      return this.$store.state.reportes.totalMasterPorMes || [];
    },

    // =========================================================
    // INGRESOS
    // =========================================================

    totalIngresosPricing() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_pr || 0);
      }, 0);
    },

    totalIngresosOperaciones() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_op || 0);
      }, 0);
    },

    // =========================================================
    // EXPEDIENTES
    // =========================================================

    totalExpedientesIndividuales() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_individuales || 0);
      }, 0);
    },

    totalExpedientesGrupales() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_grupales || 0);
      }, 0);
    },

    totalExpedientes() {
      return this.totalExpedientesIndividuales + this.totalExpedientesGrupales;
    },

    // =========================================================
    // CLIENTES
    // =========================================================

    totalClientesIndividuales() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_house_individuales || 0);
      }, 0);
    },

    totalClientesGrupales() {
      return this.totalMasterPorMes.reduce((total, item) => {
        return total + Number(item.total_house_grupales || 0);
      }, 0);
    },

    totalClientes() {
      return this.totalClientesIndividuales + this.totalClientesGrupales;
    },
  },

  methods: {
    ...mapActions(["getTotalesMasterAgrupado", "getTotalesMasterPorMes"]),
    abrirReporteGananciaDetallado(item) {
      this.$router.push({
        name: "ReporteGananciaDetallado",
        params: { code_mes: item.mes , year : this.anioSeleccionado},
      });
    },
    formatMoney(value) {
      return (
        "USD " +
        Number(value || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    },

    cambiarAnio() {
      this.cargarReporte();
    },

    async cargarReporte() {
      this.$store.state.spiner = true;
      await Promise.all([
        this.getTotalesMasterAgrupado({
          year: this.anioSeleccionado,
        }),

        this.getTotalesMasterPorMes({
          year: this.anioSeleccionado,
        }),
      ]);
      this.$store.state.spiner = false;
    },
  },
};
</script>

<style scoped>
/* ============================================================
   FUENTE
============================================================ */

.reporte-ganancia {
  font-family: "Montserrat", Arial, sans-serif;
  color: #111d42;
  width: 100%;
  background: #fff;
}

/* ============================================================
   TITULO
============================================================ */

.titulo-reporte {
  text-align: center;
  color: #102d69;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -1px;
  margin-bottom: 14px;
}

/* ============================================================
   INFORMACION
============================================================ */

.info-card {
  min-height: 138px;
  border: 1px solid #b9c5db !important;
  border-radius: 12px !important;
  display: flex;
  align-items: flex-start;
  padding: 18px;
  margin-bottom: 24px;
  background: #fbfcff !important;
}

.info-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  background: #1153c5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 18px;
}

.info-content {
  font-size: 14px;
  line-height: 1.65;
}

.info-title {
  font-weight: 800;
  margin-bottom: 2px;
}

.info-content ul {
  margin: 0;
  padding-left: 18px;
}

.info-content li {
  margin: 1px 0;
}

/* ============================================================
   RESUMEN GENERAL
============================================================ */

.resumen-container {
  display: grid;
  grid-template-columns:
    1fr
    1fr
    1.55fr
    1.7fr
    0.7fr;

  border: 1px solid #8fa1c3;
  border-radius: 12px;
  overflow: hidden;
  min-height: 258px;
  margin-bottom: 22px;
}

/* ============================================================
   RESUMEN ITEMS
============================================================ */

.resumen-item {
  border-right: 1px solid #d4dbe7;
  text-align: center;
  padding: 20px 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.resumen-icon {
  font-size: 37px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pricing-icon {
  color: #641b9e;
}

.operaciones-icon {
  color: #14723c;
}

.resumen-label {
  font-size: 13px;
  line-height: 1.45;
  font-weight: 800;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resumen-value {
  margin-top: 18px;
  font-size: 24px;
  font-weight: 800;
  white-space: nowrap;
}

.pricing-color {
  color: #4e268a;
}

.operaciones-color {
  color: #0d713c;
}

/* ============================================================
   GRUPOS RESUMEN
============================================================ */

.resumen-expedientes,
.resumen-clientes {
  border-right: 1px solid #d4dbe7;
  position: relative;
}

.grupo-titulo {
  height: 77px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-bottom: 1px solid #d4dbe7;
  font-size: 12px;
  font-weight: 900;
}

.grupo-titulo i {
  font-size: 31px;
  color: #174fbd;
}

.resumen-clientes .grupo-titulo i {
  color: #f87800;
}

.grupo-columnas {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 111px;
}

.resumen-clientes .grupo-columnas {
  grid-template-columns: repeat(3, 1fr);
}

.grupo-columna {
  text-align: center;
  border-right: 1px solid #d4dbe7;
}

.grupo-columna:last-child {
  border-right: 0;
}

.columna-label {
  min-height: 43px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 11px;
  font-weight: 800;
}

.columna-value {
  font-size: 26px;
  font-weight: 800;
  padding-top: 9px;
}

.azul {
  color: #0845b5;
}

.naranja {
  color: #f47500;
}

/* ============================================================
   TOTALES RESUMEN
============================================================ */

.total-azul {
  height: 69px;
  background: #082d70;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.total-azul span,
.total-clientes-label {
  font-size: 12px;
  font-weight: 700;
}

.total-azul strong {
  font-size: 24px;
  line-height: 1.1;
}

.total-clientes-card {
  background: #f87800;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.total-clientes-label {
  line-height: 1.6;
}

.total-clientes-value {
  font-size: 38px;
  font-weight: 800;
  margin-top: 10px;
}

/* ============================================================
   TABLA
============================================================ */

.tabla-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 10px;
}

.tabla-reporte {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 13px;
}

.tabla-reporte th,
.tabla-reporte td {
  border-right: 1px solid #d7dde7;
  border-bottom: 1px solid #d7dde7;
  text-align: center;
  vertical-align: middle;
  padding: 9px 5px;
}

.tabla-reporte th:first-child,
.tabla-reporte td:first-child {
  border-left: 1px solid #d7dde7;
}

/* ============================================================
   HEADERS
============================================================ */

.header-principal th:first-child {
  border-top-left-radius: 9px;
}

.header-principal th:last-child {
  border-top-right-radius: 9px;
}

.header-azul {
  background: #082d70;
  color: white;
  font-weight: 800;
}

.header-naranja {
  background: #f87800;
  color: white;
  font-weight: 800;
}

.header-principal th {
  height: 54px;
  font-size: 12px;
  line-height: 1.35;
}

.header-secundario th {
  height: 45px;
  font-size: 11px;
  line-height: 1.3;
}

/* ============================================================
   CELDAS
============================================================ */

.tabla-reporte tbody td {
  height: 54px;
  color: #1b1b1b;
  background: white;
}

.mes-cell {
  text-align: left !important;
  padding-left: 12px !important;
  font-weight: 800;
  color: #14285b !important;
  white-space: nowrap;
}

.mes-cell i {
  color: #0b51c6;
  font-size: 18px;
  margin-right: 8px;
}

.money {
  font-size: 13px;
  font-weight: 500;
}

.pricing-text {
  color: #442084 !important;
}

.operaciones-text {
  color: #11693a !important;
}

.total-expedientes {
  color: #0645b6 !important;
  background: #f5f8ff !important;
  font-size: 17px;
  font-weight: 800;
}

.clientes-individuales {
  color: #ed7100 !important;
}

.clientes-grupales {
  color: #ed7100 !important;
  font-weight: 700;
}

.total-clientes-cell {
  color: #ed7100 !important;
  background: #fff7ee !important;
  font-size: 17px;
  font-weight: 800;
}

/* ============================================================
   TOTALES
============================================================ */

.fila-totales td {
  height: 65px !important;
  font-weight: 800;
  background: #f1f4fb !important;
}

.total-label {
  background: #082d70 !important;
  color: white !important;
  font-size: 13px;
  line-height: 1.3;
}

.total-pricing {
  color: #47218a !important;
  font-size: 14px;
}

.total-operaciones {
  color: #116c3b !important;
  font-size: 14px;
}

.fila-totales .total-expedientes {
  background: #0849c0 !important;
  color: white !important;
  font-size: 21px;
}

.fila-totales .total-clientes-cell {
  background: #f87800 !important;
  color: white !important;
  font-size: 21px;
}

/* ============================================================
   FOOTER
============================================================ */

.footer-reporte {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding: 0 6px;
  font-size: 13px;
  color: #102452;
}

.footer-nota {
  display: flex;
  align-items: center;
  gap: 7px;
}

.footer-info-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1153c5;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 19px;
  margin-right: 5px;
}

.fecha-generacion {
  display: flex;
  align-items: center;
  gap: 9px;
}

.fecha-generacion i {
  font-size: 23px;
  color: #0c3e9b;
}

/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 1200px) {
  .titulo-reporte {
    font-size: 34px;
  }

  .resumen-container {
    grid-template-columns:
      1fr
      1fr
      1.5fr
      1.7fr
      0.7fr;
  }

  .resumen-value {
    font-size: 19px;
  }

  .total-clientes-value {
    font-size: 30px;
  }
}

@media (max-width: 900px) {
  .resumen-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .resumen-item {
    min-height: 190px;
  }

  .resumen-expedientes,
  .resumen-clientes {
    min-height: 220px;
  }

  .total-clientes-card {
    min-height: 180px;
  }

  .footer-reporte {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 600px) {
  .titulo-reporte {
    font-size: 27px;
  }

  .resumen-container {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 12px;
  }

  .info-content {
    font-size: 12px;
  }

  .tabla-wrapper {
    overflow-x: auto;
  }

  .tabla-reporte {
    min-width: 1100px;
  }
}

.filtro-anio {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.select-anio {
  max-width: 180px;
}

.select-anio >>> .v-input__slot {
  background: #fff;
}

.select-anio >>> .v-label {
  color: #082d70;
  font-weight: 600;
}
</style>
