import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, describeCraterError } from "@/lib/checkout/craterApi"
import { createCraterUserSession } from "@/lib/checkout/craterLogin"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import { isSupportedLocale } from "@/lib/i18n"
import { isLicenseId } from "@/lib/licenses/craterLicenseRequest"
import type { Mutation, MutationLicensesLinkNamespaceArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type LinkLicenseNamespaceData = Pick<Mutation, "licensesLinkNamespace">

const LINK_LICENSE_NAMESPACE: TypedDocumentNode<LinkLicenseNamespaceData, MutationLicensesLinkNamespaceArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation LicensesLinkNamespace($input: LicensesLinkNamespaceInput!) {
        licensesLinkNamespace(input: $input) {
            license {
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

function decodeRouteSegment(segment: string) {
    try {
        return decodeURIComponent(segment)
    } catch {
        return null
    }
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
        segments.length !== 7 ||
        !isSupportedLocale(segments[0]) ||
        segments[1] !== "licenses" ||
        segments[2] !== "customer" ||
        segments[4] !== "license" ||
        segments[6] !== "edit"
    ) {
        return null
    }

    const customerId = decodeRouteSegment(segments[3])
    const licenseId = decodeRouteSegment(segments[5])
    if (!customerId || !/^gid:\/\/crater\/Customer\/\d+$/.test(customerId) || !licenseId || !isLicenseId(licenseId)) return null

    return { licenseId, returnUrl }
}

function errorRedirect(returnUrl: URL, error: "selection" | "session" | "update") {
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
    if (!namespaceId) return errorRedirect(resolvedReturn.returnUrl, "selection")
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
            mutation: LINK_LICENSE_NAMESPACE,
            variables: { input: { id: resolvedReturn.licenseId, namespaceId } },
        })
        const payload = result.data?.licensesLinkNamespace

        if (!payload?.license || (payload.errors?.length ?? 0) > 0) {
            const failure = describeCraterError(payload?.errors)
            console.error("Crater rejected the selected license namespace:", failure?.errorCode ?? "Crater returned no linked license.")
            return setCraterSessionCookie(errorRedirect(resolvedReturn.returnUrl, "update"), sessionToken)
        }

        return setCraterSessionCookie(noStoreRedirect(resolvedReturn.returnUrl), sessionToken)
    } catch (error) {
        console.error("Crater license namespace callback error:", error instanceof Error ? error.name : "Unknown error")
        return errorRedirect(resolvedReturn.returnUrl, "update")
    }
}
