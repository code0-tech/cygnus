import assert from "node:assert/strict"
import test from "node:test"
import { getMediaUrl } from "@/lib/media"

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
})

test("normalizes configured app media URLs to relative paths", () => {
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://codezero.build"

    try {
        assert.equal(getMediaUrl("https://codezero.build/api/media/file/example.png"), "/api/media/file/example.png")
        assert.equal(getMediaUrl("https://cdn.example.com/api/media/file/example.png"), "https://cdn.example.com/api/media/file/example.png")
    } finally {
        process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }
})
