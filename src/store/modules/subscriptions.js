import Swal from "sweetalert2";
import moment from "moment";
import { hasFailed, notifySuccess, request } from "@/store/request";
import router from "@/router";
import { openPaddleCheckout } from "@/plugins/paddle";

const ICON_BY_MESSAGE_TYPE = { TMSGINF: "info", TMSGADV: "warning" };
const OPEN_FAILED_MESSAGE =
  "No pudimos abrir el pago. Intenta de nuevo en unos minutos.";
const CHANGE_FAILED_MESSAGE =
  "No pudimos cambiar tu plan. Intenta de nuevo en unos minutos.";
const KEEP_FAILED_MESSAGE =
  "No pudimos mantener tu plan. Intenta de nuevo en unos minutos.";
const INVOICE_FAILED_MESSAGE =
  "No pudimos descargar la factura. Intenta de nuevo en unos minutos.";
const PAYMENT_METHOD_FAILED_MESSAGE =
  "No pudimos abrir el cambio de método de pago. Intenta de nuevo en unos minutos.";
const PENDING_PLAN_KEY = "pendingPlan";

const errorOf = (response) => (hasFailed(response) ? response.mensaje : null);

const firstRow = (response) =>
  (response.estadoflag && response.data[0]) || null;
const firstValue = (response, key) => {
  const row = firstRow(response);
  return row ? row[key] : null;
};

const notifyError = (message) => Swal.fire({ icon: "error", text: message });
const notifyProblem = (response, fallback) =>
  Swal.fire({
    icon: ICON_BY_MESSAGE_TYPE[response.tipomensaje] || "error",
    text: response.mensaje || fallback,
  });

const countLabel = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`;

const roundToCents = (amount) => Math.round(amount * 100) / 100;

const formatPrice = (value) => {
  const amount = Number(value);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `US$${formatted}`;
};

const formatDate = (value) =>
  value ? moment.utc(value).locale("es").format("D [de] MMMM [de] YYYY") : "";

const annualSavings = (pkg) =>
  Math.max(
    0,
    roundToCents(Number(pkg.monthly_price) * 12 - Number(pkg.annual_price))
  );

const monthsSaved = (pkg) => {
  const monthlyPrice = Number(pkg.monthly_price);
  return monthlyPrice > 0 ? Math.round(annualSavings(pkg) / monthlyPrice) : 0;
};

const maxMonthsSaved = (packages) => Math.max(0, ...packages.map(monthsSaved));

const moduleNames = (packages) => [
  ...new Set(
    packages.flatMap((pkg) => pkg.modules.map((module) => module.name))
  ),
];

const userLabel = (count) => countLabel(count, "usuario", "usuarios");

const TRIAL_UNIT_LABELS = { day: ["día", "días"], month: ["mes", "meses"] };

const trialLabel = (pkg) => {
  const units = TRIAL_UNIT_LABELS[pkg.trial_interval];
  if (!pkg.trial_enabled || !units || !pkg.trial_frequency) return null;
  return `${countLabel(Number(pkg.trial_frequency), ...units)} gratis`;
};

const moduleAccessLabel = (pkg) =>
  pkg.module_selection_limit
    ? `${countLabel(pkg.module_selection_limit, "módulo", "módulos")} a elegir`
    : countLabel(pkg.modules.length, "módulo incluido", "módulos incluidos");

const isGeneral = (feature) => !feature.module_id;

const moduleDetails = (pkg, moduleId) =>
  pkg.features
    .filter((feature) => feature.module_id === moduleId)
    .map((feature) => feature.description);

const withDetails = (entry, details) =>
  details.length ? { ...entry, details } : entry;

const moduleIncludes = (pkg) => {
  if (pkg.module_selection_limit) {
    const names = pkg.modules.map((module) => module.name);
    return [
      { text: moduleAccessLabel(pkg) },
      { text: `Puedes elegir: ${names.join(" o ")}` },
      ...pkg.modules.map((module) =>
        withDetails(
          { text: `Si eliges ${module.name}:`, conditional: true },
          moduleDetails(pkg, module.id)
        )
      ),
    ];
  }

  return [
    { text: "Todos los módulos incluidos" },
    ...pkg.modules.map((module) =>
      withDetails({ text: module.name }, moduleDetails(pkg, module.id))
    ),
  ];
};

const toPlanView = (pkg) => {
  const generalFeatures = pkg.features.filter(isGeneral);
  const savings = annualSavings(pkg);

  return {
    id: pkg.id,
    name: pkg.name,
    tagline: pkg.tagline,
    monthlyPrice: formatPrice(pkg.monthly_price),
    annualPrice: formatPrice(pkg.annual_price),
    savings: savings > 0 ? formatPrice(savings) : null,
    users: userLabel(pkg.user_limit),
    trial: trialLabel(pkg),
    highlights: [
      moduleAccessLabel(pkg),
      ...generalFeatures
        .filter((feature) => feature.is_included && feature.is_highlighted)
        .map((feature) => feature.description),
    ],
    includes: [
      ...moduleIncludes(pkg),
      ...generalFeatures
        .filter((feature) => feature.is_included)
        .map((feature) => ({ text: feature.description })),
    ],
    excludes: generalFeatures
      .filter((feature) => !feature.is_included)
      .map((feature) => feature.description),
    featured: pkg.is_featured,
    isActive: pkg.is_active,
  };
};

const MAX_HIGHLIGHTS = 2;
const NAME_MAX_LENGTH = 60;
const TAGLINE_MAX_LENGTH = 120;
const FEATURE_MAX_LENGTH = 160;

const TRIAL_UNITS = [
  { value: "day", label: "Días", max: 365 },
  { value: "month", label: "Meses", max: 12 },
];

let lastFeatureKey = 0;

const newFeature = (description = "", moduleId = null) => {
  lastFeatureKey += 1;
  return {
    key: lastFeatureKey,
    description,
    moduleId,
    isIncluded: true,
    isHighlighted: false,
  };
};

const emptyDraft = () => ({
  id: null,
  name: "",
  tagline: "",
  monthlyPrice: "",
  annualPrice: "",
  userLimit: 1,
  moduleIds: [],
  selectionLimit: null,
  isFeatured: false,
  trialEnabled: false,
  trialInterval: "day",
  trialFrequency: 15,
  features: [],
});

const draftFromPackage = (pkg) => ({
  id: pkg.id,
  name: pkg.name,
  tagline: pkg.tagline || "",
  monthlyPrice: String(Number(pkg.monthly_price)),
  annualPrice: String(Number(pkg.annual_price)),
  userLimit: pkg.user_limit,
  moduleIds: pkg.modules.map((module) => module.id),
  selectionLimit: pkg.module_selection_limit,
  isFeatured: pkg.is_featured,
  trialEnabled: Boolean(pkg.trial_enabled),
  trialInterval: pkg.trial_interval || "day",
  trialFrequency: pkg.trial_frequency || 15,
  features: pkg.features.map((feature) => ({
    ...newFeature(feature.description, feature.module_id),
    isIncluded: feature.is_included,
    isHighlighted: feature.is_highlighted,
  })),
});

const canBeHighlighted = (feature) => !feature.moduleId && feature.isIncluded;

const isShownHighlighted = (feature) =>
  canBeHighlighted(feature) && feature.isHighlighted;

const highlightedCount = (features) =>
  features.filter(isShownHighlighted).length;

const isBlank = (text) => !String(text || "").trim();

const isValidPrice = (value) => !isBlank(value) && Number(value) >= 0;

const nameError = (name) => {
  if (isBlank(name)) return "Escribe el nombre del paquete.";
  if (name.trim().length > NAME_MAX_LENGTH)
    return `Usa un nombre de hasta ${NAME_MAX_LENGTH} caracteres.`;
  return null;
};

const featuresError = (features) => {
  if (features.some((feature) => isBlank(feature.description))) {
    return "Escribe el texto de cada característica o quítala.";
  }
  if (
    features.some(
      (feature) => feature.description.trim().length > FEATURE_MAX_LENGTH
    )
  ) {
    return `Cada característica admite hasta ${FEATURE_MAX_LENGTH} caracteres.`;
  }
  if (highlightedCount(features) > MAX_HIGHLIGHTS) {
    return `Destaca como máximo ${MAX_HIGHLIGHTS} características.`;
  }
  return null;
};

const modulesErrors = (draft) => {
  if (!draft.moduleIds.length)
    return { moduleIds: "Elige al menos un módulo para el paquete." };
  if (
    draft.selectionLimit !== null &&
    draft.selectionLimit >= draft.moduleIds.length
  ) {
    return {
      selectionLimit:
        "Los módulos a elegir deben ser menos que los módulos del paquete.",
    };
  }
  return {};
};

const trialLengthError = (draft) => {
  const unit = TRIAL_UNITS.find((item) => item.value === draft.trialInterval);
  if (!unit || isBlank(draft.trialFrequency))
    return "Elige la duración del periodo de prueba.";
  const length = Number(draft.trialFrequency);
  if (!Number.isInteger(length) || length < 1 || length > unit.max)
    return `La prueba puede durar de 1 a ${
      unit.max
    } ${unit.label.toLowerCase()}.`;
  return null;
};

const trialError = (draft) =>
  draft.trialEnabled ? trialLengthError(draft) : null;

const registrationTrialDaysError = (value) => {
  const days = Number(value);
  return isBlank(value) || !Number.isInteger(days) || days < 1 || days > 365
    ? "Escribe entre 1 y 365 días."
    : null;
};

const validateDraft = (draft) => {
  const errors = {
    name: nameError(draft.name),
    tagline:
      draft.tagline.trim().length > TAGLINE_MAX_LENGTH
        ? `Usa una descripción corta de hasta ${TAGLINE_MAX_LENGTH} caracteres.`
        : null,
    monthlyPrice: isValidPrice(draft.monthlyPrice)
      ? null
      : "Escribe el precio mensual, de 0 en adelante.",
    annualPrice: isValidPrice(draft.annualPrice)
      ? null
      : "Escribe el precio anual, de 0 en adelante.",
    userLimit:
      Number.isInteger(Number(draft.userLimit)) && Number(draft.userLimit) >= 1
        ? null
        : "El paquete debe incluir al menos 1 usuario.",
    trialFrequency: trialError(draft),
    features: featuresError(draft.features),
    ...modulesErrors(draft),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message)
  );
};

const toFeaturePayload = (feature) => ({
  description: feature.description.trim(),
  module_id: feature.moduleId,
  is_included: feature.moduleId ? true : feature.isIncluded,
  is_highlighted: isShownHighlighted(feature),
});

const toPayload = (draft) => ({
  name: draft.name.trim(),
  tagline: draft.tagline.trim() || null,
  monthly_price: Number(draft.monthlyPrice),
  annual_price: Number(draft.annualPrice),
  user_limit: Number(draft.userLimit),
  module_selection_limit: draft.selectionLimit,
  is_featured: draft.isFeatured,
  trial_enabled: draft.trialEnabled,
  trial_interval: draft.trialInterval,
  trial_frequency: trialLengthError(draft)
    ? null
    : Number(draft.trialFrequency),
  modules: draft.moduleIds,
  features: draft.features.map(toFeaturePayload),
});

const draftToPackage = (draft, modules) => {
  const payload = toPayload(draft);
  return {
    ...payload,
    id: draft.id,
    is_active: true,
    monthly_price: payload.monthly_price || 0,
    annual_price: payload.annual_price || 0,
    user_limit: payload.user_limit || 1,
    modules: modules.filter((module) => draft.moduleIds.includes(module.id)),
    features: payload.features.filter((feature) => feature.description),
  };
};

const clampSelectionLimit = (selectionLimit, moduleCount) => {
  if (selectionLimit === null || moduleCount < 2) return null;
  return Math.min(selectionLimit, moduleCount - 1);
};

const removeModule = (draft, moduleId) => {
  const moduleIds = draft.moduleIds.filter((id) => id !== moduleId);
  return {
    ...draft,
    moduleIds,
    selectionLimit: clampSelectionLimit(draft.selectionLimit, moduleIds.length),
    features: draft.features.map((feature) =>
      feature.moduleId === moduleId ? { ...feature, moduleId: null } : feature
    ),
  };
};

const toggleModule = (draft, moduleId) =>
  draft.moduleIds.includes(moduleId)
    ? removeModule(draft, moduleId)
    : { ...draft, moduleIds: [...draft.moduleIds, moduleId] };

const savingsHint = (draft) => {
  const monthly = Number(draft.monthlyPrice);
  const annual = Number(draft.annualPrice);
  if (!draft.monthlyPrice || !draft.annualPrice || monthly <= 0) return null;
  const savings = roundToCents(monthly * 12 - annual);
  if (savings > 0) {
    const months = Math.round(savings / monthly);
    return {
      positive: true,
      text: `El cliente ahorra ${formatPrice(savings)} al año (${countLabel(
        months,
        "mes",
        "meses"
      )}).`,
    };
  }
  return {
    positive: false,
    text: "Sin ahorro anual: el precio anual es igual o mayor a 12 mensualidades.",
  };
};

const PLAN_STATUS_VIEW = {
  active: { label: "Activo", tone: "ok" },
  trialing: { label: "En prueba", tone: "ok" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  paused: { label: "Pausado", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};

const BILLING_BY_QUERY = { mensual: "monthly", anual: "annual" };

const isLivePlan = (plan) => Boolean(plan) && plan.status !== "canceled";

const statusView = (plan) => {
  if (!plan) return PLAN_STATUS_VIEW.canceled;
  if (plan.scheduled_change_action === "cancel" && plan.status !== "canceled") {
    return { label: "Cancelación programada", tone: "warning" };
  }
  return PLAN_STATUS_VIEW[plan.status] || { label: plan.status, tone: "muted" };
};

const planDateLine = (plan) => {
  if (plan.status === "canceled")
    return `Cancelado el ${formatDate(plan.canceled_at)}.`;
  if (plan.scheduled_change_action === "cancel") {
    return `Tu plan termina el ${formatDate(
      plan.scheduled_change_at
    )}. No se harán más cobros.`;
  }
  if (plan.status === "trialing") {
    return `Tu prueba termina el ${formatDate(
      plan.next_billed_at
    )}; ese día se hará el primer cobro.`;
  }
  if (plan.status === "past_due") return "No pudimos cobrar tu último pago.";
  if (plan.status === "paused")
    return "Tu plan está pausado; no se harán cobros mientras siga así.";
  return `Próxima renovación: ${formatDate(plan.next_billed_at)}.`;
};

const readStoredChoice = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_PLAN_KEY));
    return stored && stored.packageId ? stored : null;
  } catch (error) {
    return null;
  }
};

const readPendingChoice = (query) => {
  if (query.paquete) {
    return {
      packageId: Number(query.paquete),
      billing: BILLING_BY_QUERY[query.ciclo] || "monthly",
    };
  }
  return readStoredChoice();
};

const CHANGEABLE_STATUSES = ["active", "trialing"];
const PERIOD_BY_BILLING = { monthly: "al mes", annual: "al año" };

const canChangePlan = (plan) =>
  Boolean(plan) && CHANGEABLE_STATUSES.includes(plan.status);

const UNAVAILABLE_ACTIONS = ["current", "lower", "annual-only"];
const UPGRADE_ACTIONS = ["change", "change-module"];

const isCheaper = (pkg, plan, currentPackage) => {
  const currentPrice = currentPackage
    ? currentPackage.monthly_price
    : plan.package_monthly_price;
  return (
    currentPrice != null && Number(pkg.monthly_price) < Number(currentPrice)
  );
};

const cardAction = (pkg, plan, billing, currentPackage) => {
  if (!plan) return "change";
  if (isCheaper(pkg, plan, currentPackage)) return "lower";
  if (pkg.id !== plan.package_id) return "change";
  if (billing !== plan.billing)
    return plan.billing === "annual" ? "annual-only" : "change";
  return pkg.module_selection_limit ? "change-module" : "current";
};

const isUnavailableAction = (action) => UNAVAILABLE_ACTIONS.includes(action);

const currentPackageOf = (plan, packages) =>
  plan ? packages.find((pkg) => pkg.id === plan.package_id) : undefined;

const hasUpgrade = (plan, packages) => {
  const currentPackage = currentPackageOf(plan, packages);
  return packages.some((pkg) =>
    ["monthly", "annual"].some((billing) =>
      UPGRADE_ACTIONS.includes(cardAction(pkg, plan, billing, currentPackage))
    )
  );
};

const purchaseAction = (pkg, plan, billing, currentPackage) => {
  if (!isLivePlan(plan)) return "buy";
  if (!canChangePlan(plan)) return "manage";
  return cardAction(pkg, plan, billing, currentPackage);
};

const changeSummary = (preview) => {
  const recurring = `${formatPrice(preview.recurring_amount)} ${
    PERIOD_BY_BILLING[preview.billing]
  } desde el ${formatDate(preview.next_billed_at)}`;
  const today = {
    charge: `Hoy se cobrarán ${formatPrice(
      preview.amount
    )} a tu método de pago. Después pagarás ${recurring}.`,
    credit: `Te quedará un crédito de ${formatPrice(
      preview.amount
    )} para tus siguientes pagos. Después pagarás ${recurring}.`,
    none: `No se te cobrará nada hoy. Pagarás ${recurring}.`,
  }[preview.action];
  return preview.removes_cancel
    ? `${today} Tu cancelación programada se quitará.`
    : today;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysUntil = (value, now) =>
  Math.max(0, Math.ceil((Date.parse(value) - now) / DAY_MS) || 0);

const NO_NOTICE = { days: null, ended: false, canBuy: false, paidText: null };
const ACO_BRANCH_ID = 1;

const registrationTrialNotice = (registrationTrial, canBuy, now) => {
  const notice = { ...NO_NOTICE, canBuy };
  if (!registrationTrial) return canBuy ? notice : null;
  const days = daysUntil(registrationTrial.ends_at, now);
  return days > 0 ? { ...notice, days } : { ...notice, ended: true };
};

const trialNotice = ({
  plan,
  registrationTrial,
  branchId,
  now = Date.now(),
}) => {
  if (!isLivePlan(plan)) {
    const canBuy = Number(branchId) !== ACO_BRANCH_ID;
    return registrationTrialNotice(registrationTrial, canBuy, now);
  }
  if (plan.status === "trialing") {
    return {
      ...NO_NOTICE,
      days: daysUntil(plan.current_period_ends_at || plan.next_billed_at, now),
    };
  }
  if (plan.status === "active")
    return { ...NO_NOTICE, paidText: `ACO ${plan.package_name} activo` };
  return null;
};

const paymentUpdateNeeded = (plan) =>
  plan.status === "past_due" && plan.scheduled_change_action !== "cancel";

const featureDescriptions = (features, moduleId) =>
  features
    .filter((feature) => feature.module_id === moduleId)
    .map((feature) => feature.description);

const planDetails = (plan) => {
  const features = (plan && plan.features) || [];
  return {
    users:
      plan && plan.user_limit
        ? `${plan.user_count || 0} de ${plan.user_limit}`
        : null,
    modules: ((plan && plan.modules) || []).map((module) => ({
      id: module.id,
      name: module.name,
      details: featureDescriptions(features, module.id),
    })),
    extras: featureDescriptions(features, null),
  };
};

const routesOf = (node) =>
  (node.children || [])
    .flatMap((child) => [child.route, ...routesOf(child)])
    .filter(Boolean);

const modulesForRoute = (menuTree, routeName) =>
  routeName
    ? (menuTree || [])
        .filter((node) => routesOf(node).includes(routeName))
        .map((node) => ({ id: node.id, name: node.name }))
    : [];

const isModuleLocked = (access, moduleId) =>
  Boolean(access && access.has_plan) &&
  (access.locked_module_ids || []).includes(moduleId);

const lockedModuleForRoute = (menuTree, routeName, access) => {
  const modules = modulesForRoute(menuTree, routeName);
  return modules.length &&
    modules.every((module) => isModuleLocked(access, module.id))
    ? modules[0]
    : null;
};

const canAddUsers = (access) =>
  !access || !access.has_plan || Boolean(access.can_add_users);

const STOPPED_PLAN_TEXT = {
  canceled: (plan, next) =>
    `Tu plan ACO ${plan} está cancelado. Elige un plan para ${next}.`,
  paused: (plan) =>
    `Tu plan ACO ${plan} está pausado. Revisa Mi plan para reactivarlo.`,
};

const lockedModuleNotice = (access, moduleName) => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status];
  if (stopped) {
    return {
      title: `${moduleName} no está disponible`,
      text: stopped(access.package_name, `volver a usar ${moduleName}`),
    };
  }
  return {
    title: `${moduleName} no está en tu plan`,
    text: `Tu plan ACO ${access.package_name} no incluye ${moduleName}. Mejora tu plan para usarlo.`,
  };
};

const userLimitNotice = (access) => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status];
  if (stopped) {
    return {
      title: "No puedes agregar usuarios",
      text: stopped(access.package_name, "agregar usuarios"),
    };
  }
  return {
    title: "Llegaste al límite de usuarios",
    text: `Tu plan ACO ${access.package_name} permite ${userLabel(
      access.user_limit
    )} y tu empresa ya tiene ${
      access.user_count
    }. Mejora tu plan para agregar más.`,
  };
};

const CONCEPT_BY_ORIGIN = {
  subscription_recurring: "Renovación",
  subscription_update: "Cambio a",
};
const BILLING_LABELS = { monthly: "Mensual", annual: "Anual" };
const PAID = { label: "Pagado", tone: "ok" };
const BILLING_STATUS_VIEW = {
  completed: PAID,
  paid: PAID,
  billed: { label: "Facturado", tone: "info" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};
const REFUNDED = { label: "Reembolsado", tone: "muted" };
const PARTLY_REFUNDED = { label: "Reembolso parcial", tone: "info" };
const CARD_BRANDS = {
  visa: "Visa",
  mastercard: "Mastercard",
  american_express: "American Express",
  discover: "Discover",
  diners_club: "Diners Club",
  jcb: "JCB",
  maestro: "Maestro",
  union_pay: "UnionPay",
};
const NO_HISTORY = {
  transactions: [],
  payment_method: null,
  can_update_payment_method: false,
};

const conceptOf = (entry) => {
  const name = `${CONCEPT_BY_ORIGIN[entry.origin] || "Compra"} ${
    entry.product_name
  }`;
  return entry.billing ? `${name} · ${BILLING_LABELS[entry.billing]}` : name;
};

const amountOf = (entry) => {
  const amount = Number(entry.total) / 100;
  if (entry.currency_code === "USD") return formatPrice(amount);
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: entry.currency_code,
  }).format(amount);
};

const statusOf = (entry) => {
  const total = Number(entry.total);
  const adjusted = Number(entry.adjusted_total);
  const status = BILLING_STATUS_VIEW[entry.status];
  if (status !== PAID || adjusted >= total) return status;
  return adjusted > 0 ? PARTLY_REFUNDED : REFUNDED;
};

const billingRows = (entries) =>
  entries.map((entry) => {
    const status = statusOf(entry);
    return {
      id: entry.id,
      date: formatDate(entry.billed_at),
      concept: conceptOf(entry),
      amount: amountOf(entry),
      statusLabel: status.label,
      statusTone: status.tone,
      hasInvoice: entry.has_invoice,
    };
  });

const cardLabel = (paymentMethod) => {
  if (!paymentMethod) return null;
  const brand = CARD_BRANDS[paymentMethod.brand] || "Tarjeta";
  const month = String(paymentMethod.expiry_month).padStart(2, "0");
  return `${brand} terminada en ${paymentMethod.last4} · vence ${month}/${paymentMethod.expiry_year}`;
};

let pendingAccess = null;

const state = {
  packages: [],
  publicPackages: [],
  packageModules: [],
  packageDraft: emptyDraft(),
  paddleSyncReport: [],
  registrationTrialDays: "",
  plan: null,
  registrationTrial: null,
  access: null,
  billingHistory: NO_HISTORY,
};

const getters = {
  formatPrice: () => formatPrice,
  formatDate: () => formatDate,
  toPlanView: () => toPlanView,
  limits: () => ({
    name: NAME_MAX_LENGTH,
    tagline: TAGLINE_MAX_LENGTH,
    feature: FEATURE_MAX_LENGTH,
    highlights: MAX_HIGHLIGHTS,
  }),
  trialUnits: () => TRIAL_UNITS,
  planViews: (state) => state.publicPackages.map(toPlanView),
  moduleLine: (state) => moduleNames(state.publicPackages).join(" · "),
  maxMonthsSaved: (state) => maxMonthsSaved(state.publicPackages),
  activePackageCount: (state) =>
    state.packages.filter((pkg) => pkg.is_active).length,
  packagesWithStatus: (state) => (status) =>
    status === "all"
      ? state.packages
      : state.packages.filter((pkg) => pkg.is_active === (status === "active")),
  packageDraftErrors: (state) => validateDraft(state.packageDraft),
  packageDraftPayload: (state) => toPayload(state.packageDraft),
  packageDraftPreview: (state) =>
    toPlanView({
      ...draftToPackage(state.packageDraft, state.packageModules),
      name: state.packageDraft.name.trim() || "NUEVO",
    }),
  packageDraftSavings: (state) => savingsHint(state.packageDraft),
  canHighlightFeature: (state) => (feature) =>
    canBeHighlighted(feature) &&
    (feature.isHighlighted ||
      highlightedCount(state.packageDraft.features) < MAX_HIGHLIGHTS),
  registrationTrialDaysError: (state) =>
    registrationTrialDaysError(state.registrationTrialDays),
  hasLivePlan: (state) => isLivePlan(state.plan),
  livePlan: (state) => (isLivePlan(state.plan) ? state.plan : null),
  planStatus: (state) => statusView(state.plan),
  planDateLine: (state) => (state.plan ? planDateLine(state.plan) : ""),
  canChangePlan: (state) => canChangePlan(state.plan),
  currentPackage: (state) => currentPackageOf(state.plan, state.publicPackages),
  hasUpgrade: (state) => hasUpgrade(state.plan, state.publicPackages),
  planDetails: (state) => planDetails(state.plan),
  paymentUpdateNeeded: (state) =>
    Boolean(state.plan) && paymentUpdateNeeded(state.plan),
  cardAction: (state, getters) => (pkg, billing) =>
    cardAction(pkg, state.plan, billing, getters.currentPackage),
  purchaseAction: (state, getters) => (pkg, billing) =>
    purchaseAction(pkg, state.plan, billing, getters.currentPackage),
  isUnavailableAction: () => isUnavailableAction,
  changeSummary: () => changeSummary,
  trialNotice:
    (state) =>
    ({ branchId, now }) =>
      trialNotice({
        plan: state.plan,
        registrationTrial: state.registrationTrial,
        branchId,
        now,
      }),
  modulesForRoute: () => modulesForRoute,
  lockedModuleForRoute: (state) => (menuTree, routeName) =>
    lockedModuleForRoute(menuTree, routeName, state.access),
  lockedModuleNotice: (state) => (moduleName) =>
    lockedModuleNotice(state.access, moduleName),
  canAddUsers: (state) => canAddUsers(state.access),
  userLimitNotice: (state) => userLimitNotice(state.access),
  billingRows: (state) => billingRows(state.billingHistory.transactions),
  paymentCard: (state) => cardLabel(state.billingHistory.payment_method),
};

const mutations = {
  SET_PACKAGES(state, packages) {
    state.packages = packages;
  },
  SET_PACKAGE_ACTIVE(state, { id, isActive }) {
    const pkg = state.packages.find((item) => item.id === id);
    if (pkg) pkg.is_active = isActive;
  },
  SET_PUBLIC_PACKAGES(state, packages) {
    state.publicPackages = packages;
  },
  SET_PACKAGE_MODULES(state, modules) {
    state.packageModules = modules;
  },
  SET_PACKAGE_DRAFT(state, draft) {
    state.packageDraft = draft;
  },
  SET_DRAFT_FIELD(state, { field, value }) {
    state.packageDraft[field] = value;
  },
  TOGGLE_DRAFT_MODULE(state, moduleId) {
    state.packageDraft = toggleModule(state.packageDraft, moduleId);
  },
  ADD_DRAFT_FEATURE(state, { description, moduleId }) {
    state.packageDraft.features.push(newFeature(description, moduleId));
  },
  UPDATE_DRAFT_FEATURE(state, { key, changes }) {
    const feature = state.packageDraft.features.find(
      (item) => item.key === key
    );
    if (feature) Object.assign(feature, changes);
  },
  REMOVE_DRAFT_FEATURE(state, key) {
    state.packageDraft.features = state.packageDraft.features.filter(
      (item) => item.key !== key
    );
  },
  SET_PADDLE_SYNC_REPORT(state, report) {
    state.paddleSyncReport = report;
  },
  SET_REGISTRATION_TRIAL_DAYS(state, days) {
    state.registrationTrialDays = days;
  },
  SET_PLAN(state, plan) {
    state.plan = plan;
  },
  SET_REGISTRATION_TRIAL(state, registrationTrial) {
    state.registrationTrial = registrationTrial;
  },
  SET_ACCESS(state, access) {
    state.access = access;
  },
  SET_BILLING_HISTORY(state, history) {
    state.billingHistory = history;
  },
};

const actions = {
  async loadPackages({ commit }) {
    const response = await request({
      method: "get",
      url: "subscription_packages",
    });
    if (!hasFailed(response)) commit("SET_PACKAGES", response.data);
    return errorOf(response);
  },
  async loadPublicPackages({ commit }) {
    const response = await request({
      method: "get",
      url: "public/subscription_packages",
    });
    if (!hasFailed(response)) commit("SET_PUBLIC_PACKAGES", response.data);
    return errorOf(response);
  },
  async loadPackageModules({ commit }) {
    const response = await request({
      method: "get",
      url: "subscription_package_modules",
    });
    commit("SET_PACKAGE_MODULES", response.estadoflag ? response.data : []);
  },
  async setPackageActive({ commit }, { id, isActive }) {
    const response = await request({
      method: "patch",
      url: `subscription_packages/${id}/status`,
      data: { is_active: isActive },
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje);
      return false;
    }
    commit("SET_PACKAGE_ACTIVE", { id, isActive });
    notifySuccess(response.mensaje);
    return true;
  },
  openPackageDraft({ commit }, pkg) {
    commit("SET_PACKAGE_DRAFT", pkg ? draftFromPackage(pkg) : emptyDraft());
  },
  async savePackageDraft({ state, getters }) {
    const { id } = state.packageDraft;
    const response = await request({
      method: id ? "put" : "post",
      url: id ? `subscription_packages/${id}` : "subscription_packages",
      data: getters.packageDraftPayload,
    });
    if (response.estadoflag) notifySuccess(response.mensaje);
    return response;
  },
  async loadPaddleSync({ commit }) {
    const response = await request({
      method: "get",
      url: "subscription_packages/paddle_sync",
    });
    if (!hasFailed(response)) commit("SET_PADDLE_SYNC_REPORT", response.data);
    return response;
  },
  async applyPaddleSync({ commit }) {
    const response = await request({
      method: "post",
      url: "subscription_packages/paddle_sync",
    });
    if (response.data.length) commit("SET_PADDLE_SYNC_REPORT", response.data);
    if (response.estadoflag) notifySuccess(response.mensaje);
    return response;
  },
  async loadRegistrationTrialSetting({ commit }) {
    const response = await request({
      method: "get",
      url: "registration_trial_setting",
    });
    if (!response.estadoflag) return response.mensaje;
    commit("SET_REGISTRATION_TRIAL_DAYS", response.data[0].trial_days);
    return null;
  },
  async saveRegistrationTrialSetting({ state, commit }) {
    const response = await request({
      method: "put",
      url: "registration_trial_setting",
      data: { trial_days: Number(state.registrationTrialDays) },
    });
    if (!response.estadoflag) {
      notifyProblem(response);
      return false;
    }
    commit("SET_REGISTRATION_TRIAL_DAYS", response.data[0].trial_days);
    notifySuccess(response.mensaje);
    return true;
  },
  async loadCompanyPlan({ commit }) {
    const response = await request({
      method: "get",
      url: "branch_subscription",
    });
    if (!hasFailed(response)) commit("SET_PLAN", firstRow(response));
    return errorOf(response);
  },
  async loadPlanBadge({ commit }) {
    const [planResponse, trialResponse] = await Promise.all([
      request({ method: "get", url: "branch_subscription" }),
      request({ method: "get", url: "branch_subscription/registration_trial" }),
    ]);
    if (!hasFailed(planResponse)) commit("SET_PLAN", firstRow(planResponse));
    commit("SET_REGISTRATION_TRIAL", firstRow(trialResponse));
    return !hasFailed(planResponse);
  },
  loadPlanAccess({ commit }) {
    if (pendingAccess) return pendingAccess;
    const current = request({
      method: "get",
      url: "branch_subscription/access",
    }).then((response) => {
      const access = firstRow(response);
      if (pendingAccess === current) {
        commit("SET_ACCESS", access);
        if (!access) pendingAccess = null;
      }
      return access;
    });
    pendingAccess = current;
    return current;
  },
  reloadPlanAccess({ dispatch }) {
    pendingAccess = null;
    return dispatch("loadPlanAccess");
  },
  async promptPlanUpgrade(_, notice) {
    if (Swal.isVisible()) return;
    const { isConfirmed } = await Swal.fire({
      icon: "info",
      title: notice.title,
      text: notice.text,
      showCancelButton: true,
      confirmButtonText: "Ir a gestionar mi plan",
      cancelButtonText: "Ahora no",
      reverseButtons: true,
    });
    if (isConfirmed) router.push({ name: "miPlan" }).catch(() => {});
  },
  savePlanChoice(_, choice) {
    try {
      localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(choice));
    } catch (error) {
      return;
    }
  },
  clearPlanChoice() {
    try {
      localStorage.removeItem(PENDING_PLAN_KEY);
    } catch (error) {
      return;
    }
  },
  readPlanChoice(_, query) {
    return readPendingChoice(query);
  },
  async openPlanCheckout(_, { payload, onEvent }) {
    const response = await request({
      method: "post",
      url: "branch_subscription/checkout",
      data: payload,
    });
    const transactionId = firstValue(response, "transaction_id");
    const error = transactionId
      ? await openPaddleCheckout(transactionId, onEvent)
      : response.mensaje || OPEN_FAILED_MESSAGE;
    if (error) notifyError(error);
    return !error;
  },
  async confirmPlanChange({ commit }, { packageName, payload }) {
    const preview = await request({
      method: "post",
      url: "branch_subscription/change/preview",
      data: payload,
    });
    if (!preview.estadoflag) {
      notifyError(preview.mensaje || CHANGE_FAILED_MESSAGE);
      return false;
    }
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: `¿Cambiar a ACO ${packageName}?`,
      text: changeSummary(preview.data[0]),
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar plan",
      cancelButtonText: "Volver",
      reverseButtons: true,
    });
    if (!isConfirmed) return false;
    const response = await request({
      method: "post",
      url: "branch_subscription/change",
      data: payload,
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje || CHANGE_FAILED_MESSAGE);
      return false;
    }
    commit("SET_PLAN", response.data[0]);
    notifySuccess(response.mensaje);
    return true;
  },
  async keepCompanyPlan({ commit }) {
    const response = await request({
      method: "post",
      url: "branch_subscription/resume",
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje || KEEP_FAILED_MESSAGE);
      return;
    }
    commit("SET_PLAN", response.data[0]);
    notifySuccess(response.mensaje);
  },
  async cancelCompanyPlan() {
    const response = await request({
      method: "post",
      url: "branch_subscription/cancel",
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje);
      return false;
    }
    notifySuccess(response.mensaje);
    return true;
  },
  async confirmCompanyPlan({ commit }, transactionId) {
    const response = transactionId
      ? await request({
          method: "post",
          url: "branch_subscription/confirm",
          data: { transaction_id: transactionId },
        })
      : await request({ method: "get", url: "branch_subscription" });
    const plan = firstRow(response);
    if (!isLivePlan(plan)) return false;
    commit("SET_PLAN", plan);
    notifySuccess(`Tu plan ACO ${plan.package_name} ya está activo.`);
    return true;
  },
  async loadBillingHistory({ commit }) {
    const response = await request({
      method: "get",
      url: "branch_subscription/billing_history",
    });
    if (!hasFailed(response))
      commit("SET_BILLING_HISTORY", firstRow(response) || NO_HISTORY);
    return errorOf(response);
  },
  async fetchInvoiceUrl(_, transactionId) {
    const response = await request({
      method: "get",
      url: `branch_subscription/billing_history/${encodeURIComponent(
        transactionId
      )}/invoice`,
    });
    const url = firstValue(response, "url");
    if (!url) notifyProblem(response, INVOICE_FAILED_MESSAGE);
    return url || null;
  },
  async startPaymentMethodUpdate(_, onEvent) {
    const response = await request({
      method: "post",
      url: "branch_subscription/payment_method",
    });
    const transactionId = firstValue(response, "transaction_id");
    if (!transactionId) {
      notifyProblem(response, PAYMENT_METHOD_FAILED_MESSAGE);
      return false;
    }
    const error = await openPaddleCheckout(transactionId, onEvent);
    if (error) notifyError(error);
    return !error;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
