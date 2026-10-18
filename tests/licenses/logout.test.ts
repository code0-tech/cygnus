import assert from "node:assert/strict"
import test, { mock } from "node:test"
import { logoutLicenseSession } from "../../src/lib/licenses/client"

test("logout accepts confirmed local logout when Crater revocation failed", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
        assert.equal(url, "/api/crater/auth/session")
        assert.equal(init?.method, "DELETE")
        assert.equal(init?.credentials, "same-origin")
        return Response.json({ authenticated: false, errorCode: "MISSING_PERMISSION" }, { status: 422 })
    })
    try {
        await assert.doesNotReject(logoutLicenseSession)
    } finally {
        fetchMock.mock.restore()
    }
})

test("logout still fails when the server has not confirmed local logout", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ error: "Proxy unavailable" }, { status: 502 }))
    try {
        await assert.rejects(logoutLicenseSession, /Could not log out/)
        fetchMock.mock.mockImplementation(async () => { throw new TypeError("Network unavailable") })
        await assert.rejects(logoutLicenseSession, /Network unavailable/)
    } finally {
        fetchMock.mock.restore()
    }
})
