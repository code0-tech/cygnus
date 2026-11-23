import assert from "node:assert/strict"
import test from "node:test"
import { getLocaleFromPath, isSupportedLocale, localizeHref } from "@/lib/i18n"

test("detects supported locales", () => {
    assert.equal(isSupportedLocale("en"), true)
    assert.equal(isSupportedLocale("de"), true)
    assert.equal(isSupportedLocale("fr"), false)
})

test("gets locale from path with fallback", () => {
    assert.equal(getLocaleFromPath("/de/features"), "de")
    assert.equal(getLocaleFromPath("/en"), "en")
    assert.equal(getLocaleFromPath("/features"), "en")
    assert.equal(getLocaleFromPath("/"), "en")
})

test("localizes internal hrefs only once", () => {
    assert.equal(localizeHref("/features", "de"), "/de/features")
    assert.equal(localizeHref("/", "de"), "/de")
    assert.equal(localizeHref("/en/features", "de"), "/en/features")
    assert.equal(localizeHref("https://example.com", "de"), "https://example.com")
    assert.equal(localizeHref("/features?tab=1#top", "de"), "/de/features?tab=1#top")
})

test("leaves routes outside the localized app and other origins untouched", () => {
    assert.equal(localizeHref("/api/crater/licenses/access?customerId=1", "de"), "/api/crater/licenses/access?customerId=1")
    assert.equal(localizeHref("/api?x=1", "de"), "/api?x=1")
    assert.equal(localizeHref("/admin", "de"), "/admin")
    assert.equal(localizeHref("/_next/static/chunk.js", "de"), "/_next/static/chunk.js")
    assert.equal(localizeHref("//cdn.example.com/file", "de"), "//cdn.example.com/file")
    assert.equal(localizeHref("/apis", "de"), "/de/apis")
})
