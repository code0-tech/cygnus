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
    licenseCount: number
    name?: string
    phone?: string
    updatedAt?: string
}

export interface LicenseDashboardInvoice {
    billingPeriodEnd?: string
    billingPeriodStart?: string
    currency?: string
    id: string
    invoiceNumber?: string
    status?: string
    stripePdfUrl?: string
    total?: number
}

export interface LicenseDashboardPendingUpdate {
    plan?: string
    paymentPeriod?: string
    aiTokens?: number
    workflowExecutions?: number
    effectiveAt?: string
}

export interface LicenseDashboardLicense {
    aiTokens?: number
    cancelAt?: string
    canceledAt?: string
    currentPeriodEnd?: string
    customerId: string
    customerName: string
    customerType?: string
    deploymentType?: string
    id: string
    invoices?: LicenseDashboardInvoice[]
    name: string
    namespaceId?: string
    paymentPeriod?: string
    pendingUpdate?: LicenseDashboardPendingUpdate
    plan?: string
    startDate?: string
    status?: string
    subscriptionId?: string
    subscriptionStatus?: string
    updatedAt?: string
    workflowExecutions?: number
}

export interface LicenseHistorySnapshot {
    aiTokens?: number
    createdAt?: string
    deploymentType?: string
    endDate?: string
    id: string
    namespaceId?: string
    paymentPeriod?: string
    plan?: string
    startDate?: string
    status?: string
    updatedAt?: string
    workflowExecutions?: number
}

export interface LicenseHistoryData {
    snapshots: LicenseHistorySnapshot[]
    pagination: {
        endCursor: string | null
        hasNextPage: boolean
        totalCount?: number
    }
}

interface LicenseDashboardPageInfo {
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
