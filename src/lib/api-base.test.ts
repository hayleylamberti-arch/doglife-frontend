import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { apiUrl, queryApiUrl, validateReviewApiBase } from "./api-base";
import { createApiClient } from "./api";

const branch = "dev/send-a-slot-pet-visits-review-20260924";
const base = "https://pet-visits-temporary.onrender.com";

function loadVercelConfig(overrides: Record<string, string | undefined>) {
  const env = { ...process.env, VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: branch,
    VITE_API_BASE: base, VITE_API_URL: "", VITE_API_BASE_URL: "", ...overrides };
  const result = spawnSync("npx",
    ["--no-install", "tsx", "--input-type=module", "-e", "import('./vercel.ts').then(({config}) => console.log(JSON.stringify(config)))"],
    { cwd: process.cwd(), env, encoding: "utf8" });
  return result;
}

test("review Preview configuration fails closed without a backend", () => {
  const result = loadVercelConfig({ VITE_API_BASE: undefined });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires VITE_API_BASE/);
});

test("the Vite build rejects a missing review Preview API base", () => {
  const env = { ...process.env, VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: branch, VITE_API_BASE: "" };
  const result = spawnSync("npm", ["run", "build"],
    { cwd: process.cwd(), env, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /requires VITE_API_BASE/);
});

test("review Preview rejects the production API", () => {
  const result = loadVercelConfig({ VITE_API_BASE: "https://api.doglife.app" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /temporary Render HTTPS origin/);
});

test("review Preview rejects conflicting legacy bases", () => {
  for (const key of ["VITE_API_URL", "VITE_API_BASE_URL"]) {
    const result = loadVercelConfig({ [key]: "https://api.doglife.app" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /conflicts with VITE_API_BASE/);
  }
});

test("review rewrite and client request paths share the temporary backend", () => {
  const result = loadVercelConfig({});
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.rewrites[0].destination, `${base}/api/:path*`);
  assert.equal(validateReviewApiBase({ VITE_API_BASE: base }), base);
  assert.equal(createApiClient(base).defaults.baseURL, base);
  assert.equal(createApiClient(base).defaults.withCredentials, true);
  assert.equal(apiUrl("/api/bookings", base), `${base}/api/bookings`);
  assert.equal(queryApiUrl("/api/owner/dogs/1", base), `${base}/api/owner/dogs/1`);
  assert.equal(queryApiUrl("owner-dogs", base), "owner-dogs");
});

test("normal Vercel deployment keeps the existing production rewrite", () => {
  const result = loadVercelConfig({ VERCEL_ENV: "production", VITE_API_BASE: undefined });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).rewrites[0].destination,
    "https://api.doglife.app/api/:path*");
});
