const countLabel = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`;

const roundToCents = (amount) => Math.round(amount * 100) / 100;

export const formatPrice = (value) => {
  const amount = Number(value);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `US$${formatted}`;
};

const annualSavings = (pkg) =>
  Math.max(
    0,
    roundToCents(Number(pkg.monthly_price) * 12 - Number(pkg.annual_price))
  );

const monthsSaved = (pkg) => {
  const monthlyPrice = Number(pkg.monthly_price);
  return monthlyPrice > 0 ? Math.round(annualSavings(pkg) / monthlyPrice) : 0;
};

export const maxMonthsSaved = (packages) =>
  Math.max(0, ...packages.map(monthsSaved));

export const moduleNames = (packages) => [
  ...new Set(
    packages.flatMap((pkg) => pkg.modules.map((module) => module.name))
  ),
];

export const userLabel = (count) => countLabel(count, "usuario", "usuarios");

const TRIAL_UNIT_LABELS = { day: ["día", "días"], month: ["mes", "meses"] };

export const trialLabel = (pkg) => {
  const units = TRIAL_UNIT_LABELS[pkg.trial_interval];
  if (!pkg.trial_enabled || !units || !pkg.trial_frequency) return null;
  return `${countLabel(Number(pkg.trial_frequency), ...units)} gratis`;
};

export const moduleAccessLabel = (pkg) =>
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

export const toPlanView = (pkg) => {
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
