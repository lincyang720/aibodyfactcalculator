import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";
import { LongTailLanding, type LongTailPage } from "../long-tail-page";

const page: LongTailPage = {
  slug: "bulk-or-cut-calculator-from-photo",
  eyebrow: "BULK OR CUT DECISION",
  title: "Bulk or Cut Calculator From Photo",
  lede: "Use a photo-based body fat estimate, muscle assessment, and progress baseline to decide whether cutting, lean gaining, or maintenance makes more sense next.",
  promise: "Lifters asking whether to bulk or cut who need body-composition context before choosing calories and training priorities.",
  steps: [
    { title: "Estimate your current range", body: "Run the photo analysis first. A broad body fat range is often enough to make a better phase decision." },
    { title: "Add lean-mass context", body: "Use FFMI, training history, and muscle assessment to separate 'need more muscle' from 'need less fat'." },
    { title: "Pick a phase and retest", body: "Choose a modest calorie target, train consistently, and repeat the photo protocol after several weeks." },
  ],
  useCases: [
    "bulk or cut calculator from photo",
    "should I bulk or cut picture",
    "bulk or cut body fat estimate",
    "AI physique bulk or cut",
  ],
  faq: [
    ["Can a photo decide bulk or cut automatically?", "It can guide the decision, but it should not be the only input. Training age, strength, waist trend, goals, and adherence matter too."],
    ["When is maintenance better than bulk or cut?", "Maintenance can make sense when your estimate is uncertain, your training is inconsistent, or you want to improve habits before changing calories."],
    ["Should beginners bulk or cut first?", "Many beginners do well with maintenance or a small deficit while building training consistency. The right choice depends on starting body fat, goals, and comfort."],
  ],
  related: [
    { href: "/tdee-calculator", label: "TDEE Calculator", note: "Set calorie targets" },
    { href: "/ffmi-calculator", label: "FFMI Calculator", note: "Estimate lean mass context" },
    { href: "/progress-photo-tracker", label: "Progress Photo Tracker", note: "Retest your chosen phase" },
  ],
};

export const metadata: Metadata = buildPageMetadata({
  title: "Bulk or Cut Calculator From Photo | BodyLens",
  description: page.lede,
  path: `/${page.slug}`,
});

export default function Page() {
  return <LongTailLanding page={page} />;
}
