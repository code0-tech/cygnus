import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "h-10 px-4 py-1 text-md bg-white/90 hover:bg-white text-primary ring-2 ring-white/35 shadow-xl",
                ghost:
                    "h-10 px-4 py-1 text-md bg-secondary text-white/70 hover:text-white ring-2 ring-white/5 shadow-xl",
                link:
                    "h-auto px-0 py-0 text-sm text-gray-500 border-b border-dashed border-white/25 hover:text-brand hover:border-brand rounded-none",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, type = "button", ...props }, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(buttonVariants({ variant }), className)}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
