import { normalizeCraterDeploymentType, normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/checkout/craterCheckout"
import { normalizeCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { normalizeUsagePackages } from "@/lib/subscription/usagePackages"
import type {
    DashboardSubscriptionStatus,
    LicenseDashboardCustomer,
    LicenseDashboardData,
    LicenseDashboardInvoice,
    LicenseDashboardLicense,
    SubscriptionPendingUpdate,
} from "@/lib/licenses/licenseTypes"
import type { Customer, Invoice, Subscription, SubscriptionPendingUpdate as CraterPendingUpdate, User } from "@code0-tech/crater-graphql-types"

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
        ...(customer.checkoutLimits
            ? {
                  checkoutLimits: {
                      aiTokens: normalizeUsagePackages(customer.checkoutLimits.aiTokens),
                      workflowExecutions: normalizeUsagePackages(customer.checkoutLimits.workflowExecutions),
                  },
              }
            : {}),
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.name ? { name: customer.name } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        ...(customer.updatedAt ? { updatedAt: customer.updatedAt } : {}),
        licenseCount: customer.subscriptions?.count ?? 0,
    }
}

export function mapSubscriptionPendingUpdate(update: CraterPendingUpdate | null | undefined): SubscriptionPendingUpdate | null {
    if (!update) return null
    const plan = normalizeCraterPlan(update.plan)
    const paymentPeriod = normalizeCraterPaymentPeriod(update.paymentPeriod)
    return {
        ...(plan ? { plan } : {}),
        ...(paymentPeriod ? { paymentPeriod } : {}),
        ...(typeof update.aiTokens === "number" ? { aiTokens: update.aiTokens } : {}),
        ...(typeof update.workflowExecutions === "number" ? { workflowExecutions: update.workflowExecutions } : {}),
        ...(update.effectiveAt ? { effectiveAt: update.effectiveAt } : {}),
    }
}

function mapInvoice(invoice: Invoice): LicenseDashboardInvoice | null {
    if (!invoice.id) return null

    return {
        id: invoice.id,
        ...(invoice.createdAt ? { createdAt: invoice.createdAt } : {}),
        ...(invoice.currency ? { currency: invoice.currency } : {}),
        ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
        ...(invoice.status ? { status: invoice.status } : {}),
        ...(invoice.stripePdfUrl ? { stripePdfUrl: invoice.stripePdfUrl } : {}),
        ...(typeof invoice.net === "number" ? { net: invoice.net } : {}),
        ...(typeof invoice.tax === "number" ? { tax: invoice.tax } : {}),
        ...(invoice.lineItems
            ? {
                  lineItems: invoice.lineItems.map((item) => ({
                      ...(typeof item.amount === "number" ? { amount: item.amount } : {}),
                      ...(item.description ? { description: item.description } : {}),
                      ...(typeof item.quantity === "number" ? { quantity: item.quantity } : {}),
                  })),
              }
            : {}),
        ...(typeof invoice.total === "number" ? { total: invoice.total } : {}),
    }
}

// Keep Crater subscription statuses distinct. Without a paid-invoice snapshot access is still pending.
export function deriveLicenseStatus(subscriptionStatus: string | null | undefined, hasLicense: boolean): LicenseDashboardLicense["status"] {
    if (!hasLicense) return "pending"
    return (subscriptionStatus?.trim().toUpperCase() || undefined) as DashboardSubscriptionStatus | undefined
}

// One dashboard entry per subscription. Its id is the subscription id, which stays stable across renewals; the
// current license snapshot (whose id changes with every paid invoice) only supplies its dates, invoices, and export id.
export function mapSubscription(subscription: Subscription, customer: Customer): LicenseDashboardLicense | null {
    if (!customer.id || !subscription.id) return null

    const customerType = normalizeCraterCustomerType(customer.customerType)
    const deploymentType = normalizeCraterDeploymentType(subscription.deploymentType)
    const paymentPeriod = normalizeCraterPaymentPeriod(subscription.paymentPeriod)
    const plan = normalizeCraterPlan(subscription.plan)
    const license = subscription.currentLicense
    const status = deriveLicenseStatus(subscription.status, Boolean(license?.id))

    return {
        ...(typeof subscription.aiTokens === "number" ? { aiTokens: subscription.aiTokens } : {}),
        customerId: customer.id,
        customerName: displayName(customer.name, customer.email, customer.id),
        ...(customerType ? { customerType } : {}),
        id: subscription.id,
        ...(license?.id ? { licenseId: license.id } : {}),
        ...(license?.invoices?.nodes
            ? { invoices: license.invoices.nodes.flatMap((invoice) => (invoice ? [mapInvoice(invoice)].filter((mapped): mapped is LicenseDashboardInvoice => mapped !== null) : [])) }
            : {}),
        name: licenseName(plan, subscription.id),
        ...(deploymentType ? { deploymentType } : {}),
        ...(license?.endDate ? { endDate: license.endDate } : {}),
        ...(subscription.namespaceId ? { namespaceId: subscription.namespaceId } : {}),
        ...(paymentPeriod ? { paymentPeriod } : {}),
        pendingUpdate: mapSubscriptionPendingUpdate(subscription.pendingUpdate),
        ...(plan ? { plan } : {}),
        ...(license?.startDate ? { startDate: license.startDate } : {}),
        ...(status ? { status } : {}),
        ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
        ...(typeof subscription.workflowExecutions === "number" ? { workflowExecutions: subscription.workflowExecutions } : {}),
        subscriptionId: subscription.id,
        ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
        ...(subscription.createdAt ? { subscriptionCreatedAt: subscription.createdAt } : {}),
        ...(subscription.paymentMethodId ? { paymentMethodId: subscription.paymentMethodId } : {}),
        ...(subscription.cancelAt ? { cancelAt: subscription.cancelAt } : {}),
        ...(subscription.canceledAt ? { canceledAt: subscription.canceledAt } : {}),
        ...(subscription.currentPeriodEnd ? { currentPeriodEnd: subscription.currentPeriodEnd } : {}),
        ...(subscription.currentPeriodStart ? { currentPeriodStart: subscription.currentPeriodStart } : {}),
    }
}

export function mapUserData(currentUser: User): LicenseDashboardData {
    const customers: LicenseDashboardCustomer[] = []
    const licenses: LicenseDashboardLicense[] = []

    for (const customer of currentUser.customers?.nodes ?? []) {
        if (!customer) continue
        const mappedCustomer = mapCustomer(customer)
        if (mappedCustomer) customers.push(mappedCustomer)

        for (const subscription of customer.subscriptions?.nodes ?? []) {
            if (!subscription) continue
            const mappedLicense = mapSubscription(subscription, customer)
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
