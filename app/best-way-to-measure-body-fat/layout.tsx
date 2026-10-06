import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Best Way to Measure Body Fat: Pick the Method You Can Repeat",
  description:
    "Every home method turns a few measurements into a percentage, and all of them are limited by how closely you can repeat those measurements. At half a centimetre of tape slop the tape carries 0.57 body fat points; a caliper at one millimetre carries 0.52; a caliper only wins if you can repeat a pinch to 1.09 mm. Compute your own.",
  path: "/best-way-to-measure-body-fat",
});

export default function BestWayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
