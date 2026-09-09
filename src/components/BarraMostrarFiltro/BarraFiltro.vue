<template>
  <v-container class="clsFiltro" fluid>
    <v-row>
      <v-col cols="12" class="py-0">
        <b>Filtro Por:</b>
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.fechapagodesde">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Emisión Desde"
          id="filtroDesde"
          v-model="filtro.fechapagodesde"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.fechapagohasta">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Emisión Hasta"
          id="filtroHasta"
          v-model="filtro.fechapagohasta"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.desde">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Desde"
          id="filtroDesde"
          v-model="filtro.desde"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.hasta">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Hasta"
          id="filtroHasta"
          v-model="filtro.hasta"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.fechadesde">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Desde"
          id="filtroDesde"
          v-model="filtro.fechadesde"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.fechahasta">
        <FormatFecha
          :dense="true"
          :outlined="true"
          label="Fecha Hasta"
          id="filtroHasta"
          v-model="filtro.fechahasta"
          :hideDetails="true"
          :disabled="true"
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.id_proveedor">
        <v-autocomplete
          :items="$store.state.provedores"
          v-model="filtro.id_proveedor"
          label="Proveedor"
          item-text="namelong"
          item-value="id"
          outlined
          readonly
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.id_consigner">
        <v-autocomplete
          :items="$store.state.clientes"
          v-model="filtro.id_consigner"
          label="Consignatario"
          item-text="namelong"
          item-value="id"
          readonly
          outlined
          dense
          hide-details
        >
        </v-autocomplete>
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.id_cliente">
        <v-autocomplete
          :items="$store.state.clientes"
          v-model="filtro.id_cliente"
          label="Consignatario"
          item-text="namelong"
          item-value="id"
          readonly
          outlined
          dense
          hide-details
        >
        </v-autocomplete>
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.tipoingreso">
        <v-autocomplete
          label="Tipo de Ingreso"
          :items="$store.state.balances.tipoingreso"
          v-model="filtro.tipoingreso"
          auto-select-first
          readonly
          outlined
          dense
          hide-details
          item-text="description"
          item-value="id"
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.tiposubingreso">
        <v-autocomplete
          label="Subtipo de Ingreso"
          :items="$store.state.balances.tiposubingreso"
          v-model="filtro.tiposubingreso"
          auto-select-first
          readonly
          outlined
          dense
          hide-details
          item-text="description"
          item-value="id"
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.id_cuenta">
        <v-select
          :items="cuentas"
          v-model="filtro.id_cuenta"
          label="Cuenta Bancaria (PIC)"
          item-text="label"
          item-value="id"
          outlined
          readonly
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.id_banco">
        <v-select
          :items="$store.state.itemsDataBanksList"
          v-model="filtro.id_banco"
          label="Banco Origen"
          item-text="acronym"
          item-value="id"
          readonly
          outlined
          dense
          hide-details
        >
        </v-select>
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.expediente">
        <v-text-field
          outlined
          readonly
          label="Nro Expediente"
          v-model="filtro.expediente"
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.nro_operacion">
        <v-text-field
          label="Nro Operacion"
          v-model="filtro.nro_operacion"
          readonly
          outlined
          dense
          hide-details
        />
      </v-col>
      <v-col cols="12" md="2" class="py-1" v-if="filtro.nro_exp">
        <v-text-field
          label="Nro Expediente"
          v-model="filtro.nro_exp"
          readonly
          outlined
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.factura">
        <v-text-field
          label="Nro Expediente"
          v-model="filtro.factura"
          readonly
          outlined
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.serie">
        <v-text-field
          label="Nro Expediente"
          v-model="filtro.serie"
          readonly
          outlined
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="2" class="py-1" v-if="filtro.monto">
        <v-text-field
          outlined
          readonly
          type="number"
          label="Monto"
          v-model="filtro.monto"
          dense
          hide-details
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";

export default {
  props: {
    filtro: {
      type: Object,
      default: {},
    },
    cuentas: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  components: {
    FormatFecha,
  },
  methods: {
    formatearFecha(fecha) {
      if (!fecha) return "";

      return moment(fecha).format("YYYY-MMM-DD").toUpperCase();
    },
  },
};
</script>

<style>
.clsFiltro {
  padding: 25px 25px 25px 25px;
  margin: 0 20px;
  max-width: 94vw;
  background: #f4f8fc !important;
  border-radius: 16px;
}
.clsFechaPor {
  padding: 15px 25px 10px 25px;
  background: #f0effe;
  border-radius: 30px;
}
.v-input__control {
  background: #fff !important;
}
</style>
