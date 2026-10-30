import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ComponentProps, type ReactNode } from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()
const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Command: Wrap, CommandEmpty: Wrap, CommandGroup: Wrap, CommandInput: () => null,
        CommandItem: ({ children, onSelect }: { children?: ReactNode; onSelect: () => void }) => <button onClick={onSelect}>{children}</button>,
        CommandList: Wrap, Dialog: Wrap, DialogClose: Wrap, DialogFooter: Wrap, DialogTrigger: Wrap,
        Menu: Wrap, MenuContent: Wrap, MenuTrigger: Wrap,
    },
})
mock.module("@/components/ui/SiteDialog", { namedExports: { SiteDialogContent: Wrap } })
const { cleanup, fireEvent, render, screen } = await import("@testing-library/react")
const { WorkflowCalculatorDialog } = await import("../../src/components/subscription/WorkflowCalculatorDialog")
afterEach(cleanup)

const packages = [100, 1000, 5000, 10000]
const content = {
    title: "Workflow calculator", triggerLabel: "Calculate", closeLabel: "Close", description: "Estimate usage",
    businessTypeLabel: "Business type", businessTypeSearchPlaceholder: "Search", noBusinessTypesFoundLabel: "No results",
    activeWorkflowsLabel: "Active", runsPerDayLabel: "Runs", daysPerMonthLabel: "Days", estimateLabel: "Estimate",
    cancelLabel: "Cancel", applyLabel: "Apply",
    types: [{ name: "Software", conversion_rate: 1, conversion_unit: "operations", icon: "" }, { name: "Retail", conversion_rate: 2, conversion_unit: "orders", icon: "" }],
} satisfies ComponentProps<typeof WorkflowCalculatorDialog>["content"]

test("the calculator offers exactly the package sizes and applies the selected package", () => {
    const applied: number[] = []
    render(<WorkflowCalculatorDialog locale="en" content={content} businessTypeIcons={[]} value={100} packages={packages} suffix="executions" onApply={(value) => applied.push(value)} />)
    const slider = screen.getByRole("slider")
    assert.equal(slider.querySelectorAll("[data-major]").length, packages.length)
    for (const label of ["1K operations", "5K operations", "10K operations"]) {
        fireEvent.keyDown(slider, { key: "ArrowRight" })
        assert.equal(slider.getAttribute("aria-valuetext"), label)
        fireEvent.click(screen.getByRole("button", { name: "Apply" }))
    }
    assert.deepEqual(applied, packages.slice(1))
})

test("snaps an initial intermediate value and keeps the conversion result in an available package", () => {
    const applied: number[] = []
    render(<WorkflowCalculatorDialog locale="en" content={content} businessTypeIcons={[]} value={250} packages={packages} suffix="executions" onApply={(value) => applied.push(value)} />)
    assert.equal(screen.getByRole("slider").getAttribute("aria-valuetext"), "1K operations")
    fireEvent.click(screen.getByRole("button", { name: /Retail/ }))
    fireEvent.click(screen.getByRole("button", { name: "Apply" }))
    assert.deepEqual(applied, [5000])
})
