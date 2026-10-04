import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Body Fat Calculator Caliper: 3-Site vs 7-Site Skinfold",
  description:
    "A skinfold caliper body fat calculator. Enter seven sites and get the Jackson–Pollock 7-site and 3-site results at once, an explanation of why the two disagree, and the error band your own pinch produces — including the smallest change you are allowed to call real. Runs in your browser.",
  path: "/body-fat-calculator-caliper",
});

export default function BodyFatCalculatorCaliperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
