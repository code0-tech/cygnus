import assert from "node:assert/strict"
import test from "node:test"
import { getPlanForCustomerType, getSubscriptionConfiguratorSteps } from "../src/lib/subscriptionConfigurator"

test("builds the custom-plan wizard in the requested order", () => {
    assert.deepEqual(getSubscriptionConfiguratorSteps("custom", true), ["customerType", "plan", "deployment", "aiTokens", "workflowExecutions", "additionalFeatures", "paymentPeriod"])
})

test("skips custom usage steps for fixed plans", () => {
    assert.deepEqual(getSubscriptionConfiguratorSteps("pro", true), ["customerType", "plan", "deployment", "paymentPeriod"])
    assert.deepEqual(getSubscriptionConfiguratorSteps("max", false), ["customerType", "plan", "deployment", "paymentPeriod"])
})

test("restricts B2B customers to the custom plan", () => {
    assert.equal(getPlanForCustomerType("b2b", "pro"), "custom")
    assert.equal(getPlanForCustomerType("b2b", "max"), "custom")
    assert.equal(getPlanForCustomerType("b2c", "max"), "max")
})
