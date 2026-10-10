import Swal from "sweetalert2";
import moment from "moment";
import { hasFailed, notifySuccess, request } from "@/store/request";

const ICON_BY_MESSAGE_TYPE = { TMSGINF: "info", TMSGADV: "warning" };

const errorOf = (response) => (hasFailed(response) ? response.mensaje : null);

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

const state = {
  packages: [],
  publicPackages: [],
  packageModules: [],
  packageDraft: emptyDraft(),
  paddleSyncReport: [],
  registrationTrialDays: "",
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
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
