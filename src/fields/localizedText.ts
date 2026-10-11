import type { DefaultValue, TextareaField, TextField } from "payload"

interface LocalizedTextOptions {
    type?: "text" | "textarea"
    description?: string
}

function localizedDefault(en: string, de: string): DefaultValue {
    return ({ locale }) => (locale === "de" ? de : en)
}

export function localizedText(name: string, en: string, de: string, { type = "text", description }: LocalizedTextOptions = {}): TextField | TextareaField {
    const field = {
        name,
        required: true,
        localized: true,
        defaultValue: localizedDefault(en, de),
        ...(description ? { admin: { description } } : {}),
    }
    return type === "textarea" ? { ...field, type } : { ...field, type }
}
