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
} from "@code0-tech/pictor"
import { Slider } from "@/components/ui/Slider"
import { IconCheck, IconChevronDown, IconSearch, IconX } from "@tabler/icons-react"
import { type ReactNode, useEffect, useState } from "react"

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
    centerLabelSuffix?: string
    onApply: (value: number) => void
}

function clampToStep(value: number, min: number, max: number, step: number) {
    const safeStep = Math.max(step, 1)
    const steppedValue = Math.round((value - min) / safeStep) * safeStep + min
    return Math.min(max, Math.max(min, steppedValue))
}

export function WorkflowCalculatorDialog({ locale, content, businessTypeIcons, value, min, max, step, suffix, centerLabelSuffix, onApply }: WorkflowCalculatorDialogProps) {
    const [businessTypeMenuOpen, setBusinessTypeMenuOpen] = useState(false)
    const [selectedBusinessTypeIndex, setSelectedBusinessTypeIndex] = useState(0)
    const [runsPerDay, setRunsPerDay] = useState(value)
    const selectedBusinessType = content.businessTypes[selectedBusinessTypeIndex] ?? content.businessTypes[0]
    const rawEstimate = runsPerDay * (selectedBusinessType?.conversion_rate ?? 1)
    const estimatedExecutions = Math.max(0, Math.round(rawEstimate))
    const applicableExecutions = clampToStep(estimatedExecutions, min, max, step)
    const formatterLocale = locale === "de" ? "de-DE" : "en-US"
    const unit = selectedBusinessType?.conversion_unit
    const unitLabel = unit ? `${unit.charAt(0).toUpperCase()}${unit.slice(1)} per month` : content.runsPerDayLabel

    useEffect(() => {
        setRunsPerDay(value)
    }, [value])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="none"
                    className="group/link relative h-auto! min-w-0 shrink-0 rounded-none! border-0! bg-transparent! px-0! py-0! text-sm! tracking-normal text-tertiary shadow-none! transition-colors hover:border-transparent! hover:bg-transparent! hover:text-brand! hover:shadow-none! focus:border-transparent! focus:bg-transparent! focus:shadow-none! **:transition-colors hover:**:text-brand! after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-out hover:after:w-full"
                    aria-label={content.title}
                >
                    <span className="flex min-w-0 items-center gap-1 truncate">{content.triggerLabel}</span>
                </Button>
            </DialogTrigger>

            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border border-white/5 bg-primary! p-4! sm:p-6!">
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

                    <div className="grid gap-8 py-6">
                        <div className="flex flex-col gap-2 text-xs font-medium text-secondary">
                            <span>{content.businessTypeLabel}</span>
                            <Menu modal={false} open={businessTypeMenuOpen} onOpenChange={setBusinessTypeMenuOpen}>
                                <MenuTrigger asChild>
                                    <Button className="w-full! justify-between">
                                        <span className="flex min-w-0 flex-1 items-center gap-2">
                                            <span className="shrink-0 text-tertiary">{businessTypeIcons[selectedBusinessTypeIndex]}</span>
                                            <span className="truncate">{selectedBusinessType?.name}</span>
                                        </span>
                                        <IconChevronDown size={16} className="ml-auto shrink-0" />
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

                        <div className="min-w-0 pb-2">
                            <Slider
                                min={min}
                                max={max}
                                step={step}
                                value={runsPerDay}
                                onChange={setRunsPerDay}
                                ariaLabel={unitLabel}
                                valueLabelSuffix={unit}
                                centerLabelSuffix={centerLabelSuffix}
                                lines={40}
                            />
                        </div>
                    </div>

                    <DialogFooter className="grid! grid-cols-[minmax(0,1fr)_auto]! items-end! gap-4! pt-4!">
                        <div className="min-w-0 text-left">
                            <p className="text-sm font-medium text-tertiary">{content.estimateLabel}</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                                {estimatedExecutions.toLocaleString(formatterLocale)} {suffix}
                            </p>
                        </div>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="filled"
                                onClick={() => onApply(applicableExecutions)}
                                className="justify-self-end bg-white/80! text-primary! hover:bg-white! transition-colors"
                            >
                                {content.applyLabel}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
