import { ActionIcon } from "@/components/actions/ActionIcon"
import type { ExtractedFlowType, ExtractedFunctionDefinition } from "@/lib/actionExtraction"
import { cn } from "@/lib/utils"
import { IconBolt, IconChevronDown } from "@tabler/icons-react"

type ActionDefinition = ExtractedFlowType | ExtractedFunctionDefinition

const HOUSE_INNER = "bg-white/5 shadow-[inset_0_1px_1px_#bfbfbf1a]"

/**
 * Native <details> accordion, so it renders on the server. `name` makes the group exclusive (one open at a time);
 * the height animation uses ::details-content and is skipped by browsers that don't support it.
 */
const DETAILS_ANIMATION =
    "[interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-hidden [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-300 [&::details-content]:ease-out [&::details-content]:[transition-behavior:allow-discrete] open:[&::details-content]:h-auto"

/** Rows shown before the "show all" toggle. */
const INITIAL_VISIBLE_COUNT = 5

/**
 * Accordion list for an action's events (flow types) or functions (function definitions).
 * Rows beyond the first five are revealed by a visually hidden checkbox + label at the end of the list (CSS only, so
 * this stays a server component); the label switches between "show all" and "show less".
 */
export function ActionDefinitionAccordion({
    items,
    name,
    entriesLabel,
    showAllLabel,
    showLessLabel,
}: {
    items: ActionDefinition[]
    name: string
    entriesLabel: string
    showAllLabel: string
    showLessLabel: string
}) {
    const visibleItems = items.slice(0, INITIAL_VISIBLE_COUNT)
    const hiddenItems = items.slice(INITIAL_VISIBLE_COUNT)
    const toggleId = `${name}-show-all`
    const regionId = `${name}-more`
    const renderRow = (item: ActionDefinition) => <DefinitionRow key={item.id} item={item} name={name} entriesLabel={entriesLabel} className="border-t border-white/5 first:border-t-0" />

    return (
        <div className="group/list flex flex-col overflow-hidden rounded-3xl bg-light shadow-[inset_0_1px_1px_#bfbfbf1a]">
            {visibleItems.map(renderRow)}
            {hiddenItems.length > 0 && (
                <>
                    {/* group-has-[.show-all-toggle:checked]/list = "show all" is active (classes must stay literal for Tailwind) */}
                    <div
                        id={regionId}
                        className="invisible grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-500 ease-out group-has-[.show-all-toggle:checked]/list:visible group-has-[.show-all-toggle:checked]/list:grid-rows-[1fr]"
                    >
                        <div className="min-h-0 overflow-hidden">{hiddenItems.map((item) => <DefinitionRow key={item.id} item={item} name={name} entriesLabel={entriesLabel} className="border-t border-white/5" />)}</div>
                    </div>
                    <input id={toggleId} type="checkbox" aria-controls={regionId} className="show-all-toggle peer sr-only" />
                    <label
                        htmlFor={toggleId}
                        className="flex cursor-pointer items-center justify-center gap-2 border-t border-white/5 px-5 py-3.5 text-sm font-medium text-secondary transition-colors select-none hover:bg-white/2 hover:text-white peer-focus-visible:bg-white/4 peer-focus-visible:text-white"
                    >
                        <span className="group-has-[.show-all-toggle:checked]/list:hidden">{showAllLabel}</span>
                        <span className="hidden group-has-[.show-all-toggle:checked]/list:inline">{showLessLabel}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums text-tertiary", HOUSE_INNER, "group-has-[.show-all-toggle:checked]/list:hidden")}>{items.length}</span>
                        <IconChevronDown size={16} className={cn("text-tertiary transition-transform duration-300", "group-has-[.show-all-toggle:checked]/list:rotate-180")} />
                    </label>
                </>
            )}
        </div>
    )
}

function DefinitionRow({ item, name, entriesLabel, className }: { item: ActionDefinition; name: string; entriesLabel: string; className?: string }) {
    const description = item.description || item.displayMessage
    const entries = item.kind === "flowType" ? item.settings : item.parameters

    return (
        <details name={name} className={cn("group", DETAILS_ANIMATION, className)}>
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition-colors hover:bg-white/2 [&::-webkit-details-marker]:hidden">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-secondary", HOUSE_INNER)}>
                    {item.displayIcon ? <ActionIcon icon={item.displayIcon} size={20} /> : <IconBolt size={20} />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-white">{item.name || item.identifier}</span>
                    <code className="truncate font-mono text-xs text-tertiary">{item.identifier}</code>
                </div>
                <IconChevronDown size={16} className="shrink-0 text-tertiary transition-transform duration-300 group-open:rotate-180" />
            </summary>

            <div className="flex flex-col gap-4 px-5 pb-5 pl-19">
                {description && <p className="text-sm leading-6 text-secondary">{description}</p>}
                {(item.signature || entries.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {item.signature && <code className={cn("rounded-lg px-2 py-1 font-mono text-xs text-secondary", HOUSE_INNER)}>{item.signature}</code>}
                        {entries.length > 0 && (
                            <span className={cn("rounded-full px-2.5 py-1 text-xs text-secondary", HOUSE_INNER)}>
                                {entries.length} {entriesLabel}
                            </span>
                        )}
                    </div>
                )}
                {entries.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium tracking-wide text-tertiary uppercase">{entriesLabel}</span>
                        <ul className="flex flex-col gap-1.5">
                            {entries.map((entry) => (
                                <li key={entry.id} className="text-sm leading-5">
                                    <span className="font-medium text-white">{entry.name || entry.identifier}</span>
                                    {entry.description && <span className="text-secondary"> — {entry.description}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </details>
    )
}
