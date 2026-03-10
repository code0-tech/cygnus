import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { IconTriangle } from "@tabler/icons-react"

interface RuntimeTypesCardProps {
    locale: AppLocale
}

export async function RuntimeTypesCard({ locale }: RuntimeTypesCardProps) {
    const content = await getFeatureBySlug("runtime-types", locale)

    return (
        <FeatureCard className="col-span-1 row-span-4" tone="brand">

            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-lg">
                <div className="w-64 flex items-center justify-center gap-2 px-4 py-1 rounded-full text-pink bg-linear-to-br from-pink/10 to-pink/40 ring ring-pink/40 shadow-md">
                    <IconTriangle size={12} className="fill-pink rotate-90"/>
                    Dynamic Runtime
                </div>
                <div className="w-64 flex items-center justify-center gap-2 px-4 py-1 rounded-full text-blue bg-linear-to-br from-blue/10 to-blue/40 ring ring-blue/40 shadow-md">
                    <IconTriangle size={12} className="fill-blue rotate-90"/>
                    Static Runtime
                </div>
                <div className="w-64 flex items-center justify-center gap-2 px-4 py-1 rounded-full text-yellow bg-linear-to-br from-yellow/10 to-yellow/40 ring ring-yellow/40 shadow-md">
                    <IconTriangle size={12} className="fill-yellow rotate-90"/>
                    Compiled Runtime
                </div>
                <div className="w-64 flex items-center justify-center gap-2 px-4 py-1 rounded-full text-aqua bg-linear-to-br from-aqua/10 to-aqua/50 ring ring-aqua/40 shadow-md">
                    <IconTriangle size={12} className="fill-aqua rotate-90"/>
                    Interpreted Runtime
                </div>
            </div>


            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
