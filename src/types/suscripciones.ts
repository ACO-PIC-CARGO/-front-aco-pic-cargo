export type Billing = "monthly" | "annual";

export interface PackageModule {
  id: number;
  name: string;
}

export interface PackageFeature {
  description: string;
  module_id: number | null;
  is_included: boolean;
  is_highlighted: boolean;
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  tagline: string | null;
  monthly_price: number | string;
  annual_price: number | string;
  user_limit: number;
  module_selection_limit: number | null;
  is_featured: boolean;
  is_active: boolean;
  trial_enabled: boolean;
  trial_interval: string | null;
  trial_frequency: number | null;
  modules: PackageModule[];
  features: PackageFeature[];
}

export interface PackagePayload {
  name: string;
  tagline: string | null;
  monthly_price: number;
  annual_price: number;
  user_limit: number;
  module_selection_limit: number | null;
  is_featured: boolean;
  trial_enabled: boolean;
  trial_interval: string;
  trial_frequency: number | null;
  modules: number[];
  features: PackageFeature[];
}

export type PlanSource = Omit<SubscriptionPackage, "id"> & { id: number | null };

export interface PlanInclude {
  text: string;
  conditional?: boolean;
  details?: string[];
}

export interface PlanView {
  id: number | null;
  name: string;
  tagline: string | null;
  monthlyPrice: string;
  annualPrice: string;
  savings: string | null;
  users: string;
  trial: string | null;
  highlights: string[];
  includes: PlanInclude[];
  excludes: string[];
  featured: boolean;
  isActive: boolean;
}

export interface DraftFeature {
  key: number;
  description: string;
  moduleId: number | null;
  isIncluded: boolean;
  isHighlighted: boolean;
}

export interface PackageDraft {
  id: number | null;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  userLimit: number | string;
  moduleIds: number[];
  selectionLimit: number | null;
  isFeatured: boolean;
  trialEnabled: boolean;
  trialInterval: string;
  trialFrequency: number | string;
  features: DraftFeature[];
}

export type PackageDraftField = keyof PackageDraft;

export type PackageDraftErrors = Partial<Record<PackageDraftField, string>>;

export interface PackageLimits {
  name: number;
  tagline: number;
  feature: number;
  highlights: number;
}

export interface TrialUnit {
  value: string;
  label: string;
  max: number;
}

export interface SavingsHint {
  positive: boolean;
  text: string;
}

export interface PaddleSyncAction {
  label: string;
}

export interface PaddleSyncItem {
  package_id: number;
  name: string;
  is_active: boolean;
  error?: string | null;
  actions: PaddleSyncAction[];
}

export interface CompanyPlan {
  package_id: number;
  package_name: string;
  package_monthly_price?: number | string | null;
  billing: Billing;
  status: string;
  current_period_ends_at?: string | null;
  next_billed_at: string | null;
  scheduled_change_action: string | null;
  scheduled_change_at: string | null;
  canceled_at: string | null;
  user_limit: number | null;
  user_count: number | null;
  modules: PackageModule[];
  features?: PackageFeature[];
}

export interface PlanStatusView {
  label: string;
  tone: string;
}

export interface PlanDetailModule {
  id: number;
  name: string;
  details: string[];
}

export interface PlanDetails {
  users: string | null;
  modules: PlanDetailModule[];
  extras: string[];
}

export interface RegistrationTrial {
  ends_at: string;
}

export interface TrialNotice {
  days: number | null;
  ended: boolean;
  canBuy: boolean;
  paidText: string | null;
}

export interface PlanAccess {
  has_plan: boolean;
  plan_status: string | null;
  package_name: string | null;
  locked_module_ids: number[] | null;
  user_limit: number | null;
  user_count: number | null;
  can_add_users: boolean;
}

export interface PlanNotice {
  title: string;
  text: string;
}

export interface PlanChoice {
  packageId: number;
  billing: Billing;
}

export interface PlanChoiceQuery {
  paquete?: unknown;
  ciclo?: unknown;
}

export interface PlanCheckoutPayload {
  package_id: number;
  billing: Billing;
  module_ids: number[];
}

export type CardAction = "buy" | "manage" | "change" | "change-module" | "current" | "lower" | "annual-only";

export interface PlanChangePreview {
  action: "charge" | "credit" | "none";
  amount: number;
  recurring_amount: number;
  billing: Billing;
  next_billed_at: string | null;
  removes_cancel: boolean;
}

export interface CheckoutTransaction {
  transaction_id: string;
}

export interface BillingEntry {
  id: string;
  billed_at: string | null;
  origin: string;
  product_name: string | null;
  billing: Billing | null;
  status: string;
  currency_code: string;
  total: string | null;
  adjusted_total: string | null;
  has_invoice: boolean;
}

export interface PaymentCard {
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
}

export interface BillingHistory {
  transactions: BillingEntry[];
  payment_method: PaymentCard | null;
  can_update_payment_method: boolean;
}

export interface BillingRow {
  id: string;
  date: string;
  concept: string;
  amount: string;
  statusLabel: string | undefined;
  statusTone: string | undefined;
  hasInvoice: boolean;
}

export interface InvoiceLink {
  url: string;
}

export interface RegistrationTrialSetting {
  trial_days: number;
}
