import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";
import { LongTailLanding, type LongTailPage } from "../long-tail-page";

const page: LongTailPage = {
  slug: "male-body-fat-percentage-pictures",
  eyebrow: "MEN'S VISUAL GUIDE",
  title: "Male Body Fat Percentage Pictures",
  lede: "Estimate a men's body fat range from visible physique markers, then use AI Body Fat Calculator to create a repeatable photo baseline.",
  promise: "Men comparing cutting, maintenance, or recomposition progress who need a visual range before choosing the next nutrition phase.",
  steps: [
    { title: "Look beyond abs", body: "Ab visibility matters, but waist shape, chest definition, shoulder separation, and leg definition also influence the visual range." },
    { title: "Account for muscle mass", body: "Two men at the same body fat percentage can look different if one has more lean mass. Pair this page with FFMI for better context." },
    { title: "Track the trend", body: "A single estimate helps you orient. Repeated photos under the same setup tell you whether the cut or bulk is working." },
  ],
  useCases: [
    "male body fat percentage pictures",
    "men body fat visual guide",
    "male body fat estimate photo",
    "what body fat percentage am I male",
  ],
  faq: [
    ["Can men estimate body fat from ab visibility alone?", "Ab visibility is one clue, but not enough by itself. Fat distribution, muscle size, lighting, and posture can make the same percentage look different."],
    ["What matters for a cutting phase?", "Use waist trend, photo consistency, strength performance, and weekly weight change together. Do not chase one AI estimate in isolation."],
    ["How can I make comparisons fair?", "Use the same camera height, distance, lighting, pose, and time of day. Avoid flexing in one photo and relaxing in another."],
  ],
  related: [
    { href: "/bulk-or-cut-calculator-from-photo", label: "Bulk or Cut From Photo", note: "Decide your next phase" },
    { href: "/ffmi-calculator", label: "FFMI Calculator", note: "Add lean mass context" },
    { href: "/progress-tracker", label: "Progress Tracker", note: "Repeat your check-ins" },
  ],
};

export const metadata: Metadata = buildPageMetadata({
  title: "Male Body Fat Percentage Pictures | AI Body Fat Calculator",
  description: page.lede,
  path: `/${page.slug}`,
});

export default function Page() {
  return <LongTailLanding page={page} />;
}
