"use client"

import { Button, ButtonGroup, Menu, MenuContent, MenuItem, MenuLabel, MenuPortal, MenuTrigger } from "@code0-tech/pictor"
import { IconAdjustmentsHorizontal, IconArrowsSort, IconCheck } from "@tabler/icons-react"

export interface DataTableFilterOption {
    label: string
    value: string
}

interface DataTableControlsProps {
    disabled?: boolean
    filterLabel: string
    filterOptions: DataTableFilterOption[]
    onFilterChange: (values: string[]) => void
    onSortDirectionChange: (direction: "asc" | "desc") => void
    selectedFilters: string[]
    sortDirection: "asc" | "desc"
    sortLabel: string
}

export function DataTableControls({ disabled = false, filterLabel, filterOptions, onFilterChange, onSortDirectionChange, selectedFilters, sortDirection, sortLabel }: DataTableControlsProps) {
    const toggleFilter = (value: string) => {
        onFilterChange(selectedFilters.includes(value) ? selectedFilters.filter((selected) => selected !== value) : [...selectedFilters, value])
    }

    return (
        <ButtonGroup className="shrink-0">
            <Menu>
                <MenuTrigger asChild>
                    <Button type="button" variant="none" paddingSize="xxs" active={selectedFilters.length > 0} disabled={disabled} aria-label={filterLabel} title={filterLabel}>
                        <IconAdjustmentsHorizontal aria-hidden="true" size={13} />
                    </Button>
                </MenuTrigger>
                <MenuPortal>
                    <MenuContent align="end" sideOffset={8}>
                        <MenuLabel>{filterLabel}</MenuLabel>
                        {filterOptions.map((option) => (
                            <MenuItem key={option.value} onSelect={() => toggleFilter(option.value)}>
                                <IconCheck aria-hidden="true" size={13} color={selectedFilters.includes(option.value) ? undefined : "transparent"} />
                                {option.label}
                            </MenuItem>
                        ))}
                    </MenuContent>
                </MenuPortal>
            </Menu>

            <Menu>
                <MenuTrigger asChild>
                    <Button type="button" variant="none" paddingSize="xxs" disabled={disabled} aria-label={sortLabel} title={sortLabel}>
                        <IconArrowsSort aria-hidden="true" size={13} />
                    </Button>
                </MenuTrigger>
                <MenuPortal>
                    <MenuContent align="end" sideOffset={8}>
                        <MenuLabel>{sortLabel}</MenuLabel>
                        <MenuItem onSelect={() => onSortDirectionChange("desc")}>
                            <IconCheck aria-hidden="true" size={13} color={sortDirection === "desc" ? undefined : "transparent"} />
                            {`${sortLabel} ↓`}
                        </MenuItem>
                        <MenuItem onSelect={() => onSortDirectionChange("asc")}>
                            <IconCheck aria-hidden="true" size={13} color={sortDirection === "asc" ? undefined : "transparent"} />
                            {`${sortLabel} ↑`}
                        </MenuItem>
                    </MenuContent>
                </MenuPortal>
            </Menu>
        </ButtonGroup>
    )
}
