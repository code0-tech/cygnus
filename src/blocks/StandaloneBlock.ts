import { gradientFields } from "@/fields/gradientFields"
import { linkField } from "@/fields/linkField"
import { playgroundMediaFields } from "@/fields/playgroundMediaFields"
import type { Block } from "payload"

export const StandaloneBlock: Block = {
    slug: "standaloneCard",
    labels: {
        singular: "Standalone Card",
        plural: "Standalone Card Blocks",
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "description",
            type: "textarea",
            required: false,
            localized: true,
        },
        {
            name: "showImageBorder",
            label: "Show Image Border",
            type: "checkbox",
            defaultValue: true,
        },
        {
            name: "sectionLayout",
            label: "Section Layout",
            type: "select",
            required: true,
            defaultValue: "imageRight",
            options: [
                {
                    label: "Image right",
                    value: "imageRight",
                },
                {
                    label: "Image left",
                    value: "imageLeft",
                },
                {
                    label: "Image fullscreen",
                    value: "imageFullscreen",
                },
                {
                    label: "Image right fullscreen",
                    value: "imageRightFullscreen",
                },
                {
                    label: "Image left fullscreen",
                    value: "imageLeftFullscreen",
                },
            ],
        },
        ...gradientFields(),
        {
            name: "bulletPoints",
            label: "Bullet Points",
            type: "text",
            required: false,
            hasMany: true,
            localized: true,
        },
        ...playgroundMediaFields(),
        linkField(),
    ],
}
