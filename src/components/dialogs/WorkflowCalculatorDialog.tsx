"use client"

import {
    Button,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
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
    MenuTrigger,
    NumberInput,
} from "@code0-tech/pictor"
import { IconCalculator, IconCheck, IconChevronDown, IconSearch, IconX } from "@tabler/icons-react"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"

interface WorkflowCalculatorContent {
    triggerLabel: string
    title: string
    description: string
    closeLabel: string
    businessTypeLabel: string
    businessTypeSearchPlaceholder: string
    noBusinessTypesFoundLabel: string
    activeWorkflowsLabel: string
    runsPerDayLabel: string
    daysPerMonthLabel: string
    estimateLabel: string
    cancelLabel: string
    applyLabel: string
    businessTypes: {
        name: string
        conversion_rate: number
        conversion_unit: string
        icon: string
        id?: string | null
    }[]
}

interface WorkflowCalculatorDialogProps {
    locale: string
    content: WorkflowCalculatorContent
    businessTypeIcons: ReactNode[]
    value: number
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

export function WorkflowCalculatorDialog({ locale, content, businessTypeIcons, value, min, max, step, suffix, onApply }: WorkflowCalculatorDialogProps) {
    const [businessTypeMenuOpen, setBusinessTypeMenuOpen] = useState(false)
    const [selectedBusinessTypeIndex, setSelectedBusinessTypeIndex] = useState(0)
    const [runsPerDay, setRunsPerDay] = useState(value)
    const selectedBusinessType = content.businessTypes[selectedBusinessTypeIndex] ?? content.businessTypes[0]
    const rawEstimate = runsPerDay * (selectedBusinessType?.conversion_rate ?? 1)
    const estimatedExecutions = Math.max(0, Math.round(rawEstimate))
    const applicableExecutions = clampToStep(estimatedExecutions, min, max, step)
    const formatterLocale = locale === "de" ? "de-DE" : "en-US"

    useEffect(() => {
        setRunsPerDay(value)
    }, [value])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="filled" className="shrink-0 gap-2" aria-label={content.title}>
                    <IconCalculator size={18} />
                    <span className="hidden sm:inline">{content.triggerLabel}</span>
                </Button>
            </DialogTrigger>

            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="text-white!">{content.title}</DialogTitle>
                        <DialogDescription className="text-secondary! text-sm!">{content.description}</DialogDescription>
                    </DialogHeader>

                    <div className="absolute right-4 top-4 z-10">
                        <DialogClose asChild>
                            <Button type="button" variant="none" className="size-9! p-0! text-secondary hover:text-white" aria-label={content.closeLabel}>
                                <IconX size={18} />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="grid gap-4 py-6">
                        <div className="flex flex-col gap-2 text-xs font-medium text-secondary">
                            <span>{content.businessTypeLabel}</span>
                            <Menu modal={false} open={businessTypeMenuOpen} onOpenChange={setBusinessTypeMenuOpen}>
                                <MenuTrigger asChild>
                                    <Button className="w-full! justify-between">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span className="shrink-0 text-tertiary">{businessTypeIcons[selectedBusinessTypeIndex]}</span>
                                            <span className="truncate">{selectedBusinessType?.name}</span>
                                        </span>
                                        <IconChevronDown size={16} />
                                    </Button>
                                </MenuTrigger>
                                <MenuContent className="w-(--radix-dropdown-menu-trigger-width) p-0!">
                                    <Command>
                                        <CommandInput placeholder={content.businessTypeSearchPlaceholder} left={<IconSearch size={14} />} />
                                        <CommandList className="max-h-64">
                                            <CommandEmpty>{content.noBusinessTypesFoundLabel}</CommandEmpty>
                                            <CommandGroup>
                                                {content.businessTypes.map((businessType, index) => (
                                                    <CommandItem
                                                        key={businessType.id ?? `${businessType.name}-${index}`}
                                                        value={`${businessType.name} ${businessType.conversion_unit}`}
                                                        onSelect={() => {
                                                            setSelectedBusinessTypeIndex(index)
                                                            setBusinessTypeMenuOpen(false)
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="shrink-0 text-tertiary">{businessTypeIcons[index]}</span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate">{businessType.name}</span>
                                                            <span className="block truncate text-xs text-tertiary">{businessType.conversion_unit}</span>
                                                        </span>
                                                        {index === selectedBusinessTypeIndex && <IconCheck size={15} className="shrink-0 text-brand" />}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </MenuContent>
                            </Menu>
                        </div>

                        <CalculatorInput label={content.runsPerDayLabel} unit={selectedBusinessType?.conversion_unit} value={runsPerDay} min={min} max={max} onChange={setRunsPerDay} />
                    </div>

                    <DialogFooter className="pt-4! items-end! justify-between!">
                        <div className="">
                            <p className="text-sm font-medium text-tertiary">{content.estimateLabel}</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                                {estimatedExecutions.toLocaleString(formatterLocale)} {suffix}
                            </p>
                        </div>
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
    unit?: string
    value: number
    onChange: (value: number) => void
    min: number
    max: number
}

function CalculatorInput({ label, unit, value, onChange, min, max }: CalculatorInputProps) {
    const inputId = useId()
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const unitLabel = unit ? `${unit.charAt(0).toUpperCase()}${unit.slice(1)} per month` : label
    const clampValue = (nextValue: number) => Math.min(max, Math.max(min, Number.isFinite(nextValue) ? nextValue : min))

    const updateValue = (input: HTMLInputElement) => {
        const rawValue = input.value
        if (rawValue.trim() === "") return

        const nextValue = Number(rawValue)
        if (!Number.isFinite(nextValue)) return

        if (nextValue > max) {
            input.value = String(max)
            onChange(max)
        } else if (nextValue >= min) {
            onChange(nextValue)
        }
    }

    useEffect(() => {
        const input = wrapperRef.current?.querySelector<HTMLInputElement>("input")
        if (input && Number(input.value) !== value) input.value = String(value)
    }, [value])

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor={inputId} className="text-xs font-medium text-secondary">
                {unitLabel}
            </label>
            <div
                ref={wrapperRef}
                className="[&_.input__control]:text-center"
                onInputCapture={(event) => {
                    if (event.target instanceof HTMLInputElement) updateValue(event.target)
                }}
                onBlurCapture={(event) => {
                    if (!(event.target instanceof HTMLInputElement)) return

                    const nextValue = clampValue(Number(event.target.value))
                    event.target.value = String(nextValue)
                    onChange(nextValue)
                }}
                onClick={(event) => {
                    if (!(event.target instanceof Element) || !event.target.closest(".input__left, .input__right")) return

                    const input = event.currentTarget.querySelector<HTMLInputElement>("input")
                    if (!input) return

                    const nextValue = clampValue(Number(input.value))
                    input.value = String(nextValue)
                    onChange(nextValue)
                }}
            >
                <NumberInput id={inputId} min={min} max={max} step={1} defaultValue={String(value)} className="number-input w-full text-center" />
            </div>
        </div>
    )
}
