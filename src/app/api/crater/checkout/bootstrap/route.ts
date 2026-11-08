import { readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { craterJson, withCraterSession } from "@/lib/crater/api.server"
import { loadCustomerPage } from "@/lib/crater/customer/customerList.server"
import { clearCraterSessionCookie } from "@/lib/crater/session.server"

export const runtime = "nodejs"

/**
 * Starts the checkout in one round trip: validates the Crater session and returns the first page of the user's
 * customers. `currentUser` resolving to a user is the session check, so no separate status query is needed.
 */
export const GET = withCraterSession({ log: "Crater checkout bootstrap error", error: "Could not start the checkout." }, async (request, token) => {
    const page = await loadCustomerPage(token)
    if (!page) {
        return clearCraterSessionCookie(craterJson({ error: "The Crater session is invalid or expired." }, 401), request)
    }

    const guestEmail = readGuestCheckoutSession(request)?.email
    return craterJson({ authenticated: true, ...(guestEmail ? { guestEmail } : {}), ...page })
})
