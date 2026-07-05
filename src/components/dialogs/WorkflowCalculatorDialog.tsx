"use client"

import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@code0-tech/pictor"
import { IconCalculator, IconCheck, IconX } from "@tabler/icons-react"
import { useState } from "react"

interface WorkflowCalculatorContent {
    triggerLabel: string
    title: string
    description: string
    closeLabel: string
    businessTypeLabel: string
    activeWorkflowsLabel: string
    runsPerDayLabel: string
    daysPerMonthLabel: string
    estimateLabel: string
    rangeNote: string
    cancelLabel: string
    applyLabel: string
    businessTypes: {
        name: string
        conversion_rate: number
        id?: string | null
    }[]
}

interface WorkflowCalculatorDialogProps {
    locale: string
    content: WorkflowCalculatorContent
    min: number
    max: number
    step: number
    suffix: string
    onApply: (value: number) => void
}

function clampToStep(value: number, min: number, max: number, step: number) {
    const safeStep = Math.max(step, 1)
    const steppedValue = Math.round((value - min) / safeStep) * safeStep + min
    return Math.min(max, Math.max(min, steppedValue))
}

export function WorkflowCalculatorDialog({ locale, content, min, max, step, suffix, onApply }: WorkflowCalculatorDialogProps) {
    const [selectedBusinessTypeIndex, setSelectedBusinessTypeIndex] = useState(0)
    const [activeWorkflows, setActiveWorkflows] = useState(1)
    const [runsPerDay, setRunsPerDay] = useState(10)
    const [daysPerMonth, setDaysPerMonth] = useState(30)
    const selectedBusinessType = content.businessTypes[selectedBusinessTypeIndex] ?? content.businessTypes[0]
    const rawEstimate = activeWorkflows * runsPerDay * daysPerMonth * (selectedBusinessType?.conversion_rate ?? 1)
    const estimatedExecutions = clampToStep(rawEstimate, min, max, step)
    const formatterLocale = locale === "de" ? "de-DE" : "en-US"
    const rangeNote = content.rangeNote.replace("{min}", min.toLocaleString(formatterLocale)).replace("{max}", max.toLocaleString(formatterLocale))

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="filled" className="shrink-0 gap-2" aria-label={content.title}>
                    <IconCalculator size={18} />
                    <span className="hidden sm:inline">{content.triggerLabel}</span>
                </Button>
            </DialogTrigger>

            <DialogPortal>
                <DialogOverlay className="bg-primary/70 backdrop-blur-sm" />
                <DialogContent className="border border-white/10 bg-primary! p-5! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle>{content.title}</DialogTitle>
                        <DialogDescription>{content.description}</DialogDescription>
                    </DialogHeader>

                    <DialogClose asChild>
                        <Button type="button" variant="none" className="absolute right-4 top-4 size-9! p-0! text-secondary hover:text-white" aria-label={content.closeLabel}>
                            <IconX size={18} />
                        </Button>
                    </DialogClose>

                    <div className="mt-6 grid gap-4">
                        <label className="flex flex-col gap-2 text-xs font-medium text-secondary">
                            <span>{content.businessTypeLabel}</span>
                            <select
                                value={selectedBusinessTypeIndex}
                                onChange={(event) => setSelectedBusinessTypeIndex(Number(event.currentTarget.value))}
                                className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-base text-white outline-none focus:border-white/30"
                            >
                                {content.businessTypes.map((businessType, index) => (
                                    <option key={businessType.id ?? `${businessType.name}-${index}`} value={index} className="bg-primary">
                                        {businessType.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <CalculatorInput label={content.activeWorkflowsLabel} value={activeWorkflows} onChange={setActiveWorkflows} />
                            <CalculatorInput label={content.runsPerDayLabel} value={runsPerDay} onChange={setRunsPerDay} />
                            <CalculatorInput label={content.daysPerMonthLabel} value={daysPerMonth} onChange={setDaysPerMonth} max={31} />
                        </div>
                    </div>

                    <div className="mt-6 border-y border-white/10 py-4">
                        <p className="text-xs font-medium uppercase text-tertiary">{content.estimateLabel}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                            {estimatedExecutions.toLocaleString(formatterLocale)} {suffix}
                        </p>
                        {rawEstimate !== estimatedExecutions && <p className="mt-1 text-xs text-tertiary">{rangeNote}</p>}
                    </div>

                    <DialogFooter className="mt-5">
                        <DialogClose asChild>
                            <Button type="button" variant="normal">
                                {content.cancelLabel}
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="button" variant="filled" onClick={() => onApply(estimatedExecutions)} className="gap-2">
                                <IconCheck size={17} />
                                {content.applyLabel}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}

interface CalculatorInputProps {
    label: string
    value: number
    onChange: (value: number) => void
    max?: number
}

function CalculatorInput({ label, value, onChange, max }: CalculatorInputProps) {
    return (
        <label className="flex min-w-0 flex-col gap-2 text-xs font-medium text-secondary">
            <span>{label}</span>
            <input
                type="number"
                min={1}
                max={max}
                step={1}
                value={value}
                onChange={(event) => {
                    const nextValue = Number(event.currentTarget.value)
                    onChange(Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(1, Number.isFinite(nextValue) ? nextValue : 1)))
                }}
                className="h-11 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 text-base tabular-nums text-white outline-none transition-colors focus:border-white/30"
            />
        </label>
    )
}
