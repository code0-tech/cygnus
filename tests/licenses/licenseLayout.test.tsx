import assert from "node:assert/strict"
import test, { mock } from "node:test"
import React, { type ReactNode } from "react"
import { renderToString } from "react-dom/server"
import type { ErrorsContent, LicenseContent } from "../../src/lib/cms"
import { licenseToastContent } from "../helpers/licenseToasts"

mock.module("@/components/licenses/layout/LicenseNotifications", { namedExports: { LicenseNotifications: ({ children }: { children?: ReactNode }) => <>{children}</> } })

let dashboardError: string | null = null
const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>

mock.module("@/components/licenses/data/LicenseDataProvider", {
    namedExports: {
        LicenseDataProvider: Container,
        useLicenseData: () => ({ error: dashboardError, isSidebarLoading: false, sidebarLicenses: [] }),
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
        AuroraBackground: () => null,
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
        <LicenseLayout content={{ sidebar: {} } as LicenseContent} errors={{} as ErrorsContent} locale="de" toasts={licenseToastContent} sculptorUrl="https://app.example">
            <span>Dashboard content</span>
        </LicenseLayout>
    )
}

test("dashboard errors trigger the parent Next.js not-found boundary", () => {
    dashboardError = "The license dashboard could not be loaded."
    assert.throws(renderLayout, (error: unknown) =>
        error instanceof Error && "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404"
    )
})

test("a dashboard without errors still renders its content and sidebars", () => {
    dashboardError = null
    const html = renderLayout()
    assert.match(html, /Dashboard content/)
    assert.match(html, /Primary sidebar/)
    assert.match(html, /License sidebar/)
})
