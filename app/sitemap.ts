import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base="https://aibodyfatcalculator.com";
  return [
    {url:`${base}/`,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    {url:`${base}/progress-tracker`,lastModified:new Date(),changeFrequency:"weekly",priority:.95},
    {url:`${base}/body-fat-calculator-from-photo`,lastModified:new Date(),changeFrequency:"weekly",priority:.9},
    {url:`${base}/body-fat-estimate-pictures`,lastModified:new Date(),changeFrequency:"weekly",priority:.85},
    {url:`${base}/male-body-fat-percentage-pictures`,lastModified:new Date(),changeFrequency:"weekly",priority:.85},
    {url:`${base}/female-body-fat-percentage-pictures`,lastModified:new Date(),changeFrequency:"weekly",priority:.85},
    {url:`${base}/progress-photo-tracker`,lastModified:new Date(),changeFrequency:"weekly",priority:.9},
    {url:`${base}/bulk-or-cut-calculator-from-photo`,lastModified:new Date(),changeFrequency:"weekly",priority:.9},
    {url:`${base}/army-body-fat-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.9},
    {url:`${base}/ffmi-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.9},
    {url:`${base}/tdee-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/bmi-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/psmf-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/body-fat-percentage-chart`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/privacy`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
    {url:`${base}/terms`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
    {url:`${base}/disclaimer`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
    {url:`${base}/contact`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
  ];
}
