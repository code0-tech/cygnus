import { Metadata } from "next"

const TITLE = "Code0 - Revolutionize the backend development"
const DESCRIPTION = "Revolutionize the backend development"
const DEFAULT_OG_IMAGE = "/og/home/image.webp"
const DEFAULT_BASE_URL = "https://code0.tech"

function resolveMetadataBase() {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    if (envUrl) {
        try {
            return new URL(envUrl)
        } catch {
            // Fall back to a stable URL when env is malformed.
        }
    }
    return process.env.NODE_ENV === "development" ? new URL("http://localhost:3000") : new URL(DEFAULT_BASE_URL)
}

export function createMetadata(override: Metadata): Metadata {
    const openGraphImage = override.openGraph?.images ?? DEFAULT_OG_IMAGE
    const twitterImage = override.twitter?.images ?? openGraphImage

    return {
        ...override,
        title: TITLE,
        description: DESCRIPTION,
        icons: { icon: "/icon.png" },
        applicationName: TITLE,
        creator: "",
        openGraph: {
            ...override.openGraph,
            title: TITLE,
            description: DESCRIPTION,
            url: 'https://code0.tech',
            images: openGraphImage,
            siteName: 'CodeZero',
            type: "website"
           },
           twitter: {
               ...override.twitter,
               card: 'summary_large_image',
               title: TITLE,
               description: DESCRIPTION,
               images: twitterImage,
           },
        category: "",
        alternates: { canonical: "./" },
        keywords: ["Code0", "NoCode", "Backend", "CodeZero", "SEO"],
        metadataBase: resolveMetadataBase(),
    }

}

function getPageImage(slug: string[]) {
    const segments = [...slug, 'image.webp']

    return {
        segments,
        url: `/og/${segments.join('/')}`
    }
}

export const baseUrl =
    process.env.NODE_ENV === "development"
        ? new URL("http://localhost:3000")
        : new URL(DEFAULT_BASE_URL)
