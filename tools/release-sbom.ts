// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { encodeCanonical } from "../src/snapshots/manifest.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";

const allowedTopLevel = new Set([
  "$schema",
  "bomFormat",
  "specVersion",
  "serialNumber",
  "version",
  "metadata",
  "components",
  "dependencies",
]);

function lexical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function canonicalKey(value: unknown): string {
  return encodeCanonical(value);
}

function sortProperties(value: unknown): unknown {
  if (!Array.isArray(value))
    throw new Error("CycloneDX properties array required");
  return value
    .map((item) => asObject(item))
    .sort((a, b) => {
      const an = typeof a.name === "string" ? a.name : "";
      const bn = typeof b.name === "string" ? b.name : "";
      const av = typeof a.value === "string" ? a.value : "";
      const bv = typeof b.value === "string" ? b.value : "";
      if (!an || !bn) throw new Error("CycloneDX property name required");
      return lexical(an, bn) || lexical(av, bv);
    });
}

function normalizeComponent(value: unknown): Record<string, unknown> {
  const component = { ...asObject(value) };
  if (typeof component["bom-ref"] !== "string")
    throw new Error("CycloneDX component bom-ref required");
  if (component.properties !== undefined)
    component.properties = sortProperties(component.properties);
  if (Array.isArray(component.hashes)) {
    component.hashes = component.hashes
      .map((item) => asObject(item))
      .sort((a, b) =>
        lexical(
          `${a.alg ?? ""}\0${a.content ?? ""}`,
          `${b.alg ?? ""}\0${b.content ?? ""}`,
        ),
      );
  }
  if (Array.isArray(component.externalReferences)) {
    component.externalReferences = component.externalReferences
      .map((item) => {
        const reference = { ...asObject(item) };
        if (Array.isArray(reference.hashes)) {
          reference.hashes = reference.hashes
            .map((hash) => asObject(hash))
            .sort((a, b) =>
              lexical(
                `${a.alg ?? ""}\0${a.content ?? ""}`,
                `${b.alg ?? ""}\0${b.content ?? ""}`,
              ),
            );
        }
        return reference;
      })
      .sort((a, b) =>
        lexical(
          `${a.type ?? ""}\0${a.url ?? ""}`,
          `${b.type ?? ""}\0${b.url ?? ""}`,
        ),
      );
  }
  if (Array.isArray(component.licenses)) {
    component.licenses = [...component.licenses].sort((a, b) =>
      lexical(canonicalKey(a), canonicalKey(b)),
    );
  }
  return component;
}

function normalizeMetadata(
  value: unknown,
  epoch: string,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    ...asObject(value),
    timestamp: epoch,
  };
  if (metadata.properties !== undefined)
    metadata.properties = sortProperties(metadata.properties);
  if (Array.isArray(metadata.lifecycles)) {
    metadata.lifecycles = [...metadata.lifecycles].sort((a, b) =>
      lexical(canonicalKey(a), canonicalKey(b)),
    );
  }
  if (Array.isArray(metadata.tools)) {
    metadata.tools = [...metadata.tools].sort((a, b) =>
      lexical(canonicalKey(a), canonicalKey(b)),
    );
  }
  if (metadata.component !== undefined)
    metadata.component = normalizeComponent(metadata.component);
  return metadata;
}

function normalizeDependency(value: unknown): Record<string, unknown> {
  const dependency = { ...asObject(value) };
  if (typeof dependency.ref !== "string")
    throw new Error("CycloneDX dependency ref required");
  if (!Array.isArray(dependency.dependsOn))
    throw new Error("CycloneDX dependency dependsOn required");
  if (dependency.dependsOn.some((item) => typeof item !== "string"))
    throw new Error("CycloneDX dependency refs must be strings");
  dependency.dependsOn = [...new Set(dependency.dependsOn as string[])].sort(
    lexical,
  );
  return dependency;
}

export function canonicalizeCycloneDx(
  raw: string,
  releaseEpochIso: string,
): string {
  const epochMs = Date.parse(releaseEpochIso);
  if (
    !Number.isFinite(epochMs) ||
    new Date(epochMs).toISOString() !== releaseEpochIso
  )
    throw new Error("Invalid release epoch");
  const parsed = asObject(parseStrictJson(raw));
  for (const key of Object.keys(parsed))
    if (!allowedTopLevel.has(key))
      throw new Error(`Unsupported CycloneDX top-level shape: ${key}`);
  if (
    parsed.bomFormat !== "CycloneDX" ||
    parsed.specVersion !== "1.5" ||
    parsed.version !== 1
  )
    throw new Error("Unsupported CycloneDX identity");
  const components = parsed.components;
  const dependencies = parsed.dependencies;
  if (
    !Array.isArray(components) ||
    !Array.isArray(dependencies) ||
    parsed.metadata === undefined
  )
    throw new Error("Unsupported CycloneDX structure");
  const normalized: Record<string, unknown> = { ...parsed };
  delete normalized.serialNumber;
  normalized.metadata = normalizeMetadata(parsed.metadata, releaseEpochIso);
  normalized.components = components
    .map(normalizeComponent)
    .sort((a, b) => lexical(a["bom-ref"] as string, b["bom-ref"] as string));
  normalized.dependencies = dependencies
    .map(normalizeDependency)
    .sort((a, b) => lexical(a.ref as string, b.ref as string));
  return encodeCanonical(normalized);
}
