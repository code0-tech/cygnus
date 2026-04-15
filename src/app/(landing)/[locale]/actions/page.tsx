import { ActionCard } from "@/components/cards/ActionCard"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getActions } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function ActionsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const actions = await getActions(locale)

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="h-32" aria-hidden="true" />
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Actions
                    </h1>
                    <div className="grid gap-4 md:grid-cols-2">
                        {actions.map((action) => <ActionCard key={action.id} action={action} />)}
                    </div>
                </div>
            </LandingContainer>
        </>
    )
}
