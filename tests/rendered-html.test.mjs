import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("standard Next.js production output exists", async () => {
  await access(new URL(".next/BUILD_ID", root));
  await access(new URL(".next/routes-manifest.json", root));
  await access(new URL(".next/server/app-paths-manifest.json", root));
});

test("homepage keeps stable SEO content and structured data", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(page, /AI Body Fat<br\/>/);
  assert.match(layout, /AI Body Fat Calculator - Free Body Fat Percentage from Photo/);
  assert.match(layout, /SoftwareApplication/);
  assert.match(layout, /FAQPage/);
  assert.match(layout, /BreadcrumbList/);
});

test("all public routes are present in the app directory", async () => {
  for (const route of [
    "app/tdee-calculator/page.tsx",
    "app/bmi-calculator/page.tsx",
    "app/psmf-calculator/page.tsx",
    "app/body-fat-percentage-chart/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/api/analyze/route.ts",
  ]) await access(new URL(route, root));
});
