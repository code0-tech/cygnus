import type { DefaultValue, GlobalConfig } from "payload"

const localizedDefault =
    (en: string, de: string): DefaultValue =>
    ({ locale }) =>
        locale === "de" ? de : en

export const Licenses: GlobalConfig = {
    slug: "licenses",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "licenses",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("Licenses", "Lizenzen"),
        },
        {
            name: "emptyLicenses",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("No licenses yet", "Noch keine Lizenzen"),
        },
        {
            name: "sidebar",
            type: "group",
            fields: [
                {
                    name: "logout",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Log out", "Abmelden"),
                },
                {
                    name: "loggingOut",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Logging out…", "Wird abgemeldet …"),
                },
            ],
        },
        {
            name: "dashboard",
            type: "group",
            fields: [
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Manage your licenses.", "Verwalte deine Lizenzen."),
                },
                {
                    name: "emptyDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Licenses will appear here as soon as they are available.", "Sobald eine Lizenz vorhanden ist, erscheint sie hier."),
                },
                {
                    name: "invoices",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Invoices", "Rechnungen"),
                },
                {
                    name: "paymentProfiles",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Payment Profiles", "Zahlungsprofile"),
                },
                {
                    name: "customers",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Customers", "Kunden"),
                },
            ],
        },
    ],
}
