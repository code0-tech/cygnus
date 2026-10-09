import assert from "node:assert/strict"
import test from "node:test"
import { getMediaUrl } from "@/lib/media"
import { fetchMediaJson } from "@/lib/actionExtraction"
import type { Media } from "@/payload-types"

test("returns empty string for missing media URL", () => {
    assert.equal(getMediaUrl(null), "")
    assert.equal(getMediaUrl(undefined), "")
})

test("keeps relative media URLs unchanged", () => {
    assert.equal(getMediaUrl("/api/media/file/example.png"), "/api/media/file/example.png")
})

test("normalizes local Payload media URLs to relative paths", () => {
    assert.equal(getMediaUrl("http://localhost:3000/api/media/file/example.png?size=small"), "/api/media/file/example.png?size=small")
    assert.equal(getMediaUrl("http://127.0.0.1:3000/api/media/file/example.png"), "/api/media/file/example.png")
    assert.equal(getMediaUrl("https://0.0.0.0:3000/api/media/file/example.png"), "/api/media/file/example.png")
})

test("normalizes media URLs using the server origin set at runtime", () => {
    const previousServerUrl = process.env.SERVER_URL
    process.env.SERVER_URL = "https://staging.example.com"

    try {
        assert.equal(getMediaUrl("https://staging.example.com/api/media/file/example.png"), "/api/media/file/example.png")
        assert.equal(getMediaUrl("https://cdn.example.com/api/media/file/example.png"), "https://cdn.example.com/api/media/file/example.png")
        assert.equal(getMediaUrl("https://staging.example.com/external/image.png"), "https://staging.example.com/external/image.png")
    } finally {
        if (previousServerUrl === undefined) delete process.env.SERVER_URL
        else process.env.SERVER_URL = previousServerUrl
    }
})

test("normalizes browser media URLs against the browser origin without server environment access", () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
    const previousServerUrl = process.env.SERVER_URL
    delete process.env.SERVER_URL
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { origin: "https://staging.example.com" } } })

    try {
        assert.equal(getMediaUrl("https://staging.example.com/api/media/file/example.png?size=small"), "/api/media/file/example.png?size=small")
        assert.equal(getMediaUrl("https://cdn.example.com/api/media/file/example.png"), "https://cdn.example.com/api/media/file/example.png")
    } finally {
        if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
        else Reflect.deleteProperty(globalThis, "window")
        if (previousServerUrl === undefined) delete process.env.SERVER_URL
        else process.env.SERVER_URL = previousServerUrl
    }
})

test("fetches Payload action JSON from the runtime origin instead of the build-time origin", async (context) => {
    const previousServerUrl = process.env.SERVER_URL
    const previousPublicUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://build.example.com"
    const requestedUrls: string[] = []
    context.mock.method(globalThis, "fetch", async (input: string) => {
        requestedUrls.push(input)
        return Response.json({ actions: [] })
    })

    try {
        for (const siteOrigin of ["https://staging.example.com", "https://production.example.com"]) {
            process.env.SERVER_URL = siteOrigin
            for (const url of ["/api/media/file/actions.json?version=2", "http://0.0.0.0:3000/api/media/file/actions.json?version=2", `${siteOrigin}/api/media/file/actions.json?version=2`]) {
                assert.deepEqual(await fetchMediaJson({ url } as Media), { actions: [] })
                assert.equal(requestedUrls.at(-1), `${siteOrigin}/api/media/file/actions.json?version=2`)
            }
        }
        await fetchMediaJson({ url: "https://cdn.example.com/actions.json" } as Media)
        assert.equal(requestedUrls.at(-1), "https://cdn.example.com/actions.json")
    } finally {
        if (previousServerUrl === undefined) delete process.env.SERVER_URL
        else process.env.SERVER_URL = previousServerUrl
        if (previousPublicUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
        else process.env.NEXT_PUBLIC_APP_URL = previousPublicUrl
    }
})
