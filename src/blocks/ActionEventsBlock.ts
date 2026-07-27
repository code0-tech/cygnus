import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const ActionEventsBlock: Block = {
    slug: "actionEvents",
    labels: { singular: "Action Events", plural: "Action Events Blocks" },
    fields: [
        sectionFields({ layoutDefaultValue: "left" }),
        { name: "flowTypeLabel", type: "text", required: true, localized: true, defaultValue: "FlowType" },
        { name: "settingsLabel", type: "text", required: true, localized: true, defaultValue: "Settings" },
    ],
}
