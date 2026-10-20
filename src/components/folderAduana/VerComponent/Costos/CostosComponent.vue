<template>
  <v-container fluid>
    <div class="">
      <span class="text-headline-small">
        Costos {{ currencyFormat(aduanaStore.totalCosto) }}</span
      >
    </div>
    <v-expansion-panels class="condensed my-1" v-if="isFlete() && isImport()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                  (v) => v.codigo == "FL"
                )[0].name
              : ""
          }}:

          <span>{{ currencyFormat(resumenOpcion.flete) }} </span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
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
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels class="condensed my-1" v-if="isOrigen()">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
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
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
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
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                  (v) => v.codigo == "FL"
                )[0].name
              : ""
          }}:

          <span>{{ currencyFormat(resumenOpcion.flete) }} </span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    reaonly
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
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
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    density="compact"
                    item-title="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select item-title="text"
                    readonly
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
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
                    readonly
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    density="compact"
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      (aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0].valor
                        : 0) *
                        valor.costounitario *
                        calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador
                              )[0].code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )
                    )
                  }}
                </td>

                <td
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
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0].code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? aduanaStore.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 14 || v.code == 13)
                            )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
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
import mixins from "../../../mixins/funciones.js";
import { mapStores } from "pinia";
import { useAduanaStore } from "@/stores/aduana";
export default {
  mixins: [mixins],
  props: ["valores", "actualizarCostosFlag"],
  data() {
    return {
      totalOption: 0,
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
      },
    };
  },
  mounted() {
    this.calcTotales();
  },
  methods: {
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.aduanaStore.listCostos =
        this.aduanaStore.listCostos.filter((v) => v.status == 1);
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

      if (this.isFlete()) {
        this.valores
          .filter(
            (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1
          )
          .forEach((element) => {
            if (this.isNotPorcentaje(element, element.id_multiplicador)) {
              this.resumenOpcion.flete +=
                (this.aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].valor
                  : 0) *
                element.costounitario *
                this.calcularFac(
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "N",
                  this.aduanaStore.datosPrincipales.volumen,
                  this.aduanaStore.datosPrincipales.peso,
                  this.aduanaStore.datosPrincipales.containers,
                  this.aduanaStore.datosPrincipales.amount
                );
            } else {
              this.resumenOpcion.flete += this.calcularValor(
                this.aduanaStore.datosPrincipales.amount,
                this.aduanaStore.totalFlete,
                this.aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].code
                  : "",
                this.aduanaStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? this.aduanaStore.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13)
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
          if (this.isOrigen()) {
            if (element.esorigenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.origen +=
                  (this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.aduanaStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.aduanaStore.datosPrincipales.volumen,
                    this.aduanaStore.datosPrincipales.peso,
                    this.aduanaStore.datosPrincipales.containers,
                    this.aduanaStore.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.origen += this.calcularValor(
                  this.aduanaStore.datosPrincipales.amount,
                  this.aduanaStore.totalFlete,
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5)
                  )
                    ? this.aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          if (this.isLocal()) {
            if (element.eslocalflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gasto +=
                  (this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.aduanaStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.aduanaStore.datosPrincipales.volumen,
                    this.aduanaStore.datosPrincipales.peso,
                    this.aduanaStore.datosPrincipales.containers,
                    this.aduanaStore.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.gasto += this.calcularValor(
                  this.aduanaStore.datosPrincipales.amount,
                  this.aduanaStore.totalFlete,
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5)
                  )
                    ? this.aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   ADUANA
          if (this.isAduana()) {
            if (element.esaduanaflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.aduana +=
                  (this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.aduanaStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.aduanaStore.datosPrincipales.volumen,
                    this.aduanaStore.datosPrincipales.peso,
                    this.aduanaStore.datosPrincipales.containers,
                    this.aduanaStore.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.aduana += this.calcularValor(
                  this.aduanaStore.datosPrincipales.amount,
                  this.aduanaStore.totalFlete,
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5)
                  )
                    ? this.aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   ALMACEN
          if (this.isAlmacen()) {
            if (element.esalmacenflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.almacen +=
                  (this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.aduanaStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.aduanaStore.datosPrincipales.volumen,
                    this.aduanaStore.datosPrincipales.peso,
                    this.aduanaStore.datosPrincipales.containers,
                    this.aduanaStore.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.almacen += this.calcularValor(
                  this.aduanaStore.datosPrincipales.amount,
                  this.aduanaStore.totalFlete,
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5)
                  )
                    ? this.aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13)
                      )
                      ? element.cif
                      : element.seguro
                    : 0
                );
              }
            }
          }
          //   GASTOS TERCEROS
          if (this.isGastosTercero()) {
            if (element.esgastostercerosflag == 1) {
              if (this.isNotPorcentaje(element, element.id_multiplicador)) {
                this.resumenOpcion.gastostercero +=
                  (this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  this.calcularFac(
                    this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    ).length > 0
                      ? this.aduanaStore.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador
                        )[0].code
                      : "N",
                    this.aduanaStore.datosPrincipales.volumen,
                    this.aduanaStore.datosPrincipales.peso,
                    this.aduanaStore.datosPrincipales.containers,
                    this.aduanaStore.datosPrincipales.amount
                  );
              } else {
                this.resumenOpcion.gastostercero += this.calcularValor(
                  this.aduanaStore.datosPrincipales.amount,
                  this.aduanaStore.totalFlete,
                  this.aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  ).length > 0
                    ? this.aduanaStore.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador
                      )[0].code
                    : "",
                  this.aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5)
                  )
                    ? this.aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13)
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
      this.totalOption = 0;
      this.totalOption =
        this.resumenOpcion.flete +
        this.resumenOpcion.gasto +
        this.resumenOpcion.aduana +
        this.resumenOpcion.origen +
        this.resumenOpcion.almacen +
        this.resumenOpcion.gastostercero;

      this.aduanaStore.totalCosto = this.totalOption;
      // this.setTotalOpcion(valores);
    },
    cerrarModalNuevoCosto() {
      // this.$refs.frmNuevoCosto.reset();
      this.dialog = !this.dialog;
    },
    async guardarCosto() {
      if ((await this.$refs.frmNuevoCosto.validate()).valid) {
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
        this.aduanaStore.listCostos.push(this.fromDataService);
        this.dialog = !this.dialog;
        this.calcTotales();
        // this.$refs.frmNuevoCosto.reset();
        //
      }
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14];

      let mul = this.aduanaStore.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code)
      );

      return !mul;
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.limpiar();
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
    isConfeccion(code) {
      return code == 33 ? true : false;
    },

    montoConfeccion(item) {
      let monto = 0;
      if (item.code_cost == 33) {
        let amount = this.aduanaStore.datosPrincipales.amount;
        let cif =
          parseFloat(amount) +
          parseFloat(this.aduanaStore.totalFlete) +
          (parseFloat(amount) +
            parseFloat(this.aduanaStore.totalFlete)) *
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
            (this.aduanaStore.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador
            )
              ? this.aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0].valor
              : 0) *
              element.costounitario *
              this.calcularFac(
                this.aduanaStore.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador
                )
                  ? this.aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0].code
                  : "N",
                this.aduanaStore.datosPrincipales.volumen,
                this.aduanaStore.datosPrincipales.peso,
                this.aduanaStore.datosPrincipales.containers,
                this.aduanaStore.datosPrincipales.amount
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
    isImport() {
      return this.aduanaStore.listModality.some(
        (v) =>
          v.id == this.aduanaStore.datosPrincipales.idsentido &&
          v.code == "I"
      );
    },
    mostrarAdvertencia(data) {
      return data.some(
        (v) => v.status == 1 && v.error != null && v.error !== ""
      );
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    actualizarCostosFlag() {
      this.calcTotales();
    },
  },
  computed: {
    ...mapStores(useAduanaStore),
  },
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-title
  .v-expansion-panel-text__wrapper {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  padding: 2px 8px 2px;
  min-height: auto;
}
.widthTD {
  width: 150px !important;
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
  padding: 0 8px 16px !important;
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 2px 0 2px !important;
}
</style>
