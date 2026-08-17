import { cn } from "@/lib/utils"
import { IconLoader } from "@tabler/icons-react"
import type { ComponentProps } from "react"

type LoaderProps = ComponentProps<typeof IconLoader> & {
    loading?: boolean
}

interface ButtonLoaderProps {
    label?: string
}

function Loader({ className, loading = true, stroke = 2, ...props }: LoaderProps) {
    if (!loading) return null

    return <IconLoader role="status" aria-label="Loading" stroke={stroke} className={cn("animate-spin motion-reduce:animate-none", className)} {...props} />
}

export function ButtonLoader({ label }: ButtonLoaderProps) {
    return (
        <span className="inline-flex min-w-5 items-center justify-center gap-2">
            <Loader aria-hidden="true" size={16} />
            <span>{label}</span>
        </span>
    )
}
