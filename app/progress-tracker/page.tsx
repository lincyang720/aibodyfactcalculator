import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";
import InterestCta from "./InterestCta";
import "../tool-pages.css";
import "./progress.css";

const canonical = "https://aibodyfatcalculator.com/progress-tracker";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Physique Progress Tracker from Photos | AI Body Fat Calculator",
  description: "Create a body composition baseline from a photo, repeat under consistent conditions, and track changes in body fat range and muscle balance over time.",
  path: "/progress-tracker",
});

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AI Physique Progress Tracker",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  url: canonical,
  brand: { "@type": "Brand", name: "AI Body Fat Calculator" },
  publisher: { "@id": "https://aibodyfatcalculator.com/#organization" },
};

export default function ProgressTrackerPage() {
  return <div className="tool-page">
    <header className="tool-nav"><a href="/">BF · AI Body Fat Calculator</a><div><a href="/">Photo analysis</a><a href="/ffmi-calculator">FFMI</a><a href="/body-fat-percentage-chart">Body fat chart</a></div></header>
    <main className="tool-main progress-page">
      <div className="tool-eyebrow">BODYLENS PROGRESS MODE</div>
      <h1>AI Physique Progress Tracker</h1>
      <p className="tool-lede">A single estimate is a snapshot. AI Body Fat Calculator is becoming a repeatable photo check-in that helps you see what changed and decide what to do next.</p>

      <section className="progress-status">
        <div><span>AVAILABLE NOW</span><h2>Save a private numeric baseline</h2><p>Run the free photo analysis, then save the estimated range, muscle scores, and date in your browser. The photo is not included in the saved baseline.</p><a href="/#analyzer">Create my free baseline →</a></div>
        <div><span>IN DEVELOPMENT</span><h2>Compare consistent check-ins</h2><p>Planned progress mode adds guided front, side, and back photos, aligned comparisons, trend charts, and a short weekly action report.</p></div>
      </section>

      <section className="content-block"><h2>What progress mode is designed to include</h2><div className="progress-feature-grid"><article><b>01</b><h3>Consistent capture</h3><p>Repeatable lighting, distance, pose, clothing, and camera-height guidance so photo changes are more meaningful.</p></article><article><b>02</b><h3>Two-date comparison</h3><p>Place two check-ins side by side and separate likely physique changes from differences caused by the photo setup.</p></article><article><b>03</b><h3>Muscle balance trends</h3><p>Follow changes across chest, shoulders, arms, core, back, and legs instead of reducing progress to one percentage.</p></article><article><b>04</b><h3>Weekly next step</h3><p>Turn the latest trend into a focused calorie, protein, cardio, and strength recommendation for the next check-in.</p></article></div></section>

      <section className="content-block"><h2>Privacy should be a choice</h2><div className="progress-mode-grid"><article><span>NO-SAVE MODE</span><h3>Analyze and leave</h3><p>Use the free result without creating an account or building a photo history. Best for users who want the least retention.</p></article><article><span>TRACKING MODE</span><h3>Explicitly save progress</h3><p>Future tracking will require clear consent, visible deletion controls, and an explanation of where each photo is processed and stored.</p></article></div></section>

      <section className="founding-offer"><div><span>FOUNDING PLAN — INTEREST TEST</span><h2>$39/year</h2><p>Unlimited check-ins, aligned photo comparisons, trend history, and weekly progress reports. This plan is not charging yet; requesting access records genuine interest and starts an email conversation.</p></div><InterestCta /></section>

      <p className="progress-disclaimer">AI Body Fat Calculator provides directional fitness estimates, not medical measurements. Small changes may reflect lighting, pose, clothing, hydration, camera angle, or model behavior.</p>
      <a className="back-cta" href="/#analyzer">Start with a free analysis →</a>
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(appSchema)}}/>
  </div>;
}
