import assert from "node:assert/strict"
import test from "node:test"
import type { Error as CraterError } from "@code0-tech/crater-graphql-types"
import { isNamespaceInUse } from "../../src/lib/crater/errors"

const conflict = { errorCode: "INVALID_SUBSCRIPTION", details: [{ __typename: "MessageError", message: "Namespace is already linked to another subscription" }] } as CraterError

test("recognizes only the namespace conflict returned by Crater", () => {
    assert.equal(isNamespaceInUse([conflict]), true)
    assert.equal(isNamespaceInUse([{ ...conflict, details: [{ __typename: "MessageError", message: "Only cloud subscriptions can be linked to a namespace" }] }]), false)
    assert.equal(isNamespaceInUse(null), false)
    assert.equal(isNamespaceInUse([]), false)
})
