/**
 * ロール判定ヘルパー
 * "worker" は "employee" の旧名称。両方を受け入れる。
 */

export function isEmployeeOrAdmin(role: string | null | undefined): boolean {
  const r = (role ?? "").toString().toLowerCase();
  return r === "employee" || r === "worker" || r === "admin";
}

export function isAdmin(role: string | null | undefined): boolean {
  return (role ?? "").toString().toLowerCase() === "admin";
}

export function isCustomer(role: string | null | undefined): boolean {
  const r = (role ?? "").toString().toLowerCase();
  return r === "customer" || r === "client";
}
