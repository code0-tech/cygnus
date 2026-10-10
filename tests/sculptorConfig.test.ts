import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test, { afterEach } from "node:test"
import { createMainAppLoginUrl } from "../src/lib/checkout/checkoutLogin"

const serverOnlyHook = registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context)
    },
})
const { getClientConfig } = await import("../src/lib/clientConfig.server")
serverOnlyHook.deregister()
const originalUrl = process.env.SCULPTOR_URL
const originalLoginUrl = process.env.SCULPTOR_LOGIN_URL

afterEach(() => {
    if (originalUrl === undefined) delete process.env.SCULPTOR_URL
    else process.env.SCULPTOR_URL = originalUrl
    if (originalLoginUrl === undefined) delete process.env.SCULPTOR_LOGIN_URL
    else process.env.SCULPTOR_LOGIN_URL = originalLoginUrl
})

test("includes both Sculptor URLs in the runtime client configuration", () => {
    process.env.SCULPTOR_URL = " https://app.example "
    process.env.SCULPTOR_LOGIN_URL = "https://app.example/login"
    assert.equal(getClientConfig().sculptorUrl, "https://app.example")
    assert.equal(getClientConfig().sculptorLoginUrl, "https://app.example/login")

    process.env.SCULPTOR_URL = "http://localhost:3001"
    process.env.SCULPTOR_LOGIN_URL = " https://login.example/login "
    assert.equal(getClientConfig().sculptorUrl, "http://localhost:3001")
    assert.equal(getClientConfig().sculptorLoginUrl, "https://login.example/login")
})

test("keeps callback, cancellation and namespace selection on the environment-provided login URL", () => {
    process.env.SCULPTOR_URL = "https://staging-app.example/"
    process.env.SCULPTOR_LOGIN_URL = "https://staging-app.example/login"
    const callback = "https://cygnus.example/api/crater/auth/callback?returnPath=%2Fen%2Fcheckout"
    const cancel = "https://cygnus.example/en/subscription"
    const url = new URL(createMainAppLoginUrl(getClientConfig().sculptorLoginUrl, callback, cancel, true))
    assert.equal(url.origin, "https://staging-app.example")
    assert.equal(url.pathname, "/login")
    assert.equal(url.searchParams.get("callbackUrl"), callback)
    assert.equal(url.searchParams.get("cancelUrl"), cancel)
    assert.equal(url.searchParams.get("selectNamespace"), "true")
})
