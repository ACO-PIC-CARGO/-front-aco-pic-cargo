<script setup lang="ts">
import { computed } from "vue";
import type { CatalogScreen } from "@/types/roles";
import { ACTIONS, actionLabel, grantedCount, setActions } from "@/utils/permissionGrants";
import type { GrantCell, Grants } from "@/utils/permissionGrants";

interface ScreenGroup {
  id: number;
  name: string;
  screens: CatalogScreen[];
}

interface ScreenModule {
  id: number;
  name: string;
  groups: ScreenGroup[];
}

const props = defineProps<{ catalog: CatalogScreen[]; readonly?: boolean }>();
const grants = defineModel<Grants>({ required: true });

const modules = computed(() => {
  const result: ScreenModule[] = [];
  for (const screen of [...props.catalog].sort((a, b) => a.module_order - b.module_order)) {
    let module = result.find((candidate) => candidate.id === screen.module_id);
    if (!module) result.push((module = { id: screen.module_id, name: screen.module, groups: [] }));
    let group = module.groups.find((candidate) => candidate.id === screen.group_id);
    if (!group) module.groups.push((group = { id: screen.group_id, name: screen.group_name, screens: [] }));
    group.screens.push(screen);
  }
  return result;
});

const offers = (screen: CatalogScreen, action: string) => screen.actions.some((offered) => offered.name === action);
const canGrant = (screen: CatalogScreen, action: string) =>
  !props.readonly && screen.actions.some((offered) => offered.name === action && offered.grantable);
const isGranted = (cell: GrantCell) => (grants.value[cell.menuId] ?? []).includes(cell.action);

const grantableCells = (screens: CatalogScreen[], actions: readonly string[]): GrantCell[] =>
  screens.flatMap((screen) =>
    actions.filter((action) => canGrant(screen, action)).map((action) => ({ menuId: screen.menu_id, action })),
  );
const moduleScreens = (module: ScreenModule) => module.groups.flatMap((group) => group.screens);
const columnCells = (action: string) => grantableCells(props.catalog, [action]);
const allGranted = (cells: GrantCell[]) => cells.length > 0 && cells.every(isGranted);

const countLabel = (screens: CatalogScreen[]) => {
  const { granted, total } = grantedCount(screens, grants.value);
  return `${granted} de ${total}`;
};

function toggle(cells: GrantCell[], on: boolean | null) {
  grants.value = setActions(grants.value, cells, !!on);
}
</script>

<template>
  <div>
    <div
      v-if="!readonly && modules.length"
      class="d-flex flex-wrap align-center ga-2 mb-3"
    >
      <span class="text-body-medium font-weight-medium mr-2">Todas las pantallas:</span>
      <v-checkbox-btn
        v-for="action in ACTIONS"
        :key="action"
        class="flex-0-0"
        density="compact"
        :label="actionLabel(action)"
        :model-value="allGranted(columnCells(action))"
        :disabled="!columnCells(action).length"
        :aria-label="`${actionLabel(action)} en todas las pantallas`"
        @update:model-value="toggle(columnCells(action), $event)"
      />
    </div>

    <p
      v-if="!modules.length"
      class="text-center text-medium-emphasis py-6"
    >
      No encontramos pantallas para asignar. Vuelve a abrir esta pantalla; si sigue vacía, pide ayuda a un
      administrador de tu empresa.
    </p>

    <v-expansion-panels
      multiple
      variant="accordion"
    >
      <v-expansion-panel
        v-for="module in modules"
        :key="module.id"
      >
        <v-expansion-panel-title>
          <strong class="flex-grow-1">{{ module.name }}</strong> <span class="mr-4 text-body-small text-medium-emphasis">{{ countLabel(moduleScreens(module)) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-checkbox-btn
            v-if="!readonly"
            class="mb-2"
            density="compact"
            label="Seleccionar todo"
            :model-value="allGranted(grantableCells(moduleScreens(module), ACTIONS))"
            :disabled="!grantableCells(moduleScreens(module), ACTIONS).length"
            :aria-label="`Seleccionar todo en ${module.name}`"
            @update:model-value="toggle(grantableCells(moduleScreens(module), ACTIONS), $event)"
          />
          <v-expansion-panels
            multiple
            variant="accordion"
          >
            <v-expansion-panel
              v-for="group in module.groups"
              :key="group.id"
            >
              <v-expansion-panel-title>
                <span class="flex-grow-1 font-weight-medium">{{ group.name }}</span> <span class="mr-4 text-body-small text-medium-emphasis">{{ countLabel(group.screens) }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-checkbox-btn
                  v-if="!readonly"
                  density="compact"
                  label="Seleccionar todo"
                  :model-value="allGranted(grantableCells(group.screens, ACTIONS))"
                  :disabled="!grantableCells(group.screens, ACTIONS).length"
                  :aria-label="`Seleccionar todo en ${group.name}`"
                  @update:model-value="toggle(grantableCells(group.screens, ACTIONS), $event)"
                />
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Pantalla</th>
                      <th
                        v-for="action in ACTIONS"
                        :key="action"
                        class="text-center"
                      >
                        {{ actionLabel(action) }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="screen in group.screens"
                      :key="screen.menu_id"
                    >
                      <td>{{ screen.screen }}</td>
                      <td
                        v-for="action in ACTIONS"
                        :key="action"
                        class="text-center"
                      >
                        <v-checkbox-btn
                          v-if="offers(screen, action)"
                          class="justify-center"
                          density="compact"
                          :model-value="isGranted({ menuId: screen.menu_id, action })"
                          :disabled="!canGrant(screen, action)"
                          :aria-label="`${actionLabel(action)} en ${screen.screen}`"
                          @update:model-value="toggle([{ menuId: screen.menu_id, action }], $event)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
