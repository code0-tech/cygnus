import { getCountryOptions, normalizeCountrySearchValue } from "@/lib/checkout/countries"
import type { AppLocale } from "@/lib/i18n"
import {
    Button,
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
    Menu,
    MenuContent,
    MenuTrigger,
    ScrollArea,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
} from "@code0-tech/pictor"
import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react"
import * as FlagIcons from "country-flag-icons/react/3x2"
import { useId, useMemo, useRef, useState } from "react"

interface CountryPickerProps {
    errorMessage?: string | null
    label: string
    locale: AppLocale
    onValueChange: (countryCode: string) => void
    placeholder: string
    required?: boolean
    value: string
}

function CountryFlag({ countryCode }: { countryCode: string }) {
    const FlagIcon = FlagIcons[countryCode as keyof typeof FlagIcons]

    if (!FlagIcon) return null

    return <FlagIcon aria-hidden="true" className="h-3.5 w-5 shrink-0 rounded-[2px]" />
}

export function CountryPicker({ errorMessage, label, locale, onValueChange, placeholder, required, value }: CountryPickerProps) {
    const inputId = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(false)
    const [menuWidth, setMenuWidth] = useState<number>()
    const [searchQuery, setSearchQuery] = useState("")
    const options = useMemo(() => getCountryOptions(locale), [locale])
    const visibleOptions = useMemo(() => {
        const normalizedQuery = normalizeCountrySearchValue(searchQuery.trim())

        if (!normalizedQuery) return options

        return options.filter((country) => country.searchValue.includes(normalizedQuery))
    }, [options, searchQuery])
    const selectedCountry = options.find((country) => country.value === value) ?? null
    const emptyLabel = locale === "de" ? "Kein Land gefunden." : "No country found."
    const searchPlaceholder = locale === "de" ? "Land suchen..." : "Search country..."
    const listHeight = visibleOptions.length === 0 ? 64 : Math.min(288, visibleOptions.length * 32 + 8)
    const commandContentWidth = menuWidth ? `calc(${menuWidth}px - 1.4rem)` : undefined

    return (
        <div className="min-w-0">
            <label id={`${inputId}-label`} className="block text-[11px] font-medium uppercase text-tertiary">
                {label}
            </label>
            <Menu
                modal={false}
                open={open}
                onOpenChange={(nextOpen) => {
                    if (nextOpen) {
                        const triggerWidth = triggerRef.current?.getBoundingClientRect().width
                        setMenuWidth(triggerWidth ? Math.min(triggerWidth, document.documentElement.clientWidth - 32) : undefined)
                    } else {
                        setSearchQuery("")
                    }

                    setOpen(nextOpen)
                }}
            >
                <MenuTrigger asChild>
                    <Button
                        ref={triggerRef}
                        id={inputId}
                        type="button"
                        aria-labelledby={`${inputId}-label ${inputId}`}
                        aria-invalid={Boolean(errorMessage)}
                        aria-required={required}
                        className={`h-10! w-full! justify-between px-4! text-sm! font-normal! ${errorMessage ? "border-error/60! ring-error/30!" : ""}`}
                    >
                        <span className={selectedCountry ? "flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-white" : "min-w-0 flex-1 truncate text-tertiary"}>
                            {selectedCountry && <CountryFlag countryCode={selectedCountry.value} />}
                            <span className="truncate">{selectedCountry?.label ?? placeholder}</span>
                        </span>
                        <span className="ml-auto flex shrink-0 items-center text-tertiary">
                            <IconChevronDown size={16} />
                        </span>
                    </Button>
                </MenuTrigger>
                <MenuContent
                    align="start"
                    sideOffset={6}
                    style={menuWidth ? { width: menuWidth, minWidth: menuWidth, maxWidth: menuWidth } : undefined}
                    className="max-w-[calc(100vw-2rem)]! overflow-hidden! p-0!"
                >
                    <Command
                        shouldFilter={false}
                        style={menuWidth ? { width: menuWidth, minWidth: menuWidth, maxWidth: menuWidth } : undefined}
                        className="min-w-0! overflow-hidden!"
                    >
                        <CommandInput
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            left={<IconSearch size={14} />}
                        />
                        <ScrollArea
                            type="auto"
                            style={{
                                height: listHeight,
                                width: commandContentWidth,
                                minWidth: commandContentWidth,
                                maxWidth: commandContentWidth,
                            }}
                            className="min-w-0!"
                        >
                            <ScrollAreaViewport
                                style={{ width: commandContentWidth, minWidth: commandContentWidth, maxWidth: commandContentWidth }}
                                className="h-full! min-w-0! [&>div]:block! [&>div]:w-full! [&>div]:min-w-0! [&>div]:max-w-full!"
                            >
                                <CommandList
                                    style={{
                                        boxSizing: "border-box",
                                        display: "block",
                                        width: commandContentWidth,
                                        minWidth: commandContentWidth,
                                        maxWidth: commandContentWidth,
                                    }}
                                    className="overflow-visible!"
                                >
                                    <CommandEmpty>{emptyLabel}</CommandEmpty>
                                    {visibleOptions.map((country) => (
                                        <CommandItem
                                            key={country.value}
                                            value={country.value}
                                            onSelect={() => {
                                                onValueChange(country.value)
                                                setOpen(false)
                                            }}
                                            style={{
                                                boxSizing: "border-box",
                                                display: "grid",
                                                gridTemplateColumns: "1.25rem minmax(0, 1fr) 1rem",
                                                width: commandContentWidth,
                                                minWidth: commandContentWidth,
                                                maxWidth: commandContentWidth,
                                            }}
                                            className="items-center overflow-hidden!"
                                        >
                                            <CountryFlag countryCode={country.value} />
                                            <span className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{country.label}</span>
                                            <IconCheck size={14} className={selectedCountry?.value === country.value ? "justify-self-end text-brand" : "justify-self-end opacity-0"} />
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </ScrollAreaViewport>
                            <ScrollAreaScrollbar orientation="vertical" className="w-1.5! p-px">
                                <ScrollAreaThumb className="bg-white/15! transition-colors! hover:bg-white/25!" />
                            </ScrollAreaScrollbar>
                        </ScrollArea>
                    </Command>
                </MenuContent>
            </Menu>
            {errorMessage && <p className="mt-1.5 text-xs text-error">{errorMessage}</p>}
        </div>
    )
}
