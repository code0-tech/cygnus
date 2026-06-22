import type { Media } from "@/payload-types"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoItemProps {
    logo: number | Media
    className?: string
    sizes?: string
}

export function LogoItem({ logo: logoValue, className, sizes = "(min-width: 768px) 20vw, 40vw" }: LogoItemProps) {
    const href = (logoValue as Media & { href?: string | null }).href
    const logo = logoValue as Media
    const logoUrl = getMediaUrl(logo.url)

    const image = <Image src={logoUrl} alt={logo.alt} fill unoptimized className="object-contain brightness-0 invert" sizes={sizes} />

    return (
        <div className={cn("relative h-14", className)}>
            {href ? (
                <a href={href} className="relative block h-full w-full">
                    {image}
                </a>
            ) : (
                image
            )}
        </div>
    )
}
