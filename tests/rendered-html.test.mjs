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
  assert.match(page, /SoftwareApplication/);
  assert.match(page, /FAQPage/);
  assert.match(page, /BreadcrumbList/);
});

test("Army calculator uses the current 2026 WHtR rule", async () => {
  const [page, calculator] = await Promise.all([
    readFile(new URL("app/army-body-fat-calculator/page.tsx", root), "utf8"),
    readFile(new URL("app/army-body-fat-calculator/ArmyCalculator.tsx", root), "utf8"),
  ]);
  assert.match(page, /Army Directive 2026-13/);
  assert.match(page, /below 0\.550/);
  assert.match(page, /FAQPage/);
  assert.match(page, /BreadcrumbList/);
  assert.match(calculator, /Math\.trunc\(value \* 1000\) \/ 1000/);
  assert.match(calculator, /recorded<0\.55/);
});

test("FFMI calculator includes normalized formula and page schema", async () => {
  const [page, calculator] = await Promise.all([
    readFile(new URL("app/ffmi-calculator/page.tsx", root), "utf8"),
    readFile(new URL("app/ffmi-calculator/FfmiCalculator.tsx", root), "utf8"),
  ]);
  assert.match(page, /FFMI Calculator - Fat Free Mass Index \(Normalized\)/);
  assert.match(page, /FAQPage/);
  assert.match(page, /SoftwareApplication/);
  assert.match(calculator, /leanMassKg\/\(heightM\*\*2\)/);
  assert.match(calculator, /ffmi\+6\.3\*\(1\.8-heightM\)/);
  assert.doesNotMatch(page, /proof of performance-enhancing drug use/i);
});

test("all public routes are present in the app directory", async () => {
  for (const route of [
    "app/tdee-calculator/page.tsx",
    "app/bmi-calculator/page.tsx",
    "app/psmf-calculator/page.tsx",
    "app/body-fat-percentage-chart/page.tsx",
    "app/army-body-fat-calculator/page.tsx",
    "app/ffmi-calculator/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/api/analyze/route.ts",
  ]) await access(new URL(route, root));
});
