import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Visceral Fat Calculator — What Your Waist Can and Cannot Tell You",
  description:
    "No tape measure can read visceral fat, but three waist-based proxies can grade central storage. Enter waist, hip, height and weight to get your waist-to-height band, your waist-to-hip verdict and the absolute action level, and see how many of the three fire. Includes self-computed disagreement algebra, height crossovers and waist geometry tables. Runs in your browser.",
  path: "/visceral-fat-calculator",
});

export default function VisceralFatCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
