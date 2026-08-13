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

export default function RootLayout({children}:{children:React.ReactNode}) {
  const gaId="G-CLD1BW94XB";
  return <html lang="en"><body>{children}<script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}/><script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}}/></body></html>;
}
