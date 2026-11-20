<script setup lang="ts">
import "@/styles/bank-form.css";
import { computed, defineAsyncComponent, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useSelectModel } from "@/composables/useSelectModel";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import Swal from "sweetalert2";
import { useBancosStore } from "@/stores/bancos";
import { useBankStore } from "@/stores/bank";
import { useFilesStore } from "@/stores/files";
import type {
  CuentaIngreso,
  ErroresRegistroIngreso,
  FacturaPorCobrar,
  OperacionSimilar,
} from "@/types/banks";
import type { SolicitudCobroActiva, SolicitudCobroTransferencia } from "@/types/solicitudCobro";
import { request } from "@/utils/request";
import { sessionSucursal } from "@/utils/sesion";

// token: Nuevo ingreso desde una Solicitud de Cobro confirmada (Ingresos pendientes por confirmar).
// El cliente, la cuenta donde depositó, el correlativo, la fecha, el N° de operación y el voucher
// vienen de la solicitud; se cobra el monto total (sin abonos parciales).
const props = defineProps<{ token?: string }>();

const appStore = useAppStore();
const { can } = usePermissions();
const bankStore = useBankStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const clientes = computed(() => appStore.clientes);

const solicitud = ref<SolicitudCobroTransferencia | null>(null);
const errorSolicitud = ref(false);
const desdeSolicitud = computed(() => !!props.token);
// Sin token: correlativos del cliente con solicitud de cobro activa (se cobran solo con el token)
const solicitudesActivas = ref<SolicitudCobroActiva[]>([]);
function solicitudActivaDe(item: FacturaPorCobrar & { id_correlativo?: number | null }) {
  if (solicitud.value || item.admin_invoice_id) return undefined;
  return solicitudesActivas.value.find(
    (s) => s.id_house === item.registro_id && String(s.id_correlativo ?? "") === String(item.id_correlativo ?? ""),
  );
}
function avisarSolicitudActiva(s: SolicitudCobroActiva) {
  Swal.fire({
    icon: "warning",
    title: "Tiene una solicitud de cobro",
    html: `El expediente <b>${s.expediente}</b>${s.correlativo ? ` (correlativo <b>${s.correlativo}</b>)` : ""} tiene la solicitud de cobro
      (${s.estado}).<br><br>Regístrala desde <b>Ingresos pendientes por confirmar</b> o elimina la solicitud.`,
  });
}
async function cargarSolicitudesActivas() {
  solicitudesActivas.value = [];
  if (!cliente.value || props.token) return;
  const response = await request<SolicitudCobroActiva>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_activas_cliente",
    params: { id_cliente: cliente.value },
  });
  solicitudesActivas.value = response.estadoflag ? response.data : [];
}

const validacionDatosPrincipales = useTemplateRef("validacionDatosPrincipales");
//  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
const FormatFecha = defineAsyncComponent(() => import("../comun/FormatFecha.vue"));
const ArrastraYSolarComponent = defineAsyncComponent(() =>
  import("../comun/ArrastraYSolarComponent.vue"));

const dialogLlenarMontoDepositadoBanco = ref(false);
const esDuplicado = ref(false);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const operacionesSimilares = ref<OperacionSimilar[]>({} as OperacionSimilar[]);
const comentarios = ref("");
const comentariosadmin = ref("");
const conceptogastobancario = ref("");
const montogastobancario = ref<number | string>(0);
const monto_local = ref<number | string | null>(0);
const mostrarDetalle = ref(false);
const pasos = ref(0);
const monto = ref<number | string>(0);
const loading = ref(false);
const nro_operacion = ref("");
const cliente = ref<number | null>(null);
// Abre la ficha del cliente en una pestaña nueva
const router = useRouter();
function verDatosCliente() {
  if (!cliente.value) return;
  window.open(router.resolve({ name: "verCliente", params: { id: cliente.value } }).href, "_blank");
}
const symbol = ref("USD");
const id_cuenta = ref<CuentaIngreso>({} as CuentaIngreso);
const selectedAccount = useSelectModel(id_cuenta);
const id_banco_origen = ref<number | null>(null);
const fecha_operacion = ref<string | null>(null);
const id_path = ref<number | null>(null);
const selected = ref<FacturaPorCobrar[]>([]);
const invoicesOnPage = ref<FacturaPorCobrar[]>([]);
const headers = [
  { title: "Abono Completo o Parcial", key: "parcialflag" },
  { title: "Moneda Y Monto", key: "montopagar" },

  { title: "Expediente", key: "referencia" },
  { title: "Tipo", key: "tipo" },
  { title: "Ver Factura.", key: "action" },
  { title: "Fecha Factura", key: "fecha" },
  {
    title: "Moneda y Monto Facturado",
    key: "monto_original_total",
  },
  {
    title: "Monto Equivalente en Dólares",
    key: "totaldolar",
  },
  { title: "Saldo Actual", key: "total_mon_local" },
  { title: "Saldo Final", key: "saldo" },
  { title: "Factura", key: "documentos" },
  { title: "Monto Total Abonado", key: "totalabonado" },
];
const headersPagosGastosBancario = [
  { title: "Abono Completo o Parcial", key: "parcialflag" },
  { title: "Moneda Y Monto", key: "montopagar" },
  // { text: "Fecha Facturación", value: "fecha" },
  { title: "Expediente", key: "referencia" },
  { title: "Tipo", key: "tipo", align: "center" as const },
  { title: "Fecha Factura", key: "fecha" },
  {
    title: "Moneda y Monto Facturado",
    key: "monto_original_total",
  },
  { title: "Saldo Actual", key: "total_mon_local" },
  {
    title: "Monto Equivalente en Dólares",
    key: "totaldolar",
  },
  { title: "Saldo Final", key: "saldo" },
  // { text: "Factura", value: "documentos" },
  { title: "Monto Total Abonado", key: "totalabonado" },
];
const errorMesage = ref<ErroresRegistroIngreso>({
  cliente: "",
  id_cuenta: "",
  fecha_operacion: "",
  nro_operacion: "",
});
const editable = ref(false);
const editableGastoBancario = ref(false);
const searchTableDetalle = ref("");
const cboParcial = [
  { text: "Abono Completo", value: false },
  { text: "Abono Parcial", value: true },
];

const mostrarTipoCambio = computed(() => {
  if (selected.value.length == 0) return false;

  if (symbol.value != "USD") {
    return true;
  }

  if (selected.value.some((v) => v.symbol != "USD")) {
    return true;
  }

  return false;
  // return this.selected.some((v) => v.symbol != "USD");
});
const totalGeneralAbonado = computed(() => {
  // const total = this.selected.reduce((acc, item) => {
  //   let monto = parseFloat(item.montoparcial) || 0;

  //   return acc + monto;
  // }, 0);
  // return total.toFixed(2);
  return monto.value || "0.00";
});
const totalGeneralAbonadoMonLocal = computed(() => {
  let monto = selected.value.reduce((acc: number, item) => {
    const monto = parseFloat(String(item.montoparcial)) || 0;

    return acc + monto;
  }, 0);
  monto = monto + parseFloat(String(montogastobancario.value || 0));
  return parseFloat(String(monto)).toFixed(2);
});
const totalGeneralAbonadoMonLocalSeleccionado = computed(() => {
  let monto = selected.value.reduce((acc: number, item) => {
    const monto = parseFloat(String(item.montoparcial)) || 0;

    return acc + monto;
  }, 0);
  monto = monto;
  return parseFloat(String(monto)).toFixed(2);
});
const tipocambio = computed(() => {
  if (symbol.value === "USD") {
    return 1;
  }

  if (!monto.value || !monto_local.value) {
    return 1;
  }

  const tc =
    (parseFloat(String(monto_local.value || 1)) +
      parseFloat(String(montogastobancario.value || 0))) /
    ((monto.value || 1) as number);

  return Number(tc.toFixed(4));
});
const itemsOrdenados = computed(() => {
  let items = [...bankStore.deudaACliente] as unknown as (FacturaPorCobrar & { id_correlativo?: number | null })[];
  const sol = solicitud.value;
  if (sol) {
    items = items.filter(
      (i) => !i.admin_invoice_id && i.registro_id === sol.id_house && String(i.id_correlativo ?? "") === String(sol.id_correlativo ?? ""),
    );
  }
  return items.sort((a, b) => {
    const aSeleccionado = selected.value.some((sel) => sel.id === a.id);
    const bSeleccionado = selected.value.some((sel) => sel.id === b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const montoFinal = computed(() => {
  let gastoBancario = 0;
  gastoBancario = Number(montogastobancario.value || 0);
  const total = Number(totalGeneralAbonado.value || 0) + gastoBancario;
  return total.toFixed(2);
});

function abrirFactura(item: FacturaPorCobrar) {
  const id = item.admin_invoice_id;
  window.open(`/home/viewAccountPaysCxC/${id}`, "_blank");
}
function cancelarllenadoDeMonto() {
  dialogLlenarMontoDepositadoBanco.value = false;
  monto_local.value = null;
  id_cuenta.value = {} as CuentaIngreso;

  // Si usas validación de formulario (v-form), es recomendable resetearla aquí:
  // this.$refs.tuFormulario?.resetValidation();
}
function confirmarDeposito() {
  if (monto_local.value) {
    dialogLlenarMontoDepositadoBanco.value = false;
    mostrarDetalle.value = true;
  }
}
function checkDeshabilitado(item: FacturaPorCobrar) {
  // Si editaflag es false, devuelve true para deshabilitar el checkbox
  return item.editaflag === false || !!solicitudActivaDe(item);
}
// "1,465.68" o 1465.68 -> 1465.68
const aNumero = (valor: unknown) => Math.round(Number(String(valor ?? 0).replace(/,/g, "")) * 100) / 100 || 0;
// Desde una solicitud de cobro se cobra el monto del pago del cliente: si es menor que la deuda del
// correlativo, es un Abono Parcial por ese monto (no el total)
function aplicarMontoSolicitud(item: FacturaPorCobrar): boolean {
  const sol = solicitud.value;
  if (!sol) return false;
  const montoPago = aNumero(sol.monto);
  const deuda = aNumero(item.total_mon_local);
  const parcial = montoPago > 0 && montoPago < deuda;
  item.parcialflag = parcial;
  item.montoparcial = parcial ? montoPago.toFixed(2) : item.total_mon_local;
  return true;
}
async function onItemSelected({ item, value }: { item: FacturaPorCobrar; value: boolean }) {
  // Si está intentando seleccionar
  if (value) {
    // con solicitud de cobro activa solo se cobra desde Ingresos pendientes por confirmar
    const activa = solicitudActivaDe(item);
    if (activa) {
      selected.value = selected.value.filter((i) => i.id !== item.id);
      avisarSolicitudActiva(activa);
      calcularTotal();
      return;
    }
    // Validar que la factura y la cuenta tengan la misma moneda
    if (item.symbol !== symbol.value) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Moneda diferente",
        html: `
              La factura seleccionada está en <b>${item.symbol}</b>
              y la cuenta está en <b>${symbol.value}</b>
              <br><br>
              ¿Desea Continuar?
            `,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      // Si cancela, quitar la factura de selected
      if (!result.isConfirmed) {
        selected.value = selected.value.filter((i) => i.id !== item.id);

        calcularTotal();
        return;
      }
    }

    // Si confirma o las monedas son iguales
    if (!aplicarMontoSolicitud(item)) {
      item.parcialflag = false;
      item.montoparcial = item.total_mon_local;
    }
  } else {
    // Si deselecciona normalmente
    item.montoparcial = 0;
    item.parcialflag = false;
  }

  calcularTotal();
}
function onSelectAll({ items, value }: { items: FacturaPorCobrar[]; value: boolean }) {
  const bloqueadas = items.filter((i) => solicitudActivaDe(i));
  if (value && bloqueadas.length) {
    selected.value = selected.value.filter((i) => !bloqueadas.some((b) => b.id === i.id));
    avisarSolicitudActiva(solicitudActivaDe(bloqueadas[0]!)!);
  }
  items.forEach((item) => {
    if (value) {
      if (!aplicarMontoSolicitud(item)) {
        item.parcialflag = false;
        item.montoparcial = item.total_mon_local;
      }
    } else {
      item.montoparcial = 0;
      item.parcialflag = false;
    }
  });
  calcularTotal();
}
function verificarMontoCompleto(item: FacturaPorCobrar) {
  // Si el combo cambia a "Abono Completo" (value: false)
  if (aplicarMontoSolicitud(item)) {
    calcularTotal();
    return;
  }
  if (!item.parcialflag) {
    item.montoparcial = item.total_mon_local;
  }
  calcularTotal();
}
function recibirId(file: { id?: unknown }) {
  if (Object.keys(file).length > 0) {
    id_path.value = file.id as number;
  } else {
    id_path.value = null;
  }
}
async function obtenerListado() {
  errorMesage.value.cliente = "";

  selected.value = [];
  monto.value = 0;
  monto_local.value = 0;
  montogastobancario.value = 0;
  conceptogastobancario.value = "";

  pasos.value = 0;
  editable.value = false;
  editableGastoBancario.value = false;

  searchTableDetalle.value = "";

  id_cuenta.value = {} as CuentaIngreso;

  id_banco_origen.value = null;
  fecha_operacion.value = null;
  nro_operacion.value = "";

  id_path.value = null;

  esDuplicado.value = false;
  operacionesSimilares.value = [];
  mostrarDetalle.value = false;
  if (cliente.value) {
    appStore.spiner = true;

    try {
      await Promise.all([bankStore.getDeudaDeClientePorSucursal(cliente.value), cargarSolicitudesActivas()]);
    } finally {
      appStore.spiner = false;
    }
  } else {
    bankStore.deudaACliente = [];
  }
}
async function continuarDetalles() {
  if (!(await validacionDatosPrincipales.value!.validate()).valid) {
    console.log("ssss");
    return;
  }
  errorMesage.value = {
    cliente: "",
    id_cuenta: "",
    fecha_operacion: "",
    nro_operacion: "",
    monto_local: "",
  };

  if (
    id_banco_origen.value &&
    cliente.value &&
    Object.keys(id_cuenta.value).length > 0 &&
    fecha_operacion.value &&
    nro_operacion.value &&
    id_path.value &&
    !esDuplicado.value
  ) {
    const hoy = new Date();
    const fechaOp = new Date(fecha_operacion.value);
    const unMesEnMs = 30 * 24 * 60 * 60 * 1000;
    const diferencia = Math.abs(fechaOp.getTime() - hoy.getTime());
    if (diferencia < unMesEnMs) {
      pasos.value = 2;
      editableGastoBancario.value = true;
    } else {
      Swal.fire({
        icon: "warning",
        title: "Fecha inusual",
        html: `La fecha seleccionada <b> (${fecha_operacion.value})</b> tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "No, revisar",
      }).then((result) => {
        if (result.isConfirmed) {
          pasos.value = 2;
          editableGastoBancario.value = true;
        }
      });
    }
  } else {
    errorMesage.value.cliente = cliente.value ? "" : "Elige el cliente.";

    errorMesage.value.id_banco_origen = id_banco_origen.value
      ? ""
      : "Elige el banco de origen.";
    errorMesage.value.id_cuenta =
      Object.keys(id_cuenta.value).length > 0 ? "" : "Cuenta es requerida";
    errorMesage.value.fecha_operacion = fecha_operacion.value
      ? ""
      : "Fecha de Operación es requerida";

    // CORRECCIÓN AQUÍ: Cambiado de false a un String de error
    errorMesage.value.nro_operacion = nro_operacion.value
      ? ""
      : "Número de Operación es requerido";
    if (!id_path.value) {
      Swal.fire({
        icon: "error",
        title: "Archivo de Soporte Requerido",
        text: "Por favor, suba el archivo de soporte para continuar.",
      });
    }
    if (esDuplicado.value) {
      errorMesage.value.nro_operacion = "El número de operación ya existe";
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function subirArchivo() {
  if (id_path.value) {
    const res = await filesStore._uploadFile(id_path.value as unknown as File);
    // @ts-expect-error _uploadFile resolves to undefined
    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Archivo Subido",
        text: "El archivo se ha subido correctamente.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al Subir Archivo",
        text: "Hubo un problema al subir el archivo. Por favor, inténtelo nuevamente.",
      });
    }
  }
}
function calcularTotal() {
  const totalUSD = selected.value.reduce((acc: number, item) => {
    if (symbol.value === "USD") {
      return acc + parseFloat(String(item.montoparcial || 0));
    } else {
      const montoIngresado = parseFloat(String(item.montoparcial)) || 0;
      const saldoLocal = parseFloat(String(item.total_mon_local)) || 0;
      const saldoDolares = parseFloat(String(item.totaldolar)) || 0;
      if (saldoLocal <= 0) return acc;
      return acc + saldoDolares * (montoIngresado / saldoLocal);
    }
  }, 0);

  monto.value = totalUSD.toFixed(2);
}
function continuarGastoBancario() {
  if (!cliente.value || selected.value.length == 0) {
    let text = "";
    text = !cliente.value ? "Cliente Requerido. <br>" : "";
    // text += !this.monto_local ? "Monto Local Requerido. <br>" : "";
    text +=
      selected.value.length == 0 ? "Seleccione Facturas a Pagar. <br>" : "";
    Swal.fire({
      icon: "error",
      title: `Aviso Importante`,
      html: text,
    });
    return;
  }
  pasos.value = 1;
  editable.value = true;
}
async function finalizarOperacion() {
  if (
    Number(totalGeneralAbonadoMonLocal.value) !== Number(monto_local.value)
  ) {
    Swal.fire({
      icon: "warning",
      title: "Discrepancia en los Montos",
      html: `
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 16px;">
                El registro no puede completarse porque los valores monetarios no coinciden.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; text-align: left;">
                <div style="flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #adb5bd; text-transform: uppercase; font-weight: bold;">Registrado en Banco</span>
                    <span style="font-size: 15px; font-weight: bold; color: #495057;">${
                  symbol.value
                } ${Number(monto_local.value).toFixed(2)}</span>
                </div>
                <div style="flex: 1; background: #fff5f5; border: 1px solid #ffe3e3; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #e03131; text-transform: uppercase; font-weight: bold;">Total a Pagar</span>
                    <span style="font-size: 15px; font-weight: bold; color: #c92a2a;">${
                  symbol.value
                } ${Number(totalGeneralAbonadoMonLocal.value).toFixed(
        2,
      )}</span>
                </div>
            </div>
        `,
      confirmButtonText: "Revisar y Corregir",
      confirmButtonColor: "#3085d6",
      buttonsStyling: true,
    });
    return;
  }
  const data = {
    symbol: symbol.value,
    id_branch: "",
    id_cliente: cliente.value,
    id_banco_origen: id_banco_origen.value,
    id_cuentabancaria: id_cuenta.value.id,
    id_moneda: id_cuenta.value.id_coins,
    fecha_operacion: fecha_operacion.value,
    nro_operacion: nro_operacion.value,
    totaldolar: monto.value,
    tipocambio: tipocambio.value,
    comentarios: comentarios.value,
    totalmonedalocal: monto_local.value,
    comentariosadmin: comentariosadmin.value,
    conceptogastobancario: conceptogastobancario.value,
    montogastobancario: montogastobancario.value,
    detalle: selected.value,
    id_soporte: id_path.value,
  };
  loading.value = true;
  if (props.token) {
    // cliente, cuenta y voucher los toma el backend de la solicitud
    await bankStore.setRegistroIngresosSolicitud({ ...data, token: props.token });
  } else {
    await bankStore.setRegistroIgresos(data);
  }
  loading.value = false;
  // Swal.fire({
  //   icon: "success",
  //   title: "Operación Finalizada",
  //   text: "El pago se ha registrado correctamente.",
  //   allowOutsideClick: false,
  //   allowEscapeKey: false,
  //   allowEnterKey: false,
  // }).then((result) => {
  //   if (result.isConfirmed) {
  //     this.$router.push({
  //       name: "listBankCxC",
  //     });
  //   }
  // });
}
function fn_totalAbonado(item: FacturaPorCobrar) {
  if (!selected.value.includes(item)) {
    return 0;
  }
  let monto = 0;
  if (item.parcialflag) {
    monto = parseFloat(String(item.montoparcial)) || 0;
  } else {
    monto = parseFloat(String(item.total_mon_local)) || 0;
  }
  if (item.symbol == "USD") {
    return `${item.symbol} ${monto.toFixed(2)}`;
  } else {
    return `${symbol.value} ${monto.toFixed(2)}`;
  }
}
function buscarOperacionAlEscribir() {
  clearTimeout(timer.value as ReturnType<typeof setTimeout>);
  if (nro_operacion.value.length < 3) {
    operacionesSimilares.value = [];
    esDuplicado.value = false;
    return;
  }
  timer.value = setTimeout(async () => {
    const res = (await bankStore.validarIngresoNroOperacion({
      numerooperacion: nro_operacion.value,
    })) as OperacionSimilar[];

    operacionesSimilares.value = res;

    if (!res[0]?.estadoflag) {
      operacionesSimilares.value = [];
      return;
    }
    // CAMBIO CLAVE: Evaluamos toda la lista. Si CUALQUIERA es duplicado exacto, bloqueamos.
    esDuplicado.value = operacionesSimilares.value.some(
      (op) => op.es_duplicado_exacto === true,
    );

    // Opcional: Si es duplicado, inyectamos el error directamente en el v-text-field
    if (esDuplicado.value) {
      errorMesage.value.nro_operacion = "El número de operación ya existe";
    }

    console.log(
      "Operaciones similares encontradas:",
      operacionesSimilares.value,
    );
  }, 300);
}

watch(id_cuenta, (newVal, oldVal) => {
  if (newVal && newVal.id && (!oldVal || newVal.id !== oldVal.id)) {
    if (oldVal && oldVal.id && selected.value.length > 0) {
      selected.value = [];

      monto.value = 0;
      calcularTotal();
    }
    const id_coins = newVal.id_coins;
    const coins = appStore.itemsCoinsList.find(
      (coin: { id: number }) => coin.id === id_coins,
    );
    symbol.value = coins ? coins.symbol : "USD";

    // Desde una solicitud: la cuenta está en la moneda del cobro y el monto recibido es el solicitado
    if (solicitud.value) {
      monto_local.value = Number(solicitud.value.monto).toFixed(2);
      mostrarDetalle.value = true;
      return;
    }
    dialogLlenarMontoDepositadoBanco.value = true;
  }
});
watch(fecha_operacion, (newVal) => {
  if (newVal) {
    errorMesage.value.fecha_operacion = "";
  } else {
    errorMesage.value.fecha_operacion = "Fecha de Operación es requerida";
  }
});
watch(selected, () => {
  // desde una solicitud de cobro la fila siempre va por el monto del pago del cliente
  if (solicitud.value) {
    const montoPago = aNumero(solicitud.value.monto);
    selected.value.forEach((item) => {
      const parcial = montoPago > 0 && montoPago < aNumero(item.total_mon_local);
      if (item.parcialflag !== parcial || (parcial && aNumero(item.montoparcial) !== montoPago)) aplicarMontoSolicitud(item);
    });
  }
  calcularTotal();
}, {
  deep: true, // Esto detecta cambios en las propiedades internas de los items
});

// cobro con excedente (el cliente pagó más que la deuda): la diferencia va como gasto bancario,
// así el detalle + gasto suma lo depositado. Se llena solo y no se edita.
const CONCEPTO_EXCEDENTE = "EXCEDENTE DEL CLIENTE";
const excedenteSolicitud = computed(() => {
  if (!solicitud.value || !selected.value.length) return 0;
  const detalle = selected.value.reduce((acc, item) => acc + aNumero(item.montoparcial), 0);
  return Math.max(Math.round((aNumero(solicitud.value.monto) - detalle) * 100) / 100, 0);
});
watch(excedenteSolicitud, (excedente, anterior) => {
  if (excedente > 0) {
    montogastobancario.value = excedente.toFixed(2);
    conceptogastobancario.value = CONCEPTO_EXCEDENTE;
  } else if (anterior && anterior > 0) {
    montogastobancario.value = 0;
    if (conceptogastobancario.value === CONCEPTO_EXCEDENTE) conceptogastobancario.value = "";
  }
});

// "Banco y cuenta de destino (EMPRESA)": la sucursal en sesión
const nombreEmpresa = computed(() => {
  try {
    return (sessionSucursal().trade_name || "").toUpperCase() || "NUESTRA EMPRESA";
  } catch {
    return "NUESTRA EMPRESA";
  }
});

// Precarga el ingreso con la solicitud de cobro (token)
async function cargarSolicitud() {
  appStore.spiner = true;
  const response = await request<SolicitudCobroTransferencia>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_por_token",
    params: { token: props.token },
  });
  appStore.spiner = false;
  const sol = response.estadoflag ? response.data[0] : undefined;
  if (!sol) {
    errorSolicitud.value = true;
    Swal.fire({ icon: "warning", text: response.mensaje || "No se pudo cargar la solicitud de cobro." });
    return;
  }
  solicitud.value = sol;
  appStore.mainTitle = "BANCOS - NUEVO INGRESO (SOLICITUD DE COBRO)";
  cliente.value = sol.id_cliente;
  await obtenerListado();
  const cuenta = bancosStore.cuentas.find((c) => c.id === sol.id_cuentabancaria);
  if (cuenta) id_cuenta.value = { ...cuenta } as CuentaIngreso;
  // el correlativo de la solicitud, por el monto de este pago del cliente (puede ser un abono parcial)
  const fila = itemsOrdenados.value[0];
  if (fila) {
    aplicarMontoSolicitud(fila);
    selected.value = [fila];
  }
  fecha_operacion.value = sol.fechadeposito;
  id_banco_origen.value = sol.id_banco_origen;
  // "No aplica" en la solicitud: llega vacío y se escribe aquí (obligatorio en Bancos)
  nro_operacion.value = sol.numerooperacion ?? "";
  id_path.value = sol.id_path_voucher;
  comentarios.value = ["Solicitud de cobro", sol.comentario].filter(Boolean).join(" - ");
  calcularTotal();
}

onMounted(async () => {
  bankStore.deudaACliente = [];
  appStore.mainTitle = "BANCOS - NUEVO INGRESO";
  await Promise.all([
    appStore.cargarClientes(),
    appStore._getCoinsList(),
    bancosStore.getListBanksDetailsCargar(),
    appStore._getBanksList(),
  ]);
  if (props.token) await cargarSolicitud();
});
</script>

<template>
  <v-card class="ing-form">
    <v-container fluid>
      <v-alert
        v-if="desdeSolicitud && errorSolicitud"
        type="warning"
        variant="tonal"
        density="compact"
      >
        No se pudo cargar la solicitud de cobro. Vuelve a <b>Ingresos pendientes por confirmar</b> y presiona Registrar en Bancos.
      </v-alert>
      <v-row v-if="!desdeSolicitud || (solicitud && !errorSolicitud)">
        <v-col
          cols="12"
          md="4"
          class="pb-0"
        >
          <div class="d-flex align-center">
            <v-autocomplete
              label="Cliente"
              variant="outlined"
              density="compact"
              :items="clientes"
              item-title="namelong"
              item-value="id"
              placeholder="Clientes"
              v-model="cliente"
              :clearable="!solicitud"
              :readonly="!!solicitud"
              @update:model-value="obtenerListado()"
              hide-details
              :error-messages="errorMesage.cliente"
            />
            <v-btn
              v-if="cliente"
              icon="mdi-eye"
              variant="tonal"
              color="primary"
              size="small"
              class="ml-2 flex-shrink-0"
              title="Ver datos del cliente (pestaña nueva)"
              aria-label="Ver datos del cliente en una pestaña nueva"
              @click="verDatosCliente"
            />
          </div>
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <!-- desde una solicitud de cobro: lo llenado en la solicitud no se cambia -->
          <v-text-field
            label="Monto Depositado en Banco"
            variant="outlined"
            density="compact"
            v-model="monto_local"
            :readonly="!!solicitud"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            @update:model-value="
              monto_local
                ? (errorMesage.monto_local = '')
                : (errorMesage.monto_local =
                  'Monto de Depósito en banco es requerido')
            "
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="mostrarTipoCambio"
        >
          <v-text-field
            variant="outlined"
            density="compact"
            disabled
            v-model="totalGeneralAbonadoMonLocal"
            type="number"
            :prefix="symbol"
            :label="`Total Facturas Seleccionadas (${symbol})`"
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <v-text-field
            variant="outlined"
            density="compact"
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
            label="Total Facturas Seleccionadas"
          />
        </v-col>
        <!--  -->
        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="mostrarTipoCambio"
        >
          <v-text-field
            label="Tipo Cambio"
            variant="outlined"
            density="compact"
            v-model="tipocambio"
            type="number"
            prefix="USD"
            hide-details
            disabled
          />
        </v-col>

        <v-col
          cols="12"
          v-if="cliente"
          class="pt-0"
        >
          <v-tabs
            v-model="pasos"
            align-tabs="center"
            color="#1b5e20"
            bg-color="#e8f5e9"
            slider-color="#2e7d32"
            class="ing-tabs"
          >
            <v-tab key="detallesPago">
              Facturas
            </v-tab>
            <v-tab
              key="datosPrincipales"
              :disabled="!editable"
            >
              Detalles Bancarios
            </v-tab>
            <v-tab
              key="gastoBancario"
              :disabled="!editableGastoBancario"
            >
              Resumen y Comisión Bancario
            </v-tab>
          </v-tabs>
          <v-tabs-window v-model="pasos">
            <v-tabs-window-item key="detallesPago">
              <v-row class="mt-2">
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-autocomplete
                    :items="bancosStore.cuentas"
                    item-title="label"
                    item-value="id"
                    label="Cuenta y Banco Ingreso de Banco"
                    v-model="selectedAccount"
                    return-object
                    variant="outlined"
                    density="compact"
                    :readonly="!!solicitud"
                    :rules="[
                      (v) =>
                        (v && Object.keys(v).length > 0 && !!v.id) ||
                        'Dato Requerido',
                    ]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    label="Buscar"
                    v-model="searchTableDetalle"
                    style="max-width: 400px"
                    variant="outlined"
                    :disabled="itemsOrdenados.length == 0"
                    density="compact"
                    v-if="
                      id_cuenta &&
                        Object.keys(id_cuenta).length > 0 &&
                        !!id_cuenta.id
                    "
                  />
                </v-col>
              </v-row>
              <v-row class="mt-1">
                <v-col
                  cols="12"
                  class="pt-0"
                  v-if="mostrarDetalle"
                >
                  <div class="d-flex justify-center">
                    <v-alert
                      class="mt-0"
                      border="top"
                      type="info"
                      elevation="2"
                      density="compact"
                      width="450px"
                      color="purple"
                    >
                      <b>SELECCIONE UNA(S) FACTURA PARA CONTINUAR</b>
                    </v-alert>
                  </div>
                  <!-- @vue-expect-error the current-items handler parameter has no type -->
                  <v-data-table
                    :headers="headers"
                    :items="itemsOrdenados"
                    v-model="selected"
                    show-select
                    item-value="id"
                    return-object
                    :search="searchTableDetalle"
                    :item-disabled="checkDeshabilitado"
                    @update:current-items="
                      (items) => (invoicesOnPage = items.map((i) => i.raw))
                    "
                  >
                    <template
                      #[`header.data-table-select`]="{
                        allSelected,
                        someSelected,
                        selectAll,
                      }"
                    >
                      <!-- desde una solicitud la fila del correlativo va fija (no se marca ni desmarca) -->
                      <v-checkbox-btn
                        :model-value="allSelected"
                        :indeterminate="someSelected && !allSelected"
                        :disabled="!!solicitud"
                        @update:model-value="
                          (value) => {
                            selectAll(value);
                            onSelectAll({ items: invoicesOnPage, value });
                          }
                        "
                      />
                    </template>
                    <template
                      #[`item.data-table-select`]="{
                        item,
                        internalItem,
                        isSelected,
                        toggleSelect,
                      }"
                    >
                      <v-checkbox-btn
                        :model-value="isSelected(internalItem)"
                        :aria-label="`Seleccionar factura ${item.referencia}`"
                        :disabled="!!solicitud"
                        @update:model-value="
                          (value) => {
                            toggleSelect(internalItem);
                            onItemSelected({ item, value });
                          }
                        "
                      />
                    </template>
                    <template #body.append>
                      <tr
                        class="bg-grey-lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td
                          :colspan="headers.length"
                          class="text-right"
                        >
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headers.length"
                          class="text-right"
                        >
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">
                          USD {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template #[`item.action`]="{ item }">
                      <v-btn
                        variant="text"
                        icon
                        color="primary"
                        v-if="item.tipo == 'A'"
                        @click="abrirFactura(item)"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                    </template>
                    <template #[`item.parcialflag`]="{ item }">
                      <v-chip
                        v-if="solicitudActivaDe(item)"
                        size="small"
                        color="orange-darken-2"
                        variant="tonal"
                        prepend-icon="mdi-lock-outline"
                        :title="`Solicitud de cobro (${solicitudActivaDe(item)!.estado})`"
                        @click="avisarSolicitudActiva(solicitudActivaDe(item)!)"
                      >
                        Solicitud de cobro
                      </v-chip>
                      <v-select
                        v-else
                        item-title="text"
                        :items="cboParcial"
                        v-model="item.parcialflag"
                        density="compact"
                        variant="outlined"
                        :disabled="!selected.includes(item) || !!solicitud"
                        hide-details
                        @update:model-value="verificarMontoCompleto(item)"
                        style="max-width: 200px"
                      />
                    </template>
                    <template #[`item.montopagar`]="{ item }">
                      <!-- @vue-expect-error parseFloat gets a string or number -->
                      <v-text-field
                        hide-details
                        density="compact"
                        variant="outlined"
                        v-model="item.montoparcial"
                        type="number"
                        :disabled="
                          !selected.includes(item) || !item.parcialflag
                        "
                        :readonly="!!solicitud"
                        :prefix="item.symbol"
                        @update:model-value="calcularTotal"
                        :rules="[
                          (v) =>
                            !v ||
                            parseFloat(v) <= parseFloat(item.total_mon_local) ||
                            'El monto no puede ser mayor al saldo',
                        ]"
                      />
                    </template>
                    <template #[`item.concepto`]="{ item, index }">
                      <v-text-field
                        v-model="item.concepto"
                        :id="`txtConcepto${index}`"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 150px"
                        placeholder="Nuevo Concepto"
                        v-if="item.nuevoflag"
                      />
                    </template>
                    <template #[`item.totaldolar`]="{ item }">
                      USD {{ item.totaldolar }}
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template #[`item.monto_original_total`]="{ item }">
                      {{ item.symbol }} {{ item.monto_original_total }}
                    </template>
                    <template #[`item.total_mon_local`]="{ item }">
                      {{ item.symbol }} {{ item.total_mon_local }}
                    </template>
                    <template #[`item.saldo`]="{ item }">
                      <span
                        v-if="
                          selected.some(
                            (s) => s.registro_id === item.registro_id,
                          )
                        "
                      >
                        <!-- @vue-expect-error subtracts string or number operands -->
                        {{ item.symbol }}
                        {{
                          parseFloat(
                            item.total_mon_local -
                              (item.montoparcial
                                ? item.montoparcial
                                : item.total_mon_local),
                          ).toFixed(2)
                        }}
                      </span>
                      <span v-else> ----- </span>
                    </template>
                  </v-data-table>
                </v-col>
                <v-col
                  cols="12"
                  class="pt-1 ing-actions"
                >
                  <v-btn
                    class="ing-btn ing-btn--ok"
                    variant="flat"
                    @click="continuarGastoBancario()"
                    :disabled="
                      !(
                        id_cuenta &&
                        Object.keys(id_cuenta).length > 0 &&
                        !!id_cuenta.id
                      )
                    "
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
            </v-tabs-window-item>
            <v-tabs-window-item key="datosPrincipales">
              <v-form ref="validacionDatosPrincipales">
                <v-row class="bank-form">
                  <v-col
                    cols="12"
                    md="6"
                    class="py-1"
                  >
                    <section class="bank-card ing-card">
                      <div class="ing-card__head">
                        <span class="ing-card__icon"><v-icon size="30">mdi-send-outline</v-icon></span>
                        <div>
                          <h3>BANCO DE ORIGEN (CLIENTE)</h3>
                          <p>Desde dónde el cliente envía el dinero (su banco).</p>
                        </div>
                      </div>
                      <div class="bank-card__body">
                        <label class="ing-label">Banco del cliente (Origen) <span class="ing-req">*</span></label>
                        <v-autocomplete
                          :items="appStore.itemsDataBanksList"
                          v-model="id_banco_origen"
                          :readonly="!!solicitud && !!solicitud.id_banco_origen"
                          aria-label="Banco del cliente (Origen)"
                          item-title="acronym"
                          item-value="id"
                          variant="outlined"
                          density="compact"
                          :rules="[(v) => !!v || 'Dato Requerido']"
                        />
                        <label class="ing-label">Fecha de operación (Transferencia) <span class="ing-req">*</span></label>
                        <FormatFecha
                          outlined
                          dense
                          label=""
                          v-model="fecha_operacion"
                          :verflag="!!solicitud && !!solicitud.fechadeposito"
                          :rules="[(v) => !!fecha_operacion || 'Dato Requerido']"
                        />
                        <label class="ing-label">Número de operación / Código de transferencia <span class="ing-req">*</span></label>
                        <v-text-field
                          aria-label="Número de operación / Código de transferencia"
                          variant="outlined"
                          density="compact"
                          v-model="nro_operacion"
                          :readonly="!!solicitud && !!solicitud.numerooperacion"
                          :rules="[(v) => !!v || 'Dato Requerido']"
                          @update:model-value="
                            nro_operacion !== ''
                              ? ((errorMesage.nro_operacion = null),
                                 buscarOperacionAlEscribir())
                              : ((errorMesage.nro_operacion =
                                   'Número de Operación es requerido'),
                                 (operacionesSimilares = []),
                                 (esDuplicado = false))
                          "
                        />

                        <div
                          v-if="
                            operacionesSimilares.length > 0 &&
                              operacionesSimilares[0]!.id !== null
                          "
                        >
                          <p
                            v-if="esDuplicado"
                            class="text-red text-body-small font-weight-bold pl-2"
                          >
                            ⚠️ Ya existe un registro con este número exacto.
                          </p>

                          <div
                            v-else
                            class="pl-2"
                          >
                            <div class="d-flex flex-wrap gap-1 mt-1">
                              <v-chip
                                v-for="(item, index) in operacionesSimilares"
                                :key="index"
                                size="small"
                                variant="tonal"
                                class="mr-1 mb-1"
                              >
                                {{ item.numerooperacion }}
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </v-col>
                  <v-col
                    cols="12"
                    md="6"
                    class="py-1"
                  >
                    <section class="bank-card ing-card">
                      <div class="ing-card__head">
                        <span class="ing-card__icon"><v-icon size="30">mdi-bank-outline</v-icon></span>
                        <div>
                          <h3>BANCO Y CUENTA DE DESTINO ({{ nombreEmpresa }})</h3>
                          <p>Donde nosotros recibimos el dinero (nuestra cuenta).</p>
                        </div>
                      </div>
                      <div class="bank-card__body">
                        <label class="ing-label">Cuenta de destino (nuestra cuenta) <span class="ing-req">*</span></label>
                        <v-autocomplete
                          :items="bancosStore.cuentas"
                          item-title="label"
                          item-value="id"
                          aria-label="Cuenta de destino (nuestra cuenta)"
                          v-model="selectedAccount"
                          return-object
                          variant="outlined"
                          density="compact"
                          readonly
                          :rules="[
                            (v) =>
                              (v && Object.keys(v).length > 0 && !!v.id) ||
                              'Dato Requerido',
                          ]"
                        />
                        <label class="ing-label">Banco (destino) <span class="ing-req">*</span></label>
                        <v-text-field
                          readonly
                          v-model="id_cuenta.banco"
                          aria-label="Banco (destino)"
                          variant="outlined"
                          density="compact"
                        />
                        <label class="ing-label">N° de cuenta (destino) <span class="ing-req">*</span></label>
                        <v-text-field
                          readonly
                          v-model="id_cuenta.cuenta"
                          aria-label="N° de cuenta (destino)"
                          variant="outlined"
                          density="compact"
                        />
                        <label class="ing-label">CCI (destino)</label>
                        <v-text-field
                          readonly
                          v-model="id_cuenta.cci"
                          aria-label="CCI (destino)"
                          variant="outlined"
                          density="compact"
                        />
                        <label class="ing-label">Moneda (destino)</label>
                        <v-text-field
                          readonly
                          v-model="id_cuenta.moneda"
                          aria-label="Moneda (destino)"
                          variant="outlined"
                          density="compact"
                        />
                      </div>
                    </section>
                  </v-col>
                  <v-col
                    cols="12"
                    class="py-1"
                  >
                    <section class="bank-card ing-card">
                      <h3 class="ing-card__simple">
                        Comentarios
                      </h3>
                      <div class="bank-card__body bank-card__row">
                        <v-textarea
                          label="Comentario del usuario"
                          rows="1"
                          variant="outlined"
                          density="compact"
                          auto-grow
                          v-model="comentarios"
                          :readonly="!!solicitud"
                        />
                        <v-textarea
                          label="Comentarios administrativos"
                          placeholder="Comentarios administrativos (uso interno)"
                          rows="1"
                          variant="outlined"
                          density="compact"
                          auto-grow
                          v-model="comentariosadmin"
                        />
                      </div>
                    </section>
                  </v-col>
                  <v-col
                    cols="12"
                    class="py-1 bank-drop"
                  >
                    <ArrastraYSolarComponent
                      v-if="solicitud"
                      :initial-url="solicitud.voucher_path || undefined"
                      :initial-id="solicitud.id_path_voucher"
                      :initial-name="solicitud.voucher_nombre"
                      read-only
                    />
                    <ArrastraYSolarComponent
                      v-else
                      @id-archivo-cargado="recibirId"
                      :rules="[
                        (v) => !!v || 'Debe adjuntar un soporte de pago',
                      ]"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    class="ing-actions"
                  >
                    <v-btn
                      class="ing-btn ing-btn--cancel"
                      variant="outlined"
                      @click="pasos = 0"
                    >
                      Cancelar
                    </v-btn>
                    <v-btn
                      class="ing-btn ing-btn--ok"
                      variant="flat"
                      @click="continuarDetalles()"
                    >
                      Continuar Comisión Bancaria
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </v-tabs-window-item>
            <v-tabs-window-item key="gastoBancario">
              <v-row class="mt-1">
                <v-col cols="12">
                  <v-data-table
                    :headers="headersPagosGastosBancario"
                    :items="selected"
                    v-model="selected"
                    item-value="id"
                    return-object
                  >
                    <template #body.append>
                      <tr
                        class="bg-grey-lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">
                          USD {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template #[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                    <template #[`item.montopagar`]="{ item }">
                      {{ item.montoparcial }}
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template #[`item.saldo`]="{ item }">
                      <!-- @vue-expect-error subtracts string or number operands -->
                      {{ item.symbol }}
                      {{
                        parseFloat(
                          item.total_mon_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.total_mon_local),
                        ).toFixed(2)
                      }}
                    </template>
                  </v-data-table>
                </v-col>

                <v-col
                  cols="2"
                  offset="7"
                >
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Comisión Bancaria"
                    id="id"
                    v-model="conceptogastobancario"
                    :readonly="excedenteSolicitud > 0"
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Monto Gasto Bancario"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="montogastobancario"
                    :readonly="excedenteSolicitud > 0"
                    :hint="excedenteSolicitud > 0 ? 'Excedente pagado por el cliente' : undefined"
                    :persistent-hint="excedenteSolicitud > 0"
                  />
                </v-col>
                <v-col
                  cols="3"
                  offset="9"
                >
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Monto Total a Pagar"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="totalGeneralAbonadoMonLocal"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="ing-actions"
                >
                  <v-btn
                    class="ing-btn ing-btn--ok"
                    variant="flat"
                    :loading="loading"
                    v-if="can('registroPayForCliente', 'NUEVO')"
                    @click="finalizarOperacion()"
                  >
                    Finalizar Operación
                  </v-btn>
                </v-col>
              </v-row>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog
      v-model="dialogLlenarMontoDepositadoBanco"
      persistent
      max-width="35%"
    >
      <v-card class="pa-2">
        <v-card-title class="text-headline-medium pb-2">
          <v-icon
            start
            color="primary"
          >
            mdi-hand-coin
          </v-icon> Confirmar Depósito
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Banner de advertencia idéntico a la imagen -->
          <v-alert
            border="start"
            border-color="warning"
            elevation="0"
            class="bg-amber-lighten-5 mb-4 rounded-lg"
          >
            <template #prepend>
              <v-icon
                size="36"
                color="amber-darken-2"
                class="mr-3"
              >
                mdi-alert
              </v-icon>
            </template>
            <div>
              <div
                class="text-body-medium font-weight-bold text-amber-darken-4 text-uppercase"
              >
                OBLIGATORIO PARA CONTINUAR
              </div>
              <div class="text-body-small font-weight-bold text-grey-darken-3">
                Ingresa el monto recibido en el banco, según tu estado de
                cuenta.
              </div>
            </div>
          </v-alert>

          <v-text-field
            variant="outlined"
            label="Monto recibido en el banco"
            ref="txtMontoLocal"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            :rules="[(v) => !!v || 'Este campo es obligatorio']"
            hide-details="auto"
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            color="error"
            @click="cancelarllenadoDeMonto()"
            variant="text"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmarDeposito"
          >
            CONTINUAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
/* Bancos > Nuevo Ingreso: diseño acordado (tarjetas verdes, nombres y botones a la derecha en los 3 pasos) */
.ing-form {
  --ing-verde: #1b5e20;
  --ing-verde-claro: #e8f5e9;
  --ing-borde: #d7e9d8;
}
.ing-tabs {
  border-radius: 10px;
}
.ing-tabs :deep(.v-tab) {
  min-width: 160px;
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.ing-tabs :deep(.v-tab--selected) {
  font-weight: 800;
}
.ing-form :deep(.ing-card) {
  border-color: var(--ing-borde);
  border-radius: 12px;
}
.ing-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  background: var(--ing-verde-claro);
}
.ing-card__head h3 {
  margin: 0;
  color: var(--ing-verde);
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
}
.ing-card__head p {
  margin: 2px 0 0;
  color: #37474f;
  font-size: 0.92rem;
}
.ing-card__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 1px solid var(--ing-borde);
  border-radius: 10px;
  background: #fff;
  color: var(--ing-verde);
}
.ing-card__simple {
  margin: 0;
  padding: 8px 16px;
  background: var(--ing-verde-claro);
  color: var(--ing-verde);
  font-size: 1.1rem;
  font-weight: 800;
}
.ing-label {
  margin: 2px 0 -2px;
  color: #1f2937;
  font-size: 0.88rem;
  font-weight: 700;
}
.ing-req {
  color: #d32f2f;
}
.ing-form :deep(.clsArchivoCargado) {
  border: 1px solid #b9dfbc;
  border-radius: 10px;
  background: var(--ing-verde-claro);
}
.ing-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 20px;
}
.ing-btn {
  min-width: 130px;
  min-height: 42px;
  border-radius: 8px !important;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.ing-btn--ok {
  background: var(--ing-verde) !important;
  color: #fff !important;
}
.ing-btn--cancel {
  border: 2px solid #d32f2f !important;
  color: #d32f2f !important;
}
@media (max-width: 600px) {
  .ing-card__head h3 {
    font-size: 1rem;
  }
  .ing-card__icon {
    width: 44px;
    height: 44px;
  }
  .ing-actions .ing-btn {
    flex: 1 1 0;
  }
}
</style>
