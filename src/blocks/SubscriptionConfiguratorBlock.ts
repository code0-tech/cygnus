import type { Block } from "payload"

export const SubscriptionConfiguratorBlock: Block = {
    slug: "subscriptionConfigurator",
    labels: {
        singular: "Subscription Configurator",
        plural: "Subscription Configurator Blocks",
    },
    fields: [
        {
            name: "selectionDefaults",
            label: "Selection Defaults",
            type: "group",
            admin: { description: "Used only when the URL does not specify the corresponding option." },
            fields: [
                {
                    name: "customerType",
                    label: "Customer Type",
                    type: "select",
                    enumName: "subscription_config_customer_type_default",
                    defaultValue: "b2c",
                    options: [
                        { label: "Personal (B2C)", value: "b2c" },
                        { label: "Business (B2B)", value: "b2b" },
                    ],
                },
                {
                    name: "plan",
                    label: "Plan",
                    type: "select",
                    enumName: "subscription_config_plan_default",
                    defaultValue: "custom",
                    options: [
                        { label: "Pro", value: "pro" },
                        { label: "Max", value: "max" },
                        { label: "Custom", value: "custom" },
                    ],
                },
                {
                    name: "deployment",
                    label: "Deployment",
                    type: "select",
                    enumName: "subscription_config_deployment_default",
                    defaultValue: "self_hosted",
                    options: [
                        { label: "Self-hosted", value: "self_hosted" },
                        { label: "Cloud", value: "cloud" },
                    ],
                },
                {
                    name: "paymentPeriodB2C",
                    label: "Personal Payment Period",
                    type: "select",
                    enumName: "subscription_config_period_b2c_default",
                    defaultValue: "monthly",
                    options: [
                        { label: "Monthly", value: "monthly" },
                        { label: "Quarterly", value: "quarterly" },
                        { label: "Yearly", value: "yearly" },
                    ],
                },
                {
                    name: "paymentPeriodB2B",
                    label: "Business Payment Period",
                    type: "select",
                    enumName: "subscription_config_period_b2b_default",
                    defaultValue: "monthly",
                    options: [
                        { label: "Monthly", value: "monthly" },
                        { label: "Quarterly", value: "quarterly" },
                        { label: "Yearly", value: "yearly" },
                    ],
                },
                {
                    name: "usageB2C",
                    label: "Personal Usage Defaults",
                    type: "group",
                    fields: [
                        { name: "workflowExecutions", label: "Workflow Executions", type: "number", min: 1 },
                        { name: "aiTokens", label: "AI Tokens", type: "number", min: 1 },
                    ],
                },
                {
                    name: "usageB2B",
                    label: "Business Usage Defaults",
                    type: "group",
                    fields: [
                        { name: "workflowExecutions", label: "Workflow Executions", type: "number", min: 1 },
                        { name: "aiTokens", label: "AI Tokens", type: "number", min: 1 },
                    ],
                },
            ],
        },
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
