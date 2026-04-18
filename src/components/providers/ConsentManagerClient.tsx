"use client"

import {
    ConsentDialog,
    ConsentManagerProvider,
    ConsentBanner,
    type ConsentManagerOptions,
    type Theme
} from '@c15t/nextjs'
import { gtag } from '@c15t/scripts/google-tag'
import type { ReactNode } from 'react'

const consentTheme = {
    slots: {
        consentBannerTitle: "text-white!",
        consentBannerDescription: "text-white/75! [&_a]:text-brand!",
        consentBannerCard: "bg-[#201e2c]! border-white/10! shadow-xl!",
        consentBannerFooter: "bg-[#201e2c]! border-white/10!",
        consentDialogTitle: "text-white!",
        consentDialogDescription: "text-white/75! [&_a]:text-brand!",
        consentDialogCard: "bg-[#201e2c]! border-white/10! shadow-xl!",
        consentWidgetAccordion: "[--consent-widget-accordion-background-color:color-mix(in_oklab,var(--color-primary)_50%,transparent)] [--consent-widget-accordion-background-color-dark:color-mix(in_oklab,var(--color-primary)_50%,transparent)] [--consent-widget-accordion-background-hover:color-mix(in_oklab,var(--color-primary)_65%,transparent)] [--consent-widget-accordion-background-hover-dark:color-mix(in_oklab,var(--color-primary)_65%,transparent)] [--consent-widget-accordion-border-color:rgb(255_255_255_/0.1)] [--consent-widget-accordion-border-color-dark:rgb(255_255_255_/0.1)] [--consent-widget-accordion-text-color:rgb(255_255_255)] [--consent-widget-accordion-text-color-dark:rgb(255_255_255)] [--consent-widget-accordion-content-color:rgb(255_255_255_/0.75)] [--consent-widget-accordion-content-color-dark:rgb(255_255_255_/0.75)]",
        buttonPrimary: "bg-white/90! hover:bg-white! text-primary! rounded-xl! px-4! border-0! ring-0! shadow-none! outline-none! focus-visible:outline-none! focus-visible:ring-0! focus-visible:ring-transparent!",
        buttonSecondary: "text-brand! bg-brand/10! hover:bg-brand/20! rounded-xl! px-4! border-0! ring-0! shadow-none! outline-none! focus-visible:outline-none! focus-visible:ring-0! focus-visible:ring-transparent!",
        toggle: "group data-[state=checked]:bg-brand! [&>span]:bg-white! [&>span]:rounded-full!",
    }
} satisfies Theme

interface ConsentManagerClientProps {
    children: ReactNode
    gaMeasurementId?: string
    legalLinks: NonNullable<ConsentManagerOptions["legalLinks"]>
    i18n: NonNullable<ConsentManagerOptions["i18n"]>
}

export function ConsentManagerClient({
    children,
    gaMeasurementId,
    legalLinks,
    i18n,
}: ConsentManagerClientProps) {
    return (
        <ConsentManagerProvider
            options={{
                mode: 'offline',
                theme: consentTheme,
                scripts: gaMeasurementId ? [
                    gtag({
                        id: gaMeasurementId,
                        category: 'measurement',
                    })
                ] : [],
                consentCategories: ['necessary', 'measurement', 'marketing'],
                legalLinks,
                i18n,
            }}
        >
            <ConsentBanner legalLinks={["privacyPolicy", "termsOfService"]} />
            <ConsentDialog legalLinks={["privacyPolicy", "termsOfService"]} />
            {children}
        </ConsentManagerProvider>
    )
}
