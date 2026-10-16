import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

interface CapturedGraphQLRequest {
    authorization: string | undefined
    body: {
        operationName?: string
        query?: string
        variables?: unknown
    }
}

export async function createGraphQLTestServer(responses: unknown[]) {
    const requests: CapturedGraphQLRequest[] = []
    const server = createServer((request, response) => {
        const chunks: Buffer[] = []

        request.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        request.on("end", () => {
            requests.push({
                authorization: request.headers.authorization,
                body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
            })

            response.writeHead(200, { "content-type": "application/json" })
            response.end(JSON.stringify(responses.shift() ?? { data: {} }))
        })
    })

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address() as AddressInfo

    return {
        requests,
        url: `http://127.0.0.1:${address.port}/graphql`,
        close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    }
}

// Points the Crater client at a scripted GraphQL server for the duration of run and restores the previous URL afterwards.
export async function withGraphQLServer(responses: unknown[], run: (server: Awaited<ReturnType<typeof createGraphQLTestServer>>) => Promise<void>) {
    const server = await createGraphQLTestServer(responses)
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = server.url
    try {
        await run(server)
    } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await server.close()
    }
}
