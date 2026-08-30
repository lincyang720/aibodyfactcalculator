import type { Metadata } from "next";
import "./globals.css";
import "./extras.css";
import { buildPageMetadata, SITE_NAME, SITE_ORIGIN } from "./site-metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "AI Body Fat Calculator & Physique Progress Tracker | AI Body Fat Calculator",
    description: "Estimate body fat from a photo, assess muscle balance, and create a baseline for tracking physique progress. Free first analysis, no signup required.",
  }),
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  const gaId="G-CLD1BW94XB";
  const brandSchema={"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://aibodyfatcalculator.com/#organization",name:"AI Body Fat Calculator",alternateName:"AI Body Fat Calculator",url:"https://aibodyfatcalculator.com/",logo:{"@type":"ImageObject",url:"https://aibodyfatcalculator.com/favicon.svg"}},{"@type":"WebSite","@id":"https://aibodyfatcalculator.com/#website",name:"AI Body Fat Calculator",alternateName:"AI Body Fat Calculator",url:"https://aibodyfatcalculator.com/",publisher:{"@id":"https://aibodyfatcalculator.com/#organization"},inLanguage:"en"}]};
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(brandSchema)}}/><script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}/><script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}}/></body></html>;
}
