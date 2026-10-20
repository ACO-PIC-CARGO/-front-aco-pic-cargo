<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import FormatFecha from "../comun/FormatFecha.vue";
import BarraFiltro from "../BarraMostrarFiltro/BarraFiltro.vue";
import { useReportesStore } from "@/stores/reportes";
import { useSecuritysStore } from "@/stores/securitys";
import type { BancoGastoDetalle } from "@/types/finanzas";
import type { CuentaBancariaPic } from "@/types/operaciones";
import type { FiltroPagoProveedorDetallado } from "@/types/banksProveedor";
import { sessionBranchId } from "@/utils/sesion";

const router = useRouter();
const rootStore = useStore();
const reportesStore = useReportesStore();
const securitysStore = useSecuritysStore();

const search = ref("");
const headersCabecera = [
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
];
const dialogFiltro = ref(false);
const filtro = ref<FiltroPagoProveedorDetallado>({
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
});
const cuentas = ref<CuentaBancariaPic[]>([]);

async function ver(pago: BancoGastoDetalle) {
  router.push({
    name: "verPagosPorProveedor",
    params: { id: pago.id_pago as number },
  });
}
async function editar(item: BancoGastoDetalle) {
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
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
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
      // @ts-expect-error msg is not declared
      msg = "Operación cancelada";
      return;
    }

    if (result.value) {
      const res = await securitysStore.validarUsuarioAdmin({
        usuario: result.value.usuario,
        clave: result.value.clave,
      });

      if (res && res.estadoflag) {
        val = true;
      } else {
        val = false;
        // @ts-expect-error msg is not declared
        msg = res?.mensaje || "Credenciales incorrectas";
      }
    } else {
      val = false;
      // @ts-expect-error msg is not declared
      msg = "Debe ingresar las credenciales";
    }
  });

  if (!val) {
    // @ts-expect-error swal is not defined
    await swal.fire({
      icon: "error",
      // @ts-expect-error msg is not declared
      text: msg,
    });
    return false;
  }

  router.push({
    name: "editarPagosPorProveedor",
    params: { id: item.id_pago as number },
  });
}
async function getListBanksDetailsCargar() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
    params: {
      id_branch: sessionBranchId(),
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      cuentas.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function abrirFiltro() {
  dialogFiltro.value = true;
}
async function filtrar() {
  await reportesStore.getListarBancosgastosDetalles(filtro.value);
  dialogFiltro.value = false;
}
async function Limpiar() {
  filtro.value = {
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
  filtro.value.desde = moment().format("YYYY-01-01");
  filtro.value.hasta = moment().endOf("month").format("YYYY-MM-DD");
  rootStore.state.spiner = true;
  await reportesStore.getListarBancosgastosDetalles(filtro.value);
  rootStore.state.spiner = false;
  dialogFiltro.value = false;
}

onMounted(async () => {
  filtro.value.desde = moment().format("YYYY-01-01");
  filtro.value.hasta = moment().endOf("month").format("YYYY-MM-DD");

  await reportesStore.getListarBancosgastosDetalles(filtro.value);
  await getListBanksDetailsCargar();
});
</script>

<template>
  <v-container
    fluid
    class="contenedor-scroll"
  >
    <v-row>
      <v-col cols="12">
        <BarraFiltro
          :filtro="filtro"
          :cuentas="cuentas"
        />
      </v-col>
      <v-col
        cols="12"
        class="pt-0"
      >
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
            />
          </v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-btn
              size="small"
              color="info"
              class="mr-2"
              @click="abrirFiltro"
            >
              <v-icon size="small">
                mdi-filter
              </v-icon> Filtrar
            </v-btn>
            <v-btn
              size="small"
              color="default"
              @click="Limpiar"
            >
              <v-icon size="small">
                mdi-close
              </v-icon> Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :search="search"
          :headers="headersCabecera"
          :items="reportesStore.listDetalle"
          density="compact"
        >
          <template #[`item.action`]="{ item }">
            <div class="d-flex align-center">
              <!-- @vue-expect-error item.urlfile is unknown -->
              <v-btn
                variant="text"
                v-if="!!item.urlfile"
                size="small"
                icon
                color="red"
                :href="item.urlfile"
                target="_blank"
              >
                <v-icon>mdi-file</v-icon>
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                icon
                color="info"
                @click="ver(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                icon
                color="warning"
                @click="editar(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-navigation-drawer
      permanent
      temporary
      location="right"
      width="20%"
      v-if="dialogFiltro"
    >
      <v-card
        height="100%"
        elevation="5"
      >
        <v-card-title primary-title>
          Filtrar Gastos
        </v-card-title>
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
          />
          <v-autocomplete
            :items="rootStore.state.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />

          <v-text-field
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />

          <v-text-field
            label="Nro Expediente"
            v-model="filtro.nro_exp"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />
          <v-text-field
            type="number"
            label="Monto"
            v-model="filtro.monto"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />
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
          <v-spacer />
          <v-btn
            color="success"
            @click="filtrar()"
          >
            Filtrar
          </v-btn>
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

<style></style>
