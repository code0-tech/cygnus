import assert from "node:assert/strict"
import test from "node:test"
import { POST as exportLicense } from "../../src/app/api/crater/licenses/export/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

const licenseId = "gid://crater/License/42"
const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}

async function withGraphQLServer(responses: unknown[], run: (graphQLServer: Awaited<ReturnType<typeof createGraphQLTestServer>>) => Promise<void>) {
    const graphQLServer = await createGraphQLTestServer(responses)
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        await run(graphQLServer)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
}

test("license export requires a Crater session", async () => {
    const response = await exportLicense(
        new Request("https://example.com/api/crater/licenses/export", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: licenseId }),
        })
    )

    assert.equal(response.status, 403)
})

test("license export requires a valid Crater license id", async () => {
    const response = await exportLicense(
        new Request("https://example.com/api/crater/licenses/export", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ id: "License/42" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "A valid Crater license id is required." })
})

test("license export returns the signed self-hosted license as a private download", async () => {
    const license = "-----BEGIN CODE0 LICENSE-----\nsigned-license\n-----END CODE0 LICENSE-----\n"

    await withGraphQLServer(
        [
            {
                data: {
                    licensesExport: {
                        errors: [],
                        license,
                    },
                },
            },
        ],
        async (graphQLServer) => {
            const response = await exportLicense(
                new Request("https://example.com/api/crater/licenses/export", {
                    method: "POST",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: licenseId }),
                })
            )

            assert.equal(response.status, 200)
            assert.equal(await response.text(), license)
            assert.equal(response.headers.get("content-type"), "application/octet-stream")
            assert.equal(response.headers.get("content-disposition"), 'attachment; filename="code0-license-42.czlc"')
            assert.equal(response.headers.get("x-license-filename"), "code0-license-42.czlc")
            assert.match(response.headers.get("cache-control") ?? "", /no-store/)
            assert.equal(graphQLServer.requests[0]?.authorization, "Session c_ust_example")
            assert.equal(graphQLServer.requests[0]?.body.operationName, "LicensesExport")
            assert.deepEqual(graphQLServer.requests[0]?.body.variables, { input: { id: licenseId } })
            assert.doesNotMatch(graphQLServer.requests[0]?.body.query ?? "", /fileName|licenseFile/)
        }
    )
})

test("license export surfaces Crater domain errors", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    licensesExport: {
                        errors: [{ errorCode: "INVALID_LICENSE", details: [] }],
                        license: null,
                    },
                },
            },
        ],
        async () => {
            const response = await exportLicense(
                new Request("https://example.com/api/crater/licenses/export", {
                    method: "POST",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: licenseId }),
                })
            )

            assert.equal(response.status, 422)
            assert.deepEqual(await response.json(), {
                error: "Crater could not export the license.",
                errorCode: "INVALID_LICENSE",
                details: [],
            })
        }
    )
})
