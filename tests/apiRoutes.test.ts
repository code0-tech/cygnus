import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test, { mock, type TestContext } from "node:test"
import { registerHooks } from "node:module"
import { NextRequest } from "next/server"

registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context)
    },
})

function setEnv(t: TestContext, key: string, value: string) {
    const previous = process.env[key]
    process.env[key] = value
    t.after(() => {
        if (previous === undefined) delete process.env[key]
        else process.env[key] = previous
    })
}
const sendEmail = mock.fn(async () => {})
const find = mock.fn(async () => ({ docs: [{ id: 1, title: "Engineer" }] }))
const create = mock.fn(async () => ({ id: 2 }))
const update = mock.fn(async () => ({ id: 1 }))
const getPayloadClient = mock.fn(async () => ({ sendEmail, find, create, update }))
mock.module("@/lib/payloadClient", { namedExports: { getPayloadClient } })
const getPaginatedActions = mock.fn(async (..._args: unknown[]) => ({ docs: [] }))
const getBlogPosts = mock.fn(async (..._args: unknown[]) => ({ docs: [] }))
mock.module("@/lib/cms", { namedExports: { getPaginatedActions, getBlogPosts } })

const { POST: contact } = await import("@/app/api/contact/route")
const { POST: application } = await import("@/app/api/job-applications/[slug]/route")
const { POST: importAction } = await import("@/app/api/actions/import/route")
const { GET: actions } = await import("@/app/api/payload_actions/route")
const { GET: blog } = await import("@/app/api/payload_blog/route")

function request(body: unknown, address: string, prefix = "192.0.2.1") {
    return new Request("https://example.com/api", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `${prefix}, ${address}` },
        body: JSON.stringify(body),
    })
}

const validForm = { name: "Alice", email: "alice@example.com", acceptTerms: true, message: "Hello", text: "Application" }
const forms = [
    { name: "contact", handler: contact },
    { name: "application", handler: (req: Request) => application(req, { params: Promise.resolve({ slug: "engineer" }) }) },
]

for (const [index, route] of forms.entries()) {
    test(`${route.name} cannot bypass the rate limit by changing the left XFF entry`, async (t) => {
        setEnv(t, "CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS", "1")
        setEnv(t, "CONTACT_RATE_LIMIT_MAX", "1")
        setEnv(t, "JOBS_RATE_LIMIT_MAX", "1")
        const address = `198.51.100.${index + 1}`
        const before = sendEmail.mock.callCount()
        assert.equal((await route.handler(request(validForm, address))).status, 200)
        const rejected = await route.handler(request(validForm, address, "192.0.2.99"))
        assert.equal(rejected.status, 429)
        assert.ok(Number(rejected.headers.get("retry-after")) > 0)
        assert.equal(sendEmail.mock.callCount(), before + 1)
        assert.equal((await route.handler(request(validForm, `198.51.100.${index + 11}`))).status, 200)
    })

    test(`${route.name} rejects invalid submissions before accessing Payload`, async () => {
        const before = getPayloadClient.mock.callCount()
        for (const [offset, body] of [null, {}, { ...validForm, email: "invalid" }, { ...validForm, acceptTerms: false }].entries()) {
            assert.equal((await route.handler(request(body, `203.0.113.${index * 10 + offset + 1}`))).status, 400)
        }
        assert.equal(getPayloadClient.mock.callCount(), before)
    })
}

test("application rejects invalid slugs before accessing Payload", async () => {
    const before = getPayloadClient.mock.callCount()
    for (const slug of ["", "bad\r\nslug", "x".repeat(201)]) {
        assert.equal((await application(request(validForm, "203.0.113.50"), { params: Promise.resolve({ slug }) })).status, 400)
    }
    assert.equal(getPayloadClient.mock.callCount(), before)
})

const secret = "test-import-secret"
function jwt(payload: object = {}, algorithm = "HS256", signingSecret = secret) {
    const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: "JWT" })).toString("base64url")
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
    return `${header}.${data}.${createHmac("sha256", signingSecret).update(`${header}.${data}`).digest("base64url")}`
}
function importRequest(token?: string, body = "{}") {
    return new Request("https://example.com/api/actions/import", {
        method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body,
    })
}

test("import refuses missing, malformed, forged, expired and premature credentials before Payload access", async (t) => {
    setEnv(t, "ACTIONS_IMPORT_SECRET", secret)
    setEnv(t, "NODE_ENV", "production")
    const before = getPayloadClient.mock.callCount()
    const now = Math.floor(Date.now() / 1000)
    for (const token of [undefined, secret, "invalid", jwt({}, "none"), jwt({}, "HS256", "wrong-secret"), jwt({ exp: now - 60 }), jwt({ nbf: now + 3600 })]) {
        assert.equal((await importAction(importRequest(token))).status, 401)
    }
    setEnv(t, "ACTIONS_IMPORT_SECRET", "")
    assert.equal((await importAction(importRequest(jwt()))).status, 401)
    assert.equal(getPayloadClient.mock.callCount(), before)
})

test("authenticated import validates JSON, identifier and name before Payload access", async (t) => {
    setEnv(t, "ACTIONS_IMPORT_SECRET", secret)
    const before = getPayloadClient.mock.callCount()
    for (const [body, error] of [
        ["{", "Missing module JSON."],
        ["null", "Missing module JSON."],
        ["[]", "Module identifier is required."],
        ["{}", "Module identifier is required."],
        [JSON.stringify({ identifier: 123 }), "Module identifier is required."],
        [JSON.stringify({ identifier: "test" }), "Module name is required."],
    ]) {
        const response = await importAction(importRequest(jwt(), body))
        assert.equal(response.status, 400)
        assert.deepEqual(await response.json(), { error })
    }
    assert.equal(getPayloadClient.mock.callCount(), before)
})

test("authenticated import updates an existing action using its uploaded module", async (t) => {
    setEnv(t, "ACTIONS_IMPORT_SECRET", secret)
    const module = { identifier: "test", name: [{ code: "en", content: "Test" }] }
    const response = await importAction(importRequest(jwt(), JSON.stringify(module)))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 1, identifier: "test", mediaId: 2, status: "updated" })
    assert.deepEqual(update.mock.calls.at(-1)?.arguments, [{ id: 1, collection: "actions", data: { identifier: "test", module: 2 }, overrideAccess: true }])
})

for (const route of [{ name: "actions", handler: actions, query: getPaginatedActions }, { name: "blog", handler: blog, query: getBlogPosts }]) {
    test(`${route.name} rejects invalid locale and pagination before querying CMS`, async () => {
        const before = route.query.mock.callCount()
        for (const query of ["", "locale=xx", "locale=en&page=0", "locale=en&page=1.5", "locale=en&limit=51", "locale=en&limit=nope"]) {
            assert.equal((await route.handler(new NextRequest(`https://example.com/api?${query}`))).status, 400)
        }
        assert.equal(route.query.mock.callCount(), before)
    })
    test(`${route.name} forwards valid pagination and returns CMS results`, async () => {
        const response = await route.handler(new NextRequest("https://example.com/api?locale=en&page=2&limit=10"))
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { docs: [] })
        assert.equal(route.query.mock.calls.at(-1)?.arguments[0], "en")
        assert.equal((route.query.mock.calls.at(-1)?.arguments[1] as { page: number }).page, 2)
    })
}

test("actions rejects invalid filters and excessive search text before querying CMS", async () => {
    const before = getPaginatedActions.mock.callCount()
    for (const query of ["tag=unknown", "sort=unknown", `search=${"x".repeat(257)}`]) {
        assert.equal((await actions(new NextRequest(`https://example.com/api?locale=en&${query}`))).status, 400)
    }
    assert.equal(getPaginatedActions.mock.callCount(), before)
})
