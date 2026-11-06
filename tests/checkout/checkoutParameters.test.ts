import assert from "node:assert/strict"
import test from "node:test"
import { assertCheckoutParameters } from "../../src/lib/checkout/checkoutParameters"

const validParameters = { plan: "pro", customerType: "b2c", deploymentType: "self_hosted", paymentPeriod: "monthly" }

test("accepts every supported plan, customer type, deployment and payment period", () => {
    for (const plan of ["pro", "max", "custom"]) {
        for (const customerType of ["b2b", "b2c"]) {
            for (const deploymentType of ["cloud", "self_hosted"]) {
                for (const paymentPeriod of ["monthly", "quarterly", "yearly"]) {
                    assert.doesNotThrow(() => assertCheckoutParameters(new URLSearchParams({ plan, customerType, deploymentType, paymentPeriod })))
                }
            }
        }
    }
})

for (const [field, invalidValues] of Object.entries({
    plan: ["unknown", "PRO", " custom "],
    customerType: ["b2x", "business", "personal", "B2B"],
    deploymentType: ["local", "selfhosted", "CLOUD"],
    paymentPeriod: ["weekly", "annual", "MONTHLY"],
})) {
    test(`rejects missing, empty, unknown and repeated ${field} instead of using defaults`, () => {
        for (const value of [...invalidValues, "", null]) {
            const params = new URLSearchParams(validParameters)
            if (value === null) params.delete(field)
            else params.set(field, value)
            assert.throws(() => assertCheckoutParameters(params), /Invalid checkout configuration/)
        }
        const repeated = new URLSearchParams(validParameters)
        repeated.append(field, "unknown")
        assert.throws(() => assertCheckoutParameters(repeated), /Invalid checkout configuration/)
    })
}

test("accepts the legacy deployment parameter but refuses conflicting deployment values", () => {
    const params = new URLSearchParams(validParameters)
    params.delete("deploymentType")
    params.set("deployment", "cloud")
    assert.doesNotThrow(() => assertCheckoutParameters(params))
    params.set("deploymentType", "self_hosted")
    assert.throws(() => assertCheckoutParameters(params), /Invalid checkout configuration/)
})

test("leaves package validation to Crater and allows unrelated checkout parameters", () => {
    const params = new URLSearchParams({ ...validParameters, plan: "custom", aiTokens: "10000000", workflowExecutions: "100000", guestCheckout: "purchase", promotionCode: "SAVE" })
    assert.doesNotThrow(() => assertCheckoutParameters(params))
    params.append("aiTokens", "100000000")
    assert.throws(() => assertCheckoutParameters(params), /Invalid checkout configuration/)
})
