/// <reference types="node" />

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  apiUrl,
  isPetVisitsReviewPreview,
  queryApiUrl,
  validateReviewApiBase,
} from "./api-base";
import { createApiClient } from "./api";

const branch = "dev/send-a-slot-pet-visits-review-20260924";
const base = "https://doglife-pet-visits-it-20260924.onrender.com";

function loadVercelConfig(overrides: Record<string, string | undefined>) {
  const env = {
    ...process.env,
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: branch,
    VITE_API_BASE: base,
    VITE_API_URL: "",
    VITE_API_BASE_URL: "",
    ...overrides,
  };

  return spawnSync(
    "npx",
    [
      "--no-install",
      "tsx",
      "--input-type=module",
      "-e",
      "import('./vercel.ts').then(({config}) => console.log(JSON.stringify(config)))",
    ],
    {
      cwd: process.cwd(),
      env,
      encoding: "utf8",
    },
  );
}

function runPreviewBuild(overrides: Record<string, string | undefined> = {}) {
  const env = {
    ...process.env,
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: branch,
    VITE_API_BASE: base,
    VITE_API_URL: "",
    VITE_API_BASE_URL: "",
    ...overrides,
  };

  return spawnSync("npm", ["run", "build"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
}

function builtJavascriptContains(value: string) {
  const bundles = readdirSync("dist/assets").filter((file) => file.endsWith(".js"));
  assert.ok(bundles.length > 0, "the build must produce a browser bundle");
  return bundles.some((file) =>
    readFileSync(`dist/assets/${file}`, "utf8").includes(value),
  );
}

test("Pet Visits review Preview requires both environment and branch", () => {
  assert.equal(isPetVisitsReviewPreview("preview", branch), true);
  assert.equal(isPetVisitsReviewPreview("preview", "feature/daycare"), false);
  assert.equal(isPetVisitsReviewPreview("preview", undefined), false);
  assert.equal(isPetVisitsReviewPreview("production", branch), false);
});

test("review Preview configuration fails closed without a backend", () => {
  const result = loadVercelConfig({ VITE_API_BASE: undefined });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires VITE_API_BASE/);
});

test("the Vite build rejects a missing review Preview API base", () => {
  const result = runPreviewBuild({ VITE_API_BASE: "" });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /requires VITE_API_BASE/,
  );
});

test("review Preview rejects the production API", () => {
  const result = loadVercelConfig({
    VITE_API_BASE: "https://api.doglife.app",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /temporary Render HTTPS origin/,
  );
});

test("review Preview rejects another Render service", () => {
  const otherRenderOrigin = "https://some-other-service.onrender.com";

  const configResult = loadVercelConfig({
    VITE_API_BASE: otherRenderOrigin,
  });

  assert.notEqual(configResult.status, 0);
  assert.match(
    configResult.stderr,
    /temporary Render HTTPS origin/,
  );

  const buildResult = runPreviewBuild({
    VITE_API_BASE: otherRenderOrigin,
  });

  assert.notEqual(buildResult.status, 0);
  assert.match(
    buildResult.stdout + buildResult.stderr,
    /temporary Render HTTPS origin/,
  );

  assert.throws(
    () => validateReviewApiBase({ VITE_API_BASE: otherRenderOrigin }),
    /temporary Render HTTPS origin/,
  );
});

test("review Preview rejects conflicting legacy bases", () => {
  for (const key of ["VITE_API_URL", "VITE_API_BASE_URL"]) {
    const result = loadVercelConfig({
      [key]: "https://api.doglife.app",
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /conflicts with VITE_API_BASE/);
  }
});

test("review rewrite still targets the validated temporary backend", () => {
  const result = loadVercelConfig({});

  assert.equal(result.status, 0, result.stderr);

  const config = JSON.parse(result.stdout);

  assert.equal(
    config.rewrites[0].destination,
    `${base}/api/:path*`,
  );

  assert.equal(
    validateReviewApiBase({ VITE_API_BASE: base }),
    base,
  );
});

test("review Preview browser bundle does not contain the temporary Render origin", () => {
  const result = runPreviewBuild();

  assert.equal(
    result.status,
    0,
    result.stdout + result.stderr,
  );

  assert.equal(
    builtJavascriptContains(base),
    false,
    "browser bundle must use same-origin /api routing in the review Preview",
  );
});

test("unrelated Preview uses normal routing and keeps its configured browser base", () => {
  const normalPreviewBase = "https://normal-preview.example";
  const env = {
    VERCEL_GIT_COMMIT_REF: "feature/daycare",
    VITE_API_BASE: normalPreviewBase,
  };
  const configResult = loadVercelConfig(env);
  assert.equal(configResult.status, 0, configResult.stderr);
  assert.equal(
    JSON.parse(configResult.stdout).rewrites[0].destination,
    "https://api.doglife.app/api/:path*",
  );

  const buildResult = runPreviewBuild(env);
  assert.equal(buildResult.status, 0, buildResult.stdout + buildResult.stderr);
  assert.equal(builtJavascriptContains(normalPreviewBase), true);
  assert.equal(builtJavascriptContains(base), false);

  const missingBaseResult = loadVercelConfig({
    VERCEL_GIT_COMMIT_REF: "feature/daycare",
    VITE_API_BASE: undefined,
  });
  assert.equal(missingBaseResult.status, 0, missingBaseResult.stderr);

  const missingBaseBuild = runPreviewBuild({
    VERCEL_GIT_COMMIT_REF: "feature/daycare",
    VITE_API_BASE: undefined,
  });
  assert.equal(
    missingBaseBuild.status,
    0,
    missingBaseBuild.stdout + missingBaseBuild.stderr,
  );
  assert.equal(builtJavascriptContains(base), false);
});

test("normal configured API helpers retain existing direct-base behaviour", () => {
  assert.equal(
    createApiClient(base).defaults.baseURL,
    base,
  );

  assert.equal(
    createApiClient(base).defaults.withCredentials,
    true,
  );

  assert.equal(
    apiUrl("/api/bookings", base),
    `${base}/api/bookings`,
  );

  assert.equal(
    queryApiUrl("/api/owner/dogs/1", base),
    `${base}/api/owner/dogs/1`,
  );

  assert.equal(
    queryApiUrl("owner-dogs", base),
    "owner-dogs",
  );
});

test("normal Vercel deployment keeps the existing production rewrite", () => {
  const result = loadVercelConfig({
    VERCEL_ENV: "production",
    VITE_API_BASE: undefined,
  });

  assert.equal(result.status, 0, result.stderr);

  assert.equal(
    JSON.parse(result.stdout).rewrites[0].destination,
    "https://api.doglife.app/api/:path*",
  );

  const productionBase = "https://api.doglife.app";
  const buildResult = runPreviewBuild({
    VERCEL_ENV: "production",
    VITE_API_BASE: productionBase,
  });
  assert.equal(buildResult.status, 0, buildResult.stdout + buildResult.stderr);
  assert.equal(builtJavascriptContains(productionBase), true);
  assert.equal(builtJavascriptContains(base), false);
});