import { gradientFields } from "@/fields/gradientFields"
import { linkField } from "@/fields/linkField"
import { playgroundMediaFields } from "@/fields/playgroundMediaFields"
import type { Block } from "payload"

export const ScrollCardBlock: Block = {
    slug: "scrollCards",
    labels: {
        singular: "Scroll Cards",
        plural: "Scroll Cards Blocks",
    },
    fields: [
        {
            name: "items",
            label: "Items",
            type: "array",
            required: true,
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
                    admin: {
                        condition: (_, siblingData) => siblingData?.sectionLayout !== "imageFullscreen",
                    },
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
        },
    ],
}
