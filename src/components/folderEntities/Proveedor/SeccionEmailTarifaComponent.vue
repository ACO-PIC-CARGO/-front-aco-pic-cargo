<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        class="py-1"
        style="text-transform: uppercase; text-align: right"
      >
        <v-btn
          color="success"
          @click="guardarContactos"
          small
          v-if="guardarFlag"
        >
          Guardar
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-checkbox
            v-model="$store.state.entities.proveedor.proveedorprincipalflag"
            label="Es principal"
            hide-details
          >
          </v-checkbox>

          <v-tooltip bottom class="my-auto">
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
            </template>
            <span>
              Al marcar esta opción, este registro se mostrará
              <b>Seleccionado</b> en la lista de correos en el
              <b>Solicitar tarifas.</b>
            </span>
          </v-tooltip>
        </v-row>
      </v-col>
      <v-col cols="12" class="py-1" style="text-transform: uppercase">
        <center>
          <h5>Contactos de Importación</h5>
        </center>
      </v-col>

      <v-col cols="12" class="py-1">
        <v-btn color="info" x-small @click="agregarContacto">
          Añadir Nuevo Contacto</v-btn
        >
      </v-col>

      <v-col cols="12" class="py-1">
        <v-data-table
          :headers="headers"
          :items="$store.state.entities.itemsImportacion"
          class="elevation-1"
        >
          <template v-slot:[`item.index`]="{ item, index }">
            {{ index + 1 }}
          </template>
          <template v-slot:[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              dense
              outlined
              :disabled="!editable"
              :id="`contactoimport${index}`"
            ></v-text-field>
          </template>
          <template v-slot:[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              dense
              :disabled="!editable"
              outlined
            ></v-text-field>
          </template>
          <template v-slot:[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              dense
              outlined
              :disabled="!editable"
            ></v-text-field>
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-switch
              color="#00C853"
              :disabled="!editable"
              v-model="item.estado"
            ></v-switch>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" style="text-transform: uppercase">
        <center>
          <h5>Contactos de Exportación</h5>
        </center>
      </v-col>

      <v-col cols="12" class="py-1">
        <v-btn color="info" x-small @click="agregarContactoExportacion">
          Añadir Nuevo Contacto
        </v-btn>
      </v-col>

      <v-col cols="12" class="py-1">
        <v-data-table
          :headers="headers"
          :items="$store.state.entities.itemsExportacion"
          class="elevation-1"
        >
          <template v-slot:[`item.index`]="{ item, index }">
            {{ index + 1 }}
          </template>
          <template v-slot:[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              dense
              outlined
              :disabled="!editable"
              :id="`contactoexport${index}`"
            ></v-text-field>
          </template>
          <template v-slot:[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              dense
              :disabled="!editable"
              outlined
            ></v-text-field>
          </template>
          <template v-slot:[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              dense
              :disabled="!editable"
              outlined
            ></v-text-field>
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-switch
              color="#00C853"
              :disabled="!editable"
              v-model="item.estado"
            ></v-switch>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  name: "SeccionEmailTarifa",
  props: {
    editable: {
      type: Boolean,
      default: true,
    },
    guardarFlag: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      headers: [
        { text: "#", value: "index" },

        {
          text: "Contacto",
          align: "start",
          sortable: false,
          value: "contacto",
        },
        { text: "Email", value: "email" },
        { text: "Telefono", value: "telefono" },
        { text: "Activo/ Inactivo", value: "action" },
      ],
      principalflag: false,
    };
  },
  async mounted() {
    this.cargarDatos();
  },
  methods: {
    ...mapActions(["cargarDatosTatifasEntite"]),
    async cargarDatos() {
      if (!this.$route.params.id) {
        return;
      }
      await this.cargarDatosTatifasEntite({ id: this.$route.params.id });
      this.$store.state.entities.itemsImportacion =
        this.$store.state.entities.lstDatosTarifas.filter(
          (item) => item.code === "I",
        );
      this.$store.state.entities.itemsExportacion =
        this.$store.state.entities.lstDatosTarifas.filter(
          (item) => item.code === "E",
        );
    },
    agregarContactoExportacion() {
      this.$store.state.entities.itemsExportacion.push({
        id: 0,
        code: "E",
        contacto: "",
        email: "",
        telefono: "",
      });
      this.$nextTick(() => {
        const index = this.$store.state.entities.itemsExportacion.length - 1;
        const contactoInput = document.getElementById(`contactoexport${index}`);
        if (contactoInput) {
          contactoInput.focus();
        }
      });
    },
    agregarContacto() {
      this.$store.state.entities.itemsImportacion.push({
        id: 0,
        code: "I",
        contacto: "",
        email: "",
        telefono: "",
      });
      this.$nextTick(() => {
        const index = this.$store.state.entities.itemsImportacion.length - 1;
        const contactoInput = document.getElementById(`contactoimport${index}`);
        if (contactoInput) {
          contactoInput.focus();
        }
      });
    },
    async guardarContactos() {
      Swal.showLoading();
      let datos = [
        ...this.$store.state.entities.itemsImportacion,
        ...this.$store.state.entities.itemsExportacion,
      ];

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "entitie/guardar_datos_tarifas",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: {
          id: this.$route.params.id,
          datos: datos,
          proveedorprincipalflag:
            this.$store.state.entities.proveedor.proveedorprincipalflag,
        },
      };

      await axios(config).then((res) => {
        let data = res.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
        }
      });
      Swal.close();
      this.cargarDatos();
      console.log("Contactos guardados:", datos);
    },
  },
};
</script>

<style></style>
