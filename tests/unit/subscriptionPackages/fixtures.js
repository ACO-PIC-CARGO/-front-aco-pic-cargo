const PRICING = { id: 6, name: "Pricing" };
const OPERATIONS = { id: 1, name: "Operativo" };
const ADMINISTRATION = { id: 3, name: "Administración" };

const feature = (description, options = {}) => ({
  description,
  module_id: options.moduleId ?? null,
  is_included: options.included ?? true,
  is_highlighted: options.highlighted ?? false,
});

const MODULE_FEATURES = [
  feature("Reporte de vendedores por status y mercado", {
    moduleId: PRICING.id,
  }),
  feature("Acceso a ingreso y seguimiento de llamadas", {
    moduleId: PRICING.id,
  }),
  feature("Reporte de embarques por fecha de llegada o salida", {
    moduleId: OPERATIONS.id,
  }),
];

export const MODULES = [PRICING, OPERATIONS, ADMINISTRATION];

export const START = {
  id: 2,
  name: "START",
  tagline: "Para empezar",
  monthly_price: "29.00",
  annual_price: "290.00",
  user_limit: 1,
  module_selection_limit: 1,
  is_featured: false,
  is_active: true,
  modules: MODULES,
  features: [
    feature("Sistema 100% online", { highlighted: true }),
    feature("Soporte básico", { highlighted: true }),
    ...MODULE_FEATURES,
    feature("Los 3 módulos al mismo tiempo", { included: false }),
    feature("Soporte premium", { included: false }),
  ],
};

export const PRO = {
  id: 3,
  name: "PRO",
  tagline: "Para agencias en crecimiento",
  monthly_price: "79.00",
  annual_price: "948.00",
  user_limit: 3,
  module_selection_limit: null,
  is_featured: true,
  is_active: false,
  modules: MODULES,
  features: [
    feature("Flujo conectado entre módulos", { highlighted: true }),
    feature("Sistema 100% online"),
    ...MODULE_FEATURES,
    feature("Soporte premium", { included: false }),
  ],
};
