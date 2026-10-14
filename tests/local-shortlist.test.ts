// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  clearShortlist,
  readShortlist,
  SHORTLIST_KEY,
  SHORTLIST_LIMIT,
  saveShortlist,
  validateShortlist,
} from "../src/ui/local-shortlist.ts";

const allowed = new Set([
  "language.go",
  "candidate.language.6261736963",
  "license.mit",
]);
function store() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

test("local shortlist saves only allowed identities and clears versioned data", () => {
  const s = store();
  assert.deepEqual(readShortlist(s, allowed), { ids: [], persisted: true });
  assert.equal(saveShortlist(s, ["language.go", "license.mit"], allowed), true);
  assert.deepEqual(readShortlist(s, allowed).ids, [
    "language.go",
    "license.mit",
  ]);
  assert.equal(clearShortlist(s), true);
  assert.equal(s.getItem(SHORTLIST_KEY), null);
});

test("corrupt, oversized, unknown and unsupported schema fail closed", () => {
  assert.deepEqual(validateShortlist("{oops", allowed), []);
  assert.deepEqual(
    validateShortlist(
      JSON.stringify({ version: 2, ids: ["language.go"] }),
      allowed,
    ),
    [],
  );
  assert.deepEqual(
    validateShortlist(
      JSON.stringify({ version: 1, ids: ["language.go", "FAKE"] }),
      allowed,
    ),
    [],
  );
  assert.deepEqual(
    validateShortlist(
      JSON.stringify({
        version: 1,
        ids: Array(SHORTLIST_LIMIT + 1).fill("language.go"),
      }),
      allowed,
    ),
    [],
  );
  assert.deepEqual(
    validateShortlist(
      JSON.stringify({ version: 1, ids: ["language.go", "language.go"] }),
      allowed,
    ),
    ["language.go"],
  );
  assert.equal(saveShortlist(store(), ["FAKE"], allowed), false);
});

test("blocked local storage gracefully falls back to session-only selections", () => {
  const blocked = {
    getItem: (_: string): string | null => {
      throw Error("blocked");
    },
    setItem: (_: string, _value: string): void => {
      throw Error("blocked");
    },
    removeItem: (_: string): void => {
      throw Error("blocked");
    },
  };
  assert.deepEqual(readShortlist(blocked, allowed), {
    ids: [],
    persisted: false,
  });
  assert.equal(saveShortlist(blocked, ["language.go"], allowed), false);
  assert.equal(clearShortlist(blocked), false);
});
