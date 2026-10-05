import { cn } from "@/lib/utils"

export function getLicenseDetailGridCellClassName(index: number, className?: string) {
    return cn(
        "relative min-w-0 px-6 py-5",
        "before:absolute before:inset-y-5 before:left-0 before:hidden before:w-px before:bg-white/10",
        "after:absolute after:inset-x-6 after:top-0 after:hidden after:h-px after:bg-white/10",
        index > 0 && "after:block",
        index === 1 && "sm:after:hidden",
        (index === 1 || index === 3) && "sm:before:block",
        index > 0 && "xl:before:block xl:after:hidden",
        className
    )
}
