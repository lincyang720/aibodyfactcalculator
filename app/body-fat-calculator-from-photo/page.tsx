import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";
import { LongTailLanding, type LongTailPage } from "../long-tail-page";

const page: LongTailPage = {
  slug: "body-fat-calculator-from-photo",
  eyebrow: "PHOTO BODY FAT ESTIMATE",
  title: "Body Fat Calculator From Photo",
  lede: "Upload a clear full-body photo and get a directional body fat estimate, confidence range, and muscle assessment without calipers or tape measurements.",
  promise: "People who want a fast baseline from a picture, then want to repeat the same photo setup to track visual progress over time.",
  steps: [
    { title: "Use a consistent photo", body: "Stand relaxed, face the camera, keep your full body in frame, and use even lighting. Consistency matters more than a perfect single photo." },
    { title: "Read the range, not only the number", body: "Photo analysis can be useful for direction, but pose, clothing, camera angle, hydration, and lighting can all move the estimate." },
    { title: "Save a baseline", body: "After the scan, save the numeric result locally and compare future check-ins under similar conditions." },
  ],
  useCases: [
    "body fat calculator from photo",
    "calculate body fat from picture",
    "AI body fat photo estimator",
    "body fat percentage by picture",
  ],
  faq: [
    ["Can a photo really calculate body fat?", "A photo can support a directional estimate, especially for tracking changes under consistent conditions. It should not be treated like a clinical measurement."],
    ["Is this better than a smart scale?", "It is different. Smart scales estimate from electrical impedance, while photo analysis estimates from visible composition markers. Both are best used as trend tools."],
    ["Does AI Body Fat Calculator save my photo?", "AI Body Fat Calculator does not store your uploaded photo. The image is sent to the AI processor for the requested analysis, and the saved baseline stores only numeric results in your browser."],
  ],
  related: [
    { href: "/progress-tracker", label: "Physique Progress Tracker", note: "Turn one estimate into a repeatable check-in" },
    { href: "/body-fat-estimate-pictures", label: "Body Fat Estimate Pictures", note: "Understand visual estimate ranges" },
    { href: "/body-fat-percentage-chart", label: "Body Fat Percentage Chart", note: "Compare common men and women ranges" },
  ],
};

export const metadata: Metadata = buildPageMetadata({
  title: "Body Fat Calculator From Photo | AI Body Fat Calculator",
  description: page.lede,
  path: `/${page.slug}`,
});

export default function Page() {
  return <LongTailLanding page={page} />;
}
