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
          size="small"
          v-if="guardarFlag"
        >
          Guardar
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-checkbox
            v-model="entitiesStore.proveedor.proveedorprincipalflag"
            label="Es principal"
            hide-details
          >
          </v-checkbox>

          <v-tooltip location="bottom" class="my-auto">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props"> mdi-information </v-icon>
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
        <v-btn color="info" size="x-small" @click="agregarContacto">
          Añadir Nuevo Contacto</v-btn
        >
      </v-col>

      <v-col cols="12" class="py-1">
        <v-data-table
          :headers="headers"
          :items="entitiesStore.itemsImportacion"
          class="elevation-1"
        >
          <template v-slot:[`item.index`]="{ item, index }">
            {{ index + 1 }}
          </template>
          <template v-slot:[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              density="compact"
              variant="outlined"
              :disabled="!editable"
              :id="`contactoimport${index}`"
            ></v-text-field>
          </template>
          <template v-slot:[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              density="compact"
              :disabled="!editable"
              variant="outlined"
            ></v-text-field>
          </template>
          <template v-slot:[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              density="compact"
              variant="outlined"
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
        <v-btn color="info" size="x-small" @click="agregarContactoExportacion">
          Añadir Nuevo Contacto
        </v-btn>
      </v-col>

      <v-col cols="12" class="py-1">
        <v-data-table
          :headers="headers"
          :items="entitiesStore.itemsExportacion"
          class="elevation-1"
        >
          <template v-slot:[`item.index`]="{ item, index }">
            {{ index + 1 }}
          </template>
          <template v-slot:[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              density="compact"
              variant="outlined"
              :disabled="!editable"
              :id="`contactoexport${index}`"
            ></v-text-field>
          </template>
          <template v-slot:[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              density="compact"
              :disabled="!editable"
              variant="outlined"
            ></v-text-field>
          </template>
          <template v-slot:[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              density="compact"
              :disabled="!editable"
              variant="outlined"
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
import axios from '@/api/http';
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";

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
        { title: "#", key: "index" },

        {
          title: "Contacto",
          align: "start",
          sortable: false,
          key: "contacto",
        },
        { title: "Email", key: "email" },
        { title: "Telefono", key: "telefono" },
        { title: "Activo/ Inactivo", key: "action" },
      ],
      principalflag: false,
    };
  },
  async mounted() {
    this.cargarDatos();
  },
  computed: {
    ...mapStores(useEntitiesStore),
  },
  methods: {
    ...mapPiniaActions(useEntitiesStore, ["cargarDatosTatifasEntite"]),
    async cargarDatos() {
      if (!this.$route.params.id) {
        return;
      }
      await this.cargarDatosTatifasEntite({ id: this.$route.params.id });
      this.entitiesStore.itemsImportacion =
        this.entitiesStore.lstDatosTarifas.filter(
          (item) => item.code === "I",
        );
      this.entitiesStore.itemsExportacion =
        this.entitiesStore.lstDatosTarifas.filter(
          (item) => item.code === "E",
        );
    },
    agregarContactoExportacion() {
      this.entitiesStore.itemsExportacion.push({
        id: 0,
        code: "E",
        contacto: "",
        email: "",
        telefono: "",
      });
      this.$nextTick(() => {
        const index = this.entitiesStore.itemsExportacion.length - 1;
        const contactoInput = document.getElementById(`contactoexport${index}`);
        if (contactoInput) {
          contactoInput.focus();
        }
      });
    },
    agregarContacto() {
      this.entitiesStore.itemsImportacion.push({
        id: 0,
        code: "I",
        contacto: "",
        email: "",
        telefono: "",
      });
      this.$nextTick(() => {
        const index = this.entitiesStore.itemsImportacion.length - 1;
        const contactoInput = document.getElementById(`contactoimport${index}`);
        if (contactoInput) {
          contactoInput.focus();
        }
      });
    },
    async guardarContactos() {
      Swal.showLoading();
      let datos = [
        ...this.entitiesStore.itemsImportacion,
        ...this.entitiesStore.itemsExportacion,
      ];

      var config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "entitie/guardar_datos_tarifas",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: {
          id: this.$route.params.id,
          datos: datos,
          proveedorprincipalflag:
            this.entitiesStore.proveedor.proveedorprincipalflag,
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
