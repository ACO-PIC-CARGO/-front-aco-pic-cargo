<template>
  <v-container fluid class="contenedor-scroll">
    <v-row>
      <v-col cols="12">
        <BarraFiltro :filtro="filtro" :cuentas="cuentas" />
      </v-col>
      <v-col cols="12" class="pt-0">
        <v-row class="align-center">
          <v-col cols="6">
            <v-text-field
              class="mx-2"
              hide-details
              density="compact"
              id="id"
              variant="outlined"
              placeholder="Buscar..."
              append-inner-icon="mdi-text-search"
              v-model="search"
              label="Buscar"
            >
            </v-text-field>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn size="small" color="info" class="mr-2" @click="abrirFiltro">
              <v-icon size="small">mdi-filter</v-icon> Filtrar</v-btn
            >
            <v-btn size="small" color="default" @click="Limpiar">
              <v-icon size="small">mdi-close</v-icon> Limpiar</v-btn
            >
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :search="search"
          :headers="headersCabecera"
          :items="$store.state.reportes.listDetalle"
          density="compact"
        >
          <template v-slot:[`item.action`]="{ item }">
            <div class="d-flex align-center">
              <v-btn
                v-if="!!item.urlfile"
                size="small"
                icon
                color="red"
                :href="item.urlfile"
                target="_blank"
              >
                <v-icon>mdi-file</v-icon>
              </v-btn>

              <v-btn size="small" icon color="info" @click="ver(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn size="small" icon color="warning" @click="editar(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-navigation-drawer
      absolute
      permanent
      temporary
      location="right"
      width="20%"
      v-if="dialogFiltro"
    >
      <v-card height="100%" elevation="10">
        <v-card-title primary-title> Filtrar Gastos </v-card-title>
        <v-card-text>
          <v-select
            :items="cuentas"
            v-model="filtro.id_cuenta"
            label="Cuenta Bancaria (PIC)"
            item-title="label"
            item-value="id"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          >
          </v-select>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          >
          </v-autocomplete>

          <v-text-field
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          >
          </v-text-field>

          <v-text-field
            label="Nro Expediente"
            v-model="filtro.nro_exp"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          >
          </v-text-field>
          <v-text-field
            type="number"
            label="Monto"
            v-model="filtro.monto"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          >
          </v-text-field>
          <FormatFecha
            :dense="true"
            :outlined="true"
            label="Fecha Desde"
            id="filtroDesde"
            v-model="filtro.desde"
          />
          <FormatFecha
            :dense="true"
            :outlined="true"
            label="Fecha Hasta"
            id="filtroHasta"
            v-model="filtro.hasta"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" @click="filtrar()">Filtrar</v-btn>
          <v-btn
            color="red"
            class="mr-2"
            @click="dialogFiltro = !dialogFiltro"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import moment from "moment";
import { mapActions } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import BarraFiltro from "../BarraMostrarFiltro/BarraFiltro.vue";
export default {
  components: {
    FormatFecha,
    BarraFiltro,
  },
  data() {
    return {
      search: "",
      headersCabecera: [
        { title: "Accion", key: "action" },
        { title: "F. Reg.", key: "create_at" },
        { title: "F. Op.", key: "fecha_pago" },
        { title: "Nro Operación", key: "nro_operacion" },
        { title: "Tipo", key: "tipo_pago" },
        // { text: "Tipo", value: "tipo_pago" },
        { title: "Exp/ Tipo Gasto", key: "tipo_gasto" },
        { title: "Exp/ SubTipo Gasto", key: "subtipo_gasto" },
        { title: "Cuenta Salida", key: "banco" },
        { title: "Proveedor	", key: "name_proveedor" },
        { title: "Monto (USD)	", key: "monto_dolar" },
        { title: "Monto	", key: "monto_mon_ex" },
        { title: "Moneda	", key: "moneda_simbolo" },
        { title: "Comentarios", key: "comentarios" },
      ],
      list: [],
      dialogFiltro: false,
      filtro: {
        desde: "",
        hasta: "",
        nro_operacion: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_exp: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        operativo: true,
        administrativo: true,
      },
      cuentas: [],
    };
  },
  async mounted() {
    this.filtro.desde = moment().format("YYYY-01-01");
    this.filtro.hasta = moment().endOf("month").format("YYYY-MM-DD");

    await this.getListarBancosgastosDetalles(this.filtro);
    await this.getListBanksDetailsCargar();
  },
  methods: {
    ...mapActions(["getListarBancosgastosDetalles", "validarUsuarioAdmin"]),
    async ver(pago) {
      this.$router.push({
        name: "verPagosPorProveedor",
        params: { id: pago.id_pago },
      });
    },
    async editar(item) {
      let val = false;
      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value.trim();
          const input2 = document.getElementById("swal-input2").value.trim();
          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }
          return { usuario: input1, clave: input2 };
        },
      }).then(async (result) => {
        if (!result.isConfirmed) {
          // Usuario canceló
          val = false;
          msg = "Operación cancelada";
          return;
        }

        if (result.value) {
          const res = await this.validarUsuarioAdmin({
            usuario: result.value.usuario,
            clave: result.value.clave,
          });

          if (res && res.estadoflag) {
            val = true;
          } else {
            val = false;
            msg = res?.mensaje || "Credenciales incorrectas";
          }
        } else {
          val = false;
          msg = "Debe ingresar las credenciales";
        }
      });

      if (!val) {
        await swal.fire({
          icon: "error",
          text: msg,
        });
        return false;
      }

      this.$router.push({
        name: "editarPagosPorProveedor",
        params: { id: item.id_pago },
      });
    },
    async getListBanksDetailsCargar() {
      let vm = this;
      var config = {
        method: "get",
        url: import.meta.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.cuentas = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    abrirFiltro() {
      this.dialogFiltro = true;
    },
    async filtrar() {
      await this.getListarBancosgastosDetalles(this.filtro);
      this.dialogFiltro = false;
    },
    async Limpiar() {
      this.filtro = {
        desde: "",
        hasta: "",
        nro_operacion: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        nro_exp: "",
        operativo: true,
        administrativo: true,
      };
      this.filtro.desde = moment().format("YYYY-01-01");
      this.filtro.hasta = moment().endOf("month").format("YYYY-MM-DD");
      this.$store.state.spiner = true;
      await this.getListarBancosgastosDetalles(this.filtro);
      this.$store.state.spiner = false;
      this.dialogFiltro = false;
    },
  },
};
</script>

<style></style>
