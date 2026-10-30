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
    ],
}
