// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { Ajv2020 } from "ajv/dist/2020.js";
import profileSchema from "../deployments/github-pages/runtime-profile.schema.json" with {
  type: "json",
};
import { validateDocument } from "../src/validation/documents.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";

const runtimePath =
  /^(claims|dimensions|entities|sources)\/[a-z0-9._-]+\.json$/;
const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
const validateProfile = ajv.compile(profileSchema);

export interface PagesBaseProject extends Record<string, unknown> {
  schema_version: "0.1";
  project_id: string;
  components: { component_id: string; form: string }[];
  facts: unknown[];
  boundaries: unknown[];
}
export interface PagesRuntimeProfile {
  schema_version: "0.1";
  deployment_id: "github-pages";
  source_manifest_path: string;
  approved_source_manifest_sha256: string;
  runtime_knowledge_snapshot: string;
  approved_runtime_manifest_sha256: string;
  runtime_document_paths: readonly string[];
  candidate_type: "language";
  component_id: string;
  base_project: PagesBaseProject;
}

function lexical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Parse only the explicit GitHub Pages deployment approval profile. */
export function parsePagesRuntimeProfile(raw: string): PagesRuntimeProfile {
  const parsed = asObject(parseStrictJson(raw));
  const paths = parsed.runtime_document_paths;
  if (Array.isArray(paths)) {
    for (const path of paths)
      if (typeof path !== "string" || !runtimePath.test(path))
        throw new Error("Invalid runtime path");
    if (new Set(paths).size !== paths.length)
      throw new Error("Runtime paths must be unique");
    const sorted = [...paths].sort(lexical);
    if (sorted.some((path, index) => path !== paths[index]))
      throw new Error("Runtime paths must be sorted");
  }
  if (!validateProfile(parsed))
    throw new Error(
      `Invalid Pages runtime profile: ${ajv.errorsText(validateProfile.errors)}`,
    );
  const baseProject = asObject(parsed.base_project);
  validateDocument("project-facts", baseProject);
  const components = baseProject.components as Record<string, unknown>[];
  if (
    components.length !== 1 ||
    components[0]?.component_id !== parsed.component_id
  )
    throw new Error("Pages component must match the only base component");
  return parsed as unknown as PagesRuntimeProfile;
}
