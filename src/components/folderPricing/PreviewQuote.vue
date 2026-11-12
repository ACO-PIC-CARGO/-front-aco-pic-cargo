<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import moment from "moment";
import { useAduanaStore } from "@/stores/aduana";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import type {
  DatosPrevisualizacion,
  LineaReporte,
  OpcionVistaPrevia,
  Servicio,
  VistaPreviaCotizacion,
} from "@/types/cotizacion";
import type { SucursalSesion } from "@/types/sesion";

interface DatosCotizacionVistaPrevia extends VistaPreviaCotizacion {
  address?: string;
  amount?: number | string;
  business_name?: string;
  code?: string;
  contenedor?: { name?: string; valor?: number | string }[];
  document?: string;
  esAduana?: boolean;
  fechafin?: string | null;
  monto?: number | string | null;
  nameEmpresa?: string;
  phone?: string;
  telefono?: string;
  telefonoCliente?: string;
  tiempoTransito?: number | string;
}

interface GrupoServicios {
  title: string;
  items: LineaReporte[];
  total: number;
}

const props = defineProps<{ data: DatosPrevisualizacion | null; index: number }>();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const datosEmpresa = ref<Partial<SucursalSesion> | null>(null);

const quote = computed(
  () => props.data as unknown as DatosCotizacionVistaPrevia | null,
);
const datosCarga = computed(() =>
  quote.value?.esAduana
    ? aduanaStore.datosPrincipales
    : pricingStore.datosPrincipales,
);
const option = computed<OpcionVistaPrevia | null>(
  () => quote.value?.OpcionesSelecciondas?.[props.index - 1] ?? null,
);
const companyName = computed(
  () => datosEmpresa.value?.trade_name || quote.value?.nameEmpresa || quote.value?.business_name || "",
);
const quoteNumber = computed(() => {
  if (quote.value?.esAduana) {
    return aduanaStore.nro_quote || quote.value.code || "#####";
  }
  return pricingStore.nro_quote || aduanaStore.nro_quote || quote.value?.code || "#####";
});
const validityDate = computed(
  () => option.value?.date_end || quote.value?.fechafin || "",
);
const transitTime = computed(
  () => option.value?.tiempo_transito ?? quote.value?.tiempoTransito,
);
const clientPhone = computed(
  () => quote.value?.telefonoCliente || quote.value?.telefono || datosCarga.value.telefono || "",
);
const merchandiseAmount = computed(() =>
  [
    quote.value?.amount,
    quote.value?.monto,
    datosCarga.value.amount,
    datosCarga.value.monto,
  ].find((value) => value !== undefined && value !== null && value !== ""),
);
// Same text the PDF prints: always uppercase, hidden when the quote has no description.
const cargoDescription = computed(() =>
  String(datosCarga.value.descripcioncarga ?? "").trim().toUpperCase(),
);
const weightDisplay = computed(() =>
  withUnit(quote.value?.peso ?? datosCarga.value.peso, "kg") || "—",
);
const volumeDisplay = computed(() =>
  withUnit(quote.value?.volumen ?? datosCarga.value.volumen, "m³") || "—",
);
const isFCL = computed(() => {
  const tipoCarga = datosCarga.value.idtipocarga;
  const id = typeof tipoCarga === "object" && tipoCarga !== null
    ? tipoCarga.id
    : tipoCarga;
  const listShipment = quote.value?.esAduana
    ? aduanaStore.listShipment
    : pricingStore.listShipment;
  const shipment = (listShipment || []).find(
    (item) => item && item.id == id,
  );
  return shipment?.code === "FCL";
});
const containersDisplay = computed(() =>
  (quote.value?.contenedor ?? [])
    .filter((container): container is { name: string; valor: number | string } =>
      typeof container.name === "string" &&
      container.name.length > 0 &&
      container.valor !== undefined &&
      container.valor !== null)
    .map((container) => `${container.valor}x${container.name}`)
    .join(" + "),
);

function getServiceLines(...groups: (LineaReporte[] | undefined)[]): LineaReporte[] {
  return groups.flatMap((items) => items ?? []).filter((item) => !!item.name);
}

const detailLines = computed(() => {
  const current = option.value;
  if (!current) return [];
  return getServiceLines(
    current.datosFlete,
    current.datosOrigen,
    current.datosLocales,
    current.datosAduanas,
    current.datosAlmacenes,
    current.datosGastosTerceros ?? current.datosGastosTercero,
  );
});

function amountNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const amount = String(value).replace(/[^\d,.-]/g, "");
  const decimalSeparator = amount.lastIndexOf(",") > amount.lastIndexOf(".") ? "," : ".";
  const normalized = amount
    .replace(decimalSeparator === "," ? /\./g : /,/g, "")
    .replace(decimalSeparator, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | string | null | undefined): string {
  return `US$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountNumber(value))}`;
}

function formatMerchandiseAmount(value: number | string | null | undefined): string {
  return `US$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amountNumber(value))}`;
}

function formatPercentage(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === "") return "0";
  const parsed = typeof value === "number"
    ? value
    : Number(String(value).replace("%", "").trim().replace(",", "."));
  if (!Number.isFinite(parsed)) return String(value).replace("%", "").trim();
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(parsed);
}

function sumAmounts(...values: (string | number | undefined)[]): number {
  return values.reduce<number>((total, value) => total + amountNumber(value), 0);
}

const groupedServices = computed<GrupoServicios[]>(() => {
  const current = option.value;
  if (!current) return [];
  const groups: GrupoServicios[] = [
    {
      title: "Origen: Flete y gastos de origen",
      items: getServiceLines(current.datosFlete, current.datosOrigen),
      total: sumAmounts(current.totalFlete, current.totalOrigen),
    },
    {
      title: "Destino: Gastos navieros",
      items: getServiceLines(current.datosLocales),
      total: amountNumber(current.totalLocales),
    },
    {
      title: "Destino: Aduanas",
      items: getServiceLines(current.datosAduanas),
      total: amountNumber(current.totalAduanas),
    },
    {
      title: "Destino: Almacén",
      items: getServiceLines(current.datosAlmacenes),
      total: amountNumber(current.totalAlmacenes),
    },
    {
      title: "Destino: Gastos de tercero",
      items: getServiceLines(current.datosGastosTerceros ?? current.datosGastosTercero),
      total: amountNumber(current.totalGastosTercero),
    },
  ];
  return groups.filter((group) => group.items.length > 0);
});

const includedServices = computed(() => {
  const current = option.value;
  if (!current) return [];
  const services = current.listServices
    .filter((service: Servicio) => Number(service.status) === 1)
    .map((service) => service.service);
  const notes = current.listNotasQuote
    .filter((note) => note.estado === 1 && note.statusincluye === 1)
    .map((note) => note.descripcion);
  return [...services, ...notes].filter((name): name is string => !!name);
});

const excludedServices = computed(() => {
  const current = option.value;
  if (!current) return [];
  const services = current.listServices
    .filter((service: Servicio) => Number(service.status) !== 1)
    .map((service) => service.service);
  const notes = current.listNotasQuote
    .filter((note) => note.estado === 1 && note.statusnoincluye === 1)
    .map((note) => note.descripcion);
  return [...services, ...notes].filter((name): name is string => !!name);
});

const importantNotes = computed(
  () => option.value?.listNotasQuote
    .filter((note) => note.estado === 1 && note.statusprincipal === 1)
    .map((note) => note.descripcion)
    .filter((name): name is string => !!name) ?? [],
);

function formatDate(value: string | null | undefined): string {
  return value && moment(value).isValid() ? moment(value).format("DD-MM-YYYY") : "";
}

function withUnit(value: unknown, unit: string): string {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).trim();
  const unitPattern = unit === "m³" ? /\s*m(?:³|3)$/i : /\s*kg$/i;
  if (unitPattern.test(text)) {
    return `${text.replace(unitPattern, "").trim()} ${unit}`;
  }
  return `${text} ${unit}`;
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.ctrlKey && event.key.toLowerCase() === "p") event.preventDefault();
}

onMounted(() => {
  const dataBranch = sessionStorage.getItem("dataBranch");
  if (dataBranch) {
    datosEmpresa.value = (JSON.parse(dataBranch) as SucursalSesion[])[0] ?? null;
  }
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>

<template>
  <article
    v-if="quote && option"
    class="quote-sheet"
  >
    <header class="quote-header">
      <div class="quote-brand">
        <img
          v-if="datosEmpresa?.logo"
          class="company-logo"
          :src="datosEmpresa.logo"
          alt="Logo de la empresa"
        >
        <div
          v-else
          class="company-name"
        >
          {{ companyName }}
        </div>
      </div>
      <div class="ship-banner" />
      <div class="quote-heading">
        <strong>Cotización N.º</strong>
        <span class="quote-number">{{ quoteNumber }}</span>
      </div>
    </header>

    <section
      class="quote-meta"
      aria-label="Datos de la cotización"
    >
      <div class="meta-column">
        <div class="meta-line">
          <v-icon icon="mdi-calendar-month" />
          <span><b>Fecha:</b> {{ moment().format("DD-MM-YYYY") }}</span>
        </div>
        <div class="meta-line">
          <span><b>RUC:</b> {{ datosEmpresa?.document || quote.document }}</span>
        </div>
      </div>
      <div class="meta-column">
        <div class="meta-line">
          <v-icon icon="mdi-account" />
          <span><b>Cliente:</b> {{ quote.cliente }}</span>
        </div>
        <div
          v-if="clientPhone"
          class="meta-line"
        >
          <v-icon icon="mdi-phone" />
          <span><b>Tel.:</b> {{ clientPhone }}</span>
        </div>
      </div>
      <div class="meta-column">
        <div
          v-if="validityDate"
          class="meta-line"
        >
          <v-icon icon="mdi-calendar-check" />
          <span><b>Válida hasta:</b> {{ formatDate(validityDate) }}</span>
        </div>
        <div
          v-if="transitTime !== undefined && transitTime !== null && transitTime !== ''"
          class="meta-line"
        >
          <v-icon icon="mdi-calendar-clock" />
          <span><b>Tiempo de tránsito:</b> {{ transitTime }}</span>
        </div>
      </div>
    </section>

    <section class="shipment-card">
      <h2><v-icon icon="mdi-ferry" /> Datos de Embarque</h2>
      <div class="shipment-grid">
        <dl>
          <div>
            <dt>Origen:</dt>
            <dd>{{ quote.origen || "—" }}</dd>
          </div>
          <div>
            <dt>Destino:</dt>
            <dd>{{ quote.destino || "—" }}</dd>
          </div>
          <div>
            <dt>Modalidad:</dt>
            <dd>{{ quote.sentido || "—" }}</dd>
          </div>
          <div>
            <dt>Tipo de embarque:</dt>
            <dd>{{ quote.embarque || "—" }}</dd>
          </div>
          <div v-if="cargoDescription">
            <dt>Descripción de carga:</dt>
            <dd>{{ cargoDescription }}</dd>
          </div>
        </dl>
        <dl>
          <div>
            <dt>Incoterms:</dt>
            <dd>{{ quote.icoterm || "—" }}</dd>
          </div>
          <div v-if="isFCL">
            <dt>Contenedores:</dt>
            <dd>{{ containersDisplay || "—" }}</dd>
          </div>
          <div v-if="quote.esAduana || !isFCL">
            <dt>N.º de bultos:</dt>
            <dd>{{ quote.numerobultos || "—" }}</dd>
          </div>
          <div v-if="quote.esAduana || !isFCL">
            <dt>Peso:</dt>
            <dd>{{ weightDisplay }}</dd>
          </div>
          <div v-if="quote.esAduana || !isFCL">
            <dt>Volumen:</dt>
            <dd>{{ volumeDisplay }}</dd>
          </div>
          <div v-if="merchandiseAmount !== undefined">
            <dt>Valor de mercancía:</dt>
            <dd class="merchandise-value">
              {{ formatMerchandiseAmount(merchandiseAmount) }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <section
      v-if="quote.tipo === 'TOTAL'"
      class="services-card"
    >
      <div class="section-heading">
        <h2><v-icon icon="mdi-database" /> Servicios Logísticos</h2>
        <strong>Total del servicio</strong>
      </div>
      <div
        v-for="(group, groupIndex) in groupedServices"
        :key="groupIndex"
        class="total-service-row"
      >
        <v-icon
          icon="mdi-check"
          class="service-check"
        />
        <div class="total-service-description">
          <strong>{{ group.title }}</strong>
          <span>{{ group.items.map((item) => item.name).join(", ") }}</span>
        </div>
        <strong class="service-amount">{{ formatCurrency(group.total) }}</strong>
      </div>
      <div class="service-grand-total">
        <strong>Total servicios de {{ companyName }}</strong>
        <strong>{{ formatCurrency(option.totalServicios) }}</strong>
      </div>
    </section>

    <section
      v-else
      class="services-card"
    >
      <div class="section-heading">
        <h2><v-icon icon="mdi-database" /> Conceptos de Gastos (Servicios Logísticos)</h2>
        <strong v-if="quote.tipo === 'DETALLE'">Monto</strong>
      </div>
      <div
        v-for="(item, itemIndex) in detailLines"
        :key="`${item.name}-${itemIndex}`"
        class="detail-service-row"
      >
        <span>{{ item.name }}</span>
        <strong v-if="quote.tipo === 'DETALLE'">{{ formatCurrency(item.valor) }}</strong>
      </div>
      <div class="service-grand-total">
        <strong>Total servicios de {{ companyName }}</strong>
        <strong>{{ formatCurrency(option.totalServicios) }}</strong>
      </div>
    </section>

    <section class="tax-summary">
      <div class="tax-details">
        <div class="tax-brand">
          <img
            v-if="String(quote.iso) === '9589'"
            class="sunat-logo"
            src="/img/svg/sunat.svg"
            alt="SUNAT"
          >
          <strong v-else>ADUANA</strong>
          <small>Impuesto a la Aduana</small>
        </div>
        <div class="tax-lines">
          <div
            v-for="(tax, taxIndex) in option.impuesto"
            :key="taxIndex"
          >
            <span>
              {{ tax.name }}
              <small v-if="tax.percentage">({{ formatPercentage(tax.percentage) }}%)</small>
            </span>
            <strong>{{ formatCurrency(tax.valor) }}</strong>
          </div>
          <div
            v-if="option.impuesto.length === 0"
            class="empty-tax"
          >
            Sin impuestos aduaneros
          </div>
        </div>
      </div>
      <div class="tax-total">
        <span>Total Impuestos</span>
        <strong>{{ formatCurrency(option.totalImpuesto) }}</strong>
      </div>
    </section>

    <section class="igv-bar">
      <span class="percent-mark">%</span>
      <strong>{{ enterprisesStore.impuesto.nombre_impuesto || "IGV" }} sobre Servicios Logísticos</strong>
      <span>({{ formatPercentage(enterprisesStore.impuesto.impuesto) }}% del subtotal de servicios)</span>
      <strong class="igv-amount">{{ formatCurrency(option.totalImpuestosIGV) }}</strong>
    </section>

    <section class="quotation-total">
      <div class="quotation-total-icon">
        <v-icon icon="mdi-package-variant-closed" />
      </div>
      <div class="quotation-total-label">
        <strong>Total Servicios {{ companyName }} +</strong>
        <strong class="tax-caption">
          Impuestos a {{ String(quote.iso) === "9589" ? "SUNAT" : "Aduana" }}
        </strong>
      </div>
      <strong class="quotation-total-amount">{{ formatCurrency(option.total) }}</strong>
    </section>

    <section class="notes-card included-card">
      <div class="notes-title">
        <span class="notes-icon"><v-icon icon="mdi-check" /></span>
        <h2>Servicios Incluidos</h2>
      </div>
      <ul>
        <li
          v-for="(service, serviceIndex) in includedServices"
          :key="serviceIndex"
        >
          {{ service }}
        </li>
      </ul>
    </section>

    <section class="notes-card excluded-card">
      <div class="notes-title">
        <span class="notes-icon"><v-icon icon="mdi-cancel" /></span>
        <h2>No Incluye</h2>
      </div>
      <ul>
        <li
          v-for="(service, serviceIndex) in excludedServices"
          :key="serviceIndex"
        >
          {{ service }}
        </li>
      </ul>
    </section>

    <section class="notes-card important-card">
      <div class="notes-title">
        <span class="notes-icon"><v-icon icon="mdi-information" /></span>
        <h2>Notas Importantes</h2>
      </div>
      <ul>
        <li
          v-for="(note, noteIndex) in importantNotes"
          :key="noteIndex"
        >
          {{ note }}
        </li>
      </ul>
    </section>

    <footer class="quote-footer">
      <strong>{{ companyName }}</strong>
      <span><v-icon icon="mdi-map-marker" /> {{ datosEmpresa?.address || quote.address }}</span>
      <span><v-icon icon="mdi-phone" /> Tel.: {{ datosEmpresa?.phone || quote.phone }}</span>
    </footer>
  </article>
</template>

<style scoped>
.quote-sheet {
  --navy: #102b52;
  --blue: #078bca;
  --line: #c9d8e6;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 22px 24px 14px;
  color: #0e1e37;
  background-color: #fff;
  background-image: url("/img/no_valid.jpg");
  background-position: center top;
  background-repeat: repeat-y;
  background-size: 100% auto;
  border: 1px solid #dce5ed;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgb(22 53 89 / 10%);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
}

.quote-header {
  position: relative;
  display: flex;
  min-height: 184px;
  align-items: flex-start;
  overflow: hidden;
}

.quote-brand {
  position: relative;
  z-index: 1;
  display: flex;
  width: 45%;
  min-height: 90px;
  align-items: flex-start;
  padding-top: 10px;
}

.company-logo {
  max-width: 350px;
  max-height: 88px;
  object-fit: contain;
  object-position: left top;
}

.company-name {
  color: var(--navy);
  font-size: 22px;
  font-weight: 800;
  text-transform: uppercase;
}

.ship-banner {
  position: absolute;
  top: -15px;
  right: -24px;
  width: 64%;
  height: 194px;
  background-image: linear-gradient(90deg, #fff 0%, rgb(255 255 255 / 5%) 30%), url("/img/jpg/barco_pic-cargo.jpg");
  background-position: center, center 46%;
  background-size: cover;
  clip-path: ellipse(77% 75% at 73% 24%);
}

.quote-heading {
  position: absolute;
  z-index: 1;
  top: 116px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--navy);
  font-size: 21px;
}

.quote-number {
  padding: 5px 18px;
  color: #fff;
  background: linear-gradient(100deg, #159ed4, #09508d);
  border-radius: 24px;
  font-size: 21px;
  font-weight: 800;
}

.quote-meta {
  display: grid;
  min-height: 58px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  padding: 4px 0 10px;
  border-bottom: 1px solid var(--line);
  color: var(--navy);
}

.meta-column {
  display: grid;
  align-content: center;
  gap: 3px;
  min-width: 0;
  padding: 0 12px;
}

.meta-column + .meta-column {
  border-left: 1px solid var(--navy);
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  line-height: 1.25;
}

.meta-line .v-icon {
  flex: 0 0 auto;
}

.meta-line .v-icon {
  color: #0876b5;
}

.shipment-card,
.services-card,
.notes-card {
  overflow: hidden;
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: linear-gradient(110deg, #fff, #f3f8fd);
}

.shipment-card h2,
.section-heading {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 5px 14px;
  color: var(--navy);
  background: linear-gradient(90deg, #d6ebfb, #c0def4);
  font-size: 16px;
}

.shipment-card h2 {
  justify-content: flex-start;
}

.shipment-card h2 .v-icon,
.section-heading h2 .v-icon {
  margin-right: 7px;
  color: #087bb7;
}

.shipment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 10px 15px 11px;
}

.shipment-grid dl {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0 14px 0 0;
}

.shipment-grid dl + dl {
  padding-left: 18px;
  border-left: 1px solid #9db1c4;
}

.shipment-grid dl > div {
  display: grid;
  grid-template-columns: minmax(128px, 42%) 1fr;
  gap: 7px;
}

.shipment-grid dt {
  font-weight: 700;
}

.shipment-grid dd {
  margin: 0;
}

.merchandise-value {
  font-weight: 800;
}

.services-card {
  margin-top: 12px;
}

.section-heading h2 {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 16px;
}

.section-heading > strong {
  white-space: nowrap;
}

.detail-service-row,
.total-service-row {
  display: flex;
  min-height: 23px;
  align-items: center;
  gap: 10px;
  padding: 2px 14px;
  border-bottom: 1px solid #d7e0e8;
}

.detail-service-row {
  justify-content: space-between;
}

.detail-service-row strong,
.service-amount {
  white-space: nowrap;
}

.total-service-row {
  min-height: 43px;
}

.service-check {
  flex: 0 0 auto;
  color: #0788c9;
}

.total-service-description {
  display: grid;
  flex: 1;
  gap: 1px;
  min-width: 0;
}

.total-service-description strong {
  font-size: 14px;
}

.total-service-description span {
  font-size: 11px;
}

.service-amount {
  padding-left: 10px;
  border-left: 1px solid #9db1c4;
  font-size: 16px;
}

.service-grand-total {
  display: flex;
  min-height: 35px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 15px;
  color: var(--navy);
  background: linear-gradient(90deg, #d6ebfb, #c0def4);
  font-size: 16px;
}

.tax-summary {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(180px, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.tax-details,
.tax-total {
  display: flex;
  min-height: 74px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: linear-gradient(110deg, #fff, #edf5fd);
}

.tax-brand {
  display: flex;
  width: 42%;
  min-width: 125px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  padding: 5px 9px;
  border-right: 1px solid #899eb3;
  color: #087bb7;
}

.tax-brand strong {
  font-size: 21px;
  letter-spacing: 1px;
}

.sunat-logo {
  width: 120px;
  height: 48px;
  object-fit: contain;
}

.tax-brand small {
  color: #111;
  font-size: 10px;
}

.tax-lines {
  display: grid;
  flex: 1;
  gap: 2px;
  padding: 7px 10px;
}

.tax-lines > div:not(.empty-tax) {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #e1e8ef;
}

.tax-lines small {
  font-size: 10px;
}

.empty-tax {
  color: #607387;
  text-align: center;
}

.tax-total {
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  color: var(--navy);
  text-align: center;
  background: linear-gradient(110deg, #eaf5fd, #dcecfb);
}

.tax-total strong {
  font-size: 22px;
}

.igv-bar {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 5px 13px;
  border: 1px solid var(--line);
  border-radius: 22px;
  color: var(--navy);
  background: linear-gradient(90deg, #f5faff, #e4f1fb);
}

.percent-mark {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #078bca;
  font-weight: 800;
}

.igv-amount {
  margin-left: auto;
  white-space: nowrap;
}

.quotation-total {
  display: grid;
  min-height: 72px;
  grid-template-columns: 78px 1fr auto;
  align-items: center;
  gap: 18px;
  margin: 10px -5px 0;
  padding: 8px 20px;
  border-radius: 17px;
  color: #fff;
  background: linear-gradient(105deg, #078bc7, #07518a);
}

.quotation-total-icon {
  display: grid;
  height: 52px;
  place-items: center;
  border-right: 2px solid rgb(255 255 255 / 90%);
}

.quotation-total-icon .v-icon {
  font-size: 40px;
}

.quotation-total-label {
  display: grid;
  gap: 0;
  text-transform: uppercase;
}

.quotation-total-label strong {
  font-size: 20px;
  line-height: 1.15;
}

.quotation-total-label .tax-caption {
  color: #ffdf36;
}

.quotation-total-amount {
  padding-left: 18px;
  border-left: 1px solid rgb(255 255 255 / 80%);
  font-size: 34px;
  white-space: nowrap;
}

.notes-card {
  display: grid;
  grid-template-columns: minmax(190px, 34%) 1fr;
  align-items: center;
  padding: 9px 13px;
}

.notes-title {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-right: 1px solid #9db1c4;
}

.notes-title h2 {
  margin: 0;
  color: var(--navy);
  font-size: 17px;
}

.notes-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #078bca;
}

.excluded-card .notes-icon {
  color: #d72d4b;
  background: transparent;
  border: 3px solid #d72d4b;
}

.notes-card ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 22px;
  row-gap: 2px;
  margin: 0;
  padding: 0 5px 0 25px;
}

.notes-card li {
  padding-left: 1px;
  line-height: 1.25;
}

.important-card ul {
  grid-template-columns: 1fr;
}

.quote-footer {
  display: flex;
  min-height: 39px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 7px 5px 0;
  border-top: 2px solid #1674ad;
  color: var(--navy);
}

.quote-footer > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quote-footer .v-icon {
  color: #07558b;
  font-size: 17px;
}

@media (max-width: 680px) {
  .quote-sheet {
    padding: 14px 12px 10px;
  }

  .quote-brand {
    width: 55%;
  }

  .company-logo {
    max-width: 230px;
    max-height: 74px;
  }

  .ship-banner {
    top: -10px;
    right: -12px;
    width: 66%;
    height: 150px;
  }

  .quote-heading {
    top: 100px;
    left: 0;
    font-size: 16px;
  }

  .quote-number {
    padding: 4px 11px;
    font-size: 17px;
  }

  .quote-meta {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .meta-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 6px 0;
  }

  .meta-column + .meta-column {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .shipment-grid {
    gap: 8px;
    padding-right: 8px;
    padding-left: 8px;
  }

  .shipment-grid dl {
    padding-right: 7px;
  }

  .shipment-grid dl + dl {
    padding-left: 9px;
  }

  .shipment-grid dl > div {
    grid-template-columns: 1fr;
    gap: 1px;
  }

  .section-heading {
    padding-right: 8px;
    padding-left: 8px;
    font-size: 13px;
  }

  .section-heading h2 {
    font-size: 13px;
  }

  .notes-card {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .notes-title {
    min-height: 34px;
    border-right: 0;
    border-bottom: 1px solid #9db1c4;
  }

  .notes-card ul {
    padding-left: 20px;
  }

  .tax-summary {
    grid-template-columns: 1fr;
  }

  .tax-details {
    min-height: 82px;
  }

  .tax-total {
    min-height: 63px;
  }

  .igv-bar {
    flex-wrap: wrap;
    border-radius: 12px;
  }

  .igv-amount {
    width: 100%;
    text-align: right;
  }

  .quotation-total {
    grid-template-columns: 48px 1fr auto;
    gap: 9px;
    padding-right: 10px;
    padding-left: 10px;
  }

  .quotation-total-icon {
    height: 42px;
  }

  .quotation-total-icon .v-icon {
    font-size: 30px;
  }

  .quotation-total-label strong {
    font-size: 14px;
  }

  .quotation-total-amount {
    padding-left: 9px;
    font-size: 20px;
  }

  .quote-footer {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
