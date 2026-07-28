import { linkField } from "@/fields/linkField"
import { sectionFields } from "@/fields/sectionFields"
import type { Block, Field } from "payload"

function cardContentFields(name: string, label: string): Field {
    return {
        name,
        label,
        type: "group",
        fields: [
            {
                name: "title",
                type: "text",
                localized: true,
            },
            {
                name: "description",
                type: "textarea",
                localized: true,
            },
            linkField(),
        ],
    }
}

export const BentoBlock: Block = {
    slug: "bento",
    labels: {
        singular: "Bento",
        plural: "Bento Blocks",
    },
    fields: [
        sectionFields(),
        {
            name: "variant",
            label: "Variant",
            type: "select",
            required: true,
            defaultValue: "feature",
            options: [
                {
                    label: "Feature",
                    value: "feature",
                },
                {
                    label: "Runtime",
                    value: "runtime",
                },
            ],
        },
        {
            name: "featureContent",
            label: "Feature cards",
            type: "group",
            admin: {
                condition: (_, siblingData) => siblingData?.variant === "feature",
            },
            fields: [
                cardContentFields("projects", "Projects"),
                cardContentFields("roleSystem", "Role System"),
                cardContentFields("organizations", "Organizations"),
                cardContentFields("memberManagement", "Member Management"),
            ],
        },
        {
            name: "runtimeContent",
            label: "Runtime cards",
            type: "group",
            admin: {
                condition: (_, siblingData) => siblingData?.variant === "runtime",
            },
            fields: [
                cardContentFields("nodes", "Nodes"),
                cardContentFields("suggestionMenu", "Suggestion Menu"),
                cardContentFields("actionList", "Action List"),
                cardContentFields("runtimeTypes", "Runtime Types"),
            ],
        },
    ],
}
