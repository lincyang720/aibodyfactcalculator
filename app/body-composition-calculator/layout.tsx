import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Body Composition Calculator — Fat, Lean, and Four Routes to One Number",
  description:
    "Body composition calculator that splits your weight into fat mass and lean mass, then prices every kilogram: what 1 kg of fat moves versus 1 kg of lean, how much fat you must lose versus how much lean you must gain to hit the same target, and how far apart two honest readings of the same scale can be. Runs in your browser.",
  path: "/body-composition-calculator",
});

export default function BodyCompositionCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
