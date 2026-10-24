import { parseCraterPaymentPeriod, parseCraterPlan } from "@/lib/crater/values"

const CONFIGURATION_PARAMETERS = ["plan", "customerType", "deploymentType", "deployment", "paymentPeriod", "aiTokens", "workflowExecutions"]

export function assertCheckoutParameters(searchParams: URLSearchParams) {
    const plan = searchParams.get("plan")
    const customerType = searchParams.get("customerType")
    const deploymentType = searchParams.get("deploymentType")
    const legacyDeployment = searchParams.get("deployment")
    const deployment = deploymentType ?? legacyDeployment
    const paymentPeriod = searchParams.get("paymentPeriod")

    if (
        CONFIGURATION_PARAMETERS.some((key) => searchParams.getAll(key).length > 1) ||
        !plan ||
        !parseCraterPlan(plan) ||
        (customerType !== "b2b" && customerType !== "b2c") ||
        (deployment !== "cloud" && deployment !== "self_hosted") ||
        (deploymentType !== null && legacyDeployment !== null && deploymentType !== legacyDeployment) ||
        !paymentPeriod ||
        !parseCraterPaymentPeriod(paymentPeriod)
    ) {
        throw new Error("Invalid checkout configuration.")
    }
}
