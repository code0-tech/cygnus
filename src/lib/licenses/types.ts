import type { SubscriptionStatus } from "@code0-tech/crater-graphql-types"

export type DashboardSubscriptionStatus = `${SubscriptionStatus}`

export interface LicenseDashboardCustomerAddress {
    city?: string
    country?: string
    line1?: string
    line2?: string
    postalCode?: string
    state?: string
}

export interface LicenseDashboardCustomer {
    address?: LicenseDashboardCustomerAddress
    customerType?: string
    email?: string
    id: string
    checkoutLimits?: { aiTokens: number[]; workflowExecutions: number[] }
    subscriptionCount: number
    name?: string
    phone?: string
    updatedAt?: string
}

export interface LicenseDashboardInvoice {
    createdAt?: string
    currency?: string
    id: string
    invoiceNumber?: string
    status?: string
    stripePdfUrl?: string
    net?: number
    tax?: number
    lineItems?: { amount?: number; description?: string; quantity?: number }[]
    total?: number
}

export interface SubscriptionPendingUpdate {
    plan?: string
    paymentPeriod?: string
    aiTokens?: number
    workflowExecutions?: number
    effectiveAt?: string
}

/**
 * One metric of the current usage period. Amounts stay decimal strings (Crater's BigInt), since they survive JSON
 * unchanged and are only turned into a `bigint` where they are formatted.
 */
export interface LicenseUsageMetric {
    /** `null` means unlimited. */
    allowance: string | null
    exceeded: boolean
    /** `null` while the allowance is unlimited. */
    remaining: string | null
    used: string
}

export interface LicenseUsage {
    /** Only `available` carries numbers; `unavailable` must never be shown as zero. */
    availability: "available" | "unavailable" | "unsupported"
    aiTokens: LicenseUsageMetric | null
    lastUpdatedAt: string | null
    periodEnd: string | null
    periodStart: string | null
    resetsAt: string | null
    workflowExecutions: LicenseUsageMetric | null
}

export interface LicenseDashboardLicense {
    aiTokens?: number
    canceledAt?: string
    cancelAt?: string
    currentPeriodEnd?: string
    currentPeriodStart?: string
    customerId: string
    customerName: string
    customerType?: string
    deploymentType?: string
    endDate?: string
    id: string
    invoices?: LicenseDashboardInvoice[]
    licenseId?: string
    name: string
    namespaceId?: string | null
    namespaceName?: string | null
    immediateCancellationAvailable?: boolean
    immediateCancellationUntil?: string
    paymentMethodId?: string
    paymentPeriod?: string
    pendingUpdate?: SubscriptionPendingUpdate | null
    plan?: string
    startDate?: string
    status?: DashboardSubscriptionStatus | "pending"
    subscriptionId?: string
    subscriptionCreatedAt?: string
    subscriptionStatus?: DashboardSubscriptionStatus
    updatedAt?: string
    usage?: LicenseUsage
    workflowExecutions?: number
}

interface LicenseDashboardPageInfo {
    contextCursor?: string | null
    endCursor: string | null
    hasNextPage: boolean
    totalCount?: number
}

export interface LicenseDashboardData {
    customers: LicenseDashboardCustomer[]
    licenses: LicenseDashboardLicense[]
    navigationLicenses?: LicenseDashboardLicense[]
    pagination?: {
        customers?: LicenseDashboardPageInfo
        invoices?: LicenseDashboardPageInfo
        licenses?: LicenseDashboardPageInfo
    }
}

export const EMPTY_LICENSE_DASHBOARD_DATA: LicenseDashboardData = {
    customers: [],
    licenses: [],
}

export interface PaymentMethodDisplayDetails {
    brand: string | null
    expiresMonth: number | null
    expiresYear: number | null
    last4: string | null
    type: string | null
}

export interface CustomerPaymentMethodSummary extends PaymentMethodDisplayDetails {
    id: string
}
