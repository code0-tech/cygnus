import type { GroupField } from "payload"

interface LinkFieldOptions {
    label?: string
    name?: string
    required?: boolean
}

export function linkField({ label = "Link", name = "link", required = false }: LinkFieldOptions = {}): GroupField {
    return {
        name,
        label,
        type: "group",
        required,
        fields: [
            {
                name: "label",
                type: "text",
                required,
                localized: true,
            },
            {
                name: "url",
                type: "text",
                required,
            },
        ],
    }
}
