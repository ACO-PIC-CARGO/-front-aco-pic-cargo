<template>
  <div>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field
          @change="_getDate()"
          type="date"
          v-model="$store.state.master_fecha_etd"
          label="Salida (ETD)"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-checkbox
          label="Salida Confirmada"
          v-model="$store.state.salidaflag"
          dense
        ></v-checkbox>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          @change="_getDate()"
          type="date"
          v-model="$store.state.master_fecha_eta"
          label="Llegada (ETA)"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-checkbox
          label="Llegada Confirmada"
          v-model="$store.state.llegadaflag"
          dense
        ></v-checkbox>
      </v-col>

      <v-col cols="12" md="6" align="right" justify="right">
        <v-text-field
          v-model="$store.state.master_fecha_disponibilidad"
          type="date"
          @change="_validaDate()"
          label="Fecha de Disponibilidad"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6" align="right" justify="right">
        <v-checkbox
          label="Confirmación Disponibilidad"
          v-model="$store.state.disponibilidadflag"
          dense
        ></v-checkbox>
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          :items="$store.state.masterusuarios.lstCanales"
          item-text="descripcion"
          item-value="id"
          v-model="$store.state.id_canal"
          label="Canal"
        ></v-select>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          label="Almacén Recepción"
          v-model="$store.state.almacen_recepcion"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.fecha_libre_almacenaje"
          type="date"
          label="Fecha Máxima Libre de Almacenaje"
        ></v-text-field>
      </v-col>

      <!-- Solo FCL: Días libres de sobreestadía y fecha límite de sobreestadía -->
      <v-col cols="12" md="6" v-if="!(isAereo() || isLCL())">
        <v-text-field
          label="Días Libres de Sobreestadía."
          type="number"
          suffix="Día(s)"
          v-model="$store.state.dias_sobreestadia"
          min="0"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6" v-if="!(isAereo() || isLCL())">
        <v-text-field
          v-model="$store.state.fecha_libre_sobreestadia"
          type="date"
          label="Libre de Sobreestadía Hasta"
        ></v-text-field>
      </v-col>

      <!-- <v-col cols="12" md="6">
          <v-text-field
            type="number"
            min="0"
            v-model="$store.state.master_ganancia_pricing"
            label="Ganancia Pricing"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            type="number"
            min="0"
            v-model="$store.state.master_ganancia_operaciones"
            label="Ganancia Operaciones"
          ></v-text-field>
        </v-col> -->
      <v-col cols="12" md="6">
        <v-text-field
          type="number"
          min="0"
          v-model="$store.state.nro_manifiesto"
          label="Número de Manifiesto"
        ></v-text-field>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "fechas",
  computed: {
    ...mapState(["itemsModality", "itemsShipment"]),
  },
  methods: {
    isAereo() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "Aéreo") {
        val = true;
      }
      return val;
    },
    isLCL() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "LCL") {
        val = true;
      }
      return val;
    },
    _getDate() {
      let code_sentido = this.itemsModality.filter(
        (v) => v.id == this.$store.state.master_sentido,
      )[0].code;

      if (code_sentido == "E") {
        if (!this.$store.state.master_fecha_disponibilidad) {
          this.$store.state.master_fecha_disponibilidad =
            this.$store.state.master_fecha_eta;
        }
      } else if (code_sentido == "I") {
        if (!this.$store.state.master_fecha_disponibilidad) {
          this.$store.state.master_fecha_disponibilidad =
            this.$store.state.master_fecha_etd;
        }
      }
      this._validaDate();
    },
    _validaDate() {
      let code_sentido = this.itemsModality.filter(
        (v) => v.id == this.$store.state.master_sentido,
      )[0].code;
      var vm = this;
      if (code_sentido == "E") {
        if (
          vm.$store.state.master_fecha_disponibilidad <
          vm.$store.state.master_fecha_eta
        ) {
          vm.$store.state.master_fecha_disponibilidad =
            vm.$store.state.master_fecha_eta;
          vm.$swal({
            icon: "warning",
            title: "Lo sentimos",
            text: "La fecha de disponibilidad no puede ser menor a la fecha de llegada",
          });
        }
      } else if (code_sentido == "I") {
        if (
          vm.$store.state.master_fecha_disponibilidad <
          vm.$store.state.master_fecha_etd
        ) {
          vm.$store.state.master_fecha_disponibilidad =
            vm.$store.state.master_fecha_etd;
          vm.$swal({
            icon: "warning",
            title: "Lo sentimos",
            text: "La fecha de disponibilidad no puede ser menor a la fecha de llegada",
          });
        }
      }
    },
  },
};
</script>
