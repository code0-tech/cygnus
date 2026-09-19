import { normalizeCraterDeploymentType, normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/checkout/craterCheckout"
import { normalizeCraterCustomerType } from "@/lib/checkout/craterCustomer"
import type { LicenseDashboardCustomer, LicenseDashboardData, LicenseDashboardInvoice, LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import type { Customer, Invoice, License, Subscription, User } from "@code0-tech/crater-graphql-types"

// Crater renamed Subscription.cancelAt to expireAt and dropped pendingUpdate entirely. The generated types
// still describe the old shape, so keep the compatibility declaration beside the mapping code that needs it.
type CraterSubscription = Omit<Subscription, "cancelAt" | "pendingUpdate"> & { expireAt?: string | null }

function displayName(name: string | null | undefined, email: string | null | undefined, id: string) {
    return name?.trim() || email?.trim() || id
}

function licenseName(plan: string | null | undefined, id: string) {
    if (!plan?.trim()) return id

    return plan
        .trim()
        .split(/[_-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

export function mapCustomer(customer: Customer): LicenseDashboardCustomer | null {
    if (!customer.id) return null

    const customerType = normalizeCraterCustomerType(customer.customerType)

    return {
        id: customer.id,
        ...(customer.address
            ? {
                  address: {
                      ...(customer.address.city ? { city: customer.address.city } : {}),
                      ...(customer.address.country ? { country: customer.address.country } : {}),
                      ...(customer.address.line1 ? { line1: customer.address.line1 } : {}),
                      ...(customer.address.line2 ? { line2: customer.address.line2 } : {}),
                      ...(customer.address.postalCode ? { postalCode: customer.address.postalCode } : {}),
                      ...(customer.address.state ? { state: customer.address.state } : {}),
                  },
              }
            : {}),
        ...(customerType ? { customerType } : {}),
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.name ? { name: customer.name } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        ...(customer.updatedAt ? { updatedAt: customer.updatedAt } : {}),
        licenseCount: customer.licenses?.count ?? 0,
    }
}

function mapInvoice(invoice: Invoice): LicenseDashboardInvoice | null {
    if (!invoice.id) return null

    return {
        id: invoice.id,
        ...(invoice.billingPeriodEnd ? { billingPeriodEnd: invoice.billingPeriodEnd } : {}),
        ...(invoice.billingPeriodStart ? { billingPeriodStart: invoice.billingPeriodStart } : {}),
        ...(invoice.currency ? { currency: invoice.currency } : {}),
        ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
        ...(invoice.status ? { status: invoice.status } : {}),
        ...(invoice.stripePdfUrl ? { stripePdfUrl: invoice.stripePdfUrl } : {}),
        ...(typeof invoice.total === "number" ? { total: invoice.total } : {}),
    }
}

function mapSubscriptionFields(subscription: CraterSubscription | null | undefined): Partial<LicenseDashboardLicense> {
    if (!subscription?.id) return {}

    return {
        subscriptionId: subscription.id,
        ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
        ...(subscription.paymentMethodId ? { paymentMethodId: subscription.paymentMethodId } : {}),
        ...(subscription.expireAt ? { expireAt: subscription.expireAt } : {}),
        ...(subscription.canceledAt ? { canceledAt: subscription.canceledAt } : {}),
        ...(subscription.currentPeriodEnd ? { currentPeriodEnd: subscription.currentPeriodEnd } : {}),
    }
}

export function mapLicense(license: License, customer: Customer): LicenseDashboardLicense | null {
    if (!customer.id || !license.id) return null

    const customerType = normalizeCraterCustomerType(customer.customerType)
    const deploymentType = normalizeCraterDeploymentType(license.deploymentType)
    const paymentPeriod = normalizeCraterPaymentPeriod(license.paymentPeriod)
    const plan = normalizeCraterPlan(license.plan)

    return {
        ...(typeof license.aiTokens === "number" ? { aiTokens: license.aiTokens } : {}),
        customerId: customer.id,
        customerName: displayName(customer.name, customer.email, customer.id),
        ...(customerType ? { customerType } : {}),
        id: license.id,
        ...(license.invoices?.nodes
            ? { invoices: license.invoices.nodes.flatMap((invoice) => (invoice ? [mapInvoice(invoice)].filter((mapped): mapped is LicenseDashboardInvoice => mapped !== null) : [])) }
            : {}),
        name: licenseName(plan, license.id),
        ...(deploymentType ? { deploymentType } : {}),
        ...(license.endDate ? { endDate: license.endDate } : {}),
        ...(license.namespaceId ? { namespaceId: license.namespaceId } : {}),
        ...(paymentPeriod ? { paymentPeriod } : {}),
        ...(plan ? { plan } : {}),
        ...(license.startDate ? { startDate: license.startDate } : {}),
        ...(license.status ? { status: license.status } : {}),
        ...(license.updatedAt ? { updatedAt: license.updatedAt } : {}),
        ...(typeof license.workflowExecutions === "number" ? { workflowExecutions: license.workflowExecutions } : {}),
        ...mapSubscriptionFields(license.subscription as CraterSubscription | null | undefined),
    }
}

export function mapUserData(currentUser: User): LicenseDashboardData {
    const customers: LicenseDashboardCustomer[] = []
    const licenses: LicenseDashboardLicense[] = []

    for (const customer of currentUser.customers?.nodes ?? []) {
        if (!customer) continue
        const mappedCustomer = mapCustomer(customer)
        if (mappedCustomer) customers.push(mappedCustomer)

        for (const license of customer.licenses?.nodes ?? []) {
            if (!license) continue
            const mappedLicense = mapLicense(license, customer)
            if (mappedLicense) licenses.push(mappedLicense)
        }
    }

    licenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))
    return { customers, licenses }
}

export function mapPageInfo(pageInfo: { endCursor?: string | null; hasNextPage?: boolean | null } | null | undefined, totalCount?: number | null, contextCursor?: string | null) {
    return {
        endCursor: pageInfo?.endCursor ?? null,
        hasNextPage: pageInfo?.hasNextPage === true,
        ...(typeof totalCount === "number" ? { totalCount } : {}),
        ...(contextCursor !== undefined ? { contextCursor } : {}),
    }
}

export function byMostRecentlyUpdated(left: LicenseDashboardLicense, right: LicenseDashboardLicense) {
    return Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "")
}

