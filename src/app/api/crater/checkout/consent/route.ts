import { craterJson, withCraterSession } from "@/lib/crater/api.server"
import { consentRejection } from "@/lib/crater/consents.server"
import { findCustomerType } from "@/lib/crater/customer/customerList.server"
import { isCustomerId, optionalString, readJsonObject } from "@/lib/crater/request"

export const runtime = "nodejs"

/**
 * Called when the user presses pay, before the browser confirms the Stripe Checkout Session. The customer type comes
 * from Crater, so the client cannot skip the withdrawal consent by claiming to be a business.
 */
export const POST = withCraterSession({ log: "Crater checkout consent error", error: "Could not verify the checkout consents.", rateLimit: "checkout" }, async (request, token) => {
    const body = await readJsonObject(request)
    const customerId = optionalString(body?.customerId)
    if (!body || !customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "customerId is required and must be a valid Crater global ID." }, 400)
    }

    const customer = await findCustomerType(token, customerId)
    if (customer.status === "unauthenticated") return craterJson({ error: "The Crater session has no authenticated user." }, 401)
    if (customer.status === "missing") return craterJson({ error: "The checkout customer was not found." }, 404)

    return consentRejection(body, customer.customerType) ?? craterJson({ accepted: true })
})
