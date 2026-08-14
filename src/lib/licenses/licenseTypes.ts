export interface LicenseDashboardCustomer {
    customerType?: string
    email?: string
    id: string
    licenseCount: number
    name?: string
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

export interface LicenseDashboardLicense {
    aiTokens?: number
    customerId: string
    customerName: string
    customerType?: string
    deploymentType?: string
    id: string
    invoices?: LicenseDashboardInvoice[]
    name: string
    namespaceId?: string
    paymentPeriod?: string
    plan?: string
    status?: string
    updatedAt?: string
    workflowExecutions?: number
}

export interface LicenseDashboardData {
    customers: LicenseDashboardCustomer[]
    licenses: LicenseDashboardLicense[]
    navigationLicenses?: LicenseDashboardLicense[]
}

export const EMPTY_LICENSE_DASHBOARD_DATA: LicenseDashboardData = {
    customers: [],
    licenses: [],
}
