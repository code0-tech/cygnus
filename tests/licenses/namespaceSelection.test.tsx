import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { Error as CraterError } from "@code0-tech/crater-graphql-types"
import type { ErrorsContent } from "../../src/lib/cms"
import { isNamespaceInUse } from "../../src/lib/crater/errors"
import { NamespaceSelectionError } from "../../src/components/licenses/NamespaceSelectionError"

const conflict = { errorCode: "INVALID_SUBSCRIPTION", details: [{ __typename: "MessageError", message: "Namespace is already linked to another subscription" }] } as CraterError

test("recognizes only the namespace conflict returned by Crater", () => {
    assert.equal(isNamespaceInUse([conflict]), true)
    assert.equal(isNamespaceInUse([{ ...conflict, details: [{ __typename: "MessageError", message: "Only cloud subscriptions can be linked to a namespace" }] }]), false)
    assert.equal(isNamespaceInUse(null), false)
    assert.equal(isNamespaceInUse([]), false)
})

test("renders localized namespace conflicts and preserves the generic error fallback", () => {
    const errors = { namespaceInUse: "Namespace is already in use", licenseUpdate: "Could not update subscription" } as ErrorsContent
    assert.match(renderToStaticMarkup(<NamespaceSelectionError error="occupied" errors={errors} />), /role="alert".*Namespace is already in use/)
    assert.match(renderToStaticMarkup(<NamespaceSelectionError error="update" errors={errors} />), /Could not update subscription/)
    assert.equal(renderToStaticMarkup(<NamespaceSelectionError error={null} errors={errors} />), "")
})
