import type { Field } from "payload"

export function gradientFields(): Field[] {
    return [
        {
            name: "gradient",
            label: "Gradient",
            type: "select",
            required: false,
            defaultValue: "blue",
            options: [
                { label: "Blue", value: "blue" },
                { label: "Yellow", value: "yellow" },
                { label: "Pink", value: "pink" },
                { label: "Aqua", value: "aqua" },
                { label: "Brand", value: "brand" },
                { label: "Lime", value: "lime" },
                { label: "Magenta", value: "magenta" },
                { label: "Neutral", value: "neutral" },
            ],
        },
        {
            name: "gradientDirection",
            label: "Gradient Direction",
            type: "select",
            required: false,
            defaultValue: "topLeft",
            options: [
                { label: "Top left", value: "topLeft" },
                { label: "Top right", value: "topRight" },
                { label: "Bottom left", value: "bottomLeft" },
                { label: "Bottom right", value: "bottomRight" },
            ],
        },
    ]
}
