import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, {headers:{accept:"text/html"}}), {ASSETS:{fetch:async()=>new Response("Not found",{status:404})}}, {waitUntil(){},passThroughOnException(){}});
}

test("server renders the calculator with stable SEO content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>AI Body Fat Calculator - Free Body Fat Percentage from Photo<\/title>/i);
  assert.match(html, /<h1[^>]*>AI Body Fat/);
  assert.match(html, /SoftwareApplication/);
  assert.match(html, /FAQPage/);
  assert.match(html, /BreadcrumbList/);
  assert.match(html, /Analyze my body fat/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

for (const path of ["/tdee-calculator","/bmi-calculator","/psmf-calculator","/body-fat-percentage-chart","/privacy","/terms"]) {
  test(`server renders ${path}`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html/i);
  });
}
