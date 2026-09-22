import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title:
    "Body Fat Percentage Calculator — Two Methods at Once, With the Error Bar | AI Body Fat Calculator",
  description:
    "Calculate body fat percentage with the U.S. Navy circumference method and the BMI method at the same time, see how far the two disagree, and get a computed error bar from your own measurement precision. Runs in your browser.",
  path: "/body-fat-percentage-calculator",
});

export default function BodyFatPercentageCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
