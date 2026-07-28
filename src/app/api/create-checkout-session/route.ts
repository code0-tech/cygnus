import { getSubscriptionConfig } from "@/lib/cms"
import { resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
})

export async function POST(req: Request) {
    try {
        const rawBody = await req.text()
        const body = rawBody ? JSON.parse(rawBody) : {}
        const requestData = Object.fromEntries(Object.entries(body.metadata ?? body).map(([key, value]) => [key, String(value ?? "")]))
        const subscriptionConfig = await getSubscriptionConfig("en")

        if (!subscriptionConfig) {
            throw new Error("Subscription configuration is unavailable.")
        }

        const additionalFeatureIds = requestData.additionalFeatures
            ? requestData.additionalFeatures
                  .split(",")
                  .map((featureId) => featureId.trim())
                  .filter(Boolean)
            : []
        const resolvedCheckout = resolveCheckoutPricing({
            additionalFeatureIds,
            aiTokensParam: requestData.aiTokens ?? null,
            customerTypeParam: requestData.customerType ?? null,
            fallbackPeriodSuffix: "/mo",
            paymentPeriodParam: requestData.paymentPeriod ?? null,
            planParam: requestData.plan ?? null,
            subscriptionConfig,
            workflowExecutionsParam: requestData.workflowExecutions ?? null,
        })
        const metadata = resolvedCheckout.isCustomPlan
            ? requestData
            : {
                  paymentPeriod: resolvedCheckout.paymentPeriod,
                  plan: resolvedCheckout.plan,
              }
        const unitAmount = Math.round(resolvedCheckout.pricing.totalPrice * 100)

        if (unitAmount <= 0) {
            throw new Error(`The configured ${resolvedCheckout.planTitle} price must be greater than zero.`)
        }

        const customer = await stripe.customers.create({ metadata })

        const product = await stripe.products.create({
            name: `${resolvedCheckout.planTitle} Subscription`,
            description: subscriptionConfig.packages[resolvedCheckout.plan].description,
            metadata,
        })

        const recurring =
            resolvedCheckout.paymentPeriod === "yearly"
                ? ({ interval: "year" } as const)
                : ({
                      interval: "month",
                      ...(resolvedCheckout.paymentPeriod === "quarterly" ? { interval_count: 3 } : {}),
                  } as const)

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            payment_behavior: "default_incomplete",
            payment_settings: {
                save_default_payment_method: "on_subscription",
            },
            items: [
                {
                    price_data: {
                        currency: "eur",
                        unit_amount: unitAmount,
                        product: product.id,
                        recurring,
                    },
                },
            ],
            metadata,
            expand: ["latest_invoice.confirmation_secret"],
        })

        const latestInvoice = subscription.latest_invoice as Stripe.Invoice
        const confirmationSecret = latestInvoice ? latestInvoice.confirmation_secret : null
        const clientSecret = confirmationSecret ? confirmationSecret.client_secret : null

        if (!clientSecret) {
            throw new Error("Stripe did not return a subscription payment client secret.")
        }

        return NextResponse.json({
            clientSecret,
            subscriptionId: subscription.id,
            customerId: customer.id,
        })
    } catch (err: any) {
        console.error("Stripe checkout session error:", err)
        return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 })
    }
}
