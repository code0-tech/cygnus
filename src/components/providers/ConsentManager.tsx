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
    const gaMeasurementId = getOptionalValue(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    const legalLinks = {
        privacyPolicy: {
            href: activeContent?.legalLinks.privacyPolicy.href ?? "",
            label: getOptionalValue(activeContent?.legalLinks.privacyPolicy.label),
        },
        termsOfService: {
            href: activeContent?.legalLinks.termsOfService.href ?? "",
            label: getOptionalValue(activeContent?.legalLinks.termsOfService.label),
        }
    }
    const i18n = {
        locale,
        messages: {
            en: mapCookieBannerTranslations(englishContent),
            de: mapCookieBannerTranslations(germanContent),
        }
    }

    return (
        <ConsentManagerClient
            gaMeasurementId={gaMeasurementId}
            legalLinks={legalLinks}
            i18n={i18n}
        >
            {children}
        </ConsentManagerClient>
    )
}
