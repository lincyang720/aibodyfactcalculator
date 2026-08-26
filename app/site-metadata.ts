import type { Metadata } from "next";

export const SITE_ORIGIN = "https://aibodyfatcalculator.com";
export const SITE_NAME = "BodyLens";

type PageMetadata = {
  title: string;
  description: string;
  path?: string;
  index?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = "/",
  index = true,
}: PageMetadata): Metadata {
  const canonical = new URL(path, SITE_ORIGIN).toString();

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{
        url: `${SITE_ORIGIN}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "BodyLens AI body fat calculator and physique progress tracker",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_ORIGIN}/opengraph-image`],
    },
  };
}
