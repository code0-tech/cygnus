import { ReactNode } from "react"

interface BentoGridProps {
    children: ReactNode
    columns?: number
}

export function BentoGrid({ children, columns = 5 }: BentoGridProps) {
    const colClass = {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    }[columns] ?? "md:grid-cols-5"

    return (
        <div className={`w-full h-[200dvh] md:h-dvh grid grid-cols-1 ${colClass} gap-4 grid-rows-auto p-4 py-16`}>
            {children}
        </div>
    )
}
