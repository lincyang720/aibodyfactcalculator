import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Disclaimer | BodyLens",
  description: "Important limitations and health disclaimer for BodyLens body composition estimates and calculators.",
  path: "/disclaimer",
});

export default function Disclaimer() {
  return <div className="tool-page"><header className="tool-nav"><a href="/">BF · BodyLens</a></header><main className="tool-main legal-page"><div className="tool-eyebrow">LAST UPDATED AUGUST 24, 2026</div><h1>Disclaimer</h1><p className="tool-lede">BodyLens provides educational fitness estimates, not medical measurements or advice.</p><h2>Not a medical device</h2><p>Photo analysis, BMI, FFMI, TDEE, Army, PSMF, and body-fat reference results are estimates. They do not diagnose, treat, prevent, or monitor any disease or health condition.</p><h2>Accuracy and limitations</h2><p>Results can vary because of lighting, pose, clothing, camera angle, hydration, input accuracy, individual physiology, and model behavior. A photo estimate should not be treated as equivalent to DEXA or an examination by a qualified professional.</p><h2>Use results responsibly</h2><p>Do not start an aggressive diet, training program, or other health intervention solely because of a BodyLens result. Seek advice from a qualified healthcare professional when a decision may affect your health.</p><h2>No guarantee</h2><p>BodyLens makes no guarantee that an estimate, recommendation, timeline, eligibility result, or reference range is complete or suitable for your circumstances.</p><a className="back-cta" href="/">Return to calculator</a></main></div>;
}
