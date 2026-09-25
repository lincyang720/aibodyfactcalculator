import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Army BMI Calculator — BMI, Waist-to-Height and Central Fat Zones",
  description:
    "Calculate your BMI, check it against the current Army waist-to-height standard, and see which central fat storage zone your waist puts you in. Includes self-computed waist, waist-to-height and waist-to-hip cross-reference tables. Runs in your browser.",
  path: "/army-bmi-calculator",
});

export default function ArmyBmiCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
