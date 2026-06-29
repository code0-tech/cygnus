"use client"

import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n"
import { FilledButtonLink } from "@/components/ui/FilledButtonLink"
import { IconArrowBackUp } from "@tabler/icons-react"
import { useParams } from "next/navigation"

export default function LocalizedNotFound() {
    const params = useParams<{ locale?: string }>()
    const rawLocale = params?.locale
    const locale = rawLocale && isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE

    return (
        <section className="h-dvh flex flex-col items-center justify-center bg-primary px-4 text-center text-white">
            <div className="mb-8 rounded-4xl border-2 border-dashed border-error/50 bg-error/10 p-6">
                <svg id="a" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="var(--color-error)">
                    <path d="M11.996,10.545c.739,0,1.272-.213,1.6-.64.329-.427.493-.985.493-1.674v-3.718c0-.706.09-1.333.271-1.884.18-.549.48-1.013.898-1.391s.977-.665,1.674-.862c.697-.197,1.563-.295,2.598-.295h.492v2.93h-.615c-.739,0-1.235.164-1.49.493-.255.328-.382.837-.382,1.526v3.274c0,.854-.115,1.576-.345,2.167s-.689,1.1-1.378,1.526c.689.427,1.148.936,1.378,1.526.23.591.345,1.313.345,2.167v3.274c0,.689.127,1.198.382,1.527.254.328.751.492,1.49.492h.615v2.93h-.492c-1.034,0-1.9-.099-2.598-.296-.698-.197-1.256-.484-1.674-.861-.418-.378-.718-.842-.898-1.391-.181-.55-.271-1.178-.271-1.884v-3.718c0-.689-.164-1.247-.493-1.674-.328-.427-.861-.64-1.6-.64v-2.905Z" />
                    <path d="M12.002,13.451c-.739,0-1.272.213-1.601.64-.329.427-.492.985-.492,1.674v3.718c0,.706-.091,1.333-.271,1.884-.181.549-.48,1.013-.899,1.391-.418.377-.977.665-1.674.861-.698.197-1.563.296-2.598.296h-.493v-2.93h.616c.739,0,1.235-.164,1.49-.492.254-.329.381-.837.381-1.527v-3.274c0-.854.115-1.576.345-2.167.229-.591.689-1.099,1.379-1.526-.689-.427-1.149-.936-1.379-1.526-.23-.591-.345-1.313-.345-2.167v-3.274c0-.689-.127-1.198-.381-1.526-.255-.329-.751-.493-1.49-.493h-.616V.082h.493c1.034,0,1.899.098,2.598.295.697.197,1.255.484,1.674.862.419.377.718.841.899,1.391.18.55.271,1.178.271,1.884v3.718c0,.689.164,1.248.492,1.674.328.427.862.64,1.601.64v2.905Z" />
                </svg>
            </div>
            <h1 className="mb-2 font-mono text-5xl font-bold tracking-tighter">404 Not Found</h1>
            <p className="mb-4 text-secondary">The page you are looking for does not exist.</p>
            <FilledButtonLink href={`/${locale}`}>
                <IconArrowBackUp size={16} className="-mt-0.5 text-tertiary" />
                Go back
            </FilledButtonLink>
        </section>
    )
}
