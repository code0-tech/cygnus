"use client"

import { cn } from "@/lib/utils"
import { DataTable, DataTableColumn } from "@code0-tech/pictor"
import { Fragment, type ReactNode } from "react"

const SKELETON_ROWS = [{ id: "skeleton-1" }, { id: "skeleton-2" }, { id: "skeleton-3" }]

export function LicenseDataTableSkeleton({ cellHeight = "h-4.5", header, widths }: { cellHeight?: string; header: ReactNode; widths: string[] }) {
    return (
        <DataTable data={SKELETON_ROWS} aria-busy="true">
            {header}
            {(row) => (
                <Fragment key={row.id}>
                    {widths.map((width, index) => (
                        <DataTableColumn key={index}>
                            <span aria-hidden="true" className={cn("flex items-center", cellHeight)}>
                                <span className={cn("block h-3 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none", width)} />
                            </span>
                        </DataTableColumn>
                    ))}
                </Fragment>
            )}
        </DataTable>
    )
}
