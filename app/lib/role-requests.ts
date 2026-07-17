/**
 * Captured no-match agent requests (agent-schema.md §2): when free-typed
 * instructions match nothing on the roster, the verbatim ask is filed here
 * instead of creating a hollow agent. Prototype-local feedback signal;
 * conceptually this feeds the roadmap for future agent types.
 */

export type RoleRequest = {
  id: string;
  text: string;
  at: string;
};

const STORAGE_KEY = "wati.role-requests.v1";

export function listRoleRequests(): RoleRequest[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoleRequest[]) : [];
  } catch {
    return [];
  }
}

export function recordRoleRequest(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    const next: RoleRequest[] = [
      { id: crypto.randomUUID(), text: trimmed, at: new Date().toISOString() },
      ...listRoleRequests(),
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the denial state still renders; only capture is lost.
  }
}
