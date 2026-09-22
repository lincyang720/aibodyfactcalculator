import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title:
    "Weight Loss Percentage Calculator — Progress % and Plateau Detection | AI Body Fat Calculator",
  description:
    "Calculate weight loss percentage from your starting and current weight, see how much of your goal you have banked, and check whether your weekly change is above your own scale noise floor. Runs in your browser.",
  path: "/weight-loss-percentage-calculator",
});

export default function WeightLossPercentageCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
