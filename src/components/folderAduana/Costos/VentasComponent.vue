<template>
  <v-container fluid>
    <!-- {{  valores }} -->
    <div class="">
      <span class="title"
        >Ventas {{ currencyFormat($store.state.aduana.totalVenta) }}</span
      >
      <v-btn icon color="primary" @click="abrirModal">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
    <v-dialog v-model="dialog" persistent max-width="30%">
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title> Nueva Venta </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  autocomplete="none"
                  :items="$store.state.aduana.listTipoCostos"
                  label="Tipo"
                  item-value="codigo"
                  item-title="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  label="Multiplicador"
                  :items="$store.state.aduana.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costounitario"
                >
                </v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="success" @click="guardarCosto()">Aceptar</v-btn>
            <v-btn color="red" @click="dialog = !dialog" dark>cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <v-expansion-panels class="condensed my-1" v-if="isFlete() && isImport()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "FL"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.flete) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esfleteflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.some(
                          (v) => v.id == valor.id_multiplicador
                        )
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ORIGEN -->
    <v-expansion-panels class="condensed my-1" v-if="isOrigen()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "OR"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.origen) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esorigenflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- LOCAL -->
    <v-expansion-panels class="condensed my-1" v-if="isLocal()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "LO"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.gasto) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.eslocalflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ADUANA -->
    <v-expansion-panels class="condensed my-1" v-if="isAduana()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "AD"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.aduana) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esaduanaflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.some(
                          (v) => v.id == valor.id_multiplicador
                        )
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels class="condensed my-1" v-if="isFlete() && !isImport()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "FL"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.flete) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esfleteflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="recalcularCostos()"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="recalcularCostos()"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="recalcularCostos"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="recalcularCostos"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- ALMACEN -->
    <v-expansion-panels class="condensed my-1" v-if="isAlmacen()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "AL"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.almacen) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style=""></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esalmacenflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- GASTOS DE TERCEROS -->
    <v-expansion-panels class="condensed my-1" v-if="isGastosTercero()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            $store.state.aduana.listTipoCostos.length > 0
              ? $store.state.aduana.listTipoCostos.filter(
                  (v) => v.codigo == "GT"
                )[0].name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.gastostercero) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style=""></th>

                <th style="">Conceptos</th>
                <th style="">Multipicador</th>
                <th class="derecha" style="">Costo Unitario</th>
                <th style="">Sub Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esgastostercerosflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    class="widthTD"
                    :items="$store.state.aduana.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                      isConfeccion(valor.code_cost) ||
                      isNotaCredito(valor.code_cost)
                    "
                  ></v-select>
                </td>

                <td class="colCostos">
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    max-width="50%"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    max-width="50%"
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>
                  <v-text-field
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.aduana.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                      !isITBM(valor.code_cost) &&
                      !isConfeccion(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    v-on:blur="calcTotales"
                  ></v-text-field>

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ($store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          $store.state.aduana.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          $store.state.aduana.datosPrincipales.volumen,
                          $store.state.aduana.datosPrincipales.peso,
                          $store.state.aduana.datosPrincipales.containers,
                          $store.state.aduana.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isConfeccion(valor.code_cost) &&
                    !isITBM(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        $store.state.aduana.datosPrincipales.amount,
                        $store.state.aduana.totalFlete,
                        $store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? $store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        $store.state.aduana.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 15)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td class="colCostos" v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td class="colCostos" v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td class="colCostos" v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script>
import mixins from "@/components/mixins/funciones";
export default {
  mixins: [mixins],
  props: ["valores", "actualizarCostosFlag", "amount"],
  data() {
    return {
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      dialog: false,

      fromDataService: {
        ventaFlag: 0,
        esopcionflag: 0,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 1,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      },
    };
  },
  mounted() {
    this.calcTotales();
  },
  methods: {
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.$store.state.aduana.listCostos =
        this.$store.state.aduana.listCostos.filter((v) => v.status == 1);
      setTimeout(() => {
        this.recalcularCostos();
      }, 10);
    },
    async calcTotales() {
      setTimeout(async () => {
        await this.calcularTotalesFlete();
        await this.calcularTotalesNoFlete();
        await this.calcTotal();
      }, 100);
    },
    calcularTotalesFlete() {
      this.totalOption = 0;
      this.resumenOpcion = {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      if (this.isFlete) {
        this.valores
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.resumenOpcion.flete +=
                (this.$store.state.aduana.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "N",
                  this.$store.state.aduana.datosPrincipales.volumen,
                  this.$store.state.aduana.datosPrincipales.peso,
                  this.$store.state.aduana.datosPrincipales.containers,
                  this.$store.state.aduana.datosPrincipales.amount
                );
            } else {
              this.resumenOpcion.flete += this.calcularValor(
                this.$store.state.aduana.datosPrincipales.amount,
                this.$store.state.aduana.totalFlete,
                this.$store.state.aduana.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].code
                  : "",
                this.$store.state.aduana.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5)
                )
                  ? this.$store.state.aduana.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 ||
                          v.code == 13 ||
                          v.code == 15 ||
                          v.code == 5)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          });
      }
    },
    calcularTotalesNoFlete() {
      this.resumenOpcion = {
        flete: this.resumenOpcion.flete,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };
      this.valores
        .filter((v) => v.status == 1)
        .forEach((element) => {
          //   GASTOS
          if (this.isOrigen) {
            if (element.esorigenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.origen +=
                  (this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.$store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.$store.state.aduana.datosPrincipales.volumen,
                    this.$store.state.aduana.datosPrincipales.peso,
                    this.$store.state.aduana.datosPrincipales.containers,
                    this.$store.state.aduana.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.origen += this.calcularValor(
                  this.$store.state.aduana.datosPrincipales.amount,
                  this.$store.state.aduana.totalFlete,
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.$store.state.aduana.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                    ? this.$store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          if (this.isLocal) {
            if (element.eslocalflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gasto +=
                  (this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.$store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.$store.state.aduana.datosPrincipales.volumen,
                    this.$store.state.aduana.datosPrincipales.peso,
                    this.$store.state.aduana.datosPrincipales.containers,
                    this.$store.state.aduana.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.gasto += this.calcularValor(
                  this.$store.state.aduana.datosPrincipales.amount,
                  this.$store.state.aduana.totalFlete,
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.$store.state.aduana.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                    ? this.$store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   ADUANA
          if (this.isAduana) {
            if (element.esaduanaflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.aduana +=
                  (this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.$store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.$store.state.aduana.datosPrincipales.volumen,
                    this.$store.state.aduana.datosPrincipales.peso,
                    this.$store.state.aduana.datosPrincipales.containers,
                    this.$store.state.aduana.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.aduana += this.calcularValor(
                  this.$store.state.aduana.datosPrincipales.amount,
                  this.$store.state.aduana.totalFlete,
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.$store.state.aduana.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                    ? this.$store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   ALMACEN
          if (this.isAlmacen) {
            if (element.esalmacenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.almacen +=
                  (this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.$store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.$store.state.aduana.datosPrincipales.volumen,
                    this.$store.state.aduana.datosPrincipales.peso,
                    this.$store.state.aduana.datosPrincipales.containers,
                    this.$store.state.aduana.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.almacen += this.calcularValor(
                  this.$store.state.aduana.datosPrincipales.amount,
                  this.$store.state.aduana.totalFlete,
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.$store.state.aduana.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                    ? this.$store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   GASTOS DE TERCEROS
          if (this.isGastosTercero) {
            if (element.esgastostercerosflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gastostercero +=
                  (this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.$store.state.aduana.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.$store.state.aduana.datosPrincipales.volumen,
                    this.$store.state.aduana.datosPrincipales.peso,
                    this.$store.state.aduana.datosPrincipales.containers,
                    this.$store.state.aduana.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.gastostercero += this.calcularValor(
                  this.$store.state.aduana.datosPrincipales.amount,
                  this.$store.state.aduana.totalFlete,
                  this.$store.state.aduana.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.$store.state.aduana.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.$store.state.aduana.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                    ? this.$store.state.aduana.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
        });
    },
    calcTotal() {
      this.$nextTick(() => {
        this.totalOption = 0;
        this.totalOption =
          (this.resumenOpcion.flete ? this.resumenOpcion.flete : 0) +
          (this.resumenOpcion.gasto ? this.resumenOpcion.gasto : 0) +
          (this.resumenOpcion.aduana ? this.resumenOpcion.aduana : 0) +
          (this.resumenOpcion.origen ? this.resumenOpcion.origen : 0) +
          (this.resumenOpcion.almacen ? this.resumenOpcion.almacen : 0) +
          (this.resumenOpcion.gastostercero
            ? this.resumenOpcion.gastostercero
            : 0);
       
        // this.$store.state.aduana.totalVenta = this.totalOption;
        this.$store.commit("setTotalVenta", this.totalOption);
      });
    },

    cerrarModalNuevoCosto() {
      this.$refs.frmNuevoCosto.reset();
      this.dialog = !this.dialog;
    },
    guardarCosto() {
      if (this.$refs.frmNuevoCosto.validate()) {
        if (this.fromDataService.idOpcion == "OR") {
          this.fromDataService.esorigenflag = 1;
        }
        if (this.fromDataService.idOpcion == "LO") {
          this.fromDataService.eslocalflag = 1;
        }
        if (this.fromDataService.idOpcion == "AD") {
          this.fromDataService.esaduanaflag = 1;
        }
        if (this.fromDataService.idOpcion == "AL") {
          this.fromDataService.esalmacenflag = 1;
        }
        if (this.fromDataService.idOpcion == "FL") {
          this.fromDataService.esfleteflag = 1;
        }
        if (this.fromDataService.idOpcion == "GT") {
          this.fromDataService.esgastostercerosflag = 1;
        }
        this.$store.state.aduana.opcionCostos
          .filter((v) => v.nro_propuesta == this.valores[0].nro_propuesta)[0]
          .listCostos.push(this.fromDataService);

        this.dialog = !this.dialog;
        this.calcTotales();
        this.$store.state.aduana.actualizarCostosFlag =
          !this.$store.state.aduana.actualizarCostosFlag;
        //
      }
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.limpiar();
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14, 15];

      let mul = this.$store.state.aduana.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code)
      );

      return !mul;
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isFlete() {
      let val = this.valores.some(
        (v) => v.esfleteflag == 1 && v.status == true
      );

      return val;
    },
    isOrigen() {
      let val = this.valores.some(
        (v) => v.esorigenflag == 1 && v.status == true
      );

      return val;
    },
    isLocal() {
      let val = this.valores.some(
        (v) => v.eslocalflag == 1 && v.status == true
      );
      return val;
    },

    isAduana() {
      let val = this.valores.some(
        (v) => v.esaduanaflag == 1 && v.status == true
      );
      return val;
    },
    isAlmacen() {
      let val = this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true
      );
      return val;
    },
    isGastosTercero() {
      let val = this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true
      );
      return val;
    },
    montoConfeccion(item) {
      let monto = 0;
      if (item.code_cost == 33) {
        let amount = this.$store.state.aduana.datosPrincipales.amount;
        let cif =
          parseFloat(amount) +
          parseFloat(this.$store.state.aduana.totalFlete) +
          (parseFloat(amount) +
            parseFloat(this.$store.state.aduana.totalFlete)) *
            0.01;

        if (cif < 5000) {
          monto = 50;
        }
        if (cif >= 5000 && cif < 10000) {
          monto = 80;
        }
        if (cif >= 10000) {
          monto = 80 + parseFloat(cif * 0.0025);
        }
      }

      item.costounitario = parseFloat(monto).toFixed(2);
      return this.currencyFormat(monto);
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isITBM(code) {
      return code == 38 ? true : false;
    },
    montoITBM(item) {
      let monto = 0;
      let code = [29, 36, 41, 68];
      if (item.code_cost == 38) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto += parseFloat(
            (this.$store.state.aduana.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador
            )
              ? this.$store.state.aduana.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0].valor
              : 0) *
              element.costounitario *
              this.calcularFac(
                this.$store.state.aduana.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador
                )
                  ? this.$store.state.aduana.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].code
                  : "N",
                this.$store.state.aduana.datosPrincipales.volumen,
                this.$store.state.aduana.datosPrincipales.peso,
                this.$store.state.aduana.datosPrincipales.containers,
                this.$store.state.aduana.datosPrincipales.amount
              )
          );
        });
      }
      item.costounitario = parseFloat(monto * 0.07).toFixed(2);
      return this.currencyFormat(parseFloat(monto * 0.07).toFixed(2));
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
    },
    montoNotaCredito(item) {
      let monto = 0;
      let code = [33];
      if (item.code_cost == 69) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto = element.costounitario;
        });
      }
      item.costounitario = -1 * parseFloat(monto * 0.5).toFixed(2);
      return this.currencyFormat(-1 * parseFloat(monto * 0.5).toFixed(2));
    },
    limpiar() {
      this.fromDataService = {
        ventaFlag: 0,
        esopcionflag: 0,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 1,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      };
    },
    isImport() {
      return this.$store.state.aduana.listModality.some(
        (v) =>
          v.id == this.$store.state.aduana.datosPrincipales.idsentido &&
          v.code == "I"
      );
    },
    recalcularCostos() {
      this.$store.state.aduana.actualizarCostosFlag =
        !this.$store.state.aduana.actualizarCostosFlag;
      this.calcTotales();
    },
    reponerCero(valor) {
      if (
        valor.costounitario == "" ||
        valor.costounitario == null ||
        valor.costounitario == undefined
      ) {
        valor.costounitario = 0;
      }
      this.$forceUpdate();
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    amount() {
      this.calcTotales();
    },
  },
  computed: {
    totalVenta() {
      return this.totalOption;
    },
  },
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-header
  .v-expansion-panel-content__wrap {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  padding: 2px 8px 2px;
  min-height: auto;
}
.widthTD {
  max-width: 250px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 30% !important;
  max-width: 30% !important;
}
.colConcepto {
  width: 45% !important;
  max-width: 45% !important;
  min-width: 45% !important;
}
.colCostos {
  width: 10% !important;
  max-width: 10% !important;
}
/* .tdMontos {
  width:  !important; 
} */

td {
  padding: 0 3px !important;
}
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-text-field__slot {
  max-width: 5px !important;
}

table td:nth-child(4) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  padding: 0 8px 16px !important;
}

.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 2px 0 2px !important;
}
</style>
