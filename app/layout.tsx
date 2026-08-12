import type { Metadata } from "next";
import "./globals.css";
import "./extras.css";

export const metadata: Metadata = {
  title: "AI Body Fat Calculator - Free Body Fat Percentage from Photo",
  description: "Free AI body fat calculator. Upload a photo to get your body fat percentage, muscle group assessment, and personalized action plan. No signup, no calipers needed.",
  alternates: { canonical: "https://aibodyfatcalculator.com/" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph:{title:"AI Body Fat Calculator - Free Body Fat Percentage from Photo",description:"Upload a photo, get your body fat percentage + muscle assessment + action plan. Free, no signup.",url:"https://aibodyfatcalculator.com/",type:"website"},
  twitter:{card:"summary_large_image",title:"AI Body Fat Calculator - Free Body Fat Percentage from Photo",description:"Upload a photo, get your body fat percentage + muscle assessment + action plan. Free."},
};

const softwareSchema = { "@context":"https://schema.org", "@type":"SoftwareApplication", name:"AI Body Fat Calculator", applicationCategory:"HealthApplication", operatingSystem:"Web", description:"Free AI body fat calculator. Upload a photo to estimate body fat percentage.", offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}, isAccessibleForFree:true };
const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:[
  {"@type":"Question",name:"How accurate is AI body fat estimation?",acceptedAnswer:{"@type":"Answer",text:"AI photo analysis provides a directional estimate with a confidence range. Lighting, pose, clothing, and photo angle can affect results."}},
  {"@type":"Question",name:"AI body fat calculator vs DEXA scan?",acceptedAnswer:{"@type":"Answer",text:"DEXA is a clinical measurement and is more precise. AI analysis is a fast, accessible way to establish a visual baseline."}},
  {"@type":"Question",name:"How do I take the best photo?",acceptedAnswer:{"@type":"Answer",text:"Stand relaxed against a plain background in even lighting, with your full body in frame and fitted clothing."}},
  {"@type":"Question",name:"Is it really free?",acceptedAnswer:{"@type":"Answer",text:"Yes. You can run up to three complimentary scans per day with no account required."}}
]};
const breadcrumbSchema = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://aibodyfatcalculator.com/"},{"@type":"ListItem",position:2,name:"AI Body Fat Calculator"}] };

export default function RootLayout({children}:{children:React.ReactNode}) {
  const gaId="G-CLD1BW94XB";
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(softwareSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/><script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}/><script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}}/></body></html>;
}
