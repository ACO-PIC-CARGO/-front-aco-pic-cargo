<template>
  <div>
    <template>
      <v-expansion-panels v-model="openExpand">
        <v-expansion-panel>
          <v-expansion-panel-content>
            <v-tabs
              v-model="activeTab"
              background-color="transparent"
              color="primary"
            >
              <v-tab key="houses">
                <v-icon left>mdi-home-group</v-icon>
                Lista de House
              </v-tab>
              <v-tab key="comments">
                <v-icon left>mdi-comment-text-multiple</v-icon>
                Comentarios
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="activeTab">
              <v-tab-item key="houses">
                <v-row dense>
                  <v-col cols="12" md="3">
                    <v-text-field
                      :value="totalHouses"
                      label="Total de House"
                      readonly
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      :value="totalPesoHouse"
                      label="Total de House Peso"
                      suffix="kg"
                      readonly
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      :value="totalVolumenHouse"
                      label="Total de House Volumen"
                      suffix="m3"
                      readonly
                    ></v-text-field>
                  </v-col>
                </v-row>
                <div
                  v-if="
                    $store.state.itemsHouseList &&
                    $store.state.itemsHouseList.length > 3 &&
                    !showAll
                  "
                  class="mb-2"
                >
                  <v-btn color="info" @click="showAll = true">Leer más</v-btn>
                </div>
                <v-simple-table>
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th>Listado</th>
                        <th>Código</th>
                        <th>Cliente</th>
                        <th>Incoterm</th>
                        <th>Peso</th>
                        <th>Volumen</th>
                        <th v-if="esAereo">Peso volumétrico</th>
                        <th v-if="esAereo">Peso Cargable</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in displayedItems"
                        :key="index"
                        @click="showHouse(item.id)"
                        style="cursor: pointer"
                      >
                        <td>{{ index + 1 }}</td>
                        <td>{{ item.nro_hbl || item.code_house || "-" }}</td>
                        <td>
                          {{
                            item.cliente_nombre ||
                            item.nameconsigner ||
                            item.cliente ||
                            item.consigner ||
                            "-"
                          }}
                        </td>
                        <td>{{ getIncotermName(item) }}</td>
                        <td>{{ item.peso || 0 }}</td>
                        <td>{{ item.volumen || 0 }}</td>
                        <td v-if="esAereo">
                          {{ computePesoVolumetrico(item) }}
                        </td>
                        <td v-if="esAereo">{{ computePesoCargable(item) }}</td>
                        <td>
                          <v-btn icon color="info">
                            <v-icon @click.stop="showHouse(item.id)">
                              mdi-open-in-new
                            </v-icon>
                          </v-btn>
                          <v-btn icon color="red">
                            <v-icon @click.stop="eliminar(item.id)">
                              mdi-delete
                            </v-icon>
                          </v-btn>
                          <v-btn icon color="#F57F17">
                            <v-icon
                              @click.stop="abrirModalCambiarExpediente(item)"
                            >
                              mdi-folder-arrow-up-down
                            </v-icon>
                          </v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-tab-item>

              <v-tab-item key="comments">
                <v-simple-table
                  v-if="masterComments && masterComments.length > 0"
                >
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ejecutivo</th>
                      <th>Comentario</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(comment, index) in masterComments"
                      :key="index"
                      class="bg-comentarios"
                    >
                      <td class="bg-comentarios">{{ comment.fecha }}</td>
                      <td class="bg-comentarios">{{ comment.ejecutivo }}</td>
                      <td class="bg-comentarios">{{ comment.comentario }}</td>
                    </tr>
                  </tbody>
                </v-simple-table>
                <v-alert v-else type="info" text>
                  No hay comentarios disponibles
                </v-alert>
              </v-tab-item>
            </v-tabs-items>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- DDDDDDDDDDDDDDDDD -->
    <v-dialog v-model="dialogCambiarExpediente" max-width="500">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Cambiar expediente (House)
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogCambiarExpediente = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-form :readonly="false" :disabled="false">
          <v-card-text>
            <v-autocomplete
              :items="
                $store.state.itemsMasterList.filter(
                  (v) => v.id != $route.params.id,
                )
              "
              :readonly="false"
              v-model="selectedNuevoExpediente"
              item-value="id"
              item-text="code_master"
              label="Seleccione nuevo expediente"
              outlined
              class="my-5"
            ></v-autocomplete>
            <p class="caption mb-0">Actual: {{ house.code_house }}</p>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogCambiarExpediente = false"
            >Cancelar</v-btn
          >
          <v-btn
            color="primary"
            :disabled="!selectedNuevoExpediente"
            @click="aplicarCambioExpediente"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/axios-config";
export default {
  name: "houselist",
  data: () => ({
    openExpand: 0,
    showAll: false,
    activeTab: 0,
    items: [
      { header: "LISTA DE HOUSE" },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/1.jpg",
        title: "Brunch this weekend?",
        subtitle: `<span class="text--primary">Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/2.jpg",
        title: 'Summer BBQ <span class="grey--text text--lighten-1">4</span>',
        subtitle: `<span class="text--primary">to Alex, Scott, Jennifer</span> &mdash; Wish I could come, but I'm out of town this weekend.`,
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/3.jpg",
        title: "Oui oui",
        subtitle:
          '<span class="text--primary">Sandra Adams</span> &mdash; Do you have Paris recommendations? Have you ever been?',
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/4.jpg",
        title: "Birthday gift",
        subtitle:
          '<span class="text--primary">Trevor Hansen</span> &mdash; Have any ideas about what we should get Heidi for her birthday?',
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/5.jpg",
        title: "Recipe to try",
        subtitle:
          '<span class="text--primary">Britta Holt</span> &mdash; We should eat this: Grate, Squash, Corn, and tomatillo Tacos.',
      },
    ],
    flagCambiarExpediente: false,
    dialogCambiarExpediente: false,
    selectedNuevoExpediente: [],
    house: {},
    listaExpedientes: [],
  }),
  computed: {
    displayedItems() {
      const list = this.$store.state.itemsHouseList || [];
      return this.showAll ? list : list.slice(0, 3);
    },
    masterComments() {
      const masterId =
        this.$store.state.master_insertId || this.$store.state.master_Id_get;
      if (!masterId) return [];

      if (
        this.$store.state.rowMaster &&
        this.$store.state.rowMaster.list_comentarios
      ) {
        return this.$store.state.rowMaster.list_comentarios;
      }

      if (this.$store.state.itemsMasterList) {
        const masterItem = this.$store.state.itemsMasterList.find(
          (m) => m.id == masterId,
        );
        return masterItem && masterItem.list_comentarios
          ? masterItem.list_comentarios
          : [];
      }

      return [];
    },
    totalHouses() {
      const list = this.$store.state.itemsHouseList || [];
      return list.length;
    },
    totalPesoHouse() {
      const list = this.$store.state.itemsHouseList || [];
      const total = list.reduce(
        (acc, it) => acc + (parseFloat(it.peso) || 0),
        0,
      );
      return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
    },
    totalVolumenHouse() {
      const list = this.$store.state.itemsHouseList || [];
      const total = list.reduce(
        (acc, it) => acc + (parseFloat(it.volumen) || 0),
        0,
      );
      return Number.isFinite(total) ? Number(total.toFixed(3)) : 0;
    },
    sumaTotal() {
      return 0;
    },
    esAereo() {
      const st = this.$store.state;
      const id =
        st.master_id_trasnport && st.master_id_trasnport.id
          ? st.master_id_trasnport.id
          : st.master_id_trasnport;
      const items = st.itemsShipment || [];
      const it = items.find((v) => v.id == id);
      return it && it.code === "Aéreo";
    },
  },
  methods: {
    ...mapActions(["deleteHouse", "_getMasterList"]),
    async abrirModalCambiarExpediente(house = {}) {
      this.house = house;

      this.flagCambiarExpediente = true;

      this.selectedNuevoExpediente = Number(this.$route.params.id) || null;
      this.dialogCambiarExpediente = true;
      this.flagCambiarExpediente = false;
    },
    async aplicarCambioExpediente() {
      if (!this.house || !this.selectedNuevoExpediente) return;
      if (
        Number(this.selectedNuevoExpediente) === Number(this.$route.params.id)
      ) {
        this.dialogCambiarExpediente = false;
        return;
      }
      const targetLabel = this.$store.state.itemsMasterList.find(
        (x) => x.id === this.selectedNuevoExpediente,
      ).code_master;
      const res = await Swal.fire({
        icon: "question",
        title: "Confirmar cambio",
        text: `¿Desea mover el house ${this.house.code_house} (con todos sus registros) al master ${targetLabel}?`,
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });
      if (!res.isConfirmed) return;

      try {
        const payload = {
          id_orders: this.house.id_orders,
          id_house: this.house.id,
          id_master_origen: Number(this.$route.params.id),
          id_master_destino: Number(this.selectedNuevoExpediente),
        };
        const config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "reasignar_house",
          headers: {
            "Content-Type": "application/json",
          },
          data: payload,
        };
        const response = await axios(config);
        this.flagCambiarExpediente = false;
        this.dialogCambiarExpediente = false;
        this.$emit("recargarDatos");
        if (response && response.data && response.data.estadoflag) {
          await Swal.fire({ icon: "success", text: "Expediente actualizado" });
          this.dialogCambiarExpediente = false;
          this.flagCambiarExpediente = true;
          this.$emit("recargarDatos");
          // await this.getListControlGastos(this.$route.params.id);
        } else {
          await Swal.fire({
            icon: "warning",
            text:
              (response && response.data && response.data.mensaje) ||
              "No se pudo reasignar el expediente. Se requiere soporte de backend.",
          });
        }
      } catch (error) {
        console.error(error);
        await Swal.fire({
          icon: "info",
          text: "Endpoint para reasignar house a otro master no disponible. Front listo; requerirá habilitar API (PUT reasignar_house).",
        });
      }
    },
    showHouse(id) {
      if (this.$route.name == "controlMasterEditar") {
        this.$router.push("/home/folderHouse/control/editar/" + id);
      } else if (this.$route.name == "controlMasterVer") {
        this.$router.push("/home/folderHouse/control/ver/" + id);
      }
    },
    computePesoVolumetrico(item) {
      const m3 = parseFloat(item.volumen || 0);
      const pv = m3 > 0 ? m3 * 166.66 : 0;
      return isNaN(pv) ? 0 : Number(pv.toFixed(2));
    },
    computePesoCargable(item) {
      const kg = parseFloat(item.peso || 0);
      const m3 = parseFloat(item.volumen || 0);
      const charge = Math.max(kg, m3 * 166.66);
      return isNaN(charge) ? 0 : Number(charge.toFixed(2));
    },
    getIncotermName(item) {
      if (item.incoterm) return item.incoterm;
      if (item.nameincoterm) return item.nameincoterm;
      if (item.incoterms) return item.incoterms;
      if (item.name_incoterm) return item.name_incoterm;
      if (item.id_incoterms) {
        var incoterms = this.$store.state.itemsIncoterms || [];
        var found = incoterms.find(function (inc) {
          return inc.id == item.id_incoterms;
        });
        if (found) return found.name;
      }
      return "-";
    },
    eliminar(id) {
      Swal.fire({
        icon: "question",
        title: "Eliminar",
        text: "Desea Eliminar el house",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonText: "Si, Eliminar",
      }).then((res) => {
        if (res.isConfirmed) {
          this.deleteHouse({ id: id });
        }
      });
    },
  },
  async mounted() {
    await this._getMasterList();
    this.$nextTick(() => {
      this.openExpand = 0;
    });
  },

  watch: {
    "$store.state.itemsHouseList": function (newValue, oldValue) {
      this.openExpand = 0;
    },
  },
};
</script>
