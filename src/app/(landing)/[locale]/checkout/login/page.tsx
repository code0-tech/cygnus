import { CheckoutGuestForm } from "@/components/checkout/form/CheckoutGuestForm"
import { CheckoutLegalFooter } from "@/components/checkout/shared/CheckoutLegalFooter"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { getCheckoutContent, getErrorsContent, getFooter } from "@/lib/cms"
import { createCheckoutQuery, createCraterLoginCallbackUrl, createMainAppLoginUrl, type CheckoutSearchParams } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { getClientConfig } from "@/lib/clientConfig.server"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

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
    const loginHref = createMainAppLoginUrl(getClientConfig().sculptorLoginUrl, callbackUrl, cancelUrl, deploymentType === "cloud")

    return (
        <div className="flex min-h-full flex-col">
            <main className="flex flex-1 items-center justify-center py-8">
                <div className="flex w-full max-w-3xl flex-col gap-8 text-center">
                    <Link href="/" className="mx-auto flex w-fit">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={128} height={32} className="h-8 w-32 object-contain" priority />
                    </Link>

                    <div className="relative mt-10 grid gap-8 md:grid-cols-2 md:gap-0">
                        <section className="flex flex-col items-center md:px-10">
                            <h1 className="text-balance text-2xl font-semibold text-white sm:text-3xl">{content.login.heading}</h1>
                            <p className="mt-3 max-w-sm flex-1 text-sm leading-6 text-secondary">{content.login.description}</p>
                            <div className="mt-7 w-full">
                                <HapticButtonLink href={loginHref} variant="filled" className="h-11! w-full! bg-white/90! font-semibold! text-primary! hover:bg-white!">
                                    {content.login.loginLabel}
                                </HapticButtonLink>
                            </div>
                        </section>

                        <div aria-hidden="true" className="h-px bg-white/10 md:absolute md:inset-y-0 md:left-1/2 md:h-auto md:w-px" />

                        <section className="flex flex-col items-center md:px-10">
                            <h2 className="text-balance text-2xl font-semibold text-white sm:text-3xl">{content.login.guestHeading}</h2>
                            <p className="mt-3 max-w-sm flex-1 text-sm leading-6 text-secondary">{content.login.guestDescription}</p>
                            <div className="mt-7 w-full">
                                <CheckoutGuestForm
                                    emailLabel={content.form.emailLabel}
                                    emailPlaceholder={content.form.emailPlaceholder}
                                    errorMessage={errors.sessionUnavailable}
                                    guestHref={guestHref}
                                    submitLabel={content.login.guestLabel}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <CheckoutLegalFooter className="shrink-0 justify-center pt-8" currentYear={new Date().getUTCFullYear()} footer={footer} locale={locale} />
        </div>
    )
}
