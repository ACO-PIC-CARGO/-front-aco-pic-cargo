const containsRoute = (node, routeName) => JSON.stringify(node).includes(`"${routeName}"`);

export function moduleIdForRoute(menu, routeName) {
  const module = menu.find((node) => containsRoute(node, routeName));
  if (!module) throw new Error(`No menu module contains route "${routeName}"`);
  return module.id;
}

const findAccess = (value) => {
  if (!value || typeof value !== "object") return undefined;
  if ("locked_module_ids" in value || "has_plan" in value) return value;
  for (const child of Object.values(value)) {
    const found = findAccess(child);
    if (found) return found;
  }
  return undefined;
};

export function lockModuleInAccess(body, moduleId) {
  const access = findAccess(body);
  if (!access) throw new Error("branch_subscription/access returned no plan access row");
  access.has_plan = true;
  access.locked_module_ids = [...(access.locked_module_ids ?? []), moduleId];
  return body;
}
