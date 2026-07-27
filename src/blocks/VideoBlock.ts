import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

function getSourceType(siblingData: unknown) {
    if (!siblingData || typeof siblingData !== "object") return undefined
    return "sourceType" in siblingData ? siblingData.sourceType : undefined
}

export const VideoBlock: Block = {
    slug: "video",
    labels: {
        singular: "Video",
        plural: "Video Blocks",
    },
    fields: [
        sectionFields({ includeLayout: false }),
        {
            name: "sourceType",
            label: "Video Source",
            type: "select",
            required: true,
            defaultValue: "url",
            options: [
                {
                    label: "URL",
                    value: "url",
                },
                {
                    label: "Media",
                    value: "media",
                },
            ],
        },
        {
            name: "videoUrl",
            label: "Video URL",
            type: "text",
            admin: {
                condition: (_, siblingData) => siblingData.sourceType === "url",
            },
            validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) => {
                if (getSourceType(siblingData) !== "url") return true
                return value?.trim() ? true : "A video URL is required."
            },
        },
        {
            name: "video",
            label: "Video Media",
            type: "upload",
            relationTo: "media",
            filterOptions: {
                mimeType: {
                    contains: "video/",
                },
            },
            admin: {
                condition: (_, siblingData) => siblingData.sourceType === "media",
            },
            validate: (value: unknown, { siblingData }: { siblingData: unknown }) => {
                if (getSourceType(siblingData) !== "media") return true
                return value ? true : "A video media file is required."
            },
        },
        {
            name: "poster",
            label: "Poster Image",
            type: "upload",
            relationTo: "media",
            filterOptions: {
                mimeType: {
                    contains: "image/",
                },
            },
            required: false,
        },
        {
            type: "row",
            fields: [
                {
                    name: "controls",
                    label: "Show Controls",
                    type: "checkbox",
                    defaultValue: true,
                },
                {
                    name: "autoPlay",
                    label: "Autoplay",
                    type: "checkbox",
                    defaultValue: false,
                },
                {
                    name: "muted",
                    label: "Muted",
                    type: "checkbox",
                    defaultValue: false,
                },
                {
                    name: "loop",
                    label: "Loop",
                    type: "checkbox",
                    defaultValue: false,
                },
                {
                    name: "playsInline",
                    label: "Play Inline",
                    type: "checkbox",
                    defaultValue: true,
                },
            ],
        },
    ],
}
