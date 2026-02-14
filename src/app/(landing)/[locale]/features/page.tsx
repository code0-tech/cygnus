import { LandingContainer } from "@/components/ui/LandingContainer"
import { isSupportedLocale } from "@/utils/i18n"
import { notFound } from "next/navigation"

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    return (
        <LandingContainer className="py-[18vh] gap-8">
            <section className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Features</p>
                <h1 className="mt-3 text-4xl md:text-6xl font-semibold text-white/90 leading-tight">
                    Alles, was ihr fuer produktive Teams braucht.
                </h1>
                <p className="mt-4 text-white/65 text-lg">
                    Von strukturierten Workflows bis zu smarten Integrationen. Alle Funktionen in einer
                    klaren Uebersicht.
                </p>
            </section>
        </LandingContainer>
    )
}
