import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "BMI Machine: Five Tests for the One You Already Own",
  description:
    "A BMI machine measures one thing — your weight — and computes the rest. Five tests you can run at home tell you whether yours is off: an add-mass gain test, two known masses for gain and offset, a corner placement test, a repeatability test and a drift test, all with computed thresholds.",
  path: "/bmi-machine",
});

export default function BmiMachineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
