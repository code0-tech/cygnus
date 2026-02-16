import { ReactNode } from "react"

interface BentoGridProps {
    children: ReactNode
    columns?: number
}

export function BentoGrid({ children, columns = 5 }: BentoGridProps) {
    return (
        <div className={`w-full h-[200dvh] md:h-dvh grid grid-cols-1 md:grid-cols-${columns} gap-4 grid-rows-auto p-4 py-16`}>
            {children}
        </div>
    )
}
