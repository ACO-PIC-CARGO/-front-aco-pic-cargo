export const MAX_HIGHLIGHTS = 2;
export const NAME_MAX_LENGTH = 60;
export const TAGLINE_MAX_LENGTH = 120;
export const FEATURE_MAX_LENGTH = 160;

export const TRIAL_UNITS = [
  { value: "day", label: "Días", max: 365 },
  { value: "month", label: "Meses", max: 12 },
];

let lastFeatureKey = 0;

export const newFeature = (description = "", moduleId = null) => {
  lastFeatureKey += 1;
  return {
    key: lastFeatureKey,
    description,
    moduleId,
    isIncluded: true,
    isHighlighted: false,
  };
};

export const emptyDraft = () => ({
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

export const draftFromPackage = (pkg) => ({
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

export const canBeHighlighted = (feature) =>
  !feature.moduleId && feature.isIncluded;

const isShownHighlighted = (feature) =>
  canBeHighlighted(feature) && feature.isHighlighted;

export const highlightedCount = (features) =>
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

export const registrationTrialDaysError = (value) => {
  const days = Number(value);
  return isBlank(value) || !Number.isInteger(days) || days < 1 || days > 365
    ? "Escribe entre 1 y 365 días."
    : null;
};

export const validateDraft = (draft) => {
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

export const toPayload = (draft) => ({
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

export const draftToPackage = (draft, modules) => {
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

export const toggleModule = (draft, moduleId) =>
  draft.moduleIds.includes(moduleId)
    ? removeModule(draft, moduleId)
    : { ...draft, moduleIds: [...draft.moduleIds, moduleId] };
