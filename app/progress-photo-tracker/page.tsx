import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";
import { LongTailLanding, type LongTailPage } from "../long-tail-page";

const page: LongTailPage = {
  slug: "progress-photo-tracker",
  eyebrow: "FITNESS PHOTO TRACKING",
  title: "Progress Photo Tracker",
  lede: "Create a consistent photo baseline, repeat the same setup, and use AI body-composition estimates to track visible physique changes.",
  promise: "People who already take progress photos but want a more structured way to compare body fat range, muscle balance, and visual changes.",
  steps: [
    { title: "Create a baseline", body: "Take your first photo in even lighting and save the numeric AI Body Fat Calculator result locally. This becomes your comparison point." },
    { title: "Repeat every 2 to 4 weeks", body: "Daily photos can create noise. A two-to-four-week cadence usually makes visual changes easier to interpret." },
    { title: "Compare conditions", body: "Use the same camera height, distance, clothing style, pose, and time of day so the photos measure your body, not your setup." },
  ],
  useCases: [
    "progress photo tracker",
    "body transformation photo tracker",
    "physique progress tracker",
    "fitness progress photos app",
  ],
  faq: [
    ["How often should I take progress photos?", "Every 2 to 4 weeks is usually enough for meaningful comparison. More frequent photos can be useful, but they often add noise."],
    ["What should I track besides photos?", "Track weekly weight trend, waist measurement, training performance, energy, and adherence. Photos are strongest when paired with other signals."],
    ["Does AI Body Fat Calculator store my progress photo history?", "The current free baseline stores only numeric results in your browser. The fuller photo history workflow is an interest-tested feature in development."],
  ],
  related: [
    { href: "/progress-tracker", label: "Physique Progress Tracker", note: "See the planned tracking workflow" },
    { href: "/body-fat-calculator-from-photo", label: "Calculator From Photo", note: "Start with one estimate" },
    { href: "/body-fat-estimate-pictures", label: "Visual Estimate Guide", note: "Understand broad visual ranges" },
  ],
};

export const metadata: Metadata = buildPageMetadata({
  title: "Progress Photo Tracker for Physique Changes | AI Body Fat Calculator",
  description: page.lede,
  path: `/${page.slug}`,
});

export default function Page() {
  return <LongTailLanding page={page} />;
}
