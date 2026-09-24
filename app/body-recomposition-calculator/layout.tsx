import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Body Recomposition Calculator — Calories, Protein and Rate Tables",
  description:
    "Find the daily calorie deficit where fat loss and muscle gain cancel out on the scale — the recomposition point — plus your protein target and a month-by-month body fat projection. Includes self-computed rate tables for every training tier. Runs in your browser.",
  path: "/body-recomposition-calculator",
});

export default function BodyRecompositionCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
