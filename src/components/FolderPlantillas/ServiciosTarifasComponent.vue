<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <span class="headline">Plantillas de Costos Base</span>
        <v-spacer></v-spacer>
       
      </v-card-title>
      <v-card-text>
        <!-- Buscador -->
        <v-row>
          <v-col cols="12" lg="4" xl="4">
            <v-text-field
              placeholder="Buscar..."
              label="Buscar"
              v-model="search"
              append-icon="mdi-magnify"
            ></v-text-field>
          </v-col>
        </v-row>
        
        <!-- Configuración de Plantilla -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              :items="modalidadesDisponibles"
              v-model="modalidadSeleccionada"
              label="Modalidad"
              item-text="name"
              item-value="id"
              dense
              outlined
              @change="cargarCostosBase"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              :items="tiposEnvioDisponibles"
              v-model="shipmentSeleccionado"
              label="Tipo de Envío"
              item-text="embarque"
              item-value="code"
              dense
              outlined
              @change="cargarCostosBase"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn 
              color="primary" 
              @click="guardarCambiosPlantilla" 
              :disabled="!modalidadSeleccionada || !shipmentSeleccionado || !costosBase.length"
              block
            >
              <v-icon left>mdi-content-save</v-icon>
              Guardar cambios
            </v-btn>
          </v-col>
        </v-row>
        
        <!-- Resumen de Costos Base -->
        <v-card v-if="costosBase.length > 0" class="mb-4">
          <v-card-title>
            <v-icon left>mdi-format-list-bulleted</v-icon>
            Costos Base Configurados
          </v-card-title>
          <v-card-text>
            <v-simple-table>
              <thead>
                <tr>
                  <th>Tramo</th>
                  <th>Sección</th>
                  <th>Servicio</th>
                  <th>Concepto</th>
                  <th>Multiplicador</th>
                  <th>Monto</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(costo, index) in costosBase" :key="index">
                  <td>
                    <v-chip :color="getTramoColor(costo.tramo)" text-color="white" small>
                      {{ costo.tramo }}
                    </v-chip>
                  </td>
                  <td style="min-width:220px">
                    <v-text-field
                      dense
                      hide-details
                      v-model="costo.seccion"
                    />
                  </td>
                  <td style="min-width:200px">
                    <v-text-field
                      dense
                      hide-details
                      v-model="costo.servicio"
                    />
                  </td>
                  <td style="min-width:220px">
                    <v-text-field
                      dense
                      hide-details
                      v-model="costo.concepto"
                    />
                  </td>
                  <td>{{ costo.multiplicador }}</td>
                  <td style="min-width:140px">
                    <v-text-field
                      class="tdMontos"
                      dense
                      hide-details
                      type="number"
                      step="0.01"
                      prefix="$"
                      v-model.number="costo.monto"
                    />
                  </td>
                  <td>{{ costo.proveedor }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>
        </v-card>
        
        <v-alert v-else type="info" class="mb-4">
          Seleccione modalidad y tipo de envío para ver los costos base configurados.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  props: {
    initialShipmentCode: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      search: "",
      singleExpand: false,
      expanded: [],
      headersCotizaciones: [
        {
          value: "created",
          text: "FECHA REGISTRO",
          align: "center",
          groupable: true,
          estado: true,
          dataType: "Date",
        },
        {
          value: "status",
          text: "ESTATUS",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "codigo",
          text: "CÓD.",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "ejecutivo_ventas",
          text: "EJECUTIVO",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "nombres",
          text: "CLIENTE",
          align: "center",
          groupable: true,
          estado: true,
        },
        {
          value: "sentido",
          text: "SENTIDO",
          align: "center",
          groupable: true,
          estado: true,
        },
      ],
      cotizacionesList: [],
      loadingCotizaciones: false,
      modalidadSeleccionada: null,
      shipmentSeleccionado: null,
      costosBase: [],
      loading: false,
      modalidadesDisponibles: [],
      tiposEnvioDisponibles: [],
    };
  },
  watch: {},
  async mounted() {
    await this.cargarDatosIniciales();
  },
  methods: {
    ...mapActions(["getListQuote", "getModality", "getShipment"]),
    fecha(fecha) {
      if (!fecha) return 'N/A';
      return new Date(fecha).toLocaleDateString('es-ES');
    },
    async cargarDatosIniciales() {
      this.loading = true;
      try {
        // Cargar modalidades y tipos de envío usando las acciones estándar del proyecto
        await this.getModality();
        await this.getShipment();

        // Tomar los datos directamente del store
        this.modalidadesDisponibles = this.$store.state.pricing.listModality || [];
        this.tiposEnvioDisponibles = this.$store.state.pricing.listShipment || [];

        console.log('Datos iniciales cargados:', {
          modalidades: this.modalidadesDisponibles.length,
          tiposEnvio: this.tiposEnvioDisponibles.length
        });
        console.log('Modalidades:', this.modalidadesDisponibles);
        console.log('Tipos de envío:', this.tiposEnvioDisponibles);

        // Si por alguna razón vienen vacíos, usar un pequeño fallback para no dejar los combos en blanco
        if (!this.modalidadesDisponibles.length) {
          this.modalidadesDisponibles = [
            { id: 1, name: 'Importación' },
            { id: 2, name: 'Exportación' }
          ];
        }
        if (!this.tiposEnvioDisponibles.length) {
          this.tiposEnvioDisponibles = [
            { id: 1, embarque: 'FCL', code: 'FCL' },
            { id: 2, embarque: 'LCL', code: 'LCL' },
            { id: 3, embarque: 'Aéreo', code: 'Aéreo' },
            { id: 4, embarque: 'LTL TERRESTRE INTERNACIONAL', code: 'LTL TERRESTRE INTERNACIONAL' }
          ];
        }

      } catch (error) {
        console.error('Error cargando datos iniciales:', error);

        // Fallback con datos estáticos para evitar combos vacíos
        this.modalidadesDisponibles = [
          { id: 1, name: 'Importación' },
          { id: 2, name: 'Exportación' }
        ];
        this.tiposEnvioDisponibles = [
          { id: 1, embarque: 'FCL', code: 'FCL' },
          { id: 2, embarque: 'LCL', code: 'LCL' },
          { id: 3, embarque: 'Aéreo', code: 'Aéreo' },
          { id: 4, embarque: 'LTL TERRESTRE INTERNACIONAL', code: 'LTL TERRESTRE INTERNACIONAL' }
        ];

        console.log('Usando datos fallback');
      } finally {
        this.loading = false;
      }
    },
    async guardarCambiosPlantilla() {
      if (!this.modalidadSeleccionada || !this.shipmentSeleccionado) {
        Swal.fire({ icon: 'warning', text: 'Seleccione modalidad y tipo de envío.' });
        return;
      }
      const payload = {
        id_modality: this.modalidadSeleccionada,
        shipment: this.shipmentSeleccionado,
        lstCostos: (this.costosBase || []).map((c) => ({
          id: c.id,
          code: c.code,
          tramo: c.tramo,
          seccion: c.seccion,
          servicio: c.servicio,
          concepto: c.concepto,
          multiplicador: c.multiplicador,
          monto: c.monto,
          proveedor: c.proveedor,
          exwflag: !!c.exwflag,
          fcaflag: !!c.fcaflag,
          fobflag: !!c.fobflag,
          cfrflag: !!c.cfrflag,
          cifflag: !!c.cifflag,
          ddpflag: !!c.ddpflag,
        })),
      };

      try {
        const config = {
          method: 'put',
          url: `${process.env.VUE_APP_URL_MAIN}editar_costos_base`,
          headers: {
            'auth-token': sessionStorage.getItem('auth-token'),
            'Content-Type': 'application/json',
          },
          data: payload,
        };

        const response = await axios(config);
        const ok = response?.data?.estadoflag;
        Swal.fire({
          icon: ok ? 'success' : 'error',
          title: ok ? 'Guardado' : 'Error',
          text: ok ? 'Costos base actualizados correctamente.' : (response?.data?.mensaje || 'No se pudo guardar.'),
        });
        if (ok) {
          await this.cargarCostosBase();
        }
      } catch (error) {
        console.error('Error guardando costos base:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo guardar.' });
      }
    },
    async cargarCostosBase() {
      if (!this.modalidadSeleccionada || !this.shipmentSeleccionado) {
        this.costosBase = [];
        return;
      }
      
      this.loading = true;
      try {
        console.log('Cargando costos base con parámetros:', {
          id_modality: this.modalidadSeleccionada,
          shipment: this.shipmentSeleccionado
        });
        
        const config = {
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}obtener_costos_base?id_modality=${this.modalidadSeleccionada}&shipment=${this.shipmentSeleccionado}`,
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
        };
        
        const response = await axios(config);
        
        console.log('Respuesta del servidor:', response.data);
        
        if (response.data.estadoflag && response.data.data) {
          this.costosBase = response.data.data;
          console.log('Costos base cargados:', this.costosBase.length, this.costosBase);
        } else {
          this.costosBase = [];
          console.log('No se encontraron costos base o estadoflag es false');
        }
        
      } catch (error) {
        console.error('Error cargando costos base:', error);
        this.costosBase = [];
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los costos base: ' + error.message
        });
      } finally {
        this.loading = false;
      }
    },
    crearNuevaPlantilla() {
      this.$router.push({
        name: 'ServiciosTarifasPlantillas',
        query: {
          modo: 'plantilla'
        }
      });
    },
    editarPlantilla() {
      this.$router.push({
        name: 'ServiciosTarifasPlantillas',
        query: {
          modo: 'editar',
          modalidad: this.modalidadSeleccionada,
          shipment: this.shipmentSeleccionado
        }
      });
    },
    getTramoColor(tramo) {
      switch (tramo) {
        case 'ORIGEN':
          return 'blue';
        case 'FLETE':
          return 'green';
        case 'DESTINO':
          return 'orange';
        default:
          return 'grey';
      }
    }
  },
};
</script>

<style scoped>
</style>
