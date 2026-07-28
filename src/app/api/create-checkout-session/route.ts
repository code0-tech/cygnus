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
        const metadata = Object.fromEntries(Object.entries(body.metadata ?? body).map(([key, value]) => [key, String(value ?? "")]))
        const unitAmount = Number.isFinite(Number(body.amount)) && Number(body.amount) > 0 ? Math.round(Number(body.amount)) : 50

        const customer = await stripe.customers.create({ metadata })

        const product = await stripe.products.create({
            name: body.productName ?? "Subscription",
            description: body.productDescription,
            metadata,
        })

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
                        recurring: {
                            interval: "month",
                        },
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
