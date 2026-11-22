import { cn } from "@/lib/utils"
import { IconPhoto } from "@tabler/icons-react"

export function ImagePlaceholder({ className, iconSize = 32 }: { className?: string; iconSize?: number }) {
    return (
        <div aria-hidden="true" className={cn("image-placeholder", className)}>
            <IconPhoto size={iconSize} stroke={1.5} className="text-white/20" />
        </div>
    )
}
