import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"

const require = createRequire(import.meta.url)

test("keeps checkout and license routes out of the sitemap", () => {
    const { exclude } = require("../next-sitemap.config.cjs") as { exclude: string[] }

    for (const pattern of ["/*/checkout", "/*/checkout/*", "/*/licenses", "/*/licenses/*"]) {
        assert.ok(exclude.includes(pattern), pattern)
    }
})

test("marks every checkout route as noindex through its layout", async () => {
    const { metadata } = await import("../src/app/(landing)/[locale]/checkout/layout")

    assert.deepEqual(metadata.robots, { index: false, follow: false })
})
