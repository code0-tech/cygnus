import { CheckoutLogin } from "@/components/checkout/CheckoutLogin"
import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { getCheckoutContent, getFooter } from "@/lib/cms"
import { createCheckoutQuery, createMainAppLoginUrl, type CheckoutSearchParams } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Login" }

interface CheckoutLoginPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<CheckoutSearchParams>
}

export default async function CheckoutLoginPage({ params, searchParams }: CheckoutLoginPageProps) {
    const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()

    const [content, footer] = await Promise.all([getCheckoutContent(locale), getFooter(locale)])
    if (!content?.login) notFound()

    const query = createCheckoutQuery(resolvedSearchParams)
    const guestHref = `/${locale}/checkout${query ? `?${query}` : ""}`
    const siteUrl = resolveSiteUrl()
    const checkoutUrl = new URL(guestHref, siteUrl).toString()
    const configurationUrlParam = resolvedSearchParams.configurationUrl
    const configurationUrlValue = Array.isArray(configurationUrlParam) ? configurationUrlParam[0] : configurationUrlParam
    const fallbackConfigurationUrl = new URL(`/${locale}/subscription`, siteUrl)
    let cancelUrl = fallbackConfigurationUrl.toString()

    if (configurationUrlValue) {
        try {
            const requestedConfigurationUrl = new URL(configurationUrlValue, siteUrl)
            if (requestedConfigurationUrl.origin === siteUrl.origin) cancelUrl = requestedConfigurationUrl.toString()
        } catch {
            // Keep the localized subscription page as the safe cancellation target.
        }
    }

    const loginHref = createMainAppLoginUrl(content.login.loginUrl, checkoutUrl, cancelUrl)

    return (
        <div className="flex min-h-full flex-col">
            <CheckoutLogin content={content.login} guestHref={guestHref} loginHref={loginHref} />
            <CheckoutLegalFooter className="shrink-0 justify-center pt-8" currentYear={new Date().getUTCFullYear()} footer={footer} locale={locale} />
        </div>
    )
}
