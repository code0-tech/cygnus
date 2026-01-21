import { cn } from "@/utils/cn";
import { ReactNode } from "react";

export function FeatureCard({children, className}: {children: ReactNode, className?: string}) {
    return (
        <div className={cn("relative flex flex-col justify-start items-center overflow-hidden gap-4 p-4 h-[420px] col-span-2 row-span-2 bg-linear-to-br from-white/5 to-primary rounded-xl ring ring-white/5 shadow-lg", className)}>
            {children}
        </div>
    )
}
