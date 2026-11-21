import { readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { craterJson, withCraterSession } from "@/lib/crater/api.server"
import { loadCurrentCustomer } from "@/lib/crater/customer/customerList.server"
import { clearCraterSessionCookie } from "@/lib/crater/session.server"

export const runtime = "nodejs"

/**
 * Starts the checkout in one round trip: validates the Crater session and returns the user's customer
 * (none before `customersCreate`). `currentUser` resolving to a user is the session check, so no separate status query is needed.
 */
export const GET = withCraterSession({ log: "Crater checkout bootstrap error", error: "Could not start the checkout." }, async (request, token) => {
    const current = await loadCurrentCustomer(token)
    if (!current) {
        return clearCraterSessionCookie(craterJson({ error: "The Crater session is invalid or expired." }, 401), request)
    }

    const guestEmail = readGuestCheckoutSession(request)?.email
    return craterJson({ authenticated: true, ...(guestEmail ? { guestEmail } : {}), customers: current.customer ? [current.customer] : [] })
})
