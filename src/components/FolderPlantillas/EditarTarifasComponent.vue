<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon @click="volverALista" class="mr-3">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ modoPlantilla ? 'Editor de Plantillas de Tarifas' : `Editar Tarifas - ${cotizacionData.quote}` }}
        <v-spacer></v-spacer>
        <v-btn-toggle v-model="modoEditor" class="mr-3">
          <v-btn small value="cotizacion" :disabled="!cotizacionId">
            <v-icon left>mdi-file-document</v-icon>
            Cotización
          </v-btn>
          <v-btn small value="plantilla">
            <v-icon left>mdi-content-save-settings</v-icon>
            Plantilla
          </v-btn>
        </v-btn-toggle> 
      </v-card-title>
      <v-card-text>
        <!-- Información de la Cotización o Plantilla -->
        <v-row>
          <v-col cols="12">
            <v-alert :type="modoPlantilla ? 'success' : 'info'" dense class="mb-4">
              <div v-if="modoPlantilla">
                <strong>Modo Plantilla:</strong> Editando tarifas por defecto para reutilizar en nuevas cotizaciones
                <v-row class="mt-2">
                  <v-col cols="4">
                    <v-select
                      :items="modalidadesDisponibles"
                      v-model="plantillaConfig.modalidad"
                      label="Modalidad"
                      item-text="name"
                      item-value="id"
                      dense
                      outlined
                      hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="4">
                    <v-select
                      :items="tiposEnvioDisponibles"
                      v-model="plantillaConfig.tipoEnvio"
                      label="Tipo de Envío"
                      item-text="code"
                      item-value="id"
                      dense
                      outlined
                      hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model="plantillaConfig.nombre"
                      label="Nombre de Plantilla"
                      dense
                      outlined
                      hide-details
                      placeholder="Ej: Plantilla FCL Importación"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </div>
              <div v-else>
                <strong>Cotización:</strong> {{ cotizacionData.quote }} | 
                <strong>Cliente:</strong> {{ cotizacionData.nombre }} | 
                <strong>Modalidad:</strong> {{ cotizacionData.modalidad }} | 
                <strong>Tipo:</strong> {{ cotizacionData.shipment }}
              </div>
            </v-alert>
          </v-col>
        </v-row>
        
        <!-- Tarifas organizadas por categorías como en CostosComponent -->
        <div class="">
          <v-row>
            <v-col cols="12" lg="4" xl="4" class="my-1 py-2">
              <span class="title">
                Costos de la Cotización
                <v-btn icon color="primary" @click="abrirNuevoCosto">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </v-col>
          </v-row>
        </div>
        
        <!-- Flete -->
        <div v-if="mostrarFlete" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueFlete">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    FLETE: <span>{{ totalFlete }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Sección</th>
                          <th>Servicio</th>
                          <th>Concepto</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasFlete" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colSeccion">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.seccion"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colServicio">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.servicio"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Origen -->
        <div v-if="mostrarOrigen" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueOrigen">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    ORIGEN: <span>{{ totalOrigen }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasOrigen" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.proveedor"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Destino -->
        <div v-if="mostrarDestino" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueDestino">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    DESTINO: <span>{{ totalDestino }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasDestino" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.proveedor"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Local -->
        <div v-if="mostrarLocal" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueLocal">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    LOCAL: <span>{{ totalLocal }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasLocal" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.proveedor"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Aduana -->
        <div v-if="mostrarAduana" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueAduana">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    ADUANA: <span>{{ totalAduana }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasAduana" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.proveedor"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
        
        <!-- Almacén -->
        <div v-if="mostrarAlmacen" class="my-0 py-0">
          <v-row>
            <v-col cols="12" class="my-1 py-1">
              <v-expansion-panels class="condensed" v-model="valueAlmacen">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    ALMACÉN: <span>{{ totalAlmacen }}</span>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Proveedor</th>
                          <th>Conceptos</th>
                          <th>Multiplicador</th>
                          <th class="derecha">Costo Unitario</th>
                          <th>Sub Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(valor, i) in tarifasAlmacen" :key="i">
                          <td class="btnAccion">
                            <v-btn icon color="red" x-small @click="eliminarTarifa(valor)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.proveedor"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colConcepto">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.concepto"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colProveedorMultiplicador">
                            <v-text-field
                              dense
                              hide-details
                              v-model="valor.multiplicador"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            <v-text-field
                              class="derecha tdMontos"
                              dense
                              v-model="valor.monto"
                              prefix="$"
                              type="number"
                              step="0.01"
                              @input="marcarComoModificado(valor)"
                            ></v-text-field>
                          </td>
                          <td class="colCostos">
                            {{ formatCurrency(valor.monto || 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="modoPlantilla"
          color="success"
          @click="cargarPlantillaExistente"
          :loading="loadingCargar"
          class="mr-2"
        >
          <v-icon left>mdi-download</v-icon>
          Cargar Plantilla
        </v-btn>
        <v-btn
          :color="modoPlantilla ? 'success' : 'primary'"
          @click="modoPlantilla ? guardarPlantilla() : guardarTarifas()"
          :loading="loadingGuardar"
          :disabled="!modoPlantilla && !cotizacionId"
        >
          <v-icon left>{{ modoPlantilla ? 'mdi-content-save-settings' : 'mdi-content-save' }}</v-icon>
          {{ modoPlantilla ? 'Guardar como Plantilla' : 'Guardar Tarifas' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          Nuevo servicio
          <v-spacer></v-spacer>
          <v-icon @click="dialog = false">mdi-close</v-icon>
        </v-card-title>
        <v-form ref="frmNuevosCostos">
          <v-card-text>
            <v-select
              :items="lstTramo"
              v-model="frmNuevoCosto.tramo"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Tramo*"
              outlined
              dense
              hide-details
              class="my-2"
            ></v-select>

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Servicio*"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.servicio"
            ></v-text-field>

            <v-autocomplete
              :items="$store.state.configEmpresa.listTipoCostos"
              v-model="frmNuevoCosto.id_tipocosto"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="name"
              label="Sección*"
              item-text="name"
              outlined
              dense
              hide-details
              class="my-2"
            ></v-autocomplete>

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Concepto*"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.concepto"
            ></v-text-field>

            <v-autocomplete
              :items="$store.state.configEmpresa.lstMultiplicador"
              v-model="frmNuevoCosto.id_multiplicador"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="id"
              label="Multiplicador*"
              outlined
              dense
              hide-details
              class="my-2"
            ></v-autocomplete>

            <v-text-field
              label="Monto"
              outlined
              dense
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.monto"
            ></v-text-field>

            <v-autocomplete
              :items="$store.state.itemsProveedorList"
              v-model="frmNuevoCosto.id_proveedor"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Proveedor*"
              item-text="namelong"
              outlined
              dense
              hide-details
              class="my-2"
              item-value="id"
            ></v-autocomplete>

            <p>Incoterms</p>
            <v-row>
              <v-checkbox
                class="mx-5"
                label="EXW"
                v-model="frmNuevoCosto.exwflag"
              ></v-checkbox>
              <v-checkbox
                class="mx-5"
                label="FCA"
                v-model="frmNuevoCosto.fcaflag"
              ></v-checkbox>
              <v-checkbox
                class="mx-5"
                label="FOB"
                v-model="frmNuevoCosto.fobflag"
              ></v-checkbox>
              <v-checkbox
                class="mx-5"
                label="CFR"
                v-model="frmNuevoCosto.cfrflag"
              ></v-checkbox>
              <v-checkbox
                class="mx-5"
                label="CIF"
                v-model="frmNuevoCosto.cifflag"
              ></v-checkbox>
              <v-checkbox
                class="mx-5"
                label="DDP"
                v-model="frmNuevoCosto.ddpflag"
              ></v-checkbox>
            </v-row>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="red" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="green" dark @click="agregarNuevoCosto">Agregar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions } from "vuex";

export default {
  data() {
    return {
      cotizacionId: null,
      cotizacionData: {},
      modoEditor: 'cotizacion',
      plantillaConfig: {
        modalidad: null,
        tipoEnvio: null,
        nombre: ''
      },
      loadingCargar: false,
      // Expansion panel states
      valueFlete: 0,
      valueOrigen: 0,
      valueDestino: 0,
      valueLocal: 0,
      valueAduana: 0,
      valueAlmacen: 0,
      valueGastosTerceros: 0,
      tarifasCotizacion: [],
      tarifasFlete: [],
      tarifasOrigen: [],
      tarifasDestino: [],
      tarifasLocal: [],
      tarifasAduana: [],
      tarifasAlmacen: [],
      tarifasGastosTerceros: [],
      modalidadesDisponibles: [],
      tiposEnvioDisponibles: [],
      lstTramo: [
        { id: "ORIGEN", text: "ORIGEN" },
        { id: "FLETE", text: "FLETE" },
        { id: "DESTINO", text: "DESTINO" },
        { id: "OPCIONAL", text: "OPCIONAL" },
      ],
      dialog: false,
      frmNuevoCosto: {
        exwflag: false,
        fcaflag: false,
        fobflag: false,
        cfrflag: false,
        cifflag: false,
        ddpflag: false,
        tramo: "",
        servicio: "",
        concepto: "",
        id_multiplicador: "",
        monto: 0,
        id_proveedor: "",
        id_tipocosto: "",
      },
      loadingTable: false,
      loadingGuardar: false,
      originalCostos: [],
      costosModificados: new Set(),
      costosNuevos: [],
    };
  },
  async mounted() {
    this.cotizacionId = this.$route.query.cotizacion || null;

    // Si venimos desde la pantalla de plantillas, tomar modalidad y shipment del router
    if (this.$route.query.modalidad) {
      this.plantillaConfig.modalidad = parseInt(this.$route.query.modalidad);
    }
    if (this.$route.query.shipment) {
      this.plantillaConfig.tipoEnvio = this.$route.query.shipment;
    }

    // Siempre cargar costos base (plantillas)
    await this.cargarCostosBase();
  },
  watch: {
    modoEditor(newMode) {
      if (newMode === 'plantilla') {
        this.limpiarTarifas();
        this.cargarDatosParaPlantilla();
      } else if (newMode === 'cotizacion' && this.cotizacionId) {
        this.cargarTarifasCotizacion();
      }
    }
  },
  methods: {
    ...mapActions(["getQuote"]),
    volverALista() {
      this.$router.push({ name: 'ServiciosTarifasPlantillas' });
    },
    async cargarCostosBase() {
      this.loadingTable = true;
      try {
        const idModality = this.plantillaConfig.modalidad;
        const shipment = this.plantillaConfig.tipoEnvio;

        // El backend espera siempre ambos parámetros: ?id_modality=1&shipment=FCL
        if (!idModality || !shipment) {
          console.warn('No se pudo cargar costos base: falta modalidad o shipment en plantillaConfig');
          return;
        }

        const config = {
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}obtener_costos_base?id_modality=${idModality}&shipment=${shipment}`,
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
        };
        
        const response = await axios(config);
        
        if (response.data.estadoflag && response.data.data) {
          const costosBase = response.data.data;
          this.organizarCostosPorTramo(costosBase);
          
          console.log('Costos base cargados:', {
            total: costosBase.length,
            flete: this.tarifasFlete.length,
            origen: this.tarifasOrigen.length,
            destino: this.tarifasDestino.length
          });
        }
        
      } catch (error) {
        console.error('Error cargando costos base:', error);
        Swal.fire({
          icon: 'error',
          text: 'Error al cargar los costos base.',
          confirmButtonText: 'Ok'
        });
      } finally {
        this.loadingTable = false;
      }
    },
    organizarCostosPorTramo(costos) {
      this.tarifasFlete = [];
      this.tarifasOrigen = [];
      this.tarifasDestino = [];
      
      costos.forEach(costo => {
        switch (costo.tramo) {
          case 'FLETE':
            this.tarifasFlete.push(costo);
            break;
          case 'ORIGEN':
            this.tarifasOrigen.push(costo);
            break;
          case 'DESTINO':
            this.tarifasDestino.push(costo);
            break;
        }
      });
    },
    async cargarTarifasCotizacion() {
      if (!this.cotizacionId) return;
      
      this.loadingTable = true;
      try {
        // Llamar directamente al endpoint getQuoteId
        await this.getQuote({ id: this.cotizacionId });
        
        // Obtener datos básicos de la cotización
        const quoteData = this.$store.state.pricing.copy_quote || {};
        this.cotizacionData = {
          quote: quoteData.quote || 'N/A',
          nombre: quoteData.nombre || 'N/A',
          modalidad: 'N/A',
          shipment: 'N/A'
        };
        
        // Extraer tarifas básicas (solo costos, no ventas) y organizarlas por categorías
        const opcionCostos = this.$store.state.pricing.opcionCostos || [];
        this.tarifasCotizacion = [];
        this.tarifasFlete = [];
        this.tarifasOrigen = [];
        this.tarifasDestino = [];
        this.tarifasLocal = [];
        this.tarifasAduana = [];
        this.tarifasAlmacen = [];
        this.tarifasGastosTerceros = [];
        
        opcionCostos.forEach(opcion => {
          if (opcion.listCostos && Array.isArray(opcion.listCostos)) {
            const costos = opcion.listCostos.filter(costo => costo.esopcionflag == 1);
            this.tarifasCotizacion.push(...costos);
            
            // Organizar por categorías como en CostosComponent
            costos.forEach(costo => {
              if (costo.status == 1) {
                if (costo.esfleteflag == 1) {
                  this.tarifasFlete.push(costo);
                } else if (costo.esorigenflag == 1) {
                  this.tarifasOrigen.push(costo);
                } else if (costo.esdestinoflag == 1) {
                  this.tarifasDestino.push(costo);
                } else if (costo.eslocalflag == 1) {
                  this.tarifasLocal.push(costo);
                } else if (costo.esaduanaflag == 1) {
                  this.tarifasAduana.push(costo);
                } else if (costo.esalmacenflag == 1) {
                  this.tarifasAlmacen.push(costo);
                } else if (costo.esgastostercerosflag == 1) {
                  this.tarifasGastosTerceros.push(costo);
                }
              }
            });
          }
        });
        
        console.log('Tarifas cargadas:', {
          total: this.tarifasCotizacion.length,
          flete: this.tarifasFlete.length,
          origen: this.tarifasOrigen.length,
          destino: this.tarifasDestino.length,
          local: this.tarifasLocal.length,
          aduana: this.tarifasAduana.length,
          almacen: this.tarifasAlmacen.length,
          gastosTerceros: this.tarifasGastosTerceros.length
        });
        
      } catch (error) {
        console.error('Error cargando tarifas de cotización:', error);
        Swal.fire({
          icon: 'error',
          text: 'Error al cargar las tarifas de la cotización.',
          confirmButtonText: 'Ok'
        });
      } finally {
        this.loadingTable = false;
      }
    },
    abrirNuevoCosto() {
      Swal.fire({
        icon: 'info',
        text: 'Funcionalidad en desarrollo.',
        confirmButtonText: 'Ok'
      });
    },
    marcarComoModificado(item) {
      console.log('Item modificado:', item);
      // Aquí se puede implementar el tracking de cambios
    },
    eliminarTarifa(tarifa) {
      console.log('Eliminar tarifa:', tarifa);
      Swal.fire({
        icon: 'info',
        text: 'Funcionalidad de eliminación en desarrollo.',
        confirmButtonText: 'Ok'
      });
    },
    formatCurrency(value) {
      if (!value) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    },
    async guardarTarifas() {
      Swal.fire({
        icon: 'info',
        text: 'Funcionalidad de guardado en desarrollo.',
        confirmButtonText: 'Ok'
      });
    },
    async guardarPlantilla() {
      if (!this.plantillaConfig.modalidad || !this.plantillaConfig.tipoEnvio) {
        Swal.fire({
          icon: 'warning',
          text: 'Por favor seleccione modalidad y tipo de envío.',
          confirmButtonText: 'Ok'
        });
        return;
      }
      
      this.loadingGuardar = true;
      try {
        // Preparar datos según estructura del endpoint editar_costos_base
        const lstCostos = [];
        
        // Agregar todos los costos de todas las categorías
        [...this.tarifasFlete, ...this.tarifasOrigen, ...this.tarifasDestino].forEach(costo => {
          lstCostos.push({
            code: costo.code || 0,
            tramo: costo.tramo,
            seccion: costo.seccion,
            servicio: costo.servicio,
            concepto: costo.concepto,
            multiplicador: costo.multiplicador,
            monto: parseFloat(costo.monto) || 0,
            proveedor: costo.proveedor,
            exwflag: costo.exwflag || false,
            fcaflag: costo.fcaflag || false,
            fobflag: costo.fobflag || false,
            cfrflag: costo.cfrflag || false,
            cifflag: costo.cifflag || false,
            ddpflag: costo.ddpflag || false
          });
        });
        
        const payload = {
          id_modality: this.plantillaConfig.modalidad,
          shipment: this.plantillaConfig.tipoEnvio,
          lstCostos: lstCostos
        };
        
        console.log('Enviando datos:', payload);
        
        const config = {
          method: "put",
          url: `${process.env.VUE_APP_URL_MAIN}editar_costos_base`,
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
          data: payload
        };
        
        const response = await axios(config);
        
        if (response.data.estadoflag) {
          Swal.fire({
            icon: 'success',
            text: 'Costos base guardados correctamente.',
            confirmButtonText: 'Ok'
          });
          
          // Recargar datos
          await this.cargarCostosBase();
        } else {
          throw new Error(response.data.mensaje || 'Error al guardar');
        }
        
      } catch (error) {
        console.error('Error guardando costos base:', error);
        Swal.fire({
          icon: 'error',
          text: 'Error al guardar los costos base.',
          confirmButtonText: 'Ok'
        });
      } finally {
        this.loadingGuardar = false;
      }
    },
    async cargarPlantillaExistente() {
      this.loadingCargar = true;
      try {
        // Aquí iría la lógica para cargar plantillas existentes
        const plantillas = [
          { id: 1, nombre: 'FCL Importación Estándar', modalidad: 'Importación', tipoEnvio: 'FCL' },
          { id: 2, nombre: 'LCL Exportación Básica', modalidad: 'Exportación', tipoEnvio: 'LCL' },
          { id: 3, nombre: 'Aéreo Express', modalidad: 'Importación', tipoEnvio: 'AEREO' }
        ];
        
        const { value: plantillaSeleccionada } = await Swal.fire({
          title: 'Seleccionar Plantilla',
          input: 'select',
          inputOptions: plantillas.reduce((options, plantilla) => {
            options[plantilla.id] = `${plantilla.nombre} (${plantilla.modalidad} - ${plantilla.tipoEnvio})`;
            return options;
          }, {}),
          inputPlaceholder: 'Seleccione una plantilla',
          showCancelButton: true,
          confirmButtonText: 'Cargar',
          cancelButtonText: 'Cancelar'
        });
        
        if (plantillaSeleccionada) {
          const plantilla = plantillas.find(p => p.id == plantillaSeleccionada);
          console.log('Cargando plantilla:', plantilla);
          
          // Aquí cargarías los datos de la plantilla seleccionada
          Swal.fire({
            icon: 'success',
            text: `Plantilla "${plantilla.nombre}" cargada correctamente.`,
            confirmButtonText: 'Ok'
          });
        }
        
      } catch (error) {
        console.error('Error cargando plantilla:', error);
        Swal.fire({
          icon: 'error',
          text: 'Error al cargar la plantilla.',
          confirmButtonText: 'Ok'
        });
      } finally {
        this.loadingCargar = false;
      }
    },
    async cargarDatosParaPlantilla() {
      // Cargar modalidades y tipos de envío disponibles
      try {
        // Estos datos deberían venir del store o endpoints
        this.modalidadesDisponibles = this.$store.state.pricing.listModality || [];
        this.tiposEnvioDisponibles = this.$store.state.pricing.listShipment || [];
      } catch (error) {
        console.error('Error cargando datos para plantilla:', error);
      }
    },
    limpiarTarifas() {
      this.tarifasCotizacion = [];
      this.tarifasFlete = [];
      this.tarifasOrigen = [];
      this.tarifasDestino = [];
      this.tarifasLocal = [];
      this.tarifasAduana = [];
      this.tarifasAlmacen = [];
      this.tarifasGastosTerceros = [];
    },
  },
  computed: {
    modoPlantilla() {
      return this.modoEditor === 'plantilla';
    },
    mostrarFlete() {
      return this.tarifasFlete.length > 0;
    },
    mostrarOrigen() {
      return this.tarifasOrigen.length > 0;
    },
    mostrarDestino() {
      return this.tarifasDestino.length > 0;
    },
    mostrarLocal() {
      return this.tarifasLocal.length > 0;
    },
    mostrarAduana() {
      return this.tarifasAduana.length > 0;
    },
    mostrarAlmacen() {
      return this.tarifasAlmacen.length > 0;
    },
    mostrarGastosTerceros() {
      return this.tarifasGastosTerceros.length > 0;
    },
    totalFlete() {
      const total = this.tarifasFlete.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalOrigen() {
      const total = this.tarifasOrigen.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalDestino() {
      const total = this.tarifasDestino.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalLocal() {
      const total = this.tarifasLocal.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalAduana() {
      const total = this.tarifasAduana.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalAlmacen() {
      const total = this.tarifasAlmacen.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    },
    totalGastosTerceros() {
      const total = this.tarifasGastosTerceros.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
      return this.formatCurrency(total);
    }
  },
};
</script>

<style scoped>
</style>
