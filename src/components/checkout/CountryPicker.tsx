import { getCountryOptions, normalizeCountrySearchValue } from "@/lib/checkout/countries"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Menu, MenuContent, MenuItem, MenuTrigger, TextInput } from "@code0-tech/pictor"
import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import * as FlagIcons from "country-flag-icons/react/3x2"
import { useEffect, useMemo, useRef, useState } from "react"

interface CountryPickerProps {
    emptyLabel: string
    errorMessage?: string | null
    label: string
    locale: AppLocale
    onValueChange: (countryCode: string) => void
    placeholder: string
    required?: boolean
    value: string
}

function CountryFlag({ countryCode, className }: { countryCode: string; className?: string }) {
    const FlagIcon = FlagIcons[countryCode as keyof typeof FlagIcons]
    if (!FlagIcon) return null

    return <FlagIcon aria-hidden="true" className={cn("h-3.5 w-5 shrink-0 rounded-xs", className)} />
}

export function CountryPicker({ emptyLabel, errorMessage, label, locale, onValueChange, placeholder, required, value }: CountryPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const options = useMemo(() => getCountryOptions(locale), [locale])
    const selectedCountry = options.find((country) => country.value === value) ?? null
    const [inputValue, setInputValue] = useState(selectedCountry?.label ?? "")
    const normalizedQuery = normalizeCountrySearchValue(inputValue.trim())
    const selectedCountryIsDisplayed = Boolean(selectedCountry && normalizeCountrySearchValue(selectedCountry.label) === normalizedQuery)

    const visibleOptions = useMemo(() => {
        if (!normalizedQuery || selectedCountryIsDisplayed) return options

        return options.filter((country) => country.searchValue.includes(normalizedQuery))
    }, [normalizedQuery, options, selectedCountryIsDisplayed])

    useEffect(() => {
        setInputValue(selectedCountry?.label ?? "")
    }, [selectedCountry?.label])

    useEffect(() => {
        if (!open) return

        requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    }, [open])

    return (
        <div className="min-w-0">
            <label className="input__label">{label}</label>
            <Menu modal={false} open={open} onOpenChange={setOpen}>
                <MenuTrigger asChild>
                    <div className="w-full">
                        <TextInput
                            ref={inputRef}
                            aria-label={label}
                            autoComplete="off"
                            placeholder={placeholder}
                            required={required}
                            value={inputValue}
                            left={selectedCountryIsDisplayed && selectedCountry ? <CountryFlag countryCode={selectedCountry.value} className="-mr-1" /> : undefined}
                            leftType="icon"
                            right={<IconChevronDown size={16} className={cn("text-tertiary transition-transform", open && "rotate-180")} />}
                            rightType="icon"
                            formValidation={{
                                valid: !errorMessage,
                                notValidMessage: errorMessage,
                            }}
                            onFocus={() => setOpen(true)}
                            onPointerDown={(event) => {
                                event.stopPropagation()
                                setOpen(true)
                            }}
                            onChange={(event) => {
                                const nextValue = event.currentTarget.value
                                setInputValue(nextValue)
                                setOpen(true)

                                if (value && normalizeCountrySearchValue(selectedCountry?.label ?? "") !== normalizeCountrySearchValue(nextValue)) {
                                    onValueChange("")
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    setOpen(false)
                                }
                            }}
                            className="w-full!"
                        />
                    </div>
                </MenuTrigger>

                <MenuContent
                    align="start"
                    sideOffset={6}
                    onCloseAutoFocus={(event) => event.preventDefault()}
                    onFocusOutside={(event) => {
                        if (event.target === inputRef.current) {
                            event.preventDefault()
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (event.target === inputRef.current) {
                            event.preventDefault()
                        }
                    }}
                    className="max-h-72! w-(--radix-dropdown-menu-trigger-width)! min-w-(--radix-dropdown-menu-trigger-width)! max-w-(--radix-dropdown-menu-trigger-width)! overflow-hidden! p-1! [&>.scroll-area]:w-full! [&>.scroll-area]:min-w-0! [&_.scroll-area__viewport]:w-full! [&_.scroll-area__viewport>div]:block! [&_.scroll-area__viewport>div]:w-full! [&_.scroll-area__viewport>div>div]:w-full!"
                >
                    <div className="w-full min-w-0 max-w-full">
                        {visibleOptions.length === 0 ? (
                            <span className="block w-full px-3 py-3 text-center text-xs text-tertiary">{emptyLabel}</span>
                        ) : (
                            visibleOptions.map((country) => (
                                <MenuItem
                                    key={country.value}
                                    onSelect={() => {
                                        setInputValue(country.label)
                                        onValueChange(country.value)
                                        setOpen(false)
                                    }}
                                    className="grid! w-full! min-w-0! max-w-full! grid-cols-[1.25rem_minmax(0,1fr)_1rem] items-center gap-2 overflow-hidden!"
                                >
                                    <CountryFlag countryCode={country.value} />
                                    <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{country.label}</span>
                                    <IconCheck size={14} className={selectedCountry?.value === country.value ? "justify-self-end text-brand" : "justify-self-end opacity-0"} />
                                </MenuItem>
                            ))
                        )}
                    </div>
                </MenuContent>
            </Menu>
        </div>
    )
}
