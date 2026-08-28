import { sectionFields } from "@/fields/sectionFields"
import { validatePlaygroundUrl } from "@/fields/playgroundMediaFields"
import type { Block } from "payload"

export const FlowExampleBlock: Block = {
    slug: "flowExample",
    labels: {
        singular: "Flow Example",
        plural: "Flow Examples",
    },
    fields: [
        sectionFields(),
        {
            name: "contentHeading",
            label: "Content Heading",
            type: "text",
            localized: true,
        },
        {
            name: "contentDescription",
            label: "Content Description",
            type: "textarea",
            localized: true,
        },
        {
            name: "flowLayout",
            label: "Playground Layout",
            type: "select",
            required: true,
            defaultValue: "left",
            options: [
                { label: "Playground left", value: "left" },
                { label: "Playground right", value: "right" },
            ],
        },
        {
            name: "playgroundUrl",
            label: "Playground URL",
            type: "text",
            required: false,
            validate: (value: string | null | undefined) => validatePlaygroundUrl(value),
        },
        {
            name: "showBorder",
            label: "Show Border",
            type: "checkbox",
            defaultValue: false,
        },
    ],
}
