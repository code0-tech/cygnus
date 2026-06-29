import Link from "next/link"
import type { ComponentProps } from "react"

type FilledButtonLinkProps = ComponentProps<typeof Link>

export function FilledButtonLink({ className, ...props }: FilledButtonLinkProps) {
    return (
        <Link
            className={[
                "relative box-border flex h-fit w-fit cursor-pointer items-center justify-center gap-2 rounded-[0.8rem] border-0",
                "bg-[#191825] px-3 py-2 text-sm text-white shadow-none",
                "hover:bg-[#23212e] focus:bg-[#2c2a36] focus:outline-none active:bg-[#2c2a36]",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        />
    )
}
