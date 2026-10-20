<script setup lang="ts">
import { onMounted, ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { PlanPrecioMembresia } from "@/types/membresia";

const planes = ref<PlanPrecioMembresia[]>([]);
const selectedUsers = ref<Record<number, number>>({});
const selectedPlans = ref<Record<number, string>>({});
const totalPrice = ref<number | string>(0);
const paymentDialog = ref(false); // Controla la visibilidad del diálogo de pago
const selectedPlanId = ref<number | null>(null); // Almacena el ID del plan seleccionado
const cardNumber = ref("");
const securityCode = ref("");
const expirationMonth = ref("");
const expirationYear = ref("");
const firstName = ref("");
const lastName = ref("");
const address = ref("");
const city = ref("");
const state = ref("");
const zip = ref("");
const country = ref("");

onMounted(() => {
  fetchPlans();
});

async function fetchPlans() {
  try {
    const response = await axios.post<ApiResponse<PlanPrecioMembresia[]>>(
      import.meta.env.VITE_URL_MAIN + "getPlanes"
    );
    planes.value = response.data.data;

    planes.value.forEach((plan) => {
      selectedUsers.value[plan.plan_id] = plan.usuarios_principal;
      selectedPlans.value[plan.plan_id] = "mensual";
    });
  } catch (error) {
    console.error("Error al obtener planes:", error);
  }
}
function updatePrice(planId: number) {
  const selectedPlan = planes.value.find(
    (plan) =>
      (selectedPlans.value[planId] === "mensual" &&
        (plan.usuarios_principal === selectedUsers.value[planId] ||
          plan.usuarios_secundar === selectedUsers.value[planId])) ||
      (selectedPlans.value[planId] === "anual" &&
        (plan.usuarios_principal_anu === selectedUsers.value[planId] ||
          plan.usuarios_secundar_anu === selectedUsers.value[planId]))
  );
  totalPrice.value = selectedPlan
    ? selectedPlans.value[planId] === "mensual"
      ? selectedPlan.precio_mensual
      : selectedPlan.precio_mensual_anu
    : 0;
}
function togglePlan(planId: number, planType: string) {
  selectedPlans.value[planId] = planType;
}
async function subscribe(planId: number) {
  const usuarioId = 1;
  try {
    const response = await axios.post<{ message: string }>(
      import.meta.env.VITE_URL_MAIN + "getPayment",
      {
        planId,
        usuarioId,
      }
    );
    alert(response.data.message);
  } catch (error) {
    console.error("Error al registrar la suscripción:", error);
    alert("Error al registrar la suscripción");
  }
}
function showPaymentForm(plan: PlanPrecioMembresia) {
  selectedPlanId.value = plan.plan_id; // Guarda el ID del plan seleccionado
  paymentDialog.value = true; // Abre el diálogo de pago
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processPayment(planId: number | null) {
  try {
    // @ts-expect-error no $axios global exists, so the payment throws before any request.
    const response = await $axios.post(
      import.meta.env.VITE_URL_MAIN + "getPayment",
      {
        cardNumber: cardNumber.value,
        securityCode: securityCode.value,
        expirationMonth: expirationMonth.value,
        expirationYear: expirationYear.value,
        firstName: firstName.value,
        lastName: lastName.value,
        address: address.value,
        city: city.value,
        state: state.value,
        zip: zip.value,
        country: country.value,
        amount: totalPrice.value, // Asegúrate de pasar el monto total
      }
    );
    alert(response.data.message);
    paymentDialog.value = false; // Cierra el diálogo después del pago exitoso
  } catch (error) {
    console.error("Payment error:", error);
    alert("Payment failed.");
  }
}
</script>

<template>
  <v-container fluid>
    <v-row class="justify-center">
      <v-col
        v-for="plan in planes"
        :key="plan.plan_id"
        cols="12"
        sm="4"
      >
        <v-card
          class="plan-card"
          elevation="3"
        >
          <v-card-title class="plan-title">
            <v-row>
              <v-col
                cols="4"
                class="text-start bg-titulouse font-weight-bold text-center"
              >
                {{ plan.nombre }}
              </v-col>
              <v-col
                cols="8"
                class="text-label-small text-end"
              >
                <span
                  :class="{ active: selectedPlans[plan.plan_id] === 'mensual' }"
                  @click="togglePlan(plan.plan_id, 'mensual')"
                >Mensual</span>
                |
                <span
                  :class="{ active: selectedPlans[plan.plan_id] === 'anual' }"
                  @click="togglePlan(plan.plan_id, 'anual')"
                >Anual</span>
              </v-col>
            </v-row>
          </v-card-title>

          <v-radio-group
            v-model="selectedUsers[plan.plan_id]"
            @update:model-value="updatePrice(plan.plan_id)"
            class="mt-1"
            inline
          >
            <v-row>
              <v-col cols="5">
                <v-radio
                  :label="plan.usuarios_principal + ' Usuario'"
                  :value="plan.usuarios_principal"
                />
              </v-col>
              <v-col cols="5">
                <v-radio
                  :label="plan.usuarios_secundar + ' Usuarios'"
                  :value="plan.usuarios_secundar"
                />
              </v-col>
            </v-row>
          </v-radio-group>

          <v-divider class="my-0" />

          <v-card-subtitle
            class="plan-subtitle text-headline-large text-black font-weight-black textestirado textoprecmen"
          >
            {{
              selectedUsers[plan.plan_id]
                ? selectedUsers[plan.plan_id]
                : plan.usuarios_principal
            }}
            {{
              (selectedUsers[plan.plan_id]
                ? selectedUsers[plan.plan_id]!
                : plan.usuarios_principal) > 1
                ? "USUARIOS"
                : "USUARIO"
            }}
          </v-card-subtitle>

          <v-card-text>
            <div
              class="
                plan-price
                text-headline-large
                font-weight-black
                textestirado
                textoprecmen
              "
            >
              <template v-if="selectedPlans[plan.plan_id] === 'mensual'">
                <template
                  v-if="
                    selectedUsers[plan.plan_id] === plan.usuarios_principal ||
                      !selectedUsers[plan.plan_id]
                  "
                >
                  ${{ plan.precio_mensual }}/mes
                </template>
                <template v-else>
                  ${{ plan.precio_mensual_secundar }}/mes
                </template>
              </template>
              <template v-else>
                <template
                  v-if="
                    selectedUsers[plan.plan_id] ===
                      plan.usuarios_principal_anu ||
                      !selectedUsers[plan.plan_id]
                  "
                >
                  ${{ plan.precio_mensual_anu }} / año
                </template>
                <template v-else>
                  ${{ plan.precio_mensual_secundar_anu }} / año
                </template>
              </template>
            </div>

            <v-divider class="my-2" />

            <div class="text-center font-weight-bold">
              <template v-if="selectedPlans[plan.plan_id] === 'mensual'">
                <template
                  v-if="
                    selectedUsers[plan.plan_id] === plan.usuarios_principal ||
                      !selectedUsers[plan.plan_id]
                  "
                >
                  Anualidad de ${{ plan.anualidad }}
                </template>
                <template v-else>
                  Anualidad de ${{ plan.anualidad_secundar }}
                </template>
              </template>
              <template v-else>
                <template
                  v-if="
                    selectedUsers[plan.plan_id] ===
                      plan.usuarios_principal_anu ||
                      !selectedUsers[plan.plan_id]
                  "
                >
                  Anualidad de ${{ plan.anualidad_anu }}
                </template>
                <template v-else>
                  Anualidad de ${{ plan.anualidad_secundar_anu }}
                </template>
              </template>
            </div>

            <v-divider class="my-2" />
            <v-list>
              <v-list-item
                v-for="feature in plan.caracteristicas"
                :key="feature.descripcion"
              >
                <v-icon
                  size="small"
                  :color="feature.estado == 1 ? 'blue' : 'grey'"
                  :class="
                    feature.estado == 1
                      ? 'textocorrecto'
                      : 'textodesenfocado'
                  "
                >
                  mdi-check-circle
                </v-icon>
                <span
                  :class="
                    feature.estado == 1
                      ? 'textocorrecto'
                      : 'textodesenfocado'
                  "
                >
                  {{ feature.descripcion }}</span>
              </v-list-item>
            </v-list>

            <v-btn
              color="blue-grey-lighten-5 btncobromensualrecurrente"
              class="mt-3"
              @click="subscribe(plan.plan_id)"
            >
              Cobro mensual recurrente
            </v-btn>
            <v-btn
              color="blue"
              class="mt-3 text-white"
              @click="showPaymentForm(plan)"
            >
              Contratar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Formulario de Pago -->
    <v-dialog
      v-model="paymentDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          <span class="text-headline-medium">Pago</span>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="processPayment(selectedPlanId)">
            <v-text-field
              v-model="cardNumber"
              label="Card Number"
              required
            />
            <v-text-field
              v-model="securityCode"
              label="Security Code"
              type="password"
              required
            />
            <v-text-field
              v-model="expirationMonth"
              label="Expiration Month"
              required
            />
            <v-text-field
              v-model="expirationYear"
              label="Expiration Year"
              required
            />
            <v-text-field
              v-model="firstName"
              label="First Name"
              required
            />
            <v-text-field
              v-model="lastName"
              label="Last Name"
              required
            />
            <v-text-field
              v-model="address"
              label="Address"
              required
            />
            <v-text-field
              v-model="city"
              label="City"
              required
            />
            <v-text-field
              v-model="state"
              label="State"
              required
            />
            <v-text-field
              v-model="zip"
              label="Zip Code"
              required
            />
            <v-text-field
              v-model="country"
              label="Country"
              required
            />
            <v-btn
              type="submit"
              color="blue"
            >
              Pay Now
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.textodesenfocado {
  opacity: 0.3;
  color: #000000;
}
.btncobromensualrecurrente:hover {
  background-color: #ffffff;
}
.textoprecmen {
  line-height: 2.1rem;
}
.bg-titulouse {
  background-color: #9da8be;
  border-radius: 12px;
  color: #ffffff;
  padding: 6px 12px;
  margin: 2% 0px;
  font-size: 16px;
}
.textestirado {
  transform: scale(1, 1.1);
}
.plan-card {
  border-radius: 10px;
  padding: 20px;
  background-color: #ffffff;
  border: 2px solid #ddd;
  margin: 10px;
}

.plan-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}

.plan-subtitle {
  font-size: 18px;
  color: #666;
  text-align: center;
}

.plan-price {
  font-size: 22px;
  color: #000;
  text-align: center;
  margin-bottom: 10px;
}

.v-btn {
  width: 100%;
  margin-top: 12px;
  font-weight: bold;
  background-color: #007bff;
  text-transform: none;
  border-radius: 12px;
}

.total-price {
  text-align: center;
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
}
.v-list-item__content {
  align-items: center;
  align-self: center;
  display: block;
  flex-wrap: wrap;
  flex: 1 1;
  overflow: hidden;
  padding: 0px 0;
}
.v-list-item {
  min-height: 0px;
}
.active {
  font-weight: bold;
  color: blue;
}
.text-label-small.text-end.col.col-8 span {
  cursor: pointer;
}
</style>
