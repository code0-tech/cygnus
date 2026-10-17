import assert from "node:assert/strict"
import test from "node:test"
import { getCountryOptions } from "../../src/lib/checkout/countries"

test("provides localized and alphabetically sorted ISO country options", () => {
    const germanOptions = getCountryOptions("de")
    const englishOptions = getCountryOptions("en")
    const germanGermany = germanOptions.find((country) => country.value === "DE")
    const englishGermany = englishOptions.find((country) => country.value === "DE")
    const collator = new Intl.Collator("de", { sensitivity: "base" })

    assert.equal(germanGermany?.label, "Deutschland")
    assert.equal(englishGermany?.label, "Germany")
    assert.match(germanGermany?.searchValue ?? "", /germany/)
    assert.match(englishGermany?.searchValue ?? "", /deutschland/)
    assert.ok(germanOptions.length > 200)
    assert.ok(germanOptions.every((country) => /^[A-Z]{2}$/.test(country.value)))
    assert.deepEqual(
        germanOptions.map((country) => country.label),
        germanOptions.map((country) => country.label).toSorted(collator.compare)
    )
})
