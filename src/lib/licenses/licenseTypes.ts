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
    licenseCount: number
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
    total?: number
}

// One entry per Crater subscription: id is the subscription id, licenseId the export id of its current license snapshot.
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
    namespaceId?: string
    paymentMethodId?: string
    paymentPeriod?: string
    plan?: string
    startDate?: string
    status?: string
    subscriptionId?: string
    subscriptionCreatedAt?: string
    subscriptionStatus?: string
    updatedAt?: string
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
