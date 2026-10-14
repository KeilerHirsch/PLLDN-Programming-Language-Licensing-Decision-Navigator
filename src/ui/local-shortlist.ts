// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

/** Local-only, versioned identity selections. Never store facts or personal data. */
export const SHORTLIST_KEY = "plldn.shortlist.v1";
export const SHORTLIST_LIMIT = 40;
type LocalStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function validateShortlist(
  raw: string | null,
  allowedIds: ReadonlySet<string>,
): string[] {
  if (raw === null) return [];
  if (raw.length > 12_000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (data === null || typeof data !== "object" || Array.isArray(data))
      return [];
    const obj = data as Record<string, unknown>;
    if (
      Object.keys(obj).length !== 2 ||
      obj.version !== 1 ||
      !Array.isArray(obj.ids)
    )
      return [];
    if (
      obj.ids.length > SHORTLIST_LIMIT ||
      !obj.ids.every((id) => typeof id === "string" && allowedIds.has(id))
    )
      return [];
    return [...new Set(obj.ids)];
  } catch {
    return [];
  }
}

export function readShortlist(
  storage: LocalStore | null,
  allowedIds: ReadonlySet<string>,
): { ids: string[]; persisted: boolean } {
  try {
    if (!storage) return { ids: [], persisted: false };
    return {
      ids: validateShortlist(storage.getItem(SHORTLIST_KEY), allowedIds),
      persisted: true,
    };
  } catch {
    return { ids: [], persisted: false };
  }
}

export function saveShortlist(
  storage: LocalStore | null,
  ids: readonly string[],
  allowedIds: ReadonlySet<string>,
): boolean {
  if (
    !storage ||
    ids.length > SHORTLIST_LIMIT ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !allowedIds.has(id))
  )
    return false;
  try {
    storage.setItem(SHORTLIST_KEY, JSON.stringify({ version: 1, ids }));
    return true;
  } catch {
    return false;
  }
}

export function clearShortlist(storage: LocalStore | null): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(SHORTLIST_KEY);
    return true;
  } catch {
    return false;
  }
}
