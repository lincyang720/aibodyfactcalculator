import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Fat Percentage Calculator — Three Methods, One Honest Range",
  description:
    "One body, three published equations. Enter your measurements and get your fat percentage from the Navy tape method, the BMI method and the Jackson-Pollock 3-site skinfold method at once — plus the spread between them, what each method would have had to see to agree, and how many methods it would actually take to pin the number down. Runs in your browser.",
  path: "/fat-percentage-calculator",
});

export default function FatPercentageCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
