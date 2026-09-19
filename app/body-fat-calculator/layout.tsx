import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title:
    "Body Fat Calculator — Estimate Body Fat % (U.S. Navy & BMI Methods) | AI Body Fat Calculator",
  description:
    "Estimate your body fat percentage with the U.S. Navy circumference method or the BMI method. See your category, fat mass, and lean mass. Runs in your browser — no upload, no login.",
  path: "/body-fat-calculator",
});

export default function BodyFatCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
