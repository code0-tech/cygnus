import type { Field } from "payload"

function selectedMediaType(siblingData: unknown) {
    if (!siblingData || typeof siblingData !== "object") return "image"
    return "mediaType" in siblingData && siblingData.mediaType === "playground" ? "playground" : "image"
}

export function validatePlaygroundUrl(value: string | null | undefined, siblingData?: unknown) {
    if (siblingData !== undefined && selectedMediaType(siblingData) !== "playground") return true

    const url = value?.trim()
    if (!url) return "A playground URL is required."
    if (url.startsWith("/") && !url.startsWith("//")) return true

    try {
        const parsedUrl = new URL(url)
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? true : "The playground URL must use HTTP or HTTPS."
    } catch {
        return "Enter a valid playground URL."
    }
}

export function playgroundMediaFields(): Field[] {
    return [
        {
            name: "mediaType",
            label: "Media Type",
            type: "select",
            required: true,
            defaultValue: "image",
            options: [
                { label: "Image", value: "image" },
                { label: "Playground", value: "playground" },
            ],
        },
        {
            name: "image",
            label: "Image",
            type: "upload",
            relationTo: "media",
            required: false,
            admin: {
                condition: (_, siblingData) => selectedMediaType(siblingData) === "image",
            },
        },
        {
            name: "playgroundUrl",
            label: "Playground URL",
            type: "text",
            required: false,
            admin: {
                condition: (_, siblingData) => selectedMediaType(siblingData) === "playground",
            },
            validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) => validatePlaygroundUrl(value, siblingData),
        },
    ]
}

