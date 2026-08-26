import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "TDEE Calculator — Estimate Daily Calories & Energy Needs | BodyLens",
  description: "Estimate total daily energy expenditure using age, sex, height, weight, and activity level, with practical guidance for calibrating calories over time.",
  path: "/tdee-calculator",
});

export default function TdeeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
