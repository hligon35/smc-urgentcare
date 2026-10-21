import type { Metadata } from "expo-router/server";
import { clinic, routes, siteUrl } from "./site";
export function pageMetadata(page: string): Metadata {
  const route = routes.find((route) => route.id === page);
  const title = route
    ? `${route.title} | ${clinic.name}`
    : `Page not found | ${clinic.name}`;
  const description =
    route?.description ||
    "Find your way back to SMC Urgent Care’s clinic information.";
  const canonical = route
    ? `${siteUrl}${route.path === "/" ? "/" : route.path}`
    : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots:
      route && siteUrl === "https://smcurgentcareindy.com"
        ? "index, follow, max-image-preview:large"
        : "noindex, nofollow",
    openGraph: {
      title,
      description,
      type: "website",
      siteName: clinic.name,
      url: canonical,
      images: [
        {
          url: `${siteUrl}/images/caring-visit-v1.webp`,
          width: 1130,
          height: 448,
          alt: "A clinician shares a reassuring smile with a young patient",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/images/caring-visit-v1.webp`],
    },
  };
}
