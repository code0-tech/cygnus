import { getCountryOptions, normalizeCountrySearchValue, type CountryOption } from "@/lib/checkout/countries"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { TextInput, type InputSuggestion } from "@code0-tech/pictor"
import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import * as FlagIcons from "country-flag-icons/react/3x2"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react"

interface CountryPickerProps {
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

function CountryMenuWidth({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
    const markerRef = useRef<HTMLSpanElement>(null)

    useLayoutEffect(() => {
        const input = inputRef.current
        const menu = markerRef.current?.closest<HTMLElement>(".menu__content")

        if (!input || !menu) return

        const inputContainer = input.closest<HTMLElement>(".input") ?? input
        const updateWidth = () => {
            const width = inputContainer.getBoundingClientRect().width
            const menuWidth = `${width}px`

            menu.style.setProperty("width", menuWidth, "important")
            menu.style.setProperty("min-width", menuWidth, "important")
            menu.style.setProperty("max-width", menuWidth, "important")
            menu.style.setProperty("overflow", "hidden", "important")
            menu.style.setProperty("border-radius", "1rem", "important")

            menu.querySelectorAll<HTMLElement>(".card, .scroll-area, .scroll-area__viewport, .scroll-area__viewport > div, .menu__item").forEach((element) => {
                element.style.setProperty("box-sizing", "border-box", "important")
                element.style.setProperty("width", "100%", "important")
                element.style.setProperty("min-width", "0", "important")
                element.style.setProperty("max-width", "100%", "important")
            })

            menu.querySelectorAll<HTMLElement>(".scroll-area__viewport > div").forEach((element) => {
                element.style.setProperty("display", "block", "important")
            })
        }

        updateWidth()
        const resizeObserver = new ResizeObserver(updateWidth)
        resizeObserver.observe(inputContainer)
        const mutationObserver = new MutationObserver(updateWidth)
        mutationObserver.observe(menu, { childList: true, subtree: true })

        return () => {
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [inputRef])

    return <span ref={markerRef} className="hidden" aria-hidden="true" />
}

export function CountryPicker({ errorMessage, label, locale, onValueChange, placeholder, required, value }: CountryPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const options = useMemo(() => getCountryOptions(locale), [locale])
    const selectedCountry = options.find((country) => country.value === value) ?? null
    const [inputValue, setInputValue] = useState(selectedCountry?.label ?? "")
    const normalizedQuery = normalizeCountrySearchValue(inputValue.trim())

    const visibleOptions = useMemo(() => {
        if (!normalizedQuery || normalizeCountrySearchValue(selectedCountry?.label ?? "") === normalizedQuery) return options

        return options.filter((country) => country.searchValue.includes(normalizedQuery))
    }, [normalizedQuery, options, selectedCountry?.label])

    const emptyLabel = locale === "de" ? "Kein Land gefunden." : "No country found."
    const suggestions = useMemo<InputSuggestion[]>(
        () =>
            visibleOptions.map((country) => ({
                value: country.label,
                valueData: country,
                children: (
                    <span
                        style={{
                            boxSizing: "border-box",
                            display: "grid",
                            gridTemplateColumns: "1.25rem minmax(0, 1fr) 1rem",
                            width: "100%",
                        }}
                        className="min-w-0 gap-2 items-center"
                    >
                        <CountryFlag countryCode={country.value} />
                        <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{country.label}</span>
                        <IconCheck size={14} className={selectedCountry?.value === country.value ? "justify-self-end text-brand" : "justify-self-end opacity-0"} />
                    </span>
                ),
            })),
        [selectedCountry?.value, visibleOptions]
    )

    useEffect(() => {
        if (selectedCountry) {
            setInputValue(selectedCountry.label)
        }
    }, [selectedCountry])

    return (
        <TextInput
            ref={inputRef}
            title={label}
            placeholder={placeholder}
            required={required}
            value={inputValue}
            suggestions={suggestions}
            suggestionsHeader={<CountryMenuWidth inputRef={inputRef} />}
            suggestionsEmptyState={<span className="block px-3 py-3 text-center text-xs text-tertiary">{emptyLabel}</span>}
            left={selectedCountry && normalizeCountrySearchValue(selectedCountry.label) === normalizedQuery ? <CountryFlag countryCode={selectedCountry.value} className="-mr-2" /> : undefined}
            leftType="icon"
            right={<IconChevronDown size={16} className="text-tertiary" />}
            rightType="icon"
            formValidation={{
                valid: !errorMessage,
                notValidMessage: errorMessage,
            }}
            onChange={(event) => {
                const nextValue = event.currentTarget.value
                setInputValue(nextValue)

                if (value && normalizeCountrySearchValue(selectedCountry?.label ?? "") !== normalizeCountrySearchValue(nextValue)) {
                    onValueChange("")
                }
            }}
            onSuggestionSelect={(suggestion) => {
                const country = suggestion.valueData as CountryOption
                setInputValue(country.label)
                onValueChange(country.value)
            }}
            className="w-full!"
        />
    )
}
