import { createApolloClient } from "@/lib/apolloClient"
import { isLicenseId } from "@/lib/licenses/craterRequest"
import { byMostRecentlyUpdated, mapCustomer, mapLicense, mapPageInfo, mapUserData } from "@/lib/licenses/licenseDashboardMapper"
import {
    CUSTOMER_LICENSE_PAGE,
    CUSTOMER_NAVIGATION_PAGE,
    LICENSE_CUSTOMER_DETAIL,
    LICENSE_DASHBOARD,
    LICENSE_NAVIGATION_PAGE,
} from "@/lib/licenses/licenseDashboardQueries.server"
import type { LicenseDashboardData, LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import type { Customer, Scalars } from "@code0-tech/crater-graphql-types"

export type LicenseDashboardLoadResult = { data: LicenseDashboardData; status: 200 } | { error: string; status: 400 | 401 | 404 | 502 }

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

function readCursor(requestUrl: URL, name: string) {
    const value = requestUrl.searchParams.get(name)?.trim()
    if (!value) return null
    return value.length <= 2_048 ? value : undefined
}

function appendNavigationLicenses(target: LicenseDashboardLicense[], customer: Customer) {
    for (const license of customer.licenses?.edges ?? []) {
        if (!license?.node) continue
        const mappedLicense = mapLicense(license.node, customer)
        if (mappedLicense && !target.some((candidate) => candidate.id === mappedLicense.id)) target.push(mappedLicense)
    }
}

// Walks one customer's license connection to the end, so a customer holding more licenses than fit in a
// single page still contributes all of them to the sidebar.
async function appendRemainingLicenses(
    client: ReturnType<typeof createApolloClient>,
    target: LicenseDashboardLicense[],
    customer: Customer,
    customerAfter: string | null
) {
    const seenCursors = new Set<string>()
    let pageInfo = mapPageInfo(customer.licenses?.pageInfo)

    while (pageInfo.hasNextPage) {
        if (!pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid license pagination cursor.")
        seenCursors.add(pageInfo.endCursor)

        const result = await client.query({
            query: CUSTOMER_LICENSE_PAGE,
            variables: { ...(customerAfter ? { customerAfter } : {}), licenseAfter: pageInfo.endCursor },
            fetchPolicy: "no-cache",
        })
        const nextPage = result.data?.currentUser?.customers?.nodes?.[0]
        if (!nextPage || nextPage.id !== customer.id) throw new Error("Crater returned an invalid customer while paginating licenses.")

        appendNavigationLicenses(target, nextPage)
        pageInfo = mapPageInfo(nextPage.licenses?.pageInfo)
    }
}

// The sidebar shows the same list of licenses no matter which page is open, so it is always built from every
// license of every customer -- never from whatever subset the current view happened to fetch. Walking the
// customer connection to the end also yields the cursor that selects each customer, which the customer and
// license views need to address their own customer without a second walk.
async function collectNavigationLicenses(client: ReturnType<typeof createApolloClient>) {
    const seenCursors = new Set<string>()
    const navigationLicenses: LicenseDashboardLicense[] = []
    const customerCursors = new Map<string, string | null>()
    let customerAfter: string | null = null

    while (true) {
        const result = await client.query({
            query: CUSTOMER_NAVIGATION_PAGE,
            variables: { ...(customerAfter ? { customerAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser
        if (!currentUser) return { status: "unauthenticated" as const }

        const connection = currentUser.customers
        const edges = connection?.edges ?? []
        for (let index = 0; index < edges.length; index += 1) {
            const customer = edges[index]?.node
            if (!customer?.id) continue

            // The cursor of the preceding edge is what makes this customer the first node of a `first: 1` page.
            const cursorBeforeCustomer = index > 0 ? (edges[index - 1]?.cursor ?? null) : customerAfter
            customerCursors.set(customer.id, cursorBeforeCustomer)
            appendNavigationLicenses(navigationLicenses, customer)
            await appendRemainingLicenses(client, navigationLicenses, customer, cursorBeforeCustomer)
        }

        const pageInfo = mapPageInfo(connection?.pageInfo)
        if (!pageInfo.hasNextPage) break
        if (!pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid customer pagination cursor.")
        seenCursors.add(pageInfo.endCursor)
        customerAfter = pageInfo.endCursor
    }

    navigationLicenses.sort(byMostRecentlyUpdated)
    return { status: "collected" as const, customerCursors, navigationLicenses }
}

async function findLicenseCursor(client: ReturnType<typeof createApolloClient>, customerAfter: string | null, customerId: string, licenseId: string, invoiceAfter: string | null) {
    const seenCursors = new Set<string>()
    let licenseAfter: string | null = null

    while (true) {
        const result = await client.query({
            query: LICENSE_NAVIGATION_PAGE,
            variables: { ...(customerAfter ? { customerAfter } : {}), ...(licenseAfter ? { licenseAfter } : {}), ...(invoiceAfter ? { invoiceAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const customer = result.data?.currentUser?.customers?.nodes?.[0]
        if (!customer) return { status: "missing" as const }
        if (customer.id !== customerId) return { status: "missing" as const }

        const edges = customer.licenses?.edges ?? []
        const matchedLicense = edges.find((edge) => edge?.node?.id === licenseId)?.node
        if (matchedLicense) {
            return { status: "found" as const, customer, license: matchedLicense }
        }

        const pageInfo = mapPageInfo(customer.licenses?.pageInfo)
        if (!pageInfo.hasNextPage) return { status: "missing" as const }
        if (!pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid license pagination cursor.")
        seenCursors.add(pageInfo.endCursor)
        licenseAfter = pageInfo.endCursor
    }
}

export async function loadLicenseDashboardData(requestUrl: URL, sessionToken: string): Promise<LicenseDashboardLoadResult> {
    const view = requestUrl.searchParams.get("view") ?? "dashboard"
    const customerId = requestUrl.searchParams.get("customerId") ?? ""
    const licenseId = requestUrl.searchParams.get("licenseId") ?? ""
    const customerAfter = readCursor(requestUrl, "customerAfter")
    const customerContext = readCursor(requestUrl, "customerContext")
    const licenseAfter = readCursor(requestUrl, "licenseAfter")
    const invoiceAfter = readCursor(requestUrl, "invoiceAfter")
    const includeNavigation = requestUrl.searchParams.get("includeNavigation") !== "false"

    if (!(["dashboard", "customer", "license"] as const).includes(view as "dashboard" | "customer" | "license")) {
        return { error: "view must be dashboard, customer, or license.", status: 400 }
    }
    if (view !== "dashboard" && !isCustomerId(customerId)) return { error: "A valid Crater customer id is required.", status: 400 }
    if (view === "license" && !isLicenseId(licenseId)) return { error: "A valid Crater license id is required.", status: 400 }
    if (customerAfter === undefined || customerContext === undefined || licenseAfter === undefined || invoiceAfter === undefined) {
        return { error: "The pagination cursor is invalid.", status: 400 }
    }

    const client = createApolloClient(sessionToken)
    let navigationLicenses: LicenseDashboardLicense[] | undefined
    let selectedCustomerAfter = customerContext ?? null

    if (includeNavigation) {
        const navigationLookup = await collectNavigationLicenses(client)
        if (navigationLookup.status === "unauthenticated") return { error: "The Crater session has no authenticated user.", status: 401 }
        navigationLicenses = navigationLookup.navigationLicenses
        if (view !== "dashboard") {
            if (!navigationLookup.customerCursors.has(customerId)) return { error: "The requested customer was not found.", status: 404 }
            selectedCustomerAfter = navigationLookup.customerCursors.get(customerId) ?? null
        }
    }

    if (view === "dashboard") {
        const result = await client.query({
            query: LICENSE_DASHBOARD,
            variables: { ...(customerAfter ? { customerAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser
        if (!currentUser) return { error: "The Crater session has no authenticated user.", status: 401 }

        return {
            data: {
                ...mapUserData(currentUser),
                ...(navigationLicenses ? { navigationLicenses } : {}),
                pagination: { customers: mapPageInfo(currentUser.customers?.pageInfo, currentUser.customers?.count) },
            },
            status: 200,
        }
    }

    if (view === "license") {
        const licenseLookup = await findLicenseCursor(client, selectedCustomerAfter, customerId, licenseId, invoiceAfter)
        if (licenseLookup.status === "missing") return { error: "The requested license was not found.", status: 404 }

        const mappedCustomer = mapCustomer(licenseLookup.customer)
        const mappedLicense = mapLicense(licenseLookup.license, licenseLookup.customer)
        if (!mappedCustomer || !mappedLicense) return { error: "Crater returned incomplete license data.", status: 502 }
        if (navigationLicenses && !navigationLicenses.some((candidate) => candidate.id === mappedLicense.id)) {
            navigationLicenses.push(mappedLicense)
            navigationLicenses.sort(byMostRecentlyUpdated)
        }

        return {
            data: {
                customers: [mappedCustomer],
                licenses: [mappedLicense],
                ...(navigationLicenses ? { navigationLicenses } : {}),
                pagination: { invoices: mapPageInfo(licenseLookup.license.invoices?.pageInfo, licenseLookup.license.invoices?.count, selectedCustomerAfter) },
            },
            status: 200,
        }
    }

    const detailResult = await client.query({
        query: LICENSE_CUSTOMER_DETAIL,
        variables: {
            ...(selectedCustomerAfter ? { customerAfter: selectedCustomerAfter } : {}),
            ...(licenseAfter ? { licenseAfter } : {}),
        },
        fetchPolicy: "no-cache",
    })
    const detailUser = detailResult.data?.currentUser
    if (!detailUser) return { error: "The Crater session has no authenticated user.", status: 401 }

    const detailData = mapUserData(detailUser)
    if (detailData.customers[0]?.id !== customerId) return { error: "The requested customer was not found.", status: 404 }

    const detailCustomer = detailUser.customers?.nodes?.[0]
    return {
        data: {
            ...detailData,
            ...(navigationLicenses ? { navigationLicenses } : {}),
            pagination: { licenses: mapPageInfo(detailCustomer?.licenses?.pageInfo, detailCustomer?.licenses?.count, selectedCustomerAfter) },
        },
        status: 200,
    }
}

