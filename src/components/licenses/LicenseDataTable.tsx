import { cn } from "@/lib/utils"
import { ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@code0-tech/pictor"
import { Children, isValidElement, type HTMLAttributes, type Key, type ReactElement, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react"

type RowRenderer<T> = (item: T, index: number) => ReactNode

interface LicenseDataTableProps<T> extends Omit<HTMLAttributes<HTMLTableElement>, "children"> {
    children: ReactNode | RowRenderer<T> | Array<ReactNode | RowRenderer<T>>
    data: T[]
    emptyComponent?: ReactNode
    loading?: boolean
    onRowClick?: (item: T) => void
    rowKey: (item: T) => Key
}

export function LicenseDataTable<T>({ children, className, data, emptyComponent, loading = false, onRowClick, rowKey, style, ...props }: LicenseDataTableProps<T>) {
    const childArray = Array.isArray(children) ? children : [children]
    const rowRenderer = childArray.find((child): child is RowRenderer<T> => typeof child === "function")
    const tableContent = childArray.filter((child): child is ReactNode => typeof child !== "function")
    const header = tableContent.find((child) => isValidElement(child)) as ReactElement<{ children?: ReactNode }> | undefined
    const columnCount = Math.max(1, Children.count(header?.props.children))

    return (
        <ScrollArea type="always" className="w-full min-w-0 max-w-full overflow-hidden [contain:inline-size]" style={{ width: "100%", maxWidth: "100%" }}>
            <ScrollAreaViewport className="w-full max-w-full">
                <table {...props} className={cn("w-full border-separate border-spacing-0", className)} style={{ minWidth: `${Math.max(28, columnCount * 7)}rem`, ...style }}>
                    {tableContent}
                    <tbody>
                        {loading
                            ? Array.from({ length: 3 }, (_, rowIndex) => (
                                  <tr key={`loading-${rowIndex}`} aria-hidden="true">
                                      {Array.from({ length: columnCount }, (_, columnIndex) => (
                                          <td key={columnIndex} className="border-y border-white/10 px-0 py-[0.7rem] last:w-px last:whitespace-nowrap">
                                              <span
                                                  className={`block h-3 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none ${
                                                      columnIndex === 0 ? "w-28" : columnIndex === columnCount - 1 ? "w-12" : "w-20"
                                                  }`}
                                              />
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : data.map((item, index) => (
                                  <tr
                                      key={rowKey(item)}
                                      tabIndex={onRowClick ? 0 : undefined}
                                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                                      onKeyDown={
                                          onRowClick
                                              ? (event) => {
                                                    if (event.key !== "Enter" && event.key !== " ") return
                                                    event.preventDefault()
                                                    onRowClick(item)
                                                }
                                              : undefined
                                      }
                                      className={`transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${onRowClick ? "cursor-pointer" : ""}`}
                                  >
                                      {rowRenderer?.(item, index)}
                                  </tr>
                              ))}
                        {!loading && data.length === 0 && emptyComponent ? <tr>{emptyComponent}</tr> : null}
                    </tbody>
                </table>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="horizontal" className="mx-1 mt-2 h-1.5! rounded-full">
                <ScrollAreaThumb />
            </ScrollAreaScrollbar>
        </ScrollArea>
    )
}

export function LicenseDataTableHeader({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead {...props}>
            <tr>{children}</tr>
        </thead>
    )
}

export function LicenseDataTableHeaderColumn({ children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th {...props} className="border-b border-white/10 px-0 py-[0.7rem] text-left last:w-px last:whitespace-nowrap">
            {children}
        </th>
    )
}

export function LicenseDataTableColumn({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td {...props} className="border-y border-white/10 px-0 py-[0.7rem] last:w-px last:whitespace-nowrap">
            {children}
        </td>
    )
}
