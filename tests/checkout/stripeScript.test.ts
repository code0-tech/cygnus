import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { STRIPE_JS_URL } from "../../src/lib/checkout/stripeScript"

test("preloads the same Stripe.js URL that @stripe/stripe-js injects", () => {
    const pure = readFileSync(createRequire(import.meta.url).resolve("@stripe/stripe-js/dist/pure.js"), "utf8")
    const releaseTrain = pure.match(/var RELEASE_TRAIN = '([a-z0-9]+)'/)?.[1]
    const origin = pure.match(/var ORIGIN = '([^']+)'/)?.[1]

    assert.ok(releaseTrain && origin, "@stripe/stripe-js no longer exposes its script URL the expected way")
    assert.equal(STRIPE_JS_URL, `${origin}/${releaseTrain}/stripe.js`)
})
