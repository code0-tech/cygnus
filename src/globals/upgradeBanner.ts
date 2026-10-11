import { colorField } from "@mvriu5/payload-color-picker"
import type { Field, GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

const planBanner = (name: "pro" | "max" | "custom", defaults: { buttonEn: string; buttonDe: string; from: string; textEn: string; textDe: string; to: string }): Field => ({
    name,
    type: "group",
    fields: [
        localizedText("text", defaults.textEn, defaults.textDe, { description: "Use {plan} as a placeholder for the suggested or current plan name." }),
        localizedText("buttonLabel", defaults.buttonEn, defaults.buttonDe, { description: "Use {plan} as a placeholder for the suggested or current plan name." }),
        colorField({ name: "gradientFrom", label: "Gradient start", required: true, defaultValue: defaults.from }),
        colorField({ name: "gradientTo", label: "Gradient end", required: true, defaultValue: defaults.to }),
    ],
})

export const UpgradeBanner: GlobalConfig = {
    slug: "upgradeBanner",
    label: "Upgrade Banner",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        planBanner("pro", {
            textEn: "Need more? {plan} gives you more headroom.",
            textDe: "Du brauchst mehr? {plan} bietet dir mehr Spielraum.",
            buttonEn: "Upgrade to {plan}",
            buttonDe: "Auf {plan} upgraden",
            from: "#7af69a",
            to: "#13102d",
        }),
        planBanner("max", {
            textEn: "Need tailored capacity? {plan} lets you configure usage for your workload.",
            textDe: "Du brauchst individuelle Kapazitäten? Mit {plan} passt du die Nutzung an deinen Bedarf an.",
            buttonEn: "Upgrade to {plan}",
            buttonDe: "Auf {plan} upgraden",
            from: "#72c9f8",
            to: "#13102d",
        }),
        planBanner("custom", {
            textEn: "Scale {plan} by increasing the included workflow executions and AI tokens.",
            textDe: "Skaliere {plan}, indem du die enthaltenen Workflow-Ausführungen und KI-Tokens erhöhst.",
            buttonEn: "Increase usage",
            buttonDe: "Nutzung erhöhen",
            from: "#f872e2",
            to: "#13102d",
        }),
    ],
}
