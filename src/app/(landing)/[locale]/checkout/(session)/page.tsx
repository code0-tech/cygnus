import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent"
import { StripePreloadHints } from "@/components/checkout/StripePreloadHints"
import { createCheckoutQuery, hasCheckoutConfiguration, resolveCheckoutLoginRedirect, type CheckoutSearchParams } from "@/lib/checkout/checkoutLogin"
import { CRATER_USER_LOGIN_COOKIE_NAME, CRATER_USER_LOGIN_COOKIE_VALUE } from "@/lib/crater/sessionCookies"
import { assertCheckoutParameters } from "@/lib/checkout/checkoutParameters"
import { getFooter, getGlobal } from "@/lib/cms"
import { getCraterCheckoutPackages } from "@/lib/subscription/checkoutPackages.server"
import { getCraterSubscriptionPrices } from "@/lib/subscription/prices.server"
import { isSupportedLocale } from "@/lib/i18n"
import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = { title: "Checkout" }

interface CheckoutPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<CheckoutSearchParams>
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
    const [{ locale }, query] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()
    const checkoutParameters = new URLSearchParams(createCheckoutQuery(query))
    if (!hasCheckoutConfiguration(checkoutParameters)) redirect(`/${locale}/subscription`)
    assertCheckoutParameters(checkoutParameters)
    // The session cookie is scoped to /api/crater and never reaches this page; the token-free marker does.
    const hasAccountLogin = (await cookies()).get(CRATER_USER_LOGIN_COOKIE_NAME)?.value === CRATER_USER_LOGIN_COOKIE_VALUE
    const loginRedirect = resolveCheckoutLoginRedirect(locale, query, hasAccountLogin)
    if (loginRedirect) redirect(loginRedirect)

    const [checkoutContent, subscriptionConfig, subscriptionPrices, checkoutPackages, footer, errors, requestHeaders] = await Promise.all([
        getGlobal("checkout", locale),
        getGlobal("subscriptionConfig", locale),
        getCraterSubscriptionPrices(),
        getCraterCheckoutPackages(),
        getFooter(locale),
        getGlobal("errors", locale),
        headers(),
    ])
    const currentYear = new Date().getUTCFullYear()

    return (
        <div className="flex flex-1 flex-col gap-8">
            <StripePreloadHints nonce={requestHeaders.get("x-nonce") ?? undefined} />
            <CheckoutPageContent
                checkoutPackages={checkoutPackages}
                currentYear={currentYear}
                errors={errors}
                footer={footer}
                form={checkoutContent?.form}
                locale={locale}
                subscriptionConfig={subscriptionConfig}
                nextSteps={checkoutContent?.nextSteps}
                subscriptionPrices={subscriptionPrices}
                summary={checkoutContent?.summary}
            />
        </div>
    )
}
