import assert from "node:assert/strict"
import test from "node:test"
import { escapeHtml } from "@/lib/smtp"

test("escapes html-sensitive characters", () => {
    assert.equal(escapeHtml(`<a href="x">It's ok & safe</a>`), "&lt;a href=&quot;x&quot;&gt;It&#039;s ok &amp; safe&lt;/a&gt;")
})
