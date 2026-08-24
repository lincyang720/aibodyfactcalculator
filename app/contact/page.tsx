import type { Metadata } from "next";
import "../tool-pages.css";

export const metadata: Metadata = {
  title: "Contact | BodyLens",
  description: "Contact BodyLens about the AI body fat calculator, privacy, corrections, or partnerships.",
  alternates: { canonical: "https://aibodyfatcalculator.com/contact" },
};

export default function Contact() {
  return <div className="tool-page"><header className="tool-nav"><a href="/">BF · BodyLens</a></header><main className="tool-main legal-page"><div className="tool-eyebrow">CONTACT BODYLENS</div><h1>Contact</h1><p className="tool-lede">Questions, corrections, privacy requests, and partnership inquiries are welcome.</p><h2>Email</h2><p>Send a message to <a href="mailto:hello@aibodyfatcalculator.com">hello@aibodyfatcalculator.com</a>. Please do not attach health records or sensitive personal information.</p><h2>Analysis support</h2><p>For a technical issue, include your browser, device type, and the error message you saw. Do not email the photo you tried to analyze.</p><h2>Medical questions</h2><p>BodyLens cannot provide medical advice. Contact a qualified healthcare professional for diagnosis, treatment, or decisions about your health.</p><a className="back-cta" href="/">Return to calculator</a></main></div>;
}
