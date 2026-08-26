"use client";

export default function InterestCta() {
  function recordInterest() {
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
    dataLayer?.push({ event: "founding_access_clicked", offer: "annual_39_usd" });
  }

  return <a
    className="progress-primary-cta"
    href="mailto:hello@aibodyfatcalculator.com?subject=BodyLens%20Founding%20Access&body=I%20am%20interested%20in%20the%20%2439%2Fyear%20BodyLens%20founding%20plan."
    onClick={recordInterest}
  >Request founding access →</a>;
}
