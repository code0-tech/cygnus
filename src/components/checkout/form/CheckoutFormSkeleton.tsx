"use client"

import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import type { CheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutData } from "@/lib/cms"
import { EmailInput } from "@code0-tech/pictor"
import type { StripeCheckoutContact } from "@stripe/stripe-js"
import { IconArrowLeft, IconLock } from "@tabler/icons-react"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { CheckoutBillingSummary } from "./CheckoutBillingSummary"
import { CheckoutFieldLabel } from "./CheckoutFieldLabel"
import { useElementHeight, useMeasureElementHeight, type CheckoutElementHeightKey } from "./checkoutElementHeights"
import { WithdrawalConsentCheckbox } from "./WithdrawalConsentCheckbox"

// A Stripe element that never reports ready (blocked iframe, network hiccup) must not stay hidden behind its placeholder.
const REVEAL_TIMEOUT_MS = 10_000
// Label (10px bar + 12px gap) plus a 40px input, 16px apart: the same rhythm as Stripe's fields.
const FIELD_ROW_HEIGHT = 62
const FIELD_ROW_GAP = 16
const LABEL_WIDTHS = ["w-20", "w-28", "w-16", "w-24", "w-14"]

const FIELD_INPUT_CLASS_NAME = "h-10 w-full rounded-2xl bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
const PRIMARY_BUTTON_CLASS_NAME = "h-10 w-full rounded-2xl bg-white/10"

function ElementSkeleton({ height }: { height: number }) {
    const rows = Math.max(1, Math.ceil((height + FIELD_ROW_GAP) / (FIELD_ROW_HEIGHT + FIELD_ROW_GAP)))

    return (
        <div aria-hidden="true" className="flex animate-pulse flex-col gap-4 overflow-hidden motion-reduce:animate-none" style={{ height }}>
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="shrink-0">
                    <div className={`mb-3 h-2.5 rounded-full bg-white/10 ${LABEL_WIDTHS[index % LABEL_WIDTHS.length]}`} />
                    <div className={FIELD_INPUT_CLASS_NAME} />
                </div>
            ))}
        </div>
    )
}

function StoredHeightSkeleton({ heightKey }: { heightKey: CheckoutElementHeightKey }) {
    return <ElementSkeleton height={useElementHeight(heightKey)} />
}

/**
 * Mounts a Stripe element invisibly underneath a placeholder of its remembered height and only swaps them once the
 * element is ready, so its iframe growing from zero to full height never moves the rest of the checkout.
 */
export function StripeElementSlot({ children, heightKey, ready }: { children: ReactNode; heightKey: CheckoutElementHeightKey; ready: boolean }) {
    const contentRef = useRef<HTMLDivElement>(null)
    const height = useElementHeight(heightKey)
    const [timedOut, setTimedOut] = useState(false)
    const revealed = ready || timedOut

    useEffect(() => {
        if (revealed) return
        const timer = window.setTimeout(() => setTimedOut(true), REVEAL_TIMEOUT_MS)
        return () => window.clearTimeout(timer)
    }, [revealed])

    useMeasureElementHeight(heightKey, ready, contentRef)

    return (
        <div className="relative">
            {!revealed && <ElementSkeleton height={height} />}
            <div ref={contentRef} inert={!revealed} className={revealed ? undefined : "invisible absolute inset-x-0 top-0"}>
                {children}
            </div>
        </div>
    )
}

interface CheckoutFormSkeletonProps {
    billingAddress?: StripeCheckoutContact | null
    collectTaxId: boolean
    content: CheckoutData["form"]
    customerEmail?: string | null
    customerSelect?: ReactNode
    isBusinessCustomer: boolean
    stage: CheckoutStage
}

/**
 * Placeholder with the exact structure of the checkout step it stands in for: headings, texts and static controls are
 * the real ones, only the Stripe elements are replaced by blocks of their remembered height.
 */
export function CheckoutFormSkeleton({ billingAddress, collectTaxId, content, customerEmail, customerSelect, isBusinessCustomer, stage }: CheckoutFormSkeletonProps) {
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale === "de" ? "de" : "en"

    return (
        <div role="status" aria-label={content.processingLabel} data-testid="checkout-form-skeleton" className="w-full">
            <span className="sr-only">{content.processingLabel}</span>
            <div aria-hidden="true" inert className="w-full space-y-6">
                {stage === "billingAddress" ? (
                    <>
                        <section className="w-full space-y-4">
                            <h3 className="text-lg text-white">{content.contactHeading}</h3>
                            {customerSelect}
                            {customerEmail ? (
                                <div className="w-full [&_.input-wrapper]:w-full! [&_.input-wrapper]:bg-[#17151e]!">
                                    <CheckoutFieldLabel>{content.emailLabel}</CheckoutFieldLabel>
                                    <EmailInput value={customerEmail} disabled className="text-secondary! opacity-100!" />
                                </div>
                            ) : (
                                <StoredHeightSkeleton heightKey="contactDetails" />
                            )}
                        </section>

                        <section className="w-full space-y-4">
                            <h3 className="text-lg text-white">{content.billingHeading}</h3>
                            <StoredHeightSkeleton heightKey={collectTaxId ? "billingAddressWithTaxId" : "billingAddress"} />
                        </section>

                        <div className="space-y-3">
                            <div className={PRIMARY_BUTTON_CLASS_NAME} />
                            <p className="text-center text-sm text-tertiary">{content.notChargedYetText}</p>
                            {isBusinessCustomer && (
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-4 text-sm">
                                    <span className="min-w-0 text-secondary">{content.sendOfferPrompt}</span>
                                    <span className="shrink-0 font-medium text-brand">{content.sendOfferLabel}</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <span className="inline-flex items-center gap-1.5 text-sm text-tertiary">
                            <IconArrowLeft aria-hidden="true" size={16} />
                            {content.backToBillingLabel}
                        </span>

                        {billingAddress && <CheckoutBillingSummary billingAddress={billingAddress} changeLabel={content.billingChangeLabel} disabled onChange={() => {}} />}

                        <StoredHeightSkeleton heightKey="payment" />

                        <div className="space-y-3">
                            <AcceptTermsCheckbox disabled locale={locale} initialValue={false} />
                            {!isBusinessCustomer && <WithdrawalConsentCheckbox disabled text={content.withdrawalConsentText} />}
                            <div className={PRIMARY_BUTTON_CLASS_NAME} />
                            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-tertiary">
                                <IconLock aria-hidden="true" size={16} className="shrink-0" />
                                {content.securePaymentText}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
