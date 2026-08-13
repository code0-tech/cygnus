export interface LicenseDashboardCustomer {
    customerType?: string
    email?: string
    id: string
    licenseCount: number
    name?: string
    updatedAt?: string
}

export interface LicenseDashboardLicense {
    aiTokens?: number
    customerId: string
    customerName: string
    customerType?: string
    deploymentType?: string
    id: string
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
}

export const EMPTY_LICENSE_DASHBOARD_DATA: LicenseDashboardData = {
    customers: [],
    licenses: [],
}
