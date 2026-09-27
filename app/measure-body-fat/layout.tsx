import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Measure Body Fat — and See Where You Fall for Your Age and Sex",
  description:
    "Measure body fat at home with a tape or a caliper, then see it against an age-and-sex corridor this page computes from the Deurenberg equation and the WHO normal BMI range. Includes self-computed corridor tables, crossover ages where fixed charts break, fat-mass conversions and a precision check on your own measurement.",
  path: "/measure-body-fat",
});

export default function MeasureBodyFatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
