"use client"

import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    NumberInput,
} from "@code0-tech/pictor"
import { IconCalculator, IconCheck, IconChevronDown, IconX } from "@tabler/icons-react"
import { type MouseEvent, useId, useState } from "react"

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
    const [runsPerDay, setRunsPerDay] = useState(10)
    const selectedBusinessType = content.businessTypes[selectedBusinessTypeIndex] ?? content.businessTypes[0]
    const rawEstimate = runsPerDay * (selectedBusinessType?.conversion_rate ?? 1)
    const estimatedExecutions = Math.max(0, Math.round(rawEstimate))
    const applicableExecutions = clampToStep(estimatedExecutions, min, max, step)
    const formatterLocale = locale === "de" ? "de-DE" : "en-US"

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
                <DialogContent className="border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="text-white!">{content.title}</DialogTitle>
                        <DialogDescription className="text-secondary!">{content.description}</DialogDescription>
                    </DialogHeader>

                    <div className="absolute right-4 top-4 z-10">
                        <DialogClose asChild>
                            <Button type="button" variant="none" className="size-9! p-0! text-secondary hover:text-white" aria-label={content.closeLabel}>
                                <IconX size={18} />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="py-4 grid gap-4">
                        <div className="flex flex-col gap-2 text-xs font-medium text-secondary">
                            <span>{content.businessTypeLabel}</span>
                            <Menu modal={false}>
                                <MenuTrigger asChild>
                                    <Button className="w-full! justify-between">
                                        {selectedBusinessType?.name}
                                        <IconChevronDown size={16} />
                                    </Button>
                                </MenuTrigger>
                                <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    {content.businessTypes.map((businessType, index) => (
                                        <MenuItem key={businessType.id ?? `${businessType.name}-${index}`} onClick={() => setSelectedBusinessTypeIndex(index)}>
                                            {businessType.name}
                                        </MenuItem>
                                    ))}
                                </MenuContent>
                            </Menu>
                        </div>

                        <CalculatorInput label={content.runsPerDayLabel} value={runsPerDay} onChange={setRunsPerDay} />
                    </div>

                    <div className="py-4">
                        <p className="text-xs font-medium uppercase text-tertiary">{content.estimateLabel}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                            {estimatedExecutions.toLocaleString(formatterLocale)} {suffix}
                        </p>
                        <p className="mt-1 text-xs text-tertiary">{content.rangeNote.replace("{min}", min.toLocaleString(formatterLocale)).replace("{max}", max.toLocaleString(formatterLocale))}</p>
                    </div>

                    <DialogFooter className="">
                        <DialogClose asChild>
                            <Button type="button" variant="normal">
                                {content.cancelLabel}
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="button" variant="filled" onClick={() => onApply(applicableExecutions)} className="gap-2 bg-white/80! text-primary! hover:bg-white! transition-colors">
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
    const inputId = useId()
    const clampValue = (nextValue: number) => Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(1, Number.isFinite(nextValue) ? nextValue : 1))
    const updateValue = (rawValue: string) => onChange(clampValue(Number(rawValue)))

    const handleStepperClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!(event.target instanceof Element)) return

        const button = event.target.closest("button")
        if (!button) return

        const direction = button.closest(".input__left") ? -1 : button.closest(".input__right") ? 1 : 0
        if (!direction) return

        event.preventDefault()
        event.stopPropagation()
        onChange(clampValue(value + direction))
    }

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor={inputId} className="text-xs font-medium text-secondary">
                {label}
            </label>
            <div onClickCapture={handleStepperClick}>
                <NumberInput
                    id={inputId}
                    min={1}
                    max={max}
                    step={1}
                    value={String(value)}
                    onChange={(event) => updateValue(event.currentTarget.value)}
                    onInput={(event) => updateValue(event.currentTarget.value)}
                    className="w-full"
                />
            </div>
        </div>
    )
}
