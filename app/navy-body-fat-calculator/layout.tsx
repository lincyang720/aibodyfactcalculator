import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Navy Body Fat Calculator — Tape Method and Army WHtR Comparison",
  description:
    "Run the Navy circumference body fat equation and the Army waist-to-height standard on the same tape measurements. See your Navy body fat percentage, your WHtR, your margin to the 0.550 line, and computed tables showing where the two military methods disagree. Runs in your browser.",
  path: "/navy-body-fat-calculator",
});

export default function NavyBodyFatCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
