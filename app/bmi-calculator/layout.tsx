import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "BMI Calculator — Adult BMI, Healthy Range & Limitations | AI Body Fat Calculator",
  description: "Calculate adult BMI from height and weight, understand standard BMI categories, and learn when body composition is more useful than BMI alone.",
  path: "/bmi-calculator",
});

export default function BmiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
