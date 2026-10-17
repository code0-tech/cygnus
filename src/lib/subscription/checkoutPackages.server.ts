import { createApolloClient } from "@/lib/apolloClient"
import { normalizeUsagePackages, type CheckoutPackages } from "@/lib/subscription/usagePackages"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { unstable_cache } from "next/cache"
import "server-only"

interface CheckoutPackagesResponse {
    checkoutPackages?: {
        quantitySteps?: Array<{
            customerType: string
            aiTokens?: number[] | null
            workflowExecutions?: number[] | null
        }> | null
        planQuantities?: Array<{
            plan: string
            aiTokens?: number | null
            workflowExecutions?: number | null
        }> | null
    } | null
}

const CHECKOUT_PACKAGES: TypedDocumentNode<CheckoutPackagesResponse> = gql`
    query CheckoutPackages {
        checkoutPackages {
            quantitySteps {
                customerType
                aiTokens
                workflowExecutions
            }
            planQuantities {
                plan
                aiTokens
                workflowExecutions
            }
        }
    }
`

async function fetchCraterCheckoutPackages(): Promise<CheckoutPackages> {
    const { data } = await createApolloClient().query({ query: CHECKOUT_PACKAGES, fetchPolicy: "no-cache" })
    const response = data?.checkoutPackages
    const businessSteps = response?.quantitySteps?.find((step) => step.customerType === "BUSINESS")
    const personalSteps = response?.quantitySteps?.find((step) => step.customerType === "PERSONAL")
    const pro = response?.planQuantities?.find((quantity) => quantity.plan === "PRO")
    const max = response?.planQuantities?.find((quantity) => quantity.plan === "MAX")

    if (!businessSteps || !personalSteps || !pro || !max) throw new Error("Crater returned an incomplete checkout package catalogue.")

    const requirePositiveInteger = (value: number | null | undefined, label: string) => {
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new Error(`Crater returned an invalid ${label} quantity.`)
        return value
    }
    const requirePackages = (values: number[] | null | undefined, label: string) => {
        const packages = normalizeUsagePackages(values)
        if (!values?.length || packages.length !== values.length) throw new Error(`Crater returned invalid ${label} quantity steps.`)
        return packages
    }

    return {
        quantitySteps: {
            b2b: { aiTokens: requirePackages(businessSteps.aiTokens, "business AI token"), workflowExecutions: requirePackages(businessSteps.workflowExecutions, "business workflow execution") },
            b2c: { aiTokens: requirePackages(personalSteps.aiTokens, "personal AI token"), workflowExecutions: requirePackages(personalSteps.workflowExecutions, "personal workflow execution") },
        },
        planQuantities: {
            pro: { aiTokens: requirePositiveInteger(pro.aiTokens, "Pro AI token"), workflowExecutions: requirePositiveInteger(pro.workflowExecutions, "Pro workflow execution") },
            max: { aiTokens: requirePositiveInteger(max.aiTokens, "Max AI token"), workflowExecutions: requirePositiveInteger(max.workflowExecutions, "Max workflow execution") },
        },
    }
}

export const getCraterCheckoutPackages = unstable_cache(fetchCraterCheckoutPackages, ["crater-checkout-packages"], { revalidate: 60 })
