import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Measure Body Fat Percentage — The Smallest Change Your Tape Can See",
  description:
    "Measure your body fat percentage at home with the Navy tape method and the Jackson-Pollock 3-site skinfold method — and see the resolution floor of the instrument you used: the smallest change your tape or caliper can actually register, in percentage points and in kilograms of fat. Runs in your browser.",
  path: "/measure-body-fat-percentage",
});

export default function MeasureBodyFatPercentageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
