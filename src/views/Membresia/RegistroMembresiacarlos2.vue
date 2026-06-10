<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col v-for="plan in planes" :key="plan.plan_id" cols="12" sm="4">
        <v-card class="plan-card" elevation="3">
          <v-card-title class="plan-title">
            <v-row>
              <v-col
                cols="4"
                class="text-start bg-titulouse font-weight-bold text-center"
                >{{ plan.nombre }}</v-col
              >
              <v-col cols="8" class="text-overline text-end">
                <span
                  :class="{ active: selectedPlans[plan.plan_id] === 'mensual' }"
                  @click="togglePlan(plan.plan_id, 'mensual')"
                  >Mensual</span
                >
                |
                <span
                  :class="{ active: selectedPlans[plan.plan_id] === 'anual' }"
                  @click="togglePlan(plan.plan_id, 'anual')"
                  >Anual</span
                >
              </v-col>
            </v-row>
          </v-card-title>

          <v-radio-group
            v-model="selectedUsers[plan.plan_id]"
            @change="updatePrice(plan.plan_id)"
            class="mt-1"
            inline
          >
            <v-row>
              <v-col cols="5">
                <v-radio
                  :label="plan.usuarios_principal + ' Usuario'"
                  :value="plan.usuarios_principal"
                ></v-radio>
              </v-col>
              <v-col cols="5">
                <v-radio
                  :label="plan.usuarios_secundar + ' Usuarios'"
                  :value="plan.usuarios_secundar"
                ></v-radio>
              </v-col>
            </v-row>
          </v-radio-group>

          <v-divider class="my-0"></v-divider>

          <v-card-subtitle
            class="
              plan-subtitle
              text-h4
              black--text
              font-weight-black
              textestirado
              textoprecmen
            "
          >
            {{
              selectedUsers[plan.plan_id]
                ? selectedUsers[plan.plan_id]
                : plan.usuarios_principal
            }}
            {{
              (selectedUsers[plan.plan_id]
                ? selectedUsers[plan.plan_id]
                : plan.usuarios_principal) > 1
                ? "USUARIOS"
                : "USUARIO"
            }}
          </v-card-subtitle>

          <v-card-text>
            <div
              class="
                plan-price
                text-h4
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

            <v-divider class="my-2"></v-divider>

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

            <v-divider class="my-2"></v-divider>
            <v-list>
              <v-list-item-group>
                <v-list-item
                  v-for="feature in plan.caracteristicas"
                  :key="feature.descripcion"
                >
                  <v-list-item-content>
                    <v-icon
                      small
                      :color="feature.estado == 1 ? 'blue' : 'grey'"
                      :class="
                        feature.estado == 1
                          ? 'textocorrecto'
                          : 'textodesenfocado'
                      "
                      >mdi-check-circle</v-icon
                    >
                    <span
                      :class="
                        feature.estado == 1
                          ? 'textocorrecto'
                          : 'textodesenfocado'
                      "
                    >
                      {{ feature.descripcion }}</span
                    >
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>

            <v-btn
              color="blue-grey-lighten-5 btncobromensualrecurrente"
              class="mt-3"
              @click="subscribe(plan.plan_id)"
              >Cobro mensual recurrente</v-btn
            >
            <v-btn
              color="blue"
              class="mt-3 white--text"
              @click="showPaymentForm(plan)"
              >Contratar</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Formulario de Pago -->
    <v-dialog v-model="paymentDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Pago</span>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="processPayment(selectedPlanId)">
            <v-text-field
              v-model="cardNumber"
              label="Card Number"
              required
            ></v-text-field>
            <v-text-field
              v-model="securityCode"
              label="Security Code"
              type="password"
              required
            ></v-text-field>
            <v-text-field
              v-model="expirationMonth"
              label="Expiration Month"
              required
            ></v-text-field>
            <v-text-field
              v-model="expirationYear"
              label="Expiration Year"
              required
            ></v-text-field>
            <v-text-field
              v-model="firstName"
              label="First Name"
              required
            ></v-text-field>
            <v-text-field
              v-model="lastName"
              label="Last Name"
              required
            ></v-text-field>
            <v-text-field
              v-model="address"
              label="Address"
              required
            ></v-text-field>
            <v-text-field v-model="city" label="City" required></v-text-field>
            <v-text-field v-model="state" label="State" required></v-text-field>
            <v-text-field
              v-model="zip"
              label="Zip Code"
              required
            ></v-text-field>
            <v-text-field
              v-model="country"
              label="Country"
              required
            ></v-text-field>
            <v-btn type="submit" color="blue">Pay Now</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';

export default {
  data() {
    return {
      planes: [],
      selectedUsers: {},
      selectedPlans: {},
      totalPrice: 0,
      paymentDialog: false, // Controla la visibilidad del diálogo de pago
      selectedPlanId: null, // Almacena el ID del plan seleccionado
      cardNumber: "",
      securityCode: "",
      expirationMonth: "",
      expirationYear: "",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    };
  },
  methods: {
    async fetchPlans() {
      try {
        const response = await axios.post(
          process.env.VUE_APP_URL_MAIN + "getPlanes"
        );
        this.planes = response.data.data;

        this.planes.forEach((plan) => {
          this.$set(this.selectedUsers, plan.plan_id, plan.usuarios_principal);
          this.$set(this.selectedPlans, plan.plan_id, "mensual");
        });
      } catch (error) {
        console.error("Error al obtener planes:", error);
      }
    },
    updatePrice(planId) {
      const selectedPlan = this.planes.find(
        (plan) =>
          (this.selectedPlans[planId] === "mensual" &&
            (plan.usuarios_principal === this.selectedUsers[planId] ||
              plan.usuarios_secundar === this.selectedUsers[planId])) ||
          (this.selectedPlans[planId] === "anual" &&
            (plan.usuarios_principal_anu === this.selectedUsers[planId] ||
              plan.usuarios_secundar_anu === this.selectedUsers[planId]))
      );
      this.totalPrice = selectedPlan
        ? this.selectedPlans[planId] === "mensual"
          ? selectedPlan.precio_mensual
          : selectedPlan.precio_mensual_anu
        : 0;
    },
    togglePlan(planId, planType) {
      this.$set(this.selectedPlans, planId, planType);
    },
    async subscribe(planId) {
      const usuarioId = 1;
      try {
        const response = await axios.post(
          process.env.VUE_APP_URL_MAIN + "getPayment",
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
    },
    showPaymentForm(plan) {
      this.selectedPlanId = plan.plan_id; // Guarda el ID del plan seleccionado
      this.paymentDialog = true; // Abre el diálogo de pago
    },
    async processPayment(planId) {
      try {
        const response = await this.$axios.post(
          process.env.VUE_APP_URL_MAIN + "getPayment",
          {
            cardNumber: this.cardNumber,
            securityCode: this.securityCode,
            expirationMonth: this.expirationMonth,
            expirationYear: this.expirationYear,
            firstName: this.firstName,
            lastName: this.lastName,
            address: this.address,
            city: this.city,
            state: this.state,
            zip: this.zip,
            country: this.country,
            amount: this.totalPrice, // Asegúrate de pasar el monto total
          }
        );
        alert(response.data.message);
        this.paymentDialog = false; // Cierra el diálogo después del pago exitoso
      } catch (error) {
        console.error("Payment error:", error);
        alert("Payment failed.");
      }
    },
  },
  mounted() {
    this.fetchPlans();
  },
};
</script>

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
.text-overline.text-end.col.col-8 span {
  cursor: pointer;
}
</style>
