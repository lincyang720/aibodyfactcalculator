import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";
import { LongTailLanding, type LongTailPage } from "../long-tail-page";

const page: LongTailPage = {
  slug: "body-fat-estimate-pictures",
  eyebrow: "VISUAL BODY FAT GUIDE",
  title: "Body Fat Estimate Pictures",
  lede: "Use photo-based body fat estimates as a visual reference point, then compare your future progress photos under the same conditions.",
  promise: "Lifters and dieters who search for body fat estimate pictures because they want a realistic visual range, not a generic BMI answer.",
  steps: [
    { title: "Compare broad ranges", body: "A picture is better for rough ranges than exact decimals. Treat nearby categories as overlapping, especially around lighting or pump changes." },
    { title: "Check multiple signals", body: "Look at waist definition, shoulder and chest shape, leg separation, posture, and overall distribution rather than one body part." },
    { title: "Repeat the same setup", body: "Use the same lens distance, lighting, clothing, and time of day when you want progress data instead of a one-off impression." },
  ],
  useCases: [
    "body fat estimate pictures",
    "body fat percentage pictures",
    "estimate body fat from pictures",
    "visual body fat percentage guide",
  ],
  faq: [
    ["Why do body fat picture charts disagree?", "Different people store fat differently, and photos vary by lighting, pose, muscle mass, and camera angle. Use charts as context, not a final answer."],
    ["Should I use front, side, or back photos?", "A front photo is the easiest starting point. For better progress tracking, add consistent side and back photos over time."],
    ["What is the best use of visual estimates?", "The best use is trend tracking. A stable photo protocol can show whether your physique is moving in the direction you intended."],
  ],
  related: [
    { href: "/male-body-fat-percentage-pictures", label: "Male Body Fat Pictures", note: "Visual ranges for men" },
    { href: "/female-body-fat-percentage-pictures", label: "Female Body Fat Pictures", note: "Visual ranges for women" },
    { href: "/body-fat-calculator-from-photo", label: "Calculator From Photo", note: "Get a private estimate from your image" },
  ],
};

export const metadata: Metadata = buildPageMetadata({
  title: "Body Fat Estimate Pictures & Visual Guide | BodyLens",
  description: page.lede,
  path: `/${page.slug}`,
});

export default function Page() {
  return <LongTailLanding page={page} />;
}
