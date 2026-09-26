import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Fat Calculator — Body Fat From Tape or Caliper, With an Error Budget",
  description:
    "A body fat calculator that works from measurements you can take at home — tape circumferences or three skinfolds — and then tells you how much of the answer is measurement error. Includes self-computed per-site sensitivity tables, an error budget and a minimum detectable change table. Runs in your browser.",
  path: "/fat-calculator",
});

export default function FatCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
