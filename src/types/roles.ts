export interface RoleRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  estado: boolean;
  system: boolean;
  editable: boolean;
  users: number;
}

export interface RoleOption {
  id: number;
  name: string;
  description: string | null;
}

export interface RoleUser {
  id: number;
  users: string;
  nombrecompleto: string;
  assigned: boolean;
}

export interface RoleDetail extends Omit<RoleRow, "users"> {
  users: RoleUser[];
}

export interface CatalogAction {
  id: number;
  code: string;
  name: string;
  granted: boolean;
  grantable: boolean;
}

export interface CatalogScreen {
  module_id: number;
  module: string;
  module_order: number;
  group_id: number;
  group_name: string;
  menu_id: number;
  route: string;
  screen: string;
  actions: CatalogAction[];
}

export interface ScreenPermission {
  menu_id: number;
  actions: string[];
}

export interface RoleForm {
  name: string;
  description: string;
  estado: boolean;
  permissions: ScreenPermission[];
}

export interface PermissionListRow {
  module: string;
  group_name: string;
  menu_id: number;
  route: string;
  screen: string;
  action: string;
  roles: { id: number; name: string }[];
}

export interface MyPermissions {
  screens: { route: string; actions: string[] }[];
  controlled: string[];
}

export interface RoleFilters {
  search: string;
  estado: boolean | "";
}
