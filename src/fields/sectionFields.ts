import type { CollapsibleField, Field, SelectField } from "payload"

const DEFAULT_LAYOUT_OPTIONS: SelectField["options"] = [
    { label: "Center", value: "center" },
    { label: "Left", value: "left" },
]

interface SectionFieldOptions {
    additionalFieldsAfterLayout?: Field[]
    descriptionDefaultValue?: string
    headingDefaultValue?: string
    includeLayout?: boolean
    includeLinkButton?: boolean
    layoutDefaultValue?: string
    layoutOptions?: SelectField["options"]
}

export function sectionFields({
    additionalFieldsAfterLayout = [],
    descriptionDefaultValue,
    headingDefaultValue,
    includeLayout = true,
    includeLinkButton = true,
    layoutDefaultValue = "center",
    layoutOptions = DEFAULT_LAYOUT_OPTIONS,
}: SectionFieldOptions = {}): CollapsibleField {
    const fields: Field[] = [
        {
            name: "sectionHeading",
            label: "Section Heading",
            type: "text",
            required: false,
            localized: true,
            ...(headingDefaultValue === undefined ? {} : { defaultValue: headingDefaultValue }),
        },
    ]

    if (includeLayout) {
        fields.push({
            name: "sectionLayout",
            label: "Section Layout",
            type: "select",
            required: true,
            defaultValue: layoutDefaultValue,
            options: layoutOptions,
        })
    }

    fields.push(
        ...additionalFieldsAfterLayout,
        {
            name: "sectionDescription",
            label: "Section Description",
            type: "textarea",
            required: false,
            localized: true,
            ...(descriptionDefaultValue === undefined ? {} : { defaultValue: descriptionDefaultValue }),
        }
    )

    if (includeLinkButton) {
        fields.push({
            name: "sectionLinkButton",
            label: "Section Link Button",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                },
                {
                    name: "url",
                    type: "text",
                    required: false,
                },
            ],
        })
    }

    return {
        type: "collapsible",
        label: "Section",
        fields,
    }
}
