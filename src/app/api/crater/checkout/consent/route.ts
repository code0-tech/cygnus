import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject } from "@/lib/crater/request"
import { parseCheckoutSessionId } from "@/lib/crater/values"
import type { Mutation, MutationCheckoutRecordConsentArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutRecordConsentData = Pick<Mutation, "checkoutRecordConsent">

const MAX_TERMS_VERSION_LENGTH = 100

const CHECKOUT_RECORD_CONSENT: TypedDocumentNode<CheckoutRecordConsentData, MutationCheckoutRecordConsentArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CheckoutRecordConsent($input: CheckoutRecordConsentInput!) {
        checkoutRecordConsent(input: $input) {
            consent {
                stripeCheckoutSessionId
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

/**
 * Called when the user presses pay, before the browser confirms the Stripe Checkout Session. A thin proxy to Crater's
 * `checkoutRecordConsent`: Crater decides which consents the session's customer needs and stores them for exactly that
 * session, so nothing is validated here beyond the request shape. The browser only confirms after a 200.
 */
export const POST = withCraterSession({ log: "Crater checkout consent error", error: "Could not record the checkout consents.", rateLimit: "checkout" }, async (request, token) => {
    const body = await readJsonObject(request)
    const sessionId = parseCheckoutSessionId(optionalString(body?.sessionId))
    if (!body || !sessionId) return craterJson({ error: "sessionId is required and must be a Stripe Checkout Session ID." }, 400)

    const consents = body.consents && typeof body.consents === "object" && !Array.isArray(body.consents) ? (body.consents as Record<string, unknown>) : null
    if (!consents || typeof consents.terms !== "boolean" || (consents.withdrawal !== undefined && typeof consents.withdrawal !== "boolean")) {
        return craterJson({ error: "consents.terms must be a boolean, consents.withdrawal a boolean when given." }, 400)
    }

    const termsVersion = optionalString(body.termsVersion)
    if (termsVersion && termsVersion.length > MAX_TERMS_VERSION_LENGTH) return craterJson({ error: `termsVersion must be at most ${MAX_TERMS_VERSION_LENGTH} characters.` }, 400)

    const input: MutationCheckoutRecordConsentArgs["input"] = {
        sessionId,
        terms: consents.terms,
        ...(typeof consents.withdrawal === "boolean" ? { withdrawal: consents.withdrawal } : {}),
        ...(termsVersion ? { termsVersion } : {}),
    }
    return runCraterResourceMutation(token, CHECKOUT_RECORD_CONSENT, { input }, (data) => data.checkoutRecordConsent, {
        rejectionMessage: "Crater did not record the checkout consents.",
        // Only a stored record bound to this very session lets the browser confirm.
        selectResource: (payload) => (payload.consent?.stripeCheckoutSessionId === sessionId ? payload.consent : null),
        missingResourceMessage: "Crater returned no consent for the checkout session.",
        respond: () => craterJson({ recorded: true }),
    })
})
