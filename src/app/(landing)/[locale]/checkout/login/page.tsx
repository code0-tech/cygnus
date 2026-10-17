import { CheckoutLogin } from "@/components/checkout/CheckoutLogin"
import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { getCheckoutContent, getErrorsContent, getFooter } from "@/lib/cms"
import { canSkipCheckoutLogin, createCheckoutQuery, createCraterLoginCallbackUrl, createMainAppLoginUrl, type CheckoutSearchParams } from "@/lib/checkout/checkoutLogin"
import { CRATER_USER_LOGIN_COOKIE_NAME, CRATER_USER_LOGIN_COOKIE_VALUE } from "@/lib/checkout/craterUserLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = { title: "Login" }

interface CheckoutLoginPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<CheckoutSearchParams>
}

export default async function CheckoutLoginPage({ params, searchParams }: CheckoutLoginPageProps) {
    const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()

    const [content, errors, footer] = await Promise.all([getCheckoutContent(locale), getErrorsContent(locale), getFooter(locale)])
    if (!content?.login || !content.form || !errors) notFound()

    const query = createCheckoutQuery(resolvedSearchParams)
    const guestHref = `/${locale}/checkout${query ? `?${query}` : ""}`
    const siteUrl = resolveSiteUrl()
    const callbackUrl = createCraterLoginCallbackUrl(siteUrl, guestHref)
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

    const deploymentTypeParam = resolvedSearchParams.deploymentType
    const deploymentType = Array.isArray(deploymentTypeParam) ? deploymentTypeParam[0] : deploymentTypeParam
    const loginHref = createMainAppLoginUrl(content.login.loginUrl, callbackUrl, cancelUrl, deploymentType === "cloud")

    const craterUserLogin = (await cookies()).get(CRATER_USER_LOGIN_COOKIE_NAME)?.value === CRATER_USER_LOGIN_COOKIE_VALUE
    if (canSkipCheckoutLogin(craterUserLogin, deploymentType)) redirect(guestHref)

    return (
        <div className="flex min-h-full flex-col">
            <CheckoutLogin content={content.login} form={content.form} guestError={errors.sessionUnavailable} guestHref={guestHref} loginHref={loginHref} />
            <CheckoutLegalFooter className="shrink-0 justify-center pt-8" currentYear={new Date().getUTCFullYear()} footer={footer} locale={locale} />
        </div>
    )
}
