import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS } from "@/lib/crater/api.server"
import { describeCraterError, isNamespaceInUse } from "@/lib/crater/errors"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import { isSupportedLocale } from "@/lib/i18n"
import { isSubscriptionId } from "@/lib/crater/request"
import { resolveCustomerRouteId, resolveLicenseRouteId } from "@/lib/licenses/licenseRoute"
import type { Mutation, MutationSubscriptionsLinkNamespaceArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { NextResponse } from "next/server"

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

function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url)
    response.headers.set("cache-control", "no-store")
    response.headers.set("referrer-policy", "no-referrer")
    return response
}

function resolveLicenseReturn(requestUrl: URL) {
    const returnPath = requestUrl.searchParams.get("returnPath")
    if (!returnPath?.startsWith("/")) return null

    const returnUrl = new URL(returnPath, requestUrl.origin)
    const segments = returnUrl.pathname.split("/").filter(Boolean)
    if (
        returnUrl.origin !== requestUrl.origin ||
        returnUrl.search ||
        returnUrl.hash ||
        (segments.length !== 6 && segments.length !== 7) ||
        !isSupportedLocale(segments[0]) ||
        segments[1] !== "licenses" ||
        segments[2] !== "customer" ||
        segments[4] !== "license" ||
        (segments.length === 7 && segments[6] !== "edit")
    ) {
        return null
    }

    const customerId = resolveCustomerRouteId(segments[3])
    const subscriptionId = resolveLicenseRouteId(segments[5])
    if (!customerId || !/^gid:\/\/crater\/Customer\/\d+$/.test(customerId) || !subscriptionId || !isSubscriptionId(subscriptionId)) return null

    return { subscriptionId, returnUrl }
}

function errorRedirect(returnUrl: URL, error: "selection" | "session" | "update" | "occupied") {
    const url = new URL(returnUrl)
    url.searchParams.set("namespaceError", error)
    return noStoreRedirect(url)
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const resolvedReturn = resolveLicenseReturn(requestUrl)
    if (!resolvedReturn) return noStoreRedirect(new URL("/", requestUrl.origin))

    const namespaceId = requestUrl.searchParams.get("namespace")?.trim()
    const sagittariusToken = requestUrl.searchParams.get("token")?.trim()
    if (!namespaceId || Buffer.byteLength(namespaceId, "utf8") > 500) return errorRedirect(resolvedReturn.returnUrl, "selection")
    if (!sagittariusToken) return errorRedirect(resolvedReturn.returnUrl, "session")

    try {
        const loginPayload = await createCraterUserSession(sagittariusToken)
        if (loginPayload.errors?.length || !loginPayload.userSession?.token) {
            const failure = describeCraterError(loginPayload.errors)
            console.error("Crater rejected the license namespace callback login:", failure?.errorCode ?? "Crater returned no user session token.")
            return errorRedirect(resolvedReturn.returnUrl, "session")
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
            return setCraterUserLoginCookie(setCraterSessionCookie(errorRedirect(resolvedReturn.returnUrl, isNamespaceInUse(payload?.errors) ? "occupied" : "update"), sessionToken))
        }

        // This callback is the second Sagittarius login in the product, so it marks the browser too.
        return setCraterUserLoginCookie(setCraterSessionCookie(noStoreRedirect(resolvedReturn.returnUrl), sessionToken))
    } catch (error) {
        console.error("Crater license namespace callback error:", error instanceof Error ? error.name : "Unknown error")
        return errorRedirect(resolvedReturn.returnUrl, "update")
    }
}
