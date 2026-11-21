import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { LicenseContent } from "../../src/lib/cms"
import type { LicenseDashboardCustomer } from "../../src/lib/licenses/types"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

let licenseData: { customers: Partial<LicenseDashboardCustomer>[]; error: string | null; isLoading: boolean } = { customers: [], error: null, isLoading: true }
const replacements: string[] = []

mock.module("@/components/licenses/data/LicenseDataProvider", { namedExports: { useLicenseData: () => licenseData } })
mock.module("next/navigation", { namedExports: { useRouter: () => ({ replace: (path: string) => replacements.push(path) }) } })
mock.module("@/components/licenses/pages/LicenseCustomerPage", {
    namedExports: { LicenseCustomerPage: ({ loading }: { loading?: boolean }) => <div>{loading ? "customer skeleton" : "customer page"}</div> },
})
mock.module("@code0-tech/pictor", { namedExports: { Text: ({ children }: { children?: React.ReactNode }) => <p>{children}</p> } })

const { cleanup, render } = await import("@testing-library/react")
const { LicenseIndexPage } = await import("../../src/components/licenses/pages/LicenseIndexPage")

const content = { emptyLicenses: "Noch keine Lizenzen" } as LicenseContent

afterEach(() => {
    cleanup()
    replacements.length = 0
})

test("forwards /licenses to the page of the user's single customer", () => {
    licenseData = { customers: [{ id: "gid://crater/Customer/7" }], error: null, isLoading: false }
    const { container } = render(<LicenseIndexPage content={content} locale="de" />)

    assert.deepEqual(replacements, ["/de/licenses/customer/7"])
    assert.equal(container.textContent, "customer skeleton", "the customer page skeleton bridges the forwarding")
})

test("shows the customer page skeleton while the dashboard data loads", () => {
    licenseData = { customers: [], error: null, isLoading: true }
    const { container } = render(<LicenseIndexPage content={content} locale="de" />)

    assert.deepEqual(replacements, [])
    assert.equal(container.textContent, "customer skeleton")
})

test("a user without a customer stays on /licenses and sees the empty state", () => {
    licenseData = { customers: [], error: null, isLoading: false }
    const { container } = render(<LicenseIndexPage content={content} locale="de" />)

    assert.deepEqual(replacements, [])
    assert.equal(container.textContent, "Noch keine Lizenzen")
})
