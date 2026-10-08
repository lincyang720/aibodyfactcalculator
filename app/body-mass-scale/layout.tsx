import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Body Mass Scale: The Number Is Noise, the Trend Is Data",
  description:
    "A body mass scale gives you one reading a day, and any single reading is mostly noise. This page computes what the series can actually prove: how wide one weigh-in is, how many days of data a given rate of loss needs before it is real, why a regression over every day beats comparing two readings by a factor of sqrt(N/6), what the display graduation is worth, and how many body-fat points one kilogram is worth.",
  path: "/body-mass-scale",
});

export default function BodyMassScaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
