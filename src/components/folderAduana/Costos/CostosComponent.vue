<template>
  <v-container fluid>
    <div class="">
      <v-row>
        <v-col cols="4" class="my-1 py-2">
          <span class="text-headline-small">
            Costos {{ currencyFormat($store.state.aduana.totalCosto) }}
            <v-btn variant="text" icon color="primary" @click="abrirModal">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
    <!-- ss{{ this.valores }} -->
    <div id="FleteImport" v-if="mostrarFleteImport" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueFleteImport">
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  $store.state.aduana.listTipoCostos.length > 0
                    ? $store.state.aduana.listTipoCostos.filter(
                        (v) => v.codigo == "FL"
                      )[0].name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnFleteImportFlag">
          <v-btn color="success" @click="comprobarFleteImport()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Origen" v-if="mostrarOrigen" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueOrigen">
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

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esorigenflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          menu-icon=""
                          hide-details
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnOrigenFlag">
          <v-btn color="success" @click="comprobarOrigen()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <div id="Local" v-if="mostrarLocal" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueLocal">
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
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.eslocalflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnLocalFlag">
          <v-btn color="success" @click="comprobarLocal()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Aduana" v-if="mostrarAduana" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueAduana">
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

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esaduanaflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnAduanaFlag">
          <v-btn color="success" @click="comprobarAduana()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="FleteExport" v-if="mostrarFleteExport" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueFleteExport">
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  $store.state.aduana.listTipoCostos.length > 0
                    ? $store.state.aduana.listTipoCostos.filter(
                        (v) => v.codigo == "FL"
                      )[0].name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.aduana.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnFleteExportFlag">
          <v-btn color="success" @click="comprobarFleteExport()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Almacen" v-if="mostrarAlmacen" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueAlmacen">
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
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esalmacenflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style=""></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            ($store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code == 14 ||
                              $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code == 5) &&
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnAlmacenFlag">
          <v-btn color="success" @click="comprobarAlmacen()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="gastosTerceros" v-if="mostrarGastosTerceros" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueGastosTerceros">
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
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esgastostercerosflag == 1)
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style=""></th>
                      <th style="">Proveedor</th>
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
                        <v-btn variant="text"
                          icon
                          color="red"
                          size="x-small"
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          density="compact"
                          item-title="namelong"
                          item-value="id"
                          :items="$store.state.provedores"
                          v-model="valor.id_proveedor"
                          @update:search="recargarProveedores"
                          hide-details
                          menu-icon=""
                        >
                          <template #append-inner>
                            <v-icon
                              icon="mdi-plus"
                              @mousedown.stop
                              @click.stop="abrirModalRegistroProveedor(valor)"
                            />
                          </template>
                        </v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          density="compact"
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select item-title="text"
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
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
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
                                (v.code == 13 || v.code == 14 || v.code == 15)
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
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
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            ($store.state.aduana.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code == 14 ||
                              $store.state.aduana.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code == 5) &&
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
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          density="compact"
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
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
                                  (v.code == 14 ||
                                    v.code == 13 ||
                                    v.code == 15 ||
                                    v.code == 5)
                              )
                                ? $store.state.aduana.listMultiplicador.some(
                                    (v) =>
                                      v.id == valor.id_multiplicador &&
                                      (v.code == 14 ||
                                        v.code == 13 ||
                                        v.code == 15 ||
                                        v.code == 5)
                                  )
                                  ? valor.cif
                                  : valor.seguro
                                : 0
                            )
                          )
                        }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnGastosTercerosFlag">
          <v-btn color="success" @click="comprobarGastosTerceros()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="dialog" persistent max-width="30%">
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title> Nuevo Costo </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  density="compact"
                  autocomplete="none"
                  :items="tipoOpcion"
                  label="Tipo"
                  item-value="codigo"
                  item-title="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  density="compact"
                  label="Proveedor"
                  item-title="namelong"
                  item-value="id"
                  :items="$store.state.provedores"
                  v-model="fromDataService.id_proveedor"
                  @update:search="recargarProveedores"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete item-title="text"
                  density="compact"
                  label="Multiplicador"
                  :items="$store.state.aduana.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  density="compact"
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
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
              <v-col cols="12" class="my-0 py-0">
                <v-alert
                  variant="outlined"
                  type="warning"
                  prominent
                  border="start"
                  class="px-5 mx-5"
                  density="compact"
                >
                  El concepto se verá reflejado al abrir la sección
                  correspondiente.
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" @click="guardarCosto()">Aceptar</v-btn>
            <v-btn color="red" @click="dialog = !dialog">cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <v-dialog v-model="dialogNuevoProveedor" persistent max-width="80%">
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          Ficha de Proveedores <v-spacer></v-spacer>
          <v-btn variant="text"
            icon
            color="red"
            @click="dialogNuevoProveedor = !dialogNuevoProveedor"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <NuevoProveedorComponentVue
            :isPricing="true"
            v-show="dialogNuevoProveedor"
            @GuardarProveedorExiste="guardarProveedorE"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            v-if="mostrarBtnRegistroProveedor()"
            @click="nuevoProveedor()"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import NuevoProveedorComponentVue from "@/components/folderEntities/Proveedor/NuevoProveedorComponent.vue";
import mixins from "@/components/mixins/funciones.js";
export default {
  mixins: [mixins],
  props: [
    "valores",
    "actualizarCostosFlag",
    "amount",
    "index",
    "recargarSegmentos",
  ],
  components: { NuevoProveedorComponentVue },
  data() {
    return {
      costo: {},
      dialogNuevoProveedor: false,
      totalOption: 0,
      valueFleteImport: 0,
      valueOrigen: 0,
      valueLocal: 0,
      valueAduana: 0,
      valueFleteExport: 0,
      valueAlmacen: 0,
      valueGastosTerceros: 0,
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      dialog: false,
      // -----------------------------
      mostrarBtnFleteImportFlag: true,
      mostrarBtnOrigenFlag: true,
      mostrarBtnLocalFlag: true,
      mostrarBtnAduanaFlag: true,
      mostrarBtnFleteExportFlag: true,
      mostrarBtnAlmacenFlag: true,
      mostrarBtnGastosTercerosFlag: true,
      // -----------------------------

      // -----------------------------
      mostrarFleteImportFlag: false,
      mostrarOrigenFlag: false,
      mostrarLocalFlag: false,
      mostrarAduanaFlag: false,
      mostrarFleteExportFlag: false,
      mostrarAlmacenFlag: false,
      mostrarGastosTercerosFlag: false,
      // -----------------------------
      fromDataService: {
        ventaFlag: 0,
        esopcionflag: 1,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        esgastostercerosflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 0,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
        id: 0,
      },
    };
  },
  async mounted() {
    this.calcTotales();
    this.$store.state.aduana.mostrarGuardarCostos = false;
    await this.habilidarPrimeraAccion();
    if (!!this.index) {
      this.habilidarCuandoYaHayOpciones();
    }
  },
  methods: {
    ...mapActions([
      "guardarProveedor",
      "cargarProveedores",
      "cargarProveedores",
    ]),
    async recargarProveedores(e) {
      let opciones = [...this.$store.state.aduana.opcionCostos];
      let IdProveedor = [];
      opciones.forEach((opcion) => {
        opcion.listCostos.forEach((costo) => {
          if (!IdProveedor.some((v) => v == costo.id_proveedor))
            IdProveedor.push(costo.id_proveedor);
        });
      });
      await this.cargarProveedores({
        id: IdProveedor.join(","),
        search: e,
      });
    },
    async nuevoProveedor() {
      let res = await this.guardarProveedor();
      if (!!res.estadoflag) {
        await this.cargarProveedores();
        this.costo.id_proveedor = res.data[0].id_entitie;
        this.dialogNuevoProveedor = false;
      }
    },
    isITBM(code) {
      return code == 38 ? true : false;
    },
    guardarProveedorE(val) {
      this.costo.id_proveedor = val;
      this.dialogNuevoProveedor = false;
    },
    abrirModalRegistroProveedor(item) {
      this.costo = item;
      this.dialogNuevoProveedor = true;
    },
    mostrarBtnRegistroProveedor() {
      if (!this.$store.state.entities.proveedor.nombrecompleto) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_tipoproveedor) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_tipotransaccion) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_pais) {
        return false;
      }
      return true;
    },
    habilidarCuandoYaHayOpciones() {
      this.$nextTick(() => {
        if (this.isFlete && this.isImport) {
          this.mostrarFleteImportFlag = true;
        }
        if (this.isOrigen) {
          this.mostrarOrigenFlag = true;
        }
        if (this.isLocal) {
          this.mostrarLocalFlag = true;
        }

        if (this.isAduana) {
          this.mostrarAduanaFlag = true;
        }
        if (this.isFlete && !this.isImport) {
          this.mostrarFleteExportFlag = true;
        }
        if (this.isAlmacen) {
          this.mostrarAlmacenFlag = true;
        }
        if (this.isGastosTercero) {
          this.mostrarGastosTercerosFlag = true;
        }
        this.mostrarBtnFleteImportFlag = false;
        this.mostrarBtnOrigenFlag = false;
        this.mostrarBtnLocalFlag = false;
        this.mostrarBtnAduanaFlag = false;
        this.mostrarBtnFleteExportFlag = false;
        this.mostrarBtnAlmacenFlag = false;
        this.mostrarBtnGastosTercerosFlag = false;
        this.valueFleteImport = 1;
        this.valueOrigen = 1;
        this.valueLocal = 1;
        this.valueAduana = 1;
        this.valueFleteExport = 1;
        this.valueAlmacen = 1;
        this.valueGastosTerceros = 1;
        this.$forceUpdate();
      });
    },
    async habilidarPrimeraAccion() {
      if (this.isFlete && this.isImport) {
        this.mostrarFleteImportFlag = true;
        return true;
      }
      if (this.isOrigen) {
        this.mostrarOrigenFlag = true;
        return true;
      }
      if (this.isLocal) {
        this.mostrarLocalFlag = true;
        return true;
      }

      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
        return true;
      }
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        return true;
      }
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },
    async comprobarFleteImport() {
      this.valores
        .filter((v) => v.esfleteflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esfleteflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteFleteImport();
        this.valueFleteImport = 1;
        this.mostrarBtnFleteImportFlag = false;
      }
    },
    mostrarSiguienteFleteImport() {
      if (this.isOrigen) {
        this.mostrarOrigenFlag = true;
        return true;
      }
      if (this.isLocal) {
        this.mostrarLocalFlag = true;
        return true;
      }
      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
        return true;
      }
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        return true;
      }

      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
      this.$store.state.aduana.mostrarGuardarCostos = true;
    },
    async comprobarOrigen() {
      this.valores
        .filter((v) => v.esorigenflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esorigenflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteOrigen();
        this.valueOrigen = 1;
        this.mostrarBtnOrigenFlag = false;
        if (
          !this.mostrarSiguienteOrigen() &&
          !this.mostrarSiguienteLocal() &&
          !this.mostrarSiguienteFleteExport() &&
          !this.mostrarSiguienteAduana()
        ) {
          this.$store.state.aduana.mostrarGuardarCostos = true;
        }
      }
    },
    mostrarSiguienteOrigen() {
      if (this.isLocal) {
        this.mostrarLocalFlag = true;
        return true;
      }
      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
        return true;
      }
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        return true;
      }

      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },
    async comprobarLocal() {
      this.valores
        .filter((v) => v.eslocalflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.eslocalflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteLocal();
        this.valueLocal = 1;
        this.mostrarBtnLocalFlag = false;
        if (
          !this.mostrarSiguienteLocal() &&
          !this.mostrarSiguienteFleteExport() &&
          !this.mostrarSiguienteAduana()
        ) {
          this.$store.state.aduana.mostrarGuardarCostos = true;
        }
      }
    },
    mostrarSiguienteLocal() {
      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
        return true;
      }
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        return true;
      }
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },

    async comprobarAduana() {
      this.valores
        .filter((v) => v.esaduanaflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esaduanaflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteFleteExport();
        this.valueAduana = 1;
        this.mostrarBtnAduanaFlag = false;
        if (
          !this.mostrarSiguienteFleteExport() &&
          !this.mostrarSiguienteAduana()
        ) {
          this.$store.state.aduana.mostrarGuardarCostos = true;
        }
      }
    },
    mostrarSiguienteAduana() {
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        this.mostrarAlmacenFlag = false;
        return true;
      }

      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },

    async comprobarFleteExport() {
      this.valores
        .filter((v) => v.esfleteflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esfleteflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteAlmacen();
        this.valueFleteExport = 1;
        this.mostrarBtnFleteExportFlag = false;
        if (!this.mostrarSiguienteAlmacen()) {
          this.$store.state.aduana.mostrarGuardarCostos = true;
        }
      }
    },
    mostrarSiguienteFleteExport() {
      if (this.isFlete && !this.isImport) {
        this.mostrarFleteExportFlag = true;
        return true;
      }
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },
    mostrarSiguienteAlmacen() {
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },
    async comprobarAlmacen() {
      this.valores
        .filter((v) => v.esalmacenflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true && v.error != ""
      );

      if (val) {
        await this.mostrarSiguienteGastosTercero();
        this.valueAlmacen = 1;
        this.mostrarBtnAlmacenFlag = false;
        if (!this.mostrarSiguienteGastosTercero()) {
          this.$store.state.aduana.mostrarGuardarCostos = true;
        }
      }
    },

    mostrarSiguienteGastosTercero() {
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }
    },

    async comprobarGastosTerceros() {
      this.valores
        .filter((v) => v.esgastostercerosflag == 1 && v.status == true)
        .forEach((element) => {
          let res = this.validateCost({ costo: element });

          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      let val = !this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true && v.error != ""
      );
      if (val) {
        this.valueGastosTerceros = 1;
        this.mostrarBtnGastosTercerosFlag = false;
        this.$store.state.aduana.mostrarGuardarCostos = true;
      }
    },

    // mostrarGuardarCostosF() {

    //   if (!this.valores.some((v) => v.status == true && v.error != "")) {
    //     this.$store.state.aduana.mostrarGuardarCostos = true;
    //   }
    // },
    validateCost({ costo }) {
      let service = this.$store.state.aduana.listServices.filter(
        (v) => v.status == 1
      );
      let multiplocadores = this.$store.state.aduana.listMultiplicador.filter(
        (v) => {
          return this.comienzaNoConCaracter(v.text, "%");
        }
      );
      let idMultiplicador = multiplocadores.map((v) => v.id);
      let idServices = service.map((v) => v.id_groupservices);
      if (
        !!idMultiplicador.includes(costo.id_multiplicador) &&
        !!idServices.includes(costo.id_groupservices) &&
        !!(costo.costounitario == 0)
      ) {
        return true;
      } else {
        return false;
      }
    },
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.$store.state.aduana.listCostos =
        this.$store.state.aduana.listCostos.filter((v) => v.status == 1);
      setTimeout(() => {
        this.calcTotales();
      }, 10);
    },

    async calcTotales() {
      setTimeout(async () => {
        // this.$store.state.aduana.totalFlete = 0.0;
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

        this.$store.state.aduana.totalCosto = this.totalOption;
        // this.setTotalOpcion(valores);
      });
    },
    cerrarModalNuevoCosto() {
      // this.$refs.frmNuevoCosto.reset();
      this.dialog = !this.dialog;
    },
    guardarCosto() {
      switch (this.fromDataService.idOpcion) {
        case "GT":
          this.fromDataService.esgastostercerosflag = 1;
          break;
        case "FL":
          this.fromDataService.esfleteflag = 1;
          break;
        case "OR":
          this.fromDataService.esorigenflag = 1;
          break;
        case "LO":
          this.fromDataService.eslocalflag = 1;
          break;
        case "AD":
          this.fromDataService.esaduanaflag = 1;
          break;
        case "AL":
          this.fromDataService.esalmacenflag = 1;
          break;
      }

      this.$store.state.aduana.opcionCostos
        .filter((v) => v.nro_propuesta == this.valores[0].nro_propuesta)[0]
        .listCostos.push(this.fromDataService);

      this.dialog = !this.dialog;
      this.$forceUpdate();
      this.calcTotales();
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14, 15];

      let mul = this.$store.state.aduana.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code)
      );

      return !mul;
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.$nextTick(() => {
        this.$refs.frmNuevoCosto.resetValidation();
      });
      this.limpiar();
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
        esopcionflag: 1,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 0,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      };
    },

    mostrarAdvertencia(data) {
      return data.some(
        (v) => v.status == 1 && v.error != null && v.error !== ""
      );
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    actualizarCostosFlag() {
      this.calcTotales();
    },
    amount() {
      this.calcTotales();
    },
    cancelarLlenadoNuevaOpcion() {
      // this.habilidarPrimeraAccion();
      this.mostrarSiguienteFleteImport();
      this.mostrarSiguienteOrigen();
      this.mostrarSiguienteLocal();
      this.mostrarSiguienteAduana();
      this.mostrarSiguienteFleteExport();
      this.valueFleteImport = 1;
      this.valueOrigen = 1;
      this.valueLocal = 1;
      this.valueAduana = 1;
      this.valueAlmacen = 1;
      this.valueFleteExport = 1;
      this.mostrarBtnFleteImportFlag = false;
      this.mostrarBtnOrigenFlag = false;
      this.mostrarBtnLocalFlag = false;
      this.mostrarBtnAduanaFlag = false;
      this.mostrarBtnFleteExportFlag = false;
      this.mostrarBtnAlmacenFlag = false;
      this.$store.state.aduana.mostrarGuardarCostos = true;
    },
    totalFlete() {
      this.calcTotales();
    },
    idProveedor() {
      console.log("idProveedor", this.idProveedor);
    },
    recargarSegmentos() {
      this.habilidarCuandoYaHayOpciones();
    },
  },
  computed: {
    cancelarLlenadoNuevaOpcion: {
      get() {
        return this.$store.state.aduana.cancelarLlenadoNuevaOpcion;
      },
      set(val) {
        return (this.$store.state.aduana.cancelarLlenadoNuevaOpcion =
          cancelarLlenadoNuevaOpcion);
      },
    },
    totalFlete: {
      get() {
        return this.$store.state.aduana.totalFlete;
      },
      set(val) {
        return (this.$store.state.aduana.totalFlete = totalFlete);
      },
    },
    mostrarFleteImport() {
      return this.isImport && this.mostrarFleteImportFlag;
    },
    mostrarOrigen() {
      return this.mostrarOrigenFlag;
    },
    mostrarLocal() {
      return this.mostrarLocalFlag;
    },
    mostrarAduana() {
      return this.mostrarAduanaFlag;
    },
    mostrarFleteExport() {
      return !this.isImport && this.mostrarFleteExportFlag;
    },
    mostrarAlmacen() {
      return this.mostrarAlmacenFlag;
    },
    mostrarGastosTerceros() {
      return this.mostrarGastosTercerosFlag;
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

    isGastosTercero() {
      let val = this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true
      );
      return val;
    },
    isAlmacen() {
      let val = this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true
      );
      return val;
    },

    isImport() {
      return this.$store.state.aduana.listModality.some(
        (v) =>
          v.id == this.$store.state.aduana.datosPrincipales.idsentido &&
          v.code == "I"
      );
    },
    tipoOpcion() {
      let tipoOpcion = [];
      this.$store.state.aduana.listTipoCostos.forEach((element) => {
        switch (element.codigo) {
          case "GT":
            if (this.mostrarGastosTerceros) {
              tipoOpcion.push(element);
            }
            break;
          case "FL":
            if (this.mostrarFleteImport || this.mostrarFleteExport) {
              tipoOpcion.push(element);
            }
            break;
          case "OR":
            if (this.mostrarOrigen) {
              tipoOpcion.push(element);
            }
            break;
          case "LO":
            if (this.mostrarLocal) {
              tipoOpcion.push(element);
            }
            break;
          case "AD":
            if (this.mostrarAduana) {
              tipoOpcion.push(element);
            }
            break;
          case "AL":
            if (this.mostrarAlmacen) {
              tipoOpcion.push(element);
            }
            break;

          default:
            break;
        }
      });
      return tipoOpcion;
    },
  },
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-title
  .v-expansion-panel-text__wrapper {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  /* padding: 2px 8px 2px; */
  min-height: auto;
}
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 20% !important;
  max-width: 20% !important;
}
.colConcepto {
  width: 35% !important;
  max-width: 35% !important;
  min-width: 35% !important;
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
.v-field__input {
  max-width: 5px !important;
}

table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(6) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  /* padding: 0 8px 16px !important; */
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 0px !important;
}
</style>
