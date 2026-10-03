import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Ideal Body Fat Percentage Calculator — Your Band, in Kilograms and Scale Weight",
  description:
    "Ideal body fat percentage calculator: get the ideal band for your age and sex, then see what it actually costs — the kilograms of fat to each edge, the range of scale readings the band corresponds to at your lean mass, and how much of your remaining fat each further point takes. Runs in your browser.",
  path: "/ideal-body-fat-percentage-calculator",
});

export default function IdealBodyFatPercentageCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
