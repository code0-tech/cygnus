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
})
