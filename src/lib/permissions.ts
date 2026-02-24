// src/lib/permissions.ts

export type Role = 'customer' | 'employee' | 'admin';

export type Permission =
  | 'view_customer_features'
  | 'view_employee_features'
  | 'manage_orders'
  | 'create_order'
  | 'chat'
  | 'admin_panel';

const rolePermissions: Record<Role, Permission[]> = {
  customer: ['view_customer_features', 'create_order', 'chat'],
  employee: ['view_employee_features', 'manage_orders', 'chat'],
  admin: [
    'view_customer_features',
    'view_employee_features',
    'manage_orders',
    'create_order',
    'chat',
    'admin_panel',
  ],
};

export function hasPermission(
  role: Role | null | undefined,
  perm: Permission
): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(perm) ?? false;
}
