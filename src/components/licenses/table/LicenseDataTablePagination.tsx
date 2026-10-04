import type { LicenseContent } from "@/lib/cms"
import { Button, DataTableMaxPaginationValue, DataTablePagination, DataTablePaginationBackwardsTrigger, DataTablePaginationForwardTrigger, DataTablePaginationValue, Text } from "@code0-tech/pictor"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

export const LICENSE_DATA_TABLE_PAGE_SIZE = 10

export function LicenseDataTablePagination({ labels }: { labels: LicenseContent["pagination"] }) {
    return (
        <DataTablePagination className="flex items-center justify-end gap-2 pt-2">
            <DataTablePaginationBackwardsTrigger asChild>
                <Button type="button" variant="none" paddingSize="xxs" aria-label={labels.previousPageLabel} className="size-8! justify-center! p-0!">
                    <IconChevronLeft aria-hidden="true" size={16} />
                </Button>
            </DataTablePaginationBackwardsTrigger>
            <Text size="xs" hierarchy="tertiary" className="min-w-12! text-center! tabular-nums">
                <DataTablePaginationValue /> / <DataTableMaxPaginationValue />
            </Text>
            <DataTablePaginationForwardTrigger asChild>
                <Button type="button" variant="none" paddingSize="xxs" aria-label={labels.nextPageLabel} className="size-8! justify-center! p-0!">
                    <IconChevronRight aria-hidden="true" size={16} />
                </Button>
            </DataTablePaginationForwardTrigger>
        </DataTablePagination>
    )
}
