<script setup lang="ts">
import { computed } from "vue";
import type { CatalogScreen } from "@/types/roles";
import { ACTIONS, actionLabel, setActions } from "@/utils/permissionGrants";
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
const moduleCells = (module: ScreenModule) =>
  grantableCells(
    module.groups.flatMap((group) => group.screens),
    ACTIONS,
  );
const columnCells = (action: string) => grantableCells(props.catalog, [action]);
const allGranted = (cells: GrantCell[]) => cells.length > 0 && cells.every(isGranted);

function toggle(cells: GrantCell[], on: boolean | null) {
  grants.value = setActions(grants.value, cells, !!on);
}
</script>

<template>
  <v-table
    density="compact"
    fixed-header
    height="60vh"
  >
    <thead>
      <tr>
        <th>Pantalla</th>
        <th
          v-for="action in ACTIONS"
          :key="action"
          class="text-center"
        >
          {{ actionLabel(action) }}
          <v-checkbox-btn
            v-if="!readonly"
            class="justify-center"
            density="compact"
            :model-value="allGranted(columnCells(action))"
            :disabled="!columnCells(action).length"
            :aria-label="`${actionLabel(action)} en todas las pantallas`"
            @update:model-value="toggle(columnCells(action), $event)"
          />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!modules.length">
        <td
          :colspan="ACTIONS.length + 1"
          class="text-center text-medium-emphasis py-6"
        >
          No encontramos pantallas para asignar. Vuelve a abrir esta pantalla; si sigue vacía, pide ayuda a un
          administrador de tu empresa.
        </td>
      </tr>
      <template
        v-for="module in modules"
        :key="module.id"
      >
        <tr class="bg-surface-light">
          <td :colspan="ACTIONS.length + 1">
            <div class="d-flex align-center">
              <strong>{{ module.name }}</strong>
              <v-checkbox-btn
                v-if="!readonly"
                class="ml-4 flex-grow-0"
                density="compact"
                label="Seleccionar todo"
                :model-value="allGranted(moduleCells(module))"
                :disabled="!moduleCells(module).length"
                :aria-label="`Seleccionar todo en ${module.name}`"
                @update:model-value="toggle(moduleCells(module), $event)"
              />
            </div>
          </td>
        </tr>
        <template
          v-for="group in module.groups"
          :key="group.id"
        >
          <tr>
            <td
              :colspan="ACTIONS.length + 1"
              class="text-medium-emphasis font-weight-medium"
            >
              {{ group.name }}
            </td>
          </tr>
          <tr
            v-for="screen in group.screens"
            :key="screen.menu_id"
          >
            <td class="pl-8">
              {{ screen.screen }}
            </td>
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
        </template>
      </template>
    </tbody>
  </v-table>
</template>
