import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Obese Scale: Why BMI Says Obese and Body Fat Says Something Else",
  description:
    "A scale that prints 'obese' is applying the BMI 30 line. This page runs that line and the body-fat line side by side, converts your weight into fat mass, fat-free mass and fat mass index, and shows how many kilograms sit between you and each line. Includes self-computed age-shifted threshold tables, an FMI grid and a four-way cross-classification.",
  path: "/obese-scale",
});

export default function ObeseScaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
