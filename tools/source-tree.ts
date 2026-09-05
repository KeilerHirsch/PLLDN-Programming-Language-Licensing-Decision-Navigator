// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
export function repositoryFiles(): string[] {
  return [
    ...new Set(
      execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { encoding: "utf8" },
      )
        .split("\0")
        .filter(Boolean),
    ),
  ].sort();
}
export function sourceTree(): {
  sha256: string;
  files: { path: string; sha256: string }[];
} {
  const files = repositoryFiles().map((path) => {
    if (!lstatSync(path).isFile())
      throw new Error("Only regular source files are allowed");
    return {
      path,
      sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
    };
  });
  return {
    sha256: createHash("sha256").update(JSON.stringify(files)).digest("hex"),
    files,
  };
}
