import assert from "node:assert/strict"
import test, { mock } from "node:test"
import React, { type ReactNode } from "react"
import { renderToString } from "react-dom/server"
import type { ErrorsContent, LicenseContent } from "../../src/lib/cms"
import { licenseToastContent } from "../helpers/licenseToasts"

const toastErrors: string[] = []
const licenseToasts = { error: (message: string) => toastErrors.push(message), success: () => {} }
mock.module("@/components/licenses/layout/LicenseNotifications", {
    namedExports: { LicenseNotifications: ({ children }: { children?: ReactNode }) => <>{children}</>, useLicenseToasts: () => licenseToasts },
})

let dashboardError: string | null = null
let dashboardNotFound = false
const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>

mock.module("@/components/licenses/data/LicenseDataProvider", {
    namedExports: {
        LicenseDataProvider: Container,
        useLicenseData: () => ({ error: dashboardError, isNotFound: dashboardNotFound, isSidebarLoading: false, notice: null, reload: () => {}, sidebarLicenses: [] }),
    },
})
mock.module("@/components/licenses/layout/LicensePrimarySidebar", {
    namedExports: { LicensePrimarySidebar: () => <aside>Primary sidebar</aside> },
})
mock.module("@/components/licenses/layout/LicenseSidebar", {
    namedExports: { LicenseSidebar: () => <aside>License sidebar</aside> },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        toast: () => "test-toast",
        Alert: ({ children }: { children?: ReactNode }) => <div role="alert">{children}</div>,
        AuroraBackground: () => null,
        Button: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
        FullScreen: Container,
        ScrollArea: Container,
        ScrollAreaScrollbar: Container,
        ScrollAreaThumb: Container,
        ScrollAreaViewport: Container,
    },
})

const { LicenseLayout } = await import("../../src/components/licenses/layout/LicenseLayout")

function renderLayout() {
    return renderToString(
        <LicenseLayout content={{ sidebar: {} } as LicenseContent} errors={{ retry: "Try again" } as ErrorsContent} locale="de" toasts={licenseToastContent} sculptorUrl="https://app.example">
            <span>Dashboard content</span>
        </LicenseLayout>
    )
}

test("a failed dashboard load shows a retryable alert inside the layout instead of a not-found page", () => {
    dashboardError = "The license dashboard could not be loaded."
    dashboardNotFound = false
    const html = renderLayout()
    assert.match(html, /role="alert"/)
    assert.match(html, /The license dashboard could not be loaded\./)
    assert.match(html, /Try again/)
    assert.doesNotMatch(html, /Dashboard content/)
    assert.match(html, /Primary sidebar/)
    assert.match(html, /License sidebar/)
})

test("only an unknown customer or license triggers the parent Next.js not-found boundary", () => {
    dashboardError = null
    dashboardNotFound = true
    assert.throws(renderLayout, (error: unknown) =>
        error instanceof Error && "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404"
    )
})

test("a dashboard without errors still renders its content and sidebars", () => {
    dashboardError = null
    dashboardNotFound = false
    const html = renderLayout()
    assert.match(html, /Dashboard content/)
    assert.match(html, /Primary sidebar/)
    assert.match(html, /License sidebar/)
})
