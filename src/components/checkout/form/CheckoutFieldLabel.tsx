import type { ReactNode } from "react"

export function CheckoutFieldLabel({ children, htmlFor, id }: { children: ReactNode; htmlFor?: string; id?: string }) {
    return (
        <label htmlFor={htmlFor} id={id} className="mb-1.75 block text-xs leading-4 font-normal text-white/60">
            {children}
        </label>
    )
}
