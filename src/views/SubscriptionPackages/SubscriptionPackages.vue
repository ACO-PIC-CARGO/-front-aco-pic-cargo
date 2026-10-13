<template>
  <div class="subscription-admin plans-theme plans-theme--app">
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
        <div class="subscription-admin__actions">
          <router-link
            :to="{ name: 'Planes' }"
            target="_blank"
            rel="noopener"
            class="plans-button plans-button--ghost"
            aria-label="Ver la página de planes como cliente (se abre en una pestaña nueva)"
          >
            <v-icon>mdi-open-in-new</v-icon> Ver como cliente
          </router-link>
          <v-btn
            text
            class="plans-button plans-button--ghost"
            @click="isSyncOpen = true"
          >
            <v-icon>mdi-sync</v-icon> Verificar Paddle
          </v-btn>
          <v-btn
            text
            class="plans-button plans-button--primary"
            @click="openCreate"
          >
            <v-icon>mdi-plus</v-icon> Nuevo paquete
          </v-btn>
        </div>
      </header>

      <RegistrationTrialSetting />

      <div
        v-if="loadState === 'ready' && packages.length"
        class="subscription-admin__toolbar"
      >
        <v-btn-toggle
          v-model="statusFilter"
          mandatory
          rounded
          dense
          class="segmented"
          role="group"
          aria-label="Mostrar paquetes"
        >
          <v-btn
            v-for="option in filterOptions"
            :key="String(option.value)"
            :value="option.value"
            text
          >
            {{ option.label }}
          </v-btn>
        </v-btn-toggle>
        <v-btn-toggle
          v-model="isAnnual"
          mandatory
          rounded
          dense
          class="segmented"
          role="group"
          aria-label="Precio mostrado"
        >
          <v-btn
            v-for="option in billingOptions"
            :key="String(option.value)"
            :value="option.value"
            text
          >
            {{ option.label }}
          </v-btn>
        </v-btn-toggle>
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
        <v-btn
          text
          class="plans-button plans-button--secondary"
          @click="loadAll"
        >
          Reintentar
        </v-btn>
      </div>

      <div v-else-if="!packages.length" class="subscription-admin__state">
        <v-icon class="subscription-admin__state-icon">
          mdi-package-variant
        </v-icon>
        <p class="subscription-admin__state-title">Aún no hay paquetes.</p>
        <p>
          Crea el primero con sus módulos, precio y características. Aparecerá
          en la página de planes.
        </p>
      </div>

      <div
        v-else-if="!visiblePackages.length"
        class="subscription-admin__state"
      >
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
            <v-btn
              text
              class="plans-button plans-button--secondary"
              :aria-label="`Editar ACO ${pkg.name}`"
              @click="openEdit(pkg)"
            >
              <v-icon>mdi-pencil-outline</v-icon> Editar
            </v-btn>
            <v-btn
              text
              class="plans-button plans-button--ghost"
              :aria-label="`${pkg.is_active ? 'Desactivar' : 'Activar'} ACO ${
                pkg.name
              }`"
              :disabled="busyId === pkg.id"
              @click="toggleActive(pkg)"
            >
              <v-icon>
                {{ pkg.is_active ? "mdi-eye-off-outline" : "mdi-eye-outline" }}
              </v-icon>
              {{ pkg.is_active ? "Desactivar" : "Activar" }}
            </v-btn>
          </div>
        </PackageCard>
      </section>
    </div>

    <PackageForm v-model="isFormOpen" :pkg="editingPackage" @saved="loadAll" />
    <PaddleSyncDialog v-model="isSyncOpen" />
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import { mapActions, mapGetters, mapState } from "vuex";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import PackageForm from "@/components/SubscriptionPackages/PackageForm.vue";
import PaddleSyncDialog from "@/components/SubscriptionPackages/PaddleSyncDialog.vue";
import RegistrationTrialSetting from "@/components/SubscriptionPackages/RegistrationTrialSetting.vue";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];

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
  components: {
    PackageCard,
    PackageForm,
    PaddleSyncDialog,
    RegistrationTrialSetting,
  },
  data: () => ({
    loadState: "loading",
    errorMessage: "",
    statusFilter: "active",
    isAnnual: false,
    expandedId: null,
    busyId: null,
    isFormOpen: false,
    editingPackage: null,
    isSyncOpen: false,
    billingOptions: BILLING_OPTIONS,
  }),
  computed: {
    ...mapState("subscriptions", ["packages"]),
    ...mapGetters("subscriptions", [
      "activePackageCount",
      "packagesWithStatus",
      "toPlanView",
    ]),
    filterOptions() {
      const inactiveCount = this.packages.length - this.activePackageCount;
      return [
        { value: "active", label: `Activos (${this.activePackageCount})` },
        { value: "inactive", label: `Inactivos (${inactiveCount})` },
        { value: "all", label: `Todos (${this.packages.length})` },
      ];
    },
    visiblePackages() {
      return this.packagesWithStatus(this.statusFilter);
    },
    emptyFilterMessage() {
      return this.statusFilter === "active"
        ? "No hay paquetes activos. La página de planes se verá vacía."
        : "No hay paquetes inactivos.";
    },
  },
  mounted() {
    this.$store.state.mainTitle = "PAQUETES DE SUSCRIPCIÓN";
    this.loadAll();
    this.loadPackageModules();
  },
  methods: {
    ...mapActions("subscriptions", [
      "loadPackages",
      "loadPackageModules",
      "setPackageActive",
    ]),
    async loadAll() {
      if (!this.packages.length) this.loadState = "loading";
      const error = await this.loadPackages();
      this.errorMessage = error || "";
      this.loadState = error ? "error" : "ready";
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
    async toggleActive(pkg) {
      if (pkg.is_active) {
        const { isConfirmed } = await confirmDeactivation(pkg);
        if (!isConfirmed) return;
      }
      this.busyId = pkg.id;
      await this.setPackageActive({ id: pkg.id, isActive: !pkg.is_active });
      this.busyId = null;
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

.subscription-admin__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.plans-theme a.plans-button .v-icon.v-icon {
  font-size: 18px;
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
    var(--planes-overlay-faint) 30%,
    var(--planes-overlay-hover) 50%,
    var(--planes-overlay-faint) 70%
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

.plans-theme .subscription-admin__state-icon.v-icon {
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

  .subscription-admin__actions,
  .subscription-admin__header .plans-button {
    width: 100%;
  }

  .card-skeleton {
    min-height: 260px;
  }
}
</style>
