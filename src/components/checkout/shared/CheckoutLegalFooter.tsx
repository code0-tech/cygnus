import { HapticLink } from "@/components/ui/HapticLink"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { Footer } from "@/payload-types"

interface CheckoutLegalFooterProps {
    className?: string
    footer: Footer | null
    locale: AppLocale
    currentYear: number
}

export function CheckoutLegalFooter({ className, footer, locale, currentYear }: CheckoutLegalFooterProps) {
    if (!footer) return null

    const legalLinks = [
        footer.legalLinks?.privacy?.url && footer.legalLinks?.privacy?.label ? { label: footer.legalLinks.privacy.label, url: footer.legalLinks.privacy.url } : null,
        footer.legalLinks?.legalNotice?.url && footer.legalLinks?.legalNotice?.label ? { label: footer.legalLinks.legalNotice.label, url: footer.legalLinks.legalNotice.url } : null,
        footer.legalLinks?.terms?.url && footer.legalLinks?.terms?.label ? { label: footer.legalLinks.terms.label, url: footer.legalLinks.terms.url } : null,
    ].filter((link): link is { label: string; url: string } => Boolean(link))

    return (
        <div className={cn("flex flex-wrap gap-6 text-xs text-tertiary", className)}>
            <p>
                © {currentYear} {footer.company_name}
            </p>
            {legalLinks.map((link) => (
                <HapticLink key={link.url} href={localizeHref(link.url, locale)}>
                    <span className="hover:text-white hover:underline underline-offset-2">{link.label}</span>
                </HapticLink>
            ))}
        </div>
    )
}
