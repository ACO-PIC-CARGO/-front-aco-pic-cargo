<template>
  <div class="subscription-admin plans-theme">
    <div class="subscription-admin__container">
      <header class="subscription-admin__header">
        <div>
          <h1 class="subscription-admin__title">
            Paquetes <span class="subscription-admin__accent">ACO</span>
          </h1>
          <p class="subscription-admin__subtitle">
            Define qué incluye cada paquete. Los activos aparecen en la página
            de planes.
          </p>
        </div>
        <button
          type="button"
          class="plans-button plans-button--primary"
          @click="openCreate"
        >
          <i class="mdi mdi-plus" aria-hidden="true"></i> Nuevo paquete
        </button>
      </header>

      <div
        v-if="loadState === 'ready' && packages.length"
        class="subscription-admin__toolbar"
      >
        <SegmentedControl
          v-model="statusFilter"
          :options="filterOptions"
          label="Mostrar paquetes"
        />
        <SegmentedControl
          v-model="isAnnual"
          :options="billingOptions"
          label="Precio mostrado"
        />
      </div>

      <section
        v-if="loadState === 'loading'"
        class="subscription-admin__grid"
        aria-busy="true"
        aria-label="Cargando paquetes"
      >
        <div v-for="n in 3" :key="n" class="card-skeleton"></div>
      </section>

      <div
        v-else-if="loadState === 'error'"
        class="subscription-admin__state"
        role="alert"
      >
        <p class="subscription-admin__state-title">
          No pudimos cargar los paquetes.
        </p>
        <p>{{ errorMessage }}</p>
        <button
          type="button"
          class="plans-button plans-button--secondary"
          @click="loadPackages"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="!packages.length" class="subscription-admin__state">
        <i class="mdi mdi-package-variant subscription-admin__state-icon" aria-hidden="true"></i>
        <p class="subscription-admin__state-title">Aún no hay paquetes.</p>
        <p>
          Crea el primero con sus módulos, precio y características. Aparecerá
          en la página de planes.
        </p>
      </div>

      <div v-else-if="!visiblePackages.length" class="subscription-admin__state">
        <p class="subscription-admin__state-title">{{ emptyFilterMessage }}</p>
      </div>

      <section v-else class="subscription-admin__grid" aria-label="Paquetes">
        <PackageCard
          v-for="(pkg, index) in visiblePackages"
          :key="pkg.id"
          :plan="toPlanView(pkg)"
          :annual="isAnnual"
          :expanded="expandedId === pkg.id"
          :index="index"
          @toggle-details="toggleDetails(pkg)"
        >
          <div class="card-actions">
            <button
              type="button"
              class="plans-button plans-button--secondary"
              :aria-label="`Editar ACO ${pkg.name}`"
              @click="openEdit(pkg)"
            >
              <i class="mdi mdi-pencil-outline" aria-hidden="true"></i> Editar
            </button>
            <button
              type="button"
              class="plans-button plans-button--ghost"
              :aria-label="`${pkg.is_active ? 'Desactivar' : 'Activar'} ACO ${pkg.name}`"
              :disabled="busyId === pkg.id"
              @click="toggleActive(pkg)"
            >
              <i
                class="mdi"
                :class="pkg.is_active ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                aria-hidden="true"
              ></i>
              {{ pkg.is_active ? "Desactivar" : "Activar" }}
            </button>
          </div>
        </PackageCard>
      </section>
    </div>

    <PackageForm
      v-model="isFormOpen"
      :pkg="editingPackage"
      :modules="modules"
      @saved="onSaved"
    />
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import PackageForm from "@/components/SubscriptionPackages/PackageForm.vue";
import SegmentedControl from "@/components/SubscriptionPackages/SegmentedControl.vue";
import { toPlanView } from "@/components/SubscriptionPackages/packageView";
import {
  fetchPackageModules,
  fetchPackages,
  isEmptyResult,
  setPackageActive,
} from "@/api/subscriptionPackages";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];

const notifySuccess = (message) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });

const confirmDeactivation = (pkg) =>
  Swal.fire({
    icon: "question",
    title: `¿Desactivar ACO ${pkg.name}?`,
    text: "Dejará de mostrarse en la página de planes. Puedes activarlo de nuevo cuando quieras.",
    showCancelButton: true,
    confirmButtonText: "Sí, desactivar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c62828",
    reverseButtons: true,
  });

export default {
  name: "SubscriptionPackages",
  components: { PackageCard, PackageForm, SegmentedControl },
  data: () => ({
    packages: [],
    modules: [],
    loadState: "loading",
    errorMessage: "",
    statusFilter: "active",
    isAnnual: true,
    expandedId: null,
    busyId: null,
    isFormOpen: false,
    editingPackage: null,
    billingOptions: BILLING_OPTIONS,
  }),
  computed: {
    activeCount() {
      return this.packages.filter((pkg) => pkg.is_active).length;
    },
    filterOptions() {
      const inactiveCount = this.packages.length - this.activeCount;
      return [
        { value: "active", label: `Activos (${this.activeCount})` },
        { value: "inactive", label: `Inactivos (${inactiveCount})` },
        { value: "all", label: `Todos (${this.packages.length})` },
      ];
    },
    visiblePackages() {
      if (this.statusFilter === "all") return this.packages;
      const wantActive = this.statusFilter === "active";
      return this.packages.filter((pkg) => pkg.is_active === wantActive);
    },
    emptyFilterMessage() {
      return this.statusFilter === "active"
        ? "No hay paquetes activos. La página de planes se verá vacía."
        : "No hay paquetes inactivos.";
    },
  },
  mounted() {
    this.$store.state.mainTitle = "PAQUETES DE SUSCRIPCIÓN";
    this.loadPackages();
    this.loadModules();
  },
  methods: {
    toPlanView,
    async loadPackages() {
      if (!this.packages.length) this.loadState = "loading";
      const response = await fetchPackages();

      if (response.estadoflag || isEmptyResult(response)) {
        this.packages = response.data;
        this.loadState = "ready";
        return;
      }

      this.errorMessage = response.mensaje;
      this.loadState = "error";
    },
    async loadModules() {
      const response = await fetchPackageModules();
      this.modules = response.estadoflag ? response.data : [];
    },
    toggleDetails(pkg) {
      this.expandedId = this.expandedId === pkg.id ? null : pkg.id;
    },
    openCreate() {
      this.editingPackage = null;
      this.isFormOpen = true;
    },
    openEdit(pkg) {
      this.editingPackage = pkg;
      this.isFormOpen = true;
    },
    async onSaved(message) {
      notifySuccess(message);
      await this.loadPackages();
    },
    async toggleActive(pkg) {
      if (pkg.is_active) {
        const { isConfirmed } = await confirmDeactivation(pkg);
        if (!isConfirmed) return;
      }

      this.busyId = pkg.id;
      const response = await setPackageActive(pkg.id, !pkg.is_active);
      this.busyId = null;

      if (!response.estadoflag) {
        Swal.fire({ icon: "error", text: response.mensaje });
        return;
      }
      pkg.is_active = !pkg.is_active;
      notifySuccess(response.mensaje);
    },
  },
};
</script>

<style scoped>
.subscription-admin__header :where(h1, p),
.subscription-admin__state :where(p) {
  margin: 0;
}

.subscription-admin {
  min-height: calc(100vh - 64px);
}

.subscription-admin__container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.subscription-admin__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.subscription-admin__title {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subscription-admin__accent {
  color: var(--planes-accent);
}

.subscription-admin__subtitle {
  margin-top: 6px;
  max-width: 60ch;
  font-size: 16px;
  color: var(--planes-text-muted);
}

.subscription-admin__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
}

.subscription-admin__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px 20px;
  align-items: stretch;
  padding-top: 8px;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.card-skeleton {
  min-height: 460px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.03) 30%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 70%
  );
  background-size: 300% 100%;
}

.subscription-admin__state {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 460px;
  margin: 40px auto 0;
  padding: 32px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px dashed var(--planes-border-strong);
  text-align: center;
  color: var(--planes-text-muted);
}

.subscription-admin__state .plans-button {
  margin-top: 8px;
}

.subscription-admin__state-icon {
  font-size: 40px;
  color: var(--planes-accent);
}

.subscription-admin__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
}

@media (prefers-reduced-motion: no-preference) {
  .card-skeleton {
    animation: skeleton-shimmer 1.6s ease-in-out infinite;
  }
}

@keyframes skeleton-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}

@media (max-width: 600px) {
  .subscription-admin__container {
    padding: 20px 16px 32px;
  }

  .subscription-admin__title {
    font-size: 30px;
  }

  .subscription-admin__header .plans-button {
    width: 100%;
  }

  .card-skeleton {
    min-height: 260px;
  }
}
</style>
