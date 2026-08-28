import assert from "node:assert/strict"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { playgroundMediaFields, validatePlaygroundUrl } from "@/fields/playgroundMediaFields"

test("defaults section media to image and toggles the corresponding Payload fields", () => {
    const fields = playgroundMediaFields()
    const mediaType = fields.find((field) => "name" in field && field.name === "mediaType")
    const image = fields.find((field) => "name" in field && field.name === "image")
    const playgroundUrl = fields.find((field) => "name" in field && field.name === "playgroundUrl")

    assert.ok(mediaType && "defaultValue" in mediaType)
    assert.equal(mediaType.defaultValue, "image")
    assert.ok(image && "admin" in image && image.admin?.condition)
    assert.equal(image.admin.condition({}, { mediaType: "image" }, {} as never), true)
    assert.equal(image.admin.condition({}, { mediaType: "playground" }, {} as never), false)
    assert.ok(playgroundUrl && "admin" in playgroundUrl && playgroundUrl.admin?.condition)
    assert.equal(playgroundUrl.admin.condition({}, { mediaType: "image" }, {} as never), false)
    assert.equal(playgroundUrl.admin.condition({}, { mediaType: "playground" }, {} as never), true)
})

test("requires a valid playground URL only in playground mode", () => {
    assert.equal(validatePlaygroundUrl(undefined, { mediaType: "image" }), true)
    assert.equal(validatePlaygroundUrl(undefined, { mediaType: "playground" }), "A playground URL is required.")
    assert.equal(validatePlaygroundUrl("/en/playground", { mediaType: "playground" }), true)
    assert.equal(validatePlaygroundUrl("https://playground.example.com/demo", { mediaType: "playground" }), true)
    assert.equal(validatePlaygroundUrl("javascript:alert(1)", { mediaType: "playground" }), "The playground URL must use HTTP or HTTPS.")
})

test("renders the playground as a lazy iframe", () => {
    const markup = renderToStaticMarkup(React.createElement(PlaygroundFrame, { title: "Workflow playground", url: "https://playground.example.com/demo" }))

    assert.match(markup, /<iframe/)
    assert.match(markup, /src="https:\/\/playground\.example\.com\/demo"/)
    assert.match(markup, /loading="lazy"/)
    assert.match(markup, /title="Workflow playground"/)
})
