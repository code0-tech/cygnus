import { iconField } from "@mvriu5/payload-icon-picker"
import type { Block } from "payload"

export const SubscriptionConfiguratorBlock: Block = {
    slug: "subscriptionConfigurator",
    labels: {
        singular: "Subscription Configurator",
        plural: "Subscription Configurator Blocks",
    },
    fields: [
        {
            name: "pageIntro",
            label: "Page Intro",
            type: "group",
            fields: [
                {
                    name: "heading",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Configure your setup before you talk pricing.",
                },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                    defaultValue:
                        "Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.",
                },
            ],
        },
        {
            name: "featureOverview",
            label: "Feature Overview",
            type: "array",
            required: false,
            minRows: 1,
            defaultValue: [
                {
                    title: "Fast onboarding",
                    description: "Move from evaluation to a concrete subscription path without guessing which packaging model fits your rollout.",
                    icon: "tabler:IconRocket",
                },
                {
                    title: "Commercial clarity",
                    description: "Separate customer type, hosting model, and runtime expectations before a plan is proposed.",
                    icon: "tabler:IconUserShield",
                },
                {
                    title: "Usage visibility",
                    description: "Shape your quote around expected workflow execution volume instead of a generic flat plan.",
                    icon: "tabler:IconGauge",
                },
            ],
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: false,
                    localized: true,
                },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
                iconField({
                    name: "icon",
                    label: "Icon",
                    required: true,
                    placeholder: "Search icons",
                    noResultsLabel: "No icons found",
                    admin: {
                        position: "sidebar",
                    },
                }),
            ],
        },
        {
            name: "buttons",
            label: "Buttons",
            type: "array",
            required: false,
            maxRows: 3,
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "url",
                    type: "text",
                    required: true,
                },
                {
                    name: "variant",
                    type: "select",
                    required: false,
                    defaultValue: "normal",
                    options: [
                        { label: "None", value: "none" },
                        { label: "Normal", value: "normal" },
                        { label: "Outlined", value: "outlined" },
                        { label: "Filled", value: "filled" },
                    ],
                },
            ],
        },
    ],
}
