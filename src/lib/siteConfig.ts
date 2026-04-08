import { Metadata } from "next"

const TITLE_TEMPLATE = "%s | CodeZero"
const TITLE_DEFAULT = "CodeZero"
const DESCRIPTION = "Revolutionize the backend development"
const DEFAULT_OG_IMAGE = "/og/home/image.webp"
const DEFAULT_BASE_URL = "https://code0.tech"
export const DEFAULT_DISCORD_URL = "https://discord.com/invite/AyMB7DtA7P"
export const DEFAULT_GITHUB_URL = "https://github.com/code0-tech"
export const DEFAULT_X_URL = "https://x.com"
export const DEFAULT_INSTAGRAM_URL = "https://instagram.com/code0.tech"
const DEFAULT_KEYWORDS = ["Code0", "NoCode", "Backend", "CodeZero", "SEO"]

export function resolveSiteUrl() {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

    if (envUrl) {
        try {
            return new URL(envUrl)
        } catch {
            // Fall back to the default URL when env is malformed.
        }
    }

    return process.env.NODE_ENV === "development"
        ? new URL("http://localhost:3000")
        : new URL(DEFAULT_BASE_URL)
}

export function createMetadata(override: Metadata = {}): Metadata {
    const openGraphOverride = override.openGraph as Metadata["openGraph"] & { type?: string }
    const twitterOverride = override.twitter as Metadata["twitter"] & { card?: string }

    const title = override.title ?? {
        template: TITLE_TEMPLATE,
        default: TITLE_DEFAULT,
    }

    const description = override.description ?? DESCRIPTION
    const metadataBase = override.metadataBase ?? resolveSiteUrl()

    const openGraphImage = openGraphOverride?.images ?? DEFAULT_OG_IMAGE
    const twitterImage = twitterOverride?.images ?? openGraphImage

    const openGraph = {
        ...openGraphOverride,
        title: openGraphOverride?.title ?? title,
        description: openGraphOverride?.description ?? description,
        url: openGraphOverride?.url ?? resolveSiteUrl().toString(),
        images: openGraphImage,
        siteName: openGraphOverride?.siteName ?? "CodeZero",
        type: (openGraphOverride?.type ?? "website") as "website",
    } satisfies Metadata["openGraph"]

    const twitter = {
        ...twitterOverride,
        card: (twitterOverride?.card ?? "summary_large_image") as "summary_large_image",
        title: twitterOverride?.title ?? title,
        description: twitterOverride?.description ?? description,
        images: twitterImage,
    } satisfies Metadata["twitter"]

    return {
        ...override,
        title,
        description,
        icons: override.icons ?? { icon: "/icon.svg" },
        applicationName: override.applicationName ?? title.toString(),
        creator: override.creator ?? "",
        openGraph,
        twitter,
        category: override.category ?? "",
        alternates: override.alternates ?? { canonical: "./" },
        keywords: override.keywords ?? DEFAULT_KEYWORDS,
        metadataBase,
    }
}
