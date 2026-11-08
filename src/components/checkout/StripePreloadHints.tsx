"use client"

import { STRIPE_JS_URL } from "@/lib/checkout/stripeScript"
import { preconnect, preload } from "react-dom"

/**
 * Opens the Stripe connections and starts downloading Stripe.js from the HTML head, before hydration and the Crater
 * requests that precede the first Stripe element; the script @stripe/stripe-js injects later reuses this download.
 * Rendered from a client component on purpose: React writes these hints into the server-rendered <head>, whereas the
 * same calls in a server component only reach the browser through the RSC payload once the runtime has loaded.
 */
export function StripePreloadHints({ nonce }: { nonce?: string }) {
    preconnect("https://js.stripe.com")
    preconnect("https://api.stripe.com", { crossOrigin: "anonymous" })
    preconnect("https://m.stripe.network")
    // The CSP uses 'strict-dynamic', so the preloaded script needs the request nonce to be fetched at all.
    preload(STRIPE_JS_URL, { as: "script", nonce })
    return null
}
