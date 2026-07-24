import type { Block } from "payload"
import { bundledLanguagesInfo } from "shiki"

const languageOptions = bundledLanguagesInfo
    .map(({ id, name }) => ({
        label: name,
        value: id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

export const InstallBlock: Block = {
    slug: "install",
    labels: {
        singular: "Install",
        plural: "Install Blocks",
    },
    fields: [
        {
            name: "heading",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "subheading",
            type: "textarea",
            required: true,
            localized: true,
        },
        {
            name: "label",
            type: "text",
            required: false,
            localized: true,
        },
        {
            name: "language",
            type: "select",
            required: false,
            options: languageOptions,
            admin: {
                description: "Syntax highlighting language. Defaults to Bash when left empty.",
            },
        },
        {
            name: "code",
            type: "textarea",
            required: true,
            localized: true,
            admin: {
                rows: 10,
            },
        },
    ],
}
