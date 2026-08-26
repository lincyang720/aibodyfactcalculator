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
  const [page, layout, helper] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/site-metadata.ts", root), "utf8"),
  ]);
  assert.match(page, /AI Body Fat<br\/><em>Progress Tracker<\/em>/);
  assert.match(layout, /AI Body Fat Calculator & Physique Progress Tracker \| BodyLens/);
  assert.match(layout, /applicationName: SITE_NAME/);
  assert.match(helper, /siteName: SITE_NAME/);
  assert.match(layout, /"@type":"Organization"/);
  assert.match(layout, /"@type":"WebSite"/);
  assert.match(page, /name:"BodyLens AI Physique Progress Tracker"/);
  assert.match(page, /publisher:\{"@id":"https:\/\/aibodyfatcalculator\.com\/#organization"\}/);
  assert.match(page, /SoftwareApplication/);
  assert.match(page, /FAQPage/);
  assert.match(page, /BreadcrumbList/);
});

test("every calculator route has route-specific metadata", async () => {
  const [helper, bmi, tdee, psmf, chart] = await Promise.all([
    readFile(new URL("app/site-metadata.ts", root), "utf8"),
    readFile(new URL("app/bmi-calculator/layout.tsx", root), "utf8"),
    readFile(new URL("app/tdee-calculator/layout.tsx", root), "utf8"),
    readFile(new URL("app/psmf-calculator/layout.tsx", root), "utf8"),
    readFile(new URL("app/body-fat-percentage-chart/page.tsx", root), "utf8"),
  ]);
  assert.match(helper, /alternates: \{ canonical \}/);
  assert.match(helper, /openGraph:/);
  assert.match(helper, /twitter:/);
  assert.match(bmi, /path: "\/bmi-calculator"/);
  assert.match(tdee, /path: "\/tdee-calculator"/);
  assert.match(psmf, /path: "\/psmf-calculator"/);
  assert.match(chart, /path:"\/body-fat-percentage-chart"/);
});

test("progress tracking is honest and privacy-preserving", async () => {
  const [home, progress, privacy, sitemap] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/progress-tracker/page.tsx", root), "utf8"),
    readFile(new URL("app/privacy/page.tsx", root), "utf8"),
    readFile(new URL("app/sitemap.ts", root), "utf8"),
  ]);
  assert.match(home, /bodylens-baseline/);
  assert.match(home, /Your photo is not saved/);
  assert.match(progress, /IN DEVELOPMENT/);
  assert.match(progress, /This plan is not charging yet/);
  assert.match(privacy, /numeric analysis result and date in your browser/);
  assert.match(sitemap, /progress-tracker/);
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
  assert.match(page, /FFMI Calculator — Fat Free Mass Index \(Normalized\) \| BodyLens/);
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
    "app/progress-tracker/page.tsx",
    "app/api/analyze/route.ts",
  ]) await access(new URL(route, root));
});
