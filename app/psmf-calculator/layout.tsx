import type { Metadata } from "next";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "PSMF Calculator — Lean Mass & Protein Target | AI Body Fat Calculator",
  description: "Estimate lean body mass and a starting protein target for a protein-sparing modified fast, with important medical and safety limitations.",
  path: "/psmf-calculator",
});

export default function PsmfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
