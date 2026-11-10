import assert from "node:assert/strict"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import test from "node:test"
import { gql } from "@apollo/client"
import { createApolloClient } from "../src/lib/apolloClient"
import { findCustomerForSubscription } from "../src/lib/licenses/snapshotLookup.server"
import { withGraphQLServer } from "./helpers/graphqlTestServer"

function withEnv(values: Record<string, string>, run: () => Promise<void>) {
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]))
    Object.assign(process.env, values)
    return run().finally(() => {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })
}

test("a Crater request that never answers fails after the configured timeout", async () => {
    const server = createServer(() => {})
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const { port } = server.address() as AddressInfo

    try {
        await withEnv({ CRATER_GRAPHQL_URL: `http://127.0.0.1:${port}/graphql`, CRATER_REQUEST_TIMEOUT_MS: "50" }, async () => {
            const startedAt = Date.now()
            await assert.rejects(createApolloClient("session").query({ query: gql`query Hanging { currentUser { id } }` }))
            assert.ok(Date.now() - startedAt < 5_000, "Must not wait for the platform timeout")
        })
    } finally {
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
    }
})

test("a subscription lookup stops when Crater keeps paging with fresh cursors", async () => {
    const endlessCustomers = Array.from({ length: 260 }, (_, index) => ({
        data: {
            currentUser: {
                customers: {
                    nodes: [{ id: `gid://crater/Customer/${index}`, subscriptions: { nodes: [], pageInfo: { hasNextPage: false } } }],
                    pageInfo: { hasNextPage: true, endCursor: `cursor-${index}` },
                },
            },
        },
    }))

    await withGraphQLServer(endlessCustomers, async (server) => {
        await assert.rejects(findCustomerForSubscription("session", "gid://crater/Subscription/1"), /query budget/)
        assert.equal(server.requests.length, 250)
    })
})
