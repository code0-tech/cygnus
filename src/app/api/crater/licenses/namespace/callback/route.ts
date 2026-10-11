import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, noStoreRedirect as craterNoStoreRedirect } from "@/lib/crater/api.server"
import { describeCraterError, isNamespaceInUse } from "@/lib/crater/errors"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { clearCraterLoginStateCookie, verifyCraterLoginState } from "@/lib/crater/loginState.server"
import { setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { resolveLicenseNamespaceReturn } from "@/lib/licenses/routes"
import type { Mutation, MutationSubscriptionsLinkNamespaceArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type LinkSubscriptionNamespaceData = Pick<Mutation, "subscriptionsLinkNamespace">

type LinkSubscriptionNamespaceVariables = {
    input: Omit<MutationSubscriptionsLinkNamespaceArgs["input"], "namespaceId"> & { namespaceId: string }
}

const LINK_SUBSCRIPTION_NAMESPACE: TypedDocumentNode<LinkSubscriptionNamespaceData, LinkSubscriptionNamespaceVariables> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsLinkNamespace($input: SubscriptionsLinkNamespaceInput!) {
        subscriptionsLinkNamespace(input: $input) {
            subscription {
                id
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

// The callback URL carries the Sagittarius token, so it must not leak as the referrer of the redirect target.
const noStoreRedirect = (url: URL) => craterNoStoreRedirect(url, { noReferrer: true })

function errorRedirect(request: Request, returnUrl: URL, error: "selection" | "session" | "update" | "occupied") {
    const url = new URL(returnUrl)
    url.searchParams.set("namespaceError", error)
    return clearCraterLoginStateCookie(noStoreRedirect(url), request)
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const siteOrigin = resolveSiteUrl().origin
    const resolvedReturn = resolveLicenseNamespaceReturn(requestUrl.searchParams.get("returnPath"), siteOrigin)
    if (!resolvedReturn) return clearCraterLoginStateCookie(noStoreRedirect(new URL("/", siteOrigin)), request)

    const namespaceId = requestUrl.searchParams.get("namespace")?.trim()
    const sagittariusToken = requestUrl.searchParams.get("token")?.trim()
    // This GET links the namespace, so it must only run for a login this browser started.
    if (!sagittariusToken || !verifyCraterLoginState(request, requestUrl)) return errorRedirect(request, resolvedReturn.returnUrl, "session")
    if (!namespaceId || Buffer.byteLength(namespaceId, "utf8") > 500) return errorRedirect(request, resolvedReturn.returnUrl, "selection")

    try {
        const loginPayload = await createCraterUserSession(sagittariusToken)
        if (loginPayload.errors?.length || !loginPayload.userSession?.token) {
            const failure = describeCraterError(loginPayload.errors)
            console.error("Crater rejected the license namespace callback login:", failure?.errorCode ?? "Crater returned no user session token.")
            return errorRedirect(request, resolvedReturn.returnUrl, "session")
        }

        const sessionToken = loginPayload.userSession.token
        const result = await createApolloClient(sessionToken).mutate({
            mutation: LINK_SUBSCRIPTION_NAMESPACE,
            variables: { input: { id: resolvedReturn.subscriptionId, namespaceId } },
        })
        const payload = result.data?.subscriptionsLinkNamespace

        if (!payload?.subscription || (payload.errors?.length ?? 0) > 0) {
            const failure = describeCraterError(payload?.errors)
            console.error("Crater rejected the selected subscription namespace:", failure?.errorCode ?? "Crater returned no linked subscription.")
            return setCraterUserLoginCookie(setCraterSessionCookie(errorRedirect(request, resolvedReturn.returnUrl, isNamespaceInUse(payload?.errors) ? "occupied" : "update"), sessionToken))
        }

        // This callback is the second Sagittarius login in the product, so it marks the browser too.
        return setCraterUserLoginCookie(setCraterSessionCookie(clearCraterLoginStateCookie(noStoreRedirect(resolvedReturn.returnUrl), request), sessionToken))
    } catch (error) {
        console.error("Crater license namespace callback error:", error instanceof Error ? error.name : "Unknown error")
        return errorRedirect(request, resolvedReturn.returnUrl, "update")
    }
}
