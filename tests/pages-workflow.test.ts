// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = ".github/workflows/pages.yml";
const checkoutSha = "3d3c42e5aac5ba805825da76410c181273ba90b1";
const setupNodeSha = "820762786026740c76f36085b0efc47a31fe5020";
const configurePagesSha = "45bfe0192ca1faeb007ade9deae92b16b8254a0d";
const uploadPagesSha = "fc324d3547104276b827a68afc52ff2a11cc49c9";
const deployPagesSha = "cd2ce8fcbc39b97be8ca5fce6e763baed58fa128";
const gitleaksSha256 =
  "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb";

async function workflow(): Promise<string> {
  return readFile(workflowPath, "utf8");
}

test("Pages workflow is chained only from verified main or manual main", async () => {
  const yaml = await workflow();
  assert.match(yaml, /^name: Pages$/m);
  assert.match(yaml, /workflow_run:\s*\n\s+workflows: \["Verify"\]/);
  assert.match(yaml, /types: \[completed\]/);
  assert.match(yaml, /branches: \[main\]/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.equal(/^\s+push:/m.test(yaml), false);
  assert.equal(/^\s+pull_request:/m.test(yaml), false);
  assert.match(yaml, /conclusion == 'success'/);
  assert.match(yaml, /workflow_run\.event == 'push'/);
  assert.match(yaml, /head_repository\.full_name == github\.repository/);
  assert.match(yaml, /head_branch == 'main'/);
  assert.match(yaml, /github\.ref == 'refs\/heads\/main'/);
});
test("Pages build resolves and checks out the exact verified SHA", async () => {
  const yaml = await workflow();
  assert.match(
    yaml,
    /TARGET_SHA: \$\{\{ github\.event_name == 'workflow_run' && github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/,
  );
  assert.match(yaml, new RegExp(`actions/checkout@${checkoutSha}`));
  assert.match(yaml, /ref: \$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(yaml, /persist-credentials: false/);
  assert.match(yaml, new RegExp(`actions/setup-node@${setupNodeSha}`));
  assert.match(yaml, /node-version-file: \.node-version/);
  assert.match(
    yaml,
    /git fetch --no-tags --depth=1 origin \+refs\/heads\/main:refs\/remotes\/origin\/main/,
  );
  assert.match(yaml, /git rev-parse refs\/remotes\/origin\/main/);
  assert.match(yaml, /"\$TARGET_SHA"/);
});

test("Pages build repeats supply-chain gates before artifact upload", async () => {
  const yaml = await workflow();
  assert.match(yaml, /npm install --global npm@11\.12\.1 --ignore-scripts/);
  assert.match(yaml, /npm ci --ignore-scripts/);
  assert.match(yaml, /npm audit --audit-level=low/);
  assert.match(yaml, /gitleaks\/gitleaks\/releases\/download\/v8\.30\.1/);
  assert(yaml.includes(gitleaksSha256));
  assert.match(yaml, /sha256sum --check/);
  assert.match(yaml, /npm run build:pages/);
  assert.match(
    yaml,
    new RegExp(`actions/configure-pages@${configurePagesSha}`),
  );
  assert.match(
    yaml,
    new RegExp(`actions/upload-pages-artifact@${uploadPagesSha}`),
  );
  assert.match(yaml, /path: \.build\/pages/);
});
test("only the deploy job receives Pages write and OIDC permissions", async () => {
  const yaml = await workflow();
  const deployIndex = yaml.indexOf("\n  deploy:\n");
  assert(deployIndex > 0, "deploy job missing");
  const beforeDeploy = yaml.slice(0, deployIndex);
  const deploy = yaml.slice(deployIndex);
  assert.equal(beforeDeploy.includes("pages: write"), false);
  assert.equal(beforeDeploy.includes("id-token: write"), false);
  assert.match(beforeDeploy, /permissions:\s*\n\s+contents: read/);
  assert.match(
    deploy,
    /permissions:\s*\n\s+pages: write\s*\n\s+id-token: write/,
  );
  assert.match(deploy, /environment:\s*\n\s+name: github-pages/);
  assert.match(deploy, /url: \$\{\{ steps\.deployment\.outputs\.page_url \}\}/);
  assert.match(deploy, new RegExp(`actions/deploy-pages@${deployPagesSha}`));
});

test("Pages deployments are serialized and stale builds are cancelled", async () => {
  const yaml = await workflow();
  assert.match(
    yaml,
    /concurrency:\s*\n\s+group: pages\s*\n\s+cancel-in-progress: true/,
  );
  assert.match(yaml, /needs: build/);
  assert.match(yaml, /if: needs\.build\.result == 'success'/);
  assert.equal(yaml.includes("actions/upload-artifact@"), false);
});
