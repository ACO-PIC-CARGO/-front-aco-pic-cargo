<template>
  <v-container>
    <v-tabs v-model="tab" align-tabs="center" stacked>
      <v-tab value="resumen"> Resumen </v-tab>
      <v-tab value="costo"> Costo</v-tab>
      <v-tab value="venta"> Venta</v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab" class="mt-5">
      <v-tabs-window-item value="resumen">
        <v-text-field
          v-model="searchResumen"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          variant="outlined"
          style="max-width: 30%"
          density="compact"
        />
        <br />

        <v-data-table
          :headers="headersResumen"
          :items="$store.state.calculadoras.lstFleteGrupalResumen"
          density="compact"
          :search="searchResumen"
        >
          <template v-slot:[`item.monto`]="{ item }">
            <span :style="!item.monto ? 'color:red' : ''">
              {{ item.monto || "Sin Config" }}
            </span>
          </template>
          <template v-slot:[`item.montoventa`]="{ item }">
            <span :style="!item.montoventa ? 'color:red' : ''">
              {{ item.montoventa || "Sin Config" }}
            </span>
          </template>
          <template v-slot:[`item.vigencia`]="{ item }">
            <span :style="!item.vigencia ? 'color:red' : ''">
              {{ item.vigencia || "Sin Config" }}
            </span>
          </template>
          <template v-slot:[`item.vigenciaventa`]="{ item }">
            <span :style="!item.vigenciaventa ? 'color:red' : ''">
              {{ item.vigenciaventa || "Sin Config" }}
            </span>
          </template>
        </v-data-table>
      </v-tabs-window-item>
      <v-tabs-window-item value="costo">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="searchCosto"
                  append-inner-icon="mdi-magnify"
                  label="Buscar"
                  single-line
                  hide-details
                  variant="outlined"
                  style="max-width: 40%"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="6" style="text-align: end">
                <v-btn
                  color="success"
                  @click="
                    abrirModal({ tipo: 'nuevo', item: {}, tipoCosto: 'costo' })
                  "
                >
                  Nuevo Flete Grupal
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="$store.state.calculadoras.lstFleteGrupal"
              density="compact"
              :search="searchCosto"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template v-slot:[`item.action`]="{ item }">
                <v-btn variant="text" color="error" icon @click="eliminar(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn variant="text"
                  color="warning"
                  icon
                  @click="
                    abrirModal({
                      tipo: 'editar',
                      item: item,
                      tipoCosto: 'costo',
                    })
                  "
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      <v-tabs-window-item value="venta">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="searchVenta"
                  append-inner-icon="mdi-magnify"
                  label="Buscar"
                  single-line
                  hide-details
                  variant="outlined"
                  style="max-width: 40%"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="6" style="text-align: end">
                <v-btn
                  color="success"
                  @click="
                    abrirModal({ tipo: 'nuevo', item: {}, tipoCosto: 'venta' })
                  "
                >
                  Nuevo Flete Grupal
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="$store.state.calculadoras.lstFleteGrupalVenta"
              :search="searchVenta"
              density="compact"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template v-slot:[`item.action`]="{ item }">
                <v-btn variant="text" color="error" icon @click="eliminar(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn variant="text"
                  color="warning"
                  icon
                  @click="
                    abrirModal({
                      tipo: 'editar',
                      item: item,
                      tipoCosto: 'venta',
                    })
                  "
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

    <v-dialog
      v-model="dialog"
      persistent
      max-width="20%"
      transition="dialog-transition"
    >
      <v-card class="pa-5">
        <v-card-title class="py-0 my-0">
          {{
            nuevoflag ? "Nuevo Registro" : editarflag ? "Editar Registro" : ""
          }}
        </v-card-title>
        <v-form ref="frmNuevo">
          <v-text-field
            label="Volumen"
            type="number"
            v-model="form.volumen"
            :rules="[(v) => !!v || 'Dato Requerido']"
            step="0.01"
            suffix="m³"
          ></v-text-field>
          <v-text-field
            label="Peso"
            type="number"
            v-model="form.peso"
            :rules="[(v) => !!v || 'Dato Requerido']"
            step="0.01"
            suffix="kg"
          ></v-text-field>
          <v-text-field
            label="Valor"
            type="number"
            v-model="form.valor"
            :rules="[(v) => !!v || 'Dato Requerido']"
            step="0.01"
            prefix="$."
          ></v-text-field>
          <!--  -->
          <FormatFechaVue
            v-model="form.vigencia"
            label="Fecha Vigencia"
            :errorMessages="errorFechaVigencia"
          />
          <!--  -->
          <v-card-actions>
            <v-btn
              color="success"
              v-if="nuevoflag"
              size="small"
              @click="guardarFleteGrupal"
            >
              Guardar
            </v-btn>
            <v-btn color="success" v-if="editarflag" @click="actualizar" size="small">
              Guardar
            </v-btn>
            <v-btn color="error" size="small" @click="dialog = false">Cancelar</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";

import FormatFechaVue from "../comun/FormatFecha.vue";
export default {
  props: ["type"],
  components: {
    FormatFechaVue,
  },
  data() {
    return {
      tab: "resumen",
      searchCosto: "",
      searchVenta: "",
      headers: [
        { width: "18%", title: "#", key: "index", sortable: false },
        { width: "18%", key: "volumen", title: "Volumen" },
        { width: "18%", key: "peso", title: "Peso" },
        { width: "18%", key: "valor", title: "Valor" },
        { width: "18%", key: "vigencia_text", title: "Fec. Vigencia" },
        { width: "10%", title: "", key: "action" },
      ],
      searchResumen: "",
      headersResumen: [
        { width: "15%", key: "volumen", title: "Volumen" },
        { width: "15%", key: "peso", title: "Peso" },
        {
          width: "16%",
          key: "monto",
          title: "Valor",
          headerProps: { class: "col-fondo-monto" },
          cellProps: { class: "col-fondo-monto" },
        },
        {
          width: "14%",
          key: "vigencia",
          title: "Fec. Vigencia",
          headerProps: { class: "col-fondo-monto" },
          cellProps: { class: "col-fondo-monto" },
        },
        {
          width: "16%",
          key: "montoventa",
          title: "Valor Venta",
          headerProps: { class: "col-fondo-venta" },
          cellProps: { class: "col-fondo-venta" },
        },

        {
          width: "14%",
          key: "vigenciaventa",
          title: "Fec. Vigencia Venta",
          headerProps: { class: "col-fondo-venta" },
          cellProps: { class: "col-fondo-venta" },
        },
      ],
      dialog: false,
      form: {
        volumen: 0,
        peso: 0,
        valor: 0,
        vigencia: null,
      },
      nuevoflag: false,
      editarflag: false,
      errorFechaVigencia: "",
      tipoCosto: "",
    };
  },
  computed: {
    // ...mapState(["getFleteGrupal"]),
  },
  methods: {
    ...mapActions([
      "getFleteGrupal",
      "setFleteGrupal",
      "updateFleteGrupal",
      "getFleteGrupalVenta",
      "setFleteGrupalVenta",
      "updateFleteGrupalVenta",
      "getFleteGrupalResumen",
    ]),
    eliminar(element) {
      Swal.fire({
        icon: "question",
        title: "Eliminar",
        text: "¿Desea eliminar el registro?",
        confirmButtonText: "Si,Eliminar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      }).then((res) => {
        if (res.isConfirmed) {
          this.updateFleteGrupal({ ...element, estado: false });
          this.getFleteGrupal({ tipo: this.type });
        }
      });
    },
    async actualizar() {
      if (this.editarflag) {
        if (this.tipoCosto == "costo") {
          await this.updateFleteGrupal({ ...this.form, estado: true });
          this.getFleteGrupal({ tipo: this.type });
        }
        if (this.tipoCosto == "venta") {
          await this.updateFleteGrupalVenta({ ...this.form, estado: true });

          this.getFleteGrupalVenta({ tipo: this.type });
        }
        this.getFleteGrupalResumen({ tipo: this.type });
        this.dialog = false;
        return;
      }
      Swal.fire({
        icon: "question",
        title: "Eliminar",
        text: "¿Desea eliminar el registro?",
        confirmButtonText: "Si,Eliminar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      }).then(async (res) => {
        if (res.isConfirmed) {
          if ((this.tipoCosto = "costo")) {
            await this.updateFleteGrupal({ ...this.form, estado: false });
            this.getFleteGrupal({ tipo: this.type });
          }
          if ((this.tipoCosto = "venta")) {
            await this.updateFleteGrupalVenta({ ...this.form, estado: false });
            this.getFleteGrupalVenta({ tipo: this.type });
          }
          this.getFleteGrupalResumen();
          this.dialog = false;
        }
      });
    },
    abrirModal({ tipo = "nuevo", item = {}, tipoCosto = "costo" }) {
      this.tipoCosto = tipoCosto;
      this.form.volumen = 1;
      this.form.peso = 1;
      this.form.valor = 1;
      this.nuevoflag = false;
      this.editarflag = false;
      this.dialog = true;
      this.$nextTick(() => {
        if (tipo == "nuevo") {
          this.nuevoflag = true;
        }
        if (tipo == "editar") {
          this.form = { ...item };
          this.editarflag = true;
        }
      });
    },
    async guardarFleteGrupal() {
      this.errorFechaVigencia = "";
      if ((await this.$refs.frmNuevo.validate()).valid && this.form.vigencia) {
        if (
          (this.$store.state.calculadoras.lstFleteGrupal.some(
            (v) => Number(v.volumen) === Number(this.form.volumen),
          ) &&
            this.tab == "costo") ||
          (this.$store.state.calculadoras.lstFleteGrupalVenta.some(
            (v) => Number(v.volumen) === Number(this.form.volumen),
          ) &&
            this.tab == "venta")
        ) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ya existe un valor asociado, al volumen",
          });
          return;
        }
        if (this.tab == "costo") {
          await this.setFleteGrupal(this.form);
          this.getFleteGrupal({ tipo: this.type });
        }
        if (this.tab == "venta") {
          await this.setFleteGrupalVenta(this.form);
          this.getFleteGrupalVenta({ tipo: this.type });
          this.dialog = false;
        }
      } else {
        if (!this.form.vigencia) {
          this.errorFechaVigencia = "Dato Requerido";
        }
      }
    },
  },
  async mounted() {
    await Promise.all([
      this.getFleteGrupal({ tipo: this.type }),
      this.getFleteGrupalVenta({ tipo: this.type }),
      this.getFleteGrupalResumen({ tipo: this.type }),
    ]);
  },
};
</script>

<style>
/* Color de fondo para toda la columna MONTO (ejemplo: amarillo claro) */
.col-fondo-monto {
  background-color: #fff9c4 !important;
}

/* Color de fondo para toda la columna MONTO VENTA (ejemplo: verde claro) */
.col-fondo-venta {
  background-color: #c8e6c9 !important;
}
</style>
