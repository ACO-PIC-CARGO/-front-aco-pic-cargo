<template>
  <div>
    <div class="col-12 header">
      <!-- {{ person. }} -->
      <v-row>
        <v-col cols="3" class="avatar">
          <v-menu bottom min-width="200px" rounded offset-y>
            <template v-slot:activator="{ on }">
              <v-btn icon x-large v-on="on">
                <v-avatar size="45">
                  <v-img v-if="person.path" :src="branch.logo" />
                  <v-img v-else src="/img/png/user.png" />
                </v-avatar>
              </v-btn>
            </template>
            <v-card>
              <v-list-item-content class="justify-center">
                <div class="mx-auto text-center">
                  <v-avatar color="brown">
                    <v-img v-if="branch.logo" :src="branch.logo" />
                    <v-img v-else src="/img/png/user.png" />
                  </v-avatar>
                  <h5 class="mt-3">{{ person.nombrecompleto }}</h5>

                  <!-- <v-divider class="my-3"></v-divider> -->
                  <!-- <v-btn depressed rounded text disabled> Edit Account </v-btn> -->
                  <v-divider class="my-3"></v-divider>
                  <v-btn @click="cerrarSesion" depressed rounded text>
                    Cerrar Sesión
                  </v-btn>
                </div>
              </v-list-item-content>
            </v-card>
          </v-menu>
        </v-col>
        <v-col cols="9" class="header_datos">
          <p class="my-0 sucursalName">
            {{ sucursal }}
          </p>
          <span class="person"> {{ person.nombrecompleto }}</span>
        </v-col>
      </v-row>
    </div>

    <v-divider></v-divider>

    <v-treeview
      v-model="tree"
      :open="initiallyOpen"
      :items="$store.state.lstMenu"
      activatable
      item-key="id"
      open-on-click
      return-object
      @update:active="handleClickTree"
    >
      <!-- ÍCONOS DEL MENÚ -->
      <template v-slot:prepend="{ item, open }">
        <v-icon v-if="!item.icon">
          {{ open ? "mdi-folder-open" : "mdi-folder" }}
        </v-icon>
        <v-icon v-else>{{ item.icon }}</v-icon>
      </template>

      <!-- ENLACE NAVEGABLE DEL MENÚ -->
      <template v-slot:label="{ item }">
        <router-link
          v-if="item.route"
          :to="getRouteForItem(item)"
          class="treeview-label full-width-link"
          style="text-decoration: none; color: inherit"
        >
          {{ item.name }}
        </router-link>
        <span v-else class="treeview-label">{{ item.name }}</span>
      </template>
    </v-treeview>

    <v-divider></v-divider>
    <div class="">
      <v-btn
        color="blue-grey"
        class="mt-2 white--text"
        block
        @click="dialogTutorial = true"
        style="padding: 10% 0"
      >
        VER TUTORIAL <v-icon color="#000" class="mx-5">mdi-video</v-icon>
      </v-btn>
    </div>
    <v-divider></v-divider>

    <div v-if="mostrarResumenPricing() && mostrarFlag == true" class="mt-5">
      <v-row class="datosPricing">
        <v-card class="datosPricing">
          <v-card-title
            class="custom-card-title justify-center white--text py-0 my-0"
          >
            <h6>DATOS DE LA COTIZACIÓN</h6>
          </v-card-title>
          <v-row>
            <v-card-text>
              <v-select
                label="Sentido"
                dense
                class="my-5 px-5 text-resumen"
                :items="$store.state.pricing.listModality"
                item-text="name"
                item-key="id"
                item-value="id"
                v-model="$store.state.pricing.datosPrincipales.idsentido"
                readonly
              ></v-select>

              <v-select
                label="Tipo de Embarque"
                dense
                class="my-1 px-5 text-resumen"
                :items="$store.state.pricing.listShipment"
                item-text="embarque"
                item-key="id"
                item-value="id"
                v-model="$store.state.pricing.datosPrincipales.idtipocarga"
                readonly
                return-object
              ></v-select>

              <v-select
                label="Incoterms"
                dense
                class="my-1 px-5 text-resumen"
                :items="$store.state.pricing.listIncoterms"
                item-text="name"
                item-key="id"
                item-value="id"
                v-model="$store.state.pricing.datosPrincipales.idincoterms"
                readonly
              >
                <template slot="selection" slot-scope="data">
                  {{ data.item.name }} - {{ data.item.description }}
                </template>
              </v-select>

              <v-text-field
                class="my-1 px-5 text-resumen"
                prefix="$"
                v-model="$store.state.pricing.datosPrincipales.amount"
                label="Valor de la mercancia"
                type="number"
                placeholder="Valor de la mercancia..."
                dense
                readonly
              ></v-text-field>
              <p
                class="my-1 px-5 text-resumen"
                v-if="$store.state.pricing.datosPrincipales.numerobultos"
              >
                <b>Nro Bultos :</b>
                {{ $store.state.pricing.datosPrincipales.numerobultos }} uni.
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="$store.state.pricing.datosPrincipales.peso"
              >
                <b>Peso :</b>
                {{ $store.state.pricing.datosPrincipales.peso }} kg
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="$store.state.pricing.datosPrincipales.volumen"
              >
                <b>Volumen :</b>
                {{ $store.state.pricing.datosPrincipales.volumen }} m
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
                v-if="$store.state.pricing.datosPrincipales.descripcioncarga"
              >
                <b>Desc. Carga :</b>
                {{ $store.state.pricing.datosPrincipales.descripcioncarga }}
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-if="
                  $store.state.pricing.datosPrincipales.containers.length > 0
                "
              >
                <b>Contenedores:</b>
              </p>
              <p
                class="my-1 px-5 text-resumen"
                v-for="(container, index) in $store.state.pricing
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
    <div class="centrado" v-if="branch.porcentaje_config < 100">
      <h3>Avance de Configuración</h3>
      <v-progress-circular
        :rotate="360"
        :size="100"
        :width="15"
        :value="branch.porcentaje_config"
        color="teal"
      >
        {{ branch.porcentaje_config }} %
      </v-progress-circular>
      <v-btn
        color="#4256BE"
        dark
        class="mt-2"
        small
        @click="
          $router.push({
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
        <v-card-title primary-title>
          <v-spacer></v-spacer>
          <v-btn icon color="" @click="dialogTutorial = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
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
          ></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
export default {
  name: "listMenu",
  data: () => ({
    router: [
      "newQuote",
      "verQuote",
      "editQuote",
      "newCotizacionAduana",
      "EditarAduana",
      "VerAduana",
    ],
    dialogTutorial: false,
    loadingMenu: false,
    mostrarFlag: true,
    branch: JSON.parse(sessionStorage.getItem("dataBranch"))[0],
    sucursal: JSON.parse(sessionStorage.getItem("dataBranch"))[0].trade_name,
    initiallyOpen: [],
    tree: [],
    person: JSON.parse(sessionStorage.getItem("dataUser"))[0],
  }),
  mounted() {
    setTimeout(() => {
      this.$store.state.lstMenu = JSON.parse(sessionStorage.getItem("menu"));
    }, 10);
  },
  computed: {
    ...mapState(["itemsList", "itemsMenu", "datosPrincipales"]),
    actualizarCostosFlag() {
      return this.$store.state.pricing.actualizarCostosFlag;
    },
    isAereoPricing() {
      const pricing = this.$store.state.pricing;
      if (!pricing || !pricing.listShipment || !pricing.datosPrincipales) {
        return false;
      }

      const tipo = pricing.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;

      const items = pricing.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && it.code === "Aéreo";
    },
    pesoCargable() {
      const pricing = this.$store.state.pricing;
      if (!pricing || !pricing.datosPrincipales) return null;

      const datos = pricing.datosPrincipales;
      const pesoReal = parseFloat(datos.peso || 0); // kg
      const volumen = parseFloat(datos.volumen || 0); // m³

      // Solo aplica para embarques aéreos
      if (!this.isAereoPricing) return null;

      // Si no hay datos suficientes, no mostramos nada
      if (!pesoReal && !volumen) return null;

      // Peso volumétrico aéreo estándar: volumen (m³) * 166.66 kg/m³
      const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

      const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
      if (!chargeable || !isFinite(chargeable)) return null;
      return parseFloat(chargeable.toFixed(2));
    },
    pesoVolumetrico() {
      const pricing = this.$store.state.pricing;
      if (!pricing || !pricing.datosPrincipales) return null;

      // Solo aplica para embarques aéreos
      if (!this.isAereoPricing) return null;

      const datos = pricing.datosPrincipales;
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      const pv = volumen > 0 ? volumen * 166.66 : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
  },
  methods: {
    ...mapActions(["_getMenuItem", "_getGroupList", "_getEntities"]),
    _nextView(name, id_role, namemodule) {
      this.$store.state.dataList = false;
      this.$store.state.menuName = namemodule;

      this.$router.push({ name: name, params: { id_role } });
    },
    cerrarSesion() {
      sessionStorage.removeItem("auth-token");
      sessionStorage.removeItem("dataUser");
      sessionStorage.removeItem("dataBranch");
      this.$store.state.securitys.MostrarLogin = true;
      this.$store.state.securitys.MostrarSucursal = false;
      this.$router.push({ name: "Login" });
    },
    mostrarResumenPricing() {
      let ruta = this.$route.name;
      // let router = ["newQuote", "verQuote", "editQuote"];

      return this.router.includes(ruta);
    },
    mostrarVolumen() {
      return true;
    },
    getRouteForItem(item) {
      if (!item || !item.route) {
        return {};
      }
      return { name: item.route };
    },
    handleClickTree(selected) {
      const item = selected[0];
      if (item && item.route) {
        const route = this.getRouteForItem(item);
        if (route && route.name) {
          this.$router.push(route);
        }
      }
    },
  },
  watch: {
    actualizarCostosFlag() {
      setTimeout(() => {
        this.mostrarFlag = !this.mostrarFlag;
        this.mostrarFlag = !this.mostrarFlag;
      }, 100);

      // Puedes realizar acciones aquí para actualizar el resumen u otros componentes
    },
  },
};
</script>

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
