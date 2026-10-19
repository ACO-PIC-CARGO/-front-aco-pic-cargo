<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useSecuritysStore } from "@/stores/securitys";
import type { Incoterm } from "@/types/cotizacion";
import type { ItemMenu, SucursalSesion, UsuarioSesion } from "@/types/sesion";

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const securitysStore = useSecuritysStore();

const rutasResumen = [
  "newQuote",
  "verQuote",
  "editQuote",
  "newCotizacionAduana",
  "EditarAduana",
  "VerAduana",
  "VerCotizacionCalculadora",
];
const dialogTutorial = ref(false);
const mostrarFlag = ref(true);
const branch: SucursalSesion = JSON.parse(sessionStorage.getItem("dataBranch") as string)[0];
const sucursal: string = JSON.parse(sessionStorage.getItem("dataBranch") as string)[0].trade_name;
const initiallyOpen = ref<unknown[]>([]);
const tree = ref<unknown[]>([]);
const person: UsuarioSesion = JSON.parse(sessionStorage.getItem("dataUser") as string)[0];

onMounted(() => {
  rootStore.dispatch("subscriptions/reloadPlanAccess");
  setTimeout(() => {
    rootStore.state.lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
  }, 10);
});

const lstMenu = computed<ItemMenu[]>(() => rootStore.state.lstMenu);
const listIncoterms = computed<Incoterm[]>(() => rootStore.state.pricing.listIncoterms);
const actualizarCostosFlag = computed(() => rootStore.state.pricing.actualizarCostosFlag);
const isAereoPricing = computed(() => {
  const pricing = rootStore.state.pricing;
  if (!pricing || !pricing.listShipment || !pricing.datosPrincipales) {
    return false;
  }

  const tipo = pricing.datosPrincipales.idtipocarga;
  const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
  if (!id) return false;

  const items = pricing.listShipment || [];
  const it = items.find((v: { id: number }) => v.id == id);
  return it && it.code === "Aéreo";
});
const pesoCargable = computed(() => {
  const pricing = rootStore.state.pricing;
  if (!pricing || !pricing.datosPrincipales) return null;

  const datos = pricing.datosPrincipales;
  const pesoReal = parseFloat(datos.peso || 0); // kg
  const volumen = parseFloat(datos.volumen || 0); // m³

  // Solo aplica para embarques aéreos
  if (!isAereoPricing.value) return null;

  // Si no hay datos suficientes, no mostramos nada
  if (!pesoReal && !volumen) return null;

  // Peso volumétrico aéreo estándar: volumen (m³) * 166.66 kg/m³
  const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

  const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
  if (!chargeable || !isFinite(chargeable)) return null;
  return parseFloat(chargeable.toFixed(2));
});
const pesoVolumetrico = computed(() => {
  const pricing = rootStore.state.pricing;
  if (!pricing || !pricing.datosPrincipales) return null;

  // Solo aplica para embarques aéreos
  if (!isAereoPricing.value) return null;

  const datos = pricing.datosPrincipales;
  const volumen = parseFloat(datos.volumen || 0); // m³
  if (!volumen) return null;

  const pv = volumen > 0 ? volumen * 166.66 : 0;
  if (!pv || !isFinite(pv)) return null;
  return parseFloat(pv.toFixed(2));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _nextView(name: string, id_role: number | string, namemodule: string) {
  rootStore.state.dataList = false;
  rootStore.state.menuName = namemodule;

  router.push({ name: name, params: { id_role } });
}
function cerrarSesion() {
  sessionStorage.removeItem("auth-token");
  sessionStorage.removeItem("dataUser");
  sessionStorage.removeItem("dataBranch");
  securitysStore.MostrarLogin = true;
  securitysStore.MostrarSucursal = false;
  router.push({ name: "Login" });
}
function mostrarResumenPricing() {
  const ruta = route.name as string;
  // let router = ["newQuote", "verQuote", "editQuote"];

  return rutasResumen.includes(ruta);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mostrarVolumen() {
  return true;
}
function isLockedItem(item: ItemMenu) {
  return Boolean(
    rootStore.getters["subscriptions/lockedModuleForRoute"](rootStore.state.lstMenu, item.route),
  );
}
function getRouteForItem(item: ItemMenu): { name?: string } {
  if (!item || !item.route || !router.hasRoute(item.route)) {
    return {};
  }
  return { name: item.route };
}
function handleClickTree(selected: unknown) {
  const item = (selected as ItemMenu[])[0];
  if (item && item.route) {
    const route = getRouteForItem(item);
    if (route && route.name) {
      router.push(route).catch(() => {});
    }
  }
}

watch(actualizarCostosFlag, () => {
  setTimeout(() => {
    mostrarFlag.value = !mostrarFlag.value;
    mostrarFlag.value = !mostrarFlag.value;
  }, 100);

  // Puedes realizar acciones aquí para actualizar el resumen u otros componentes
});
</script>

<template>
  <div>
    <v-col
      cols="12"
      class="header pa-3"
    >
      <!-- {{ person. }} -->
      <v-row>
        <v-col
          cols="3"
          class="avatar"
        >
          <v-menu location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant="text"
                icon
                size="x-large"
                aria-label="Cuenta"
                v-bind="props"
              >
                <v-avatar size="45">
                  <v-img
                    v-if="person.path"
                    :src="branch.logo"
                  />
                  <v-img
                    v-else
                    src="/img/png/user.png"
                  />
                </v-avatar>
              </v-btn>
            </template>
            <v-card min-width="200px">
              <div class="d-flex justify-center py-3">
                <div class="mx-auto text-center">
                  <v-avatar color="brown">
                    <v-img
                      v-if="branch.logo"
                      :src="branch.logo"
                    />
                    <v-img
                      v-else
                      src="/img/png/user.png"
                    />
                  </v-avatar>
                  <h5 class="mt-3">
                    {{ person.nombrecompleto }}
                  </h5>

                  <!-- <v-divider class="my-3"></v-divider> -->
                  <!-- <v-btn depressed rounded text disabled> Edit Account </v-btn> -->
                  <v-divider class="my-3" />
                  <v-btn
                    @click="cerrarSesion"
                    rounded
                    variant="text"
                  >
                    Cerrar Sesión
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-menu>
        </v-col>
        <v-col
          cols="9"
          class="header_datos"
        >
          <p class="my-0 sucursalName">
            {{ sucursal }}
          </p>
          <span class="person"> {{ person.nombrecompleto }}</span>
        </v-col>
      </v-row>
    </v-col>

    <v-divider />

    <v-treeview
      v-model="tree"
      v-model:opened="initiallyOpen"
      :items="lstMenu"
      activatable
      item-title="name"
      item-value="id"
      open-on-click
      return-object
      @update:activated="handleClickTree"
    >
      <!-- ÍCONOS DEL MENÚ -->
      <template #prepend="{ item, isOpen }">
        <v-icon v-if="!item.icon">
          {{ isOpen ? "mdi-folder-open" : "mdi-folder" }}
        </v-icon>
        <v-icon v-else>
          {{ item.icon }}
        </v-icon>
      </template>

      <!-- ENLACE NAVEGABLE DEL MENÚ -->
      <template #title="{ item }">
        <router-link
          v-if="item.route"
          :to="getRouteForItem(item)"
          class="treeview-label full-width-link"
          style="text-decoration: none; color: inherit"
        >
          {{ item.name }}
          <v-icon
            v-if="isLockedItem(item)"
            size="small"
            class="ml-1"
          >
            mdi-lock-outline
          </v-icon>
        </router-link>
        <span
          v-else
          class="treeview-label"
        >{{ item.name }}</span>
      </template>
    </v-treeview>

    <v-divider />
    <div class="">
      <v-btn
        color="blue-grey"
        class="mt-2 text-white"
        block
        @click="dialogTutorial = true"
        style="padding: 10% 0"
      >
        VER TUTORIAL <v-icon
          color="#000"
          class="mx-5"
        >
          mdi-video
        </v-icon>
      </v-btn>
    </div>
    <v-divider />

    <div
      v-if="mostrarResumenPricing() && mostrarFlag == true"
      class="mt-5"
    >
      <v-row class="datosPricing">
        <v-card class="datosPricing">
          <v-card-title
            class="custom-card-title justify-center text-white py-0 my-0 d-flex align-center flex-wrap"
          >
            <h6>DATOS DE LA COTIZACIÓN</h6>
          </v-card-title>
          <v-row>
            <v-card-text>
              <v-select
                label="Sentido"
                density="compact"
                class="my-5 px-5 text-resumen"
                :items="rootStore.state.pricing.listModality"
                item-title="name"
                item-value="id"
                v-model="rootStore.state.pricing.datosPrincipales.idsentido"
                readonly
              />

              <v-select
                label="Tipo de Embarque"
                density="compact"
                class="my-1 px-5 text-resumen"
                :items="rootStore.state.pricing.listShipment"
                item-title="embarque"
                item-value="id"
                v-model="rootStore.state.pricing.datosPrincipales.idtipocarga"
                readonly
                return-object
              />

              <v-select
                label="Incoterms"
                density="compact"
                class="my-1 px-5 text-resumen"
                :items="listIncoterms"
                item-title="name"
                item-value="id"
                v-model="rootStore.state.pricing.datosPrincipales.idincoterms"
                readonly
              >
                <template #selection="data">
                  {{ data.item.name }} - {{ data.item.description }}
                </template>
              </v-select>

              <v-autocomplete
                label="Puerto Origen"
                class="my-1 px-5 text-resumen"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                :items="rootStore.state.pricing.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="rootStore.state.pricing.datosPrincipales.idorigen"
              />

              <v-autocomplete
                label="Puerto Destino"
                class="my-1 px-5 text-resumen"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                :items="rootStore.state.pricing.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="rootStore.state.pricing.datosPrincipales.iddestino"
              />

              <v-text-field
                class="my-1 px-5 text-resumen"
                prefix="$"
                v-model="rootStore.state.pricing.datosPrincipales.amount"
                label="Valor de la mercancia"
                type="number"
                placeholder="Valor de la mercancia..."
                density="compact"
                readonly
              />
              <p
                class="my-1 px-5 text-resumen"
                v-if="rootStore.state.pricing.datosPrincipales.numerobultos"
              >
                <b>Nro Bultos :</b>
                {{ rootStore.state.pricing.datosPrincipales.numerobultos }} uni.
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="rootStore.state.pricing.datosPrincipales.peso"
              >
                <b>Peso :</b>
                {{ rootStore.state.pricing.datosPrincipales.peso }} kg
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="rootStore.state.pricing.datosPrincipales.volumen"
              >
                <b>Volumen :</b>
                {{ rootStore.state.pricing.datosPrincipales.volumen }} m
                <sup>3</sup>
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="isAereoPricing && pesoCargable !== null"
              >
                <b>Peso cargable: </b> {{ pesoCargable }} kg
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="isAereoPricing && pesoVolumetrico !== null"
              >
                Peso volumétrico: {{ pesoVolumetrico }} kg
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="rootStore.state.pricing.datosPrincipales.descripcioncarga"
              >
                <b>Desc. Carga :</b>
                {{ rootStore.state.pricing.datosPrincipales.descripcioncarga }}
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="
                  rootStore.state.pricing.datosPrincipales.containers && rootStore.state.pricing.datosPrincipales.containers.length > 0
                "
              >
                <b>Contenedores:</b>
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-for="(container, index) in rootStore.state.pricing
                  .datosPrincipales.containers"
                :key="index"
              >
                {{ container.description }} :
                {{ container.cantidad }}
              </p>
            </v-card-text>
          </v-row>
        </v-card>
      </v-row>
    </div>
    <div
      class="centrado"
      v-if="Number(branch.porcentaje_config) < 100"
    >
      <h3>Avance de Configuración</h3>
      <v-progress-circular
        :rotate="360"
        :size="100"
        :width="15"
        :model-value="branch.porcentaje_config"
        color="teal"
      >
        {{ branch.porcentaje_config }} %
      </v-progress-circular>
      <v-btn
        color="#4256BE"
        class="mt-2"
        size="small"
        @click="
          router.push({
            name: 'ConfiguracionInicial',
          })
        "
      >
        Continuar Configuración
      </v-btn>
    </div>

    <v-dialog
      v-model="dialogTutorial"
      persistent
      max-width="60%"
      v-if="dialogTutorial"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color=""
            @click="dialogTutorial = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <iframe
            width="100%"
            height="600px"
            src="https://www.youtube.com/embed/yvrDuoS3Fzo?si=t8utZVHDTsiCSGLH"
            title="Tutorial ACO"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.type__btn {
  cursor: pointer !important;
}

.sucursal {
  position: absolute;
  bottom: 0px;
  // background: #252c32;
  // color: white;
  margin-left: 60px;
  width: 240px;
}
.btn__logout {
  position: absolute;
  bottom: 0px;
  background: #252c32;
  color: white;
  margin-left: 60px;
  width: 240px;
}
.custom-card-title {
  background-color: #64b5f6 !important;
}
.text-resumen {
  font-size: 0.8rem;
}
.header {
  background: #37474f;
  color: #ffffff;
}
.header_datos {
  padding-left: auto 25px !important;
  text-align: center;
}
.sucursalName {
  font-weight: bold;
  align-content: center;
  font-size: 1.1rem;
}
.person {
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: bold;
}
.avatar {
  align-content: center;
  text-align: center;
  cursor: pointer;
}
.datosPricing {
  min-width: 100%;
}
.centrado {
  margin: 5% 0%;
  display: grid;
  place-items: center;
}
.treeview-label {
  white-space: normal;
  word-break: break-word;
  // max-width: 50px;
}
.full-width-link {
  display: block;
  width: 100%;
  padding: 8px 16px;
}
</style>
