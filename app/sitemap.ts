import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base="https://aibodyfatcalculator.com";
  return [
    {url:`${base}/`,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    {url:`${base}/army-body-fat-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.9},
    {url:`${base}/tdee-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/bmi-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/psmf-calculator`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/body-fat-percentage-chart`,lastModified:new Date(),changeFrequency:"monthly",priority:.8},
    {url:`${base}/privacy`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
    {url:`${base}/terms`,lastModified:new Date(),changeFrequency:"yearly",priority:.2},
  ];
}
