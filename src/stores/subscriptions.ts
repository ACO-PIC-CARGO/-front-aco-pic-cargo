import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { RouteRecordNameGeneric } from "vue-router";
import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertResult } from "sweetalert2";
import moment from "moment";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import router from "@/router";
import { openPaddleCheckout } from "@/plugins/paddle";
import type { PaddleCheckoutListener } from "@/plugins/paddle";
import type { ApiResponse } from "@/types/api";
import type { ItemMenu } from "@/types/sesion";
import type {
  Billing,
  BillingEntry,
  BillingHistory,
  BillingRow,
  CardAction,
  CheckoutTransaction,
  CompanyPlan,
  DraftFeature,
  InvoiceLink,
  PackageDraft,
  PackageDraftErrors,
  PackageDraftField,
  PackageFeature,
  PackageLimits,
  PackageModule,
  PackagePayload,
  PaddleSyncItem,
  PaymentCard,
  PlanAccess,
  PlanChangePreview,
  PlanCheckoutPayload,
  PlanChoice,
  PlanChoiceQuery,
  PlanDetails,
  PlanInclude,
  PlanNotice,
  PlanSource,
  PlanStatusView,
  PlanView,
  RegistrationTrial,
  RegistrationTrialSetting,
  SavingsHint,
  SubscriptionPackage,
  TrialNotice,
  TrialUnit,
} from "@/types/suscripciones";

const ICON_BY_MESSAGE_TYPE: Record<string, SweetAlertIcon> = { TMSGINF: "info", TMSGADV: "warning" };
const PENDING_PLAN_KEY = "pendingPlan";

const errorOf = (response: ApiResponse): string | null => (hasFailed(response) ? response.mensaje : null);

const firstRow = <Row>(response: ApiResponse<Row[]>): Row | null =>
  (response.estadoflag && response.data[0]) || null;
const firstValue = <Row, Key extends keyof Row>(response: ApiResponse<Row[]>, key: Key): Row[Key] | null => {
  const row = firstRow(response);
  return row ? row[key] : null;
};

const notifyError = (message: string): Promise<SweetAlertResult> => Swal.fire({ icon: "error", text: message });
const notifyProblem = (response: ApiResponse): Promise<SweetAlertResult> =>
  Swal.fire({
    icon: ICON_BY_MESSAGE_TYPE[response.tipomensaje] || "error",
    text: response.mensaje,
  });

const countLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const roundToCents = (amount: number) => Math.round(amount * 100) / 100;

const formatPrice = (value: number | string): string => {
  const amount = Number(value);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `US$${formatted}`;
};

const formatDate = (value: string | null | undefined): string =>
  value ? moment.utc(value).locale("es").format("D [de] MMMM [de] YYYY") : "";

const annualSavings = (pkg: PlanSource) =>
  Math.max(
    0,
    roundToCents(Number(pkg.monthly_price) * 12 - Number(pkg.annual_price))
  );

const monthsSaved = (pkg: PlanSource) => {
  const monthlyPrice = Number(pkg.monthly_price);
  return monthlyPrice > 0 ? Math.round(annualSavings(pkg) / monthlyPrice) : 0;
};

const maxMonthsSavedOf = (packages: SubscriptionPackage[]) => Math.max(0, ...packages.map(monthsSaved));

const moduleNames = (packages: SubscriptionPackage[]) => [
  ...new Set(
    packages.flatMap((pkg) => pkg.modules.map((module) => module.name))
  ),
];

const userLabel = (count: number) => countLabel(count, "usuario", "usuarios");

const TRIAL_UNIT_LABELS: Record<string, [string, string]> = { day: ["día", "días"], month: ["mes", "meses"] };

const trialLabel = (pkg: PlanSource) => {
  const units = TRIAL_UNIT_LABELS[pkg.trial_interval as string];
  if (!pkg.trial_enabled || !units || !pkg.trial_frequency) return null;
  return `${countLabel(Number(pkg.trial_frequency), ...units)} gratis`;
};

const moduleAccessLabel = (pkg: PlanSource) =>
  pkg.module_selection_limit
    ? `${countLabel(pkg.module_selection_limit, "módulo", "módulos")} a elegir`
    : countLabel(pkg.modules.length, "módulo incluido", "módulos incluidos");

const isGeneral = (feature: PackageFeature) => !feature.module_id;

const moduleDetails = (pkg: PlanSource, moduleId: number) =>
  pkg.features
    .filter((feature) => feature.module_id === moduleId)
    .map((feature) => feature.description);

const withDetails = (entry: PlanInclude, details: string[]): PlanInclude =>
  details.length ? { ...entry, details } : entry;

const moduleIncludes = (pkg: PlanSource): PlanInclude[] => {
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

const toPlanView = (pkg: PlanSource): PlanView => {
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

const TRIAL_UNITS: TrialUnit[] = [
  { value: "day", label: "Días", max: 365 },
  { value: "month", label: "Meses", max: 12 },
];

let lastFeatureKey = 0;

const newFeature = (description = "", moduleId: number | null = null): DraftFeature => {
  lastFeatureKey += 1;
  return {
    key: lastFeatureKey,
    description,
    moduleId,
    isIncluded: true,
    isHighlighted: false,
  };
};

const emptyDraft = (): PackageDraft => ({
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

const draftFromPackage = (pkg: SubscriptionPackage): PackageDraft => ({
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

const canBeHighlighted = (feature: DraftFeature) => !feature.moduleId && feature.isIncluded;

const isShownHighlighted = (feature: DraftFeature) =>
  canBeHighlighted(feature) && feature.isHighlighted;

const highlightedCount = (features: DraftFeature[]) =>
  features.filter(isShownHighlighted).length;

const isBlank = (text: string | number | null | undefined) => !String(text || "").trim();

const isValidPrice = (value: string) => !isBlank(value) && Number(value) >= 0;

const nameError = (name: string) => {
  if (isBlank(name)) return "Escribe el nombre del paquete.";
  if (name.trim().length > NAME_MAX_LENGTH)
    return `Usa un nombre de hasta ${NAME_MAX_LENGTH} caracteres.`;
  return null;
};

const featuresError = (features: DraftFeature[]) => {
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

const modulesErrors = (draft: PackageDraft): PackageDraftErrors => {
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

const trialLengthError = (draft: PackageDraft) => {
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

const trialError = (draft: PackageDraft) =>
  draft.trialEnabled ? trialLengthError(draft) : null;

const registrationTrialDaysErrorOf = (value: number | string) => {
  const days = Number(value);
  return isBlank(value) || !Number.isInteger(days) || days < 1 || days > 365
    ? "Escribe entre 1 y 365 días."
    : null;
};

const validateDraft = (draft: PackageDraft): PackageDraftErrors => {
  const errors: Partial<Record<PackageDraftField, string | null>> = {
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
  ) as PackageDraftErrors;
};

const toFeaturePayload = (feature: DraftFeature): PackageFeature => ({
  description: feature.description.trim(),
  module_id: feature.moduleId,
  is_included: feature.moduleId ? true : feature.isIncluded,
  is_highlighted: isShownHighlighted(feature),
});

const toPayload = (draft: PackageDraft): PackagePayload => ({
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

const draftToPackage = (draft: PackageDraft, modules: PackageModule[]): PlanSource => {
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

const clampSelectionLimit = (selectionLimit: number | null, moduleCount: number) => {
  if (selectionLimit === null || moduleCount < 2) return null;
  return Math.min(selectionLimit, moduleCount - 1);
};

const removeModule = (draft: PackageDraft, moduleId: number): PackageDraft => {
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

const toggleModule = (draft: PackageDraft, moduleId: number): PackageDraft =>
  draft.moduleIds.includes(moduleId)
    ? removeModule(draft, moduleId)
    : { ...draft, moduleIds: [...draft.moduleIds, moduleId] };

const savingsHint = (draft: PackageDraft): SavingsHint | null => {
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

const PLAN_STATUS_VIEW: Record<string, PlanStatusView> = {
  active: { label: "Activo", tone: "ok" },
  trialing: { label: "En prueba", tone: "ok" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  paused: { label: "Pausado", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};

const BILLING_BY_QUERY: Record<string, Billing> = { mensual: "monthly", anual: "annual" };

const isLivePlan = (plan: CompanyPlan | null): plan is CompanyPlan => Boolean(plan) && plan!.status !== "canceled";

const statusView = (plan: CompanyPlan | null): PlanStatusView => {
  if (!plan) return PLAN_STATUS_VIEW.canceled!;
  if (plan.scheduled_change_action === "cancel" && plan.status !== "canceled") {
    return { label: "Cancelación programada", tone: "warning" };
  }
  return PLAN_STATUS_VIEW[plan.status] || { label: plan.status, tone: "muted" };
};

const planDateLineOf = (plan: CompanyPlan) => {
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

const readStoredChoice = (): PlanChoice | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_PLAN_KEY) as string);
    return stored && stored.packageId ? stored : null;
  } catch {
    return null;
  }
};

const readPendingChoice = (query: PlanChoiceQuery): PlanChoice | null => {
  if (query.paquete) {
    return {
      packageId: Number(query.paquete),
      billing: BILLING_BY_QUERY[query.ciclo as string] || "monthly",
    };
  }
  return readStoredChoice();
};

const CHANGEABLE_STATUSES = ["active", "trialing"];
const PERIOD_BY_BILLING: Record<Billing, string> = { monthly: "al mes", annual: "al año" };

const canChangePlanOf = (plan: CompanyPlan | null) =>
  Boolean(plan) && CHANGEABLE_STATUSES.includes(plan!.status);

const UNAVAILABLE_ACTIONS: CardAction[] = ["current", "lower", "annual-only"];
const UPGRADE_ACTIONS: CardAction[] = ["change", "change-module"];

const isCheaper = (pkg: SubscriptionPackage, plan: CompanyPlan, currentPackage: SubscriptionPackage | undefined) => {
  const currentPrice = currentPackage
    ? currentPackage.monthly_price
    : plan.package_monthly_price;
  return (
    currentPrice != null && Number(pkg.monthly_price) < Number(currentPrice)
  );
};

const cardActionOf = (
  pkg: SubscriptionPackage,
  plan: CompanyPlan | null,
  billing: Billing,
  currentPackage: SubscriptionPackage | undefined,
): CardAction => {
  if (!plan) return "change";
  if (isCheaper(pkg, plan, currentPackage)) return "lower";
  if (pkg.id !== plan.package_id) return "change";
  if (billing !== plan.billing)
    return plan.billing === "annual" ? "annual-only" : "change";
  return pkg.module_selection_limit ? "change-module" : "current";
};

const isUnavailableAction = (action: CardAction): boolean => UNAVAILABLE_ACTIONS.includes(action);

const currentPackageOf = (plan: CompanyPlan | null, packages: SubscriptionPackage[]) =>
  plan ? packages.find((pkg) => pkg.id === plan.package_id) : undefined;

const hasUpgradeOf = (plan: CompanyPlan | null, packages: SubscriptionPackage[]) => {
  const currentPackage = currentPackageOf(plan, packages);
  return packages.some((pkg) =>
    (["monthly", "annual"] as const).some((billing) =>
      UPGRADE_ACTIONS.includes(cardActionOf(pkg, plan, billing, currentPackage))
    )
  );
};

const purchaseActionOf = (
  pkg: SubscriptionPackage,
  plan: CompanyPlan | null,
  billing: Billing,
  currentPackage: SubscriptionPackage | undefined,
): CardAction => {
  if (!isLivePlan(plan)) return "buy";
  if (!canChangePlanOf(plan)) return "manage";
  return cardActionOf(pkg, plan, billing, currentPackage);
};

const changeSummary = (preview: PlanChangePreview): string => {
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

const daysUntil = (value: string | null | undefined, now: number) =>
  Math.max(0, Math.ceil((Date.parse(value as string) - now) / DAY_MS) || 0);

const NO_NOTICE: TrialNotice = { days: null, ended: false, canBuy: false, paidText: null };
const ACO_BRANCH_ID = 1;

const registrationTrialNotice = (
  registrationTrial: RegistrationTrial | null,
  canBuy: boolean,
  now: number,
): TrialNotice | null => {
  const notice = { ...NO_NOTICE, canBuy };
  if (!registrationTrial) return canBuy ? notice : null;
  const days = daysUntil(registrationTrial.ends_at, now);
  return days > 0 ? { ...notice, days } : { ...notice, ended: true };
};

const trialNoticeOf = ({
  plan,
  registrationTrial,
  branchId,
  now = Date.now(),
}: {
  plan: CompanyPlan | null;
  registrationTrial: RegistrationTrial | null;
  branchId: unknown;
  now?: number;
}): TrialNotice | null => {
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

const paymentUpdateNeededOf = (plan: CompanyPlan) =>
  plan.status === "past_due" && plan.scheduled_change_action !== "cancel";

const featureDescriptions = (features: PackageFeature[], moduleId: number | null) =>
  features
    .filter((feature) => feature.module_id === moduleId)
    .map((feature) => feature.description);

const planDetailsOf = (plan: CompanyPlan | null): PlanDetails => {
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

const routesOf = (node: ItemMenu): PropertyKey[] =>
  (node.children || [])
    .flatMap((child) => [child.route, ...routesOf(child)])
    .filter(Boolean) as PropertyKey[];

const modulesForRoute = (
  menuTree: ItemMenu[] | null | undefined,
  routeName: RouteRecordNameGeneric | null | undefined,
): PackageModule[] =>
  routeName
    ? (menuTree || [])
        .filter((node) => routesOf(node).includes(routeName))
        .map((node) => ({ id: node.id, name: node.name }))
    : [];

const isModuleLocked = (access: PlanAccess | null, moduleId: number) =>
  Boolean(access && access.has_plan) &&
  (access!.locked_module_ids || []).includes(moduleId);

const lockedModuleForRouteOf = (
  menuTree: ItemMenu[] | null | undefined,
  routeName: RouteRecordNameGeneric | null | undefined,
  access: PlanAccess | null,
): PackageModule | null => {
  const modules = modulesForRoute(menuTree, routeName);
  return modules.length &&
    modules.every((module) => isModuleLocked(access, module.id))
    ? modules[0]!
    : null;
};

const canAddUsersOf = (access: PlanAccess | null) =>
  !access || !access.has_plan || Boolean(access.can_add_users);

const STOPPED_PLAN_TEXT: Record<string, (plan: string | null, next: string) => string> = {
  canceled: (plan, next) =>
    `Tu plan ACO ${plan} está cancelado. Elige un plan para ${next}.`,
  paused: (plan) =>
    `Tu plan ACO ${plan} está pausado. Revisa Mi plan para reactivarlo.`,
};

const lockedModuleNoticeOf = (access: PlanAccess, moduleName: string): PlanNotice => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status as string];
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

const userLimitNoticeOf = (access: PlanAccess): PlanNotice => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status as string];
  if (stopped) {
    return {
      title: "No puedes agregar usuarios",
      text: stopped(access.package_name, "agregar usuarios"),
    };
  }
  return {
    title: "Llegaste al límite de usuarios",
    text: `Tu plan ACO ${access.package_name} permite ${userLabel(
      access.user_limit as number
    )} y tu empresa ya tiene ${
      access.user_count
    }. Mejora tu plan para agregar más.`,
  };
};

const CONCEPT_BY_ORIGIN: Record<string, string> = {
  subscription_recurring: "Renovación",
  subscription_update: "Cambio a",
};
const BILLING_LABELS: Record<Billing, string> = { monthly: "Mensual", annual: "Anual" };
const PAID: PlanStatusView = { label: "Pagado", tone: "ok" };
const BILLING_STATUS_VIEW: Record<string, PlanStatusView> = {
  completed: PAID,
  paid: PAID,
  billed: { label: "Facturado", tone: "info" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};
const REFUNDED: PlanStatusView = { label: "Reembolsado", tone: "muted" };
const PARTLY_REFUNDED: PlanStatusView = { label: "Reembolso parcial", tone: "info" };
const CARD_BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  american_express: "American Express",
  discover: "Discover",
  diners_club: "Diners Club",
  jcb: "JCB",
  maestro: "Maestro",
  union_pay: "UnionPay",
};
const NO_HISTORY: BillingHistory = {
  transactions: [],
  payment_method: null,
  can_update_payment_method: false,
};

const conceptOf = (entry: BillingEntry) => {
  const name = `${CONCEPT_BY_ORIGIN[entry.origin] || "Compra"} ${
    entry.product_name
  }`;
  return entry.billing ? `${name} · ${BILLING_LABELS[entry.billing]}` : name;
};

const amountOf = (entry: BillingEntry) => {
  const amount = Number(entry.total) / 100;
  if (entry.currency_code === "USD") return formatPrice(amount);
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: entry.currency_code,
  }).format(amount);
};

const statusOf = (entry: BillingEntry) => {
  const total = Number(entry.total);
  const adjusted = Number(entry.adjusted_total);
  const status = BILLING_STATUS_VIEW[entry.status];
  if (status !== PAID || adjusted >= total) return status;
  return adjusted > 0 ? PARTLY_REFUNDED : REFUNDED;
};

const billingRowsOf = (entries: BillingEntry[]): BillingRow[] =>
  entries.map((entry) => {
    const status = statusOf(entry)!;
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

const cardLabel = (paymentMethod: PaymentCard | null) => {
  if (!paymentMethod) return null;
  const brand = CARD_BRANDS[paymentMethod.brand] || "Tarjeta";
  const month = String(paymentMethod.expiry_month).padStart(2, "0");
  return `${brand} terminada en ${paymentMethod.last4} · vence ${month}/${paymentMethod.expiry_year}`;
};

export const useSubscriptionsStore = defineStore("subscriptions", () => {
  let pendingAccess: Promise<PlanAccess | null> | null = null;

  const packages = ref<SubscriptionPackage[]>([]);
  const publicPackages = ref<SubscriptionPackage[]>([]);
  const packageModules = ref<PackageModule[]>([]);
  const packageDraft = ref<PackageDraft>(emptyDraft());
  const paddleSyncReport = ref<PaddleSyncItem[]>([]);
  const registrationTrialDays = ref<number | string>("");
  const plan = ref<CompanyPlan | null>(null);
  const registrationTrial = ref<RegistrationTrial | null>(null);
  const access = ref<PlanAccess | null>(null);
  const billingHistory = ref<BillingHistory>({ ...NO_HISTORY, transactions: [] });

  const limits = computed<PackageLimits>(() => ({
    name: NAME_MAX_LENGTH,
    tagline: TAGLINE_MAX_LENGTH,
    feature: FEATURE_MAX_LENGTH,
    highlights: MAX_HIGHLIGHTS,
  }));
  const trialUnits = computed(() => TRIAL_UNITS);
  const planViews = computed(() => publicPackages.value.map(toPlanView));
  const moduleLine = computed(() => moduleNames(publicPackages.value).join(" · "));
  const maxMonthsSaved = computed(() => maxMonthsSavedOf(publicPackages.value));
  const activePackageCount = computed(
    () => packages.value.filter((pkg) => pkg.is_active).length,
  );
  const packageDraftErrors = computed(() => validateDraft(packageDraft.value));
  const packageDraftPayload = computed(() => toPayload(packageDraft.value));
  const packageDraftPreview = computed(() =>
    toPlanView({
      ...draftToPackage(packageDraft.value, packageModules.value),
      name: packageDraft.value.name.trim() || "NUEVO",
    }),
  );
  const packageDraftSavings = computed(() => savingsHint(packageDraft.value));
  const registrationTrialDaysError = computed(() =>
    registrationTrialDaysErrorOf(registrationTrialDays.value),
  );
  const hasLivePlan = computed(() => isLivePlan(plan.value));
  const livePlan = computed(() => (isLivePlan(plan.value) ? plan.value : null));
  const planStatus = computed(() => statusView(plan.value));
  const planDateLine = computed(() => (plan.value ? planDateLineOf(plan.value) : ""));
  const canChangePlan = computed(() => canChangePlanOf(plan.value));
  const currentPackage = computed(() => currentPackageOf(plan.value, publicPackages.value));
  const hasUpgrade = computed(() => hasUpgradeOf(plan.value, publicPackages.value));
  const planDetails = computed(() => planDetailsOf(plan.value));
  const paymentUpdateNeeded = computed(
    () => Boolean(plan.value) && paymentUpdateNeededOf(plan.value!),
  );
  const canAddUsers = computed(() => canAddUsersOf(access.value));
  const userLimitNotice = computed(() => userLimitNoticeOf(access.value!));
  const billingRows = computed(() => billingRowsOf(billingHistory.value.transactions));
  const paymentCard = computed(() => cardLabel(billingHistory.value.payment_method));

  function packagesWithStatus(status: string): SubscriptionPackage[] {
    return status === "all"
      ? packages.value
      : packages.value.filter((pkg) => pkg.is_active === (status === "active"));
  }

  function canHighlightFeature(feature: DraftFeature): boolean {
    return (
      canBeHighlighted(feature) &&
      (feature.isHighlighted ||
        highlightedCount(packageDraft.value.features) < MAX_HIGHLIGHTS)
    );
  }

  function cardAction(pkg: SubscriptionPackage, billing: Billing): CardAction {
    return cardActionOf(pkg, plan.value, billing, currentPackage.value);
  }

  function purchaseAction(pkg: SubscriptionPackage, billing: Billing): CardAction {
    return purchaseActionOf(pkg, plan.value, billing, currentPackage.value);
  }

  function trialNotice({ branchId, now }: { branchId: unknown; now?: number }): TrialNotice | null {
    return trialNoticeOf({
      plan: plan.value,
      registrationTrial: registrationTrial.value,
      branchId,
      now,
    });
  }

  function lockedModuleForRoute(
    menuTree: ItemMenu[] | null | undefined,
    routeName: RouteRecordNameGeneric | null | undefined,
  ): PackageModule | null {
    return lockedModuleForRouteOf(menuTree, routeName, access.value);
  }

  function lockedModuleNotice(moduleName: string): PlanNotice {
    return lockedModuleNoticeOf(access.value!, moduleName);
  }

  function resetSession(): void {
    pendingAccess = null;
    packages.value = [];
    publicPackages.value = [];
    packageModules.value = [];
    packageDraft.value = emptyDraft();
    paddleSyncReport.value = [];
    registrationTrialDays.value = "";
    plan.value = null;
    registrationTrial.value = null;
    access.value = null;
    billingHistory.value = { ...NO_HISTORY, transactions: [] };
  }

  async function loadPackages(): Promise<string | null> {
    const response = await request<SubscriptionPackage>({
      method: "get",
      url: "subscription_packages",
    });
    if (!hasFailed(response)) packages.value = response.data;
    return errorOf(response);
  }

  async function loadPublicPackages(): Promise<string | null> {
    const response = await request<SubscriptionPackage>({
      method: "get",
      url: "public/subscription_packages",
    });
    if (!hasFailed(response)) publicPackages.value = response.data;
    return errorOf(response);
  }

  async function loadPackageModules(): Promise<void> {
    const response = await request<PackageModule>({
      method: "get",
      url: "subscription_package_modules",
    });
    packageModules.value = response.estadoflag ? response.data : [];
  }

  async function setPackageActive({ id, isActive }: { id: number; isActive: boolean }): Promise<boolean> {
    const response = await request({
      method: "patch",
      url: `subscription_packages/${id}/status`,
      data: { is_active: isActive },
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje);
      return false;
    }
    const pkg = packages.value.find((item) => item.id === id);
    if (pkg) pkg.is_active = isActive;
    notifySuccess(response.mensaje);
    return true;
  }

  function openPackageDraft(pkg: SubscriptionPackage | null): void {
    packageDraft.value = pkg ? draftFromPackage(pkg) : emptyDraft();
  }

  function toggleDraftModule(moduleId: number): void {
    packageDraft.value = toggleModule(packageDraft.value, moduleId);
  }

  function addDraftFeature({ description, moduleId }: { description: string; moduleId: number | null }): void {
    packageDraft.value.features.push(newFeature(description, moduleId));
  }

  function updateDraftFeature({ key, changes }: { key: number; changes: Partial<DraftFeature> }): void {
    const feature = packageDraft.value.features.find(
      (item) => item.key === key
    );
    if (feature) Object.assign(feature, changes);
  }

  function removeDraftFeature(key: number): void {
    packageDraft.value.features = packageDraft.value.features.filter(
      (item) => item.key !== key
    );
  }

  async function savePackageDraft(): Promise<ApiResponse<unknown[]>> {
    const { id } = packageDraft.value;
    const response = await request({
      method: id ? "put" : "post",
      url: id ? `subscription_packages/${id}` : "subscription_packages",
      data: packageDraftPayload.value,
    });
    if (response.estadoflag) notifySuccess(response.mensaje);
    return response;
  }

  async function loadPaddleSync(): Promise<ApiResponse<PaddleSyncItem[]>> {
    const response = await request<PaddleSyncItem>({
      method: "get",
      url: "subscription_packages/paddle_sync",
    });
    if (!hasFailed(response)) paddleSyncReport.value = response.data;
    return response;
  }

  async function applyPaddleSync(): Promise<ApiResponse<PaddleSyncItem[]>> {
    const response = await request<PaddleSyncItem>({
      method: "post",
      url: "subscription_packages/paddle_sync",
    });
    if (response.data.length) paddleSyncReport.value = response.data;
    if (response.estadoflag && response.data.length)
      notifySuccess(response.mensaje);
    return response;
  }

  async function loadRegistrationTrialSetting(): Promise<string | null> {
    const response = await request<RegistrationTrialSetting>({
      method: "get",
      url: "registration_trial_setting",
    });
    if (!response.estadoflag) return response.mensaje;
    registrationTrialDays.value = response.data[0]!.trial_days;
    return null;
  }

  async function saveRegistrationTrialSetting(): Promise<boolean> {
    const response = await request<RegistrationTrialSetting>({
      method: "put",
      url: "registration_trial_setting",
      data: { trial_days: Number(registrationTrialDays.value) },
    });
    if (!response.estadoflag) {
      notifyProblem(response);
      return false;
    }
    registrationTrialDays.value = response.data[0]!.trial_days;
    notifySuccess(response.mensaje);
    return true;
  }

  async function loadCompanyPlan(): Promise<string | null> {
    const response = await request<CompanyPlan>({
      method: "get",
      url: "branch_subscription",
    });
    if (!hasFailed(response)) plan.value = firstRow(response);
    return errorOf(response);
  }

  async function loadPlanBadge(): Promise<boolean> {
    const [planResponse, trialResponse] = await Promise.all([
      request<CompanyPlan>({ method: "get", url: "branch_subscription" }),
      request<RegistrationTrial>({ method: "get", url: "branch_subscription/registration_trial" }),
    ]);
    if (!hasFailed(planResponse)) plan.value = firstRow(planResponse);
    registrationTrial.value = firstRow(trialResponse);
    return !hasFailed(planResponse);
  }

  function loadPlanAccess(): Promise<PlanAccess | null> {
    if (pendingAccess) return pendingAccess;
    const current: Promise<PlanAccess | null> = request<PlanAccess>({
      method: "get",
      url: "branch_subscription/access",
    }).then((response) => {
      const row = firstRow(response);
      if (pendingAccess === current) {
        access.value = row;
        if (!row) pendingAccess = null;
      }
      return row;
    });
    pendingAccess = current;
    return current;
  }

  function reloadPlanAccess(): Promise<PlanAccess | null> {
    pendingAccess = null;
    return loadPlanAccess();
  }

  async function promptPlanUpgrade(notice: PlanNotice): Promise<void> {
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
  }

  function savePlanChoice(choice: PlanChoice): void {
    try {
      localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(choice));
    } catch {
      return;
    }
  }

  function clearPlanChoice(): void {
    try {
      localStorage.removeItem(PENDING_PLAN_KEY);
    } catch {
      return;
    }
  }

  function readPlanChoice(query: PlanChoiceQuery): PlanChoice | null {
    return readPendingChoice(query);
  }

  async function openPlanCheckout({
    payload,
    onEvent,
  }: {
    payload: PlanCheckoutPayload;
    onEvent: PaddleCheckoutListener;
  }): Promise<boolean> {
    const response = await request<CheckoutTransaction>({
      method: "post",
      url: "branch_subscription/checkout",
      data: payload,
    });
    const transactionId = firstValue(response, "transaction_id");
    const error = transactionId
      ? await openPaddleCheckout(transactionId, onEvent)
      : response.mensaje;
    if (error) notifyError(error);
    return !error;
  }

  async function confirmPlanChange({
    packageName,
    payload,
  }: {
    packageName: string;
    payload: PlanCheckoutPayload;
  }): Promise<boolean> {
    const preview = await request<PlanChangePreview>({
      method: "post",
      url: "branch_subscription/change/preview",
      data: payload,
    });
    if (!preview.estadoflag) {
      notifyError(preview.mensaje);
      return false;
    }
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: `¿Cambiar a ACO ${packageName}?`,
      text: changeSummary(preview.data[0]!),
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar plan",
      cancelButtonText: "Volver",
      reverseButtons: true,
    });
    if (!isConfirmed) return false;
    const response = await request<CompanyPlan>({
      method: "post",
      url: "branch_subscription/change",
      data: payload,
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje);
      return false;
    }
    plan.value = response.data[0]!;
    notifySuccess(response.mensaje);
    return true;
  }

  async function keepCompanyPlan(): Promise<void> {
    const response = await request<CompanyPlan>({
      method: "post",
      url: "branch_subscription/resume",
    });
    if (!response.estadoflag) {
      notifyError(response.mensaje);
      return;
    }
    plan.value = response.data[0]!;
    notifySuccess(response.mensaje);
  }

  async function cancelCompanyPlan(): Promise<boolean> {
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
  }

  async function confirmCompanyPlan(transactionId: string | null | undefined): Promise<boolean> {
    const response = transactionId
      ? await request<CompanyPlan>({
          method: "post",
          url: "branch_subscription/confirm",
          data: { transaction_id: transactionId },
        })
      : await request<CompanyPlan>({ method: "get", url: "branch_subscription" });
    const row = firstRow(response);
    if (!isLivePlan(row)) return false;
    plan.value = row;
    notifySuccess(`Tu plan ACO ${row.package_name} ya está activo.`);
    return true;
  }

  async function loadBillingHistory(): Promise<string | null> {
    const response = await request<BillingHistory>({
      method: "get",
      url: "branch_subscription/billing_history",
    });
    if (!hasFailed(response))
      billingHistory.value = firstRow(response) || NO_HISTORY;
    return errorOf(response);
  }

  async function fetchInvoiceUrl(transactionId: string): Promise<string | null> {
    const response = await request<InvoiceLink>({
      method: "get",
      url: `branch_subscription/billing_history/${encodeURIComponent(
        transactionId
      )}/invoice`,
    });
    const url = firstValue(response, "url");
    if (!url) notifyProblem(response);
    return url || null;
  }

  async function startPaymentMethodUpdate(onEvent: PaddleCheckoutListener): Promise<boolean> {
    const response = await request<CheckoutTransaction>({
      method: "post",
      url: "branch_subscription/payment_method",
    });
    const transactionId = firstValue(response, "transaction_id");
    if (!transactionId) {
      notifyProblem(response);
      return false;
    }
    const error = await openPaddleCheckout(transactionId, onEvent);
    if (error) notifyError(error);
    return !error;
  }

  return {
    packages,
    publicPackages,
    packageModules,
    packageDraft,
    paddleSyncReport,
    registrationTrialDays,
    plan,
    registrationTrial,
    access,
    billingHistory,
    formatPrice,
    formatDate,
    toPlanView,
    limits,
    trialUnits,
    planViews,
    moduleLine,
    maxMonthsSaved,
    activePackageCount,
    packagesWithStatus,
    packageDraftErrors,
    packageDraftPayload,
    packageDraftPreview,
    packageDraftSavings,
    canHighlightFeature,
    registrationTrialDaysError,
    hasLivePlan,
    livePlan,
    planStatus,
    planDateLine,
    canChangePlan,
    currentPackage,
    hasUpgrade,
    planDetails,
    paymentUpdateNeeded,
    cardAction,
    purchaseAction,
    isUnavailableAction,
    changeSummary,
    trialNotice,
    modulesForRoute,
    lockedModuleForRoute,
    lockedModuleNotice,
    canAddUsers,
    userLimitNotice,
    billingRows,
    paymentCard,
    resetSession,
    loadPackages,
    loadPublicPackages,
    loadPackageModules,
    setPackageActive,
    openPackageDraft,
    toggleDraftModule,
    addDraftFeature,
    updateDraftFeature,
    removeDraftFeature,
    savePackageDraft,
    loadPaddleSync,
    applyPaddleSync,
    loadRegistrationTrialSetting,
    saveRegistrationTrialSetting,
    loadCompanyPlan,
    loadPlanBadge,
    loadPlanAccess,
    reloadPlanAccess,
    promptPlanUpgrade,
    savePlanChoice,
    clearPlanChoice,
    readPlanChoice,
    openPlanCheckout,
    confirmPlanChange,
    keepCompanyPlan,
    cancelCompanyPlan,
    confirmCompanyPlan,
    loadBillingHistory,
    fetchInvoiceUrl,
    startPaymentMethodUpdate,
  };
});
