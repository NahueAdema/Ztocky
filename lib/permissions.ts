import type { WorkspaceRole } from "@prisma/client";

export type Action =
  | "expense:create"
  | "expense:edit"
  | "expense:delete"
  | "sale:void"
  | "store:settings"
  | "workspace:members"
  | "workspace:invite"
  | "product:edit"
  | "expense:closeMonth";

type AllowedRoles = WorkspaceRole[] | "ALL";

const HIERARCHY: Record<WorkspaceRole, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

const PERMISSIONS: Record<Action, AllowedRoles> = {
  // Gastos: MEMBER puede registrar, solo OWNER/ADMIN editan/eliminan/cierran mes
  "expense:create": ["OWNER", "ADMIN", "MEMBER"],
  "expense:edit": ["OWNER", "ADMIN"],
  "expense:delete": ["OWNER", "ADMIN"],
  "expense:closeMonth": ["OWNER", "ADMIN"],
  // Anulación de ventas: sigue la misma lógica que el void del POS
  "sale:void": ["OWNER", "ADMIN"],
  // Configuración / gestión sensible
  "store:settings": ["OWNER", "ADMIN"],
  "workspace:members": ["OWNER", "ADMIN"],
  "workspace:invite": ["OWNER", "ADMIN"],
  "product:edit": ["OWNER", "ADMIN"],
};

/**
 * Devuelve true si el rol puede ejecutar la acción. En caso de valores
 * vacíos o lista con OWNER/ADMIN/MEMBER se usa la jerarquía: un rol con
 * rango >= al mínimo requerido puede.
 */
export function can(action: Action, role: WorkspaceRole | undefined | null): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  if (allowed === "ALL") return true;
  return allowed.some((r) => HIERARCHY[role] >= HIERARCHY[r]);
}

/**
 * Helper de ruta API: devuelve un NextResponse de error 403 o null.
 * Uso: `const denied = assertPermission(user.role, "expense:delete"); if (denied) return denied;`
 */
export function permissionError(message?: string) {
  return {
    json: { error: message ?? "No tenés permiso para esta acción" },
    status: 403,
  };
}
