<template>
  <div class="trial-setting">
    <p
      v-if="loadState === 'loading'"
      class="trial-setting__state"
      aria-busy="true"
    >
      <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
      Cargando los días de prueba…
    </p>

    <div
      v-else-if="loadState === 'error'"
      class="trial-setting__state"
      role="alert"
    >
      <p>No pudimos cargar los días de prueba. {{ errorMessage }}</p>
      <button
        type="button"
        class="plans-button plans-button--secondary"
        @click="load"
      >
        Reintentar
      </button>
    </div>

    <form v-else novalidate @submit.prevent="save">
      <FormField
        label="Prueba gratis al registrarse"
        input-id="registration-trial-days"
        hint="Aplica a las empresas que se registren desde ahora."
        :error="error"
      >
        <template #default="field">
          <div class="trial-setting__days">
            <input
              id="registration-trial-days"
              ref="input"
              v-model="days"
              class="trial-setting__input"
              type="number"
              min="1"
              max="365"
              step="1"
              inputmode="numeric"
              :disabled="saving"
              :aria-describedby="field.describedby"
              :aria-invalid="String(field.invalid)"
            />
            <span aria-hidden="true">días</span>
            <button
              type="submit"
              class="plans-button plans-button--primary"
              :disabled="saving"
            >
              <i
                v-if="saving"
                class="mdi mdi-loading mdi-spin"
                aria-hidden="true"
              ></i>
              {{ saving ? "Guardando…" : "Guardar" }}
            </button>
          </div>
        </template>
      </FormField>
    </form>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import FormField from "@/components/SubscriptionPackages/FormField.vue";
import { registrationTrialDaysError } from "@/components/SubscriptionPackages/packageForm";
import {
  fetchRegistrationTrialSetting,
  saveRegistrationTrialSetting,
} from "@/api/subscriptionPackages";
import { notifySuccess } from "@/views/MyPlan/planPurchase";

export default {
  name: "RegistrationTrialSetting",
  components: { FormField },
  data: () => ({
    days: "",
    loadState: "loading",
    errorMessage: "",
    submitted: false,
    saving: false,
  }),
  computed: {
    error() {
      return (this.submitted && registrationTrialDaysError(this.days)) || "";
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loadState = "loading";
      const response = await fetchRegistrationTrialSetting();
      if (!response.estadoflag) {
        this.errorMessage = response.mensaje;
        this.loadState = "error";
        return;
      }
      this.days = response.data[0].trial_days;
      this.loadState = "ready";
    },
    async save() {
      this.submitted = true;
      if (this.error) {
        this.$refs.input.focus();
        return;
      }

      this.saving = true;
      const response = await saveRegistrationTrialSetting(Number(this.days));
      this.saving = false;

      if (!response.estadoflag) {
        Swal.fire({
          icon: response.tipomensaje === "TMSGADV" ? "warning" : "error",
          text: response.mensaje,
        });
        return;
      }
      this.days = response.data[0].trial_days;
      this.submitted = false;
      notifySuccess(response.mensaje);
    },
  },
};
</script>

<style scoped>
.trial-setting {
  margin-bottom: 28px;
  padding: 20px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  box-shadow: var(--planes-card-shadow);
}

.trial-setting :where(p) {
  margin: 0;
}

.trial-setting__days {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--planes-text-muted);
}

.trial-setting__days .plans-button {
  margin-left: 8px;
}

.trial-setting__input {
  width: 110px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-border-strong);
  background: var(--planes-field);
  font-size: 15px;
  color: var(--planes-text);
}

.trial-setting__input:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 1px;
}

.trial-setting__input[aria-invalid="true"] {
  border-color: var(--planes-danger);
}

.trial-setting__state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--planes-text-muted);
}

@media (max-width: 600px) {
  .trial-setting {
    padding: 16px;
  }

  .trial-setting__days .plans-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
