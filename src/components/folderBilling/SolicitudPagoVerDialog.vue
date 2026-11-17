<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import type { FacturaProveedorCargada, SolicitudPagoDetalle } from "@/types/billingEntries";

// Modo ver (ojito) de una solicitud de pago: Control de Gastos y Bancos > Solicitudes de Pago.
// Una pestaña por cada factura / proforma cargada del proveedor y, siempre al final, la solicitud de pago,
// que se ve igual al PDF de pago (Backend-Aco/src/views/pdf-solicitud.ejs).
const props = defineProps<{ idSolicitud: number | null }>();
// celular: pantalla completa, pestañas del mismo ancho y pagos del expediente en tarjetas
const { smAndDown } = useDisplay();
const abierto = defineModel<boolean>({ default: false });

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const LOGO_POR_DEFECTO = "https://point.qreport.site/files/logopiccargo.svg";

const detalle = ref<SolicitudPagoDetalle | null>(null);
const cargando = ref(false);
const error = ref("");

// facturas / proformas cargadas (Control de Gastos > Factura o Proforma) del proveedor y correlativo
const TAB_SOLICITUD = "solicitud";
const facturas = ref<FacturaProveedorCargada[]>([]);
const tab = ref<string | number>(TAB_SOLICITUD);

// "FACTURA - 0001-123", igual que el listado de facturas o proformas
function nombreFactura(f: FacturaProveedorCargada) {
  const tipo = f.type_pago == 1 ? "FACTURA" : f.type_pago == 2 ? "PROFORMA" : "OTRO";
  return `${tipo}${f.number ? ` - ${f.number}` : ""}`;
}

// el tipo llega como extensión ("pdf") o como MIME ("image/jpeg")
function tipoArchivo(f: FacturaProveedorCargada): "pdf" | "imagen" | "otro" {
  const tipo = `${f.type ?? ""} ${f.path ?? ""}`.toLowerCase();
  if (tipo.includes("pdf")) return "pdf";
  if (/image\/|\b(png|jpe?g|gif|webp|bmp)\b|\.(png|jpe?g|gif|webp|bmp)$/.test(tipo)) return "imagen";
  return "otro";
}

// "Ver Proforma – 1909" | "Solicitud de Pago" (la solicitud siempre al final)
function tituloPestana(f: FacturaProveedorCargada) {
  const tipo = f.type_pago == 1 ? "Factura" : f.type_pago == 2 ? "Proforma" : "Archivo";
  return `${smAndDown.value ? "" : "Ver "}${tipo}${f.number ? ` – ${f.number}` : ""}`;
}
const pestanas = computed(() => [
  ...facturas.value.map((f) => ({
    value: f.id as string | number,
    titulo: tituloPestana(f),
    icono: tipoArchivo(f) === "imagen" ? "mdi-file-image-outline" : "mdi-file-document-outline",
  })),
  { value: TAB_SOLICITUD as string | number, titulo: smAndDown.value ? "Solicitud" : "Solicitud de Pago", icono: "mdi-wallet-outline" },
]);

const facturaActual = computed(() => facturas.value.find((f) => f.id === tab.value) ?? null);

async function cargarFacturas(d: SolicitudPagoDetalle) {
  const response = await request<FacturaProveedorCargada>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "list_invoice_path",
    params: { id_master: d.id_master, id_proveedor: d.id_proveedor, id_correlativo: d.id_correlativo },
  });
  facturas.value = response.estadoflag ? response.data.filter((f) => f.estadoflag !== false && f.path) : [];
}

const logo = computed(() => {
  try {
    return sessionUser().path || LOGO_POR_DEFECTO;
  } catch {
    return LOGO_POR_DEFECTO;
  }
});

const esCodigo = computed(() => detalle.value?.codigo_tipopago === "02");
const autorizaciones = computed(() => [
  { titulo: "Revisado por:", usuario: detalle.value?.usuario_aprobadoadministracion ?? "", fecha: detalle.value?.fecha_aprobadoadministracion ?? null },
  { titulo: "Aprobado por:", usuario: detalle.value?.usuario_aprobadogerencia ?? "", fecha: detalle.value?.fecha_aprobadogerencia ?? null },
]);

function formatoMonto(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "15 de Noviembre del 2026", como la fecha del PDF de pago
function formatoFecha(valor: string | null | undefined) {
  if (!valor) return "";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} del ${anio}`;
}

// solo el nombre, sin el id del proveedor; en Pagos del expediente se agrega el correlativo
// para distinguir dos correlativos del mismo proveedor ("PIL PERÚ NAVIERA - 0002")
function nombreProveedor(nombre: string, correlativo: string | null) {
  return `${nombre}${correlativo ? ` - ${correlativo}` : ""}`;
}

function esActual(p: SolicitudPagoDetalle["pendientes"][number]) {
  const d = detalle.value;
  return !!d && p.id_proveedor === d.id_proveedor && (p.id_correlativo ?? null) === (d.id_correlativo ?? null);
}

// celular: los pagos del expediente van en tarjetas; se ven los primeros (y siempre el de la solicitud)
// y el resto con "Ver más"
const PENDIENTES_VISIBLES = 4;
const verTodosPendientes = ref(false);
const pendientesOrdenados = computed(() => {
  const lista = detalle.value?.pendientes ?? [];
  return [...lista.filter(esActual), ...lista.filter((p) => !esActual(p))];
});
const pendientesMovil = computed(() => {
  const lista = pendientesOrdenados.value;
  return verTodosPendientes.value ? lista : lista.filter((p, i) => i < PENDIENTES_VISIBLES || esActual(p));
});
const pendientesOcultos = computed(() => (detalle.value?.pendientes.length ?? 0) - pendientesMovil.value.length);
// estado de cada pago del expediente: la solicitud actual, pendiente por pagar o pagado
function estadoPendiente(p: SolicitudPagoDetalle["pendientes"][number]) {
  if (esActual(p)) return { clase: "status--curso", icono: "mdi-timer-sand", texto: "Solicitud en curso" };
  if (p.pagado) return { clase: "status--pagado", icono: "mdi-check-circle", texto: "Pagado" };
  return { clase: "", icono: "mdi-clock-outline", texto: "Pendiente por pagar" };
}
const LEYENDA = [
  { clase: "curso", icono: "mdi-timer-sand", titulo: "Solicitud en curso:", texto: "Solicitud que estás realizando actualmente." },
  { clase: "pend", icono: "mdi-clock-outline", titulo: "Pendiente por pagar:", texto: "No solicitada aún." },
  { clase: "pagado", icono: "mdi-check-circle", titulo: "Pagado:", texto: "Pago confirmado." },
];

// icono según el giro que se lee en el nombre del proveedor
function iconoProveedor(nombre: string) {
  const n = nombre.toUpperCase();
  if (/ADUAN/.test(n)) return "mdi-office-building-outline";
  if (/NAVIER|SHIPPING|LINE|MARITIM|LOGISTIC|WORLD/.test(n)) return "mdi-ferry";
  if (/TRANSP|CARGA|TRUCK|COURIER/.test(n)) return "mdi-truck-outline";
  if (/DEPOT|DEPOSIT|ALMAC|WAREHOUSE|TERMINAL/.test(n)) return "mdi-warehouse";
  return "mdi-storefront-outline";
}

async function cargar() {
  if (!props.idSolicitud) return;
  cargando.value = true;
  error.value = "";
  detalle.value = null;
  facturas.value = [];
  tab.value = TAB_SOLICITUD;
  verTodosPendientes.value = false;
  const response = await request<SolicitudPagoDetalle>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_ver/" + props.idSolicitud,
  });
  if (!response.estadoflag || !response.data[0]) {
    cargando.value = false;
    error.value = response.mensaje || CONNECTION_ERROR_MESSAGE;
    return;
  }
  await cargarFacturas(response.data[0]);
  // preseleccionada la primera pestaña (la primera factura); sin facturas, la solicitud
  tab.value = facturas.value[0]?.id ?? TAB_SOLICITUD;
  cargando.value = false;
  detalle.value = response.data[0];
}

watch(
  () => [abierto.value, props.idSolicitud] as const,
  ([visible]) => {
    if (visible) cargar();
  },
  { immediate: true },
);
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="760"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card
      class="spver"
      :class="{ 'spver--movil': smAndDown }"
    >
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="spver__close"
        aria-label="Cerrar"
        @click="abierto = false"
      />

      <div
        v-if="cargando"
        class="spver__state"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
        Cargando solicitud…
      </div>
      <div
        v-else-if="error"
        class="spver__state text-error"
      >
        <v-icon>mdi-alert-circle-outline</v-icon> {{ error }}
      </div>

      <!-- pestañas: facturas / proformas cargadas y, al final, la solicitud de pago -->
      <div
        v-if="detalle && facturas.length"
        class="spver__tabs"
        role="tablist"
        :style="smAndDown ? { gridTemplateColumns: `repeat(${pestanas.length}, minmax(0, 1fr))` } : undefined"
      >
        <button
          v-for="t in pestanas"
          :key="t.value"
          type="button"
          role="tab"
          class="spver__tab"
          :class="{ 'spver__tab--activa': tab === t.value }"
          :aria-selected="tab === t.value"
          @click="tab = t.value"
        >
          <v-icon :size="smAndDown ? 20 : 26">
            {{ t.icono }}
          </v-icon>
          <span class="spver__tablabel">{{ t.titulo }}</span>
        </button>
      </div>

      <!-- archivo de la factura / proforma -->
      <div
        v-if="detalle && facturaActual"
        class="spver__doc"
      >
        <!-- en celular el PDF muchas veces no se ve dentro de la página: se abre aparte -->
        <a
          v-if="smAndDown"
          :href="facturaActual.path"
          target="_blank"
          rel="noopener"
          class="spver__open"
        >
          <v-icon size="18">mdi-open-in-new</v-icon>
          Abrir {{ tipoArchivo(facturaActual) === "pdf" ? "PDF" : "archivo" }}
        </a>
        <iframe
          v-if="tipoArchivo(facturaActual) === 'pdf'"
          :src="facturaActual.path"
          :title="nombreFactura(facturaActual)"
          class="spver__docframe"
        />
        <img
          v-else-if="tipoArchivo(facturaActual) === 'imagen'"
          :src="facturaActual.path"
          :alt="nombreFactura(facturaActual)"
          class="spver__docimg"
        >
        <div
          v-else
          class="spver__state"
        >
          <v-icon>mdi-file-outline</v-icon>
          No se puede mostrar este archivo aquí.
          <a
            :href="facturaActual.path"
            target="_blank"
            rel="noopener"
          >Abrir archivo</a>
        </div>
      </div>

      <div
        v-else-if="detalle"
        class="spver__body"
      >
        <!-- cabecera -->
        <header class="head">
          <img
            class="head__logo"
            :src="logo"
            alt=""
          >
          <div class="head__title">
            Solicitud de Pago
          </div>
          <div class="head__exp">
            <div class="head__pill">
              EXP {{ detalle.nro_master || detalle.expediente }}
            </div>
            <div class="head__date">
              {{ formatoFecha(detalle.fechasolicitud) }}
            </div>
          </div>
        </header>

        <!-- proveedor y monto -->
        <section class="hero">
          <div class="hero__item">
            <svg
              class="ico"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            ><path d="M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 12v8h14v-8M9 20v-5h6v5" /></svg>
            <div>
              <div class="hero__label">
                Proveedor
              </div>
              <div class="hero__value">
                {{ detalle.proveedor }}
              </div>
            </div>
          </div>
          <div class="hero__item">
            <svg
              class="ico"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            ><ellipse
              cx="9"
              cy="7"
              rx="6"
              ry="3"
            /><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7M3 11v4c0 1.7 2.7 3 6 3 1 0 2-.1 2.8-.4" /><ellipse
              cx="16"
              cy="15"
              rx="5"
              ry="2.5"
            /><path d="M11 15v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3" /></svg>
            <div>
              <div class="hero__label">
                Monto a Pagar
              </div>
              <div class="hero__value hero__value--monto">
                {{ formatoMonto(detalle.monto) }} {{ detalle.moneda }}
              </div>
            </div>
          </div>
        </section>

        <!-- cliente / ya pagó -->
        <section class="client">
          <svg
            class="ico ico--sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          ><circle
            cx="12"
            cy="8"
            r="4"
          /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          <div class="client__data">
            <div class="client__label">
              Cliente
            </div>
            <div class="client__name">
              {{ detalle.clientes || "—" }}
            </div>
          </div>
          <div class="client__paid">
            ¿Ya pagó? <b :class="{ si: detalle.pagadoflag }">{{ detalle.pagadoflag ? "Sí" : "No" }}</b>
          </div>
        </section>

        <!-- datos para el pago -->
        <section class="card">
          <div class="card__head">
            <svg
              class="ico ico--sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            ><rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
            /><path d="M3 10h18M16 15h2" /></svg>
            Datos para el Pago
          </div>
          <div
            v-if="esCodigo"
            class="rows"
          >
            <div class="row">
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
              /><path d="M7 10h2M7 14h6" /></svg>
              <span class="row__label">Método:</span>
              <span class="row__value"><span class="pill">Código de Pago</span></span>
            </div>
            <div class="row">
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></svg>
              <span class="row__label">Código de pago:</span>
              <span class="row__value">{{ detalle.codigopago || "—" }}</span>
            </div>
          </div>
          <div
            v-else-if="detalle.nrocuenta || detalle.banco"
            class="rows"
          >
            <div class="row">
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></svg>
              <span class="row__label">Banco:</span>
              <span class="row__value">{{ detalle.banco || "—" }}</span>
            </div>
            <div class="row">
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
              /><path d="M7 10h2M7 14h6" /></svg>
              <span class="row__label">Método:</span>
              <span class="row__value"><span class="pill">Transferencia Bancaria</span></span>
            </div>
            <div class="row">
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
              /><path d="M3 10h18M7 15h4" /></svg>
              <span class="row__label">N° de Cuenta:</span>
              <span class="row__value">
                {{ detalle.nrocuenta || "—" }}
                <span
                  v-if="detalle.moneda_cuenta"
                  class="row__coin"
                >({{ detalle.moneda_cuenta }})</span>
              </span>
            </div>
            <div
              v-if="detalle.cci"
              class="row"
            >
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
              /><path d="M3 10h18M7 15h4" /></svg>
              <span class="row__label">CCI:</span>
              <span class="row__value">{{ detalle.cci }}</span>
            </div>
            <div
              v-if="detalle.beneficiario"
              class="row"
            >
              <svg
                class="ico ico--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              ><circle
                cx="12"
                cy="8"
                r="4"
              /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              <span class="row__label">Beneficiario:</span>
              <span class="row__value">{{ detalle.beneficiario }}</span>
            </div>
          </div>
          <div
            v-else
            class="comentario"
          >
            Sin cuenta bancaria seleccionada.
          </div>
          <div
            v-if="detalle.comentario"
            class="comentario comentario--sep"
          >
            <b>Comentarios:</b> {{ detalle.comentario }}
          </div>
        </section>

        <!-- autorizaciones: Revisado (Administración) / Aprobado (Gerencia), como el PDF de pago -->
        <div class="auth__head">
          <div class="auth__pill">
            <svg
              class="ico ico--sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            ><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
            Autorizaciones
          </div>
        </div>
        <section class="auth">
          <div
            v-for="a in autorizaciones"
            :key="a.titulo"
            class="auth__col"
          >
            <div class="auth__label">
              {{ a.titulo }}
            </div>
            <div class="auth__sign">
              {{ a.usuario }}
            </div>
            <div class="auth__date">
              <v-icon
                size="18"
                color="#0b5fd6"
              >
                mdi-calendar-month-outline
              </v-icon>
              Fecha:
              <span class="auth__dateline">{{ formatoFecha(a.fecha) }}</span>
            </div>
          </div>
        </section>

        <!-- pagos del expediente -->
        <section>
          <div class="pend__title">
            <svg
              class="ico ico--sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            ><path d="M9 6h12M9 12h12M9 18h12" /><circle
              cx="4"
              cy="6"
              r="1"
            /><circle
              cx="4"
              cy="12"
              r="1"
            /><circle
              cx="4"
              cy="18"
              r="1"
            /></svg>
            Pagos Pendientes del Expediente
          </div>
          <!-- celular: tarjetas por proveedor con Pricing y Operaciones -->
          <div
            v-if="smAndDown"
            class="pmov"
          >
            <p
              v-if="!detalle.pendientes.length"
              class="center text-medium-emphasis"
            >
              No hay pagos en el expediente.
            </p>
            <article
              v-for="p in pendientesMovil"
              :key="`${p.id_proveedor}-${p.id_correlativo}`"
              class="pmov__card"
              :class="{ 'pmov__card--actual': esActual(p) }"
            >
              <div class="pmov__head">
                <span class="pmov__icon">
                  <v-icon size="24">{{ iconoProveedor(p.proveedor) }}</v-icon>
                </span>
                <div class="pmov__name">
                  <div class="pmov__prov">
                    {{ p.proveedor }}
                  </div>
                  <div class="pmov__code">
                    Código: {{ p.id_proveedor }}{{ p.correlativo ? ` - ${p.correlativo}` : "" }}
                  </div>
                </div>
                <span
                  class="status"
                  :class="estadoPendiente(p).clase"
                >
                  <v-icon size="16">{{ estadoPendiente(p).icono }}</v-icon>
                  {{ estadoPendiente(p).texto }}
                </span>
              </div>
              <div class="pmov__montos">
                <div>
                  <span class="pmov__label"><v-icon size="16">mdi-tag-outline</v-icon> Pricing ({{ detalle.moneda || "USD" }})</span>
                  <b>{{ formatoMonto(p.total_pr) }}</b>
                </div>
                <div>
                  <span class="pmov__label"><v-icon size="16">mdi-cog-outline</v-icon> Operaciones ({{ detalle.moneda || "USD" }})</span>
                  <b>{{ formatoMonto(p.total_op ?? p.total) }}</b>
                </div>
              </div>
            </article>
            <v-btn
              v-if="pendientesOcultos > 0 || verTodosPendientes"
              block
              variant="tonal"
              color="primary"
              rounded="lg"
              class="pmov__mas"
              :append-icon="verTodosPendientes ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="verTodosPendientes = !verTodosPendientes"
            >
              {{ verTodosPendientes ? "Ver menos" : `Ver más (${pendientesOcultos})` }}
            </v-btn>
          </div>
          <div
            v-else
            class="tabla"
          >
            <table>
              <thead>
                <tr>
                  <th>Proveedor / Concepto</th>
                  <th class="num">
                    Pricing ({{ detalle.moneda || "USD" }})
                  </th>
                  <th class="num">
                    Operaciones ({{ detalle.moneda || "USD" }})
                  </th>
                  <th class="center">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!detalle.pendientes.length">
                  <td
                    colspan="4"
                    class="center text-medium-emphasis"
                  >
                    No hay pagos en el expediente.
                  </td>
                </tr>
                <tr
                  v-for="p in pendientesOrdenados"
                  :key="`${p.id_proveedor}-${p.id_correlativo}`"
                  :class="{ actual: esActual(p) }"
                >
                  <td>{{ nombreProveedor(p.proveedor, p.correlativo) }}</td>
                  <td class="num">
                    {{ formatoMonto(p.total_pr) }}
                  </td>
                  <td class="num">
                    {{ formatoMonto(p.total_op ?? p.total) }}
                  </td>
                  <td class="center">
                    <span
                      class="status"
                      :class="estadoPendiente(p).clase"
                    >
                      <v-icon size="16">{{ estadoPendiente(p).icono }}</v-icon>
                      {{ estadoPendiente(p).texto }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- leyenda de estados -->
          <div class="leyenda">
            <div class="leyenda__titulo">
              Estados:
            </div>
            <div
              v-for="l in LEYENDA"
              :key="l.clase"
              class="leyenda__item"
            >
              <div
                class="leyenda__tag"
                :class="`leyenda__tag--${l.clase}`"
              >
                <v-icon size="18">
                  {{ l.icono }}
                </v-icon>
                <span>{{ l.titulo }}</span>
              </div>
              {{ l.texto }}
            </div>
          </div>
        </section>

        <p class="nota">
          * Toda solicitud de efectivo debe ser rendida o sustentada con comprobantes de pago.
          * Las hojas de movilidad deben estar firmadas por el jefe inmediato o quien autorizó el gasto.
          · Solicitud N° {{ detalle.id }}
        </p>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Mismos tamaños y colores que el PDF de pago (pdf-solicitud.ejs) */
.spver {
  position: relative;
  overflow: hidden;
  border-radius: 20px !important;
  color: #0a1f44;
  background: #fff;
  font-size: 0.95rem;
}
.spver__close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
}
.spver__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 24px;
}
/* pestañas grandes: activa en azul sólido, el resto en celeste con borde */
.spver__tabs {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  padding: 16px 56px 0 20px;
  overflow-x: auto;
  border-bottom: 1px solid #dce5f2;
}
.spver__tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 10px 26px;
  border: 1.5px solid #c9dafa;
  border-bottom-width: 0;
  border-radius: 14px 14px 0 0;
  background: #eef4ff;
  color: #0b4fd6;
  font-size: 1.15rem;
  font-weight: 700;
  white-space: nowrap;
  transition: background-color 0.15s, color 0.15s;
}
.spver__tab:hover {
  background: #e0ebff;
}
.spver__tab--activa,
.spver__tab--activa:hover {
  border-color: #0b4fd6;
  background: #0b4fd6;
  color: #fff;
  box-shadow: inset 0 -4px 0 #4f8ef7;
}
.spver__tab:focus-visible {
  outline: 2px solid #4f8ef7;
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .spver__tabs {
    padding: 12px 48px 0 12px;
  }
  .spver__tab {
    min-height: 46px;
    padding: 8px 16px;
    font-size: 1rem;
  }
}
/* celular: pantalla completa; la X arriba con su propio espacio y pestañas del mismo ancho */
.spver--movil {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0 !important;
}
.spver--movil .spver__close {
  top: 4px;
  right: 4px;
}
.spver--movil .spver__tabs {
  display: grid;
  gap: 6px;
  padding: 48px 10px 0;
  overflow: visible;
}
.spver--movil .spver__tab {
  justify-content: center;
  min-width: 0;
  min-height: 44px;
  gap: 6px;
  padding: 6px 8px;
  font-size: 0.9rem;
}
.spver__tablabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spver--movil .spver__doc {
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: auto;
  min-height: 0;
  padding: 10px;
}
.spver--movil .spver__docframe {
  flex: 1 1 auto;
  min-height: 0;
}
.spver--movil .spver__docimg {
  max-height: 100%;
  min-height: 0;
  object-fit: contain;
  align-self: center;
}
.spver__open {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  align-self: flex-end;
  padding: 6px 14px;
  border-radius: 999px;
  background: #0b5fd6;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}
.spver--movil .spver__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 52px 14px 20px;
}
.spver--movil .spver__tabs + .spver__body {
  padding-top: 16px;
}
/* factura / proforma: el archivo ocupa el modal */
.spver__doc {
  display: flex;
  justify-content: center;
  height: 75vh;
  padding: 12px;
  overflow: auto;
  background: #eef2f8;
}
.spver__docframe {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
  background: #fff;
}
.spver__docimg {
  max-width: 100%;
  height: auto;
  align-self: flex-start;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(10, 31, 68, 0.15);
}
.spver__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 28px;
  overflow-y: auto;
}
/* sin esto las tarjetas (overflow: hidden) se encogen y "Datos para el Pago" queda vacío */
.spver__body > * {
  flex-shrink: 0;
}
.ico {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  color: #0b5fd6;
}
.ico--sm {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
}

/* cabecera */
.head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-right: 28px;
}
.head__logo {
  height: 52px;
  max-width: 170px;
  object-fit: contain;
}
.head__title {
  flex: 1;
  padding-left: 18px;
  border-left: 2px solid #c9d6ea;
  font-size: 1.85rem;
  font-weight: 900;
  line-height: 1.15;
}
.head__exp {
  text-align: center;
}
.head__pill {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 10px;
  background: #dcebfd;
  font-size: 1.15rem;
  font-weight: 900;
  white-space: nowrap;
}
.head__date {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #3b4a63;
}

/* proveedor y monto */
.hero {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-radius: 14px;
  background: #e3eefc;
}
.hero__item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.hero__item + .hero__item {
  padding-left: 18px;
  border-left: 2px solid #b9cdea;
}
.hero__label {
  font-size: 0.78rem;
  font-weight: 700;
}
.hero__value {
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.hero__value--monto {
  white-space: nowrap;
}

.client {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 6px 12px;
  border-bottom: 1px solid #e3e9f2;
}
.client__data {
  flex: 1;
  min-width: 0;
}
.client__label {
  font-size: 0.78rem;
  font-weight: 700;
}
.client__name {
  font-size: 0.85rem;
}
.client__paid {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px;
  border-left: 1px solid #e3e9f2;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}
.client__paid b {
  padding: 6px 16px;
  border-radius: 8px;
  background: #e9edf3;
  font-size: 1rem;
}
.client__paid b.si {
  background: #d8f0d2;
  color: #1d6b12;
}

/* tarjetas */
.card {
  border: 1px solid #dce5f2;
  border-radius: 14px;
  overflow: hidden;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #e3eefc;
  font-size: 1.1rem;
  font-weight: 700;
}
.rows {
  padding: 2px 16px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
}
.row + .row {
  border-top: 1px solid #e8edf5;
}
.row__label {
  width: 120px;
  flex: 0 0 120px;
  font-size: 0.85rem;
  font-weight: 700;
}
.row__value {
  flex: 1;
  min-width: 0;
  font-size: 1.1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.row__coin {
  font-size: 0.78rem;
  font-weight: 500;
}
.pill {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 8px;
  background: #dcebfd;
  font-size: 0.95rem;
  font-weight: 700;
}
.comentario {
  padding: 10px 16px;
  font-size: 0.85rem;
}
.comentario--sep {
  border-top: 1px solid #e8edf5;
}

/* autorizaciones */
.auth__head {
  display: flex;
  align-items: center;
}
.auth__head::before,
.auth__head::after {
  content: "";
  flex: 1;
  border-top: 2px solid #0b2f6b;
}
.auth__pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 30px;
  border-radius: 999px;
  background: #0b2f6b;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
}
.auth__pill .ico {
  color: #fff;
}
.auth {
  display: flex;
  padding: 18px 0;
  border: 1px solid #dce5f2;
  border-radius: 14px;
}
.auth__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
}
.auth__col + .auth__col {
  border-left: 1px solid #c9d6ea;
}
.auth__label {
  font-size: 0.95rem;
  font-weight: 700;
}
.auth__sign {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 85%;
  min-height: 40px;
  padding-bottom: 2px;
  border-bottom: 1.5px solid #0a1f44;
  font-size: 0.85rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.auth__date {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 92%;
  margin-top: 14px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #e3eefc;
  font-size: 0.75rem;
}
.auth__dateline {
  flex: 1;
  min-height: 18px;
  border-bottom: 1px solid #0a1f44;
  font-weight: 700;
  text-align: center;
}

/* pagos del expediente */
.pend__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
}
.tabla {
  overflow-x: auto;
  border: 1px solid #dce5f2;
  border-radius: 14px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
th {
  padding: 9px 14px;
  background: #e3eefc;
  text-align: left;
  font-size: 0.78rem;
}
td {
  padding: 8px 14px;
  border-top: 1px solid #e8edf5;
  font-weight: 700;
}
.num {
  text-align: right;
  white-space: nowrap;
}
.center {
  text-align: center;
}
/* la solicitud actual va primero y resaltada */
tr.actual td {
  background: #fde3cc;
}
tr.actual td:first-child {
  box-shadow: inset 6px 0 0 #f26b0f;
}
.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 170px;
  padding: 4px 12px;
  border: 1.5px solid #9aa3b2;
  border-radius: 8px;
  background: #fff;
  color: #1f2a44;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}
.status--curso {
  border-color: #f26b0f;
  background: #f26b0f;
  color: #fff;
}
.status--pagado {
  border-color: #c9efcf;
  background: #d8f5dc;
  color: #14532d;
}
.status--pagado .v-icon {
  color: #16a34a;
}
.leyenda {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid #dce5f2;
  border-radius: 14px;
  background: #f6f9ff;
  font-size: 0.78rem;
}
.leyenda__titulo {
  margin-right: 6px;
  padding-right: 14px;
  border-right: 1px solid #9fb4d6;
  font-size: 1rem;
  font-weight: 700;
}
.leyenda__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 8px;
  text-align: center;
}
.leyenda__item + .leyenda__item {
  border-left: 1px solid #9fb4d6;
}
.leyenda__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}
.leyenda__tag span {
  padding: 2px 10px;
  border-radius: 6px;
}
.leyenda__tag--curso span { background: #fde3cc; color: #c2410c; }
.leyenda__tag--curso .v-icon { color: #f26b0f; }
.leyenda__tag--pend span { background: #e8ebf0; color: #1f2a44; }
.leyenda__tag--pagado span { background: #d8f5dc; color: #14532d; }
.leyenda__tag--pagado .v-icon { color: #16a34a; }
@media (max-width: 600px) {
  .leyenda {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .leyenda__titulo {
    border-right: 0;
  }
  .leyenda__item + .leyenda__item {
    padding-top: 8px;
    border-left: 0;
    border-top: 1px solid #c9d6ea;
  }
  .pmov__head .status {
    min-width: 0;
    white-space: normal;
  }
}

/* pagos del expediente en celular */
.pmov {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pmov__card {
  padding: 12px;
  border: 1px solid #dce5f2;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(10, 31, 68, 0.05);
}
.pmov__card--actual {
  border-color: #f8b98a;
  background: #fff1e6;
}
.pmov__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.pmov__icon {
  display: grid;
  flex: 0 0 44px;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #e8f0fc;
  color: #0b3d91;
}
.pmov__name {
  flex: 1 1 auto;
  min-width: 0;
}
.pmov__prov {
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.pmov__code {
  margin-top: 2px;
  font-size: 0.82rem;
  color: #4a5670;
}
.pmov__montos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 10px;
  padding: 8px 4px;
  border-radius: 12px;
  background: #eef3fb;
}
.pmov__card--actual .pmov__montos {
  background: #fcefd0;
}
.pmov__montos > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
}
.pmov__montos > div + div {
  border-left: 1px solid #c9d6ea;
}
.pmov__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: #4a5670;
}
.pmov__montos b {
  font-size: 1.2rem;
  font-weight: 900;
}
.pmov__mas {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 800;
}

.nota {
  margin: 0;
  font-size: 0.68rem;
  color: #4a5670;
}
@media (max-width: 600px) {
  .head {
    flex-wrap: wrap;
  }
  .head__title {
    font-size: 1.4rem;
  }
  .hero,
  .auth {
    flex-direction: column;
    align-items: stretch;
  }
  .hero__item + .hero__item {
    margin-top: 12px;
    padding: 12px 0 0;
    border-left: 0;
    border-top: 2px solid #b9cdea;
  }
  .auth {
    gap: 16px;
  }
  .auth__col + .auth__col {
    padding-top: 16px;
    border-left: 0;
    border-top: 1px solid #c9d6ea;
  }
  .auth__date {
    width: 90%;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  .auth__dateline {
    min-height: 0;
    padding-left: 12px;
    border-bottom: 0;
    border-left: 1px solid #b9cdea;
  }
}
</style>
