import {
    ConsentManagerDialog,
    ConsentManagerProvider,
    CookieBanner
} from '@c15t/nextjs'
import { getCookieBanner } from '@/lib/cms'
import type { AppLocale } from '@/lib/i18n'
import type { CookieBanner as CookieBannerContent } from '@/payload-types'
import type { ReactNode } from 'react'
import { ConsentManagerClient } from './ConsentManagerClient'

interface ConsentManagerProps {
    children: ReactNode
    locale: AppLocale
}

function getOptionalValue(value?: string | null) {
    const trimmedValue = value?.trim()
    return trimmedValue ? trimmedValue : undefined
}

function mapCookieBannerTranslations(content: CookieBannerContent | null) {
    return {
        common: {
            acceptAll: getOptionalValue(content?.common.acceptAll),
            rejectAll: getOptionalValue(content?.common.rejectAll),
            customize: getOptionalValue(content?.common.customize),
            save: getOptionalValue(content?.common.save),
        },
        cookieBanner: {
            title: getOptionalValue(content?.cookieBanner.title),
            description: getOptionalValue(content?.cookieBanner.description),
        },
        consentManagerDialog: {
            title: getOptionalValue(content?.consentManagerDialog.title),
            description: getOptionalValue(content?.consentManagerDialog.description),
        },
        consentTypes: {
            necessary: {
                title: getOptionalValue(content?.consentTypes.necessary.title),
                description: getOptionalValue(content?.consentTypes.necessary.description),
            },
            measurement: {
                title: getOptionalValue(content?.consentTypes.measurement.title),
                description: getOptionalValue(content?.consentTypes.measurement.description),
            },
            marketing: {
                title: getOptionalValue(content?.consentTypes.marketing.title),
                description: getOptionalValue(content?.consentTypes.marketing.description),
            },
        },
    }
}

export default async function ConsentManager({ children, locale }: ConsentManagerProps) {
    const [englishContent, germanContent, activeContent] = await Promise.all([
        getCookieBanner("en"),
        getCookieBanner("de"),
        getCookieBanner(locale),
    ])

    return (
        <ConsentManagerProvider
            options={{
                mode: 'offline',
                consentCategories: ['necessary', 'measurement', 'marketing'],
                ignoreGeoLocation: true,
                react: {
                    colorScheme: "dark"
                },
                legalLinks: {
                    privacyPolicy: {
                        href: activeContent?.legalLinks.privacyPolicy.href ?? "",
                        label: getOptionalValue(activeContent?.legalLinks.privacyPolicy.label),
                    },
                    termsOfService: {
                        href: activeContent?.legalLinks.termsOfService.href ?? "",
                        label: getOptionalValue(activeContent?.legalLinks.termsOfService.label),
                    }
                },
                translations: {
                    defaultLanguage: locale,
                    translations: {
                        en: mapCookieBannerTranslations(englishContent),
                        de: mapCookieBannerTranslations(germanContent),
                    }
                }
            }}
        >
            <CookieBanner
                legalLinks={["privacyPolicy", "termsOfService"]}
                theme={{
                    "banner.card": "bg-[#201e2c]! border-white/10! shadow-xl!",
                    "banner.footer": "bg-[#201e2c]! border-white/10!",
                    "banner.footer.accept-button": "bg-white/90! hover:bg-white! text-primary! rounded-xl! ring-0! px-4!",
                    "banner.footer.reject-button": "bg-white/90! hover:bg-white! text-primary! rounded-xl! ring-0! px-4!",
                    "banner.footer.customize-button": "text-brand! ring-0! bg-brand/10! hover:bg-brand/20! rounded-xl! px-4!",
                    "banner.header.legal-links.link": "text-brand!"
                }}
            />
            <ConsentManagerDialog
                legalLinks={["privacyPolicy", "termsOfService"]}
                theme={{
                    "dialog.card": "bg-[#201e2c]! border-white/10! shadow-xl!",
                    "widget.footer.accept-button": "bg-white/90! hover:bg-white! text-primary! rounded-xl! ring-0! px-4!",
                    "widget.footer.reject-button": "bg-white/90! hover:bg-white! text-primary! rounded-xl! ring-0! px-4!",
                    "widget.footer.save-button": "text-brand! ring-0! bg-brand/10! hover:bg-brand/20! rounded-xl! px-4!",
                    "dialog.legal-links.link": "text-brand!",
                    "widget.accordion.item": "bg-primary/50! border-white/10! ring-0!",
                    "widget.accordion.trigger": "hover:bg-transparent!",
                    "widget.switch": "group",
                    "widget.switch.track": " group-data-[state=checked]:bg-brand!",
                    "widget.switch.thumb": "bg-white! rounded-full!",
                }}
            />
            <ConsentManagerClient>
                {children}
            </ConsentManagerClient>
        </ConsentManagerProvider>
    )
}
