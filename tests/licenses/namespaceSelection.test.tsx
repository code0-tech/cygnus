import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ReactNode } from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import type { LicenseContent, SubscriptionConfigData } from "../../src/lib/cms"
import type { LicenseDashboardLicense } from "../../src/lib/licenses/types"
import type { Error as CraterError } from "@code0-tech/crater-graphql-types"
import { isNamespaceInUse } from "../../src/lib/crater/errors"

const conflict = { errorCode: "INVALID_SUBSCRIPTION", details: [{ __typename: "MessageError", message: "Namespace is already linked to another subscription" }] } as CraterError

installDomTestEnvironment()
mock.module("next/navigation", { namedExports: { useRouter: () => ({}) } })
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children }: { children: ReactNode }) => <button>{children}</button>,
        Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
        Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    },
})
mock.module("@/components/licenses/data/LicenseDataProvider", { namedExports: { useLicenseData: () => ({ updateLicense: () => {} }) } })
mock.module("@/hooks/useSubscriptionUpdatePreview", { namedExports: { useSubscriptionUpdatePreview: () => ({}) } })
mock.module("@/components/ui/Switch", { namedExports: { Switch: () => null } })
mock.module("@/components/licenses/shared/SubscriptionPendingUpdateNotice", { namedExports: { SubscriptionPendingUpdateNotice: () => null } })
const Row = ({ children, title, action }: { children?: ReactNode; title?: ReactNode; action?: ReactNode }) => <div>{title}{children}{action}</div>
mock.module("@/components/licenses/dialog/shared/LicenseTabLayout", {
    namedExports: { LicenseTabHeader: Row, LicenseTabRow: Row, LicenseTabSection: Row },
})
const { cleanup, render, screen } = await import("@testing-library/react")
const { LicenseGeneralTab } = await import("../../src/components/licenses/dialog/subscription/LicenseGeneralTab")
afterEach(cleanup)

test("the edit dialog displays a namespace name and an unavailable namespace fallback", () => {
    const license = { id: "2", customerId: "1", customerName: "Customer", name: "Pro", deploymentType: "cloud", namespaceId: "opaque-id", namespaceName: "Example Workspace" } as LicenseDashboardLicense
    const content = { editor: { namespaceHeading: "Namespace", changeNamespaceLabel: "Change namespace" } } as LicenseContent
    const props = { content, license, errors: {} as import("../../src/lib/cms").ErrorsContent, locale: "en" as const, namespaceHref: "https://app.example/login", onClose: () => {}, subscriptionConfig: {} as SubscriptionConfigData, title: "Edit" }
    const { rerender } = render(<LicenseGeneralTab {...props} />)
    assert.ok(screen.getByText("Example Workspace"))
    assert.equal(screen.queryByText("opaque-id"), null)
    rerender(<LicenseGeneralTab {...props} license={{ ...license, namespaceId: null, namespaceName: null }} />)
    assert.ok(screen.getByText("—"))
    assert.equal(screen.queryByText("Example Workspace"), null)
})

test("recognizes only the namespace conflict returned by Crater", () => {
    assert.equal(isNamespaceInUse([conflict]), true)
    assert.equal(isNamespaceInUse([{ ...conflict, details: [{ __typename: "MessageError", message: "Only cloud subscriptions can be linked to a namespace" }] }]), false)
    assert.equal(isNamespaceInUse(null), false)
    assert.equal(isNamespaceInUse([]), false)
})
