import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Best BMI Scale: What the Spec Sheet Is Really Worth",
  description:
    "A BMI scale turns weight and the height you typed into one number, and impedance into another. This page prices every printed spec: a +/-0.1 kg tolerance is worth +/-0.035 BMI, while one centimetre of wrong height is worth 0.294 — eight and a half times more. Compute yours.",
  path: "/best-bmi-scale",
});

export default function BestBmiScaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
