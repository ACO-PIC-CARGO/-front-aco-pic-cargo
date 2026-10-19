import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import "moment/dist/locale/es";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { openPaddleCheckout } from "@/plugins/paddle";
import { useSubscriptionsStore } from "@/stores/subscriptions";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), isVisible: vi.fn() } }));
vi.mock("@/plugins/paddle", () => ({ openPaddleCheckout: vi.fn() }));

interface RequestConfig {
  method: string;
  url: string;
  data?: unknown;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
let unexpected: string[] = [];

function respond(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async (config) => {
    const key = `${config.method} ${config.url}`;
    if (!(key in bodies)) {
      unexpected.push(key);
      throw new Error(`unexpected request ${key}`);
    }
    const body = bodies[key];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

const sent = () => httpMock.mock.calls.map(([config]) => config);
const accepted = (data: unknown[] = [], mensaje = "ok") => ({ estadoflag: true, mensaje, tipomensaje: "TMSGSUC", data });
const failed = (mensaje = "falló", tipomensaje = "TMSGERR") => ({ estadoflag: false, mensaje, tipomensaje, data: [] });
const empty = () => ({ estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] });

const toast = (title: string) => ({
  toast: true,
  position: "top-end",
  icon: "success",
  title,
  showConfirmButton: false,
  timer: 3000,
});

const startPackage = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "START",
  tagline: "Para empezar",
  monthly_price: "29.00",
  annual_price: "290.00",
  user_limit: 1,
  module_selection_limit: 1,
  is_featured: false,
  is_active: true,
  trial_enabled: true,
  trial_interval: "day",
  trial_frequency: 15,
  modules: [
    { id: 10, name: "PRICING" },
    { id: 11, name: "OPERATIVO" },
  ],
  features: [
    { description: "Reporte de vendedores", module_id: 10, is_included: true, is_highlighted: false },
    { description: "Soporte básico", module_id: null, is_included: true, is_highlighted: true },
    { description: "Soporte premium", module_id: null, is_included: false, is_highlighted: false },
  ],
  ...over,
});

const proPackage = (over: Record<string, unknown> = {}) =>
  startPackage({
    id: 2,
    name: "PRO",
    monthly_price: "79.00",
    annual_price: "790.00",
    user_limit: 3,
    module_selection_limit: null,
    is_featured: true,
    trial_enabled: false,
    features: [],
    ...over,
  });

const livePlan = (over: Record<string, unknown> = {}) => ({
  package_id: 1,
  package_name: "START",
  billing: "monthly",
  status: "active",
  next_billed_at: "2026-11-05T00:00:00Z",
  scheduled_change_action: null,
  scheduled_change_at: null,
  canceled_at: null,
  user_limit: 3,
  user_count: 2,
  modules: [{ id: 10, name: "PRICING" }],
  features: [
    { description: "Reporte de vendedores", module_id: 10, is_included: true, is_highlighted: false },
    { description: "Soporte", module_id: null, is_included: true, is_highlighted: false },
  ],
  ...over,
});

const menu = [
  { id: 1, name: "PRICING", children: [{ id: 5, name: "Cotizaciones", route: "lstQuote" }] },
  { id: 2, name: "OPERATIVO", children: [{ id: 6, name: "Grupo", children: [{ id: 7, name: "Houses", route: "lstHouse" }] }] },
  { id: 3, name: "CONFIGURACIÓN", children: [{ id: 8, name: "Mi plan", route: "miPlan" }, { id: 9, name: "Usuarios", route: "lstHouse" }] },
];

const access = (over: Record<string, unknown> = {}) => ({
  has_plan: true,
  plan_status: "active",
  package_name: "START",
  locked_module_ids: [2],
  user_limit: 3,
  user_count: 3,
  can_add_users: false,
  ...over,
});

describe("subscriptions store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    unexpected = [];
    localStorage.clear();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.mocked(Swal.isVisible).mockReturnValue(false);
    vi.mocked(router.push).mockResolvedValue(undefined);
  });

  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  describe("session reset", () => {
    test("returns every session value to its empty value", async () => {
      const store = useSubscriptionsStore();
      store.packages = [startPackage()] as never;
      store.publicPackages = [proPackage()] as never;
      store.packageModules = [{ id: 1, name: "X" }];
      store.openPackageDraft(startPackage() as never);
      store.paddleSyncReport = [{ package_id: 1, name: "X", is_active: true, actions: [] }];
      store.registrationTrialDays = "14";
      store.plan = livePlan() as never;
      store.registrationTrial = { ends_at: "2026-11-01" };
      store.access = access() as never;
      store.billingHistory = { transactions: [{ id: "t" }], payment_method: {}, can_update_payment_method: true } as never;

      await store.resetSession();

      expect(store.packages).toEqual([]);
      expect(store.publicPackages).toEqual([]);
      expect(store.packageModules).toEqual([]);
      expect(store.packageDraft).toEqual({
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
      expect(store.paddleSyncReport).toEqual([]);
      expect(store.registrationTrialDays).toBe("");
      expect(store.plan).toBeNull();
      expect(store.registrationTrial).toBeNull();
      expect(store.access).toBeNull();
      expect(store.billingHistory).toEqual({ transactions: [], payment_method: null, can_update_payment_method: false });
    });

    test("does not share arrays between resets", async () => {
      const store = useSubscriptionsStore();
      await store.resetSession();
      store.packages.push(startPackage() as never);
      store.billingHistory.transactions.push({ id: "t" } as never);
      await store.resetSession();
      expect(store.packages).toEqual([]);
      expect(store.billingHistory.transactions).toEqual([]);
    });

    test("forgets a pending plan access request", async () => {
      respond({ "get branch_subscription/access": accepted([access()]) });
      const store = useSubscriptionsStore();
      await store.loadPlanAccess();
      await store.resetSession();
      await store.loadPlanAccess();
      expect(sent()).toHaveLength(2);
      expect(store.access).toEqual(access());
    });
  });

  describe("package admin", () => {
    test("loads packages and answers no error", async () => {
      respond({ "get subscription_packages": accepted([startPackage()]) });
      const store = useSubscriptionsStore();
      expect(await store.loadPackages()).toBeNull();
      expect(store.packages).toEqual([startPackage()]);
    });

    test("an empty package list is not an error", async () => {
      respond({ "get subscription_packages": empty() });
      const store = useSubscriptionsStore();
      store.packages = [startPackage()] as never;
      expect(await store.loadPackages()).toBeNull();
      expect(store.packages).toEqual([]);
    });

    test("a failed package load keeps the list and answers the message", async () => {
      respond({ "get subscription_packages": failed("Sin conexión") });
      const store = useSubscriptionsStore();
      store.packages = [startPackage()] as never;
      expect(await store.loadPackages()).toBe("Sin conexión");
      expect(store.packages).toEqual([startPackage()]);
    });

    test("loads the public packages", async () => {
      respond({ "get public/subscription_packages": accepted([proPackage()]) });
      const store = useSubscriptionsStore();
      expect(await store.loadPublicPackages()).toBeNull();
      expect(store.publicPackages).toEqual([proPackage()]);
    });

    test("loads package modules and empties them on any rejection", async () => {
      respond({ "get subscription_package_modules": accepted([{ id: 10, name: "PRICING" }]) });
      const store = useSubscriptionsStore();
      await store.loadPackageModules();
      expect(store.packageModules).toEqual([{ id: 10, name: "PRICING" }]);
      respond({ "get subscription_package_modules": empty() });
      await store.loadPackageModules();
      expect(store.packageModules).toEqual([]);
    });

    test("activates a package and toasts the backend message", async () => {
      respond({ "patch subscription_packages/1/status": accepted([], "Paquete activado") });
      const store = useSubscriptionsStore();
      store.packages = [startPackage({ is_active: false }), proPackage()] as never;
      expect(await store.setPackageActive({ id: 1, isActive: true })).toBe(true);
      expect(sent()[0]!.data).toEqual({ is_active: true });
      expect(store.packages[0]!.is_active).toBe(true);
      expect(Swal.fire).toHaveBeenCalledWith(toast("Paquete activado"));
    });

    test("a rejected activation shows the error and changes nothing", async () => {
      respond({ "patch subscription_packages/1/status": failed("No permitido", "TMSGADV") });
      const store = useSubscriptionsStore();
      store.packages = [startPackage()] as never;
      expect(await store.setPackageActive({ id: 1, isActive: false })).toBe(false);
      expect(store.packages[0]!.is_active).toBe(true);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No permitido" });
    });

    test("opens an empty draft for a new package", () => {
      const store = useSubscriptionsStore();
      store.packageDraft.name = "x";
      store.openPackageDraft(null);
      expect(store.packageDraft.name).toBe("");
      expect(store.packageDraft.id).toBeNull();
    });

    test("opens a draft from a package", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(startPackage({ tagline: null, trial_interval: null, trial_frequency: null }) as never);
      const { features, ...draft } = store.packageDraft;
      expect(draft).toEqual({
        id: 1,
        name: "START",
        tagline: "",
        monthlyPrice: "29",
        annualPrice: "290",
        userLimit: 1,
        moduleIds: [10, 11],
        selectionLimit: 1,
        isFeatured: false,
        trialEnabled: true,
        trialInterval: "day",
        trialFrequency: 15,
      });
      expect(features).toEqual([
        { key: expect.any(Number), description: "Reporte de vendedores", moduleId: 10, isIncluded: true, isHighlighted: false },
        { key: expect.any(Number), description: "Soporte básico", moduleId: null, isIncluded: true, isHighlighted: true },
        { key: expect.any(Number), description: "Soporte premium", moduleId: null, isIncluded: false, isHighlighted: false },
      ]);
      expect(new Set(features.map((feature) => feature.key)).size).toBe(3);
    });

    test("creates a new package with the trimmed payload", async () => {
      respond({ "post subscription_packages": accepted([], "Paquete creado") });
      const store = useSubscriptionsStore();
      store.openPackageDraft(null);
      Object.assign(store.packageDraft, {
        name: "  NUEVO ",
        tagline: "   ",
        monthlyPrice: "10",
        annualPrice: "100.5",
        userLimit: "2",
        moduleIds: [10, 11],
        selectionLimit: 1,
        trialEnabled: true,
        trialInterval: "month",
        trialFrequency: "13",
      });
      store.addDraftFeature({ description: "Soporte", moduleId: null });
      store.addDraftFeature({ description: "Módulo", moduleId: 10 });
      const [general, moduleFeature] = store.packageDraft.features;
      store.updateDraftFeature({ key: general!.key, changes: { description: " Soporte ", isHighlighted: true } });
      store.updateDraftFeature({ key: moduleFeature!.key, changes: { isIncluded: false, isHighlighted: true } });

      const response = await store.savePackageDraft();

      expect(response).toEqual(accepted([], "Paquete creado"));
      expect(sent()[0]!.data).toEqual({
        name: "NUEVO",
        tagline: null,
        monthly_price: 10,
        annual_price: 100.5,
        user_limit: 2,
        module_selection_limit: 1,
        is_featured: false,
        trial_enabled: true,
        trial_interval: "month",
        trial_frequency: null,
        modules: [10, 11],
        features: [
          { description: "Soporte", module_id: null, is_included: true, is_highlighted: true },
          { description: "Módulo", module_id: 10, is_included: true, is_highlighted: false },
        ],
      });
      expect(Swal.fire).toHaveBeenCalledWith(toast("Paquete creado"));
    });

    test("updates an existing package and does not toast a rejection", async () => {
      respond({ "put subscription_packages/1": failed("Nombre repetido") });
      const store = useSubscriptionsStore();
      store.openPackageDraft(startPackage() as never);
      const response = await store.savePackageDraft();
      expect(response.mensaje).toBe("Nombre repetido");
      expect((sent()[0]!.data as { trial_frequency: number }).trial_frequency).toBe(15);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    test("toggles draft modules and frees the features of a removed module", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(startPackage() as never);
      store.toggleDraftModule(12);
      expect(store.packageDraft.moduleIds).toEqual([10, 11, 12]);
      store.packageDraft.selectionLimit = 2;
      store.toggleDraftModule(10);
      expect(store.packageDraft.moduleIds).toEqual([11, 12]);
      expect(store.packageDraft.selectionLimit).toBe(1);
      expect(store.packageDraft.features[0]!.moduleId).toBeNull();
      store.toggleDraftModule(11);
      expect(store.packageDraft.selectionLimit).toBeNull();
    });

    test("removes a draft feature by key", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(startPackage() as never);
      const [first, second, third] = store.packageDraft.features.map((feature) => feature.key);
      store.removeDraftFeature(first!);
      expect(store.packageDraft.features.map((feature) => feature.key)).toEqual([second, third]);
    });

    test("validates the draft", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(null);
      expect(store.packageDraftErrors).toEqual({
        name: "Escribe el nombre del paquete.",
        monthlyPrice: "Escribe el precio mensual, de 0 en adelante.",
        annualPrice: "Escribe el precio anual, de 0 en adelante.",
        moduleIds: "Elige al menos un módulo para el paquete.",
      });

      Object.assign(store.packageDraft, {
        name: "x".repeat(61),
        tagline: "y".repeat(121),
        monthlyPrice: "-1",
        annualPrice: "0",
        userLimit: 0,
        moduleIds: [10, 11],
        selectionLimit: 2,
        trialEnabled: true,
        trialInterval: "month",
        trialFrequency: 13,
      });
      store.addDraftFeature({ description: " ", moduleId: null });
      expect(store.packageDraftErrors).toEqual({
        name: "Usa un nombre de hasta 60 caracteres.",
        tagline: "Usa una descripción corta de hasta 120 caracteres.",
        monthlyPrice: "Escribe el precio mensual, de 0 en adelante.",
        userLimit: "El paquete debe incluir al menos 1 usuario.",
        trialFrequency: "La prueba puede durar de 1 a 12 meses.",
        features: "Escribe el texto de cada característica o quítala.",
        selectionLimit: "Los módulos a elegir deben ser menos que los módulos del paquete.",
      });
    });

    test("limits highlighted features to two", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(null);
      ["a", "b", "c"].forEach((description) => store.addDraftFeature({ description, moduleId: null }));
      const [a, b, c] = store.packageDraft.features;
      store.updateDraftFeature({ key: a!.key, changes: { isHighlighted: true } });
      expect(store.canHighlightFeature(c!)).toBe(true);
      store.updateDraftFeature({ key: b!.key, changes: { isHighlighted: true } });
      expect(store.canHighlightFeature(c!)).toBe(false);
      expect(store.canHighlightFeature(a!)).toBe(true);
      store.updateDraftFeature({ key: c!.key, changes: { isHighlighted: true } });
      expect(store.packageDraftErrors.features).toBe("Destaca como máximo 2 características.");
      store.addDraftFeature({ description: "x".repeat(161), moduleId: null });
      expect(store.packageDraftErrors.features).toBe("Cada característica admite hasta 160 caracteres.");
    });

    test("previews the draft as a plan card", () => {
      const store = useSubscriptionsStore();
      store.packageModules = [
        { id: 10, name: "PRICING" },
        { id: 11, name: "OPERATIVO" },
      ];
      store.openPackageDraft(null);
      Object.assign(store.packageDraft, { monthlyPrice: "", annualPrice: "12.5", userLimit: "", moduleIds: [11] });
      store.addDraftFeature({ description: "Extra", moduleId: null });
      store.addDraftFeature({ description: "  ", moduleId: null });
      expect(store.packageDraftPreview).toEqual({
        id: null,
        name: "NUEVO",
        tagline: null,
        monthlyPrice: "US$0",
        annualPrice: "US$12.50",
        savings: null,
        users: "1 usuario",
        trial: null,
        highlights: ["1 módulo incluido"],
        includes: [{ text: "Todos los módulos incluidos" }, { text: "OPERATIVO" }, { text: "Extra" }],
        excludes: [],
        featured: false,
        isActive: true,
      });
    });

    test("hints the annual savings of the draft", () => {
      const store = useSubscriptionsStore();
      store.openPackageDraft(null);
      expect(store.packageDraftSavings).toBeNull();
      Object.assign(store.packageDraft, { monthlyPrice: "10", annualPrice: "100" });
      expect(store.packageDraftSavings).toEqual({ positive: true, text: "El cliente ahorra US$20 al año (2 meses)." });
      store.packageDraft.annualPrice = "120";
      expect(store.packageDraftSavings).toEqual({
        positive: false,
        text: "Sin ahorro anual: el precio anual es igual o mayor a 12 mensualidades.",
      });
    });

    test("counts and filters packages by status", () => {
      const store = useSubscriptionsStore();
      store.packages = [startPackage(), proPackage({ is_active: false })] as never;
      expect(store.activePackageCount).toBe(1);
      expect(store.packagesWithStatus("active").map((pkg) => pkg.id)).toEqual([1]);
      expect(store.packagesWithStatus("inactive").map((pkg) => pkg.id)).toEqual([2]);
      expect(store.packagesWithStatus("all")).toHaveLength(2);
    });

    test("exposes the form limits and trial units", () => {
      const store = useSubscriptionsStore();
      expect(store.limits).toEqual({ name: 60, tagline: 120, feature: 160, highlights: 2 });
      expect(store.trialUnits).toEqual([
        { value: "day", label: "Días", max: 365 },
        { value: "month", label: "Meses", max: 12 },
      ]);
    });
  });

  describe("paddle sync and registration trial", () => {
    test("loads the sync report unless the request fails", async () => {
      const report = [{ package_id: 1, name: "START", is_active: true, actions: [{ label: "Crear" }] }];
      respond({ "get subscription_packages/paddle_sync": accepted(report) });
      const store = useSubscriptionsStore();
      expect(await store.loadPaddleSync()).toEqual(accepted(report));
      expect(store.paddleSyncReport).toEqual(report);
      respond({ "get subscription_packages/paddle_sync": failed() });
      await store.loadPaddleSync();
      expect(store.paddleSyncReport).toEqual(report);
    });

    test("applies the sync and keeps the old report when nothing comes back", async () => {
      const report = [{ package_id: 1, name: "START", is_active: true, actions: [] }];
      respond({ "post subscription_packages/paddle_sync": accepted(report, "Listo") });
      const store = useSubscriptionsStore();
      await store.applyPaddleSync();
      expect(store.paddleSyncReport).toEqual(report);
      expect(Swal.fire).toHaveBeenCalledWith(toast("Listo"));

      vi.mocked(Swal.fire).mockClear();
      respond({ "post subscription_packages/paddle_sync": failed("Paddle caído") });
      expect((await store.applyPaddleSync()).mensaje).toBe("Paddle caído");
      expect(store.paddleSyncReport).toEqual(report);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    test("loads the registration trial days or answers the message", async () => {
      respond({ "get registration_trial_setting": accepted([{ trial_days: 30 }]) });
      const store = useSubscriptionsStore();
      expect(await store.loadRegistrationTrialSetting()).toBeNull();
      expect(store.registrationTrialDays).toBe(30);
      respond({ "get registration_trial_setting": empty() });
      expect(await store.loadRegistrationTrialSetting()).toBe("No se encontraron registros");
      expect(store.registrationTrialDays).toBe(30);
    });

    test("saves the registration trial days as a number", async () => {
      respond({ "put registration_trial_setting": accepted([{ trial_days: 20 }], "Guardado") });
      const store = useSubscriptionsStore();
      store.registrationTrialDays = "20";
      expect(await store.saveRegistrationTrialSetting()).toBe(true);
      expect(sent()[0]!.data).toEqual({ trial_days: 20 });
      expect(store.registrationTrialDays).toBe(20);
      expect(Swal.fire).toHaveBeenCalledWith(toast("Guardado"));
    });

    test("a rejected trial save shows a warning for an advice message", async () => {
      respond({ "put registration_trial_setting": failed("Revisa los días", "TMSGADV") });
      const store = useSubscriptionsStore();
      expect(await store.saveRegistrationTrialSetting()).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "Revisa los días" });
    });

    test("validates the registration trial days", () => {
      const store = useSubscriptionsStore();
      const error = "Escribe entre 1 y 365 días.";
      store.registrationTrialDays = "";
      expect(store.registrationTrialDaysError).toBe(error);
      store.registrationTrialDays = "1.5";
      expect(store.registrationTrialDaysError).toBe(error);
      store.registrationTrialDays = "366";
      expect(store.registrationTrialDaysError).toBe(error);
      store.registrationTrialDays = "365";
      expect(store.registrationTrialDaysError).toBeNull();
    });
  });

  describe("company plan", () => {
    test("loads the company plan as its first row", async () => {
      respond({ "get branch_subscription": accepted([livePlan()]) });
      const store = useSubscriptionsStore();
      expect(await store.loadCompanyPlan()).toBeNull();
      expect(store.plan).toEqual(livePlan());
      respond({ "get branch_subscription": empty() });
      expect(await store.loadCompanyPlan()).toBeNull();
      expect(store.plan).toBeNull();
    });

    test("loads the plan badge data together", async () => {
      respond({
        "get branch_subscription": failed(),
        "get branch_subscription/registration_trial": accepted([{ ends_at: "2026-11-01" }]),
      });
      const store = useSubscriptionsStore();
      store.plan = livePlan() as never;
      expect(await store.loadPlanBadge()).toBe(false);
      expect(store.plan).toEqual(livePlan());
      expect(store.registrationTrial).toEqual({ ends_at: "2026-11-01" });
    });

    test("describes the plan status and dates", () => {
      const store = useSubscriptionsStore();
      expect(store.planStatus).toEqual({ label: "Cancelado", tone: "muted" });
      expect(store.planDateLine).toBe("");
      store.plan = livePlan() as never;
      expect(store.planStatus).toEqual({ label: "Activo", tone: "ok" });
      expect(store.planDateLine).toBe("Próxima renovación: 5 de noviembre de 2026.");
      store.plan = livePlan({ scheduled_change_action: "cancel", scheduled_change_at: "2026-12-01T00:00:00Z" }) as never;
      expect(store.planStatus).toEqual({ label: "Cancelación programada", tone: "warning" });
      expect(store.planDateLine).toBe("Tu plan termina el 1 de diciembre de 2026. No se harán más cobros.");
      store.plan = livePlan({ status: "trialing" }) as never;
      expect(store.planDateLine).toBe("Tu prueba termina el 5 de noviembre de 2026; ese día se hará el primer cobro.");
      store.plan = livePlan({ status: "past_due" }) as never;
      expect(store.planDateLine).toBe("No pudimos cobrar tu último pago.");
      expect(store.paymentUpdateNeeded).toBe(true);
      store.plan = livePlan({ status: "paused" }) as never;
      expect(store.planDateLine).toBe("Tu plan está pausado; no se harán cobros mientras siga así.");
      store.plan = livePlan({ status: "canceled", canceled_at: "2026-10-02T00:00:00Z" }) as never;
      expect(store.planDateLine).toBe("Cancelado el 2 de octubre de 2026.");
      expect(store.hasLivePlan).toBe(false);
      expect(store.livePlan).toBeNull();
      store.plan = livePlan({ status: "weird" }) as never;
      expect(store.planStatus).toEqual({ label: "weird", tone: "muted" });
    });

    test("lists the plan details", () => {
      const store = useSubscriptionsStore();
      expect(store.planDetails).toEqual({ users: null, modules: [], extras: [] });
      store.plan = livePlan() as never;
      expect(store.planDetails).toEqual({
        users: "2 de 3",
        modules: [{ id: 10, name: "PRICING", details: ["Reporte de vendedores"] }],
        extras: ["Soporte"],
      });
    });

    test("picks the card action against the current plan", () => {
      const store = useSubscriptionsStore();
      store.publicPackages = [startPackage(), proPackage()] as never;
      expect(store.cardAction(startPackage() as never, "monthly")).toBe("change");
      expect(store.purchaseAction(startPackage() as never, "monthly")).toBe("buy");

      store.plan = livePlan() as never;
      expect(store.currentPackage).toEqual(startPackage());
      expect(store.cardAction(startPackage() as never, "monthly")).toBe("change-module");
      expect(store.cardAction(startPackage({ module_selection_limit: null }) as never, "monthly")).toBe("current");
      expect(store.cardAction(startPackage() as never, "annual")).toBe("change");
      expect(store.cardAction(proPackage() as never, "monthly")).toBe("change");
      expect(store.hasUpgrade).toBe(true);

      store.plan = livePlan({ package_id: 2, billing: "annual" }) as never;
      expect(store.cardAction(startPackage() as never, "monthly")).toBe("lower");
      expect(store.cardAction(proPackage() as never, "monthly")).toBe("annual-only");
      expect(store.cardAction(proPackage() as never, "annual")).toBe("current");
      expect(store.hasUpgrade).toBe(false);
      expect(store.isUnavailableAction("annual-only")).toBe(true);
      expect(store.isUnavailableAction("change")).toBe(false);

      store.plan = livePlan({ package_id: 99, package_monthly_price: "50" }) as never;
      expect(store.cardAction(startPackage() as never, "monthly")).toBe("lower");

      store.plan = livePlan({ status: "past_due" }) as never;
      expect(store.canChangePlan).toBe(false);
      expect(store.purchaseAction(proPackage() as never, "monthly")).toBe("manage");
    });

    test("summarizes a plan change preview", () => {
      const store = useSubscriptionsStore();
      const preview = {
        action: "charge",
        amount: 12.5,
        recurring_amount: 79,
        billing: "monthly",
        next_billed_at: "2026-11-05T00:00:00Z",
        removes_cancel: true,
      };
      expect(store.changeSummary(preview as never)).toBe(
        "Hoy se cobrarán US$12.50 a tu método de pago. Después pagarás US$79 al mes desde el 5 de noviembre de 2026. Tu cancelación programada se quitará.",
      );
      expect(store.changeSummary({ ...preview, action: "none", billing: "annual", removes_cancel: false } as never)).toBe(
        "No se te cobrará nada hoy. Pagarás US$79 al año desde el 5 de noviembre de 2026.",
      );
    });

    test("builds the trial notice", () => {
      const store = useSubscriptionsStore();
      const now = Date.parse("2026-10-20T00:00:00Z");
      expect(store.trialNotice({ branchId: 1, now })).toBeNull();
      expect(store.trialNotice({ branchId: 5, now })).toEqual({ days: null, ended: false, canBuy: true, paidText: null });
      store.registrationTrial = { ends_at: "2026-10-22T12:00:00Z" };
      expect(store.trialNotice({ branchId: 5, now })).toEqual({ days: 3, ended: false, canBuy: true, paidText: null });
      store.registrationTrial = { ends_at: "2026-10-19T00:00:00Z" };
      expect(store.trialNotice({ branchId: 1, now })).toEqual({ days: null, ended: true, canBuy: false, paidText: null });
      store.plan = livePlan({ status: "trialing", current_period_ends_at: "2026-10-21T00:00:00Z" }) as never;
      expect(store.trialNotice({ branchId: 5, now })!.days).toBe(1);
      store.plan = livePlan() as never;
      expect(store.trialNotice({ branchId: 5, now })).toEqual({ days: null, ended: false, canBuy: false, paidText: "ACO START activo" });
      store.plan = livePlan({ status: "paused" }) as never;
      expect(store.trialNotice({ branchId: 5, now })).toBeNull();
    });

    test("formats prices and dates", () => {
      const store = useSubscriptionsStore();
      expect(store.formatPrice("1234")).toBe("US$1,234");
      expect(store.formatPrice(12.5)).toBe("US$12.50");
      expect(store.formatDate("2026-01-31T23:00:00Z")).toBe("31 de enero de 2026");
      expect(store.formatDate(null)).toBe("");
    });

    test("builds the public plan views", () => {
      const store = useSubscriptionsStore();
      store.publicPackages = [startPackage(), proPackage()] as never;
      expect(store.moduleLine).toBe("PRICING · OPERATIVO");
      expect(store.maxMonthsSaved).toBe(2);
      expect(store.toPlanView(startPackage() as never)).toEqual(store.planViews[0]);
      expect(store.planViews[0]).toEqual({
        id: 1,
        name: "START",
        tagline: "Para empezar",
        monthlyPrice: "US$29",
        annualPrice: "US$290",
        savings: "US$58",
        users: "1 usuario",
        trial: "15 días gratis",
        highlights: ["1 módulo a elegir", "Soporte básico"],
        includes: [
          { text: "1 módulo a elegir" },
          { text: "Puedes elegir: PRICING o OPERATIVO" },
          { text: "Si eliges PRICING:", conditional: true, details: ["Reporte de vendedores"] },
          { text: "Si eliges OPERATIVO:", conditional: true },
          { text: "Soporte básico" },
        ],
        excludes: ["Soporte premium"],
        featured: false,
        isActive: true,
      });
      expect(store.planViews[1]!.users).toBe("3 usuarios");
      expect(store.planViews[1]!.highlights).toEqual(["2 módulos incluidos"]);
    });
  });

  describe("plan access", () => {
    beforeEach(async () => {
      await useSubscriptionsStore().resetSession();
    });

    test("shares one access request between callers", async () => {
      let answer!: (body: unknown) => void;
      httpMock.mockImplementation(() => new Promise((resolve) => (answer = (body) => resolve({ data: body }))));
      const store = useSubscriptionsStore();
      const first = store.loadPlanAccess();
      const second = store.loadPlanAccess();
      answer(accepted([access()]));
      expect(await first).toEqual(access());
      expect(await second).toEqual(access());
      await store.loadPlanAccess();
      expect(httpMock).toHaveBeenCalledTimes(1);
      expect(sent()[0]).toEqual({ method: "get", url: "branch_subscription/access" });
    });

    test("asks again after an empty access answer", async () => {
      respond({ "get branch_subscription/access": empty() });
      const store = useSubscriptionsStore();
      expect(await store.loadPlanAccess()).toBeNull();
      await store.loadPlanAccess();
      expect(httpMock).toHaveBeenCalledTimes(2);
      expect(store.access).toBeNull();
    });

    test("reloads access and ignores the answer of the replaced request", async () => {
      const answers: ((body: unknown) => void)[] = [];
      httpMock.mockImplementation(() => new Promise((resolve) => answers.push((body) => resolve({ data: body }))));
      const store = useSubscriptionsStore();
      const stale = store.loadPlanAccess();
      const fresh = store.reloadPlanAccess();
      answers[1]!(accepted([access({ package_name: "PRO" })]));
      await fresh;
      answers[0]!(accepted([access({ package_name: "OLD" })]));
      expect(await stale).toEqual(access({ package_name: "OLD" }));
      expect(store.access).toEqual(access({ package_name: "PRO" }));
    });

    test("finds the modules of a route and locks them by plan access", () => {
      const store = useSubscriptionsStore();
      expect(store.modulesForRoute(menu as never, "lstHouse")).toEqual([
        { id: 2, name: "OPERATIVO" },
        { id: 3, name: "CONFIGURACIÓN" },
      ]);
      expect(store.modulesForRoute(menu as never, undefined)).toEqual([]);
      expect(store.modulesForRoute(null as never, "lstQuote")).toEqual([]);

      expect(store.lockedModuleForRoute(menu as never, "lstQuote")).toBeNull();
      store.access = access({ locked_module_ids: [1] }) as never;
      expect(store.lockedModuleForRoute(menu as never, "lstQuote")).toEqual({ id: 1, name: "PRICING" });
      store.access = access({ locked_module_ids: [2] }) as never;
      expect(store.lockedModuleForRoute(menu as never, "lstHouse")).toBeNull();
      store.access = access({ locked_module_ids: [2, 3] }) as never;
      expect(store.lockedModuleForRoute(menu as never, "lstHouse")).toEqual({ id: 2, name: "OPERATIVO" });
      store.access = access({ has_plan: false, locked_module_ids: [1] }) as never;
      expect(store.lockedModuleForRoute(menu as never, "lstQuote")).toBeNull();
      expect(store.lockedModuleForRoute(menu as never, "Nowhere")).toBeNull();
    });

    test("words the locked module and user limit notices", () => {
      const store = useSubscriptionsStore();
      store.access = access() as never;
      expect(store.lockedModuleNotice("PRICING")).toEqual({
        title: "PRICING no está en tu plan",
        text: "Tu plan ACO START no incluye PRICING. Mejora tu plan para usarlo.",
      });
      expect(store.userLimitNotice).toEqual({
        title: "Llegaste al límite de usuarios",
        text: "Tu plan ACO START permite 3 usuarios y tu empresa ya tiene 3. Mejora tu plan para agregar más.",
      });
      store.access = access({ plan_status: "canceled" }) as never;
      expect(store.lockedModuleNotice("PRICING")).toEqual({
        title: "PRICING no está disponible",
        text: "Tu plan ACO START está cancelado. Elige un plan para volver a usar PRICING.",
      });
      store.access = access({ plan_status: "paused" }) as never;
      expect(store.userLimitNotice).toEqual({
        title: "No puedes agregar usuarios",
        text: "Tu plan ACO START está pausado. Revisa Mi plan para reactivarlo.",
      });
    });

    test("lets users be added without a plan", () => {
      const store = useSubscriptionsStore();
      expect(store.canAddUsers).toBe(true);
      store.access = access() as never;
      expect(store.canAddUsers).toBe(false);
      store.access = access({ has_plan: false }) as never;
      expect(store.canAddUsers).toBe(true);
    });

    test("prompts the upgrade and goes to Mi plan on confirm", async () => {
      const store = useSubscriptionsStore();
      await store.promptPlanUpgrade({ title: "T", text: "X" });
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: "info",
        title: "T",
        text: "X",
        showCancelButton: true,
        confirmButtonText: "Ir a gestionar mi plan",
        cancelButtonText: "Ahora no",
        reverseButtons: true,
      });
      expect(router.push).toHaveBeenCalledWith({ name: "miPlan" });
    });

    test("does not prompt over another dialog nor navigate on cancel", async () => {
      const store = useSubscriptionsStore();
      vi.mocked(Swal.isVisible).mockReturnValue(true);
      await store.promptPlanUpgrade({ title: "T", text: "X" });
      expect(Swal.fire).not.toHaveBeenCalled();
      vi.mocked(Swal.isVisible).mockReturnValue(false);
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
      await store.promptPlanUpgrade({ title: "T", text: "X" });
      expect(router.push).not.toHaveBeenCalled();
    });

    test("swallows a rejected navigation to Mi plan", async () => {
      vi.mocked(router.push).mockRejectedValue(new Error("aborted"));
      await expect(useSubscriptionsStore().promptPlanUpgrade({ title: "T", text: "X" })).resolves.toBeUndefined();
    });
  });

  describe("pending plan choice", () => {
    test("saves, reads and clears the pending choice", async () => {
      const store = useSubscriptionsStore();
      await store.savePlanChoice({ packageId: 2, billing: "annual" });
      expect(localStorage.getItem("pendingPlan")).toBe('{"packageId":2,"billing":"annual"}');
      expect(await store.readPlanChoice({})).toEqual({ packageId: 2, billing: "annual" });
      expect(await store.readPlanChoice({ paquete: "3", ciclo: "anual" })).toEqual({ packageId: 3, billing: "annual" });
      expect(await store.readPlanChoice({ paquete: "3", ciclo: "x" })).toEqual({ packageId: 3, billing: "monthly" });
      await store.clearPlanChoice();
      expect(localStorage.getItem("pendingPlan")).toBeNull();
      expect(await store.readPlanChoice({})).toBeNull();
    });

    test("ignores a corrupt or empty stored choice", async () => {
      const store = useSubscriptionsStore();
      localStorage.setItem("pendingPlan", "{bad");
      expect(await store.readPlanChoice({})).toBeNull();
      localStorage.setItem("pendingPlan", '{"billing":"annual"}');
      expect(await store.readPlanChoice({})).toBeNull();
    });
  });

  describe("checkout and plan changes", () => {
    const payload = { package_id: 2, billing: "monthly", module_ids: [] };

    test("opens the Paddle checkout for the backend transaction", async () => {
      respond({ "post branch_subscription/checkout": accepted([{ transaction_id: "txn_1" }]) });
      vi.mocked(openPaddleCheckout).mockResolvedValue(null);
      const onEvent = vi.fn();
      const store = useSubscriptionsStore();
      expect(await store.openPlanCheckout({ payload: payload as never, onEvent })).toBe(true);
      expect(sent()[0]!.data).toEqual(payload);
      expect(openPaddleCheckout).toHaveBeenCalledWith("txn_1", onEvent);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    test("shows the backend message when no transaction comes back", async () => {
      respond({ "post branch_subscription/checkout": failed("Sin precio") });
      const store = useSubscriptionsStore();
      expect(await store.openPlanCheckout({ payload: payload as never, onEvent: vi.fn() })).toBe(false);
      expect(openPaddleCheckout).not.toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin precio" });
    });

    test("shows the Paddle error when the overlay cannot open", async () => {
      respond({ "post branch_subscription/checkout": accepted([{ transaction_id: "txn_1" }]) });
      vi.mocked(openPaddleCheckout).mockResolvedValue("El pago no está disponible");
      const store = useSubscriptionsStore();
      expect(await store.openPlanCheckout({ payload: payload as never, onEvent: vi.fn() })).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "El pago no está disponible" });
    });

    test("confirms a plan change after the preview", async () => {
      const preview = { action: "none", amount: 0, recurring_amount: 79, billing: "monthly", next_billed_at: "2026-11-05T00:00:00Z", removes_cancel: false };
      respond({
        "post branch_subscription/change/preview": accepted([preview]),
        "post branch_subscription/change": accepted([livePlan({ package_id: 2 })], "Plan cambiado"),
      });
      const store = useSubscriptionsStore();
      expect(await store.confirmPlanChange({ packageName: "PRO", payload: payload as never })).toBe(true);
      expect(sent().map((config) => config.data)).toEqual([payload, payload]);
      expect(Swal.fire).toHaveBeenNthCalledWith(1, {
        icon: "question",
        title: "¿Cambiar a ACO PRO?",
        text: "No se te cobrará nada hoy. Pagarás US$79 al mes desde el 5 de noviembre de 2026.",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar plan",
        cancelButtonText: "Volver",
        reverseButtons: true,
      });
      expect(Swal.fire).toHaveBeenNthCalledWith(2, toast("Plan cambiado"));
      expect(store.plan).toEqual(livePlan({ package_id: 2 }));
    });

    test("stops a plan change on a rejected preview, a cancel or a rejected change", async () => {
      const store = useSubscriptionsStore();
      respond({ "post branch_subscription/change/preview": failed("Sin cambios") });
      expect(await store.confirmPlanChange({ packageName: "PRO", payload: payload as never })).toBe(false);
      expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Sin cambios" });

      const preview = { action: "none", amount: 0, recurring_amount: 79, billing: "monthly", next_billed_at: null, removes_cancel: false };
      respond({ "post branch_subscription/change/preview": accepted([preview]) });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
      expect(await store.confirmPlanChange({ packageName: "PRO", payload: payload as never })).toBe(false);

      respond({
        "post branch_subscription/change/preview": accepted([preview]),
        "post branch_subscription/change": failed("Paddle rechazó"),
      });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
      expect(await store.confirmPlanChange({ packageName: "PRO", payload: payload as never })).toBe(false);
      expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Paddle rechazó" });
      expect(store.plan).toBeNull();
    });

    test("keeps the company plan", async () => {
      respond({ "post branch_subscription/resume": accepted([livePlan()], "Plan mantenido") });
      const store = useSubscriptionsStore();
      await store.keepCompanyPlan();
      expect(store.plan).toEqual(livePlan());
      expect(Swal.fire).toHaveBeenCalledWith(toast("Plan mantenido"));
      respond({ "post branch_subscription/resume": failed("No hay cancelación") });
      await store.keepCompanyPlan();
      expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "No hay cancelación" });
    });

    test("cancels the company plan", async () => {
      respond({ "post branch_subscription/cancel": accepted([], "Cancelado") });
      const store = useSubscriptionsStore();
      expect(await store.cancelCompanyPlan()).toBe(true);
      expect(Swal.fire).toHaveBeenCalledWith(toast("Cancelado"));
      respond({ "post branch_subscription/cancel": failed("Nada que cancelar") });
      expect(await store.cancelCompanyPlan()).toBe(false);
      expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Nada que cancelar" });
    });

    test("confirms a paid transaction once the plan is live", async () => {
      respond({ "post branch_subscription/confirm": accepted([livePlan({ package_name: "PRO" })]) });
      const store = useSubscriptionsStore();
      expect(await store.confirmCompanyPlan("txn_9")).toBe(true);
      expect(sent()[0]!.data).toEqual({ transaction_id: "txn_9" });
      expect(store.plan).toEqual(livePlan({ package_name: "PRO" }));
      expect(Swal.fire).toHaveBeenCalledWith(toast("Tu plan ACO PRO ya está activo."));
    });

    test("checks the current plan without a transaction and waits while it is not live", async () => {
      respond({ "get branch_subscription": accepted([livePlan({ status: "canceled" })]) });
      const store = useSubscriptionsStore();
      expect(await store.confirmCompanyPlan(null)).toBe(false);
      expect(store.plan).toBeNull();
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe("billing history", () => {
    const entry = (over: Record<string, unknown> = {}) => ({
      id: "txn_1",
      billed_at: "2026-10-05T00:00:00Z",
      origin: "subscription_recurring",
      product_name: "ACO PRO",
      billing: "monthly",
      status: "completed",
      currency_code: "USD",
      total: "7900",
      adjusted_total: "7900",
      has_invoice: true,
      ...over,
    });

    test("loads the history or falls back to no history", async () => {
      const history = { transactions: [entry()], payment_method: null, can_update_payment_method: true };
      respond({ "get branch_subscription/billing_history": accepted([history]) });
      const store = useSubscriptionsStore();
      expect(await store.loadBillingHistory()).toBeNull();
      expect(store.billingHistory).toEqual(history);
      respond({ "get branch_subscription/billing_history": empty() });
      await store.loadBillingHistory();
      expect(store.billingHistory).toEqual({ transactions: [], payment_method: null, can_update_payment_method: false });
      respond({ "get branch_subscription/billing_history": failed("Paddle caído") });
      expect(await store.loadBillingHistory()).toBe("Paddle caído");
    });

    test("turns billing entries into rows", () => {
      const store = useSubscriptionsStore();
      store.billingHistory.transactions = [
        entry(),
        entry({ id: "txn_2", origin: "subscription_update", billing: null, adjusted_total: "0", has_invoice: false }),
        entry({ id: "txn_3", origin: "web", adjusted_total: "100", currency_code: "EUR", total: "1050" }),
        entry({ id: "txn_4", status: "billed" }),
      ] as never;
      expect(store.billingRows).toEqual([
        { id: "txn_1", date: "5 de octubre de 2026", concept: "Renovación ACO PRO · Mensual", amount: "US$79", statusLabel: "Pagado", statusTone: "ok", hasInvoice: true },
        { id: "txn_2", date: "5 de octubre de 2026", concept: "Cambio a ACO PRO", amount: "US$79", statusLabel: "Reembolsado", statusTone: "muted", hasInvoice: false },
        {
          id: "txn_3",
          date: "5 de octubre de 2026",
          concept: "Compra ACO PRO · Mensual",
          amount: new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format(10.5),
          statusLabel: "Reembolso parcial",
          statusTone: "info",
          hasInvoice: true,
        },
        { id: "txn_4", date: "5 de octubre de 2026", concept: "Renovación ACO PRO · Mensual", amount: "US$79", statusLabel: "Facturado", statusTone: "info", hasInvoice: true },
      ]);
    });

    test("labels the payment card", () => {
      const store = useSubscriptionsStore();
      expect(store.paymentCard).toBeNull();
      store.billingHistory.payment_method = { brand: "visa", last4: "4242", expiry_month: 3, expiry_year: 2030 };
      expect(store.paymentCard).toBe("Visa terminada en 4242 · vence 03/2030");
      store.billingHistory.payment_method = { brand: "elo", last4: "1111", expiry_month: 12, expiry_year: 2031 };
      expect(store.paymentCard).toBe("Tarjeta terminada en 1111 · vence 12/2031");
    });

    test("fetches an invoice link by encoded transaction id", async () => {
      respond({ "get branch_subscription/billing_history/txn%2F1/invoice": accepted([{ url: "https://pdf" }]) });
      const store = useSubscriptionsStore();
      expect(await store.fetchInvoiceUrl("txn/1")).toBe("https://pdf");
      respond({ "get branch_subscription/billing_history/txn_2/invoice": failed("Sin factura", "TMSGINF") });
      expect(await store.fetchInvoiceUrl("txn_2")).toBeNull();
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "Sin factura" });
    });

    test("opens the payment method update checkout", async () => {
      respond({ "post branch_subscription/payment_method": accepted([{ transaction_id: "txn_pm" }]) });
      vi.mocked(openPaddleCheckout).mockResolvedValue(null);
      const onEvent = vi.fn();
      const store = useSubscriptionsStore();
      expect(await store.startPaymentMethodUpdate(onEvent)).toBe(true);
      expect(openPaddleCheckout).toHaveBeenCalledWith("txn_pm", onEvent);

      respond({ "post branch_subscription/payment_method": failed("Sin plan", "TMSGXXX") });
      expect(await store.startPaymentMethodUpdate(onEvent)).toBe(false);
      expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Sin plan" });
    });
  });
});
